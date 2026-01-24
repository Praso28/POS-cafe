"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CafeTable } from "@/lib/types/database";

export async function getTables(): Promise<CafeTable[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("tables")
        .select("*")
        .order("name", { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
}

export async function createTable(formData: FormData) {
    const supabase = await createClient();

    const name = formData.get("name") as string;
    const seats = parseInt(formData.get("seats") as string);

    const { error } = await supabase.from("tables").insert({
        name,
        seats,
        active: true,
    });

    if (error) return { error: error.message };

    revalidatePath("/admin/tables");
    return { success: true };
}

export async function updateTable(id: string, formData: FormData) {
    const supabase = await createClient();

    const name = formData.get("name") as string;
    const seats = parseInt(formData.get("seats") as string);
    const active = formData.get("active") === "true";

    const { error } = await supabase
        .from("tables")
        .update({ name, seats, active })
        .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/admin/tables");
    return { success: true };
}

export async function deleteTable(id: string) {
    const supabase = await createClient();

    const { error } = await supabase.from("tables").delete().eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/admin/tables");
    return { success: true };
}

export async function toggleTableActive(id: string, active: boolean) {
    const supabase = await createClient();

    const { error } = await supabase
        .from("tables")
        .update({ active })
        .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/admin/tables");
    return { success: true };
}
