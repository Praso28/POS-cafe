"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/supabase/db";
import type { Order, OrderItem, OrderWithItems, OrderType } from "@/lib/types/database";

export async function createOrder(
    tableId: string,
    sessionId: string,
    orderType: OrderType = "dine-in",
    customerName?: string,
    customerPhone?: string,
    notes?: string
): Promise<{ order?: Order; error?: string }> {
    const supabase = await getDb();

    // Use atomic function to prevent race conditions
    const { data: result, error: rpcError } = await supabase
        .rpc('create_order_atomic', {
            p_session_id: sessionId,
            p_table_id: tableId,
            p_order_type: orderType
        });

    if (rpcError) {
        return { error: rpcError.message };
    }

    // Check if the function returned an error
    if (result && typeof result === 'object' && 'error' in result) {
        return { error: result.error as string };
    }

    // Get the created order ID
    const orderId = result && typeof result === 'object' && 'id' in result
        ? result.id as string
        : null;

    if (!orderId) {
        return { error: 'Failed to create order' };
    }

    // Update customer details if provided
    if (customerName || customerPhone || notes) {
        await supabase
            .from("orders")
            .update({
                customer_name: customerName || null,
                customer_phone: customerPhone || null,
                notes: notes || null,
            })
            .eq("id", orderId);
    }

    // Fetch the created order
    const { data: order, error: fetchError } = await supabase
        .from("orders")
        .select()
        .eq("id", orderId)
        .single();

    if (fetchError) {
        return { error: fetchError.message };
    }

    revalidatePath("/pos");
    return { order: order as Order };
}

export async function getOpenOrderForTable(tableId: string): Promise<Order | null> {
    const supabase = await getDb();

    const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("table_id", tableId)
        .eq("status", "open")
        .single();

    return data;
}

export async function getOrderWithItems(orderId: string): Promise<OrderWithItems | null> {
    const supabase = await getDb();

    const { data, error } = await supabase
        .from("orders")
        .select(`
      *,
    tables:tables!orders_table_id_fkey(*),
      order_items (
        *,
        products (*)
      )
    `)
        .eq("id", orderId)
        .single();

    if (error) {
        console.error("getOrderWithItems failed:", error.message);
        return null;
    }

    return data as OrderWithItems | null;
}

export async function getOrderBare(
    orderId: string
): Promise<{ order: Order | null; items: OrderItem[]; error?: string }> {
    const supabase = await getDb();

    const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

    if (orderError) {
        return { order: null, items: [], error: orderError.message };
    }

    const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);

    if (itemsError) {
        return { order: order as Order, items: [], error: itemsError.message };
    }

    return { order: order as Order, items: (items as OrderItem[]) || [] };
}

export async function addOrderItem(
    orderId: string,
    productId: string,
    price: number,
    variantId?: string | null,
    variantLabel?: string | null,
    quantity: number = 1
): Promise<{ error?: string }> {
    const supabase = await getDb();

    // Validate quantity
    if (quantity < 1) {
        return { error: "Quantity must be at least 1" };
    }
    if (quantity > 100) {
        return { error: "Maximum quantity per item is 100" };
    }
    if (!Number.isInteger(quantity)) {
        return { error: "Quantity must be a whole number" };
    }

    // Validate price
    if (price <= 0) {
        return { error: "Price must be greater than zero" };
    }
    if (price > 100000) {
        return { error: "Price exceeds maximum allowed value" };
    }

    // Check if item already exists (with same variant)
    let query = supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId)
        .eq("product_id", productId);

    // Match variant_id (null or specific value)
    if (variantId) {
        query = query.eq("variant_id", variantId);
    } else {
        query = query.is("variant_id", null);
    }

    const { data: existingItem } = await query.single();

    if (existingItem) {
        // Increment quantity by the specified amount
        const { error } = await supabase
            .from("order_items")
            .update({ qty: existingItem.qty + quantity })
            .eq("id", existingItem.id);

        if (error) return { error: error.message };
    } else {
        // Create new item with specified quantity
        let { error } = await supabase.from("order_items").insert({
            order_id: orderId,
            product_id: productId,
            qty: quantity,
            price,
            variant_id: variantId || null,
            variant_label: variantLabel || null,
        });

        if (error) {
            const message = error.message || "";
            const missingVariantColumns =
                message.includes("column") &&
                (message.includes("variant_id") || message.includes("variant_label"));

            if (missingVariantColumns) {
                const fallback = await supabase.from("order_items").insert({
                    order_id: orderId,
                    product_id: productId,
                    qty: quantity,
                    price,
                });
                error = fallback.error;
            }
        }

        if (error) return { error: error.message };
    }

    // Update order total
    await updateOrderTotal(orderId);

    revalidatePath("/pos");
    return {};
}

