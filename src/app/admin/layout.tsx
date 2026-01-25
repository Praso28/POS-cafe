"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WaveBackgroundInline } from "@/components/layout/wave-background";

const navItems = [
    { href: "/admin", label: "Dashboard", icon: "📊" },
    { href: "/admin/orders", label: "Orders", icon: "📋" },
    { href: "/admin/products", label: "Products", icon: "☕" },
    { href: "/admin/tables", label: "Tables", icon: "🪑" },
    { href: "/admin/payments", label: "Payment Methods", icon: "💳" },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    // Determine active tab for header
    const activeTab = pathname.startsWith("/admin/orders")
        ? "orders"
        : pathname.startsWith("/admin/products")
            ? "products"
            : undefined;

    return (
        <div className="min-h-screen flex flex-col relative" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
            {/* Wave Background */}
            <WaveBackgroundInline />

            {/* Header */}
            <header className="bg-white/80 backdrop-blur-sm border-b border-white/50 px-6 py-3 flex items-center sticky top-0 z-40">
                <div className="flex items-center gap-6">
                    {/* Logo */}
                    <Link href="/pos" className="flex items-center gap-2">
                        <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center shadow-sm">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </Link>

                    {/* Navigation Tabs */}
                    <nav className="flex items-center gap-1">
                        <NavDropdown
                            label="Orders"
                            isActive={activeTab === "orders"}
                            items={[
                                { href: "/admin/orders", label: "Orders" },
                                { href: "/admin/orders/payments", label: "Payments" },
                            ]}
                        />
                        <NavDropdown
                            label="Products"
                            isActive={activeTab === "products"}
                            items={[
                                { href: "/admin/products", label: "Products" },
                                { href: "/admin/products/category", label: "Categories" },
                            ]}
                        />
                        <NavDropdown
                            label="Reporting"
                            isActive={false}
                            items={[
                                { href: "/reports", label: "Dashboard" },
                            ]}
                        />
                    </nav>
                </div>

                <div className="ml-auto flex items-center gap-3">
                    {/* Notification Bell */}
                    <button className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors">
                        <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </button>

                    {/* Sign Out */}
                    <form action={signOut}>
                        <Button variant="ghost" type="submit" size="sm" className="text-slate-600 hover:text-slate-900 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Sign Out
                        </Button>
                    </form>
                </div>
            </header>

            <div className="flex flex-1">
                {/* Sidebar */}
                <aside className="w-64 bg-white/60 backdrop-blur-sm border-r border-white/50">
                    <nav className="p-4 space-y-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-white/80 transition-all duration-200",
                                    pathname === item.href && "bg-green-50 text-green-700 font-medium border border-green-200 shadow-sm"
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

            {/* Footer */}
            <footer className="py-4 text-center text-slate-400 text-sm">
                Built with <span className="font-medium text-slate-500">Next.js</span> & <span className="font-medium text-slate-500">Supabase</span>
                <span className="mx-2">|</span>
                <span className="text-green-500">◆</span>
            </footer>
        </div>
    );
}

interface NavDropdownProps {
    label: string;
    isActive?: boolean;
    items: { href: string; label: string }[];
}

function NavDropdown({ label, isActive, items }: NavDropdownProps) {
    return (
        <div className="relative group">
            <button
                className={`px-4 py-2 font-medium rounded-lg transition-colors ${isActive
                    ? "text-green-700 bg-green-50 border-b-2 border-green-600"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
            >
                {label}
            </button>
            <div className="absolute left-0 top-full mt-1 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-soft-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 min-w-[160px] py-1">
                {items.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                    >
                        {item.label}
                    </Link>
                ))}
            </div>
        </div>
    );
}
