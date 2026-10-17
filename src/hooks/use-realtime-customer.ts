"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { OrderWithItems, Payment } from "@/lib/types/database";

interface OrderWithPayment extends OrderWithItems {
    payment?: Payment | null;
}

export function useRealtimeCustomerOrder(orderId: string, initialOrder: OrderWithItems | null) {
    const [order, setOrder] = useState<OrderWithPayment | null>(initialOrder);
    const [payment, setPayment] = useState<Payment | null>(null);
    const [isPaymentComplete, setIsPaymentComplete] = useState(false);
    const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const fetchOrder = useCallback(async () => {
        if (!orderId) return;
        const supabase = createClient();
        const { data, error } = await supabase
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

        if (data && !error) setOrder(data as OrderWithItems);
    }, [orderId]);

    const fetchPayment = useCallback(async () => {
        if (!orderId) return;
        const supabase = createClient();
        const { data, error } = await supabase
            .from("payments")
            .select("*")
            .eq("order_id", orderId)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        if (data && !error) {
            setPayment(data as Payment);
            // If payment is completed, stop updates
            if ((data as Payment).status === "completed") {
                setIsPaymentComplete(true);
            }
        }
    }, [orderId]);

    const stopRealtimeUpdates = useCallback(() => {
        // Clear polling interval
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }

        // Remove realtime channel
        if (channelRef.current) {
            const supabase = createClient();
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (!orderId) return;

        const supabase = createClient();

        // Initial fetch
        fetchOrder();
        fetchPayment();

        // Only set up realtime if payment is not already complete
        if (!isPaymentComplete) {
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
                    () => {
                        fetchOrder();
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
                        fetchOrder();
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
                    () => {
                        fetchPayment();
                    }
                )
                .subscribe((status) => {
                    console.log("Customer realtime status:", status);
                });

            channelRef.current = channel;

            // Fallback polling every 3 seconds for customer display (only while payment pending)
            pollIntervalRef.current = setInterval(() => {
                fetchOrder();
                fetchPayment();
            }, 3000);
        }

        return () => {
            stopRealtimeUpdates();
        };
    }, [orderId, fetchOrder, fetchPayment, isPaymentComplete, stopRealtimeUpdates]);

    // Stop updates when payment is completed
    useEffect(() => {
        if (isPaymentComplete) {
            stopRealtimeUpdates();
        }
    }, [isPaymentComplete, stopRealtimeUpdates]);

    return { order, payment, isPaymentComplete };
}
