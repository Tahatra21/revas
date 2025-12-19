"use client";

import { useState, useEffect } from "react";
import { SectionShell } from "@/components/ui/section-shell";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Edit2, Trash2, TrendingUp, Target as TargetIcon, Calendar } from "lucide-react";
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
    is_active?: boolean;
}

interface Target {
    id?: number;
    year: number;
    sbuCode: string;
    sbuName: string;
    targetRkap: number;
    targetKomitmen: number;
    targetBeyondRkap: number;
    coTahunBerjalan: number;
    targetNr: number;
}

// Predefined SBU order
const SBU_ORDER = ['KONFRA', 'APLIKASI', 'JKB', 'JBB', 'JTG', 'JBT', 'BNR', 'SBU', 'SBT', 'SBS', 'SLW', 'KLM'];

// Monthly Percentages (Cumulative)
const MONTHLY_PERCENTAGES = [5, 10, 15, 20, 25, 40, 45, 55, 65, 80, 90, 100];
const MONTH_NAMES = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export default function RevenueTargetPage() {
    const [sbus, setSbus] = useState<SBU[]>([]);
    const [targets, setTargets] = useState<Target[]>([]);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(new Date().getFullYear());
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        sbuId: "",
        targetRkap: "",
        targetKomitmen: "",
        targetBeyondRkap: "",
        coTahunBerjalan: "",
        targetNr: "",
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
            setSbus(data.filter((s: SBU) => s.is_active !== false));
        } catch (error) {
            console.error("Error fetching SBUs:", error);
        }
    };

    const fetchTargets = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/revenue/target/yearly?year=${year}`);
            const data = await response.json();

            if (Array.isArray(data)) {
                // Sort by SBU_ORDER
                const sorted = data.sort((a, b) => {
                    const indexA = SBU_ORDER.indexOf(a.sbuCode);
                    const indexB = SBU_ORDER.indexOf(b.sbuCode);
                    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
                });
                setTargets(sorted);
            } else {
                setTargets([]);
            }
        } catch (error) {
            console.error("Error fetching targets:", error);
            setTargets([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.sbuId) {
            alert("Please select an SBU");
            return;
        }

        try {
            const payload = {
                year: year,
                sbuId: Number(formData.sbuId),
                targetRkap: Number(formData.targetRkap) || 0,
                targetKomitmen: Number(formData.targetKomitmen) || 0,
                targetBeyondRkap: Number(formData.targetBeyondRkap) || 0,
                coTahunBerjalan: Number(formData.coTahunBerjalan) || 0,
                targetNr: Number(formData.targetNr) || 0,
            };

            const response = await fetch("/api/revenue/target/yearly", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to save target");
            }

            await fetchTargets();
            resetForm();
        } catch (error: any) {
            console.error("Error saving target:", error);
            alert(`Failed to save target: ${error.message}`);
        }
    };

    const handleEdit = (target: Target) => {
        const sbu = sbus.find(s => s.code === target.sbuCode);
        if (sbu) {
            setFormData({
                sbuId: sbu.id.toString(),
                targetRkap: target.targetRkap.toString(),
                targetKomitmen: target.targetKomitmen.toString(),
                targetBeyondRkap: target.targetBeyondRkap.toString(),
                coTahunBerjalan: target.coTahunBerjalan.toString(),
                targetNr: target.targetNr.toString(),
            });
            setEditingId(target.id || null);
            setShowForm(true);
        }
    };

    const handleDelete = async (sbuCode: string) => {
        if (!confirm(`Delete target for ${sbuCode}?`)) return;

        try {
            const sbu = sbus.find(s => s.code === sbuCode);
            if (!sbu) return;

            // Set all values to 0 to "delete"
            await fetch("/api/revenue/target/yearly", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    year: year,
                    sbuId: sbu.id,
                    targetRkap: 0,
                    targetKomitmen: 0,
                    targetBeyondRkap: 0,
                    coTahunBerjalan: 0,
                    targetNr: 0,
                }),
            });

            await fetchTargets();
        } catch (error) {
            console.error("Error deleting target:", error);
            alert("Failed to delete target");
        }
    };

    const resetForm = () => {
        setFormData({
            sbuId: "",
            targetRkap: "",
            targetKomitmen: "",
            targetBeyondRkap: "",
            coTahunBerjalan: "",
            targetNr: "",
        });
        setEditingId(null);
        setShowForm(false);
    };

    // Auto-calculate RKAP if CO and NR are provided
    useEffect(() => {
        if (!editingId && formData.coTahunBerjalan && formData.targetNr) {
            const co = Number(formData.coTahunBerjalan) || 0;
            const nr = Number(formData.targetNr) || 0;
            const rkap = co + nr;
            setFormData(prev => ({ ...prev, targetRkap: rkap.toString() }));
        }
    }, [formData.coTahunBerjalan, formData.targetNr]);

    // Calculate totals
    const totals = targets.reduce((acc, curr) => ({
        targetRkap: acc.targetRkap + Number(curr.targetRkap),
        targetKomitmen: acc.targetKomitmen + Number(curr.targetKomitmen),
        targetBeyondRkap: acc.targetBeyondRkap + Number(curr.targetBeyondRkap),
        coTahunBerjalan: acc.coTahunBerjalan + Number(curr.coTahunBerjalan),
        targetNr: acc.targetNr + Number(curr.targetNr),
    }), {
        targetRkap: 0,
        targetKomitmen: 0,
        targetBeyondRkap: 0,
        coTahunBerjalan: 0,
        targetNr: 0,
    });

    return (
        <main className="min-h-screen bg-bg/50 p-6 md:p-8">
            <div className="max-w-[1920px] mx-auto space-y-6">
                {/* Modern Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-6 rounded-2xl shadow-sm border border-surface-border">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <TargetIcon className="w-6 h-6 text-accent" />
                            Revenue Target
                        </h1>
                        <p className="text-sm text-primary-subtle">
                            Annual revenue targets and monthly realization milestones for PLN Group
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-bg rounded-lg border border-surface-border">
                            <Calendar className="w-4 h-4 text-primary-subtle" />
                            <select
                                value={year}
                                onChange={(e) => setYear(Number(e.target.value))}
                                className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer"
                            >
                                {[2024, 2025, 2026, 2027].map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-2">
                            <Button variant="secondary" onClick={() => window.open(`/api/revenue/target/export?year=${year}`, '_blank')}>
                                Export
                            </Button>
                            <div className="relative">
                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    onChange={async (e) => {
                                        if (e.target.files?.[0]) {
                                            const file = e.target.files[0];
                                            const formData = new FormData();
                                            formData.append('file', file);
                                            formData.append('year', year.toString());

                                            try {
                                                const res = await fetch('/api/revenue/target/import', { method: 'POST', body: formData });
                                                if (res.ok) {
                                                    alert('Import successful');
                                                    fetchTargets();
                                                } else {
                                                    alert('Import failed');
                                                }
                                            } catch (err) {
                                                console.error(err);
                                                alert('Import error');
                                            }
                                            // Reset input
                                            e.target.value = '';
                                        }
                                    }}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                <Button variant="secondary">Import</Button>
                            </div>
                            <Button onClick={() => setShowForm(true)} className="shadow-lg shadow-accent/20">
                                + Add Target
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Main Content Card */}
                <div className="bg-surface rounded-2xl shadow-sm border border-surface-border overflow-hidden">
                    <div className="p-6 border-b border-surface-border flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-bold text-primary">Target PLN Group {year}</h2>
                            <p className="text-xs text-primary-subtle mt-1 font-mono">Figures in Milyar (M) IDR</p>
                        </div>
                        <div className="flex gap-4 text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                <span className="text-primary-subtle">RKAP</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                <span className="text-primary-subtle">Komitmen</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                <span className="text-primary-subtle">Beyond</span>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-900 border-none hover:bg-slate-900">
                                    <TableHead className="w-[120px] bg-slate-900 text-slate-200 font-semibold sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]">SBU/DIV</TableHead>
                                    <TableHead className="text-right bg-slate-900 text-blue-200 font-semibold min-w-[110px]">TARGET RKAP</TableHead>
                                    <TableHead className="text-right bg-slate-900 text-emerald-200 font-semibold min-w-[120px]">TARGET KOMITMEN</TableHead>
                                    <TableHead className="text-right bg-slate-900 text-amber-200 font-semibold min-w-[120px]">TARGET BEYOND</TableHead>
                                    <TableHead className="text-right bg-slate-900/95 text-slate-300 font-medium min-w-[100px] border-l border-white/10">CO</TableHead>
                                    <TableHead className="text-right bg-slate-900/95 text-slate-300 font-medium min-w-[100px]">NR</TableHead>

                                    <TableHead className="text-right bg-slate-900 text-slate-200">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-16 text-primary-subtle animate-pulse">Loading data...</TableCell>
                                    </TableRow>
                                ) : targets.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-16 text-primary-subtle">
                                            No targets found for {year}. <br />
                                            <span className="text-xs mt-2 inline-block">Click "Add Target" to get started.</span>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    <>
                                        {targets.map((target, idx) => (
                                            <TableRow key={target.sbuCode} className={`group hover:bg-slate-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'}`}>
                                                <TableCell className="font-bold sticky left-0 z-10 bg-inherit shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] text-slate-700">
                                                    {target.sbuCode}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold text-blue-700 tabular-nums">
                                                    {target.targetRkap.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </TableCell>
                                                <TableCell className="text-right font-medium text-emerald-700 tabular-nums bg-emerald-50/30">
                                                    {target.targetKomitmen.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </TableCell>
                                                <TableCell className="text-right font-medium text-amber-700 tabular-nums bg-amber-50/30">
                                                    {target.targetBeyondRkap.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </TableCell>
                                                <TableCell className="text-right text-slate-500 tabular-nums border-l border-slate-100">
                                                    {target.coTahunBerjalan.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </TableCell>
                                                <TableCell className="text-right text-slate-500 tabular-nums">
                                                    {target.targetNr.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </TableCell>

                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handleEdit(target)} className="p-1.5 hover:bg-white border border-transparent hover:border-surface-border rounded-md shadow-sm transition-all text-slate-500 hover:text-blue-600">
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button onClick={() => handleDelete(target.sbuCode)} className="p-1.5 hover:bg-white border border-transparent hover:border-surface-border rounded-md shadow-sm transition-all text-slate-500 hover:text-red-600">
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}

                                        {/* TOTAL ROW */}
                                        <TableRow className="bg-slate-900 hover:bg-slate-900 border-t-2 border-slate-800">
                                            <TableCell className="sticky left-0 z-10 bg-slate-900 text-white font-bold tracking-wider shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">TOTAL</TableCell>
                                            <TableCell className="text-right font-bold text-blue-400 tabular-nums text-base">
                                                {totals.targetRkap.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-emerald-400 tabular-nums text-base">
                                                {totals.targetKomitmen.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-amber-400 tabular-nums text-base">
                                                {totals.targetBeyondRkap.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-slate-400 tabular-nums border-l border-white/10">
                                                {totals.coTahunBerjalan.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-slate-400 tabular-nums">
                                                {totals.targetNr.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </TableCell>

                                            <TableCell></TableCell>
                                        </TableRow>
                                    </>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Modal for Add/Edit */}
                <Modal
                    isOpen={showForm}
                    onClose={resetForm}
                    title={editingId ? "Edit Target" : "Add New Target"}
                >
                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <FormField label="SBU / Division" htmlFor="sbuId" required>
                                <select
                                    name="sbuId"
                                    value={formData.sbuId}
                                    onChange={(e) => setFormData({ ...formData, sbuId: e.target.value })}
                                    disabled={editingId !== null}
                                    className="w-full"
                                >
                                    <option value="">Select SBU</option>
                                    {SBU_ORDER.map(code => {
                                        const sbu = sbus.find(s => s.code === code);
                                        return sbu ? (
                                            <option key={sbu.id} value={sbu.id}>
                                                {sbu.code} - {sbu.name}
                                            </option>
                                        ) : null;
                                    })}
                                </select>
                            </FormField>

                            <div className="hidden md:block"></div> {/* Spacer */}

                            <FormField label="Target RKAP (Milyar)" htmlFor="targetRkap">
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-subtle text-sm">Rp</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        name="targetRkap"
                                        value={formData.targetRkap}
                                        onChange={(e) => setFormData({ ...formData, targetRkap: e.target.value })}
                                        className="pl-8 font-mono"
                                    />
                                </div>
                                <p className="text-[10px] text-primary-subtle mt-1">Auto-calculated if CO and NR provided</p>
                            </FormField>

                            <FormField label="Target Komitmen (Milyar)" htmlFor="targetKomitmen">
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-subtle text-sm">Rp</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        name="targetKomitmen"
                                        value={formData.targetKomitmen}
                                        onChange={(e) => setFormData({ ...formData, targetKomitmen: e.target.value })}
                                        className="pl-8 font-mono"
                                    />
                                </div>
                            </FormField>

                            <FormField label="Target Beyond RKAP (Milyar)" htmlFor="targetBeyondRkap">
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-subtle text-sm">Rp</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        name="targetBeyondRkap"
                                        value={formData.targetBeyondRkap}
                                        onChange={(e) => setFormData({ ...formData, targetBeyondRkap: e.target.value })}
                                        className="pl-8 font-mono"
                                    />
                                </div>
                            </FormField>

                            <div className="md:col-span-2 border-t border-surface-border my-2"></div>

                            <FormField label="CO (Milyar)" htmlFor="coTahunBerjalan">
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-subtle text-sm">Rp</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        name="coTahunBerjalan"
                                        value={formData.coTahunBerjalan}
                                        onChange={(e) => setFormData({ ...formData, coTahunBerjalan: e.target.value })}
                                        className="pl-8 font-mono bg-slate-50"
                                    />
                                </div>
                            </FormField>

                            <FormField label="NR (Milyar)" htmlFor="targetNr">
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-subtle text-sm">Rp</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        name="targetNr"
                                        value={formData.targetNr}
                                        onChange={(e) => setFormData({ ...formData, targetNr: e.target.value })}
                                        className="pl-8 font-mono bg-slate-50"
                                    />
                                </div>
                            </FormField>
                        </div>

                        <div className="flex gap-3 justify-end pt-6 border-t border-surface-border">
                            <Button type="button" variant="secondary" onClick={resetForm}>Cancel</Button>
                            <Button type="submit">{editingId ? "Update Changes" : "Save Target"}</Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </main>
    );
}
