"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { signOut } from "@/lib/actions/auth";
import { openSession, closeSession } from "@/lib/actions/sessions";
import {
    createOrder,
    getOpenOrderForTable,
    getOrderWithItems,
    addOrderItem,
    updateItemQuantity,
    removeOrderItem,
    sendToKitchen,
} from "@/lib/actions/orders";
import type { Product, CafeTable, PosSession, Order, OrderItem, OrderWithItems } from "@/lib/types/database";
import { PaymentModal } from "@/components/payments/payment-modal";
import type { PaymentMethod } from "@/lib/types/database";

interface POSClientProps {
    products: Product[];
    tables: CafeTable[];
    initialSession: PosSession | null;
    paymentMethods: PaymentMethod[];
    lastSessionData: {
        lastOpenDate: string | null;
        totalSales: number;
    };
}

export function POSClient({ products, tables, initialSession, paymentMethods, lastSessionData }: POSClientProps) {
    const [session, setSession] = useState<PosSession | null>(initialSession);
    const [selectedTable, setSelectedTable] = useState<CafeTable | null>(null);
    const [currentOrder, setCurrentOrder] = useState<OrderWithItems | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const categories = [...new Set(products.filter(p => p.active).map((p) => p.category))];
    const filteredProducts = selectedCategory
        ? products.filter((p) => p.category === selectedCategory && p.active)
        : products.filter(p => p.active);

    useEffect(() => {
        setSelectedCategory(categories[0] || null);
    }, []);

    async function handleOpenSession() {
        setIsLoading(true);
        const result = await openSession();
        if (result.error) {
            toast({ variant: "destructive", title: "Error", description: result.error });
        } else if (result.session) {
            setSession(result.session);
            toast({ title: "Session Started", description: "POS session is now open" });
        }
        setIsLoading(false);
    }

    async function handleCloseSession() {
        if (!session) return;
        if (!confirm("Are you sure you want to close this session?")) return;

        setIsLoading(true);
        const result = await closeSession(session.id);
        if (result.error) {
            toast({ variant: "destructive", title: "Error", description: result.error });
        } else {
            setSession(null);
            setSelectedTable(null);
            setCurrentOrder(null);
            toast({ title: "Session Closed", description: "POS session has been closed" });
        }
        setIsLoading(false);
    }

    async function handleSelectTable(table: CafeTable) {
        if (!session) return;

        setSelectedTable(table);
        setIsLoading(true);

        // Check for existing open order
        const existingOrder = await getOpenOrderForTable(table.id, session.id);
        if (existingOrder) {
            const orderWithItems = await getOrderWithItems(existingOrder.id);
            setCurrentOrder(orderWithItems);
        } else {
            // Create new order
            const result = await createOrder(table.id, session.id);
            if (result.error) {
                toast({ variant: "destructive", title: "Error", description: result.error });
            } else if (result.order) {
                const orderWithItems = await getOrderWithItems(result.order.id);
                setCurrentOrder(orderWithItems);
            }
        }

        setIsLoading(false);
    }

    async function handleAddProduct(product: Product) {
        if (!currentOrder) return;

        const result = await addOrderItem(currentOrder.id, product.id, product.price);
        if (result.error) {
            toast({ variant: "destructive", title: "Error", description: result.error });
        } else {
            const updated = await getOrderWithItems(currentOrder.id);
            setCurrentOrder(updated);
        }
    }

    async function handleUpdateQuantity(item: OrderItem & { products: Product }, delta: number) {
        if (!currentOrder) return;

        const newQty = item.qty + delta;
        const result = await updateItemQuantity(item.id, currentOrder.id, newQty);
        if (result.error) {
            toast({ variant: "destructive", title: "Error", description: result.error });
        } else {
            const updated = await getOrderWithItems(currentOrder.id);
            setCurrentOrder(updated);
        }
    }

    async function handleRemoveItem(itemId: string) {
        if (!currentOrder) return;

        const result = await removeOrderItem(itemId, currentOrder.id);
        if (result.error) {
            toast({ variant: "destructive", title: "Error", description: result.error });
        } else {
            const updated = await getOrderWithItems(currentOrder.id);
            setCurrentOrder(updated);
        }
    }

    async function handleSendToKitchen() {
        if (!currentOrder || currentOrder.order_items.length === 0) {
            toast({ variant: "destructive", title: "Error", description: "Add items before sending to kitchen" });
            return;
        }

        setIsLoading(true);
        const result = await sendToKitchen(currentOrder.id);
        if (result.error) {
            toast({ variant: "destructive", title: "Error", description: result.error });
        } else {
            toast({ title: "Sent to Kitchen", description: "Order has been sent to the kitchen" });
            setSelectedTable(null);
            setCurrentOrder(null);
        }
        setIsLoading(false);
    }

    function handlePaymentComplete() {
        setShowPayment(false);
        setSelectedTable(null);
        setCurrentOrder(null);
        toast({ title: "Payment Complete", description: "Order has been paid" });
        router.refresh();
    }

    // No session view - with top menu and POS terminal card
    if (!session) {
        return (
            <div className="min-h-screen flex flex-col relative" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
                {/* Wave Background - positioned behind content */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
                    {/* Left wave cluster - Blue/Teal/Mint */}
                    <svg
                        className="absolute left-0 top-0 h-full"
                        style={{ width: '60%' }}
                        viewBox="0 0 600 800"
                        preserveAspectRatio="none"
                    >
                        <defs>
                            <linearGradient id="posWaveLeft" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.6" />
                                <stop offset="35%" stopColor="#22d3ee" stopOpacity="0.45" />
                                <stop offset="65%" stopColor="#5eead4" stopOpacity="0.35" />
                                <stop offset="100%" stopColor="#99f6e4" stopOpacity="0.25" />
                            </linearGradient>
                        </defs>
                        {/* Primary wave */}
                        <path
                            d="M0,0 C80,120 120,300 60,480 C0,660 80,780 0,900 L0,0 Z"
                            fill="url(#posWaveLeft)"
                        />
                        {/* Secondary wave */}
                        <path
                            d="M40,0 C140,180 180,400 100,600 C20,800 120,900 40,1000 L0,1000 L0,0 Z"
                            fill="url(#posWaveLeft)"
                            opacity="0.6"
                        />
                        {/* Tertiary wave */}
                        <path
                            d="M80,0 C180,200 220,450 130,650 C40,850 150,920 80,1000 L0,1000 L0,0 Z"
                            fill="url(#posWaveLeft)"
                            opacity="0.35"
                        />
                    </svg>

                    {/* Right wave cluster - Pink/Purple/Lavender */}
                    <svg
                        className="absolute right-0 top-0 h-full"
                        style={{ width: '60%' }}
                        viewBox="0 0 600 800"
                        preserveAspectRatio="none"
                    >
                        <defs>
                            <linearGradient id="posWaveRight" x1="100%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#f0abfc" stopOpacity="0.55" />
                                <stop offset="35%" stopColor="#e879f9" stopOpacity="0.4" />
                                <stop offset="65%" stopColor="#d8b4fe" stopOpacity="0.35" />
                                <stop offset="100%" stopColor="#c4b5fd" stopOpacity="0.25" />
                            </linearGradient>
                        </defs>
                        {/* Primary wave */}
                        <path
                            d="M600,0 C520,120 480,300 540,480 C600,660 520,780 600,900 L600,0 Z"
                            fill="url(#posWaveRight)"
                        />
                        {/* Secondary wave */}
                        <path
                            d="M560,0 C460,180 420,400 500,600 C580,800 480,900 560,1000 L600,1000 L600,0 Z"
                            fill="url(#posWaveRight)"
                            opacity="0.6"
                        />
                        {/* Tertiary wave */}
                        <path
                            d="M520,0 C420,200 380,450 470,650 C560,850 450,920 520,1000 L600,1000 L600,0 Z"
                            fill="url(#posWaveRight)"
                            opacity="0.35"
                        />
                    </svg>

                    {/* Bottom wave accent - connecting element */}
                    <svg
                        className="absolute bottom-0 left-0 w-full"
                        style={{ height: '45%' }}
                        viewBox="0 0 1200 400"
                        preserveAspectRatio="none"
                    >
                        <defs>
                            <linearGradient id="posWaveBottom" x1="0%" y1="100%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.3" />
                                <stop offset="30%" stopColor="#a5f3fc" stopOpacity="0.2" />
                                <stop offset="70%" stopColor="#fae8ff" stopOpacity="0.2" />
                                <stop offset="100%" stopColor="#f5d0fe" stopOpacity="0.3" />
                            </linearGradient>
                        </defs>
                        <path
                            d="M0,400 C150,320 350,360 500,300 C650,240 800,280 950,260 C1100,240 1200,320 1200,280 L1200,400 L0,400 Z"
                            fill="url(#posWaveBottom)"
                        />
                        <path
                            d="M0,400 C200,340 400,380 600,330 C800,280 1000,350 1200,310 L1200,400 L0,400 Z"
                            fill="url(#posWaveBottom)"
                            opacity="0.5"
                        />
                    </svg>
                </div>
                {/* Top Menu Bar */}
                <header className="bg-white/80 backdrop-blur-sm border-b px-6 py-3 flex items-center">
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
                            <button className="text-green-700 font-medium px-3 py-2 border-b-2 border-green-600">
                                Orders
                            </button>
                            <div className="absolute left-0 top-full mt-1 bg-white border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[140px]">
                                <a href="/admin/orders" className="block px-4 py-2 hover:bg-gray-100 text-gray-700">Orders</a>
                                <a href="/admin/orders/payments" className="block px-4 py-2 hover:bg-gray-100 text-gray-700">Payment</a>
                                <a href="/customer" className="block px-4 py-2 hover:bg-gray-100 text-gray-700">Customer</a>
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
                            <button className="text-gray-700 hover:text-gray-900 font-medium px-3 py-2">
                                Reporting
                            </button>
                            <div className="absolute left-0 top-full mt-1 bg-white border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[140px]">
                                <a href="/reports" className="block px-4 py-2 hover:bg-gray-100 text-gray-700">Dashboard</a>
                            </div>
                        </div>
                    </div>
                    <div className="ml-auto flex items-center gap-4">
                        <button className="p-2 hover:bg-gray-100 rounded-full">
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        </button>
                        <form action={signOut}>
                            <Button variant="ghost" type="submit" size="sm" className="text-gray-600 hover:text-gray-900 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                                </svg>
                                Sign Out
                            </Button>
                        </form>
                    </div>
                </header>

                {/* Main Content */}
                <div className="flex-1 flex flex-col items-center justify-center px-8">
                    {/* Welcome Message */}
                    <h1 className="text-4xl font-serif italic text-gray-800 mb-3">Welcome to Your Café POS</h1>
                    <p className="text-gray-500 mb-10">Manage your cafe's POS sessions and start taking orders.</p>

                    {/* POS Terminal Card */}
                    <Card className="w-96 shadow-lg mb-6 bg-white">
                        <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">☕</span>
                                    <CardTitle className="text-lg font-bold text-gray-900">Odoo Cafe</CardTitle>
                                </div>
                                {/* Three dot menu */}
                                <div className="relative group">
                                    <button className="p-1 hover:bg-gray-100 rounded">
                                        <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                        </svg>
                                    </button>
                                    <div className="absolute right-0 top-full mt-1 bg-white border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[160px]">
                                        <a href="/admin" className="block px-4 py-2 hover:bg-gray-100 text-gray-700 border-b">Setting</a>
                                        <a href="/kitchen" className="block px-4 py-2 hover:bg-gray-100 text-gray-700">Kitchen Display</a>
                                        <a href="/customer" className="block px-4 py-2 hover:bg-gray-100 text-gray-700">Customer Display</a>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-sm text-gray-600 space-y-1">
                                <div>
                                    <span className="text-gray-500">Last opened: </span>
                                    <span>{lastSessionData.lastOpenDate
                                        ? new Date(lastSessionData.lastOpenDate).toLocaleDateString('en-GB')
                                        : 'No previous session'}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Last Sale: </span>
                                    <span>₹{lastSessionData.totalSales.toLocaleString()}</span>
                                </div>
                            </div>
                            <Button
                                onClick={handleOpenSession}
                                className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 flex items-center gap-2"
                                disabled={isLoading}
                            >
                                {isLoading ? "Starting..." : "Open Session"}
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Button>
                        </CardContent>
                        {/* Footer Stats inside card */}
                        <div className="flex items-center justify-between px-6 py-4 border-t text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>Last opened: {lastSessionData.lastOpenDate
                                    ? new Date(lastSessionData.lastOpenDate).toLocaleDateString('en-GB')
                                    : 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-green-600 font-bold">₹</span>
                                <span>Last Sell: ₹{lastSessionData.totalSales.toLocaleString()}</span>
                            </div>
                        </div>
                    </Card>

                    {/* Help Text */}
                    <p className="text-gray-400 text-sm">
                        Open a session to start taking orders with your POS terminal.
                    </p>
                </div>

                {/* Footer */}
                <footer className="py-4 text-center text-gray-400 text-sm">
                    Built with <span className="font-medium">Next.js</span> & <span className="font-medium">Supabase</span> | <span className="text-green-600">◆</span>
                </footer>
            </div>
        );
    }

    // Table selection view
    if (!selectedTable) {
        return (
            <div className="min-h-screen flex flex-col relative" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
                {/* Wave Background */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
                    <svg className="absolute left-0 top-0 h-full" style={{ width: '60%' }} viewBox="0 0 600 800" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="tableWaveLeft" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.6" />
                                <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="#99f6e4" stopOpacity="0.25" />
                            </linearGradient>
                        </defs>
                        <path d="M0,0 C80,120 120,300 60,480 C0,660 80,780 0,900 L0,0 Z" fill="url(#tableWaveLeft)" />
                        <path d="M40,0 C140,180 180,400 100,600 C20,800 120,900 40,1000 L0,1000 L0,0 Z" fill="url(#tableWaveLeft)" opacity="0.5" />
                    </svg>
                    <svg className="absolute right-0 top-0 h-full" style={{ width: '60%' }} viewBox="0 0 600 800" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="tableWaveRight" x1="100%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#f0abfc" stopOpacity="0.55" />
                                <stop offset="50%" stopColor="#e879f9" stopOpacity="0.35" />
                                <stop offset="100%" stopColor="#c4b5fd" stopOpacity="0.25" />
                            </linearGradient>
                        </defs>
                        <path d="M600,0 C520,120 480,300 540,480 C600,660 520,780 600,900 L600,0 Z" fill="url(#tableWaveRight)" />
                        <path d="M560,0 C460,180 420,400 500,600 C580,800 480,900 560,1000 L600,1000 L600,0 Z" fill="url(#tableWaveRight)" opacity="0.5" />
                    </svg>
                    <svg className="absolute bottom-0 left-0 w-full" style={{ height: '45%' }} viewBox="0 0 1200 400" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="tableWaveBottom" x1="0%" y1="100%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.25" />
                                <stop offset="50%" stopColor="#a5f3fc" stopOpacity="0.15" />
                                <stop offset="100%" stopColor="#f5d0fe" stopOpacity="0.25" />
                            </linearGradient>
                        </defs>
                        <path d="M0,400 C200,320 400,360 600,310 C800,260 1000,340 1200,290 L1200,400 L0,400 Z" fill="url(#tableWaveBottom)" />
                    </svg>
                </div>
                <header className="bg-white/80 backdrop-blur-sm border-b border-white/50 px-6 py-4 flex items-center justify-between sticky top-0" style={{ zIndex: 10 }}>
                    <div className="flex items-center gap-4">
                        <span className="text-2xl font-bold text-green-600">☕ POS</span>
                        <Badge variant="success">Session Active</Badge>
                    </div>
                    <Button variant="outline" onClick={handleCloseSession} disabled={isLoading}>
                        Close Session
                    </Button>
                </header>

                <div className="p-6 relative" style={{ zIndex: 1 }}>
                    <h1 className="text-2xl font-bold mb-6">Select a Table</h1>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {tables.filter(t => t.active).map((table) => (
                            <Button
                                key={table.id}
                                variant="outline"
                                className="h-24 flex flex-col items-center justify-center text-lg hover:bg-blue-50 hover:border-blue-500"
                                onClick={() => handleSelectTable(table)}
                            >
                                <span className="text-2xl mb-1">🪑</span>
                                <span className="font-semibold">{table.name}</span>
                                <span className="text-sm text-gray-500">{table.seats} seats</span>
                            </Button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Order taking view
    return (
        <div className="min-h-screen flex flex-col relative" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
            {/* Wave Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
                <svg className="absolute left-0 top-0 h-full" style={{ width: '60%' }} viewBox="0 0 600 800" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="orderWaveLeft" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.6" />
                            <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#99f6e4" stopOpacity="0.25" />
                        </linearGradient>
                    </defs>
                    <path d="M0,0 C80,120 120,300 60,480 C0,660 80,780 0,900 L0,0 Z" fill="url(#orderWaveLeft)" />
                    <path d="M40,0 C140,180 180,400 100,600 C20,800 120,900 40,1000 L0,1000 L0,0 Z" fill="url(#orderWaveLeft)" opacity="0.5" />
                </svg>
                <svg className="absolute right-0 top-0 h-full" style={{ width: '60%' }} viewBox="0 0 600 800" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="orderWaveRight" x1="100%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#f0abfc" stopOpacity="0.55" />
                            <stop offset="50%" stopColor="#e879f9" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="#c4b5fd" stopOpacity="0.25" />
                        </linearGradient>
                    </defs>
                    <path d="M600,0 C520,120 480,300 540,480 C600,660 520,780 600,900 L600,0 Z" fill="url(#orderWaveRight)" />
                    <path d="M560,0 C460,180 420,400 500,600 C580,800 480,900 560,1000 L600,1000 L600,0 Z" fill="url(#orderWaveRight)" opacity="0.5" />
                </svg>
                <svg className="absolute bottom-0 left-0 w-full" style={{ height: '45%' }} viewBox="0 0 1200 400" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="orderWaveBottom" x1="0%" y1="100%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.25" />
                            <stop offset="50%" stopColor="#a5f3fc" stopOpacity="0.15" />
                            <stop offset="100%" stopColor="#f5d0fe" stopOpacity="0.25" />
                        </linearGradient>
                    </defs>
                    <path d="M0,400 C200,320 400,360 600,310 C800,260 1000,340 1200,290 L1200,400 L0,400 Z" fill="url(#orderWaveBottom)" />
                </svg>
            </div>
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-sm border-b border-white/50 px-4 py-3 flex items-center justify-between sticky top-0" style={{ zIndex: 10 }}>
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => { setSelectedTable(null); setCurrentOrder(null); }}>
                        ← Back
                    </Button>
                    <Separator orientation="vertical" className="h-8" />
                    <div>
                        <span className="font-semibold text-lg">{selectedTable.name}</span>
                        <Badge variant="outline" className="ml-2">{selectedTable.seats} seats</Badge>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <a href="/kitchen" target="_blank">
                        <Button variant="outline" size="sm">Kitchen Display ↗</Button>
                    </a>
                    {currentOrder && (
                        <a href={`/customer?order_id=${currentOrder.id}`} target="_blank">
                            <Button variant="outline" size="sm" className="text-green-600 border-green-200 hover:bg-green-50">
                                Customer View ↗
                            </Button>
                        </a>
                    )}
                </div>
            </header>

            <div className="flex-1 flex relative" style={{ zIndex: 1 }}>
                {/* Products Grid */}
                <div className="flex-1 p-4">
                    {/* Category Tabs */}
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                        {categories.map((cat) => (
                            <Button
                                key={cat}
                                variant={selectedCategory === cat ? "default" : "outline"}
                                onClick={() => setSelectedCategory(cat)}
                                className="whitespace-nowrap"
                            >
                                {cat}
                            </Button>
                        ))}
                    </div>

                    {/* Products */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {filteredProducts.map((product) => (
                            <Button
                                key={product.id}
                                variant="outline"
                                className="h-24 flex flex-col items-center justify-center p-2 hover:bg-blue-50 hover:border-blue-500"
                                onClick={() => handleAddProduct(product)}
                            >
                                <span className="font-semibold text-center">{product.name}</span>
                                <span className="text-blue-600 font-bold">₹{product.price}</span>
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Order Panel */}
                <div className="w-96 bg-white border-l flex flex-col">
                    <div className="p-4 border-b">
                        <h2 className="font-bold text-lg">Current Order</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        {currentOrder?.order_items.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No items yet. Tap products to add.</p>
                        ) : (
                            <div className="space-y-3">
                                {currentOrder?.order_items.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                        <div className="flex-1">
                                            <p className="font-medium">{item.products.name}</p>
                                            <p className="text-sm text-gray-500">₹{item.price} × {item.qty}</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 w-8 p-0"
                                                onClick={() => handleUpdateQuantity(item, -1)}
                                            >
                                                -
                                            </Button>
                                            <span className="w-8 text-center font-semibold">{item.qty}</span>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 w-8 p-0"
                                                onClick={() => handleUpdateQuantity(item, 1)}
                                            >
                                                +
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                                onClick={() => handleRemoveItem(item.id)}
                                            >
                                                ×
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Order Total & Actions */}
                    <div className="border-t p-4 space-y-4">
                        <div className="flex items-center justify-between text-xl font-bold">
                            <span>Total</span>
                            <span>₹{currentOrder?.total?.toFixed(2) || "0.00"}</span>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                            <Button
                                className="h-14 w-full bg-green-600 hover:bg-green-700 text-lg font-bold"
                                onClick={() => setShowPayment(true)}
                                disabled={!currentOrder?.order_items.length}
                            >
                                Proceed to Payment (₹{currentOrder?.total?.toFixed(2)})
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            {showPayment && currentOrder && (
                <PaymentModal
                    order={currentOrder}
                    paymentMethods={paymentMethods}
                    onClose={() => setShowPayment(false)}
                    onComplete={handlePaymentComplete}
                />
            )}
        </div>
    );
}
