"use client";

import { useState, useEffect } from "react";
import { SectionShell } from "@/components/ui/section-shell";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

export default function RevenueWeightPage() {
    const [year, setYear] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [weights, setWeights] = useState<any>({
        jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0,
        jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 100
    });

    useEffect(() => {
        fetchWeights();
    }, [year]);

    const fetchWeights = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/revenue/settings/weight?year=${year}`);
            if (response.ok) {
                const data = await response.json();
                setWeights(data);
            }
        } catch (error) {
            console.error("Error fetching weights:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (month: string, value: string) => {
        setWeights((prev: any) => ({
            ...prev,
            [month]: Number(value)
        }));
    };

    const handleSave = async () => {
        // Validation: Non-decreasing
        const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
        for (let i = 0; i < months.length - 1; i++) {
            if (weights[months[i]] > weights[months[i + 1]]) {
                alert(`Error: ${months[i].toUpperCase()} (${weights[months[i]]}%) cannot be greater than ${months[i + 1].toUpperCase()} (${weights[months[i + 1]]}%)`);
                return;
            }
        }
        if (weights.dec !== 100) {
            alert("December must be 100%");
            return;
        }

        try {
            setSaving(true);
            const response = await fetch("/api/revenue/settings/weight", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ year, ...weights }),
            });

            if (!response.ok) throw new Error("Failed to save");
            alert("Weights saved successfully!");
        } catch (error) {
            console.error("Error saving:", error);
            alert("Failed to save weights");
        } finally {
            setSaving(false);
        }
    };

    const monthLabels = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

    return (
        <main className="min-h-screen p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <h1 className="text-4xl font-bold mb-2">Revenue Weighting</h1>
                    <p className="text-primary-subtle">Configure monthly cumulative target percentages</p>
                </div>

                <div className="flex items-center gap-4">
                    <label className="text-sm font-medium">Year:</label>
                    <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="px-4 py-2 rounded-xl border border-surface-border bg-white text-primary"
                    >
                        {[2024, 2025, 2026, 2027].map((y) => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>

                <SectionShell title="Monthly Cumulative Weights (%)" description="Values must be cumulative (non-decreasing) and end at 100%">
                    {loading ? (
                        <div className="p-8 text-center text-slate-500">Loading...</div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-4">
                            {monthLabels.map((m) => (
                                <div key={m} className="flex flex-col gap-2">
                                    <label className="text-sm font-medium uppercase text-slate-600">{m}</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={weights[m]}
                                            onChange={(e) => handleChange(m, e.target.value)}
                                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                            min="0"
                                            max="100"
                                            step="0.01"
                                        />
                                        <span className="absolute right-3 top-2 text-slate-400 text-sm">%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="mt-6 flex justify-end p-4 border-t border-slate-100">
                        <Button onClick={handleSave} disabled={saving || loading}>
                            <Save className="w-4 h-4 mr-2" />
                            {saving ? "Saving..." : "Save Configuration"}
                        </Button>
                    </div>
                </SectionShell>
            </div>
        </main>
    );
}
