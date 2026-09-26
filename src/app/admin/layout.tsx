"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RoleGuard } from "@/components/auth/role-guard";

const navItems = [
    { href: "/admin", label: "Dashboard", icon: "📊" },
    { href: "/admin/products", label: "Products", icon: "☕" },
    { href: "/admin/floors", label: "Floors", icon: "🏢" },
    { href: "/admin/tables", label: "Tables", icon: "🪑" },
    { href: "/admin/payments", label: "Payments", icon: "💳" },
    { href: "/admin/orders", label: "Orders", icon: "🧾" },
    { href: "/admin/tokens", label: "Tokens", icon: "🔗" },
    { href: "/reports", label: "Reports", icon: "📈" },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <RoleGuard requiredRoles={['admin', 'manager']}>
            <div className="min-h-screen bg-gray-100">
                {/* Header */}
                <header className="bg-white shadow-sm border-b">
                    <div className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-4">
                            <Link href="/" className="text-2xl font-bold text-blue-600">
                                ☕ Café POS
                            </Link>
                            <span className="text-gray-400">|</span>
                            <span className="text-gray-600 font-medium">Admin Panel</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link href="/pos">
                                <Button variant="outline">Go to POS</Button>
                            </Link>
                            <form action={signOut}>
                                <Button variant="ghost" type="submit">
                                    Sign Out
                                </Button>
                            </form>
                        </div>
                    </div>
                </header>

                <div className="flex">
                    {/* Sidebar */}
                    <aside className="w-64 min-h-[calc(100vh-73px)] bg-white border-r">
                        <nav className="p-4 space-y-2">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors",
                                        pathname === item.href && "bg-blue-50 text-blue-700 font-medium"
                                    )}
                                >
                                    <span className="text-xl">{item.icon}</span>
                                    <span>{item.label}</span>
                                </Link>
                            ))}
                        </nav>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 p-6">{children}</main>
                </div>
            </div>
        </RoleGuard>
    );
}
