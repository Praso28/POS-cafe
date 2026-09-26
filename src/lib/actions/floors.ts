"use server";

import { getDb } from "@/lib/supabase/db";
import { revalidatePath } from "next/cache";
import type { Floor } from "@/lib/types/database";

export async function getFloors() {
  const supabase = await getDb();

  const { data, error } = await supabase
    .from("floors")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching floors:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data: data as Floor[] };
}

export async function createFloor(formData: FormData) {
  const supabase = await getDb();

  const name = formData.get("name") as string;
  const active = formData.get("active") === "true";

  if (!name) {
    return { success: false, error: "Floor name is required" };
  }

  const { data, error } = await supabase
    .from("floors")
    .insert({ name, active })
    .select()
    .single();

  if (error) {
    console.error("Error creating floor:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/floors");
  return { success: true, data: data as Floor };
}

export async function updateFloor(id: string, formData: FormData) {
  const supabase = await getDb();

  const name = formData.get("name") as string;
  const active = formData.get("active") === "true";

  if (!name) {
    return { success: false, error: "Floor name is required" };
  }

  const { data, error } = await supabase
    .from("floors")
    .update({ name, active })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating floor:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/floors");
  return { success: true, data: data as Floor };
}

export async function deleteFloor(id: string) {
  const supabase = await getDb();

  const { error } = await supabase.from("floors").delete().eq("id", id);

  if (error) {
    console.error("Error deleting floor:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/floors");
  return { success: true };
}