export async function updateItemQuantity(
    itemId: string,
    orderId: string,
    qty: number
): Promise<{ error?: string }> {
    const supabase = await getDb();

    if (qty <= 0) {
        const { error } = await supabase.from("order_items").delete().eq("id", itemId);
        if (error) return { error: error.message };
    } else {
        const { error } = await supabase
            .from("order_items")
            .update({ qty })
            .eq("id", itemId);
        if (error) return { error: error.message };
    }

    await updateOrderTotal(orderId);

    revalidatePath("/pos");
    return {};
}

export async function removeOrderItem(itemId: string, orderId: string): Promise<{ error?: string }> {
    const supabase = await getDb();

    const { error } = await supabase.from("order_items").delete().eq("id", itemId);
    if (error) return { error: error.message };

    await updateOrderTotal(orderId);

    revalidatePath("/pos");
    return {};
}

async function updateOrderTotal(orderId: string) {
    const supabase = await getDb();

    const { data: items } = await supabase
        .from("order_items")
        .select("qty, price")
        .eq("order_id", orderId);

    const total = items?.reduce((sum: number, item: { qty: number; price: number }) => sum + item.qty * item.price, 0) || 0;

    await supabase.from("orders").update({ total }).eq("id", orderId);
}

export async function sendToKitchen(orderId: string): Promise<{ error?: string }> {
    const supabase = await getDb();

    // Allow sending orders to kitchen before or after payment
    // Flow: open -> sent (to kitchen) -> preparing -> (payment) -> paid -> completed
    const { error } = await supabase
        .from("orders")
        .update({
            status: "sent",
            sent_to_kitchen_at: new Date().toISOString()
        })
        .eq("id", orderId)
        .in("status", ["open", "paid"]); // Allow both unpaid and paid orders

    if (error) return { error: error.message };

    revalidatePath("/pos");
    revalidatePath("/kitchen");
    return {};
}

export async function updateOrderStatus(
    orderId: string,
    status: "open" | "sent" | "preparing" | "completed" | "paid"
): Promise<{ error?: string }> {
    const supabase = await getDb();

    const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", orderId);

    if (error) return { error: error.message };

    revalidatePath("/pos");
    revalidatePath("/kitchen");
    return {};
}

export async function getKitchenOrders(): Promise<OrderWithItems[]> {
    const supabase = await getDb();

    const { data } = await supabase
        .from("orders")
        .select(`
      *,
    tables:tables!orders_table_id_fkey(*),
      order_items (
        *,
        products (*)
      )
    `)
        .in("status", ["sent", "preparing", "completed"])
        .order("created_at", { ascending: true });

    return (data as OrderWithItems[]) || [];
    
}

export async function getOrdersForReports(filters?: {
    startDate?: string;
    endDate?: string;
    sessionId?: string;
}): Promise<OrderWithItems[]> {
    const supabase = await getDb();

    let query = supabase
        .from("orders")
        .select(`
      *,
    tables:tables!orders_table_id_fkey(*),
      order_items (
        *,
        products (*)
      )
    `)
        .order("created_at", { ascending: false });

    if (filters?.startDate) {
        query = query.gte("created_at", filters.startDate);
    }
    if (filters?.endDate) {
        query = query.lte("created_at", filters.endDate);
    }
    if (filters?.sessionId) {
        query = query.eq("session_id", filters.sessionId);
    }

    const { data } = await query;

    return (data as OrderWithItems[]) || [];
}

export async function toggleItemPrepared(
    itemId: string,
    prepared: boolean
): Promise<{ error?: string }> {
    const supabase = await getDb();

    const { error } = await supabase
        .from("order_items")
        .update({ 
            prepared, 
            prepared_at: prepared ? new Date().toISOString() : null 
        })
        .eq("id", itemId);

    if (error) return { error: error.message };

    revalidatePath("/kitchen");
    return {};
}

export async function checkAllItemsPrepared(orderId: string): Promise<boolean> {
    const supabase = await getDb();

    const { data: items } = await supabase
        .from("order_items")
        .select("prepared")
        .eq("order_id", orderId);

    if (!items || items.length === 0) return false;
    return items.every((item: { prepared: boolean }) => item.prepared);
}

