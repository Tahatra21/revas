"use client";

import { useState, useEffect } from "react";
import { SectionShell } from "@/components/ui/section-shell";
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
    is_active?: boolean;
}

interface TargetData {
    [sbuCode: string]: {
        sbuId: number;
        sbuName: string;
        targetRkap: number;
        coTahunBerjalan: number;
        targetNr: number;
    };
}

// Predefined SBU order
const SBU_ORDER = ['KONFRA', 'APLIKASI', 'JKB', 'JBB', 'JTG', 'JBT', 'BNR', 'SBU', 'SBT', 'SBS', 'SLW', 'KLM'];

export default function RevenueTargetPage() {
    const [sbus, setSbus] = useState<SBU[]>([]);
    const [targets, setTargets] = useState<TargetData>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [year, setYear] = useState(new Date().getFullYear());

    useEffect(() => {
        fetchSBUs();
    }, []);

    useEffect(() => {
        if (sbus.length > 0) {
            fetchTargets();
        }
    }, [year, sbus]);

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

            // Initialize targets object with all SBUs
            const targetsMap: TargetData = {};

            sbus.forEach(sbu => {
                targetsMap[sbu.code] = {
                    sbuId: sbu.id,
                    sbuName: sbu.name,
                    targetRkap: 0,
                    coTahunBerjalan: 0,
                    targetNr: 0
                };
            });

            // Fill in existing data
            if (Array.isArray(data)) {
                data.forEach((target: any) => {
                    if (targetsMap[target.sbuCode]) {
                        targetsMap[target.sbuCode] = {
                            ...targetsMap[target.sbuCode],
                            targetRkap: Number(target.targetRkap) || 0,
                            coTahunBerjalan: Number(target.coTahunBerjalan) || 0,
                            targetNr: Number(target.targetNr) || 0
                        };
                    }
                });
            }

            setTargets(targetsMap);
        } catch (error) {
            console.error("Error fetching targets:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCellChange = (sbuCode: string, field: 'targetRkap' | 'coTahunBerjalan' | 'targetNr', value: string) => {
        setTargets(prev => ({
            ...prev,
            [sbuCode]: {
                ...prev[sbuCode],
                [field]: Number(value) || 0
            }
        }));
    };

    const handleSaveAll = async () => {
        try {
            setSaving(true);

            // Save all SBUs with non-zero values
            const savePromises = Object.entries(targets).map(([sbuCode, data]) => {
                // Only save if at least one target has a value
                if (data.targetRkap > 0 || data.coTahunBerjalan > 0 || data.targetNr > 0) {
                    return fetch("/api/revenue/target/yearly", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            year: year,
                            sbuId: data.sbuId,
                            targetRkap: data.targetRkap,
                            coTahunBerjalan: data.coTahunBerjalan,
                            targetNr: data.targetNr,
                        }),
                    });
                }
                return Promise.resolve();
            });

            await Promise.all(savePromises);
            alert("Target berhasil disimpan!");
            await fetchTargets(); // Refresh data
        } catch (error) {
            console.error("Error saving targets:", error);
            alert("Gagal menyimpan target");
        } finally {
            setSaving(false);
        }
    };

    // Get ordered SBUs
    const orderedSbus = SBU_ORDER.map(code =>
        sbus.find(s => s.code === code)
    ).filter(Boolean) as SBU[];

    return (
        <main className="min-h-screen p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">Revenue Targets</h1>
                        <p className="text-primary-subtle">Manage yearly revenue targets by SBU (in Billion IDR)</p>
                    </div>
                    <div className="flex items-center gap-4">
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
                        <Button onClick={handleSaveAll} disabled={saving || loading}>
                            {saving ? "Saving..." : "Save All Changes"}
                        </Button>
                    </div>
                </div>

                {/* Editable Table */}
                <SectionShell title={`Targets for ${year}`} description="Edit values directly in the table">
                    {loading ? (
                        <div className="text-center py-12 text-primary-subtle">Loading...</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>SBU</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead className="text-right">Target RKAP (Billion)</TableHead>
                                    <TableHead className="text-right">CO Tahun Berjalan (Billion)</TableHead>
                                    <TableHead className="text-right">Target NR (Billion)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orderedSbus.map((sbu) => {
                                    const targetData = targets[sbu.code] || {
                                        sbuId: sbu.id,
                                        sbuName: sbu.name,
                                        targetRkap: 0,
                                        coTahunBerjalan: 0,
                                        targetNr: 0
                                    };

                                    return (
                                        <TableRow key={sbu.code}>
                                            <TableCell className="font-medium">{sbu.code}</TableCell>
                                            <TableCell>{sbu.name}</TableCell>
                                            <TableCell>
                                                <input
                                                    type="number"
                                                    value={targetData.targetRkap}
                                                    onChange={(e) => handleCellChange(sbu.code, 'targetRkap', e.target.value)}
                                                    className="w-full text-right px-2 py-1 rounded border border-surface-border bg-bg"
                                                    placeholder="0"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <input
                                                    type="number"
                                                    value={targetData.coTahunBerjalan}
                                                    onChange={(e) => handleCellChange(sbu.code, 'coTahunBerjalan', e.target.value)}
                                                    className="w-full text-right px-2 py-1 rounded border border-surface-border bg-bg"
                                                    placeholder="0"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <input
                                                    type="number"
                                                    value={targetData.targetNr}
                                                    onChange={(e) => handleCellChange(sbu.code, 'targetNr', e.target.value)}
                                                    className="w-full text-right px-2 py-1 rounded border border-surface-border bg-bg"
                                                    placeholder="0"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </SectionShell>
            </div>
        </main>
    );
}
