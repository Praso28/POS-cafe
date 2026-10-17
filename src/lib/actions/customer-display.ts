"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/supabase/db";
import type { CustomerDisplaySession } from "@/lib/types/database";

export async function getDisplaySession(terminalId: string): Promise<CustomerDisplaySession | null> {
    const supabase = await getDb();

    const { data, error } = await supabase
        .from("customer_display_sessions")
        .select("*")
        .eq("terminal_id", terminalId)
        .single();

    if (error) return null;
    return data;
}

export async function createOrUpdateDisplaySession(
    terminalId: string,
    orderId: string | null,
    displayMode: "order" | "welcome" | "thankyou" | "idle" = "order"
): Promise<{ session?: CustomerDisplaySession; error?: string }> {
    const supabase = await getDb();

    // Try to upsert the display session
    const { data, error } = await supabase
        .from("customer_display_sessions")
        .upsert({
            terminal_id: terminalId,
            current_order_id: orderId,
            display_mode: displayMode,
            last_activity_at: new Date().toISOString(),
        }, {
            onConflict: "terminal_id"
        })
        .select()
        .single();

    if (error) return { error: error.message };

    return { session: data };
}

export async function setDisplayOrder(
    terminalId: string,
    orderId: string
): Promise<{ error?: string }> {
    const result = await createOrUpdateDisplaySession(terminalId, orderId, "order");
    if (result.error) return { error: result.error };

    revalidatePath("/counter");
    return {};
}

export async function setDisplayIdle(terminalId: string): Promise<{ error?: string }> {
    const result = await createOrUpdateDisplaySession(terminalId, null, "idle");
    if (result.error) return { error: result.error };

    revalidatePath("/counter");
    return {};
}

export async function setDisplayThankYou(terminalId: string): Promise<{ error?: string }> {
    const supabase = await getDb();

    const { error } = await supabase
        .from("customer_display_sessions")
        .update({
            display_mode: "thankyou",
            last_activity_at: new Date().toISOString(),
        })
        .eq("terminal_id", terminalId);

    if (error) return { error: error.message };

    revalidatePath("/counter");
    return {};
}

export async function getAllDisplaySessions(): Promise<CustomerDisplaySession[]> {
    const supabase = await getDb();

    const { data, error } = await supabase
        .from("customer_display_sessions")
        .select("*, pos_terminals(*)")
        .order("last_activity_at", { ascending: false });

    if (error) return [];
    return data || [];
}
