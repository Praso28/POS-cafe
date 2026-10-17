"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { UPIQR } from "@/components/payments/upi-qr";
import type { OrderWithItems, Payment } from "@/lib/types/database";

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
    open: { label: "Order Placed", color: "bg-gray-500", icon: "📝" },
    sent: { label: "Sent to Kitchen", color: "bg-orange-500", icon: "🔔" },
    preparing: { label: "Being Prepared", color: "bg-blue-500", icon: "👨‍🍳" },
    completed: { label: "Ready!", color: "bg-green-500", icon: "✅" },
    paid: { label: "Paid - Thank You!", color: "bg-purple-500", icon: "💰" },
};

type DisplayMode = "idle" | "order" | "thankyou";

interface CounterDisplayClientProps {
    defaultTerminalId?: string | null;
}

export function CounterDisplayClient({ defaultTerminalId = null }: CounterDisplayClientProps) {
    const searchParams = useSearchParams();
    const terminalId = searchParams.get("terminal_id") || defaultTerminalId;
    const upiId = searchParams.get("upi_id");
    const autoResetSeconds = parseInt(searchParams.get("reset_seconds") || "10");

    const [displayMode, setDisplayMode] = useState<DisplayMode>("idle");
    const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
    const [order, setOrder] = useState<OrderWithItems | null>(null);
    const [payment, setPayment] = useState<Payment | null>(null);
    const [countdown, setCountdown] = useState<number>(autoResetSeconds);

    const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
    const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Fetch order details
    const fetchOrder = useCallback(async (orderId: string) => {
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
            .eq("id", orderId)
            .single();

        if (data) {
            setOrder(data as OrderWithItems);
        }
    }, []);

    // Fetch payment details
    const fetchPayment = useCallback(async (orderId: string) => {
        const supabase = createClient();
        const { data } = await supabase
            .from("payments")
            .select("*")
            .eq("order_id", orderId)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        if (data) {
            const paymentData = data as Payment;
            setPayment(paymentData);
            if (paymentData.status === "completed") {
                startThankYouSequence();
            }
        }
    }, []);

    // Start the thank you sequence with countdown
    const startThankYouSequence = useCallback(() => {
        setDisplayMode("thankyou");
        setCountdown(autoResetSeconds);

        // Clear any existing timers
        if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

        // Start countdown
        countdownIntervalRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Reset to idle after countdown
        resetTimeoutRef.current = setTimeout(() => {
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            resetToIdle();
        }, autoResetSeconds * 1000);
    }, [autoResetSeconds]);

    // Reset to idle state
    const resetToIdle = useCallback(() => {
        setDisplayMode("idle");
        setCurrentOrderId(null);
        setOrder(null);
        setPayment(null);
        setCountdown(autoResetSeconds);

        // Unsubscribe from current order channel
        if (channelRef.current) {
            const supabase = createClient();
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
        }
    }, [autoResetSeconds]);

    // Subscribe to a specific order
    const subscribeToOrder = useCallback((orderId: string) => {
        setCurrentOrderId(orderId);
        setDisplayMode("order");
        fetchOrder(orderId);
        fetchPayment(orderId);

        const supabase = createClient();

        // Unsubscribe from previous channel
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
        }

        // Subscribe to order and payment updates
        channelRef.current = supabase
            .channel(`counter-display-${orderId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "orders",
                    filter: `id=eq.${orderId}`,
                },
                () => fetchOrder(orderId)
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "order_items",
                    filter: `order_id=eq.${orderId}`,
                },
                () => fetchOrder(orderId)
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "payments",
                    filter: `order_id=eq.${orderId}`,
                },
                () => fetchPayment(orderId)
            )
            .subscribe();
    }, [fetchOrder, fetchPayment]);

    // Listen for new orders to display (from POS pushing updates)
    useEffect(() => {
        const supabase = createClient();

        // Listen to customer_display_sessions for this terminal
        if (terminalId) {
            // Fetch current display session so counter shows active order on load
            supabase
                .from("customer_display_sessions")
                .select("current_order_id, display_mode")
                .eq("terminal_id", terminalId)
                .single()
                .then(({ data }) => {
                    const sessionData = data as { current_order_id?: string | null; display_mode?: string | null } | null;
                    if (sessionData?.current_order_id && sessionData.display_mode === "order") {
                        subscribeToOrder(sessionData.current_order_id);
                    } else if (sessionData?.display_mode === "idle") {
                        resetToIdle();
                    }
                });

            const displayChannel = supabase
                .channel(`counter-terminal-${terminalId}`)
                .on(
                    "postgres_changes",
                    {
                        event: "*",
                        schema: "public",
                        table: "customer_display_sessions",
                        filter: `terminal_id=eq.${terminalId}`,
                    },
                    (payload) => {
                        const newData = payload.new as { current_order_id?: string; display_mode?: string };
                        if (newData.current_order_id && newData.display_mode === "order") {
                            subscribeToOrder(newData.current_order_id);
                        } else if (newData.display_mode === "idle") {
                            resetToIdle();
                        }
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(displayChannel);
            };
        }
    }, [terminalId, subscribeToOrder, resetToIdle]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            if (channelRef.current) {
                const supabase = createClient();
                supabase.removeChannel(channelRef.current);
            }
        };
    }, []);

    // IDLE STATE - Welcome screen
    if (displayMode === "idle") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center p-8">
                <div className="text-center text-white space-y-8">
                    <div className="mx-auto w-32 h-32 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-sm animate-pulse">
                        <span className="text-7xl">☕</span>
                    </div>
                    <div>
                        <h1 className="text-5xl font-bold mb-4">Welcome!</h1>
                        <p className="text-2xl text-blue-100">
                            Your order will appear here
                        </p>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-blue-200">
                        <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
                        <span>Ready to serve you</span>
                    </div>
                </div>
            </div>
        );
    }

    // THANK YOU STATE - After payment complete
    if (displayMode === "thankyou") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center p-8">
                <div className="text-center text-white space-y-8">
                    <div className="mx-auto w-40 h-40 bg-white rounded-full flex items-center justify-center shadow-2xl">
                        <span className="text-8xl animate-bounce">✅</span>
                    </div>
                    <div>
                        <h1 className="text-5xl font-bold mb-4">Thank You!</h1>
                        <p className="text-2xl text-green-100">
                            Payment Complete
                        </p>
                        {order && (
                            <p className="text-4xl font-bold mt-4">
                                ₹{order.total.toFixed(2)}
                            </p>
                        )}
                    </div>
                    <div className="bg-white/20 rounded-2xl px-8 py-4 backdrop-blur-sm">
                        <p className="text-xl">
                            Next customer in <span className="font-bold text-3xl">{countdown}</span> seconds
                        </p>
                    </div>
                    <p className="text-green-200 text-lg">
                        ☕ Enjoy your order!
                    </p>
                </div>
            </div>
        );
    }

    // ORDER STATE - Show current order
    if (!order) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
            </div>
        );
    }

    const status = statusConfig[order.status] || statusConfig.open;
    const orderNumber = order.order_number || order.id.slice(-4).toUpperCase();
    const isPendingPayment = payment && payment.status === "pending";

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg shadow-2xl">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto w-24 h-24 bg-white rounded-full flex items-center justify-center text-6xl shadow-lg mb-4">
                        {status.icon}
                    </div>
                    <CardTitle className="text-3xl">Order #{orderNumber}</CardTitle>
                    <div className="flex items-center justify-center gap-2 mt-2">
                        <span className="text-gray-500">{order.tables?.name}</span>
                        {order.order_type && order.order_type !== "dine-in" && (
                            <Badge variant="outline" className="capitalize">
                                {order.order_type}
                            </Badge>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Status */}
                    <div className="text-center">
                        <Badge className={`${status.color} text-white text-xl px-6 py-3`}>
                            {status.label}
                        </Badge>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex items-center gap-2">
                        {["sent", "preparing", "completed", "paid"].map((s, i) => (
                            <div
                                key={s}
                                className={`flex-1 h-3 rounded-full transition-all ${
                                    ["sent", "preparing", "completed", "paid"].indexOf(order.status) >= i
                                        ? "bg-blue-500"
                                        : "bg-gray-200"
                                }`}
                            />
                        ))}
                    </div>

                    <Separator />

                    {/* Order Items */}
                    <div>
                        <h3 className="font-semibold mb-3 text-lg">Your Order</h3>
                        <ul className="space-y-2 max-h-48 overflow-y-auto">
                            {order.order_items.map((item) => (
                                <li
                                    key={item.id}
                                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                                >
                                    <span className="font-medium">{item.products?.name}</span>
                                    <div className="flex items-center gap-4">
                                        <span className="text-gray-500">×{item.qty}</span>
                                        <span className="font-bold">₹{(item.price * item.qty).toFixed(2)}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <Separator />

                    {/* Total */}
                    <div className="flex justify-between items-center text-2xl bg-blue-50 p-4 rounded-xl">
                        <span className="font-semibold">Total</span>
                        <span className="font-bold text-green-600">₹{order.total.toFixed(2)}</span>
                    </div>

                    {/* Payment Section */}
                    {isPendingPayment && (
                        <div className="border-2 border-yellow-400 rounded-xl p-4 bg-yellow-50">
                            {payment.method === "upi" && upiId ? (
                                <div className="text-center">
                                    <h3 className="text-lg font-bold text-yellow-800 mb-3">📱 Scan to Pay</h3>
                                    <UPIQR upiId={upiId} amount={order.total} />
                                    <p className="text-sm text-yellow-700 mt-3">
                                        Scan the QR code with any UPI app
                                    </p>
                                </div>
                            ) : payment.method === "digital" ? (
                                <div className="text-center py-6">
                                    <p className="text-6xl mb-4">💳</p>
                                    <h3 className="text-xl font-bold text-yellow-800">Tap Your Card</h3>
                                    <p className="text-3xl font-bold text-yellow-900 mt-2">₹{order.total.toFixed(2)}</p>
                                </div>
                            ) : payment.method === "cash" ? (
                                <div className="text-center py-6">
                                    <p className="text-6xl mb-4">💵</p>
                                    <h3 className="text-xl font-bold text-yellow-800">Cash Payment</h3>
                                    <p className="text-3xl font-bold text-yellow-900 mt-2">₹{order.total.toFixed(2)}</p>
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-2xl mb-2">⏳</p>
                                    <p className="text-yellow-800">Payment Pending</p>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
