import { createClient } from "@/lib/supabase/server";
import { CustomerClient } from "./customer-client";
import type { OrderWithItems } from "@/lib/types/database";

interface CustomerPageProps {
    searchParams: Promise<{ order_id?: string }>;
}

export default async function CustomerPage({ searchParams }: CustomerPageProps) {
    const params = await searchParams;
    const orderId = params.order_id || "";

    let order: OrderWithItems | null = null;

    if (orderId) {
        const supabase = await createClient();
        const { data } = await supabase
            .from("orders")
            .select(`
        *,
        tables (*),
        order_items (
          *,
          products (*)
        )
      `)
            .eq("id", orderId)
            .single();

        order = data as OrderWithItems | null;
    }

    return <CustomerClient orderId={orderId} initialOrder={order} />;
}
