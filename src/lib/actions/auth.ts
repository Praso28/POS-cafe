"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signIn(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const redirectTo = formData.get("redirectTo") as string | null;

    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return { error: error.message };
    }

    redirect(redirectTo || "/pos");
}

export async function signUp(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as string || "cashier"; // Get role from form

    const supabase = await createClient();

    // Store role in user_metadata during signup
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                role: role, // Store role directly in user metadata
            }
        }
    });

    if (error) {
        return { error: error.message };
    }

    return { 
        success: "Account created! You can now login.",
        userId: data.user?.id 
    };
}

export async function signOut() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
}

export async function getUser() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

export async function getUserWithRole() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;
    
    return {
        ...user,
        role: user.user_metadata?.role as string | undefined,
    };
}
