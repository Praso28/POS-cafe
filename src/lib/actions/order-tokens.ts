"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/supabase/db";
import type { OrderToken } from "@/lib/types/database";

// Generate a random 6-character alphanumeric token
function generateToken(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude similar looking characters
    let token = "";
    for (let i = 0; i < 6; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
}

export async function createOrderToken(
    tableId: string,
    sessionId: string,
    expiresInHours: number = 24
): Promise<{ token?: OrderToken; error?: string }> {
    const supabase = await getDb();

    // Generate unique token
    let token = generateToken();
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
        const { data: existing } = await supabase
            .from("order_tokens")
            .select("id")
            .eq("token", token)
            .single();

        if (!existing) break;
        token = generateToken();
        attempts++;
    }

    if (attempts >= maxAttempts) {
        return { error: "Failed to generate unique token" };
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    const { data, error } = await supabase
        .from("order_tokens")
        .insert({
            token,
            table_id: tableId,
            session_id: sessionId,
            active: true,
            expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

    if (error) return { error: error.message };

    revalidatePath("/pos");
    return { token: data };
}

export async function getOrderToken(token: string): Promise<OrderToken | null> {
    const supabase = await getDb();

    const { data } = await supabase
        .from("order_tokens")
        .select("*")
        .eq("token", token)
        .eq("active", true)
        .single();

    // Check if token is expired
    if (data && data.expires_at) {
        const expiresAt = new Date(data.expires_at);
        if (expiresAt < new Date()) {
            // Deactivate expired token
            await supabase
                .from("order_tokens")
                .update({ active: false })
                .eq("id", data.id);
            return null;
        }
    }

    return data;
}

export async function getTokensBySession(sessionId: string): Promise<OrderToken[]> {
    const supabase = await getDb();

    const { data, error } = await supabase
        .from("order_tokens")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
}

export async function getAllTokens(): Promise<OrderToken[]> {
    const supabase = await getDb();

    const { data, error } = await supabase
        .from("order_tokens")
        .select("*, tables(name), pos_sessions(id)")
        .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
}

export async function deactivateToken(tokenId: string): Promise<{ error?: string }> {
    const supabase = await getDb();

    const { error } = await supabase
        .from("order_tokens")
        .update({ active: false })
        .eq("id", tokenId);

    if (error) return { error: error.message };

    revalidatePath("/pos");
    return {};
}

export async function deleteToken(tokenId: string): Promise<{ error?: string }> {
    const supabase = await getDb();

    const { error } = await supabase.from("order_tokens").delete().eq("id", tokenId);

    if (error) return { error: error.message };

    revalidatePath("/pos");
    return {};
}

