"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/supabase/db";
import type { PosSession, PosSessionWithTerminal } from "@/lib/types/database";

export type SessionSummary = {
    totalOrders: number;
    paidOrders: number;
    unpaidOrders: number;
    totalRevenue: number;
    lastSaleAmount: number;
    averageOrderValue: number;
};

export async function getActiveSession(terminalId?: string): Promise<PosSession | null> {
    const supabase = await getDb();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    let query = supabase
        .from("pos_sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "open");

    if (terminalId) {
        query = query.eq("terminal_id", terminalId);
    }

    const { data } = await query.order("opened_at", { ascending: false }).limit(1).single();

    return data;
}

export async function getActiveSessionWithTerminal(): Promise<PosSessionWithTerminal | null> {
    const supabase = await getDb();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data } = await supabase
        .from("pos_sessions")
        .select("*, pos_terminals(*)")
        .eq("user_id", user.id)
        .eq("status", "open")
        .order("opened_at", { ascending: false })
        .limit(1)
        .single();

    return data as PosSessionWithTerminal | null;
}

export async function getAllActiveSessions(): Promise<PosSessionWithTerminal[]> {
    const supabase = await getDb();

    const { data, error } = await supabase
        .from("pos_sessions")
        .select("*, pos_terminals(*)")
        .eq("status", "open")
        .order("opened_at", { ascending: false });

    if (error) {
        console.error("Error fetching active sessions:", error);
        return [];
    }
    return (data as PosSessionWithTerminal[]) || [];
}

export async function openSession(
    terminalId?: string,
    sessionName?: string
): Promise<{ session?: PosSession; error?: string }> {
    const supabase = await getDb();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Not authenticated" };

    // Check if there's already an open session for this terminal
    if (terminalId) {
        const { data: existingTerminalSession } = await supabase
            .from("pos_sessions")
            .select("*")
            .eq("terminal_id", terminalId)
            .eq("status", "open")
            .single();

        if (existingTerminalSession) {
            return { error: "This terminal already has an active session" };
        }
    }

    // Check if user already has an open session
    const existing = await getActiveSession();
    if (existing) return { session: existing };

    const { data, error } = await supabase
        .from("pos_sessions")
        .insert({
            user_id: user.id,
            status: "open",
            terminal_id: terminalId || null,
            session_name: sessionName || null,
        })
        .select()
        .single();

    if (error) return { error: error.message };

    revalidatePath("/pos");
    return { session: data };
}

export async function closeSession(sessionId: string): Promise<{ error?: string; totalSales?: number }> {
    const supabase = await getDb();

    // Check for open/unpaid orders
    const { data: openOrders, error: checkError } = await supabase
        .from("orders")
        .select("id, table_id, status, total")
        .eq("session_id", sessionId)
        .in("status", ["open", "sent", "preparing"]);

    if (checkError) {
        return { error: checkError.message };
    }

    if (openOrders && openOrders.length > 0) {
        const orderList = openOrders
            .map((o: any) => `Order #${o.id.slice(0, 8)} - ₹${o.total}`)
            .join(", ");

        return {
            error: `Cannot close session. ${openOrders.length} order(s) still open: ${orderList}`
        };
    }

    // Calculate session totals
    const { data: sessionData } = await supabase
        .from("orders")
        .select("total, status")
        .eq("session_id", sessionId);

    const totalSales = sessionData
        ?.filter((o: any) => o.status === "completed" || o.status === "paid")
        .reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0) || 0;

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    // Close session
    const { error } = await supabase
        .from("pos_sessions")
        .update({
            status: "closed",
            closed_at: new Date().toISOString(),
            total_sales: totalSales,
            closed_by: user?.id || null
        })
        .eq("id", sessionId);

    if (error) return { error: error.message };

    revalidatePath("/pos");
    return { totalSales };
}

export async function getSessionSummary(sessionId: string): Promise<SessionSummary> {
    const defaultSummary: SessionSummary = {
        totalOrders: 0,
        paidOrders: 0,
        unpaidOrders: 0,
        totalRevenue: 0,
        lastSaleAmount: 0,
        averageOrderValue: 0,
    };

    if (!sessionId) {
        return defaultSummary;
    }

    const supabase = await getDb();

    const { data: orders, error } = await supabase
        .from("orders")
        .select("id, status, total, created_at")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false });

    if (error || !orders) {
        return defaultSummary;
    }

    const allOrders = orders;
    const paidOrders = allOrders.filter((o: any) => o.status === "paid" || o.status === "completed");
    const unpaidOrders = allOrders.filter((o: any) => o.status !== "paid" && o.status !== "completed");
    const totalRevenue = paidOrders.reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0);

    const lastSale = paidOrders.length > 0 ? paidOrders[0] : null;
    const lastSaleAmount = lastSale?.total ? Number(lastSale.total) : 0;
    const averageOrderValue = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

    return {
        totalOrders: allOrders.length,
        paidOrders: paidOrders.length,
        unpaidOrders: unpaidOrders.length,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        lastSaleAmount: Math.round(lastSaleAmount * 100) / 100,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
    };
}
