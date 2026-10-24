"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { Product, OrderToken, OrderType } from "@/lib/types/database";
import { createOrder, addOrderItem, sendToKitchen } from "@/lib/actions/orders";
import QRCode from "react-qr-code";

interface OrderClientProps {
    token: string;
    tokenData: OrderToken;
    products: Product[];
}

interface CartItem {
    product: Product;
    quantity: number;
}

type OrderMode = "dine-in" | "takeaway" | "pickup";

export function OrderClient({ token, tokenData, products }: OrderClientProps) {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [orderMode, setOrderMode] = useState<OrderMode>("dine-in");
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
    const { toast } = useToast();
    const router = useRouter();

    const categories = [...new Set(products.map(p => p.category))];
    const filteredProducts = selectedCategory
        ? products.filter(p => p.category === selectedCategory)
        : products;

    function addToCart(product: Product) {
        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { product, quantity: 1 }];
        });
        toast({ title: "Added to cart", description: `${product.name} added` });
    }

    function updateQuantity(productId: string, delta: number) {
        setCart(prev => {
            const updated = prev.map(item =>
                item.product.id === productId
                    ? { ...item, quantity: Math.max(0, item.quantity + delta) }
                    : item
            ).filter(item => item.quantity > 0);
            return updated;
        });
    }

    function removeFromCart(productId: string) {
        setCart(prev => prev.filter(item => item.product.id !== productId));
    }

    const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

    async function handlePlaceOrder() {
        if (cart.length === 0) {
            toast({ variant: "destructive", title: "Error", description: "Cart is empty" });
            return;
        }

        setIsSubmitting(true);
        try {
            // Create order with order type and customer info
            const orderResult = await createOrder(
                tokenData.table_id,
                tokenData.session_id,
                orderMode as OrderType,
                customerName || undefined,
                customerPhone || undefined
            );
            
            if (orderResult.error || !orderResult.order) {
                toast({ variant: "destructive", title: "Error", description: orderResult.error });
                return;
            }

            // Add all items to order (using quantity parameter for efficiency)
            for (const item of cart) {
                const itemResult = await addOrderItem(
                    orderResult.order.id,
                    item.product.id,
                    item.product.price,
                    null,  // variantId
                    null,  // variantLabel
                    item.quantity  // quantity
                );
                if (itemResult.error) {
                    toast({ variant: "destructive", title: "Error", description: itemResult.error });
                    return;
                }
            }

            // Note: Don't send to kitchen yet - cashier will process payment first
            // Self-orders go to "open" status for cashier to review and process

            // Success
            setPlacedOrderId(orderResult.order.id);
            setOrderPlaced(true);
            setCart([]);
            toast({
                title: "Order Placed!",
                description: orderMode === "dine-in" 
                    ? "Please proceed to the counter for payment"
                    : "Your order has been received",
            });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to place order" });
        } finally {
            setIsSubmitting(false);
        }
    }

    if (orderPlaced) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
                <Card className="max-w-md w-full">
                    <CardHeader className="text-center">
                        <div className="text-6xl mb-4">✅</div>
                        <CardTitle className="text-2xl">Order Placed Successfully!</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        {placedOrderId && (
                            <div className="bg-gray-100 p-3 rounded-lg">
                                <p className="text-sm text-gray-500">Order Reference</p>
                                <p className="font-mono font-bold text-lg">{placedOrderId.slice(0, 8).toUpperCase()}</p>
                            </div>
                        )}
                        
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <Badge className="mb-2">
                                {orderMode === "dine-in" ? "🍽️ Dine-in" : orderMode === "takeaway" ? "🥡 Takeaway" : "📦 Pickup"}
                            </Badge>
                            {orderMode === "dine-in" ? (
                                <p className="text-gray-600">
                                    Your order has been received. Please proceed to the counter for payment.
                                </p>
                            ) : (
                                <p className="text-gray-600">
                                    Your order has been received. {customerPhone ? "We'll notify you" : "Please check"} when it's ready for {orderMode === "takeaway" ? "takeaway" : "pickup"}.
                                </p>
                            )}
                        </div>
                        
                        {customerName && (
                            <p className="text-sm text-gray-500">
                                Name: <strong>{customerName}</strong>
                            </p>
                        )}
                        
                        <Button
                            onClick={() => {
                                setOrderPlaced(false);
                                setPlacedOrderId("");
                                setCustomerName("");
                                setCustomerPhone("");
                                router.refresh();
                            }}
                            className="w-full"
                        >
                            Place Another Order
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">☕ Self Order</h1>
                            <p className="text-sm text-gray-600">Token: {token}</p>
                        </div>
                        <Button variant="outline" onClick={() => setShowQR(!showQR)}>
                            {showQR ? "Hide QR" : "Show QR"}
                        </Button>
                    </div>

                    {showQR && (
                        <div className="mt-4 flex justify-center p-4 bg-white rounded-lg border">
                            <div className="text-center">
                                <QRCode value={`${window.location.origin}/order/${token}`} size={200} />
                                <p className="text-sm text-gray-600 mt-2">Scan to order</p>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Products Section */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Category Filter */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        <Button
                            variant={selectedCategory === null ? "default" : "outline"}
                            onClick={() => setSelectedCategory(null)}
                            size="sm"
                        >
                            All
                        </Button>
                        {categories.map(category => (
                            <Button
                                key={category}
                                variant={selectedCategory === category ? "default" : "outline"}
                                onClick={() => setSelectedCategory(category)}
                                size="sm"
                            >
                                {category}
                            </Button>
                        ))}
                    </div>

                    {/* Products Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {filteredProducts.map(product => (
                            <Card
                                key={product.id}
                                className="cursor-pointer hover:shadow-lg transition-shadow"
                                onClick={() => addToCart(product)}
                            >
                                <CardContent className="p-4 text-center">
                                    <h3 className="font-semibold mb-2">{product.name}</h3>
                                    <Badge variant="secondary" className="mb-2">{product.category}</Badge>
                                    <p className="text-lg font-bold text-green-600">₹{product.price.toFixed(2)}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Cart Section */}
                <div className="lg:col-span-1">
                    <Card className="sticky top-24">
                        <CardHeader>
                            <CardTitle>Your Order</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Order Type Selection */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Order Type</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    <Button
                                        variant={orderMode === "dine-in" ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setOrderMode("dine-in")}
                                        className="w-full"
                                    >
                                        🍽️ Dine-in
                                    </Button>
                                    <Button
                                        variant={orderMode === "takeaway" ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setOrderMode("takeaway")}
                                        className="w-full"
                                    >
                                        🥡 Takeaway
                                    </Button>
                                    <Button
                                        variant={orderMode === "pickup" ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setOrderMode("pickup")}
                                        className="w-full"
                                    >
                                        📦 Pickup
                                    </Button>
                                </div>
                            </div>

                            {/* Customer Info (optional) */}
                            {orderMode !== "dine-in" && (
                                <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-600">Contact info (optional):</p>
                                    <div className="space-y-2">
                                        <Input
                                            placeholder="Your name"
                                            value={customerName}
                                            onChange={(e) => setCustomerName(e.target.value)}
                                        />
                                        <Input
                                            placeholder="Phone number"
                                            value={customerPhone}
                                            onChange={(e) => setCustomerPhone(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            {cart.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">Cart is empty</p>
                            ) : (
                                <>
                                    <div className="space-y-3 max-h-64 overflow-y-auto">
                                        {cart.map(item => (
                                            <div key={item.product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div className="flex-1">
                                                    <p className="font-medium">{item.product.name}</p>
                                                    <p className="text-sm text-gray-600">₹{item.product.price.toFixed(2)}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => updateQuantity(item.product.id, -1)}
                                                    >
                                                        -
                                                    </Button>
                                                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => updateQuantity(item.product.id, 1)}
                                                    >
                                                        +
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-red-600"
                                                        onClick={() => removeFromCart(item.product.id)}
                                                    >
                                                        ×
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="border-t pt-4">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-lg font-semibold">Total:</span>
                                            <span className="text-2xl font-bold text-green-600">₹{cartTotal.toFixed(2)}</span>
                                        </div>
                                        <Button
                                            onClick={handlePlaceOrder}
                                            disabled={isSubmitting}
                                            className="w-full"
                                            size="lg"
                                        >
                                            {isSubmitting ? "Placing Order..." : `Place ${orderMode === "dine-in" ? "Dine-in" : orderMode === "takeaway" ? "Takeaway" : "Pickup"} Order`}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

