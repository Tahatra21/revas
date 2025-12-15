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

interface SBU {
    id: number;
    code: string;
    name: string;
    is_active: boolean;
}

export default function SBUPage() {
    const [sbus, setSbus] = useState<SBU[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ code: "", name: "" });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await fetch("/api/master/sbu");
            const data = await response.json();
            setSbus(data);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.code || !formData.name) {
            setErrors({
                code: !formData.code ? "Code is required" : "",
                name: !formData.name ? "Name is required" : "",
            });
            return;
        }

        try {
            const url = editingId ? `/api/master/sbu/${editingId}` : "/api/master/sbu";
            const method = editingId ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code: formData.code,
                    name: formData.name,
                }),
            });

            if (!response.ok) throw new Error("Failed to save SBU");

            await fetchData();
            resetForm();
        } catch (error) {
            console.error("Error saving SBU:", error);
            alert("Failed to save SBU");
        }
    };

    const handleEdit = (sbu: SBU) => {
        setFormData({
            code: sbu.code,
            name: sbu.name,
        });
        setEditingId(sbu.id);
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this SBU?")) return;

        try {
            const response = await fetch(`/api/master/sbu/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) throw new Error("Failed to delete SBU");

            await fetchData();
        } catch (error) {
            console.error("Error deleting SBU:", error);
            alert("Failed to delete SBU");
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
                        <h1 className="text-4xl font-bold mb-2">SBUs</h1>
                        <p className="text-primary-subtle">Manage Strategic Business Units</p>
                    </div>
                    <Button onClick={() => setShowForm(!showForm)}>
                        <Plus className="w-4 h-4" />
                        {showForm ? "Cancel" : "New SBU"}
                    </Button>
                </div>

                {/* Form */}
                {showForm && (
                    <SectionShell
                        title={editingId ? "Edit SBU" : "New SBU"}
                        description="Enter SBU details"
                    >
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <FormField label="Code" htmlFor="code" required error={errors.code}>
                                    <input
                                        type="text"
                                        name="code"
                                        placeholder="e.g., SBU01"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    />
                                </FormField>

                                <FormField label="Name" htmlFor="name" required error={errors.name}>
                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="e.g., Distribusi Jawa Barat"
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
                <SectionShell title="All SBUs" description={`${sbus.length} SBUs`}>
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
                                {sbus.map((sbu) => (
                                    <TableRow key={sbu.id}>
                                        <TableCell className="font-medium">{sbu.code}</TableCell>
                                        <TableCell>{sbu.name}</TableCell>
                                        <TableCell>
                                            <span
                                                className={`inline-flex px-2 py-1 rounded-full text-xs ${sbu.is_active
                                                    ? "bg-emerald-500/20 text-emerald-400"
                                                    : "bg-red-500/20 text-red-400"
                                                    }`}
                                            >
                                                {sbu.is_active ? "Active" : "Inactive"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="ghost" size="sm" onClick={() => handleEdit(sbu)}>
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(sbu.id)}
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
