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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { signOut } from "@/lib/actions/auth";
import { exportToPDF, exportToExcel } from "@/lib/utils/export";
import { emailReport } from "@/lib/actions/reports";
import { RoleGuard } from "@/components/auth/role-guard";
import type { OrderWithItems, PosSession, Product } from "@/lib/types/database";

interface ReportsClientProps {
    initialOrders: OrderWithItems[];
    sessions: PosSession[];
    products: Product[];
    userIds: string[];
}

const statusColors: Record<string, string> = {
    open: "bg-gray-500",
    sent: "bg-orange-500",
    preparing: "bg-blue-500",
    completed: "bg-green-500",
    paid: "bg-purple-500",
};

export function ReportsClient({ initialOrders, sessions, products, userIds }: ReportsClientProps) {
    const [orders, setOrders] = useState(initialOrders);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [sessionId, setSessionId] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [responsibleFilter, setResponsibleFilter] = useState("all");
    const [productFilter, setProductFilter] = useState("all");
    const [showEmailDialog, setShowEmailDialog] = useState(false);
    const [emailAddress, setEmailAddress] = useState("");
    const [emailFormat, setEmailFormat] = useState<"pdf" | "excel">("pdf");
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const { toast } = useToast();

    // Get unique categories from products
    const categories = [...new Set(products.map(p => p.category))];

    // Filter orders client-side
    const filteredOrders = orders.filter((order) => {
        if (startDate && new Date(order.created_at) < new Date(startDate)) return false;
        if (endDate && new Date(order.created_at) > new Date(endDate + "T23:59:59")) return false;
        if (sessionId !== "all" && order.session_id !== sessionId) return false;
        if (statusFilter !== "all" && order.status !== statusFilter) return false;
        
        // Responsible filter - filter by user_id through session
        if (responsibleFilter !== "all") {
            const session = sessions.find(s => s.id === order.session_id);
            if (!session || session.user_id !== responsibleFilter) return false;
        }
        
        // Product filter - check if order contains the product
        if (productFilter !== "all") {
            const hasProduct = order.order_items?.some(item => item.product_id === productFilter);
            if (!hasProduct) return false;
        }
        
        return true;
    });

    const totalRevenue = filteredOrders
        .filter((o) => o.status === "paid")
        .reduce((sum, o) => sum + o.total, 0);

    const totalOrders = filteredOrders.length;
    const paidOrders = filteredOrders.filter((o) => o.status === "paid").length;

    function handleExportPDF() {
        exportToPDF({
            orders: filteredOrders,
            summary: { totalOrders, paidOrders, totalRevenue },
            filters: {
                startDate,
                endDate,
                session: sessionId,
                status: statusFilter,
                responsible: responsibleFilter,
                product: productFilter,
            },
        });
    }

    function handleExportExcel() {
        exportToExcel({
            orders: filteredOrders,
            summary: { totalOrders, paidOrders, totalRevenue },
            filters: {
                startDate,
                endDate,
                session: sessionId,
                status: statusFilter,
                responsible: responsibleFilter,
                product: productFilter,
            },
        });
    }

    function handleOpenEmailDialog(format: "pdf" | "excel") {
        setEmailFormat(format);
        setShowEmailDialog(true);
    }

    async function handleSendEmail() {
        if (!emailAddress) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Please enter an email address",
            });
            return;
        }

        setIsSendingEmail(true);

        try {
            const result = await emailReport(
                emailAddress,
                {
                    orders: filteredOrders,
                    summary: { totalOrders, paidOrders, totalRevenue },
                    filters: {
                        startDate,
                        endDate,
                        session: sessionId,
                        status: statusFilter,
                        responsible: responsibleFilter,
                        product: productFilter,
                    },
                },
                emailFormat
            );

            if (result.error) {
                toast({
                    variant: "destructive",
                    title: "Email Failed",
                    description: result.error,
                });
            } else {
                toast({
                    title: "Email Sent",
                    description: `Report sent to ${emailAddress}`,
                });
                setShowEmailDialog(false);
                setEmailAddress("");
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to send email",
            });
        } finally {
            setIsSendingEmail(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Temporarily removed RoleGuard - blocking users */}
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
                    <Button variant="outline" onClick={handleExportPDF}>
                        📄 Export PDF
                    </Button>
                    <Button variant="outline" onClick={handleExportExcel}>
                        📊 Export Excel
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => handleOpenEmailDialog("pdf")}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
                    >
                        📧 Email Report
                    </Button>
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
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
                            <div className="space-y-2">
                                <Label>Responsible</Label>
                                <Select value={responsibleFilter} onValueChange={setResponsibleFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Staff" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Staff</SelectItem>
                                        {userIds.map((userId) => (
                                            <SelectItem key={userId} value={userId}>
                                                Staff #{userId.slice(-6).toUpperCase()}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Product</Label>
                                <Select value={productFilter} onValueChange={setProductFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Products" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Products</SelectItem>
                                        {categories.map((category) => (
                                            <div key={category}>
                                                <div className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100">
                                                    {category}
                                                </div>
                                                {products.filter(p => p.category === category).map((product) => (
                                                    <SelectItem key={product.id} value={product.id}>
                                                        {product.name}
                                                    </SelectItem>
                                                ))}
                                            </div>
                                        ))}
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
                                setResponsibleFilter("all");
                                setProductFilter("all");
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

            {/* Email Report Dialog */}
            <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <span className="text-2xl">📧</span>
                            Email Report
                        </DialogTitle>
                        <DialogDescription>
                            Send the current report to an email address
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {/* Email Input */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="example@email.com"
                                value={emailAddress}
                                onChange={(e) => setEmailAddress(e.target.value)}
                                disabled={isSendingEmail}
                            />
                        </div>

                        {/* Format Selection */}
                        <div className="space-y-2">
                            <Label>Report Format</Label>
                            <Select
                                value={emailFormat}
                                onValueChange={(value) => setEmailFormat(value as "pdf" | "excel")}
                                disabled={isSendingEmail}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pdf">📄 PDF</SelectItem>
                                    <SelectItem value="excel">📊 Excel</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Report Summary */}
                        <div className="bg-blue-50 p-3 rounded-lg space-y-1">
                            <p className="text-sm font-medium text-blue-900">Report Summary:</p>
                            <p className="text-xs text-blue-700">Total Orders: {totalOrders}</p>
                            <p className="text-xs text-blue-700">Paid Orders: {paidOrders}</p>
                            <p className="text-xs text-blue-700">Total Revenue: ₹{totalRevenue.toFixed(2)}</p>
                        </div>

                        {/* Info Message */}
                        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                            <p className="text-xs text-yellow-800">
                                ⚠️ <strong>Note:</strong> Email service requires configuration.
                                See <code className="bg-yellow-100 px-1 rounded">src/lib/actions/reports.ts</code> for setup instructions.
                            </p>
                        </div>
                    </div>
                    <DialogFooter className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowEmailDialog(false);
                                setEmailAddress("");
                            }}
                            disabled={isSendingEmail}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSendEmail}
                            disabled={isSendingEmail || !emailAddress}
                        >
                            {isSendingEmail ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Sending...
                                </>
                            ) : (
                                "Send Email"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