// Cancel and delete an order, releasing the table
export async function cancelOrder(orderId: string): Promise<{ error?: string }> {
    const supabase = await getDb();

    // Get the order to find the table
    const { data: order } = await supabase
        .from("orders")
        .select("table_id")
        .eq("id", orderId)
        .single();

    if (!order) return { error: "Order not found" };

    // Delete all order items first
    await supabase.from("order_items").delete().eq("order_id", orderId);

    // Delete the order
    const { error } = await supabase.from("orders").delete().eq("id", orderId);
    if (error) return { error: error.message };

    // Release the table
    await supabase
        .from("tables")
        .update({
            status: "available",
            current_order_id: null,
            occupied_at: null,
        })
        .eq("id", order.table_id)
        .eq("current_order_id", orderId);

    revalidatePath("/pos");
    revalidatePath("/admin/tables");
    return {};
}

// Clean up empty orders older than specified hours
export async function cleanupEmptyOrders(olderThanHours: number = 1): Promise<{ deletedCount: number; error?: string }> {
    const supabase = await getDb();

    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - olderThanHours);

    // Find empty orders
    const { data: emptyOrders } = await supabase
        .from("orders")
        .select("id, table_id")
        .eq("status", "open")
        .lt("created_at", cutoffTime.toISOString());

    if (!emptyOrders || emptyOrders.length === 0) {
        return { deletedCount: 0 };
    }

    // Filter to only truly empty orders (no items)
    const ordersToDelete: string[] = [];
    const tablesToRelease: string[] = [];

    for (const order of emptyOrders) {
        const { data: items } = await supabase
            .from("order_items")
            .select("id")
            .eq("order_id", order.id)
            .limit(1);

        if (!items || items.length === 0) {
            ordersToDelete.push(order.id);
            tablesToRelease.push(order.table_id);
        }
    }

    if (ordersToDelete.length === 0) {
        return { deletedCount: 0 };
    }

    // Delete the empty orders
    const { error } = await supabase
        .from("orders")
        .delete()
        .in("id", ordersToDelete);

    if (error) return { deletedCount: 0, error: error.message };

    // Release associated tables
    for (const tableId of tablesToRelease) {
        await supabase
            .from("tables")
            .update({
                status: "available",
                current_order_id: null,
                occupied_at: null,
            })
            .eq("id", tableId)
            .in("current_order_id", ordersToDelete);
    }

    revalidatePath("/pos");
    return { deletedCount: ordersToDelete.length };
}

// Complete an order and release the table
export async function completeOrder(orderId: string): Promise<{ error?: string }> {
    const supabase = await getDb();

    // Use atomic function to ensure order completion and table release happen together
    const { data: result, error: rpcError } = await supabase
        .rpc('complete_order_atomic', {
            p_order_id: orderId
        });

    if (rpcError) {
        return { error: rpcError.message };
    }

    // Check if the function returned an error
    if (result && typeof result === 'object' && 'error' in result) {
        return { error: result.error as string };
    }

    revalidatePath("/pos");
    revalidatePath("/kitchen");
    revalidatePath("/admin/tables");
    return {};
}

// Get order by ID with all details
export async function getOrderById(orderId: string): Promise<OrderWithItems | null> {
    const supabase = await getDb();

    const { data } = await supabase
        .from("orders")
        .select(`
            *,
            tables:tables!orders_table_id_fkey(*),
            order_items (
                *,
                products (*)
            )
        `)
        .eq("id", orderId)
        .single();

    return data as OrderWithItems | null;
}

// Update order type
export async function updateOrderType(
    orderId: string,
    orderType: "dine-in" | "takeaway" | "delivery" | "pickup" | "drive-thru"
): Promise<{ error?: string }> {
    const supabase = await getDb();

    const { error } = await supabase
        .from("orders")
        .update({ order_type: orderType })
        .eq("id", orderId);

    if (error) return { error: error.message };

    revalidatePath("/pos");
    return {};
}

// Update customer details on order
export async function updateOrderCustomer(
    orderId: string,
    customerName?: string,
    customerPhone?: string,
    notes?: string
): Promise<{ error?: string }> {
    const supabase = await getDb();

    const { error } = await supabase
        .from("orders")
        .update({
            customer_name: customerName || null,
            customer_phone: customerPhone || null,
            notes: notes || null,
        })
        .eq("id", orderId);

    if (error) return { error: error.message };

    revalidatePath("/pos");
    return {};
}
