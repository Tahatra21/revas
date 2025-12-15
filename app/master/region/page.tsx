"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { SectionShell } from "@/components/ui/section-shell";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "@/components/ui/table";

interface Region {
    id: number;
    code: string;
    name: string;
    is_active: boolean;
}

export default function RegionPage() {
    const [regions, setRegions] = useState<Region[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ code: "", name: "" });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchRegions();
    }, []);

    const fetchRegions = async () => {
        try {
            const response = await fetch("/api/master/region");
            const data = await response.json();
            setRegions(data);
        } catch (error) {
            console.error("Error fetching regions:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.code || !formData.name) {
            setErrors({ code: "Code is required", name: "Name is required" });
            return;
        }

        try {
            const url = editingId ? `/api/master/region/${editingId}` : "/api/master/region";
            const method = editingId ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!response.ok) throw new Error("Failed to save region");

            await fetchRegions();
            resetForm();
        } catch (error) {
            console.error("Error saving region:", error);
            alert("Failed to save region");
        }
    };

    const handleEdit = (region: Region) => {
        setFormData({ code: region.code, name: region.name });
        setEditingId(region.id);
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this region?")) return;

        try {
            const response = await fetch(`/api/master/region/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) throw new Error("Failed to delete region");

            await fetchRegions();
        } catch (error) {
            console.error("Error deleting region:", error);
            alert("Failed to delete region");
        }
    };

    const resetForm = () => {
        setFormData({ code: "", name: "" });
        setEditingId(null);
        setShowForm(false);
        setErrors({});
    };

    return (
        <main className="min-h-screen p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">Regions</h1>
                        <p className="text-primary-subtle">Manage regional divisions</p>
                    </div>
                    <Button onClick={() => setShowForm(!showForm)}>
                        <Plus className="w-4 h-4" />
                        {showForm ? "Cancel" : "New Region"}
                    </Button>
                </div>

                {/* Form */}
                {showForm && (
                    <SectionShell
                        title={editingId ? "Edit Region" : "New Region"}
                        description="Enter region details"
                    >
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <FormField label="Code" htmlFor="code" required error={errors.code}>
                                    <input
                                        type="text"
                                        name="code"
                                        placeholder="e.g., R1"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    />
                                </FormField>

                                <FormField label="Name" htmlFor="name" required error={errors.name}>
                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="e.g., Jawa Barat"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </FormField>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button type="submit">{editingId ? "Update" : "Create"}</Button>
                                <Button type="button" variant="ghost" onClick={resetForm}>
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </SectionShell>
                )}

                {/* Table */}
                <SectionShell
                    title="All Regions"
                    description={`${regions.length} regions`}
                >
                    {loading ? (
                        <div className="text-center py-12 text-primary-subtle">Loading...</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {regions.map((region) => (
                                    <TableRow key={region.id}>
                                        <TableCell className="font-medium">{region.code}</TableCell>
                                        <TableCell>{region.name}</TableCell>
                                        <TableCell>
                                            <span
                                                className={`inline-flex px-2 py-1 rounded-full text-xs ${region.is_active
                                                        ? "bg-emerald-500/20 text-emerald-400"
                                                        : "bg-red-500/20 text-red-400"
                                                    }`}
                                            >
                                                {region.is_active ? "Active" : "Inactive"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEdit(region)}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(region.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </SectionShell>
            </div>
        </main>
    );
}
