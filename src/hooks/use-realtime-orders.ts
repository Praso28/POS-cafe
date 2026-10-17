"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { OrderWithItems } from "@/lib/types/database";

export function useRealtimeOrders(initialOrders: OrderWithItems[]) {
    const [orders, setOrders] = useState<OrderWithItems[]>(initialOrders);

    const fetchOrders = useCallback(async () => {
        const supabase = createClient();
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
            .in("status", ["sent", "preparing", "completed"])
            .order("created_at", { ascending: true });

        if (data) {
            setOrders(data as OrderWithItems[]);
        }
    }, []);

    useEffect(() => {
        const supabase = createClient();

        // Initial fetch
        fetchOrders();

        // Set up realtime subscription
        const channel = supabase
            .channel("kitchen-orders-realtime")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "orders",
                },
                () => {
                    fetchOrders();
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "order_items",
                },
                () => {
                    fetchOrders();
                }
            )
            .subscribe((status) => {
                console.log("Kitchen realtime status:", status);
            });

        // Fallback polling every 5 seconds for reliability
        const pollInterval = setInterval(fetchOrders, 5000);

        return () => {
            clearInterval(pollInterval);
            supabase.removeChannel(channel);
        };
    }, [fetchOrders]);

    return orders;
}
