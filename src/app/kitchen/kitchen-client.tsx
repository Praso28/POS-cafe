"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { updateOrderStatus } from "@/lib/actions/orders";
import { useRealtimeOrders } from "@/hooks/use-realtime-orders";
import { useToast } from "@/hooks/use-toast";
import type { OrderWithItems } from "@/lib/types/database";

// Format date consistently to avoid hydration mismatch
function formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

interface KitchenClientProps {
    initialOrders: OrderWithItems[];
}

const statusConfig = {
    sent: { label: "To Cook", color: "bg-orange-500", next: "preparing" as const },
    preparing: { label: "Preparing", color: "bg-blue-500", next: "completed" as const },
    completed: { label: "Completed", color: "bg-green-500", next: null },
};

export function KitchenClient({ initialOrders }: KitchenClientProps) {
    const orders = useRealtimeOrders(initialOrders);
    const { toast } = useToast();
    const [currentDate, setCurrentDate] = useState<string>("");

    useEffect(() => {
        setCurrentDate(formatDate(new Date()));
    }, []);

    const sentOrders = orders.filter((o) => o.status === "sent");
    const preparingOrders = orders.filter((o) => o.status === "preparing");
    const completedOrders = orders.filter((o) => o.status === "completed");

    async function handleAdvanceStatus(order: OrderWithItems) {
        const config = statusConfig[order.status as keyof typeof statusConfig];
        if (!config.next) return;

        const result = await updateOrderStatus(order.id, config.next);
        if (result.error) {
            toast({ variant: "destructive", title: "Error", description: result.error });
        }
    }

    function OrderCard({ order }: { order: OrderWithItems }) {
        const config = statusConfig[order.status as keyof typeof statusConfig];
        const orderNumber = order.id.slice(-4).toUpperCase();
        // console.log("order", order);

        return (
            <Card className="mb-4">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Badge className={config.color}>{config.label}</Badge>
                        <span className="font-mono font-bold">#{orderNumber}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                        {formatTime(new Date(order.created_at))}
                    </span>
                </CardHeader>
                <CardContent>
                    <div className="mb-3 pb-2 border-b">
                        <span className="font-semibold text-lg">{order.tables?.name || "Unknown Table"}</span>
                    </div>

                    <ul className="space-y-2 mb-4">
                        {order.order_items.map((item) => (
                            <li key={item.id} className="flex justify-between items-center">
                                <span className="text-lg">{item.products?.name || "Unknown Item"}</span>
                                <Badge variant="outline" className="text-lg px-3">×{item.qty}</Badge>
                            </li>
                        ))}
                    </ul>

                    {config.next && (
                        <Button
                            className="w-full h-12 text-lg"
                            onClick={() => handleAdvanceStatus(order)}
                        >
                            {config.next === "preparing" ? "Start Preparing" : "Mark Complete"}
                        </Button>
                    )}
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Header */}
            <header className="bg-gray-800 px-6 py-4 flex items-center justify-between">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <span className="text-3xl">👨‍🍳</span>
                    Kitchen Display
                </h1>
                <div className="flex items-center gap-4">
                    <Badge variant="outline" className="text-white border-white">
                        Live Updates Active
                    </Badge>
                    <span className="text-gray-400">
                        {currentDate}
                    </span>
                </div>
            </header>

            {/* Order Columns */}
            <div className="grid grid-cols-3 gap-6 p-6 h-[calc(100vh-80px)]">
                {/* To Cook */}
                <div className="bg-gray-800 rounded-xl p-4 overflow-y-auto">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                            To Cook
                        </h2>
                        <Badge variant="secondary">{sentOrders.length}</Badge>
                    </div>
                    {sentOrders.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No orders waiting</p>
                    ) : (
                        sentOrders.map((order) => <OrderCard key={order.id} order={order} />)
                    )}
                </div>

                {/* Preparing */}
                <div className="bg-gray-800 rounded-xl p-4 overflow-y-auto">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                            Preparing
                        </h2>
                        <Badge variant="secondary">{preparingOrders.length}</Badge>
                    </div>
                    {preparingOrders.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">Nothing in progress</p>
                    ) : (
                        preparingOrders.map((order) => <OrderCard key={order.id} order={order} />)
                    )}
                </div>

                {/* Completed */}
                <div className="bg-gray-800 rounded-xl p-4 overflow-y-auto">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                            Ready
                        </h2>
                        <Badge variant="secondary">{completedOrders.length}</Badge>
                    </div>
                    {completedOrders.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No orders ready</p>
                    ) : (
                        completedOrders.map((order) => <OrderCard key={order.id} order={order} />)
                    )}
                </div>
            </div>
        </div>
    );
}
