"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { deactivateToken, deleteToken, createOrderToken } from "@/lib/actions/order-tokens";
import type { OrderToken } from "@/lib/types/database";
import QRCode from "react-qr-code";

interface TokensClientProps {
    tokens: any[];
}

type FilterType = "all" | "active" | "expired";

export default function TokensClient({ tokens }: TokensClientProps) {
    const [filter, setFilter] = useState<FilterType>("all");
    const [selectedToken, setSelectedToken] = useState<any | null>(null);
    const [showQRDialog, setShowQRDialog] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    // Check if token is expired
    function isTokenExpired(token: any): boolean {
        if (!token.expires_at) return false;
        return new Date(token.expires_at) < new Date();
    }

    // Filter tokens
    const filteredTokens = useMemo(() => {
        return tokens.filter((token) => {
            const expired = isTokenExpired(token);
            if (filter === "active") return token.active && !expired;
            if (filter === "expired") return !token.active || expired;
            return true;
        });
    }, [tokens, filter]);

    // Count active and expired tokens
    const activeCount = tokens.filter((t) => t.active && !isTokenExpired(t)).length;
    const expiredCount = tokens.filter((t) => !t.active || isTokenExpired(t)).length;

    async function handleDeactivate(tokenId: string) {
        const result = await deactivateToken(tokenId);
        if (result.error) {
            toast({ variant: "destructive", title: "Error", description: result.error });
        } else {
            toast({ title: "Token Deactivated", description: "Token has been deactivated" });
            router.refresh();
        }
    }

    async function handleDelete(tokenId: string) {
        if (!confirm("Are you sure you want to delete this token?")) return;

        const result = await deleteToken(tokenId);
        if (result.error) {
            toast({ variant: "destructive", title: "Error", description: result.error });
        } else {
            toast({ title: "Token Deleted", description: "Token has been deleted" });
            router.refresh();
        }
    }

    async function handleRegenerate(token: any) {
        const result = await createOrderToken(token.table_id, token.session_id, 24);
        if (result.error) {
            toast({ variant: "destructive", title: "Error", description: result.error });
        } else {
            toast({ title: "Token Regenerated", description: "New token has been created" });
            router.refresh();
        }
    }

    function handleShowQR(token: any) {
        setSelectedToken(token);
        setShowQRDialog(true);
    }

    function formatDate(dateString: string): string {
        return new Date(dateString).toLocaleString();
    }

    function formatExpiry(expiresAt: string | null): string {
        if (!expiresAt) return "No expiry";
        const expiry = new Date(expiresAt);
        const now = new Date();
        const diffMs = expiry.getTime() - now.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

        if (diffHours < 0) return "Expired";
        if (diffHours >= 24) {
            const days = Math.floor(diffHours / 24);
            return `${days} day${days > 1 ? 's' : ''}`;
        }
        return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Self-Ordering Tokens</h1>
                    <p className="text-gray-500 mt-1">Manage QR code tokens for customer self-ordering</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">Active Tokens</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-600">{activeCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">Expired/Inactive</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-red-600">{expiredCount}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">Filter:</label>
                <Select value={filter} onValueChange={(value) => setFilter(value as FilterType)}>
                    <SelectTrigger className="w-48">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Tokens</SelectItem>
                        <SelectItem value="active">Active Only</SelectItem>
                        <SelectItem value="expired">Expired Only</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Tokens Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Token</TableHead>
                                <TableHead>Table</TableHead>
                                <TableHead>Session ID</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead>Expires</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTokens.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                        No tokens found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredTokens.map((token) => {
                                    const expired = isTokenExpired(token);
                                    const isActive = token.active && !expired;

                                    return (
                                        <TableRow key={token.id}>
                                            <TableCell className="font-mono font-bold">{token.token}</TableCell>
                                            <TableCell>{token.tables?.name || "N/A"}</TableCell>
                                            <TableCell className="font-mono text-sm">
                                                {token.session_id.slice(-6).toUpperCase()}
                                            </TableCell>
                                            <TableCell>
                                                {isActive ? (
                                                    <Badge className="bg-green-100 text-green-700 border-green-300">
                                                        Active
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-red-100 text-red-700 border-red-300">
                                                        {expired ? "Expired" : "Inactive"}
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {formatDate(token.created_at)}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {formatExpiry(token.expires_at)}
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleShowQR(token)}
                                                >
                                                    QR
                                                </Button>
                                                {isActive && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeactivate(token.id)}
                                                        className="text-orange-600 hover:text-orange-700"
                                                    >
                                                        Deactivate
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRegenerate(token)}
                                                    className="text-blue-600 hover:text-blue-700"
                                                >
                                                    Regenerate
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(token.id)}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    Delete
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* QR Code Dialog */}
            <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>QR Code Preview</DialogTitle>
                        <DialogDescription>
                            Token: {selectedToken?.token}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedToken && (
                        <div className="space-y-4">
                            <div className="flex justify-center p-6 bg-white rounded-lg border-2 border-gray-200">
                                <QRCode
                                    value={`${window.location.origin}/order/${selectedToken.token}`}
                                    size={200}
                                />
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">Order URL:</p>
                                <p className="text-sm font-mono text-gray-700 break-all">
                                    {window.location.origin}/order/{selectedToken.token}
                                </p>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}


