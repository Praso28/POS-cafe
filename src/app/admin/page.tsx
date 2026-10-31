import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProducts } from "@/lib/actions/products";
import { getTables } from "@/lib/actions/tables";
import Link from "next/link";
import { DashboardClient } from "./dashboard-client";

export default async function AdminDashboard() {
    const [products, tables] = await Promise.all([getProducts(), getTables()]);

    const activeProducts = products.filter((p) => p.active).length;
    const activeTables = tables.filter((t) => t.active).length;

    const stats = [
        {
            title: "Total Products",
            value: products.length,
            subtitle: `${activeProducts} active`,
            icon: "☕",
            href: "/admin/products",
        },
        {
            title: "Total Tables",
            value: tables.length,
            subtitle: `${activeTables} active`,
            icon: "🪑",
            href: "/admin/tables",
        },
        {
            title: "Quick Actions",
            value: "→",
            subtitle: "Go to POS",
            icon: "🧾",
            href: "/pos",
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500 mt-1">Overview of your café with analytics</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat) => (
                    <Link key={stat.title} href={stat.href}>
                        <Card className="hover:shadow-md transition-shadow cursor-pointer">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-gray-500">
                                    {stat.title}
                                </CardTitle>
                                <span className="text-2xl">{stat.icon}</span>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">{stat.value}</div>
                                <p className="text-sm text-gray-500 mt-1">{stat.subtitle}</p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Analytics Charts */}
            <DashboardClient />

            <Card>
                <CardHeader>
                    <CardTitle>Quick Setup</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-gray-600">
                        Welcome to your Café POS System! Here's how to get started:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-gray-600">
                        <li>
                            <Link href="/admin/products" className="text-blue-600 hover:underline">
                                Add your products
                            </Link>{" "}
                            (coffee, pastries, etc.)
                        </li>
                        <li>
                            <Link href="/admin/tables" className="text-blue-600 hover:underline">
                                Set up your tables
                            </Link>{" "}
                            (Table 1, Counter, etc.)
                        </li>
                        <li>
                            <Link href="/admin/payments" className="text-blue-600 hover:underline">
                                Configure payment methods
                            </Link>{" "}
                            (Cash, UPI, Cards)
                        </li>
                        <li>
                            <Link href="/pos" className="text-blue-600 hover:underline">
                                Start taking orders
                            </Link>{" "}
                            on the POS terminal
                        </li>
                    </ol>
                </CardContent>
            </Card>
        </div>
    );
}
