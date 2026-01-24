"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Payment } from "@/lib/types/database";

export async function createPayment(
    orderId: string,
    method: string,
    amount: number
): Promise<{ payment?: Payment; error?: string }> {
    const supabase = await createClient();

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

    return { payment: data };
}

export async function confirmPayment(paymentId: string, orderId: string): Promise<{ error?: string }> {
    const supabase = await createClient();

    // Update payment status
    const { error: paymentError } = await supabase
        .from("payments")
        .update({ status: "completed" })
        .eq("id", paymentId);

    if (paymentError) return { error: paymentError.message };

    // Fetch current order to decide next status
    const { data: order, error: fetchError } = await supabase
        .from("orders")
        .select("status")
        .eq("id", orderId)
        .single();

    if (fetchError) return { error: fetchError.message };

    // Logic:
    // - If 'open' -> 'sent' (Auto-send to kitchen)
    // - If 'completed' -> 'paid' (Close order)
    // - If 'sent'/'preparing' -> Keep as is (Kitchen is working on it)
    let newStatus = null;
    if (order.status === "open") newStatus = "sent";
    else if (order.status === "completed") newStatus = "paid";

    if (newStatus) {
        const { error: orderError } = await supabase
            .from("orders")
            .update({ status: newStatus })
            .eq("id", orderId);

        if (orderError) return { error: orderError.message };
    }

    revalidatePath("/pos");
    revalidatePath("/kitchen");
    revalidatePath("/customer");
    return {};
}

export async function getPaymentByOrder(orderId: string): Promise<Payment | null> {
    const supabase = await createClient();

    const { data } = await supabase
        .from("payments")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

    return data;
}
