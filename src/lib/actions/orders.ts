"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Order, OrderItem, OrderWithItems } from "@/lib/types/database";

export async function createOrder(tableId: string, sessionId: string): Promise<{ order?: Order; error?: string }> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("orders")
        .insert({
            table_id: tableId,
            session_id: sessionId,
            status: "open",
            total: 0,
        })
        .select()
        .single();

    if (error) return { error: error.message };

    revalidatePath("/pos");
    return { order: data };
}

export async function getOpenOrderForTable(tableId: string): Promise<Order | null> {
    const supabase = await createClient();

    const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("table_id", tableId)
        .eq("status", "open")
        .single();

    return data;
}

export async function getOrderWithItems(orderId: string): Promise<OrderWithItems | null> {
    const supabase = await createClient();

    const { data } = await supabase
        .from("orders")
        .select(`
      *,
      tables (*),
      order_items (
        *,
        products (*)
      )
    `)
        .eq("id", orderId)
        .single();

    return data as OrderWithItems | null;
}

export async function addOrderItem(
    orderId: string,
    productId: string,
    price: number
): Promise<{ error?: string }> {
    const supabase = await createClient();

    // Check if item already exists
    const { data: existingItem } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId)
        .eq("product_id", productId)
        .single();

    if (existingItem) {
        // Increment quantity
        const { error } = await supabase
            .from("order_items")
            .update({ qty: existingItem.qty + 1 })
            .eq("id", existingItem.id);

        if (error) return { error: error.message };
    } else {
        // Create new item
        const { error } = await supabase.from("order_items").insert({
            order_id: orderId,
            product_id: productId,
            qty: 1,
            price,
        });

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
    const supabase = await createClient();

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
    const supabase = await createClient();

    const { error } = await supabase.from("order_items").delete().eq("id", itemId);
    if (error) return { error: error.message };

    await updateOrderTotal(orderId);

    revalidatePath("/pos");
    return {};
}

async function updateOrderTotal(orderId: string) {
    const supabase = await createClient();

    const { data: items } = await supabase
        .from("order_items")
        .select("qty, price")
        .eq("order_id", orderId);

    const total = items?.reduce((sum, item) => sum + item.qty * item.price, 0) || 0;

    await supabase.from("orders").update({ total }).eq("id", orderId);
}

export async function sendToKitchen(orderId: string): Promise<{ error?: string }> {
    const supabase = await createClient();

    const { error } = await supabase
        .from("orders")
        .update({ status: "sent" })
        .eq("id", orderId);

    if (error) return { error: error.message };

    revalidatePath("/pos");
    revalidatePath("/kitchen");
    return {};
}

export async function updateOrderStatus(
    orderId: string,
    status: "open" | "sent" | "preparing" | "completed" | "paid"
): Promise<{ error?: string }> {
    const supabase = await createClient();

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
    const supabase = await createClient();

    const { data } = await supabase
        .from("orders")
        .select(`
      *,
      tables (*),
      order_items (
        *,
        products (*)
      )
    `)
        .in("status", ["sent", "preparing", "completed"])
        .order("created_at", { ascending: true });

        console.log("fetched data from orders table",data);

    return (data as OrderWithItems[]) || [];
    
}

export async function getOrdersForReports(filters?: {
    startDate?: string;
    endDate?: string;
    sessionId?: string;
}): Promise<OrderWithItems[]> {
    const supabase = await createClient();

    let query = supabase
        .from("orders")
        .select(`
      *,
      tables (*),
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
