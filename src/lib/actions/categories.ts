"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ProductCategory {
    id: string;
    name: string;
    color: string;
    sort_order: number;
    created_at: string;
}

// Fixed color options
export const CATEGORY_COLORS = [
    { name: "White", value: "#FFFFFF" },
    { name: "Red", value: "#EF4444" },
    { name: "Orange", value: "#F97316" },
    { name: "Yellow", value: "#EAB308" },
    { name: "Green", value: "#22C55E" },
    { name: "Cyan", value: "#06B6D4" },
    { name: "Blue", value: "#3B82F6" },
    { name: "Purple", value: "#A855F7" },
    { name: "Pink", value: "#EC4899" },
];

export async function getAllCategories(): Promise<ProductCategory[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("product_categories")
        .select("*")
        .order("sort_order", { ascending: true });

    if (error) {
        console.error("Error fetching categories:", error);
        return [];
    }

    return (data as ProductCategory[]) || [];
}

export async function createCategory(category: {
    name: string;
    color?: string;
}): Promise<{ category?: ProductCategory; error?: string }> {
    const supabase = await createClient();

    // Get max sort_order
    const { data: existing } = await supabase
        .from("product_categories")
        .select("sort_order")
        .order("sort_order", { ascending: false })
        .limit(1);

    const maxOrder = existing && existing.length > 0 ? (existing[0] as any).sort_order : 0;

    const { data, error } = await (supabase
        .from("product_categories") as any)
        .insert({
            name: category.name,
            color: category.color || "#FFFFFF",
            sort_order: maxOrder + 1,
        })
        .select()
        .single();

    if (error) return { error: error.message };

    revalidatePath("/admin/products/category");
    return { category: data as ProductCategory };
}

export async function updateCategory(
    id: string,
    updates: Partial<Pick<ProductCategory, "name" | "color" | "sort_order">>
): Promise<{ error?: string }> {
    const supabase = await createClient();

    const { error } = await (supabase.from("product_categories") as any)
        .update(updates)
        .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/admin/products/category");
    return {};
}

export async function deleteCategory(id: string): Promise<{ error?: string }> {
    const supabase = await createClient();

    const { error } = await supabase
        .from("product_categories")
        .delete()
        .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/admin/products/category");
    return {};
}

export async function reorderCategories(
    orderedIds: string[]
): Promise<{ error?: string }> {
    const supabase = await createClient();

    // Update each category with new sort_order
    for (let i = 0; i < orderedIds.length; i++) {
        const { error } = await (supabase.from("product_categories") as any)
            .update({ sort_order: i + 1 })
            .eq("id", orderedIds[i]);

        if (error) return { error: error.message };
    }

    revalidatePath("/admin/products/category");
    return {};
}
