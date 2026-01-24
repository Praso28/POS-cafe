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
}

export function POSClient({ products, tables, initialSession, paymentMethods }: POSClientProps) {
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
            <div className="min-h-screen bg-gray-50 flex flex-col">
                {/* Top Menu Bar */}
                <header className="bg-white border-b px-6 py-3 flex items-center gap-8">
                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            <button className="text-gray-700 hover:text-gray-900 font-medium px-3 py-2">
                                Orders
                            </button>
                            <div className="absolute left-0 top-full mt-1 bg-white border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[140px]">
                                <a href="/admin" className="block px-4 py-2 hover:bg-gray-100 text-gray-700">Orders</a>
                                <a href="/admin/payments" className="block px-4 py-2 hover:bg-gray-100 text-gray-700">Payment</a>
                                <a href="/customer" className="block px-4 py-2 hover:bg-gray-100 text-gray-700">Customer</a>
                            </div>
                        </div>
                        <div className="relative group">
                            <button className="text-gray-700 hover:text-gray-900 font-medium px-3 py-2">
                                Products
                            </button>
                            <div className="absolute left-0 top-full mt-1 bg-white border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[140px]">
                                <a href="/admin/products" className="block px-4 py-2 hover:bg-gray-100 text-gray-700">Products</a>
                                <a href="/admin/products" className="block px-4 py-2 hover:bg-gray-100 text-gray-700">Category</a>
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
                        <form action={signOut}>
                            <Button variant="ghost" type="submit" size="sm">
                                Sign Out
                            </Button>
                        </form>
                    </div>
                </header>

                {/* POS Terminal Card */}
                <div className="flex-1 p-8">
                    <div className="max-w-sm">
                        <Card className="relative">
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <CardTitle className="text-xl font-bold text-gray-900">Odoo Cafe</CardTitle>
                                    {/* Three dot menu */}
                                    <div className="relative group">
                                        <button className="p-1 hover:bg-gray-100 rounded">
                                            <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
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
                            <CardContent className="space-y-3">
                                <div className="text-sm text-gray-600 space-y-1">
                                    <div className="flex gap-2">
                                        <span className="text-gray-500">Last open:</span>
                                        <span>{new Date().toLocaleDateString('en-GB')}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="text-gray-500">Last Sell:</span>
                                        <span>₹5000</span>
                                    </div>
                                </div>
                                <Button
                                    onClick={handleOpenSession}
                                    className="bg-red-500 hover:bg-red-600 text-white font-medium px-6"
                                    disabled={isLoading}
                                >
                                    {isLoading ? "Starting..." : "Open Session"}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    // Table selection view
    if (!selectedTable) {
        return (
            <div className="min-h-screen bg-gray-100">
                <header className="bg-white shadow-sm border-b px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="text-2xl font-bold text-blue-600">☕ POS</span>
                        <Badge variant="success">Session Active</Badge>
                    </div>
                    <Button variant="outline" onClick={handleCloseSession} disabled={isLoading}>
                        Close Session
                    </Button>
                </header>

                <div className="p-6">
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
        <div className="min-h-screen bg-gray-100 flex flex-col">
            {/* Header */}
            <header className="bg-white shadow-sm border-b px-4 py-3 flex items-center justify-between">
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
                            <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                                Customer View ↗
                            </Button>
                        </a>
                    )}
                </div>
            </header>

            <div className="flex-1 flex">
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
