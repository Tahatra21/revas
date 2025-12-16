"use client";

import { useState, useEffect } from "react";
import { SectionShell } from "@/components/ui/section-shell";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Edit2, Trash2 } from "lucide-react";
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
    coTahunBerjalan: number;
    targetNr: number;
}

// Predefined SBU order
const SBU_ORDER = ['KONFRA', 'APLIKASI', 'JKB', 'JBB', 'JTG', 'JBT', 'BNR', 'SBU', 'SBT', 'SBS', 'SLW', 'KLM'];

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
                coTahunBerjalan: Number(formData.coTahunBerjalan) || 0,
                targetNr: Number(formData.targetNr) || 0,
            };

            console.log("Saving target with payload:", payload);

            const response = await fetch("/api/revenue/target/yearly", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            console.log("Save response:", data);

            if (!response.ok) {
                throw new Error(data.message || "Failed to save target");
            }

            await fetchTargets();
            resetForm();
            alert("Target saved successfully!");
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
                    coTahunBerjalan: 0,
                    targetNr: 0,
                }),
            });

            await fetchTargets();
            alert("Target deleted successfully!");
        } catch (error) {
            console.error("Error deleting target:", error);
            alert("Failed to delete target");
        }
    };

    const resetForm = () => {
        setFormData({
            sbuId: "",
            targetRkap: "",
            coTahunBerjalan: "",
            targetNr: "",
        });
        setEditingId(null);
        setShowForm(false);
    };

    return (
        <main className="min-h-screen p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    {/* Header */}
                    <div>
                        <h1 className="text-2xl font-bold mb-2">Revenue Target</h1>
                        <p className="text-sm text-primary-subtle">
                            Manage annual revenue targets per SBU
                        </p>
                    </div>
                    <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="px-4 py-2 rounded-xl border border-surface-border bg-bg text-primary"
                    >
                        {[2024, 2025, 2026, 2027].map((y) => (
                            <option key={y} value={y}>
                                Year: {y}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Modal for Add/Edit */}
                <Modal
                    isOpen={showForm}
                    onClose={resetForm}
                    title={editingId ? "Edit Target" : "Add New Target"}
                >
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <FormField label="SBU" htmlFor="sbuId" required>
                                <select
                                    name="sbuId"
                                    value={formData.sbuId}
                                    onChange={(e) => setFormData({ ...formData, sbuId: e.target.value })}
                                    disabled={editingId !== null}
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

                            <FormField label="Target RKAP (Billion)" htmlFor="targetRkap">
                                <input
                                    type="number"
                                    name="targetRkap"
                                    placeholder="0"
                                    value={formData.targetRkap}
                                    onChange={(e) => setFormData({ ...formData, targetRkap: e.target.value })}
                                />
                            </FormField>

                            <FormField label="CO Tahun Berjalan (Billion)" htmlFor="coTahunBerjalan">
                                <input
                                    type="number"
                                    name="coTahunBerjalan"
                                    placeholder="0"
                                    value={formData.coTahunBerjalan}
                                    onChange={(e) => setFormData({ ...formData, coTahunBerjalan: e.target.value })}
                                />
                            </FormField>

                            <FormField label="Target NR (Billion)" htmlFor="targetNr">
                                <input
                                    type="number"
                                    name="targetNr"
                                    placeholder="0"
                                    value={formData.targetNr}
                                    onChange={(e) => setFormData({ ...formData, targetNr: e.target.value })}
                                />
                            </FormField>
                        </div>

                        <div className="flex gap-2 justify-end">
                            <Button type="button" onClick={resetForm}>Cancel</Button>
                            <Button type="submit">{editingId ? "Update" : "Save"} Target</Button>
                        </div>
                    </form>
                </Modal>

                {/* Targets Table */}
                <SectionShell
                    title={`Targets for ${year}`}
                    description={`${targets.length} targets configured`}
                    actions={<Button onClick={() => setShowForm(true)}>+ Add New Target</Button>}
                >
                    {loading ? (
                        <div className="text-center py-12 text-primary-subtle">Loading...</div>
                    ) : targets.length === 0 ? (
                        <div className="text-center py-12 text-primary-subtle">
                            No targets found for {year}. Click "Add New Target" to create one.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-xs">SBU</TableHead>
                                    <TableHead className="text-right text-xs">Target RKAP</TableHead>
                                    <TableHead className="text-right text-xs">CO Tahun Berjalan</TableHead>
                                    <TableHead className="text-right text-xs">Target NR</TableHead>
                                    <TableHead className="text-right text-xs">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {targets.map((target) => (
                                    <TableRow key={target.sbuCode}>
                                        <TableCell className="font-medium">{target.sbuCode}</TableCell>
                                        <TableCell className="text-right text-xs">
                                            Rp {target.targetRkap.toLocaleString("id-ID")} M
                                        </TableCell>
                                        <TableCell className="text-right text-xs">
                                            Rp {target.coTahunBerjalan.toLocaleString("id-ID")} M
                                        </TableCell>
                                        <TableCell className="text-right text-xs">
                                            Rp {target.targetNr.toLocaleString("id-ID")} M
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex gap-2 justify-end">
                                                <button
                                                    onClick={() => handleEdit(target)}
                                                    className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(target.sbuCode)}
                                                    className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
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
