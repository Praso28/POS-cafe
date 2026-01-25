"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/actions/auth";

interface AppHeaderProps {
    activeTab?: "orders" | "products" | "reporting";
}

/**
 * AppHeader - Themed navigation header with glass effect
 * Used across all main application pages
 */
export function AppHeader({ activeTab }: AppHeaderProps) {
    return (
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
                        isActive={activeTab === "reporting"}
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
            <div className="absolute left-0 top-full mt-1 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 min-w-[160px] py-1">
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

/**
 * AppFooter - Themed footer 
 */
export function AppFooter() {
    return (
        <footer className="py-4 text-center text-slate-400 text-sm">
            Built with <span className="font-medium text-slate-500">Next.js</span> & <span className="font-medium text-slate-500">Supabase</span>
            <span className="mx-2">|</span>
            <span className="text-green-500">◆</span>
        </footer>
    );
}

/**
 * PageWrapper - Full page layout with wave background, header, and footer
 */
export function PageWrapper({
    children,
    activeTab,
    showHeader = true,
    showFooter = true,
}: {
    children: React.ReactNode;
    activeTab?: "orders" | "products" | "reporting";
    showHeader?: boolean;
    showFooter?: boolean;
}) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col relative">
            {/* Wave Background */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                {/* Left wave cluster */}
                <svg className="absolute left-0 top-0 h-full w-[60%]" viewBox="0 0 600 800" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="pageWaveLeft" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.5" />
                            <stop offset="40%" stopColor="#22d3ee" stopOpacity="0.35" />
                            <stop offset="70%" stopColor="#99f6e4" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#67e8f9" stopOpacity="0.15" />
                        </linearGradient>
                    </defs>
                    <path d="M0,0 C80,150 140,350 60,550 C-20,750 80,850 0,900 L0,0 Z" fill="url(#pageWaveLeft)" />
                    <path d="M50,0 C150,200 200,450 100,650 C0,850 120,900 50,950 L0,950 L0,0 Z" fill="url(#pageWaveLeft)" opacity="0.5" />
                    <path d="M100,0 C180,180 230,420 130,620 C30,820 160,880 100,950 L0,950 L0,0 Z" fill="url(#pageWaveLeft)" opacity="0.25" />
                </svg>

                {/* Right wave cluster */}
                <svg className="absolute right-0 top-0 h-full w-[60%]" viewBox="0 0 600 800" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="pageWaveRight" x1="100%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#f0abfc" stopOpacity="0.45" />
                            <stop offset="40%" stopColor="#e879f9" stopOpacity="0.3" />
                            <stop offset="70%" stopColor="#c4b5fd" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#f5d0fe" stopOpacity="0.15" />
                        </linearGradient>
                    </defs>
                    <path d="M600,0 C520,150 460,350 540,550 C620,750 520,850 600,900 L600,0 Z" fill="url(#pageWaveRight)" />
                    <path d="M550,0 C450,200 400,450 500,650 C600,850 480,900 550,950 L600,950 L600,0 Z" fill="url(#pageWaveRight)" opacity="0.5" />
                    <path d="M500,0 C420,180 370,420 470,620 C570,820 440,880 500,950 L600,950 L600,0 Z" fill="url(#pageWaveRight)" opacity="0.25" />
                </svg>

                {/* Bottom wave */}
                <svg className="absolute bottom-0 left-0 w-full h-[40%]" viewBox="0 0 1200 400" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="pageWaveBottom" x1="0%" y1="100%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.2" />
                            <stop offset="30%" stopColor="#67e8f9" stopOpacity="0.15" />
                            <stop offset="70%" stopColor="#f5d0fe" stopOpacity="0.15" />
                            <stop offset="100%" stopColor="#f0abfc" stopOpacity="0.2" />
                        </linearGradient>
                    </defs>
                    <path d="M0,400 C150,340 300,370 450,320 C600,270 750,300 900,280 C1050,260 1150,340 1200,300 L1200,400 L0,400 Z" fill="url(#pageWaveBottom)" />
                    <path d="M0,400 C200,360 400,390 600,350 C800,310 1000,360 1200,330 L1200,400 L0,400 Z" fill="url(#pageWaveBottom)" opacity="0.5" />
                </svg>
            </div>

            {/* Header */}
            {showHeader && <AppHeader activeTab={activeTab} />}

            {/* Main Content */}
            <main className="flex-1">{children}</main>

            {/* Footer */}
            {showFooter && <AppFooter />}
        </div>
    );
}
