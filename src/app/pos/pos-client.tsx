"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { signOut } from "@/lib/actions/auth";
import { openSession, closeSession, getSessionSummary, type SessionSummary } from "@/lib/actions/sessions";
import { setDisplayOrder, setDisplayIdle, setDisplayThankYou } from "@/lib/actions/customer-display";
import {
    createOrder,
    getOpenOrderForTable,
    getOrderWithItems,
    getOrderBare,
    addOrderItem,
    updateItemQuantity,
    removeOrderItem,
    sendToKitchen,
    cancelOrder,
    updateOrderType,
    updateOrderCustomer,
} from "@/lib/actions/orders";
import { updateTableStatus } from "@/lib/actions/tables";
import { createOrderToken } from "@/lib/actions/order-tokens";
import { getProductVariants } from "@/lib/actions/product-variants";
import type { Product, TableWithFloor, Floor, PosSession, Order, OrderItem, OrderWithItems, OrderToken, ProductVariant, OrderType } from "@/lib/types/database";
import { PaymentModal } from "@/components/payments/payment-modal";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import type { PaymentMethod } from "@/lib/types/database";
import QRCode from "react-qr-code";

interface POSClientProps {
    products: Product[];
    tables: TableWithFloor[];
    floors: Floor[];
    initialSession: PosSession | null;
    paymentMethods: PaymentMethod[];
    defaultTerminalId?: string | null;
}

