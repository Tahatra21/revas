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

interface ServiceCategory {
    id: number;
    code: string;
    name: string;
    level: number;
    parent_id: number | null;
    parent_name: string | null;
    is_active: boolean;
}

export default function ServiceCategoryPage() {
    const [categories, setCategories] = useState<ServiceCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        code: "",
        name: "",
        level: "1",
        parentId: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await fetch("/api/master/service-category");
            const data = await response.json();
            setCategories(data);
        } catch (error) {
            console.error("Error fetching categories:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.code || !formData.name || !formData.level) {
            setErrors({
                code: !formData.code ? "Code is required" : "",
                name: !formData.name ? "Name is required" : "",
                level: !formData.level ? "Level is required" : "",
            });
            return;
        }

        try {
            const response = await fetch("/api/master/service-category", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code: formData.code,
                    name: formData.name,
                    level: Number(formData.level),
                    parentId: formData.parentId ? Number(formData.parentId) : null,
                }),
            });

            if (!response.ok) throw new Error("Failed to save category");

            await fetchCategories();
            resetForm();
            alert("Service category created successfully!");
        } catch (error) {
            console.error("Error saving category:", error);
            alert("Failed to save category");
        }
    };

    const resetForm = () => {
        setFormData({ code: "", name: "", level: "1", parentId: "" });
        setShowForm(false);
        setErrors({});
    };

    const level1Categories = categories.filter((c) => c.level === 1);
    const level2Categories = categories.filter((c) => c.level === 2);

    return (
        <main className="min-h-screen p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">Service Categories</h1>
                        <p className="text-primary-subtle">Manage hierarchical service categories</p>
                    </div>
                    <Button onClick={() => setShowForm(!showForm)}>
                        <Plus className="w-4 h-4" />
                        {showForm ? "Cancel" : "New Category"}
                    </Button>
                </div>

                {/* Form */}
                {showForm && (
                    <SectionShell title="New Service Category" description="Enter category details">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-4">
                                <FormField label="Code" htmlFor="code" required error={errors.code}>
                                    <input
                                        type="text"
                                        name="code"
                                        placeholder="e.g., SC01"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    />
                                </FormField>

                                <FormField label="Name" htmlFor="name" required error={errors.name}>
                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="e.g., Connectivity"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </FormField>

                                <FormField label="Level" htmlFor="level" required error={errors.level}>
                                    <select
                                        name="level"
                                        value={formData.level}
                                        onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                    >
                                        <option value="1">Level 1 (Main Category)</option>
                                        <option value="2">Level 2 (Sub Category)</option>
                                    </select>
                                </FormField>

                                {formData.level === "2" && (
                                    <FormField label="Parent Category" htmlFor="parentId">
                                        <select
                                            name="parentId"
                                            value={formData.parentId}
                                            onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                                        >
                                            <option value="">Select Parent</option>
                                            {level1Categories.map((cat) => (
                                                <option key={cat.id} value={cat.id}>
                                                    {cat.code} - {cat.name}
                                                </option>
                                            ))}
                                        </select>
                                    </FormField>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <Button type="submit">Create</Button>
                                <Button type="button" variant="ghost" onClick={resetForm}>
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </SectionShell>
                )}

                {/* Level 1 Categories */}
                <SectionShell
                    title="Level 1 Categories"
                    description={`${level1Categories.length} main categories`}
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
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {level1Categories.map((category) => (
                                    <TableRow key={category.id}>
                                        <TableCell className="font-medium">{category.code}</TableCell>
                                        <TableCell>{category.name}</TableCell>
                                        <TableCell>
                                            <span
                                                className={`inline-flex px-2 py-1 rounded-full text-xs ${category.is_active
                                                        ? "bg-emerald-500/20 text-emerald-400"
                                                        : "bg-red-500/20 text-red-400"
                                                    }`}
                                            >
                                                {category.is_active ? "Active" : "Inactive"}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </SectionShell>

                {/* Level 2 Categories */}
                <SectionShell
                    title="Level 2 Categories"
                    description={`${level2Categories.length} sub-categories`}
                >
                    {loading ? (
                        <div className="text-center py-12 text-primary-subtle">Loading...</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Parent</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {level2Categories.map((category) => (
                                    <TableRow key={category.id}>
                                        <TableCell className="font-medium">{category.code}</TableCell>
                                        <TableCell>{category.name}</TableCell>
                                        <TableCell>{category.parent_name || "-"}</TableCell>
                                        <TableCell>
                                            <span
                                                className={`inline-flex px-2 py-1 rounded-full text-xs ${category.is_active
                                                        ? "bg-emerald-500/20 text-emerald-400"
                                                        : "bg-red-500/20 text-red-400"
                                                    }`}
                                            >
                                                {category.is_active ? "Active" : "Inactive"}
                                            </span>
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
