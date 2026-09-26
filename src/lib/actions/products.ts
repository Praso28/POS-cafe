"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/supabase/db";
import type { Product } from "@/lib/types/database";

export async function getProducts(): Promise<Product[]> {
    const supabase = await getDb();
    const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("category", { ascending: true })
        .order("name", { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
}

export async function createProduct(formData: FormData) {
    const supabase = await getDb();

    const name = (formData.get("name") as string)?.trim();
    const category = formData.get("category") as string;
    const price = parseFloat(formData.get("price") as string);
    const unit = formData.get("unit") as string | null;
    const tax = formData.get("tax") ? parseFloat(formData.get("tax") as string) : 0;
    const description = formData.get("description") as string | null;

    // Validate product name
    if (!name || name.length === 0) {
        return { error: "Product name is required" };
    }
    if (name.length > 100) {
        return { error: "Product name too long (max 100 characters)" };
    }

    // Validate price
    if (isNaN(price) || price <= 0) {
        return { error: "Price must be greater than zero" };
    }
    if (price > 100000) {
        return { error: "Price exceeds maximum allowed value (₹100,000)" };
    }
    // Check decimal places
    if (!/^\d+(\.\d{1,2})?$/.test(price.toString())) {
        return { error: "Price must have maximum 2 decimal places" };
    }

    // Validate category
    if (!category || category.trim().length === 0) {
        return { error: "Category is required" };
    }

    const { error } = await supabase.from("products").insert({
        name,
        category,
        price,
        unit: unit || null,
        tax,
        description: description || null,
        active: true,
    });

    if (error) return { error: error.message };

    revalidatePath("/admin/products");
    revalidatePath("/pos");
    return { success: true };
}

export async function updateProduct(id: string, formData: FormData) {
    const supabase = await getDb();

    const name = (formData.get("name") as string)?.trim();
    const category = formData.get("category") as string;
    const price = parseFloat(formData.get("price") as string);
    const unit = formData.get("unit") as string | null;
    const tax = formData.get("tax") ? parseFloat(formData.get("tax") as string) : 0;
    const description = formData.get("description") as string | null;
    const active = formData.get("active") === "true";

    // Validate product name
    if (!name || name.length === 0) {
        return { error: "Product name is required" };
    }
    if (name.length > 100) {
        return { error: "Product name too long (max 100 characters)" };
    }

    // Validate price
    if (isNaN(price) || price <= 0) {
        return { error: "Price must be greater than zero" };
    }
    if (price > 100000) {
        return { error: "Price exceeds maximum allowed value (₹100,000)" };
    }

    // Validate category
    if (!category || category.trim().length === 0) {
        return { error: "Category is required" };
    }

    const { error } = await supabase
        .from("products")
        .update({
            name,
            category,
            price,
            unit: unit || null,
            tax,
            description: description || null,
            active
        })
        .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/admin/products");
    revalidatePath("/pos");
    return { success: true };
}

export async function deleteProduct(id: string) {
    const supabase = await getDb();

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/admin/products");
    revalidatePath("/pos");
    return { success: true };
}

export async function toggleProductActive(id: string, active: boolean) {
    const supabase = await getDb();

    const { error } = await supabase
        .from("products")
        .update({ active })
        .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/admin/products");
    revalidatePath("/pos");
    return { success: true };
}
