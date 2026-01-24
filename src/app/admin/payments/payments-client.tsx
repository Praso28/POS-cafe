"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { PaymentMethod } from "@/lib/types/database";
import {
    updatePaymentMethod,
    togglePaymentMethodEnabled,
} from "@/lib/actions/payment-methods";

interface PaymentsClientProps {
    initialMethods: PaymentMethod[];
}

const methodIcons: Record<string, string> = {
    cash: "💵",
    digital: "💳",
    upi: "📱",
};

export function PaymentsClient({ initialMethods }: PaymentsClientProps) {
    const [methods, setMethods] = useState(initialMethods);
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const { toast } = useToast();
    const router = useRouter();

    async function handleToggleEnabled(id: string, enabled: boolean) {
        setIsLoading(id);
        try {
            const result = await togglePaymentMethodEnabled(id, enabled);
            if (result.error) {
                toast({ variant: "destructive", title: "Error", description: result.error });
            } else {
                router.refresh();
            }
        } finally {
            setIsLoading(null);
        }
    }

    async function handleUpdateUpiId(id: string, formData: FormData) {
        setIsLoading(id);
        try {
            formData.append("enabled", "true");
            const result = await updatePaymentMethod(id, formData);
            if (result.error) {
                toast({ variant: "destructive", title: "Error", description: result.error });
            } else {
                toast({ title: "Success", description: "UPI ID updated" });
                router.refresh();
            }
        } finally {
            setIsLoading(null);
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Payment Methods</h1>
                <p className="text-gray-500 mt-1">Configure accepted payment methods</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {methods.map((method) => (
                    <Card key={method.id} className={!method.enabled ? "opacity-60" : ""}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">{methodIcons[method.type]}</span>
                                <CardTitle className="text-lg">{method.name}</CardTitle>
                            </div>
                            <Switch
                                checked={method.enabled}
                                onCheckedChange={(checked) =>
                                    handleToggleEnabled(method.id, checked)
                                }
                                disabled={isLoading === method.id}
                            />
                        </CardHeader>
                        <CardContent>
                            <Badge variant={method.enabled ? "success" : "secondary"}>
                                {method.enabled ? "Enabled" : "Disabled"}
                            </Badge>

                            {method.type === "upi" && (
                                <form
                                    action={(formData) => handleUpdateUpiId(method.id, formData)}
                                    className="mt-4 space-y-3"
                                >
                                    <div className="space-y-2">
                                        <Label htmlFor={`upi-${method.id}`}>UPI ID</Label>
                                        <Input
                                            id={`upi-${method.id}`}
                                            name="upi_id"
                                            defaultValue={method.upi_id || ""}
                                            placeholder="yourname@upi"
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        size="sm"
                                        variant="outline"
                                        disabled={isLoading === method.id}
                                    >
                                        {isLoading === method.id ? "Saving..." : "Save UPI ID"}
                                    </Button>
                                </form>
                            )}

                            {method.type === "cash" && (
                                <p className="mt-4 text-sm text-gray-500">
                                    Accept cash payments at the counter.
                                </p>
                            )}

                            {method.type === "digital" && (
                                <p className="mt-4 text-sm text-gray-500">
                                    Card payments, digital wallets, and other electronic payments.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">How Payments Work</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-gray-600">
                    <p>
                        <strong>💵 Cash:</strong> When selected, the order will be marked as paid
                        immediately. Make sure to collect the cash before confirming.
                    </p>
                    <p>
                        <strong>💳 Digital:</strong> For card/wallet payments processed through
                        your external payment terminal. Confirm after the payment is successful.
                    </p>
                    <p>
                        <strong>📱 UPI:</strong> Generates a QR code that customers can scan with
                        any UPI app. Enter your UPI ID above to enable this feature.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
