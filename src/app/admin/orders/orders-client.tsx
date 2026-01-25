"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { archiveOrder, deleteOrder, bulkArchiveOrders, bulkDeleteOrders } from "@/lib/actions/admin-orders";
import type { OrderWithItems } from "@/lib/types/database";

interface OrdersClientProps {
    orders: OrderWithItems[];
}

export function OrdersClient({ orders }: OrdersClientProps) {
    const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
    const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "paid">("all");
    const [showActions, setShowActions] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    // Map order status to display status (Draft = open/sent/preparing/completed, Paid = paid)
    const getDisplayStatus = (status: string) => {
        return status === "paid" ? "Paid" : "Draft";
    };

    // Filter orders by status
    const filteredOrders = orders.filter((order) => {
        if (statusFilter === "all") return true;
        if (statusFilter === "draft") return order.status !== "paid";
        if (statusFilter === "paid") return order.status === "paid";
        return true;
    });

    // Get session number from session_id (simplified - using first 4 chars)
    const getSessionNumber = (sessionId: string) => {
        return sessionId.slice(0, 4).toUpperCase();
    };

    // Get order number (using index + 1)
    const getOrderNumber = (index: number) => {
        return String(index + 1).padStart(3, "0");
    };

    // Get customer name (placeholder - could be from order data)
    const getCustomerName = () => "Customer";

    // Toggle order selection
    const toggleOrderSelection = (orderId: string) => {
        setSelectedOrders((prev) =>
            prev.includes(orderId)
                ? prev.filter((id) => id !== orderId)
                : [...prev, orderId]
        );
    };

    // Handle archive action
    const handleArchive = async () => {
        if (selectedOrders.length === 0) return;

        const result = await bulkArchiveOrders(selectedOrders);
        if (result.error) {
            toast({ variant: "destructive", title: "Error", description: result.error });
        } else {
            toast({ title: "Archived", description: `${selectedOrders.length} order(s) archived` });
            setSelectedOrders([]);
            router.refresh();
        }
    };

    // Handle delete action
    const handleDelete = async () => {
        if (selectedOrders.length === 0) return;

        // Only allow delete for draft orders
        const draftOrders = selectedOrders.filter((id) => {
            const order = orders.find((o) => o.id === id);
            return order && order.status !== "paid";
        });

        if (draftOrders.length === 0) {
            toast({ variant: "destructive", title: "Error", description: "Can only delete draft orders" });
            return;
        }

        const result = await bulkDeleteOrders(draftOrders);
        if (result.error) {
            toast({ variant: "destructive", title: "Error", description: result.error });
        } else {
            toast({ title: "Deleted", description: `${draftOrders.length} order(s) deleted` });
            setSelectedOrders([]);
            setSelectedOrder(null);
            router.refresh();
        }
    };

    // Calculate order totals
    const calculateSubTotal = (order: OrderWithItems) => {
        return order.order_items.reduce((sum, item) => sum + item.price * item.qty, 0);
    };

    const TAX_RATE = 0.05; // 5% tax

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
                </div>
            </div>

            {/* Sidebar Tabs */}
            <div className="flex gap-1 border-b">
                <button
                    className={`px-4 py-2 text-sm border-b-2 ${statusFilter === "all" ? "border-green-500 text-green-600" : "border-transparent"
                        }`}
                    onClick={() => setStatusFilter("all")}
                >
                    Orders
                </button>
            </div>

            {/* Actions Bar */}
            {selectedOrders.length > 0 && (
                <div className="flex items-center gap-4 p-3 bg-green-50 rounded-lg border border-green-100">
                    <span className="text-sm font-medium text-green-700">
                        {selectedOrders.length} Selected
                    </span>
                    <Button size="sm" variant="outline" onClick={() => setShowActions(!showActions)}>
                        ⚡ Action
                    </Button>
                    {showActions && (
                        <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={handleArchive}>
                                ^ Archived
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-600" onClick={handleDelete}>
                                🗑 Delete
                            </Button>
                        </div>
                    )}
                </div>
            )}

            <div className="flex gap-6">
                {/* Orders Table */}
                <div className="flex-1">
                    <Card className="border-white/40 bg-white/60 backdrop-blur-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg text-slate-800">Orders</CardTitle>
                                <Button size="sm" variant="ghost">☰</Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50/50 border-y">
                                    <tr>
                                        <th className="w-10 p-3 text-left"></th>
                                        <th className="p-3 text-left font-medium text-slate-600">Order No</th>
                                        <th className="p-3 text-left font-medium text-slate-600">Session</th>
                                        <th className="p-3 text-left font-medium text-slate-600">Date</th>
                                        <th className="p-3 text-left font-medium text-slate-600">Total</th>
                                        <th className="p-3 text-left font-medium text-slate-600">Customer</th>
                                        <th className="p-3 text-left font-medium text-slate-600">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrders.map((order, index) => (
                                        <tr
                                            key={order.id}
                                            className={`border-b hover:bg-green-50/50 cursor-pointer transition-colors ${selectedOrder?.id === order.id ? "bg-green-50" : ""
                                                }`}
                                            onClick={() => setSelectedOrder(order)}
                                        >
                                            <td className="p-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedOrders.includes(order.id)}
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        toggleOrderSelection(order.id);
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="accent-green-600"
                                                />
                                            </td>
                                            <td className="p-3 font-medium text-slate-700">{getOrderNumber(index)}</td>
                                            <td className="p-3 text-slate-600">{getSessionNumber(order.session_id)}</td>
                                            <td className="p-3 text-slate-600">
                                                {new Date(order.created_at).toLocaleDateString("en-GB", {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric",
                                                })}
                                            </td>
                                            <td className="p-3 font-medium text-slate-800">₹{order.total.toFixed(0)}</td>
                                            <td className="p-3 text-slate-600">{getCustomerName()}</td>
                                            <td className="p-3">
                                                <span
                                                    className={`px-2 py-1 text-xs rounded font-medium ${order.status === "paid"
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-amber-100 text-amber-700"
                                                        }`}
                                                >
                                                    {getDisplayStatus(order.status)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredOrders.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="p-8 text-center text-slate-500">
                                                No orders found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </div>

                {/* Order Detail Panel */}
                {selectedOrder && (
                    <div className="w-96">
                        <Card className="border-white/40 bg-white/60 backdrop-blur-sm sticky top-24">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-500">Order number</span>
                                    <div className="flex gap-1">
                                        <button
                                            className={`px-3 py-1 text-sm rounded font-medium ${selectedOrder.status !== "paid"
                                                ? "bg-amber-500 text-white"
                                                : "bg-slate-100 text-slate-600"
                                                }`}
                                        >
                                            Draft
                                        </button>
                                        <button
                                            className={`px-3 py-1 text-sm rounded font-medium ${selectedOrder.status === "paid"
                                                ? "bg-green-500 text-white"
                                                : "bg-slate-100 text-slate-600"
                                                }`}
                                        >
                                            Paid
                                        </button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2 text-sm text-slate-600">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Date</span>
                                        <span>{new Date(selectedOrder.created_at).toLocaleDateString("en-GB")}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Session</span>
                                        <span>{getSessionNumber(selectedOrder.session_id)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Customer</span>
                                        <span>{getCustomerName()}</span>
                                    </div>
                                </div>

                                {/* Tabs */}
                                <div className="flex border-b">
                                    <button className="px-3 py-2 text-sm border-b-2 border-green-500 text-green-600 font-medium">
                                        Product
                                    </button>
                                    <button className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700">Extra Info</button>
                                </div>

                                {/* Products Table */}
                                <table className="w-full text-xs">
                                    <thead className="bg-slate-50/50 border-y">
                                        <tr>
                                            <th className="p-2 text-left font-medium text-slate-500">Product</th>
                                            <th className="p-2 text-center font-medium text-slate-500">QTY</th>
                                            <th className="p-2 text-right font-medium text-slate-500">amount</th>
                                            <th className="p-2 text-right font-medium text-slate-500">Tax</th>
                                            <th className="p-2 text-left font-medium text-slate-500">UOM</th>
                                            <th className="p-2 text-right font-medium text-slate-500">Sub-Total</th>
                                            <th className="p-2 text-right font-medium text-slate-500">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedOrder.order_items.map((item) => {
                                            const subtotal = item.price * item.qty;
                                            const tax = subtotal * TAX_RATE;
                                            const total = subtotal + tax;
                                            return (
                                                <tr key={item.id} className="border-b last:border-0 text-slate-600">
                                                    <td className="p-2 text-green-600 font-medium">{item.products.name} →</td>
                                                    <td className="p-2 text-center">{item.qty}</td>
                                                    <td className="p-2 text-right">₹{item.price}</td>
                                                    <td className="p-2 text-right">{(TAX_RATE * 100).toFixed(0)}%</td>
                                                    <td className="p-2">Unit</td>
                                                    <td className="p-2 text-right">₹{subtotal.toFixed(0)}</td>
                                                    <td className="p-2 text-right">₹{total.toFixed(2)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>

                                {/* Totals */}
                                <div className="space-y-1 text-sm border-t pt-3 text-slate-600">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Total w/t</span>
                                        <span>₹{calculateSubTotal(selectedOrder).toFixed(0)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Tax:</span>
                                        <span>₹{(calculateSubTotal(selectedOrder) * TAX_RATE).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-slate-800 text-base">
                                        <span>Final Total</span>
                                        <span>₹{(calculateSubTotal(selectedOrder) * (1 + TAX_RATE)).toFixed(2)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
