"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { OrderWithItems } from "@/lib/types/database";

export function useRealtimeOrders(initialOrders: OrderWithItems[]) {
    const [orders, setOrders] = useState<OrderWithItems[]>(initialOrders);

    useEffect(() => {
        const supabase = createClient();

        const channel = supabase
            .channel("kitchen-orders")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "orders",
                },
                async () => {
                    // Refetch all kitchen orders when any order changes
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
                        .in("status", ["sent", "preparing", "completed"])
                        .order("created_at", { ascending: true });

                    if (data) {
                        setOrders(data as OrderWithItems[]);
                    }
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "order_items",
                },
                async () => {
                    // Refetch when items change
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
                        .in("status", ["sent", "preparing", "completed"])
                        .order("created_at", { ascending: true });

                    if (data) {
                        setOrders(data as OrderWithItems[]);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return orders;
}
