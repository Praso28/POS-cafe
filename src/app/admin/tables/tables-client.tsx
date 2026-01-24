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
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { CafeTable } from "@/lib/types/database";
import {
    createTable,
    updateTable,
    deleteTable,
    toggleTableActive,
} from "@/lib/actions/tables";

interface TablesClientProps {
    initialTables: CafeTable[];
}

export function TablesClient({ initialTables }: TablesClientProps) {
    const [tables, setTables] = useState(initialTables);
    const [isOpen, setIsOpen] = useState(false);
    const [editingTable, setEditingTable] = useState<CafeTable | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        try {
            const result = editingTable
                ? await updateTable(editingTable.id, formData)
                : await createTable(formData);

            if (result.error) {
                toast({ variant: "destructive", title: "Error", description: result.error });
            } else {
                toast({ title: "Success", description: editingTable ? "Table updated" : "Table created" });
                setIsOpen(false);
                setEditingTable(null);
                router.refresh();
            }
        } finally {
            setIsLoading(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this table?")) return;

        const result = await deleteTable(id);
        if (result.error) {
            toast({ variant: "destructive", title: "Error", description: result.error });
        } else {
            toast({ title: "Success", description: "Table deleted" });
            router.refresh();
        }
    }

    async function handleToggleActive(id: string, active: boolean) {
        const result = await toggleTableActive(id, active);
        if (result.error) {
            toast({ variant: "destructive", title: "Error", description: result.error });
        } else {
            router.refresh();
        }
    }

    function openEditDialog(table: CafeTable) {
        setEditingTable(table);
        setIsOpen(true);
    }

    function openCreateDialog() {
        setEditingTable(null);
        setIsOpen(true);
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Tables</h1>
                    <p className="text-gray-500 mt-1">Manage your café seating</p>
                </div>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openCreateDialog} size="lg">
                            + Add Table
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingTable ? "Edit Table" : "Add New Table"}
                            </DialogTitle>
                        </DialogHeader>
                        <form action={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Table Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    defaultValue={editingTable?.name || ""}
                                    placeholder="e.g., Table 1, Counter, Patio A"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="seats">Number of Seats</Label>
                                <Input
                                    id="seats"
                                    name="seats"
                                    type="number"
                                    min="1"
                                    defaultValue={editingTable?.seats || 2}
                                    required
                                />
                            </div>
                            {editingTable && (
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="active"
                                        name="active"
                                        defaultChecked={editingTable.active}
                                        value="true"
                                    />
                                    <Label htmlFor="active">Active</Label>
                                </div>
                            )}
                            <DialogFooter>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? "Saving..." : editingTable ? "Update" : "Create"}
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
                            <TableHead>Seats</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tables.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                    No tables yet. Add your first table to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            tables.map((table) => (
                                <TableRow key={table.id}>
                                    <TableCell className="font-medium">{table.name}</TableCell>
                                    <TableCell>{table.seats} seats</TableCell>
                                    <TableCell>
                                        <Switch
                                            checked={table.active}
                                            onCheckedChange={(checked) =>
                                                handleToggleActive(table.id, checked)
                                            }
                                        />
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openEditDialog(table)}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-600 hover:text-red-700"
                                            onClick={() => handleDelete(table.id)}
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
