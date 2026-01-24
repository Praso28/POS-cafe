"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { OrderWithItems, Payment } from "@/lib/types/database";

interface OrderWithPayment extends OrderWithItems {
    payment?: Payment | null;
}

export function useRealtimeCustomerOrder(orderId: string, initialOrder: OrderWithItems | null) {
    const [order, setOrder] = useState<OrderWithPayment | null>(initialOrder);
    const [payment, setPayment] = useState<Payment | null>(null);

    useEffect(() => {
        if (!orderId) return;

        const supabase = createClient();

        // Fetch initial payment status
        async function fetchPayment() {
            const { data } = await supabase
                .from("payments")
                .select("*")
                .eq("order_id", orderId)
                .order("created_at", { ascending: false })
                .limit(1)
                .single();

            if (data) setPayment(data);
        }
        fetchPayment();

        const channel = supabase
            .channel(`customer-order-${orderId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "orders",
                    filter: `id=eq.${orderId}`,
                },
                async () => {
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

                    if (data) setOrder(data as OrderWithItems);
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "payments",
                    filter: `order_id=eq.${orderId}`,
                },
                async () => {
                    const { data } = await supabase
                        .from("payments")
                        .select("*")
                        .eq("order_id", orderId)
                        .order("created_at", { ascending: false })
                        .limit(1)
                        .single();

                    if (data) setPayment(data);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [orderId]);

    return { order, payment };
}
