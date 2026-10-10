"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/supabase/db";
import type { PaymentMethod } from "@/lib/types/database";

export async function getPaymentMethods(): Promise<PaymentMethod[]> {
    const supabase = await getDb();
    const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .order("type", { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
}

export async function updatePaymentMethod(id: string, formData: FormData) {
    const supabase = await getDb();

    const enabled = formData.get("enabled") === "true";
    const upi_id = formData.get("upi_id") as string | null;

    const updateData: { enabled: boolean; upi_id?: string | null } = { enabled };
    if (upi_id !== null) {
        updateData.upi_id = upi_id || null;
    }

    const { error } = await supabase
        .from("payment_methods")
        .update(updateData)
        .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/admin/payments");
    return { success: true };
}

export async function togglePaymentMethodEnabled(id: string, enabled: boolean) {
    const supabase = await getDb();

    const { error } = await supabase
        .from("payment_methods")
        .update({ enabled })
        .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/admin/payments");
    return { success: true };
}

export async function getEnabledPaymentMethods(): Promise<PaymentMethod[]> {
    const supabase = await getDb();
    const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("enabled", true)
        .order("type", { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
}