// Category color mapping
function getCategoryColor(category: string): { bg: string; text: string; border: string } {
    const categoryLower = category.toLowerCase();

    // Predefined color mappings
    if (categoryLower.includes('beverage') || categoryLower.includes('drink') || categoryLower.includes('coffee') || categoryLower.includes('tea')) {
        return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' };
    }
    if (categoryLower.includes('food') || categoryLower.includes('meal') || categoryLower.includes('main')) {
        return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' };
    }
    if (categoryLower.includes('dessert') || categoryLower.includes('sweet') || categoryLower.includes('cake')) {
        return { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-300' };
    }
    if (categoryLower.includes('snack') || categoryLower.includes('appetizer')) {
        return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' };
    }
    if (categoryLower.includes('salad') || categoryLower.includes('healthy')) {
        return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' };
    }

    // Default color for uncategorized
    return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' };
}

// Table status color mapping
function getTableStatusConfig(status?: string): { bg: string; border: string; icon: string; label: string } {
    switch (status) {
        case 'occupied':
            return { bg: 'bg-red-50', border: 'border-red-400', icon: '🔴', label: 'Occupied' };
        case 'reserved':
            return { bg: 'bg-yellow-50', border: 'border-yellow-400', icon: '📅', label: 'Reserved' };
        case 'cleaning':
            return { bg: 'bg-purple-50', border: 'border-purple-400', icon: '🧹', label: 'Cleaning' };
        case 'available':
        default:
            return { bg: 'bg-green-50', border: 'border-green-400', icon: '✅', label: 'Available' };
    }
}

export function POSClient({ products, tables, floors, initialSession, paymentMethods, defaultTerminalId = null }: POSClientProps) {
        function buildOrderWithItems(order: Order, items: OrderItem[]): OrderWithItems {
            const enrichedItems = items.map((item) => {
                const product = products.find((p) => p.id === item.product_id);
                return {
                    ...item,
                    products: product || ({
                        id: item.product_id,
                        name: "Unknown Product",
                        category: "",
                        price: item.price,
                        unit: null,
                        tax: 0,
                        description: null,
                        active: false,
                        created_at: new Date().toISOString(),
                    } as Product),
                };
            });

            return {
                ...(order as OrderWithItems),
                order_items: enrichedItems,
                tables: selectedTable as any,
            } as OrderWithItems;
        }

        function buildEmptyOrder(order: Order): OrderWithItems {
            return {
                ...(order as OrderWithItems),
                order_items: [],
                tables: selectedTable as any,
            } as OrderWithItems;
        }
    const [session, setSession] = useState<PosSession | null>(initialSession);
    const displayTerminalId = session?.terminal_id || defaultTerminalId || null;
    const [selectedTable, setSelectedTable] = useState<TableWithFloor | null>(null);
    const [currentOrder, setCurrentOrder] = useState<OrderWithItems | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isRegisterLoading, setIsRegisterLoading] = useState(false);
    const [isCloseSessionLoading, setIsCloseSessionLoading] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [showRegisterDialog, setShowRegisterDialog] = useState(false);
    const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
    const [showTokenDialog, setShowTokenDialog] = useState(false);
    const [generatedToken, setGeneratedToken] = useState<OrderToken | null>(null);
    const [isGeneratingToken, setIsGeneratingToken] = useState(false);
    const [showVariantDialog, setShowVariantDialog] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [productVariants, setProductVariants] = useState<ProductVariant[]>([]);
    const [isLoadingVariants, setIsLoadingVariants] = useState(false);
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
    // Order details state
    const [showOrderDetailsDialog, setShowOrderDetailsDialog] = useState(false);
    const [orderType, setOrderType] = useState<OrderType>("dine-in");
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [orderNotes, setOrderNotes] = useState("");
    const { toast } = useToast();
    const router = useRouter();

    // Memoize categories to avoid recalculation on every render
    const categories = useMemo(() => {
        return [...new Set(products.filter(p => p.active).map((p) => p.category))];
    }, [products]);

    const filteredProducts = useMemo(() => {
        return selectedCategory
            ? products.filter((p) => p.category === selectedCategory && p.active)
            : products.filter(p => p.active);
    }, [products, selectedCategory]);

    const registerDialog = (
        <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span className="text-2xl">📊</span>
                        Register Overview
                    </DialogTitle>
                    <DialogDescription>
                        Current session details and live statistics
                    </DialogDescription>
                </DialogHeader>
                {session && (
                    <div className="space-y-6">
                        {/* Session Info */}
                        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Session ID:</span>
                                <span className="font-mono text-sm">{session.id.slice(-8).toUpperCase()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Opened At:</span>
                                <span className="font-medium">
                                    {new Date(session.opened_at).toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Status:</span>
                                <Badge variant="success">Active</Badge>
                            </div>
                        </div>

                        {/* Live Stats */}
                        {isRegisterLoading && !sessionSummary ? (
                            <div className="py-8 text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="text-gray-500 mt-4">Loading statistics...</p>
                            </div>
                        ) : sessionSummary ? (
                            <>
                                <Separator />
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                                        <p className="text-3xl font-bold text-blue-600">{sessionSummary.totalOrders}</p>
                                        <p className="text-sm text-gray-600">Total Orders</p>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-lg text-center">
                                        <p className="text-3xl font-bold text-green-600">₹{sessionSummary.totalRevenue.toFixed(2)}</p>
                                        <p className="text-sm text-gray-600">Total Revenue</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                                        <span className="text-gray-700">✅ Paid Orders</span>
                                        <span className="font-bold text-green-600 text-lg">{sessionSummary.paidOrders}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                                        <span className="text-gray-700">⏳ Unpaid Orders</span>
                                        <span className="font-bold text-orange-600 text-lg">{sessionSummary.unpaidOrders}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg">
                                        <span className="text-gray-700">💰 Last Sale</span>
                                        <span className="font-bold text-indigo-600 text-lg">₹{sessionSummary.lastSaleAmount.toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Avg Order Value */}
                                <div className="bg-purple-50 p-4 rounded-lg text-center">
                                    <p className="text-sm text-gray-600 mb-1">Average Order Value</p>
                                    <p className="text-2xl font-bold text-purple-600">
                                        ₹{sessionSummary.averageOrderValue.toFixed(2)}
                                    </p>
                                </div>
                            </>
                        ) : null}
                    </div>
                )}
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setShowRegisterDialog(false)}
                        disabled={isRegisterLoading || isCloseSessionLoading}
                    >
                        Close
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleCloseSession}
                        disabled={isRegisterLoading || isCloseSessionLoading}
                    >
                        {isCloseSessionLoading ? "Closing..." : "Close Session"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );

    useEffect(() => {
        setSelectedCategory(categories[0] || null);
    }, []);

    useEffect(() => {
        if (!session) return;

        const sessionId = session.id;
        let isActive = true;

        async function preloadSummary() {
            setIsRegisterLoading(true);
            try {
                const summary = await getSessionSummary(sessionId);
                if (isActive) {
                    setSessionSummary(summary);
                }
            } catch (error) {
                console.error("Error preloading session summary:", error);
            } finally {
                if (isActive) {
                    setIsRegisterLoading(false);
                }
            }
        }

        preloadSummary();

        return () => {
            isActive = false;
        };
    }, [session]);

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

    async function handleOpenRegisterDialog() {
        if (!session) return;

        // Open dialog immediately
        setShowRegisterDialog(true);
        setIsRegisterLoading(!sessionSummary);

        // Fetch summary in background
        try {
            const summary = await getSessionSummary(session.id);
            setSessionSummary(summary);
        } catch (error) {
            console.error("Error loading session summary:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load session summary"
            });
        } finally {
            setIsRegisterLoading(false);
        }
    }

    async function handleCloseSession() {
        if (!session) return;

        setIsCloseSessionLoading(true);
        const result = await closeSession(session.id);
        if (result.error) {
            toast({ variant: "destructive", title: "Error", description: result.error });
            setIsCloseSessionLoading(false);
        } else {
            // Clear all state
            setSession(null);
            setSelectedTable(null);
            setCurrentOrder(null);
            setShowRegisterDialog(false);
            setSessionSummary(null);

            toast({
                title: "Session Closed",
                description: "POS session has been closed successfully"
            });

            if (displayTerminalId) {
                await setDisplayIdle(displayTerminalId);
            }

            // Refresh the page to show the "Open Session" screen
            router.refresh();
            setIsCloseSessionLoading(false);
        }
    }

    async function handleGenerateToken() {
        if (!selectedTable || !session) return;

        setIsGeneratingToken(true);
        setShowTokenDialog(true);

        try {
            const result = await createOrderToken(selectedTable.id, session.id, 24);
            if (result.error || !result.token) {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: result.error || "Failed to generate token"
                });
                setShowTokenDialog(false);
            } else {
                setGeneratedToken(result.token);
                toast({
                    title: "QR Code Generated",
                    description: "Self-ordering token created successfully"
                });
            }
        } catch (error) {
            console.error("Error generating token:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to generate token"
            });
            setShowTokenDialog(false);
        } finally {
            setIsGeneratingToken(false);
        }
    }

    function handleCopyLink() {
        if (!generatedToken) return;

        const orderUrl = `${window.location.origin}/order/${generatedToken.token}`;
        navigator.clipboard.writeText(orderUrl);
        toast({
            title: "Link Copied",
            description: "Order link copied to clipboard"
        });
    }

    function formatExpiryTime(expiresAt: string | null): string {
        if (!expiresAt) return "No expiry";

        const expiry = new Date(expiresAt);
        const now = new Date();
        const diffMs = expiry.getTime() - now.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        if (diffHours >= 24) {
            const days = Math.floor(diffHours / 24);
            return `Expires in ${days} day${days > 1 ? 's' : ''}`;
        } else if (diffHours > 0) {
            return `Expires in ${diffHours} hour${diffHours > 1 ? 's' : ''} ${diffMinutes} min`;
        } else if (diffMinutes > 0) {
            return `Expires in ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
        } else {
            return `Expires at ${expiry.toLocaleTimeString()}`;
        }
    }

    async function handleSelectTable(table: TableWithFloor) {
        if (!session) {
            toast({ variant: "destructive", title: "Error", description: "No active session. Please start a session first." });
            return;
        }

        setIsLoading(true);

        try {
            // Check for existing open order
            const existingOrder = await getOpenOrderForTable(table.id);
            if (existingOrder) {
                const orderWithItems = await getOrderWithItems(existingOrder.id);
                if (!orderWithItems) {
                    const fallback = await getOrderBare(existingOrder.id);
                    if (fallback.error || !fallback.order) {
                        console.warn("Fallback load failed, using minimal order:", fallback.error);
                        setSelectedTable(table);
                        setCurrentOrder(buildEmptyOrder(existingOrder as Order));
                        if (displayTerminalId) {
                            await setDisplayOrder(displayTerminalId, existingOrder.id);
                        }
                        return;
                    }
                    setSelectedTable(table);
                    setCurrentOrder(buildOrderWithItems(fallback.order, fallback.items));
                    return;
                }
                setSelectedTable(table);
                setCurrentOrder(orderWithItems);
                if (displayTerminalId) {
                    await setDisplayOrder(displayTerminalId, orderWithItems.id);
                }
                return;
            }

            // Create new order
            const result = await createOrder(table.id, session.id);
            if (result.error) {
                toast({ variant: "destructive", title: "Error", description: result.error });
                return;
            }
            if (result.order) {
                const orderWithItems = await getOrderWithItems(result.order.id);
                if (!orderWithItems) {
                    const fallback = await getOrderBare(result.order.id);
                    if (fallback.error || !fallback.order) {
                        console.warn("Fallback load failed, using minimal order:", fallback.error);
                        setSelectedTable(table);
                        setCurrentOrder(buildEmptyOrder(result.order));
                        if (displayTerminalId) {
                            await setDisplayOrder(displayTerminalId, result.order.id);
                        }
                        return;
                    }
                    setSelectedTable(table);
                    setCurrentOrder(buildOrderWithItems(fallback.order, fallback.items));
                    return;
                }
                setSelectedTable(table);
                setCurrentOrder(orderWithItems);
                if (displayTerminalId) {
                    await setDisplayOrder(displayTerminalId, orderWithItems.id);
                }
            }
        } finally {
            setIsLoading(false);
        }
    }

    async function handleAddProduct(product: Product) {
        if (!currentOrder) return;

        // Check if product has variants
        setIsLoadingVariants(true);
        const variants = await getProductVariants(product.id);
        setIsLoadingVariants(false);

        if (variants.length > 0) {
            // Show variant selection dialog
            setSelectedProduct(product);
            setProductVariants(variants);
            setSelectedVariant(null);
            setShowVariantDialog(true);
        } else {
            // Add product directly without variant
            await addProductToOrder(product, null, null);
        }
    }

    async function addProductToOrder(
        product: Product,
        variantId: string | null,
        variantLabel: string | null
    ) {
        if (!currentOrder) return;

        const price = variantId
            ? product.price + (productVariants.find(v => v.id === variantId)?.extra_price || 0)
            : product.price;

        const result = await addOrderItem(
            currentOrder.id,
            product.id,
            price,
            variantId,
            variantLabel
        );

        if (result.error) {
            toast({ variant: "destructive", title: "Error", description: result.error });
        } else {
            const updated = await getOrderWithItems(currentOrder.id);
            if (!updated) {
                const fallback = await getOrderBare(currentOrder.id);
                if (fallback.order) {
                    setCurrentOrder(buildOrderWithItems(fallback.order, fallback.items));
                }
            } else {
                setCurrentOrder(updated);
                if (displayTerminalId) {
                    await setDisplayOrder(displayTerminalId, updated.id);
                }
            }
            toast({
                title: "Item Added",
                description: variantLabel
                    ? `${product.name} - ${variantLabel}`
                    : product.name,
                duration: 1500,
            });
        }
    }

    function handleConfirmVariant() {
        if (!selectedProduct) return;

        const variant = selectedVariant;
        const variantLabel = variant
            ? `${variant.attribute_name}: ${variant.attribute_value}`
            : null;

        addProductToOrder(selectedProduct, variant?.id || null, variantLabel);
        setShowVariantDialog(false);
        setSelectedProduct(null);
        setProductVariants([]);
        setSelectedVariant(null);
    }

    function handleSkipVariant() {
        if (!selectedProduct) return;

        addProductToOrder(selectedProduct, null, null);
        setShowVariantDialog(false);
        setSelectedProduct(null);
        setProductVariants([]);
        setSelectedVariant(null);
    }

    async function handleUpdateQuantity(item: OrderItem & { products: Product }, delta: number) {
        if (!currentOrder) return;

        const newQty = item.qty + delta;
        const result = await updateItemQuantity(item.id, currentOrder.id, newQty);
        if (result.error) {
            toast({ variant: "destructive", title: "Error", description: result.error });
        } else {
            const updated = await getOrderWithItems(currentOrder.id);
            if (!updated) {
                const fallback = await getOrderBare(currentOrder.id);
                if (fallback.order) {
                    setCurrentOrder(buildOrderWithItems(fallback.order, fallback.items));
                }
            } else {
                setCurrentOrder(updated);
            }
        }
    }

    async function handleRemoveItem(itemId: string) {
        if (!currentOrder) return;

        const result = await removeOrderItem(itemId, currentOrder.id);
        if (result.error) {
            toast({ variant: "destructive", title: "Error", description: result.error });
        } else {
            const updated = await getOrderWithItems(currentOrder.id);
            if (!updated) {
                const fallback = await getOrderBare(currentOrder.id);
                if (fallback.order) {
                    setCurrentOrder(buildOrderWithItems(fallback.order, fallback.items));
                }
            } else {
                setCurrentOrder(updated);
            }
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
            resetOrderDetails();
        }
        setIsLoading(false);
    }

    // Reset order details form
    function resetOrderDetails() {
        setOrderType("dine-in");
        setCustomerName("");
        setCustomerPhone("");
        setOrderNotes("");
    }

    // Cancel current order
    async function handleCancelOrder() {
        if (!currentOrder) return;

        if (!confirm("Are you sure you want to cancel this order? All items will be removed.")) {
            return;
        }

        setIsLoading(true);
        const result = await cancelOrder(currentOrder.id);
        if (result.error) {
            toast({ variant: "destructive", title: "Error", description: result.error });
        } else {
            toast({ title: "Order Cancelled", description: "The order has been cancelled" });
            setSelectedTable(null);
            setCurrentOrder(null);
            resetOrderDetails();
            router.refresh();
        }
        setIsLoading(false);
    }

    // Update order type
    async function handleOrderTypeChange(newType: OrderType) {
        setOrderType(newType);
        if (currentOrder) {
            await updateOrderType(currentOrder.id, newType);
        }
    }

    // Update customer details
    async function handleSaveOrderDetails() {
        if (!currentOrder) return;

        await updateOrderCustomer(currentOrder.id, customerName, customerPhone, orderNotes);
        await updateOrderType(currentOrder.id, orderType);
        
        toast({ title: "Order Updated", description: "Order details saved successfully" });
        setShowOrderDetailsDialog(false);
        
        // Refresh order
        const updated = await getOrderWithItems(currentOrder.id);
        if (!updated) {
            const fallback = await getOrderBare(currentOrder.id);
            if (fallback.order) {
                setCurrentOrder(buildOrderWithItems(fallback.order, fallback.items));
            }
        } else {
            setCurrentOrder(updated);
        }
    }

    async function handlePaymentComplete() {
        setShowPayment(false);

        // After payment, automatically send order to kitchen
        // Flow: open -> (payment) -> paid -> sent (to kitchen) -> preparing -> completed
        if (currentOrder) {
            if (displayTerminalId) {
                await setDisplayThankYou(displayTerminalId);
            }
            const result = await sendToKitchen(currentOrder.id);
            if (result.error) {
                toast({
                    variant: "destructive",
                    title: "Payment Complete but Kitchen Send Failed",
                    description: result.error
                });
            } else {
                toast({
                    title: "✅ Payment Complete",
                    description: "Order paid and sent to kitchen!"
                });
            }
        }

        setSelectedTable(null);
        setCurrentOrder(null);
        router.refresh();
    }

    // No session view
    if (!session) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <Card className="w-full max-w-md mx-4">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4">
                            <span className="text-4xl">☕</span>
                        </div>
                        <CardTitle className="text-2xl">POS Terminal</CardTitle>
                        <p className="text-gray-500">Start a session to begin taking orders</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button
                            onClick={handleOpenSession}
                            className="w-full h-14 text-lg"
                            disabled={isLoading}
                        >
                            {isLoading ? "Starting..." : "Start POS Session"}
                        </Button>
                        <div className="flex gap-2">
                            <Button variant="outline" className="flex-1" asChild>
                                <a href="/admin">Admin Panel</a>
                            </Button>
                            <form action={signOut} className="flex-1">
                                <Button variant="ghost" type="submit" className="w-full">
                                    Sign Out
                                </Button>
                            </form>
                        </div>
                    </CardContent>
                </Card>
                {registerDialog}
            </div>
        );
    }

    // Table selection view
    if (!selectedTable) {
        const activeTables = tables.filter(t => t.active);
        const filteredTables = selectedFloor
            ? activeTables.filter(t => t.floor_id === selectedFloor)
            : activeTables;
        
        // Group tables by floor
        const tablesByFloor: { [key: string]: TableWithFloor[] } = {};
        const noFloorTables: TableWithFloor[] = [];
        
        activeTables.forEach(table => {
            if (table.floor_id && table.floors) {
                if (!tablesByFloor[table.floor_id]) {
                    tablesByFloor[table.floor_id] = [];
                }
                tablesByFloor[table.floor_id].push(table);
            } else {
                noFloorTables.push(table);
            }
        });

        return (
            <div className="min-h-screen bg-gray-100">
                <header className="bg-white shadow-sm border-b px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="text-2xl font-bold text-blue-600">☕ POS</span>
                        <Badge variant="success">Session Active</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                        {selectedTable && (
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSelectedTable(null);
                                    setCurrentOrder(null);
                                }}
                                size="sm"
                            >
                                🪑 Table
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            onClick={handleOpenRegisterDialog}
                            size="sm"
                            disabled={isRegisterLoading || isCloseSessionLoading}
                        >
                            {isRegisterLoading ? "Loading..." : "📊 Register / Close"}
                        </Button>
                        <a href="/admin">
                            <Button variant="outline" size="sm">⚙️ Back-end</Button>
                        </a>
                        <a href="/kitchen" target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm">👨‍🍳 Kitchen</Button>
                        </a>
                    </div>
                </header>

                <div className="p-6">
                    <div className="mb-6 flex items-center justify-between">
                        <h1 className="text-2xl font-bold">Select a Table</h1>
                        {floors.length > 0 && (
                            <div className="flex gap-2">
                                <Button
                                    variant={selectedFloor === null ? "default" : "outline"}
                                    onClick={() => setSelectedFloor(null)}
                                    size="sm"
                                >
                                    All Floors
                                </Button>
                                {floors.filter(f => f.active).map((floor) => (
                                    <Button
                                        key={floor.id}
                                        variant={selectedFloor === floor.id ? "default" : "outline"}
                                        onClick={() => setSelectedFloor(floor.id)}
                                        size="sm"
                                    >
                                        {floor.name}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>

                    {selectedFloor ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {filteredTables.map((table) => {
                                const statusConfig = getTableStatusConfig(table.status);
                                return (
                                    <Button
                                        key={table.id}
                                        variant="outline"
                                        className={`h-28 flex flex-col items-center justify-center text-lg border-2 transition-all ${statusConfig.bg} ${statusConfig.border} hover:shadow-lg`}
                                        onClick={() => handleSelectTable(table)}
                                    >
                                        <span className="text-2xl mb-1">{statusConfig.icon}</span>
                                        <span className="font-semibold">{table.name}</span>
                                        <span className="text-sm text-gray-500">{table.seats} seats</span>
                                        <span className="text-xs mt-1 text-gray-400">{statusConfig.label}</span>
                                    </Button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {Object.keys(tablesByFloor).map((floorId) => {
                                const floor = floors.find(f => f.id === floorId);
                                if (!floor) return null;
                                return (
                                    <div key={floorId}>
                                        <h2 className="text-lg font-semibold mb-3 text-gray-700">
                                            {floor.name}
                                        </h2>
                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                            {tablesByFloor[floorId].map((table) => {
                                                const statusConfig = getTableStatusConfig(table.status);
                                                return (
                                                    <Button
                                                        key={table.id}
                                                        variant="outline"
                                                        className={`h-28 flex flex-col items-center justify-center text-lg border-2 transition-all ${statusConfig.bg} ${statusConfig.border} hover:shadow-lg`}
                                                        onClick={() => handleSelectTable(table)}
                                                    >
                                                        <span className="text-2xl mb-1">{statusConfig.icon}</span>
                                                        <span className="font-semibold">{table.name}</span>
                                                        <span className="text-sm text-gray-500">{table.seats} seats</span>
                                                        <span className="text-xs mt-1 text-gray-400">{statusConfig.label}</span>
                                                    </Button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                            {noFloorTables.length > 0 && (
                                <div>
                                    <h2 className="text-lg font-semibold mb-3 text-gray-700">
                                        Other Tables
                                    </h2>
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                        {noFloorTables.map((table) => {
                                            const statusConfig = getTableStatusConfig(table.status);
                                            return (
                                                <Button
                                                    key={table.id}
                                                    variant="outline"
                                                    className={`h-28 flex flex-col items-center justify-center text-lg border-2 transition-all ${statusConfig.bg} ${statusConfig.border} hover:shadow-lg`}
                                                    onClick={() => handleSelectTable(table)}
                                                >
                                                    <span className="text-2xl mb-1">{statusConfig.icon}</span>
                                                    <span className="font-semibold">{table.name}</span>
                                                    <span className="text-sm text-gray-500">{table.seats} seats</span>
                                                    <span className="text-xs mt-1 text-gray-400">{statusConfig.label}</span>
                                                </Button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                {registerDialog}
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
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateToken}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
                    >
                        📱 Generate QR Code
                    </Button>
                    {currentOrder && (
                        <a href={`/customer?order_id=${currentOrder.id}`} target="_blank">
                            <Button variant="outline" size="sm">📺 Customer ↗</Button>
                        </a>
                    )}
                    <a href="/admin">
                        <Button variant="outline" size="sm">⚙️ Back-end</Button>
                    </a>
                    <a href="/kitchen" target="_blank">
                        <Button variant="outline" size="sm">👨‍🍳 Kitchen ↗</Button>
                    </a>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleOpenRegisterDialog}
                        disabled={isRegisterLoading || isCloseSessionLoading}
                    >
                        {isRegisterLoading ? "Loading..." : "📊 Register / Close"}
                    </Button>
                </div>
            </header>

            <div className="flex-1 flex">
                {/* Products Grid */}
                <div className="flex-1 p-4">
                    {!currentOrder && (
                        <div className="mb-4 p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800">
                            No active order for this table. Please go back and select the table again.
                        </div>
                    )}
                    {/* Category Tabs with Color Badges */}
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                        {categories.map((cat) => {
                            const colors = getCategoryColor(cat);
                            const isSelected = selectedCategory === cat;
                            return (
                                <Button
                                    key={cat}
                                    variant="outline"
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`whitespace-nowrap border-2 transition-all ${
                                        isSelected
                                            ? `${colors.bg} ${colors.border} ${colors.text} font-semibold shadow-md`
                                            : `hover:${colors.bg} ${colors.text} border-gray-300`
                                    }`}
                                >
                                    <Badge className={`mr-2 ${colors.bg} ${colors.text} border ${colors.border}`}>
                                        {products.filter(p => p.category === cat && p.active).length}
                                    </Badge>
                                    {cat}
                                </Button>
                            );
                        })}
                    </div>

                    {/* Products with Category Badges */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {filteredProducts.map((product) => {
                            const colors = getCategoryColor(product.category);
                            return (
                                <Button
                                    key={product.id}
                                    variant="outline"
                                    className={`h-28 flex flex-col items-center justify-center p-2 hover:${colors.bg} hover:border-2 hover:${colors.border} relative`}
                                    onClick={() => handleAddProduct(product)}
                                >
                                    <Badge className={`absolute top-1 right-1 text-xs ${colors.bg} ${colors.text} border ${colors.border}`}>
                                        {product.category}
                                    </Badge>
                                    <span className="font-semibold text-center mt-2">{product.name}</span>
                                    <span className="text-blue-600 font-bold">₹{product.price}</span>
                                </Button>
                            );
                        })}
                    </div>
                </div>

                {/* Order Panel */}
                <div className="w-96 bg-white border-l flex flex-col">
                    <div className="p-4 border-b">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="font-bold text-lg">Current Order</h2>
                            {currentOrder && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowOrderDetailsDialog(true)}
                                    className="text-blue-600 hover:text-blue-800"
                                >
                                    ✏️ Details
                                </Button>
                            )}
                        </div>
                        {/* Order Type Selector */}
                        {currentOrder && (
                            <div className="flex gap-1 flex-wrap">
                                {(["dine-in", "takeaway", "pickup", "delivery"] as OrderType[]).map((type) => (
                                    <Button
                                        key={type}
                                        variant={orderType === type ? "default" : "outline"}
                                        size="sm"
                                        className="text-xs capitalize"
                                        onClick={() => handleOrderTypeChange(type)}
                                    >
                                        {type === "dine-in" && "🍽️ "}
                                        {type === "takeaway" && "🥡 "}
                                        {type === "pickup" && "🚶 "}
                                        {type === "delivery" && "🚗 "}
                                        {type.replace("-", " ")}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        {currentOrder?.order_items.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No items yet. Tap products to add.</p>
                        ) : (
                            <div className="space-y-3">
                                {currentOrder?.order_items.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                        <div className="flex-1">
                                            <p className="font-medium">
                                                {item.products.name}
                                                {item.variant_label && (
                                                    <span className="text-blue-600 text-sm ml-1">
                                                        - {item.variant_label}
                                                    </span>
                                                )}
                                            </p>
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

                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant="outline"
                                className="h-14"
                                onClick={handleSendToKitchen}
                                disabled={isLoading || !currentOrder?.order_items.length}
                            >
                                🍳 Kitchen
                            </Button>
                            <Button
                                className="h-14"
                                onClick={() => setShowPayment(true)}
                                disabled={!currentOrder?.order_items.length}
                            >
                                💳 Payment
                            </Button>
                        </div>

                        {/* Cancel Order Button */}
                        <Button
                            variant="ghost"
                            className="w-full text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={handleCancelOrder}
                            disabled={isLoading}
                        >
                            ❌ Cancel Order
                        </Button>
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

            {registerDialog}

            {/* Token Generation Dialog */}
            <Dialog open={showTokenDialog} onOpenChange={setShowTokenDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <span className="text-2xl">📱</span>
                            Self-Ordering QR Code
                        </DialogTitle>
                        <DialogDescription>
                            Share this QR code with customers for self-ordering
                        </DialogDescription>
                    </DialogHeader>
                    {isGeneratingToken && !generatedToken ? (
                        <div className="py-8 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-gray-500 mt-4">Generating QR code...</p>
                        </div>
                    ) : generatedToken ? (
                        <div className="space-y-4">
                            {/* QR Code Display */}
                            <div className="flex justify-center p-6 bg-white rounded-lg border-2 border-gray-200">
                                <QRCode
                                    value={`${window.location.origin}/order/${generatedToken.token}`}
                                    size={200}
                                />
                            </div>

                            {/* Token Info */}
                            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 text-sm">Token:</span>
                                    <span className="font-mono font-bold text-blue-700">{generatedToken.token}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 text-sm">Table:</span>
                                    <span className="font-medium">{selectedTable?.name}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 text-sm">Expiry:</span>
                                    <span className="font-medium text-orange-600">
                                        {formatExpiryTime(generatedToken.expires_at)}
                                    </span>
                                </div>
                            </div>

                            {/* Order URL */}
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">Order URL:</p>
                                <p className="text-sm font-mono text-gray-700 break-all">
                                    {window.location.origin}/order/{generatedToken.token}
                                </p>
                            </div>

                            {/* Copy Link Button */}
                            <Button
                                onClick={handleCopyLink}
                                className="w-full"
                                variant="outline"
                            >
                                📋 Copy Link
                            </Button>
                        </div>
                    ) : null}
                    <DialogFooter>
                        <Button
                            onClick={() => {
                                setShowTokenDialog(false);
                                setGeneratedToken(null);
                            }}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Variant Selection Dialog */}
            <Dialog open={showVariantDialog} onOpenChange={setShowVariantDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <span className="text-2xl">🎯</span>
                            Select Variant
                        </DialogTitle>
                        <DialogDescription>
                            Choose a variant for {selectedProduct?.name}
                        </DialogDescription>
                    </DialogHeader>
                    {isLoadingVariants ? (
                        <div className="py-8 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-gray-500 mt-4">Loading variants...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Variant Options */}
                            <div className="space-y-2">
                                {productVariants
                                    .filter(v => v.active)
                                    .map((variant) => (
                                        <Button
                                            key={variant.id}
                                            variant={selectedVariant?.id === variant.id ? "default" : "outline"}
                                            className="w-full justify-between h-auto py-3"
                                            onClick={() => setSelectedVariant(variant)}
                                        >
                                            <div className="text-left">
                                                <p className="font-medium">
                                                    {variant.attribute_name}: {variant.attribute_value}
                                                </p>
                                                {variant.extra_price > 0 && (
                                                    <p className="text-sm text-gray-500">
                                                        +₹{variant.extra_price}
                                                    </p>
                                                )}
                                            </div>
                                            {selectedVariant?.id === variant.id && (
                                                <span className="text-lg">✓</span>
                                            )}
                                        </Button>
                                    ))}
                            </div>

                            {/* Price Preview */}
                            {selectedProduct && (
                                <div className="bg-blue-50 p-3 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Total Price:</span>
                                        <span className="font-bold text-blue-700 text-lg">
                                            ₹{selectedProduct.price + (selectedVariant?.extra_price || 0)}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={handleSkipVariant}
                            disabled={isLoadingVariants}
                        >
                            Skip (No Variant)
                        </Button>
                        <Button
                            onClick={handleConfirmVariant}
                            disabled={isLoadingVariants || !selectedVariant}
                        >
                            Add to Order
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Order Details Dialog */}
            <Dialog open={showOrderDetailsDialog} onOpenChange={setShowOrderDetailsDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <span className="text-2xl">📋</span>
                            Order Details
                        </DialogTitle>
                        <DialogDescription>
                            Add customer information and notes
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {/* Order Type */}
                        <div className="space-y-2">
                            <Label htmlFor="orderType">Order Type</Label>
                            <Select value={orderType} onValueChange={(v) => setOrderType(v as OrderType)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select order type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="dine-in">🍽️ Dine In</SelectItem>
                                    <SelectItem value="takeaway">🥡 Takeaway</SelectItem>
                                    <SelectItem value="pickup">🚶 Pickup</SelectItem>
                                    <SelectItem value="delivery">🚗 Delivery</SelectItem>
                                    <SelectItem value="drive-thru">🚙 Drive-thru</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Customer Name */}
                        <div className="space-y-2">
                            <Label htmlFor="customerName">Customer Name (Optional)</Label>
                            <Input
                                id="customerName"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                placeholder="Enter customer name"
                            />
                        </div>

                        {/* Customer Phone */}
                        <div className="space-y-2">
                            <Label htmlFor="customerPhone">Phone Number (Optional)</Label>
                            <Input
                                id="customerPhone"
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value)}
                                placeholder="Enter phone number"
                                type="tel"
                            />
                        </div>

                        {/* Order Notes */}
                        <div className="space-y-2">
                            <Label htmlFor="orderNotes">Special Instructions</Label>
                            <Input
                                id="orderNotes"
                                value={orderNotes}
                                onChange={(e) => setOrderNotes(e.target.value)}
                                placeholder="Any special instructions..."
                            />
                        </div>

                        {/* Order Info */}
                        {currentOrder && (
                            <div className="bg-gray-50 p-3 rounded-lg space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Order ID:</span>
                                    <span className="font-mono">{currentOrder.id.slice(-8).toUpperCase()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Table:</span>
                                    <span>{selectedTable?.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Items:</span>
                                    <span>{currentOrder.order_items.length}</span>
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowOrderDetailsDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveOrderDetails}>
                            Save Details
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
