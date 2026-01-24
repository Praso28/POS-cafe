"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { signOut } from "@/lib/actions/auth";
import type { OrderWithItems, PosSession } from "@/lib/types/database";

interface ReportsClientProps {
    initialOrders: OrderWithItems[];
    sessions: PosSession[];
}

const statusColors: Record<string, string> = {
    open: "bg-gray-500",
    sent: "bg-orange-500",
    preparing: "bg-blue-500",
    completed: "bg-green-500",
    paid: "bg-purple-500",
};

export function ReportsClient({ initialOrders, sessions }: ReportsClientProps) {
    const [orders, setOrders] = useState(initialOrders);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [sessionId, setSessionId] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

    // Filter orders client-side
    const filteredOrders = orders.filter((order) => {
        if (startDate && new Date(order.created_at) < new Date(startDate)) return false;
        if (endDate && new Date(order.created_at) > new Date(endDate + "T23:59:59")) return false;
        if (sessionId !== "all" && order.session_id !== sessionId) return false;
        if (statusFilter !== "all" && order.status !== statusFilter) return false;
        return true;
    });

    const totalRevenue = filteredOrders
        .filter((o) => o.status === "paid")
        .reduce((sum, o) => sum + o.total, 0);

    const totalOrders = filteredOrders.length;
    const paidOrders = filteredOrders.filter((o) => o.status === "paid").length;

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <header className="bg-white shadow-sm border-b px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-2xl font-bold text-blue-600">
                        ☕ Café POS
                    </Link>
                    <span className="text-gray-400">|</span>
                    <span className="text-gray-600 font-medium">Reports</span>
                </div>
                <div className="flex items-center gap-4">
                    <Link href="/admin">
                        <Button variant="outline">Admin</Button>
                    </Link>
                    <Link href="/pos">
                        <Button variant="outline">POS</Button>
                    </Link>
                    <form action={signOut}>
                        <Button variant="ghost" type="submit">
                            Sign Out
                        </Button>
                    </form>
                </div>
            </header>

            <div className="p-6 space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                            <CardTitle className="text-sm text-gray-500">Paid Orders</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-green-600">{paidOrders}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-gray-500">Total Revenue</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-blue-600">₹{totalRevenue.toFixed(2)}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle>Filters</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label>Start Date</Label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>End Date</Label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Session</Label>
                                <Select value={sessionId} onValueChange={setSessionId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Sessions" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Sessions</SelectItem>
                                        {sessions.map((s) => (
                                            <SelectItem key={s.id} value={s.id}>
                                                {new Date(s.opened_at).toLocaleDateString()} - {s.status}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Statuses" />
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
                        </div>
                        <Button
                            variant="outline"
                            className="mt-4"
                            onClick={() => {
                                setStartDate("");
                                setEndDate("");
                                setSessionId("all");
                                setStatusFilter("all");
                            }}
                        >
                            Clear Filters
                        </Button>
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
                                    <TableHead>Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredOrders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                            No orders found matching the filters
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
                                                <Badge className={statusColors[order.status]}>
                                                    {order.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {new Date(order.created_at).toLocaleString()}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
