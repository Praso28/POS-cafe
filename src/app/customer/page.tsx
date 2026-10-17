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
    let upiId: string | null = null;

    const supabase = await createClient();

    // Fetch UPI ID from payment methods
    const { data: upiMethod } = await supabase
        .from("payment_methods")
        .select("upi_id")
        .eq("type", "upi")
        .single();
    
    if (upiMethod && typeof upiMethod === "object" && "upi_id" in upiMethod) {
        upiId = (upiMethod as { upi_id: string | null }).upi_id;
    }

    if (orderId) {
        const { data } = await supabase
            .from("orders")
            .select(`
        *,
        tables:tables!orders_table_id_fkey(*),
        order_items (
          *,
          products (*)
        )
      `)
            .eq("id", orderId)
            .single();

        order = data as OrderWithItems | null;
    }

    return <CustomerClient orderId={orderId} initialOrder={order} upiId={upiId} />;
}
