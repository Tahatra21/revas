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

interface Customer {
    id: number;
    name: string;
    segmentPlnGroupId: number;
    segmentName: string;
    is_active: boolean;
}

interface Segment {
    id: number;
    code: string;
    name: string;
}

export default function CustomerPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [segments, setSegments] = useState<Segment[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ name: "", segmentPlnGroupId: "" });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [customersRes, segmentsRes] = await Promise.all([
                fetch("/api/master/customer"),
                fetch("/api/master/segment-pln"),
            ]);

            const [customersData, segmentsData] = await Promise.all([
                customersRes.json(),
                segmentsRes.json(),
            ]);

            setCustomers(customersData);
            setSegments(segmentsData);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.segmentPlnGroupId) {
            setErrors({
                name: !formData.name ? "Name is required" : "",
                segmentPlnGroupId: !formData.segmentPlnGroupId ? "Segment is required" : "",
            });
            return;
        }

        try {
            const response = await fetch("/api/master/customer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    segmentPlnGroupId: Number(formData.segmentPlnGroupId),
                }),
            });

            if (!response.ok) throw new Error("Failed to save customer");

            await fetchData();
            resetForm();
        } catch (error) {
            console.error("Error saving customer:", error);
            alert("Failed to save customer");
        }
    };

    const resetForm = () => {
        setFormData({ name: "", segmentPlnGroupId: "" });
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
                        <h1 className="text-4xl font-bold mb-2">Customers</h1>
                        <p className="text-primary-subtle">Manage customer master data</p>
                    </div>
                    <Button onClick={() => setShowForm(!showForm)}>
                        <Plus className="w-4 h-4" />
                        {showForm ? "Cancel" : "New Customer"}
                    </Button>
                </div>

                {/* Form */}
                {showForm && (
                    <SectionShell title="New Customer" description="Enter customer details">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <FormField label="Customer Name" htmlFor="name" required error={errors.name}>
                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="e.g., PT Telkom Indonesia"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </FormField>

                                <FormField label="PLN Group Segment" htmlFor="segmentPlnGroupId" required error={errors.segmentPlnGroupId}>
                                    <select
                                        name="segmentPlnGroupId"
                                        value={formData.segmentPlnGroupId}
                                        onChange={(e) => setFormData({ ...formData, segmentPlnGroupId: e.target.value })}
                                    >
                                        <option value="">Select Segment</option>
                                        {segments.map((segment) => (
                                            <option key={segment.id} value={segment.id}>
                                                {segment.code} - {segment.name}
                                            </option>
                                        ))}
                                    </select>
                                </FormField>
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

                {/* Table */}
                <SectionShell title="All Customers" description={`${customers.length} customers`}>
                    {loading ? (
                        <div className="text-center py-12 text-primary-subtle">Loading...</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Customer Name</TableHead>
                                    <TableHead>PLN Group Segment</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {customers.map((customer) => (
                                    <TableRow key={customer.id}>
                                        <TableCell className="font-medium">{customer.name}</TableCell>
                                        <TableCell>{customer.segmentName}</TableCell>
                                        <TableCell>
                                            <span
                                                className={`inline-flex px-2 py-1 rounded-full text-xs ${customer.is_active
                                                        ? "bg-emerald-500/20 text-emerald-400"
                                                        : "bg-red-500/20 text-red-400"
                                                    }`}
                                            >
                                                {customer.is_active ? "Active" : "Inactive"}
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
