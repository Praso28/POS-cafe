"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PaymentsGrouped {
    method: string;
    payments: { id: string; date: string; amount: number }[];
    total: number;
}

interface PaymentsListClientProps {
    paymentsGrouped: PaymentsGrouped[];
}

export function PaymentsListClient({ paymentsGrouped }: PaymentsListClientProps) {
    const [expandedMethods, setExpandedMethods] = useState<string[]>([]);

    const toggleMethod = (method: string) => {
        setExpandedMethods((prev) =>
            prev.includes(method)
                ? prev.filter((m) => m !== method)
                : [...prev, method]
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "2-digit",
        });
    };

    return (
        <div className="space-y-4">
            {/* Sidebar Tabs */}
            <div className="flex gap-1 border-b">
                <a
                    href="/admin/orders"
                    className="px-4 py-2 text-sm border-b-2 border-transparent text-gray-500 hover:text-gray-700"
                >
                    Orders
                </a>
                <button className="px-4 py-2 text-sm border-b-2 border-blue-500 text-blue-600">
                    Payment
                </button>
                <a
                    href="/customer"
                    className="px-4 py-2 text-sm border-b-2 border-transparent text-gray-500 hover:text-gray-700"
                >
                    Customer
                </a>
            </div>

            <Card>
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Payments</CardTitle>
                        <Button size="sm" variant="ghost">☰</Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-y">
                            <tr>
                                <th className="p-3 text-left font-medium text-gray-600">Payment method</th>
                                <th className="p-3 text-left font-medium text-gray-600">Date</th>
                                <th className="p-3 text-right font-medium text-gray-600">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paymentsGrouped.map((group) => (
                                <>
                                    {/* Group Header Row */}
                                    <tr
                                        key={group.method}
                                        className="border-b bg-gray-50 cursor-pointer hover:bg-gray-100"
                                        onClick={() => toggleMethod(group.method)}
                                    >
                                        <td className="p-3 font-medium">
                                            <span className="mr-2">
                                                {expandedMethods.includes(group.method) ? "∨" : ">"}
                                            </span>
                                            {group.method}
                                        </td>
                                        <td className="p-3"></td>
                                        <td className="p-3 text-right font-bold">₹{group.total.toFixed(0)}</td>
                                    </tr>

                                    {/* Individual Payments */}
                                    {expandedMethods.includes(group.method) &&
                                        group.payments.map((payment) => (
                                            <tr key={payment.id} className="border-b hover:bg-gray-50">
                                                <td className="p-3 pl-8">
                                                    <input type="checkbox" className="mr-2" />
                                                    {group.method}
                                                </td>
                                                <td className="p-3">{formatDate(payment.date)}</td>
                                                <td className="p-3 text-right">₹{payment.amount.toFixed(0)}</td>
                                            </tr>
                                        ))}
                                </>
                            ))}
                            {paymentsGrouped.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="p-8 text-center text-gray-500">
                                        No payments found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
}
