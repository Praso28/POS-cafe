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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { TableWithFloor, Floor } from "@/lib/types/database";
import {
    createTable,
    updateTable,
    deleteTable,
    toggleTableActive,
} from "@/lib/actions/tables";

interface TablesClientProps {
    initialTables: TableWithFloor[];
    floors: Floor[];
}

export function TablesClient({ initialTables, floors }: TablesClientProps) {
    const [tables, setTables] = useState(initialTables);
    const [isOpen, setIsOpen] = useState(false);
    const [editingTable, setEditingTable] = useState<TableWithFloor | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedFloor, setSelectedFloor] = useState<string>("");
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

    function openEditDialog(table: TableWithFloor) {
        setEditingTable(table);
        setSelectedFloor(table.floor_id || "");
        setIsOpen(true);
    }

    function openCreateDialog() {
        setEditingTable(null);
        setSelectedFloor("");
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
                            <div className="space-y-2">
                                <Label htmlFor="floor_id">Floor (Optional)</Label>
                                <Select
                                    name="floor_id"
                                    value={selectedFloor}
                                    onValueChange={setSelectedFloor}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a floor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">No Floor</SelectItem>
                                        {floors.map((floor) => (
                                            <SelectItem key={floor.id} value={floor.id}>
                                                {floor.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <input type="hidden" name="floor_id" value={selectedFloor} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="appointment_resource">Appointment Resource (Optional)</Label>
                                <Input
                                    id="appointment_resource"
                                    name="appointment_resource"
                                    defaultValue={editingTable?.appointment_resource || ""}
                                    placeholder="e.g., Resource ID for booking system"
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
                            <TableHead>Floor</TableHead>
                            <TableHead>Seats</TableHead>
                            <TableHead>Occupancy</TableHead>
                            <TableHead>Active</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tables.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                    No tables yet. Add your first table to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            tables.map((table) => {
                                const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
                                    available: { bg: 'bg-green-100', text: 'text-green-700', label: '✅ Available' },
                                    occupied: { bg: 'bg-red-100', text: 'text-red-700', label: '🔴 Occupied' },
                                    reserved: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '📅 Reserved' },
                                    cleaning: { bg: 'bg-purple-100', text: 'text-purple-700', label: '🧹 Cleaning' },
                                };
                                const status = statusConfig[table.status || 'available'] || statusConfig.available;
                                
                                return (
                                    <TableRow key={table.id}>
                                        <TableCell className="font-medium">{table.name}</TableCell>
                                        <TableCell>
                                            {table.floors ? (
                                                <span className="text-sm text-gray-600">{table.floors.name}</span>
                                            ) : (
                                                <span className="text-sm text-gray-400 italic">No floor</span>
                                            )}
                                        </TableCell>
                                        <TableCell>{table.seats} seats</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                                                {status.label}
                                            </span>
                                        </TableCell>
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
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
