"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useRealtimeCustomerOrder } from "@/hooks/use-realtime-customer";
import type { OrderWithItems } from "@/lib/types/database";

interface CustomerClientProps {
    orderId: string;
    initialOrder: OrderWithItems | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
    open: { label: "Order Placed", color: "bg-gray-500", icon: "📝" },
    sent: { label: "Sent to Kitchen", color: "bg-orange-500", icon: "🔔" },
    preparing: { label: "Being Prepared", color: "bg-blue-500", icon: "👨‍🍳" },
    completed: { label: "Ready!", color: "bg-green-500", icon: "✅" },
    paid: { label: "Paid - Thank You!", color: "bg-purple-500", icon: "💰" },
};

export function CustomerClient({ orderId, initialOrder }: CustomerClientProps) {
    const { order, payment } = useRealtimeCustomerOrder(orderId, initialOrder);

    if (!order) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <Card className="w-full max-w-md text-center py-12">
                    <CardContent>
                        <p className="text-6xl mb-4">🔍</p>
                        <h2 className="text-2xl font-bold mb-2">Order Not Found</h2>
                        <p className="text-gray-500">
                            Please check the order ID and try again.
                        </p>
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

                    {/* Payment Status */}
                    {payment && (
                        <div className={`p-4 rounded-lg text-center ${payment.status === "completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                            }`}>
                            <p className="font-semibold">
                                {payment.status === "completed"
                                    ? "✓ Payment Received"
                                    : "⏳ Payment Pending"}
                            </p>
                            <p className="text-sm mt-1">
                                Method: {payment.method.toUpperCase()}
                            </p>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="text-center text-sm text-gray-500 pt-4">
                        <p>This display updates automatically</p>
                        <p className="mt-1">☕ Thank you for your order!</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
