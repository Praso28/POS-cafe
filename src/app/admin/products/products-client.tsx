"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import type { Product } from "@/lib/types/database";
import {
    createProduct,
    updateProduct,
    deleteProduct,
    toggleProductActive,
} from "@/lib/actions/products";

interface ProductsClientProps {
    initialProducts: Product[];
}

export function ProductsClient({ initialProducts }: ProductsClientProps) {
    const [products, setProducts] = useState(initialProducts);
    const [isOpen, setIsOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const categories = [...new Set(products.map((p) => p.category))];

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        try {
            const result = editingProduct
                ? await updateProduct(editingProduct.id, formData)
                : await createProduct(formData);

            if (result.error) {
                toast({ variant: "destructive", title: "Error", description: result.error });
            } else {
                toast({ title: "Success", description: editingProduct ? "Product updated" : "Product created" });
                setIsOpen(false);
                setEditingProduct(null);
                router.refresh();
            }
        } finally {
            setIsLoading(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this product?")) return;

        const result = await deleteProduct(id);
        if (result.error) {
            toast({ variant: "destructive", title: "Error", description: result.error });
        } else {
            toast({ title: "Success", description: "Product deleted" });
            router.refresh();
        }
    }

    async function handleToggleActive(id: string, active: boolean) {
        const result = await toggleProductActive(id, active);
        if (result.error) {
            toast({ variant: "destructive", title: "Error", description: result.error });
        } else {
            router.refresh();
        }
    }

    function openEditDialog(product: Product) {
        setEditingProduct(product);
        setIsOpen(true);
    }

    function openCreateDialog() {
        setEditingProduct(null);
        setIsOpen(true);
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Products</h1>
                    <p className="text-gray-500 mt-1">Manage your menu items</p>
                </div>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openCreateDialog} size="lg">
                            + Add Product
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingProduct ? "Edit Product" : "Add New Product"}
                            </DialogTitle>
                        </DialogHeader>
                        <form action={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Product Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    defaultValue={editingProduct?.name || ""}
                                    placeholder="e.g., Cappuccino"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Input
                                    id="category"
                                    name="category"
                                    defaultValue={editingProduct?.category || ""}
                                    placeholder="e.g., Coffee, Pastry, Beverage"
                                    list="categories"
                                    required
                                />
                                <datalist id="categories">
                                    {categories.map((cat) => (
                                        <option key={cat} value={cat} />
                                    ))}
                                </datalist>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="price">Price (₹)</Label>
                                <Input
                                    id="price"
                                    name="price"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    defaultValue={editingProduct?.price || ""}
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                            {editingProduct && (
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="active"
                                        name="active"
                                        defaultChecked={editingProduct.active}
                                        value="true"
                                    />
                                    <Label htmlFor="active">Active</Label>
                                </div>
                            )}
                            <DialogFooter>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? "Saving..." : editingProduct ? "Update" : "Create"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="bg-white rounded-lg shadow">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                    No products yet. Add your first product to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            products.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell>{product.category}</TableCell>
                                    <TableCell>₹{product.price.toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Switch
                                            checked={product.active}
                                            onCheckedChange={(checked) =>
                                                handleToggleActive(product.id, checked)
                                            }
                                        />
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openEditDialog(product)}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-600 hover:text-red-700"
                                            onClick={() => handleDelete(product.id)}
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
    );
}
