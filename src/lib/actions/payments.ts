"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/supabase/db";
import type { Payment } from "@/lib/types/database";

export async function createPayment(
    orderId: string,
    method: string,
    amount: number
): Promise<{ payment?: Payment; error?: string }> {
    const supabase = await getDb();

    // Validate amount
    if (amount <= 0) {
        return { error: "Payment amount must be greater than zero" };
    }
    if (amount > 1000000) {
        return { error: "Payment amount exceeds maximum allowed value" };
    }

    // Fetch order to validate
    const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("total, status")
        .eq("id", orderId)
        .single();

    if (orderError) {
        return { error: "Order not found" };
    }

    // Validate amount matches order total
    if (amount !== order.total) {
        return {
            error: `Payment amount (₹${amount}) must match order total (₹${order.total})`
        };
    }

    // Validate order not already paid
    if (order.status === "paid" || order.status === "completed") {
        return { error: "Order already paid" };
    }

    const { data, error } = await supabase
        .from("payments")
        .insert({
            order_id: orderId,
            method,
            amount,
            status: "pending",
        })
        .select()
        .single();

    if (error) return { error: error.message };

    revalidatePath("/pos");
    revalidatePath("/customer");
    return { payment: data };
}

export async function confirmPayment(paymentId: string, orderId: string): Promise<{ error?: string }> {
    const supabase = await getDb();

    // Use atomic function to ensure payment and order are updated together
    const { data: result, error: rpcError } = await supabase
        .rpc('confirm_payment_atomic', {
            p_payment_id: paymentId,
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
    revalidatePath("/customer");
    return {};
}

export async function cancelPayment(paymentId: string): Promise<{ error?: string }> {
    const supabase = await getDb();

    const { error } = await supabase
        .from("payments")
        .delete()
        .eq("id", paymentId)
        .eq("status", "pending");

    if (error) return { error: error.message };

    revalidatePath("/pos");
    revalidatePath("/customer");
    return {};
}

export async function getPaymentByOrder(orderId: string): Promise<Payment | null> {
    const supabase = await getDb();

    const { data } = await supabase
        .from("payments")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

    return data;
}

// Mark completed order as paid/archived (called from kitchen when order is picked up)
export async function archiveOrder(orderId: string): Promise<{ error?: string }> {
    const supabase = await getDb();

    const { error } = await supabase
        .from("orders")
        .update({ status: "paid" })
        .eq("id", orderId)
        .eq("status", "completed"); // Only archive completed orders

    if (error) return { error: error.message };

    revalidatePath("/kitchen");
    revalidatePath("/customer");
    return {};
}

// Get pending payment for an order (used by customer display)
export async function getPendingPayment(orderId: string): Promise<Payment | null> {
    const supabase = await getDb();

    const { data } = await supabase
        .from("payments")
        .select("*")
        .eq("order_id", orderId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

    return data;
}
