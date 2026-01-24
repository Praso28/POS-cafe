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

    // Update order status to paid
    const { error: orderError } = await supabase
        .from("orders")
        .update({ status: "paid" })
        .eq("id", orderId);

    if (orderError) return { error: orderError.message };

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
