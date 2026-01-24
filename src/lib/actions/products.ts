"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types/database";

export async function getProducts(): Promise<Product[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("category", { ascending: true })
        .order("name", { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
}

export async function createProduct(formData: FormData) {
    const supabase = await createClient();

    const name = formData.get("name") as string;
    const category = formData.get("category") as string;
    const price = parseFloat(formData.get("price") as string);

    const { error } = await supabase.from("products").insert({
        name,
        category,
        price,
        active: true,
    });

    if (error) return { error: error.message };

    revalidatePath("/admin/products");
    return { success: true };
}

export async function updateProduct(id: string, formData: FormData) {
    const supabase = await createClient();

    const name = formData.get("name") as string;
    const category = formData.get("category") as string;
    const price = parseFloat(formData.get("price") as string);
    const active = formData.get("active") === "true";

    const { error } = await supabase
        .from("products")
        .update({ name, category, price, active })
        .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/admin/products");
    return { success: true };
}

export async function deleteProduct(id: string) {
    const supabase = await createClient();

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/admin/products");
    return { success: true };
}

export async function toggleProductActive(id: string, active: boolean) {
    const supabase = await createClient();

    const { error } = await supabase
        .from("products")
        .update({ active })
        .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/admin/products");
    return { success: true };
}
