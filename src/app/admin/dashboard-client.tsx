"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import {
    getSalesOverTime,
    getOrdersByStatus,
    getRevenueBySession,
    getTopSellingProducts,
    getPaymentMethodsDistribution,
    getHourlySalesTrend,
    getTableUtilization,
} from "@/lib/actions/dashboard";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export function DashboardClient() {
    const [salesData, setSalesData] = useState<any[]>([]);
    const [statusData, setStatusData] = useState<any[]>([]);
    const [sessionData, setSessionData] = useState<any[]>([]);
    const [productsData, setProductsData] = useState<any[]>([]);
    const [paymentMethodsData, setPaymentMethodsData] = useState<any[]>([]);
    const [hourlySalesData, setHourlySalesData] = useState<any[]>([]);
    const [tableUtilizationData, setTableUtilizationData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    async function loadData(start?: string, end?: string) {
        setIsLoading(true);
        try {
            const [sales, status, sessions, products, paymentMethods, hourlySales, tableUtil] = await Promise.all([
                getSalesOverTime(start, end),
                getOrdersByStatus(start, end),
                getRevenueBySession(start, end),
                getTopSellingProducts(start, end),
                getPaymentMethodsDistribution(start, end),
                getHourlySalesTrend(start, end),
                getTableUtilization(start, end),
            ]);

            setSalesData(sales);
            setStatusData(status);
            setSessionData(sessions);
            setProductsData(products);
            setPaymentMethodsData(paymentMethods);
            setHourlySalesData(hourlySales);
            setTableUtilizationData(tableUtil);
        } catch (error) {
            console.error("Error loading dashboard data:", error);
        } finally {
            setIsLoading(false);
        }
    }

    function handleApplyFilter() {
        loadData(startDate, endDate);
    }

    function handleResetFilter() {
        setStartDate("");
        setEndDate("");
        loadData();
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Date Range Filter */}
            <Card>
                <CardHeader>
                    <CardTitle>Date Range Filter</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="flex-1 min-w-[200px]">
                            <Label htmlFor="startDate">Start Date</Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <Label htmlFor="endDate">End Date</Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                        <Button onClick={handleApplyFilter}>Apply Filter</Button>
                        <Button variant="outline" onClick={handleResetFilter}>
                            Reset
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Sales Over Time */}
            <Card>
                <CardHeader>
                    <CardTitle>Sales Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={salesData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis yAxisId="left" />
                            <YAxis yAxisId="right" orientation="right" />
                            <Tooltip />
                            <Legend />
                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="revenue"
                                stroke="#10b981"
                                name="Revenue (₹)"
                            />
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="orders"
                                stroke="#3b82f6"
                                name="Orders"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Orders by Status */}
                <Card>
                    <CardHeader>
                        <CardTitle>Orders by Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    dataKey="count"
                                    nameKey="status"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    label
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Top Selling Products */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top Selling Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={productsData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={100} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="quantity" fill="#8b5cf6" name="Quantity Sold" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Revenue by Session */}
            <Card>
                <CardHeader>
                    <CardTitle>Revenue by Session (Top 10)</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={sessionData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="sessionId" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="revenue" fill="#10b981" name="Revenue (₹)" />
                            <Bar dataKey="orderCount" fill="#3b82f6" name="Order Count" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Payment Methods Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle>Payment Methods Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={paymentMethodsData}
                                    dataKey="amount"
                                    nameKey="method"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    label={(entry: any) => `${entry.payload.method}: ₹${entry.payload.amount.toFixed(0)}`}
                                >
                                    {paymentMethodsData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: any) => `₹${value.toFixed(2)}`} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Table Utilization */}
                <Card>
                    <CardHeader>
                        <CardTitle>Table Utilization (Top 10)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={tableUtilizationData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="tableName" type="category" width={100} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="orderCount" fill="#f59e0b" name="Order Count" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Hourly Sales Trend */}
            <Card>
                <CardHeader>
                    <CardTitle>Hourly Sales Trend</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={hourlySalesData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="hour"
                                tickFormatter={(hour) => `${hour}:00`}
                            />
                            <YAxis yAxisId="left" />
                            <YAxis yAxisId="right" orientation="right" />
                            <Tooltip
                                labelFormatter={(hour) => `${hour}:00 - ${hour + 1}:00`}
                            />
                            <Legend />
                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="revenue"
                                stroke="#10b981"
                                name="Revenue (₹)"
                            />
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="orders"
                                stroke="#3b82f6"
                                name="Orders"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}

