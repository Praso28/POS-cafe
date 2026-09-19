"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/supabase/db";
import type { UserRole, RoleType } from "@/lib/types/database";

export async function getUserRole(userId: string): Promise<UserRole | null> {
    const supabase = await getDb();
    
    const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", userId)
        .single();

    if (error) {
        // No role found, default behavior
        return null;
    }
    return data;
}

export async function getCurrentUserRole(): Promise<UserRole | null> {
    const supabase = await getDb();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // First check user_metadata (new approach)
    const role = user.user_metadata?.role as RoleType | undefined;
    
    if (role) {
        // Return role from metadata (generate a pseudo-ID since metadata doesn't have one)
        return {
            id: `metadata-${user.id}`,
            user_id: user.id,
            role: role,
            permissions: {},
            created_at: user.created_at || new Date().toISOString(),
            updated_at: user.updated_at || user.created_at || new Date().toISOString(),
        };
    }

    // Fallback to user_roles table (legacy approach)
    return getUserRole(user.id);
}

export async function hasRole(requiredRole: RoleType): Promise<boolean> {
    const userRole = await getCurrentUserRole();
    
    if (!userRole) {
        return false;
    }

    // Role hierarchy: admin > manager > cashier > kitchen > viewer
    const roleHierarchy: Record<RoleType, number> = {
        admin: 5,
        manager: 4,
        cashier: 3,
        kitchen: 2,
        viewer: 1,
    };

    return roleHierarchy[userRole.role] >= roleHierarchy[requiredRole];
}

export async function hasPermission(permission: string): Promise<boolean> {
    const userRole = await getCurrentUserRole();
    
    if (!userRole) return false;
    
    // Admins have all permissions
    if (userRole.role === "admin") return true;
    
    // Check specific permission in permissions object
    const permissions = userRole.permissions as Record<string, boolean>;
    return permissions[permission] === true;
}

export async function assignRole(
    userId: string, 
    role: RoleType, 
    permissions?: Record<string, boolean>
): Promise<{ error?: string }> {
    const supabase = await getDb();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Not authenticated" };

    // Check if current user is admin
    const currentUserRole = await getUserRole(user.id);
    if (!currentUserRole || currentUserRole.role !== "admin") {
        return { error: "Only admins can assign roles" };
    }

    const { error } = await supabase
        .from("user_roles")
        .upsert({
            user_id: userId,
            role,
            permissions: permissions || {},
            updated_at: new Date().toISOString(),
        }, {
            onConflict: "user_id,role"
        });

    if (error) return { error: error.message };

    revalidatePath("/admin");
    return {};
}

export async function removeRole(userId: string, role: RoleType): Promise<{ error?: string }> {
    const supabase = await getDb();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Not authenticated" };

    // Check if current user is admin
    const currentUserRole = await getUserRole(user.id);
    if (!currentUserRole || currentUserRole.role !== "admin") {
        return { error: "Only admins can remove roles" };
    }

    const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);

    if (error) return { error: error.message };

    revalidatePath("/admin");
    return {};
}

export async function getAllUserRoles(): Promise<UserRole[]> {
    const supabase = await getDb();

    const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching user roles:", error);
        return [];
    }
    return data || [];
}

// Helper function to check access for server actions
export async function requireRole(requiredRole: RoleType): Promise<{ authorized: boolean; error?: string }> {
    const hasRequiredRole = await hasRole(requiredRole);
    
    if (!hasRequiredRole) {
        return { 
            authorized: false, 
            error: `Access denied. Required role: ${requiredRole}` 
        };
    }
    
    return { authorized: true };
}

// Convenient self-service role switcher for demo and development
export async function switchMyRole(newRole: RoleType = "admin"): Promise<{ error?: string; success?: boolean }> {
    const supabase = await getDb();
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (!user || userErr) return { error: "Not authenticated" };

    const { error } = await supabase.auth.updateUser({
        data: { role: newRole }
    });
    if (error) return { error: error.message };

    revalidatePath("/admin");
    revalidatePath("/pos");
    revalidatePath("/kitchen");
    revalidatePath("/reports");
    return { success: true };
}
