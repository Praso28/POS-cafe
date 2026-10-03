"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/supabase/db";
import type { PosTerminal } from "@/lib/types/database";

export async function getPosTerminals(): Promise<PosTerminal[]> {
    const supabase = await getDb();
    const { data, error } = await supabase
        .from("pos_terminals")
        .select("*")
        .eq("active", true)
        .order("name", { ascending: true });

    if (error) {
        console.error("Error fetching terminals:", error);
        return [];
    }
    return data || [];
}

export async function getAllPosTerminals(): Promise<PosTerminal[]> {
    const supabase = await getDb();
    const { data, error } = await supabase
        .from("pos_terminals")
        .select("*")
        .order("name", { ascending: true });

    if (error) {
        console.error("Error fetching terminals:", error);
        return [];
    }
    return data || [];
}

export async function getPosTerminal(id: string): Promise<PosTerminal | null> {
    const supabase = await getDb();
    const { data, error } = await supabase
        .from("pos_terminals")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
        console.error("Error fetching terminal:", error);
        return null;
    }
    return data;
}

export async function createPosTerminal(formData: FormData): Promise<{ terminal?: PosTerminal; error?: string }> {
    const supabase = await getDb();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Not authenticated" };

    const name = formData.get("name") as string;
    const description = formData.get("description") as string | null;
    const location = formData.get("location") as string | null;
    const terminal_type = (formData.get("terminal_type") as string) || "counter";

    const { data, error } = await supabase
        .from("pos_terminals")
        .insert({
            name,
            description: description || null,
            location: location || null,
            terminal_type,
            active: true,
        })
        .select()
        .single();

    if (error) return { error: error.message };

    revalidatePath("/admin/terminals");
    revalidatePath("/pos");
    return { terminal: data };
}

export async function updatePosTerminal(id: string, formData: FormData): Promise<{ error?: string }> {
    const supabase = await getDb();

    const name = formData.get("name") as string;
    const description = formData.get("description") as string | null;
    const location = formData.get("location") as string | null;
    const terminal_type = formData.get("terminal_type") as string;
    const active = formData.get("active") === "true";

    const { error } = await supabase
        .from("pos_terminals")
        .update({
            name,
            description: description || null,
            location: location || null,
            terminal_type,
            active,
            updated_at: new Date().toISOString(),
        })
        .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/admin/terminals");
    revalidatePath("/pos");
    return {};
}

export async function deletePosTerminal(id: string): Promise<{ error?: string }> {
    const supabase = await getDb();

    const { error } = await supabase
        .from("pos_terminals")
        .delete()
        .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/admin/terminals");
    revalidatePath("/pos");
    return {};
}

export async function toggleTerminalActive(id: string, active: boolean): Promise<{ error?: string }> {
    const supabase = await getDb();

    const { error } = await supabase
        .from("pos_terminals")
        .update({ active, updated_at: new Date().toISOString() })
        .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/admin/terminals");
    revalidatePath("/pos");
    return {};
}
