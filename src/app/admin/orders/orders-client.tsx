"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { OrderWithItems } from "@/lib/types/database";
import { updateOrderStatus } from "@/lib/actions/orders";

interface OrdersClientProps {
    initialOrders: OrderWithItems[];
}

const statusColors: Record<string, string> = {
    open: "bg-gray-500",
    sent: "bg-orange-500",
    preparing: "bg-blue-500",
    completed: "bg-green-500",
    paid: "bg-purple-500",
};

export function OrdersClient({ initialOrders }: OrdersClientProps) {
    const [orders, setOrders] = useState(initialOrders);
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    // Filter orders by status
    const filteredOrders = orders.filter((order) => {
        if (statusFilter === "all") return true;
        return order.status === statusFilter;
    });

    // Calculate stats
    const totalOrders = filteredOrders.length;
    const openOrders = filteredOrders.filter((o) => o.status === "open").length;
    const activeOrders = filteredOrders.filter((o) => ["sent", "preparing", "completed"].includes(o.status)).length;
    const paidOrders = filteredOrders.filter((o) => o.status === "paid").length;

    async function handleStatusChange(orderId: string, newStatus: "open" | "sent" | "preparing" | "completed" | "paid") {
        const result = await updateOrderStatus(orderId, newStatus);
        if (result.error) {
            toast({ variant: "destructive", title: "Error", description: result.error });
        } else {
            toast({ title: "Success", description: "Order status updated" });
            router.refresh();
        }
    }

    function viewOrderDetails(order: OrderWithItems) {
        setSelectedOrder(order);
        setIsDetailsOpen(true);
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Orders Management</h1>
                <Button variant="outline" onClick={() => router.refresh()}>
                    🔄 Refresh
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-gray-500">Total Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{totalOrders}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-gray-500">Open Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-gray-600">{openOrders}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-gray-500">Active Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-blue-600">{activeOrders}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-gray-500">Paid Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-green-600">{paidOrders}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <div className="space-y-2">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="open">Open</SelectItem>
                                    <SelectItem value="sent">Sent</SelectItem>
                                    <SelectItem value="preparing">Preparing</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="paid">Paid</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => setStatusFilter("all")}
                        >
                            Clear Filter
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Orders Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Orders ({filteredOrders.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order ID</TableHead>
                                <TableHead>Table</TableHead>
                                <TableHead>Items</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredOrders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                        No orders found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredOrders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-mono">
                                            #{order.id.slice(-6).toUpperCase()}
                                        </TableCell>
                                        <TableCell>{order.tables?.name || "N/A"}</TableCell>
                                        <TableCell>
                                            {order.order_items?.length || 0} items
                                        </TableCell>
                                        <TableCell className="font-semibold">
                                            ₹{order.total.toFixed(2)}
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                value={order.status}
                                                onValueChange={(value) => handleStatusChange(order.id, value as any)}
                                            >
                                                <SelectTrigger className="w-[130px]">
                                                    <Badge className={statusColors[order.status]}>
                                                        {order.status}
                                                    </Badge>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="open">Open</SelectItem>
                                                    <SelectItem value="sent">Sent</SelectItem>
                                                    <SelectItem value="preparing">Preparing</SelectItem>
                                                    <SelectItem value="completed">Completed</SelectItem>
                                                    <SelectItem value="paid">Paid</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(order.created_at).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => viewOrderDetails(order)}
                                            >
                                                View Details
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Order Details Dialog */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Order Details</DialogTitle>
                        <DialogDescription>
                            Order #{selectedOrder?.id.slice(-8).toUpperCase()}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedOrder && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Table</p>
                                    <p className="font-medium">{selectedOrder.tables?.name || "N/A"}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Status</p>
                                    <Badge className={statusColors[selectedOrder.status]}>
                                        {selectedOrder.status}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Total</p>
                                    <p className="font-medium text-lg">₹{selectedOrder.total.toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Created At</p>
                                    <p className="font-medium">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500 mb-2">Order Items</p>
                                <div className="border rounded-lg divide-y">
                                    {selectedOrder.order_items?.map((item) => (
                                        <div key={item.id} className="p-3 flex justify-between items-center">
                                            <div>
                                                <p className="font-medium">{item.products?.name}</p>
                                                <p className="text-sm text-gray-500">
                                                    Qty: {item.qty} × ₹{item.price.toFixed(2)}
                                                </p>
                                            </div>
                                            <p className="font-semibold">₹{(item.qty * item.price).toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

