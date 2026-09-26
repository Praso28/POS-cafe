"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { ProductVariant } from "@/lib/types/database";
import {
    getProductVariants,
    createProductVariant,
    updateProductVariant,
    deleteProductVariant,
    toggleProductVariantActive,
} from "@/lib/actions/product-variants";

interface VariantManagerProps {
    productId: string;
    productName: string;
    isOpen: boolean;
    onClose: () => void;
}

export function VariantManager({ productId, productName, isOpen, onClose }: VariantManagerProps) {
    const [variants, setVariants] = useState<ProductVariant[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        if (isOpen) {
            loadVariants();
        }
    }, [isOpen, productId]);

    async function loadVariants() {
        try {
            const data = await getProductVariants(productId);
            setVariants(data);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to load variants" });
        }
    }

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        try {
            formData.append("product_id", productId);
            
            const result = editingVariant
                ? await updateProductVariant(editingVariant.id, formData)
                : await createProductVariant(formData);

            if (result.error) {
                toast({ variant: "destructive", title: "Error", description: result.error });
            } else {
                toast({ title: "Success", description: editingVariant ? "Variant updated" : "Variant created" });
                setShowAddForm(false);
                setEditingVariant(null);
                loadVariants();
                router.refresh();
            }
        } finally {
            setIsLoading(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this variant?")) return;

        const result = await deleteProductVariant(id);
        if (result.error) {
            toast({ variant: "destructive", title: "Error", description: result.error });
        } else {
            toast({ title: "Success", description: "Variant deleted" });
            loadVariants();
            router.refresh();
        }
    }

    async function handleToggleActive(id: string, active: boolean) {
        const result = await toggleProductVariantActive(id, active);
        if (result.error) {
            toast({ variant: "destructive", title: "Error", description: result.error });
        } else {
            loadVariants();
            router.refresh();
        }
    }

    function openEditForm(variant: ProductVariant) {
        setEditingVariant(variant);
        setShowAddForm(true);
    }

    function closeForm() {
        setShowAddForm(false);
        setEditingVariant(null);
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Manage Variants - {productName}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600">
                            Add variants like size (Small/Large) or pack (6/12 items) with extra prices
                        </p>
                        <Button
                            onClick={() => setShowAddForm(!showAddForm)}
                            size="sm"
                            variant={showAddForm ? "outline" : "default"}
                        >
                            {showAddForm ? "Cancel" : "+ Add Variant"}
                        </Button>
                    </div>

                    {showAddForm && (
                        <form action={handleSubmit} className="border rounded-lg p-4 space-y-4 bg-gray-50">
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <Label htmlFor="attribute_name">Attribute Name</Label>
                                    <Input
                                        id="attribute_name"
                                        name="attribute_name"
                                        placeholder="e.g., Size, Pack"
                                        defaultValue={editingVariant?.attribute_name || ""}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="attribute_value">Attribute Value</Label>
                                    <Input
                                        id="attribute_value"
                                        name="attribute_value"
                                        placeholder="e.g., Large, 12 items"
                                        defaultValue={editingVariant?.attribute_value || ""}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="extra_price">Extra Price (₹)</Label>
                                    <Input
                                        id="extra_price"
                                        name="extra_price"
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        defaultValue={editingVariant?.extra_price || 0}
                                        required
                                    />
                                </div>
                            </div>
                            {editingVariant && (
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="active"
                                        name="active"
                                        defaultChecked={editingVariant.active}
                                        value="true"
                                    />
                                    <Label htmlFor="active">Active</Label>
                                </div>
                            )}
                            <div className="flex gap-2">
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? "Saving..." : editingVariant ? "Update Variant" : "Add Variant"}
                                </Button>
                                {editingVariant && (
                                    <Button type="button" variant="outline" onClick={closeForm}>
                                        Cancel Edit
                                    </Button>
                                )}
                            </div>
                        </form>
                    )}

                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Attribute</TableHead>
                                    <TableHead>Value</TableHead>
                                    <TableHead>Extra Price</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {variants.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                            No variants yet. Add your first variant above.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    variants.map((variant) => (
                                        <TableRow key={variant.id}>
                                            <TableCell className="font-medium">{variant.attribute_name}</TableCell>
                                            <TableCell>{variant.attribute_value}</TableCell>
                                            <TableCell>₹{variant.extra_price.toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Switch
                                                    checked={variant.active}
                                                    onCheckedChange={(checked) =>
                                                        handleToggleActive(variant.id, checked)
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openEditForm(variant)}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-600 hover:text-red-700"
                                                    onClick={() => handleDelete(variant.id)}
                                                >
                                                    Delete
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

