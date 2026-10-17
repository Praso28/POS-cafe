"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useRealtimeCustomerOrder } from "@/hooks/use-realtime-customer";
import { UPIQR } from "@/components/payments/upi-qr";
import type { OrderWithItems } from "@/lib/types/database";

interface CustomerClientProps {
    orderId: string;
    initialOrder: OrderWithItems | null;
    upiId?: string | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
    open: { label: "Order Placed", color: "bg-gray-500", icon: "📝" },
    sent: { label: "Sent to Kitchen", color: "bg-orange-500", icon: "🔔" },
    preparing: { label: "Being Prepared", color: "bg-blue-500", icon: "👨‍🍳" },
    completed: { label: "Ready!", color: "bg-green-500", icon: "✅" },
    paid: { label: "Paid - Thank You!", color: "bg-purple-500", icon: "💰" },
};

export function CustomerClient({ orderId, initialOrder, upiId }: CustomerClientProps) {
    const { order, payment, isPaymentComplete } = useRealtimeCustomerOrder(orderId, initialOrder);
    const [showThankYou, setShowThankYou] = useState(false);

    // Check if there's a pending payment (customer needs to pay)
    const isPendingPayment = payment && payment.status === "pending";

    // When payment is completed, show thank you message for 5 seconds, then reset
    useEffect(() => {
        if (isPaymentComplete && !showThankYou) {
            setShowThankYou(true);

            // After 5 seconds, the display will show "Ready for Next Order"
            // The showThankYou state controls which view to display
        }
    }, [isPaymentComplete, showThankYou]);

    if (!orderId) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <Card className="w-full max-w-md text-center py-12">
                    <CardContent>
                        <p className="text-6xl mb-4">❓</p>
                        <h2 className="text-2xl font-bold mb-2">No Order ID</h2>
                        <p className="text-gray-500">
                            Please access this page from the POS system or provide an order_id parameter.
                        </p>
                        <p className="text-xs text-gray-400 mt-4">
                            Example: /customer?order_id=your-order-id
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <Card className="w-full max-w-md text-center py-12">
                    <CardContent>
                        <p className="text-6xl mb-4">🔍</p>
                        <h2 className="text-2xl font-bold mb-2">Order Not Found</h2>
                        <p className="text-gray-500">
                            Order ID: {orderId}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                            This order may not exist or has been deleted.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // If payment is complete, show thank you screen then reset
    if (showThankYou) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
                <Card className="w-full max-w-md shadow-xl">
                    <CardContent className="py-16 text-center space-y-6">
                        <div className="mx-auto w-32 h-32 bg-green-500 rounded-full flex items-center justify-center text-7xl shadow-lg animate-bounce">
                            ✅
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-green-700 mb-2">Payment Complete!</h1>
                            <p className="text-xl text-green-600">Thank you for your order</p>
                        </div>
                        {payment && (
                            <div className="bg-white rounded-lg p-4 inline-block">
                                <p className="text-sm text-gray-600">Payment Method</p>
                                <p className="text-lg font-bold text-gray-800">{payment.method.toUpperCase()}</p>
                            </div>
                        )}
                        {order && (
                            <div className="bg-white rounded-lg p-4">
                                <p className="text-sm text-gray-600">Total Paid</p>
                                <p className="text-3xl font-bold text-green-600">₹{order.total.toFixed(2)}</p>
                            </div>
                        )}
                        <div className="pt-4">
                            <p className="text-gray-500 text-sm">Your order is being prepared</p>
                            <p className="text-gray-400 text-xs mt-2">☕ Enjoy your meal!</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const status = statusConfig[order.status] || statusConfig.open;
    const orderNumber = order.id.slice(-4).toUpperCase();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-xl">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto w-20 h-20 bg-white rounded-full flex items-center justify-center text-5xl shadow-md mb-4">
                        {status.icon}
                    </div>
                    <CardTitle className="text-2xl">Order #{orderNumber}</CardTitle>
                    <p className="text-gray-500">{order.tables.name}</p>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Status */}
                    <div className="text-center">
                        <Badge className={`${status.color} text-white text-lg px-4 py-2`}>
                            {status.label}
                        </Badge>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex items-center gap-2">
                        {["sent", "preparing", "completed", "paid"].map((s, i) => (
                            <div
                                key={s}
                                className={`flex-1 h-2 rounded-full ${["sent", "preparing", "completed", "paid"].indexOf(order.status) >= i
                                        ? "bg-blue-500"
                                        : "bg-gray-200"
                                    }`}
                            />
                        ))}
                    </div>

                    <Separator />

                    {/* Order Items */}
                    <div>
                        <h3 className="font-semibold mb-3">Your Order</h3>
                        <ul className="space-y-2">
                            {order.order_items.map((item) => (
                                <li
                                    key={item.id}
                                    className="flex justify-between items-center p-2 bg-gray-50 rounded-lg"
                                >
                                    <span>{item.products.name}</span>
                                    <div className="flex items-center gap-4">
                                        <span className="text-gray-500">×{item.qty}</span>
                                        <span className="font-semibold">₹{(item.price * item.qty).toFixed(2)}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <Separator />

                    {/* Total */}
                    <div className="flex justify-between items-center text-xl">
                        <span className="font-semibold">Total</span>
                        <span className="font-bold text-green-600">₹{order.total.toFixed(2)}</span>
                    </div>

                    {/* Payment Section - Show different UI based on payment state */}
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
                                    <p className="text-sm text-yellow-700 mt-3">
                                        Please tap or insert your card on the terminal
                                    </p>
                                </div>
                            ) : payment.method === "cash" ? (
                                <div className="text-center py-6">
                                    <p className="text-6xl mb-4">💵</p>
                                    <h3 className="text-xl font-bold text-yellow-800">Cash Payment</h3>
                                    <p className="text-3xl font-bold text-yellow-900 mt-2">₹{order.total.toFixed(2)}</p>
                                    <p className="text-sm text-yellow-700 mt-3">
                                        Please give cash to the cashier
                                    </p>
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-2xl mb-2">⏳</p>
                                    <p className="text-yellow-800">Payment Pending</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Footer */}
                    <div className="text-center text-sm text-gray-500 pt-4">
                        <p>This display updates automatically</p>
                        <p className="mt-1">☕ Thank you for your order!</p>
                        <p className="text-xs mt-2 opacity-50">
                            Order ID: {orderId.slice(0, 8)}... | Last update: {new Date().toLocaleTimeString()}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
