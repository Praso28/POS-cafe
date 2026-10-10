"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UPIQR } from "./upi-qr";
import { createPayment, confirmPayment, cancelPayment } from "@/lib/actions/payments";
import { useToast } from "@/hooks/use-toast";
import type { OrderWithItems, PaymentMethod } from "@/lib/types/database";

interface PaymentModalProps {
    order: OrderWithItems;
    paymentMethods: PaymentMethod[];
    onClose: () => void;
    onComplete: () => void;
}

type PaymentStep = "select" | "upi" | "confirm";

export function PaymentModal({ order, paymentMethods, onClose, onComplete }: PaymentModalProps) {
    const [step, setStep] = useState<PaymentStep>("select");
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
    const [paymentId, setPaymentId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const upiMethod = paymentMethods.find((m) => m.type === "upi");

    async function handleSelectMethod(method: PaymentMethod) {
        setSelectedMethod(method);
        setIsLoading(true);

        // Create payment record
        const result = await createPayment(order.id, method.type, order.total);
        if (result.error) {
            toast({ variant: "destructive", title: "Error", description: result.error });
            setIsLoading(false);
            return;
        }

        setPaymentId(result.payment!.id);
        setIsLoading(false);

        if (method.type === "upi") {
            setStep("upi");
        } else {
            setStep("confirm");
        }
    }

    async function handleConfirmPayment() {
        if (!paymentId) return;

        setIsLoading(true);
        const result = await confirmPayment(paymentId, order.id);
        if (result.error) {
            toast({ variant: "destructive", title: "Error", description: result.error });
            setIsLoading(false);
            return;
        }

        onComplete();
    }

    async function handleCancel() {
        // Cancel the pending payment record
        if (paymentId) {
            await cancelPayment(paymentId);
        }
        setStep("select");
        setSelectedMethod(null);
        setPaymentId(null);
    }

    const methodIcons: Record<string, string> = {
        cash: "💵",
        digital: "💳",
        upi: "📱",
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>
                        {step === "select" && "Select Payment Method"}
                        {step === "upi" && "UPI Payment"}
                        {step === "confirm" && "Confirm Payment"}
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        ✕
                    </Button>
                </CardHeader>
                <CardContent>
                    {/* Order Summary */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Table</span>
                            <span className="font-semibold">{order.tables.name}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                            <span className="text-gray-600">Items</span>
                            <span className="font-semibold">{order.order_items.length}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2 text-xl">
                            <span className="font-semibold">Total</span>
                            <span className="font-bold text-green-600">₹{order.total.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Payment Method Selection */}
                    {step === "select" && (
                        <div className="space-y-3">
                            {paymentMethods.map((method) => (
                                <Button
                                    key={method.id}
                                    variant="outline"
                                    className="w-full h-16 flex items-center justify-start gap-4 text-lg"
                                    onClick={() => handleSelectMethod(method)}
                                    disabled={isLoading}
                                >
                                    <span className="text-2xl">{methodIcons[method.type]}</span>
                                    <span>{method.name}</span>
                                </Button>
                            ))}
                        </div>
                    )}

                    {/* UPI QR View */}
                    {step === "upi" && upiMethod?.upi_id && (
                        <div className="space-y-4">
                            <UPIQR upiId={upiMethod.upi_id} amount={order.total} />
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1 h-12"
                                    onClick={handleCancel}
                                    disabled={isLoading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1 h-12 bg-green-600 hover:bg-green-700"
                                    onClick={handleConfirmPayment}
                                    disabled={isLoading}
                                >
                                    {isLoading ? "Processing..." : "Payment Received"}
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === "upi" && !upiMethod?.upi_id && (
                        <div className="text-center py-8">
                            <p className="text-red-500 mb-4">UPI ID not configured</p>
                            <p className="text-gray-500 text-sm">Please set up UPI ID in Admin → Payments</p>
                            <Button variant="outline" className="mt-4" onClick={handleCancel}>
                                Go Back
                            </Button>
                        </div>
                    )}

                    {/* Confirm View (Cash/Digital) */}
                    {step === "confirm" && selectedMethod && (
                        <div className="space-y-6">
                            <div className="text-center py-4">
                                <span className="text-5xl mb-4 block">{methodIcons[selectedMethod.type]}</span>
                                <p className="text-lg text-gray-600">
                                    {selectedMethod.type === "cash"
                                        ? "Collect cash from customer"
                                        : "Process payment on terminal"}
                                </p>
                                <p className="text-3xl font-bold text-green-600 mt-2">
                                    ₹{order.total.toFixed(2)}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1 h-12"
                                    onClick={handleCancel}
                                    disabled={isLoading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1 h-12 bg-green-600 hover:bg-green-700"
                                    onClick={handleConfirmPayment}
                                    disabled={isLoading}
                                >
                                    {isLoading ? "Processing..." : "Confirm Payment"}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
