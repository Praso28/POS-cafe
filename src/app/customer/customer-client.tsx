"use client";

import { Card } from "@/components/ui/card";
import { useRealtimeCustomerOrder } from "@/hooks/use-realtime-customer";
import { UPIQR } from "@/components/payments/upi-qr";
import type { OrderWithItems } from "@/lib/types/database";

interface CustomerClientProps {
    orderId: string;
    initialOrder: OrderWithItems | null;
}

export function CustomerClient({ orderId, initialOrder }: CustomerClientProps) {
    const { order, payment } = useRealtimeCustomerOrder(orderId, initialOrder);

    // 1. Loading / No Order State
    if (!order) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <div className="text-center animate-pulse">
                    <h1 className="text-4xl font-bold mb-4">Odoo Cafe</h1>
                    <p className="text-xl text-gray-400">Waiting for order details...</p>
                </div>
            </div>
        );
    }

    // 2. Determine View State
    const isPaid = order.status === "paid" || payment?.status === "completed";
    const isPaymentPending = payment && payment.status === "pending" && payment.method === "upi";

    // 3. Render
    return (
        <div className="min-h-screen flex bg-[#1a1c24] text-white font-sans overflow-hidden">
            {/* LEFT PANEL: Branding */}
            <div className="w-1/3 border-r border-gray-800 flex flex-col justify-between p-12 bg-[#1a1c24]">
                <div className="space-y-4">
                    <div className="inline-block px-4 py-2 border border-red-500 rounded-lg text-red-500 text-sm font-semibold tracking-wide uppercase">
                        Logo
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-5xl font-light leading-tight text-gray-300">
                        Welcome to<br />
                        <span className="font-bold text-white">Odoo Cafe</span>
                    </h1>
                </div>

                <div className="text-sm text-gray-600">
                    Powered by Odoo
                </div>
            </div>

            {/* RIGHT PANEL: Dynamic Content */}
            <div className="flex-1 flex flex-col p-12 bg-[#23263a] relative">

                {/* VIEW 1: THANK YOU (Paid) */}
                {isPaid ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in duration-500">
                        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-5xl mb-4 shadow-lg shadow-green-500/20">
                            ✓
                        </div>
                        <h2 className="text-4xl font-bold text-white">Thank you for shopping with us!</h2>
                        <p className="text-xl text-gray-400">See you again soon</p>
                    </div>
                ) : isPaymentPending ? (
                    /* VIEW 2: PAYMENT (UPI QR) */
                    <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
                        <h2 className="text-3xl font-bold mb-8 text-white">Scan to Pay</h2>
                        <div className="bg-white p-4 rounded-2xl shadow-2xl">
                            {/* Reusing existing UPI component Logic but styled for dark mode context */}
                            <UPIQR
                                upiId={payment?.upi_id || "demo@upi"} // Fallback/Fetch from payment method logic if needed, but simplified for display
                                amount={order.total}
                            />
                        </div>
                        <p className="mt-8 text-2xl font-bold text-green-400">Total: ₹{order.total.toFixed(2)}</p>
                    </div>
                ) : (
                    /* VIEW 3: CART (Active Order) */
                    <div className="flex-1 flex flex-col h-full animate-in slide-in-from-right duration-500">
                        <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                            {/* Empty State */}
                            {order.order_items.length === 0 && (
                                <div className="h-full flex items-center justify-center text-gray-500">
                                    <p className="text-xl">Your items will appear here</p>
                                </div>
                            )}

                            {/* Items List */}
                            <div className="space-y-4">
                                {order.order_items.map((item) => (
                                    <div key={item.id} className="flex items-center gap-6 p-4 rounded-xl bg-[#2e3248] hover:bg-[#343952] transition-colors">
                                        {/* Placeholder Image */}
                                        <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                                            ☕
                                        </div>

                                        <div className="flex-1">
                                            <h3 className="text-xl font-medium text-white">{item.products?.name || "Unknown Item"}</h3>
                                            <p className="text-gray-400">Qty: {item.qty}</p>
                                        </div>

                                        <div className="text-xl font-bold text-white">
                                            ₹{(item.price * item.qty).toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Totals Footer */}
                        {order.order_items.length > 0 && (
                            <div className="mt-8 border-t border-gray-700 pt-8 space-y-3">
                                <div className="flex justify-between text-gray-400 text-lg">
                                    <span>Sub Total:</span>
                                    <span>₹{order.total.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-400 text-lg">
                                    <span>Tax (0%):</span>
                                    <span>₹0.00</span>
                                </div>
                                <div className="flex justify-between text-3xl font-bold text-white mt-4">
                                    <span>Total:</span>
                                    <span>₹{order.total.toFixed(2)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
