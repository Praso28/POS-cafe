"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/supabase/db";
import type { CafeTable, TableWithFloor, TableStatus } from "@/lib/types/database";

export async function getTables(): Promise<CafeTable[]> {
    const supabase = await getDb();
    const { data, error } = await supabase
        .from("tables")
        .select("*")
        .order("name", { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
}

export async function getTablesWithFloors(): Promise<TableWithFloor[]> {
    const supabase = await getDb();
    const { data, error } = await supabase
        .from("tables")
        .select("*")
        .order("name", { ascending: true });

    if (error) throw new Error(error.message);
    
    if (!data || data.length === 0) return [];
    
    // Get unique floor IDs
    const floorIds = [...new Set(data.filter((t: any) => t.floor_id).map((t: any) => t.floor_id))];
    
    if (floorIds.length === 0) {
        return data as TableWithFloor[];
    }
    
    // Fetch floors - gracefully handle if table doesn't exist
    const { data: floors, error: floorError } = await supabase
        .from("floors")
        .select("*")
        .in("id", floorIds);
    
    if (floorError) {
        console.warn("⚠️ Floors table not yet created. Returning tables without floor data.");
        // If floors table doesn't exist, just return tables without floor data
        return data as TableWithFloor[];
    }
    
    // Map floors by ID for quick lookup
    const floorsMap = new Map((floors || []).map((f: any) => [f.id, f]));
    
    // Attach floor data to tables
    return data.map((table: any) => ({
        ...table,
        floors: table.floor_id ? floorsMap.get(table.floor_id) || null : null
    })) as TableWithFloor[];
}

export async function getTablesByStatus(status: TableStatus): Promise<TableWithFloor[]> {
    const supabase = await getDb();
    const { data, error } = await supabase
        .from("tables")
        .select("*")
        .eq("status", status)
        .eq("active", true)
        .order("name", { ascending: true });

    if (error) throw new Error(error.message);
    
    if (!data || data.length === 0) return [];
    
    // Get unique floor IDs
    const floorIds = [...new Set(data.filter((t: any) => t.floor_id).map((t: any) => t.floor_id))];
    
    if (floorIds.length === 0) {
        return data as TableWithFloor[];
    }
    
    // Fetch floors - gracefully handle if table doesn't exist
    const { data: floors, error: floorError } = await supabase
        .from("floors")
        .select("*")
        .in("id", floorIds);
    
    if (floorError) {
        console.warn("⚠️ Floors table not yet created. Returning tables without floor data.");
        // If floors table doesn't exist, just return tables without floor data
        return data as TableWithFloor[];
    }
    
    // Map floors by ID for quick lookup
    const floorsMap = new Map((floors || []).map((f: any) => [f.id, f]));
    
    // Attach floor data to tables
    return data.map((table: any) => ({
        ...table,
        floors: table.floor_id ? floorsMap.get(table.floor_id) || null : null
    })) as TableWithFloor[];
}

export async function getAvailableTables(): Promise<TableWithFloor[]> {
    return getTablesByStatus("available");
}

export async function getOccupiedTables(): Promise<TableWithFloor[]> {
    return getTablesByStatus("occupied");
}

export async function updateTableStatus(
    tableId: string,
    status: TableStatus,
    orderId?: string | null
): Promise<{ error?: string }> {
    const supabase = await getDb();

    const updateData: Record<string, unknown> = { status };

    if (status === "occupied" && orderId) {
        updateData.current_order_id = orderId;
        updateData.occupied_at = new Date().toISOString();
    } else if (status === "available") {
        updateData.current_order_id = null;
        updateData.occupied_at = null;
        updateData.reserved_at = null;
        updateData.reserved_until = null;
        updateData.reservation_name = null;
    } else if (status === "reserved") {
        updateData.reserved_at = new Date().toISOString();
    }

    const { error } = await supabase
        .from("tables")
        .update(updateData)
        .eq("id", tableId);

    if (error) return { error: error.message };

    revalidatePath("/pos");
    revalidatePath("/admin/tables");
    return {};
}

export async function reserveTable(
    tableId: string,
    reservationName: string,
    reservedUntil?: Date
): Promise<{ error?: string }> {
    const supabase = await getDb();

    const { error } = await supabase
        .from("tables")
        .update({
            status: "reserved",
            reservation_name: reservationName,
            reserved_at: new Date().toISOString(),
            reserved_until: reservedUntil?.toISOString() || null,
        })
        .eq("id", tableId);

    if (error) return { error: error.message };

    revalidatePath("/pos");
    revalidatePath("/admin/tables");
    return {};
}

export async function releaseTable(tableId: string): Promise<{ error?: string }> {
    return updateTableStatus(tableId, "available");
}

export async function createTable(formData: FormData) {
    const supabase = await getDb();

    const name = formData.get("name") as string;
    const seats = parseInt(formData.get("seats") as string);
    const floor_id = formData.get("floor_id") as string | null;
    const appointment_resource = formData.get("appointment_resource") as string | null;

    const { error } = await supabase.from("tables").insert({
        name,
        seats,
        floor_id: floor_id || null,
        appointment_resource: appointment_resource || null,
        active: true,
        status: "available",
    });

    if (error) return { error: error.message };

    revalidatePath("/admin/tables");
    revalidatePath("/pos");
    return { success: true };
}

export async function updateTable(id: string, formData: FormData) {
    const supabase = await getDb();

    const name = formData.get("name") as string;
    const seats = parseInt(formData.get("seats") as string);
    const active = formData.get("active") === "true";
    const floor_id = formData.get("floor_id") as string | null;
    const appointment_resource = formData.get("appointment_resource") as string | null;

    const { error } = await supabase
        .from("tables")
        .update({
            name,
            seats,
            active,
            floor_id: floor_id || null,
            appointment_resource: appointment_resource || null
        })
        .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/admin/tables");
    revalidatePath("/pos");
    return { success: true };
}

export async function deleteTable(id: string) {
    const supabase = await getDb();

    const { error } = await supabase.from("tables").delete().eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/admin/tables");
    revalidatePath("/pos");
    return { success: true };
}

export async function toggleTableActive(id: string, active: boolean) {
    const supabase = await getDb();

    const { error } = await supabase
        .from("tables")
        .update({ active })
        .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/admin/tables");
    revalidatePath("/pos");
    return { success: true };
}
