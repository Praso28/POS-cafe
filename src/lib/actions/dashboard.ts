"use server";

import { getDb } from "@/lib/supabase/db";

export async function getDashboardStats(startDate?: string, endDate?: string) {
    const supabase = await getDb();

    // Build date filter
    let dateFilter = {};
    if (startDate && endDate) {
        dateFilter = {
            created_at: {
                gte: startDate,
                lte: endDate,
            },
        };
    }

    // Get orders with date filter
    const { data: orders } = await supabase
        .from("orders")
        .select("id, status, total, created_at, session_id")
        .gte("created_at", startDate || "2000-01-01")
        .lte("created_at", endDate || "2100-12-31")
        .order("created_at", { ascending: true });

    // Get order items for top products
    const { data: orderItems } = await supabase
        .from("order_items")
        .select(`
            id,
            qty,
            product_id,
            order_id,
            products (name)
        `);

    // Get sessions for revenue by session
    const { data: sessions } = await supabase
        .from("pos_sessions")
        .select("id, created_at, status")
        .gte("created_at", startDate || "2000-01-01")
        .lte("created_at", endDate || "2100-12-31")
        .order("created_at", { ascending: true });

    return {
        orders: orders || [],
        orderItems: orderItems || [],
        sessions: sessions || [],
    };
}

export async function getSalesOverTime(startDate?: string, endDate?: string) {
    const { orders } = await getDashboardStats(startDate, endDate);

    // Group orders by date
    const salesByDate: Record<string, { date: string; revenue: number; orders: number }> = {};

    orders.forEach((order: any) => {
        const date = new Date(order.created_at).toISOString().split("T")[0];
        if (!salesByDate[date]) {
            salesByDate[date] = { date, revenue: 0, orders: 0 };
        }
        if (order.status === "paid" || order.status === "completed") {
            salesByDate[date].revenue += order.total || 0;
            salesByDate[date].orders += 1;
        }
    });

    return Object.values(salesByDate).sort((a, b) => a.date.localeCompare(b.date));
}

export async function getOrdersByStatus(startDate?: string, endDate?: string) {
    const { orders } = await getDashboardStats(startDate, endDate);

    const statusCounts: Record<string, number> = {};

    orders.forEach((order: any) => {
        const status = order.status || "unknown";
        statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
    }));
}

export async function getRevenueBySession(startDate?: string, endDate?: string) {
    const { orders, sessions } = await getDashboardStats(startDate, endDate);

    const revenueBySession: Record<string, { sessionId: string; revenue: number; orderCount: number }> = {};

    orders.forEach((order: any) => {
        const sessionId = order.session_id || "unknown";
        if (!revenueBySession[sessionId]) {
            revenueBySession[sessionId] = { sessionId, revenue: 0, orderCount: 0 };
        }
        if (order.status === "paid" || order.status === "completed") {
            revenueBySession[sessionId].revenue += order.total || 0;
            revenueBySession[sessionId].orderCount += 1;
        }
    });

    return Object.values(revenueBySession)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10); // Top 10 sessions
}

export async function getTopSellingProducts(startDate?: string, endDate?: string) {
    const { orderItems } = await getDashboardStats(startDate, endDate);

    const productCounts: Record<string, { name: string; quantity: number }> = {};

    orderItems.forEach((item: any) => {
        const productName = item.products?.name || "Unknown Product";
        if (!productCounts[productName]) {
            productCounts[productName] = { name: productName, quantity: 0 };
        }
        productCounts[productName].quantity += item.qty || 0;
    });

    return Object.values(productCounts)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10); // Top 10 products
}

export async function getPaymentMethodsDistribution(startDate?: string, endDate?: string) {
    const supabase = await getDb();

    const { data: payments } = await supabase
        .from("payments")
        .select("method, amount")
        .gte("created_at", startDate || "2000-01-01")
        .lte("created_at", endDate || "2100-12-31")
        .eq("status", "completed");

    const methodCounts: Record<string, { method: string; count: number; amount: number }> = {};

    (payments || []).forEach((payment: any) => {
        const method = payment.method || "Unknown";
        if (!methodCounts[method]) {
            methodCounts[method] = { method, count: 0, amount: 0 };
        }
        methodCounts[method].count += 1;
        methodCounts[method].amount += payment.amount || 0;
    });

    return Object.values(methodCounts);
}

export async function getHourlySalesTrend(startDate?: string, endDate?: string) {
    const { orders } = await getDashboardStats(startDate, endDate);

    const hourlyData: Record<number, { hour: number; revenue: number; orders: number }> = {};

    // Initialize all hours (0-23)
    for (let i = 0; i < 24; i++) {
        hourlyData[i] = { hour: i, revenue: 0, orders: 0 };
    }

    orders.forEach((order: any) => {
        const hour = new Date(order.created_at).getHours();
        if (order.status === "paid" || order.status === "completed") {
            hourlyData[hour].revenue += order.total || 0;
            hourlyData[hour].orders += 1;
        }
    });

    return Object.values(hourlyData).sort((a, b) => a.hour - b.hour);
}

export async function getTableUtilization(startDate?: string, endDate?: string) {
    const supabase = await getDb();

    const { data: orders } = await supabase
        .from("orders")
        .select("id, table_id, tables(name)")
        .gte("created_at", startDate || "2000-01-01")
        .lte("created_at", endDate || "2100-12-31");

    const tableCounts: Record<string, { tableName: string; orderCount: number }> = {};

    (orders || []).forEach((order: any) => {
        const tableName = order.tables?.name || "Unknown Table";
        if (!tableCounts[tableName]) {
            tableCounts[tableName] = { tableName, orderCount: 0 };
        }
        tableCounts[tableName].orderCount += 1;
    });

    return Object.values(tableCounts)
        .sort((a, b) => b.orderCount - a.orderCount)
        .slice(0, 10); // Top 10 tables
}
