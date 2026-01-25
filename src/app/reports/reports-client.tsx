"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { OrderWithItems, PosSession } from "@/lib/types/database";

interface ReportsClientProps {
    initialOrders: OrderWithItems[];
    sessions: PosSession[];
}

// Color palette for the pie chart
const CHART_COLORS = [
    "#3B82F6", // blue
    "#F97316", // orange
    "#22C55E", // green
    "#EAB308", // yellow
    "#EC4899", // pink
    "#8B5CF6", // purple
    "#06B6D4", // cyan
];

export function ReportsClient({ initialOrders, sessions }: ReportsClientProps) {
    const [duration, setDuration] = useState<string>("today");
    const [sessionFilter, setSessionFilter] = useState<string>("all");

    // Calculate date range based on duration
    const dateRange = useMemo(() => {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        switch (duration) {
            case "today":
                return { start: startOfDay, end: now };
            case "weekly":
                const weekStart = new Date(startOfDay);
                weekStart.setDate(weekStart.getDate() - 7);
                return { start: weekStart, end: now };
            case "monthly":
                const monthStart = new Date(startOfDay);
                monthStart.setMonth(monthStart.getMonth() - 1);
                return { start: monthStart, end: now };
            case "yearly":
                const yearStart = new Date(startOfDay);
                yearStart.setFullYear(yearStart.getFullYear() - 1);
                return { start: yearStart, end: now };
            default:
                return { start: new Date(0), end: now };
        }
    }, [duration]);

    // Filter orders based on date range and session
    const filteredOrders = useMemo(() => {
        return initialOrders.filter((order) => {
            const orderDate = new Date(order.created_at);
            if (orderDate < dateRange.start || orderDate > dateRange.end) return false;
            if (sessionFilter !== "all" && order.session_id !== sessionFilter) return false;
            return true;
        });
    }, [initialOrders, dateRange, sessionFilter]);

    // Calculate metrics
    const metrics = useMemo(() => {
        const paidOrders = filteredOrders.filter(o => o.status === "paid" || o.total > 0);
        const totalOrders = filteredOrders.length;
        const revenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
        const avgOrder = totalOrders > 0 ? revenue / totalOrders : 0;

        return { totalOrders, revenue, avgOrder };
    }, [filteredOrders]);

    // Calculate category stats
    const categoryStats = useMemo(() => {
        const stats: Record<string, { qty: number; revenue: number }> = {};

        filteredOrders.forEach(order => {
            order.order_items?.forEach(item => {
                const category = item.products?.category || "Other";
                if (!stats[category]) {
                    stats[category] = { qty: 0, revenue: 0 };
                }
                stats[category].qty += item.qty;
                stats[category].revenue += item.price * item.qty;
            });
        });

        const totalRevenue = Object.values(stats).reduce((sum, s) => sum + s.revenue, 0);

        return Object.entries(stats)
            .map(([name, data]) => ({
                name,
                ...data,
                percentage: totalRevenue > 0 ? Math.round((data.revenue / totalRevenue) * 100) : 0,
            }))
            .sort((a, b) => b.revenue - a.revenue);
    }, [filteredOrders]);

    // Calculate product stats
    const productStats = useMemo(() => {
        const stats: Record<string, { name: string; qty: number; revenue: number }> = {};

        filteredOrders.forEach(order => {
            order.order_items?.forEach(item => {
                const productId = item.product_id;
                const productName = item.products?.name || "Unknown";
                if (!stats[productId]) {
                    stats[productId] = { name: productName, qty: 0, revenue: 0 };
                }
                stats[productId].qty += item.qty;
                stats[productId].revenue += item.price * item.qty;
            });
        });

        return Object.values(stats).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    }, [filteredOrders]);

    // Top orders by total
    const topOrders = useMemo(() => {
        return [...filteredOrders]
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);
    }, [filteredOrders]);

    // Sales by hour for chart
    const salesByHour = useMemo(() => {
        const hourData: Record<string, number> = {};
        const hours = ["9AM", "12PM", "3PM", "6PM", "9PM"];
        hours.forEach(h => hourData[h] = 0);

        filteredOrders.forEach(order => {
            const hour = new Date(order.created_at).getHours();
            if (hour >= 9 && hour < 12) hourData["9AM"] += order.total;
            else if (hour >= 12 && hour < 15) hourData["12PM"] += order.total;
            else if (hour >= 15 && hour < 18) hourData["3PM"] += order.total;
            else if (hour >= 18 && hour < 21) hourData["6PM"] += order.total;
            else if (hour >= 21) hourData["9PM"] += order.total;
        });

        const maxValue = Math.max(...Object.values(hourData), 1);
        return hours.map(hour => ({
            hour,
            value: hourData[hour],
            percentage: (hourData[hour] / maxValue) * 100,
        }));
    }, [filteredOrders]);

    // Pie chart SVG path calculation
    const pieSegments = useMemo(() => {
        if (categoryStats.length === 0) return [];

        let currentAngle = -90; // Start from top
        const segments: { path: string; color: string; name: string; percentage: number }[] = [];

        categoryStats.forEach((cat, index) => {
            const angle = (cat.percentage / 100) * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;

            // Convert to radians
            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;

            const x1 = 50 + 40 * Math.cos(startRad);
            const y1 = 50 + 40 * Math.sin(startRad);
            const x2 = 50 + 40 * Math.cos(endRad);
            const y2 = 50 + 40 * Math.sin(endRad);

            const largeArc = angle > 180 ? 1 : 0;

            const path = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`;

            segments.push({
                path,
                color: CHART_COLORS[index % CHART_COLORS.length],
                name: cat.name,
                percentage: cat.percentage,
            });

            currentAngle = endAngle;
        });

        return segments;
    }, [categoryStats]);

    return (
        <div className="min-h-screen flex flex-col relative" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
            {/* Wave Background - positioned behind content */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
                {/* Left wave cluster - Blue/Teal/Mint */}
                <svg className="absolute left-0 top-0 h-full" style={{ width: '60%' }} viewBox="0 0 600 800" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="reportsWaveLeft" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.6" />
                            <stop offset="35%" stopColor="#22d3ee" stopOpacity="0.45" />
                            <stop offset="65%" stopColor="#5eead4" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="#99f6e4" stopOpacity="0.25" />
                        </linearGradient>
                    </defs>
                    <path d="M0,0 C80,120 120,300 60,480 C0,660 80,780 0,900 L0,0 Z" fill="url(#reportsWaveLeft)" />
                    <path d="M40,0 C140,180 180,400 100,600 C20,800 120,900 40,1000 L0,1000 L0,0 Z" fill="url(#reportsWaveLeft)" opacity="0.6" />
                    <path d="M80,0 C180,200 220,450 130,650 C40,850 150,920 80,1000 L0,1000 L0,0 Z" fill="url(#reportsWaveLeft)" opacity="0.35" />
                </svg>

                {/* Right wave cluster - Pink/Purple/Lavender */}
                <svg className="absolute right-0 top-0 h-full" style={{ width: '60%' }} viewBox="0 0 600 800" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="reportsWaveRight" x1="100%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#f0abfc" stopOpacity="0.55" />
                            <stop offset="35%" stopColor="#e879f9" stopOpacity="0.4" />
                            <stop offset="65%" stopColor="#d8b4fe" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="#c4b5fd" stopOpacity="0.25" />
                        </linearGradient>
                    </defs>
                    <path d="M600,0 C520,120 480,300 540,480 C600,660 520,780 600,900 L600,0 Z" fill="url(#reportsWaveRight)" />
                    <path d="M560,0 C460,180 420,400 500,600 C580,800 480,900 560,1000 L600,1000 L600,0 Z" fill="url(#reportsWaveRight)" opacity="0.6" />
                    <path d="M520,0 C420,200 380,450 470,650 C560,850 450,920 520,1000 L600,1000 L600,0 Z" fill="url(#reportsWaveRight)" opacity="0.35" />
                </svg>

                {/* Bottom wave accent */}
                <svg className="absolute bottom-0 left-0 w-full" style={{ height: '45%' }} viewBox="0 0 1200 400" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="reportsWaveBottom" x1="0%" y1="100%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.3" />
                            <stop offset="30%" stopColor="#a5f3fc" stopOpacity="0.2" />
                            <stop offset="70%" stopColor="#fae8ff" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#f5d0fe" stopOpacity="0.3" />
                        </linearGradient>
                    </defs>
                    <path d="M0,400 C150,320 350,360 500,300 C650,240 800,280 950,260 C1100,240 1200,320 1200,280 L1200,400 L0,400 Z" fill="url(#reportsWaveBottom)" />
                    <path d="M0,400 C200,340 400,380 600,330 C800,280 1000,350 1200,310 L1200,400 L0,400 Z" fill="url(#reportsWaveBottom)" opacity="0.5" />
                </svg>
            </div>
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-sm border-b">
                <div className="px-6 py-3 flex items-center">
                    <div className="flex items-center gap-6">
                        {/* Logo */}
                        <a href="/pos" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </a>
                        <div className="relative group">
                            <button className="text-gray-700 hover:text-gray-900 font-medium px-3 py-2">
                                Orders
                            </button>
                            <div className="absolute left-0 top-full mt-1 bg-white border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[140px]">
                                <a href="/admin/orders" className="block px-4 py-2 hover:bg-gray-100 text-gray-700">Orders</a>
                                <a href="/admin/orders/payments" className="block px-4 py-2 hover:bg-gray-100 text-gray-700">Payment</a>
                            </div>
                        </div>
                        <div className="relative group">
                            <button className="text-gray-700 hover:text-gray-900 font-medium px-3 py-2">
                                Products
                            </button>
                            <div className="absolute left-0 top-full mt-1 bg-white border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[140px]">
                                <a href="/admin/products" className="block px-4 py-2 hover:bg-gray-100 text-gray-700">Products</a>
                                <a href="/admin/products/category" className="block px-4 py-2 hover:bg-gray-100 text-gray-700">Category</a>
                            </div>
                        </div>
                        <div className="relative group">
                            <button className="text-green-700 font-medium px-3 py-2 border-b-2 border-green-600">
                                Reporting
                            </button>
                            <div className="absolute left-0 top-full mt-1 bg-white border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[140px]">
                                <a href="/reports" className="block px-4 py-2 hover:bg-gray-100 text-gray-700">Dashboard</a>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Filter Tabs */}
                <div className="px-6 pb-3 flex items-center gap-4 text-sm">
                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                        Restaurant/Bar
                    </Badge>
                    <Select value={sessionFilter} onValueChange={setSessionFilter}>
                        <SelectTrigger className="w-[150px] h-8">
                            <SelectValue placeholder="Session" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Sessions</SelectItem>
                            {sessions.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                    {new Date(s.opened_at).toLocaleDateString()}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </header>

            <div className="p-6 space-y-6">
                {/* Duration Tabs + Export */}
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                        {[
                            { value: "today", label: "Today" },
                            { value: "weekly", label: "Weekly" },
                            { value: "monthly", label: "Monthly" },
                            { value: "yearly", label: "365 Days" },
                        ].map((opt) => (
                            <Button
                                key={opt.value}
                                variant={duration === opt.value ? "default" : "outline"}
                                size="sm"
                                onClick={() => setDuration(opt.value)}
                                className={duration === opt.value ? "bg-purple-600 hover:bg-purple-700" : ""}
                            >
                                {opt.label}
                            </Button>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm">PDF</Button>
                        <Button variant="outline" size="sm">XLS</Button>
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-l-4 border-l-blue-500">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-gray-500 font-normal">Total order</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-4xl font-bold text-gray-800">{metrics.totalOrders}</p>
                            <p className="text-xs text-green-600 mt-1">↑ 10% Since Last period</p>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-green-500">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-gray-500 font-normal">Revenue</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-4xl font-bold text-gray-800">₹{metrics.revenue.toLocaleString()}</p>
                            <p className="text-xs text-green-600 mt-1">↑ 200% Since Last period</p>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-purple-500">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-gray-500 font-normal">Average Order</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-4xl font-bold text-gray-800">{metrics.avgOrder.toFixed(0)}</p>
                            <p className="text-xs text-red-600 mt-1">↓ 30% Since Last period</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Sales Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Sales</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-48 flex items-end gap-2">
                                {salesByHour.map((item) => (
                                    <div key={item.hour} className="flex-1 flex flex-col items-center">
                                        <div className="w-full bg-gray-100 rounded-t relative" style={{ height: "150px" }}>
                                            <div
                                                className="absolute bottom-0 w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t transition-all"
                                                style={{ height: `${Math.max(item.percentage, 5)}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-gray-500 mt-2">{item.hour}</span>
                                        <span className="text-xs text-gray-700 font-medium">₹{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pie Chart - Top Selling Category */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Top selling Category</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-6">
                                {/* Pie Chart */}
                                <div className="w-40 h-40">
                                    <svg viewBox="0 0 100 100" className="w-full h-full">
                                        {pieSegments.length > 0 ? (
                                            pieSegments.map((seg, i) => (
                                                <path
                                                    key={i}
                                                    d={seg.path}
                                                    fill={seg.color}
                                                    stroke="white"
                                                    strokeWidth="1"
                                                />
                                            ))
                                        ) : (
                                            <circle cx="50" cy="50" r="40" fill="#e5e7eb" />
                                        )}
                                    </svg>
                                </div>
                                {/* Legend */}
                                <div className="flex-1 space-y-2">
                                    {categoryStats.slice(0, 5).map((cat, i) => (
                                        <div key={cat.name} className="flex items-center gap-2 text-sm">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                                            />
                                            <span className="flex-1">{cat.name}</span>
                                            <span className="font-medium">{cat.percentage}%</span>
                                        </div>
                                    ))}
                                    {categoryStats.length === 0 && (
                                        <p className="text-gray-500 text-sm">No data available</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Top Orders Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Top Orders</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-y">
                                <tr>
                                    <th className="p-3 text-left font-medium text-gray-600">Order</th>
                                    <th className="p-3 text-left font-medium text-gray-600">Sessions</th>
                                    <th className="p-3 text-left font-medium text-gray-600">Point of Sale</th>
                                    <th className="p-3 text-left font-medium text-gray-600">Date</th>
                                    <th className="p-3 text-left font-medium text-gray-600">Table</th>
                                    <th className="p-3 text-right font-medium text-gray-600">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topOrders.map((order) => (
                                    <tr key={order.id} className="border-b hover:bg-gray-50">
                                        <td className="p-3 text-blue-600 font-medium">
                                            #{order.id.slice(-6).toUpperCase()}
                                        </td>
                                        <td className="p-3">POS{order.session_id?.slice(-4).toUpperCase()}</td>
                                        <td className="p-3">Shop (Mitchell Admin)</td>
                                        <td className="p-3">{new Date(order.created_at).toLocaleDateString()}</td>
                                        <td className="p-3">{order.tables?.name || "N/A"}</td>
                                        <td className="p-3 text-right font-semibold">₹{order.total.toFixed(2)}</td>
                                    </tr>
                                ))}
                                {topOrders.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-gray-500">
                                            No orders in selected period
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                {/* Bottom Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Top Products */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg underline">Top Product</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <table className="w-full text-sm">
                                <thead className="border-b">
                                    <tr>
                                        <th className="p-3 text-left font-medium text-gray-600">Product</th>
                                        <th className="p-3 text-center font-medium text-gray-600">Qty</th>
                                        <th className="p-3 text-right font-medium text-gray-600">Revenue</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {productStats.map((product) => (
                                        <tr key={product.name} className="border-b">
                                            <td className="p-3">{product.name}</td>
                                            <td className="p-3 text-center">{product.qty}</td>
                                            <td className="p-3 text-right font-semibold">₹{product.revenue.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {productStats.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="p-4 text-center text-gray-500">No data</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>

                    {/* Top Categories */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg underline">Top Category</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <table className="w-full text-sm">
                                <thead className="border-b">
                                    <tr>
                                        <th className="p-3 text-left font-medium text-gray-600">Category</th>
                                        <th className="p-3 text-right font-medium text-gray-600">Revenue</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {categoryStats.map((cat) => (
                                        <tr key={cat.name} className="border-b">
                                            <td className="p-3">{cat.name}</td>
                                            <td className="p-3 text-right font-semibold">₹{cat.revenue.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {categoryStats.length === 0 && (
                                        <tr>
                                            <td colSpan={2} className="p-4 text-center text-gray-500">No data</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
