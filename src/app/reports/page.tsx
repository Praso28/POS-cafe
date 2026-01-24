import { getOrdersForReports } from "@/lib/actions/orders";
import { createClient } from "@/lib/supabase/server";
import { ReportsClient } from "./reports-client";
import type { PosSession } from "@/lib/types/database";

export default async function ReportsPage() {
    const supabase = await createClient();

    const [orders, { data: sessions }] = await Promise.all([
        getOrdersForReports(),
        supabase.from("pos_sessions").select("*").order("opened_at", { ascending: false }),
    ]);

    return (
        <ReportsClient
            initialOrders={orders}
            sessions={(sessions as PosSession[]) || []}
        />
    );
}
