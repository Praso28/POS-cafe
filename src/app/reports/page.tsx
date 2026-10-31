import { getOrdersForReports } from "@/lib/actions/orders";
import { getProducts } from "@/lib/actions/products";
import { createClient } from "@/lib/supabase/server";
import { ReportsClient } from "./reports-client";
import type { PosSession, Product } from "@/lib/types/database";

export default async function ReportsPage() {
    const supabase = await createClient();

    const [orders, products, { data: sessions }] = await Promise.all([
        getOrdersForReports(),
        getProducts(),
        supabase.from("pos_sessions").select("*, user_id").order("opened_at", { ascending: false }),
    ]);

    // Get unique user IDs from sessions for "responsible" filter
    const userIds = [...new Set(sessions?.map((s: PosSession) => s.user_id) || [])];

    return (
        <ReportsClient
            initialOrders={orders}
            sessions={(sessions as PosSession[]) || []}
            products={products}
            userIds={userIds}
        />
    );
}
