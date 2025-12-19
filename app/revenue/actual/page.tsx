"use client";

import { useState, useEffect } from "react";
import { SectionShell } from "@/components/ui/section-shell";
import { Button } from "@/components/ui/button";
import { ActualComparisonTable } from "@/components/revenue/actual-comparison-table";
import { FormField } from "@/components/ui/form-field";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function RevenueActualPage() {
    const [year, setYear] = useState(new Date().getFullYear());
    const [comparisonData, setComparisonData] = useState([]);
    const [weights, setWeights] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInput, setShowInput] = useState(false);

    // Form State
    const [sbus, setSbus] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        year: new Date().getFullYear().toString(),
        month: (new Date().getMonth() + 1).toString(),
        sbuId: "",
        typePendapatan: "NR",
        amount: "",
    });

    useEffect(() => {
        fetchComparison();
        fetchSBUs();
    }, [year]);

    const fetchComparison = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/revenue/actual/comparison?year=${year}`);
            if (res.ok) {
                const json = await res.json();
                if (json.data) {
                    setComparisonData(json.data);
                    setWeights(json.weights || []);
                } else {
                    // Fallback for old structure if any
                    setComparisonData(json);
                }
            }
        } catch (e) {
            console.error("Failed to fetch comparison", e);
        } finally {
            setLoading(false);
        }
    };

    const fetchSBUs = async () => {
        const res = await fetch("/api/master/sbu");
        if (res.ok) setSbus(await res.json());
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/revenue/actual/monthly", {
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
            if (res.ok) {
                alert("Saved!");
                fetchComparison(); // Refresh table
                setFormData({ ...formData, amount: "" });
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <main className="min-h-screen p-8">
            <div className="max-w-[95%] mx-auto space-y-6">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">Revenue Actual & Comparison</h1>
                        <p className="text-primary-subtle">Realization vs Weighted Targets</p>
                    </div>
                    <div className="flex gap-4 items-center">
                        <label className="font-bold">Year:</label>
                        <select
                            value={year} onChange={(e) => setYear(Number(e.target.value))}
                            className="px-4 py-2 border rounded-lg"
                        >
                            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>

                <div className="border rounded-xl p-4 bg-white shadow-sm">
                    <button
                        onClick={() => setShowInput(!showInput)}
                        className="flex items-center gap-2 font-bold text-primary w-full justify-between"
                    >
                        <span>Input Monthly Actual Revenue</span>
                        {showInput ? <ChevronUp /> : <ChevronDown />}
                    </button>

                    {showInput && (
                        <form onSubmit={handleSubmit} className="mt-4 grid gap-4 grid-cols-1 md:grid-cols-6 items-end border-t pt-4">
                            <FormField label="Year" htmlFor="year">
                                <input type="number" value={formData.year} onChange={e => setFormData({ ...formData, year: e.target.value })} />
                            </FormField>
                            <FormField label="Month" htmlFor="month">
                                <select value={formData.month} onChange={e => setFormData({ ...formData, month: e.target.value })}>
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </FormField>
                            <FormField label="SBU" htmlFor="sbu">
                                <select value={formData.sbuId} onChange={e => setFormData({ ...formData, sbuId: e.target.value })}>
                                    <option value="">Select SBU</option>
                                    {sbus.map(s => <option key={s.id} value={s.id}>{s.code}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Type" htmlFor="type">
                                <select value={formData.typePendapatan} onChange={e => setFormData({ ...formData, typePendapatan: e.target.value })}>
                                    <option value="NR">NR</option>
                                    <option value="CO">CO</option>
                                </select>
                            </FormField>
                            <FormField label="Amount" htmlFor="amount">
                                <input type="number" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} placeholder="0" />
                            </FormField>
                            <Button type="submit">Save</Button>
                        </form>
                    )}
                </div>

                <ActualComparisonTable data={comparisonData} weights={weights} loading={loading} />
            </div>
        </main>
    );
}
