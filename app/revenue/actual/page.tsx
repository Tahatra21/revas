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

interface Actual {
    id: number;
    year: number;
    month: number;
    monthName: string;
    sbuCode: string;
    sbuName: string;
    typePendapatan: string;
    amount: number;
}

export default function RevenueActualPage() {
    const [sbus, setSbus] = useState<SBU[]>([]);
    const [actuals, setActuals] = useState<Actual[]>([]);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [formData, setFormData] = useState({
        year: new Date().getFullYear().toString(),
        month: (new Date().getMonth() + 1).toString(),
        sbuId: "",
        typePendapatan: "NR",
        amount: "",
    });

    useEffect(() => {
        fetchSBUs();
    }, []);

    useEffect(() => {
        fetchActuals();
    }, [year, month]);

    const fetchSBUs = async () => {
        try {
            const response = await fetch("/api/master/sbu");
            const data = await response.json();
            setSbus(data);
        } catch (error) {
            console.error("Error fetching SBUs:", error);
        }
    };

    const fetchActuals = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `/api/revenue/actual/monthly?year=${year}&month=${month}`
            );
            const data = await response.json();
            setActuals(data);
        } catch (error) {
            console.error("Error fetching actuals:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.sbuId || !formData.amount) {
            alert("Please fill all required fields");
            return;
        }

        try {
            const response = await fetch("/api/revenue/actual/monthly", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    year: Number(formData.year),
                    month: Number(formData.month),
                    sbuId: Number(formData.sbuId),
                    typePendapatan: formData.typePendapatan,
                    amount: Number(formData.amount),
                }),
            });

            if (!response.ok) throw new Error("Failed to save actual revenue");

            await fetchActuals();
            setFormData({
                ...formData,
                sbuId: "",
                amount: "",
            });
            alert("Actual revenue saved successfully!");
        } catch (error) {
            console.error("Error saving actual revenue:", error);
            alert("Failed to save actual revenue");
        }
    };

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return (
        <main className="min-h-screen p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-4xl font-bold mb-2">Actual Revenue</h1>
                    <p className="text-primary-subtle">Record monthly actual revenue by SBU</p>
                </div>

                {/* Input Form */}
                <SectionShell title="Add/Update Actual" description="Enter actual revenue (will upsert if exists)">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-5">
                            <FormField label="Year" htmlFor="year" required>
                                <input
                                    type="number"
                                    name="year"
                                    value={formData.year}
                                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                />
                            </FormField>

                            <FormField label="Month" htmlFor="month" required>
                                <select
                                    name="month"
                                    value={formData.month}
                                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                                >
                                    {monthNames.map((name, idx) => (
                                        <option key={idx + 1} value={idx + 1}>
                                            {name}
                                        </option>
                                    ))}
                                </select>
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
                                            {sbu.code}
                                        </option>
                                    ))}
                                </select>
                            </FormField>

                            <FormField label="Type" htmlFor="typePendapatan" required>
                                <select
                                    name="typePendapatan"
                                    value={formData.typePendapatan}
                                    onChange={(e) => setFormData({ ...formData, typePendapatan: e.target.value })}
                                >
                                    <option value="NR">NR</option>
                                    <option value="CO">CO</option>
                                    <option value="LAIN_LAIN">Lain-lain</option>
                                </select>
                            </FormField>

                            <FormField label="Amount" htmlFor="amount" required>
                                <input
                                    type="number"
                                    name="amount"
                                    placeholder="0"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                />
                            </FormField>
                        </div>

                        <Button type="submit">Save Actual</Button>
                    </form>
                </SectionShell>

                {/* Period Filter */}
                <div className="flex items-center gap-4">
                    <label className="text-sm font-medium">View Period:</label>
                    <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="px-4 py-2 rounded-xl border border-surface-border bg-bg text-primary"
                    >
                        {[2024, 2025, 2026, 2027].map((y) => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                    <select
                        value={month}
                        onChange={(e) => setMonth(Number(e.target.value))}
                        className="px-4 py-2 rounded-xl border border-surface-border bg-bg text-primary"
                    >
                        {monthNames.map((name, idx) => (
                            <option key={idx + 1} value={idx + 1}>{name}</option>
                        ))}
                    </select>
                </div>

                {/* Actuals Table */}
                <SectionShell
                    title={`Actuals for ${monthNames[month - 1]} ${year}`}
                    description={`${actuals.length} records`}
                >
                    {loading ? (
                        <div className="text-center py-12 text-primary-subtle">Loading...</div>
                    ) : actuals.length === 0 ? (
                        <div className="text-center py-12 text-primary-subtle">
                            No actuals found for this period
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>SBU</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {actuals.map((actual) => (
                                    <TableRow key={actual.id}>
                                        <TableCell className="font-medium">
                                            {actual.sbuCode} - {actual.sbuName}
                                        </TableCell>
                                        <TableCell>{actual.typePendapatan}</TableCell>
                                        <TableCell className="text-right">
                                            Rp {actual.amount.toLocaleString("id-ID")}
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
