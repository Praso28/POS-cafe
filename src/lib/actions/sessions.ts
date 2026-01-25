"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { PosSession } from "@/lib/types/database";

export async function getActiveSession(): Promise<PosSession | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data } = await supabase
        .from("pos_sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "open")
        .single();

    return data;
}

export async function openSession(): Promise<{ session?: PosSession; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Not authenticated" };

    // Check if there's already an open session
    const existing = await getActiveSession();
    if (existing) return { session: existing };

    const { data, error } = await supabase
        .from("pos_sessions")
        .insert({
            user_id: user.id,
            status: "open",
        })
        .select()
        .single();

    if (error) return { error: error.message };

    revalidatePath("/pos");
    return { session: data };
}

export async function closeSession(sessionId: string): Promise<{ error?: string }> {
    const supabase = await createClient();

    const { error } = await supabase
        .from("pos_sessions")
        .update({
            status: "closed",
            closed_at: new Date().toISOString(),
        })
        .eq("id", sessionId);

    if (error) return { error: error.message };

    revalidatePath("/pos");
    return {};
}

export async function getLastSessionSales(): Promise<{
    lastOpenDate: string | null;
    totalSales: number;
}> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { lastOpenDate: null, totalSales: 0 };

    // Get the last closed session for this user
    const { data: lastSession } = await supabase
        .from("pos_sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "closed")
        .order("closed_at", { ascending: false })
        .limit(1)
        .single();

    if (!lastSession) {
        return { lastOpenDate: null, totalSales: 0 };
    }

    const session = lastSession as PosSession;

    // Get all orders for this session (regardless of status)
    const { data: orders } = await supabase
        .from("orders")
        .select("id, total")
        .eq("session_id", session.id);

    if (!orders || orders.length === 0) {
        return { lastOpenDate: session.opened_at, totalSales: 0 };
    }

    // Get completed payments for these orders
    const orderIds = (orders as { id: string; total: number }[]).map(o => o.id);
    const { data: payments } = await supabase
        .from("payments")
        .select("order_id, amount")
        .eq("status", "completed")
        .in("order_id", orderIds);

    // Sum up the payment amounts (this is the actual money received)
    const paymentList = (payments || []) as { order_id: string; amount: number }[];
    const totalSales = paymentList.reduce((sum, p) => sum + (p.amount || 0), 0);

    return {
        lastOpenDate: session.opened_at,
        totalSales,
    };
}

