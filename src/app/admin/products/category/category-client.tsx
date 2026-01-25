"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    CATEGORY_COLORS,
    type ProductCategory,
} from "@/lib/actions/categories";

interface CategoryClientProps {
    initialCategories: ProductCategory[];
}

export function CategoryClient({ initialCategories }: CategoryClientProps) {
    const [categories, setCategories] = useState(initialCategories);
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newCategoryColor, setNewCategoryColor] = useState("#FFFFFF");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState("");
    const [colorPickerOpen, setColorPickerOpen] = useState<string | null>(null);
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const { toast } = useToast();
    const router = useRouter();

    // Handle adding new category
    const handleAddNew = () => {
        setIsAddingNew(true);
        setNewCategoryName("");
        setNewCategoryColor("#FFFFFF");
    };

    // Save new category
    const handleSaveNew = async () => {
        if (!newCategoryName.trim()) {
            toast({ variant: "destructive", title: "Error", description: "Category name is required" });
            return;
        }

        const result = await createCategory({
            name: newCategoryName.trim(),
            color: newCategoryColor,
        });

        if (result.error) {
            toast({ variant: "destructive", title: "Error", description: result.error });
        } else {
            toast({ title: "Success", description: "Category created" });
            setIsAddingNew(false);
            setNewCategoryName("");
            router.refresh();
        }
    };

    // Cancel adding
    const handleCancelNew = () => {
        setIsAddingNew(false);
        setNewCategoryName("");
    };

    // Start editing
    const handleStartEdit = (category: ProductCategory) => {
        setEditingId(category.id);
        setEditingName(category.name);
    };

    // Save edit
    const handleSaveEdit = async (id: string) => {
        if (!editingName.trim()) {
            toast({ variant: "destructive", title: "Error", description: "Category name is required" });
            return;
        }

        const result = await updateCategory(id, { name: editingName.trim() });

        if (result.error) {
            toast({ variant: "destructive", title: "Error", description: result.error });
        } else {
            toast({ title: "Success", description: "Category updated" });
            setEditingId(null);
            router.refresh();
        }
    };

    // Update color
    const handleColorChange = async (id: string, color: string) => {
        const result = await updateCategory(id, { color });

        if (result.error) {
            toast({ variant: "destructive", title: "Error", description: result.error });
        } else {
            // Update local state immediately
            setCategories(categories.map(c => c.id === id ? { ...c, color } : c));
        }
        setColorPickerOpen(null);
    };

    // Delete category
    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this category?")) return;

        const result = await deleteCategory(id);

        if (result.error) {
            toast({ variant: "destructive", title: "Error", description: result.error });
        } else {
            toast({ title: "Deleted", description: "Category deleted" });
            router.refresh();
        }
    };

    // Drag and drop handlers
    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedId(id);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = async (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        if (!draggedId || draggedId === targetId) return;

        const draggedIndex = categories.findIndex(c => c.id === draggedId);
        const targetIndex = categories.findIndex(c => c.id === targetId);

        const newCategories = [...categories];
        const [draggedItem] = newCategories.splice(draggedIndex, 1);
        newCategories.splice(targetIndex, 0, draggedItem);

        setCategories(newCategories);
        setDraggedId(null);

        // Save new order
        const orderedIds = newCategories.map(c => c.id);
        const result = await reorderCategories(orderedIds);

        if (result.error) {
            toast({ variant: "destructive", title: "Error", description: result.error });
            router.refresh(); // Revert to server state
        }
    };

    const handleDragEnd = () => {
        setDraggedId(null);
    };

    return (
        <div className="space-y-4">
            {/* Top Menu */}
            <div className="flex gap-6 text-sm text-gray-600">
                <span className="hover:text-gray-900 cursor-pointer">Orders</span>
                <span className="hover:text-gray-900 cursor-pointer">Products</span>
                <span className="hover:text-gray-900 cursor-pointer">Reporting</span>
            </div>

            {/* Page Header */}
            <div className="flex items-center gap-4">
                <Button
                    size="sm"
                    className="bg-red-500 hover:bg-red-600 text-white"
                    onClick={handleAddNew}
                >
                    New
                </Button>
                <h1 className="text-xl font-semibold text-purple-700">Category</h1>
            </div>

            {/* Category Table */}
            <Card>
                <CardContent className="p-0">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="w-10 p-3"></th>
                                <th className="p-3 text-left font-medium text-gray-600">Product Category</th>
                                <th className="p-3 text-center font-medium text-gray-600">Color</th>
                                <th className="w-16 p-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* New Category Row */}
                            {isAddingNew && (
                                <tr className="border-b bg-blue-50">
                                    <td className="p-3 text-gray-400">::</td>
                                    <td className="p-3">
                                        <Input
                                            value={newCategoryName}
                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                            placeholder="Enter category name..."
                                            className="h-8"
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") handleSaveNew();
                                                if (e.key === "Escape") handleCancelNew();
                                            }}
                                        />
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center justify-center gap-1">
                                            {CATEGORY_COLORS.map((c) => (
                                                <button
                                                    key={c.value}
                                                    className={`w-6 h-6 rounded-full border-2 ${newCategoryColor === c.value
                                                            ? "border-gray-800"
                                                            : "border-gray-300"
                                                        }`}
                                                    style={{ backgroundColor: c.value }}
                                                    onClick={() => setNewCategoryColor(c.value)}
                                                    title={c.name}
                                                />
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex gap-1">
                                            <Button size="sm" variant="ghost" onClick={handleSaveNew} className="text-green-600">
                                                ✓
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={handleCancelNew} className="text-red-600">
                                                ✕
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {/* Existing Categories */}
                            {categories.map((category) => (
                                <tr
                                    key={category.id}
                                    className={`border-b hover:bg-gray-50 ${draggedId === category.id ? "opacity-50" : ""
                                        }`}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, category.id)}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, category.id)}
                                    onDragEnd={handleDragEnd}
                                >
                                    <td className="p-3 cursor-grab text-gray-400 hover:text-gray-600">::</td>
                                    <td className="p-3">
                                        {editingId === category.id ? (
                                            <Input
                                                value={editingName}
                                                onChange={(e) => setEditingName(e.target.value)}
                                                className="h-8"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") handleSaveEdit(category.id);
                                                    if (e.key === "Escape") setEditingId(null);
                                                }}
                                                onBlur={() => handleSaveEdit(category.id)}
                                            />
                                        ) : (
                                            <span
                                                className="cursor-pointer hover:text-blue-600"
                                                onClick={() => handleStartEdit(category)}
                                            >
                                                {category.name}
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center justify-center gap-1 relative">
                                            {colorPickerOpen === category.id ? (
                                                // Show all color options
                                                <>
                                                    {CATEGORY_COLORS.map((c) => (
                                                        <button
                                                            key={c.value}
                                                            className={`w-6 h-6 rounded-full border-2 ${category.color === c.value
                                                                    ? "border-gray-800"
                                                                    : "border-gray-300"
                                                                } hover:scale-110 transition-transform`}
                                                            style={{ backgroundColor: c.value }}
                                                            onClick={() => handleColorChange(category.id, c.value)}
                                                            title={c.name}
                                                        />
                                                    ))}
                                                </>
                                            ) : (
                                                // Show only selected color
                                                <button
                                                    className="w-6 h-6 rounded-full border-2 border-gray-300 hover:border-gray-500"
                                                    style={{ backgroundColor: category.color || "#FFFFFF" }}
                                                    onClick={() => setColorPickerOpen(category.id)}
                                                    title="Click to change color"
                                                />
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => handleDelete(category.id)}
                                        >
                                            🗑️
                                        </Button>
                                    </td>
                                </tr>
                            ))}

                            {/* Empty State */}
                            {categories.length === 0 && !isAddingNew && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500">
                                        No categories yet. Click "New" to add one.
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
