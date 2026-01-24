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
