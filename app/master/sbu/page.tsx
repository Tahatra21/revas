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
    const [formData, setFormData] = useState({ code: "", name: "", is_active: true });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showInactive, setShowInactive] = useState(false); // Filter toggle

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

            console.log("Saving SBU:", { url, method, formData });

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code: formData.code,
                    name: formData.name,
                    is_active: formData.is_active,
                }),
            });

            console.log("Response status:", response.status);

            if (!response.ok) {
                const errorData = await response.json();
                console.error("API Error:", errorData);
                throw new Error(errorData.message || "Failed to save SBU");
            }

            const result = await response.json();
            console.log("Save successful:", result);

            await fetchData();
            resetForm();
            alert(editingId ? "SBU berhasil diupdate" : "SBU berhasil dibuat");
        } catch (error: any) {
            console.error("Error saving SBU:", error);
            alert(`Gagal menyimpan SBU: ${error.message}`);
        }
    };

    const handleEdit = (sbu: SBU) => {
        setFormData({
            code: sbu.code,
            name: sbu.name,
            is_active: sbu.is_active,
        });
        setEditingId(sbu.id);
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        console.log("Delete clicked for SBU ID:", id);

        if (!confirm("Apakah Anda yakin ingin menghapus SBU ini?\n\nSBU akan dinonaktifkan (soft delete).")) return;

        try {
            console.log("Sending DELETE request...");
            const response = await fetch(`/api/master/sbu/${id}`, {
                method: "DELETE",
            });

            console.log("DELETE response status:", response.status);

            if (!response.ok) {
                const errorData = await response.json();
                console.error("DELETE failed:", errorData);
                throw new Error(errorData.message || "Failed to delete SBU");
            }

            console.log("DELETE successful, refreshing data...");
            await fetchData();
            alert("SBU berhasil dihapus (dinonaktifkan)");
        } catch (error) {
            console.error("Error deleting SBU:", error);
            alert(`Gagal menghapus SBU: ${error}`);
        }
    };

    const resetForm = () => {
        setFormData({ code: "", name: "", is_active: true });
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
                    <Button onClick={() => setShowForm(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        New SBU
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

                            {/* Active Status Checkbox */}
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-300"
                                />
                                <label htmlFor="is_active" className="text-sm">
                                    Active (uncheck to deactivate)
                                </label>
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
                    title="All SBUs"
                    description={`${sbus.filter(s => showInactive || s.is_active).length} SBUs${showInactive ? ' (termasuk inactive)' : ' (hanya active)'}`}
                    actions={
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowInactive(!showInactive)}
                            className="text-xs"
                        >
                            {showInactive ? '✓ Tampilkan Inactive' : 'Tampilkan Inactive'}
                        </Button>
                    }
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
                                {sbus
                                    .filter(sbu => showInactive || sbu.is_active) // Filter: show only active by default
                                    .map((sbu) => (
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
                                                    className="hover:bg-red-500/10 hover:text-red-400"
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
