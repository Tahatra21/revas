"use client";

import { useState, useEffect } from "react";
import { SectionShell } from "@/components/ui/section-shell";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
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
}

interface Target {
    id: number;
    year: number;
    sbuCode: string;
    sbuName: string;
    kategori: string;
    targetAmount: number;
}

export default function RevenueTargetPage() {
    const [sbus, setSbus] = useState<SBU[]>([]);
    const [targets, setTargets] = useState<Target[]>([]);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(new Date().getFullYear());
    const [formData, setFormData] = useState({
        year: new Date().getFullYear().toString(),
        sbuId: "",
        kategori: "NR",
        targetAmount: "",
    });

    useEffect(() => {
        fetchSBUs();
    }, []);

    useEffect(() => {
        fetchTargets();
    }, [year]);

    const fetchSBUs = async () => {
        try {
            const response = await fetch("/api/master/sbu");
            const data = await response.json();
            setSbus(data);
        } catch (error) {
            console.error("Error fetching SBUs:", error);
        }
    };

    const fetchTargets = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/revenue/target/yearly?year=${year}`);
            const data = await response.json();
            setTargets(data);
        } catch (error) {
            console.error("Error fetching targets:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.sbuId || !formData.targetAmount) {
            alert("Please fill all required fields");
            return;
        }

        try {
            const response = await fetch("/api/revenue/target/yearly", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    year: Number(formData.year),
                    sbuId: Number(formData.sbuId),
                    kategori: formData.kategori,
                    targetAmount: Number(formData.targetAmount),
                }),
            });

            if (!response.ok) throw new Error("Failed to save target");

            await fetchTargets();
            setFormData({
                year: formData.year,
                sbuId: "",
                kategori: "NR",
                targetAmount: "",
            });
            alert("Target saved successfully!");
        } catch (error) {
            console.error("Error saving target:", error);
            alert("Failed to save target");
        }
    };

    return (
        <main className="min-h-screen p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-4xl font-bold mb-2">Revenue Targets</h1>
                    <p className="text-primary-subtle">Manage yearly revenue targets by SBU</p>
                </div>

                {/* Input Form */}
                <SectionShell title="Add/Update Target" description="Enter target details (will upsert if exists)">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-4">
                            <FormField label="Year" htmlFor="year" required>
                                <input
                                    type="number"
                                    name="year"
                                    value={formData.year}
                                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                />
                            </FormField>

                            <FormField label="SBU" htmlFor="sbuId" required>
                                <select
                                    name="sbuId"
                                    value={formData.sbuId}
                                    onChange={(e) => setFormData({ ...formData, sbuId: e.target.value })}
                                >
                                    <option value="">Select SBU</option>
                                    {sbus.map((sbu) => (
                                        <option key={sbu.id} value={sbu.id}>
                                            {sbu.code} - {sbu.name}
                                        </option>
                                    ))}
                                </select>
                            </FormField>

                            <FormField label="Category" htmlFor="kategori" required>
                                <select
                                    name="kategori"
                                    value={formData.kategori}
                                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                                >
                                    <option value="NR">NR (New Revenue)</option>
                                    <option value="CO">CO (Change Order)</option>
                                    <option value="TOTAL">TOTAL</option>
                                </select>
                            </FormField>

                            <FormField label="Target Amount" htmlFor="targetAmount" required>
                                <input
                                    type="number"
                                    name="targetAmount"
                                    placeholder="0"
                                    value={formData.targetAmount}
                                    onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                                />
                            </FormField>
                        </div>

                        <Button type="submit">Save Target</Button>
                    </form>
                </SectionShell>

                {/* Year Filter */}
                <div className="flex items-center gap-4">
                    <label className="text-sm font-medium">View Year:</label>
                    <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="px-4 py-2 rounded-xl border border-surface-border bg-bg text-primary"
                    >
                        {[2024, 2025, 2026, 2027].map((y) => (
                            <option key={y} value={y}>
                                {y}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Targets Table */}
                <SectionShell title={`Targets for ${year}`} description={`${targets.length} targets`}>
                    {loading ? (
                        <div className="text-center py-12 text-primary-subtle">Loading...</div>
                    ) : targets.length === 0 ? (
                        <div className="text-center py-12 text-primary-subtle">
                            No targets found for {year}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>SBU</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead className="text-right">Target Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {targets.map((target) => (
                                    <TableRow key={target.id}>
                                        <TableCell className="font-medium">
                                            {target.sbuCode} - {target.sbuName}
                                        </TableCell>
                                        <TableCell>{target.kategori}</TableCell>
                                        <TableCell className="text-right">
                                            Rp {target.targetAmount.toLocaleString("id-ID")}
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
