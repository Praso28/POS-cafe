/**
 * Database helper that provides an untyped Supabase client for operations
 * This is a workaround for Supabase type inference issues with custom Database types
 */

import { createClient } from "./server";

export async function getDb() {
    const supabase = await createClient();
    // Return the client cast as any to bypass type inference issues
    return supabase as any;
}
