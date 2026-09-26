"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/supabase/db";
import type { ProductVariant } from "@/lib/types/database";

export async function getProductVariants(productId: string): Promise<ProductVariant[]> {
    const supabase = await getDb();
    const { data, error } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", productId)
        .order("attribute_name", { ascending: true })
        .order("attribute_value", { ascending: true });

    if (error) {
        console.warn("Failed to load product variants (table may be missing):", error.message);
        return [];
    }
    return data || [];
}

export async function createProductVariant(formData: FormData) {
    const supabase = await getDb();

    const product_id = formData.get("product_id") as string;
    const attribute_name = formData.get("attribute_name") as string;
    const attribute_value = formData.get("attribute_value") as string;
    const extra_price = parseFloat(formData.get("extra_price") as string) || 0;

    const { error } = await supabase.from("product_variants").insert({
        product_id,
        attribute_name,
        attribute_value,
        extra_price,
        active: true,
    });

    if (error) return { error: error.message };

    revalidatePath("/admin/products");
    revalidatePath("/pos");
    return { success: true };
}

export async function updateProductVariant(id: string, formData: FormData) {
    const supabase = await getDb();

    const attribute_name = formData.get("attribute_name") as string;
    const attribute_value = formData.get("attribute_value") as string;
    const extra_price = parseFloat(formData.get("extra_price") as string) || 0;
    const active = formData.get("active") === "true";

    const { error } = await supabase
        .from("product_variants")
        .update({ attribute_name, attribute_value, extra_price, active })
        .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/admin/products");
    revalidatePath("/pos");
    return { success: true };
}

export async function deleteProductVariant(id: string) {
    const supabase = await getDb();

    const { error } = await supabase.from("product_variants").delete().eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/admin/products");
    revalidatePath("/pos");
    return { success: true };
}

export async function toggleProductVariantActive(id: string, active: boolean) {
    const supabase = await getDb();

    const { error } = await supabase
        .from("product_variants")
        .update({ active })
        .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/admin/products");
    revalidatePath("/pos");
    return { success: true };
}

