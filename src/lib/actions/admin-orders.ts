"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { OrderWithItems, Payment } from "@/lib/types/database";

export async function getAllOrders(): Promise<OrderWithItems[]> {
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
        .order("created_at", { ascending: false });

    return (data as OrderWithItems[]) || [];
}

export async function archiveOrder(orderId: string): Promise<{ error?: string }> {
    const supabase = await createClient();

    const { error } = await (supabase
        .from("orders") as any)
        .update({ status: "paid" }) // Using 'paid' as archived status
        .eq("id", orderId);

    if (error) return { error: error.message };

    revalidatePath("/admin/orders");
    return {};
}

export async function deleteOrder(orderId: string): Promise<{ error?: string }> {
    const supabase = await createClient();

    // First delete order items
    await supabase.from("order_items").delete().eq("order_id", orderId);

    // Then delete the order
    const { error } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderId);

    if (error) return { error: error.message };

    revalidatePath("/admin/orders");
    return {};
}

export async function bulkArchiveOrders(orderIds: string[]): Promise<{ error?: string }> {
    const supabase = await createClient();

    const { error } = await (supabase
        .from("orders") as any)
        .update({ status: "paid" })
        .in("id", orderIds);

    if (error) return { error: error.message };

    revalidatePath("/admin/orders");
    return {};
}

export async function bulkDeleteOrders(orderIds: string[]): Promise<{ error?: string }> {
    const supabase = await createClient();

    // Delete order items first
    await supabase.from("order_items").delete().in("order_id", orderIds);

    // Delete orders
    const { error } = await supabase
        .from("orders")
        .delete()
        .in("id", orderIds);

    if (error) return { error: error.message };

    revalidatePath("/admin/orders");
    return {};
}

export async function getAllPaymentsGrouped(): Promise<{
    method: string;
    payments: { id: string; date: string; amount: number }[];
    total: number;
}[]> {
    const supabase = await createClient();

    const { data } = await supabase
        .from("payments")
        .select("*")
        .eq("status", "completed")
        .order("created_at", { ascending: false });

    if (!data) return [];

    // Group by payment method
    const grouped: Record<string, { id: string; date: string; amount: number }[]> = {};
    const payments = data as Payment[];

    for (const payment of payments) {
        if (!grouped[payment.method]) {
            grouped[payment.method] = [];
        }
        grouped[payment.method].push({
            id: payment.id,
            date: payment.created_at,
            amount: payment.amount,
        });
    }

    return Object.entries(grouped).map(([method, payments]) => ({
        method,
        payments,
        total: payments.reduce((sum, p) => sum + p.amount, 0),
    }));
}
