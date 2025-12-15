"use client";

import { useState, useEffect } from "react";
import { Upload, FileSpreadsheet, ArrowUpCircle, X, TrendingUp, Target, DollarSign, AlertCircle } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { Button } from "@/components/ui/button";
import { SectionShell } from "@/components/ui/section-shell";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
// Toast import removed as it wasn't being used correctly or exported


export default function RevenuePLNPage() {
    const [periodMonth, setPeriodMonth] = useState(new Date().getMonth() + 1);
    const [periodYear, setPeriodYear] = useState(new Date().getFullYear());
    const [data, setData] = useState<any[]>([]); // Dynamic row data
    const [headers, setHeaders] = useState<string[]>([]);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Upload states
    const [isUploading, setIsUploading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // KPI Dashboard metrics
    const [kpis, setKpis] = useState({
        target: 0,
        realisasi: 0,
        achievement: 0,
        gap: 0
    });

    useEffect(() => {
        fetchData();
    }, [periodMonth, periodYear]);

    const fetchData = async (overrideMonth?: number, overrideYear?: number) => {
        setLoading(true);
        try {
            const m = overrideMonth || periodMonth;
            const y = overrideYear || periodYear;
            const res = await fetch(`/api/revenue/pln?month=${m}&year=${y}`);
            if (res.ok) {
                const result = await res.json();
                setData(result.data || []);
                setHeaders(result.headers || []);
                setLastUpdated(result.lastUpdated);

                // Calculate KPIs from TOTAL row
                calculateKPIs(result.data || [], result.headers || []);
            } else {
                console.error("Failed to fetch data:", res.status, res.statusText);
                setData([]);
                setHeaders([]);
                setLastUpdated(null);
                setKpis({ target: 0, realisasi: 0, achievement: 0, gap: 0 });
            }
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    const calculateKPIs = (dataRows: any[], headers: string[]) => {
        // Find TOTAL row (last row typically)
        const totalRow = dataRows.find(row => {
            const firstCol = row[headers[0]];
            return typeof firstCol === 'string' && firstCol.toUpperCase().includes('TOTAL');
        });

        if (!totalRow || headers.length === 0) {
            setKpis({ target: 0, realisasi: 0, achievement: 0, gap: 0 });
            return;
        }

        // Find TARGET and REALISASI columns (typically contain these keywords)
        let targetCol = headers.find(h => h.toUpperCase().includes('TARGET') && !h.toUpperCase().includes('NOV') && !h.toUpperCase().includes('DES'));
        let realisasiCol = headers.find(h => (h.toUpperCase().includes('REALISA') || h.toUpperCase().includes('REALISASI')) && h.toUpperCase().includes('SI'));

        const targetVal = targetCol ? (totalRow[targetCol] || 0) : 0;
        const realisasiVal = realisasiCol ? (totalRow[realisasiCol] || 0) : 0;
        const gapVal = targetVal - realisasiVal;
        const achievementPct = targetVal > 0 ? (realisasiVal / targetVal) * 100 : 0;

        setKpis({
            target: targetVal,
            realisasi: realisasiVal,
            achievement: achievementPct,
            gap: gapVal
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("period_month", periodMonth.toString());
            formData.append("period_year", periodYear.toString());

            const response = await fetch("/api/revenue/import", {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                // Read detected period from headers to auto-switch view
                const detectedMonth = response.headers.get("X-Detected-Month");
                const detectedYear = response.headers.get("X-Detected-Year");

                if (detectedMonth) setPeriodMonth(parseInt(detectedMonth));
                if (detectedYear) setPeriodYear(parseInt(detectedYear));

                // Wait for state update then fetch? 
                // Using the NEW values for fetch immediately
                const monthDto = detectedMonth ? parseInt(detectedMonth) : periodMonth;
                const yearDto = detectedYear ? parseInt(detectedYear) : periodYear;

                // Download updated file
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Updated_${file?.name || 'Revenue_PLN.xlsx'}`;
                document.body.appendChild(a);
                a.click();
                a.remove();

                await fetchData(monthDto, yearDto); // Pass explicit args to ensure correct fetch
                setFile(null);
            } else {
                const err = await response.json();
                const errorMessage = err.error || err.message || "Unknown error occurred";
                alert(`Upload failed: ${errorMessage}`);
            }
        } catch (error) {
            console.error("Upload error", error);
            alert("Upload failed due to network error");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteData = async () => {
        const monthName = new Date(0, periodMonth - 1).toLocaleString('default', { month: 'long' });
        const confirmMsg = `Apakah Anda yakin ingin menghapus SEMUA data Revenue PLN untuk ${monthName} ${periodYear}?\n\nData yang dihapus TIDAK DAPAT dikembalikan!`;

        if (!confirm(confirmMsg)) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/revenue/pln?month=${periodMonth}&year=${periodYear}`, {
                method: "DELETE",
            });

            if (response.ok) {
                alert("Data berhasil dihapus");
                await fetchData(); // Refresh to show empty state
            } else {
                const err = await response.json();
                alert(`Gagal menghapus data: ${err.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error("Delete error", error);
            alert("Gagal menghapus data karena network error");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <main className="min-h-screen p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">Revenue PLN</h1>
                        <p className="text-primary-subtle">
                            Data Realisasi Pendapatan PLN per Bidang/SBU
                        </p>
                    </div>
                </div>

                {/* KPI Dashboard - High Level Summary */}
                {data.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <KpiCard
                            label="Target Pendapatan"
                            value={kpis.target.toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                            subLabel="Miliar Rupiah"
                            icon={<Target className="w-5 h-5" />}
                            tone="default"
                        />
                        <KpiCard
                            label="Realisasi"
                            value={kpis.realisasi.toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                            subLabel="Miliar Rupiah"
                            icon={<DollarSign className="w-5 h-5" />}
                            tone={kpis.achievement >= 100 ? "positive" : kpis.achievement >= 80 ? "warning" : "negative"}
                        />
                        <KpiCard
                            label="Achievement"
                            value={kpis.achievement.toFixed(1) + "%"}
                            subLabel={kpis.achievement >= 100 ? "Target tercapai!" : "Dari target"}
                            icon={<TrendingUp className="w-5 h-5" />}
                            tone={kpis.achievement >= 100 ? "positive" : kpis.achievement >= 80 ? "warning" : "negative"}
                        />
                        <KpiCard
                            label="GAP"
                            value={kpis.gap.toLocaleString("id-ID", { maximumFractionDigits: 2, signDisplay: "auto" })}
                            subLabel={kpis.gap < 0 ? "Deficit" : kpis.gap > 0 ? "Surplus" : "Balance"}
                            icon={<AlertCircle className="w-5 h-5" />}
                            tone={kpis.gap < 0 ? "negative" : kpis.gap > 0 ? "positive" : "default"}
                        />
                    </div>
                )}

                {/* Compact Top Bar */}
                <div className="bg-surface border border-surface-border rounded-xl p-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                            <h2 className="text-sm font-semibold">Period & Data</h2>
                            <p className="text-[10px] text-primary-subtle">Filter or update data</p>
                        </div>
                        <div className="h-8 w-[1px] bg-surface-border mx-2"></div>
                        <div className="flex items-center gap-3">
                            <div>
                                <select
                                    value={periodMonth}
                                    onChange={(e) => setPeriodMonth(parseInt(e.target.value))}
                                    className="px-3 py-1.5 rounded-lg border border-surface-border bg-bg text-sm w-36 focus:ring-1 focus:ring-accent outline-none"
                                >
                                    {[...Array(12)].map((_, i) => (
                                        <option key={i + 1} value={i + 1}>
                                            {new Date(0, i).toLocaleString('default', { month: 'long' })}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <input
                                    type="number"
                                    value={periodYear}
                                    onChange={(e) => setPeriodYear(parseInt(e.target.value))}
                                    className="px-3 py-1.5 rounded-lg border border-surface-border bg-bg text-sm w-24 focus:ring-1 focus:ring-accent outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Upload & Delete Actions */}
                    <div className="flex gap-3 items-center">
                        <input
                            id="file-upload-pln"
                            type="file"
                            accept=".xlsx"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                        {file ? (
                            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                                <span className="text-xs text-primary-subtle truncate max-w-[150px]">{file.name}</span>
                                <Button
                                    onClick={handleUpload}
                                    isLoading={isUploading}
                                    size="sm"
                                    className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                                >
                                    <ArrowUpCircle className="w-3 h-3 mr-1.5" />
                                    Process
                                </Button>
                                <Button onClick={() => setFile(null)} variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-red-500">
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        ) : (
                            <Button
                                variant="secondary"
                                onClick={() => document.getElementById("file-upload-pln")?.click()}
                                className="h-9 text-sm px-4 border-dashed border-primary/20 hover:border-primary/50 text-primary-subtle hover:text-primary transition-colors"
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Import Update (.xlsx)
                            </Button>
                        )}

                        {/* Reset/Delete Button */}
                        {data.length > 0 && (
                            <>
                                <div className="h-8 w-[1px] bg-surface-border mx-1"></div>
                                <Button
                                    variant="danger"
                                    onClick={handleDeleteData}
                                    isLoading={isDeleting}
                                    size="sm"
                                    className="h-9 text-xs"
                                >
                                    {isDeleting ? "Menghapus..." : "Reset Data"}
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Data Table */}
                <SectionShell
                    title={`Realisasi ${new Date(0, periodMonth - 1).toLocaleString('default', { month: 'long' })} ${periodYear}`}
                    description={lastUpdated ? `Last updated: ${new Date(lastUpdated).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}` : "No data found for this period"}
                >
                    {loading ? (
                        <div className="py-20 text-center text-primary-subtle animate-pulse">Loading data...</div>
                    ) : data.length === 0 ? (
                        <div className="py-20 text-center text-primary-subtle flex flex-col items-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <FileSpreadsheet className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="font-semibold text-lg text-surface">No Data Available</h3>
                            <p className="max-w-md mx-auto mt-2 mb-6">
                                Start by uploading a "Lampiran Pendapatan.xlsx" file to populate the revenue realization data for this period.
                            </p>
                            <Button variant="secondary" onClick={() => document.getElementById("file-upload-pln")?.click()}>
                                <Upload className="w-4 h-4 mr-2" />
                                Upload Now
                            </Button>
                        </div>
                    ) : (
                        <div className="relative w-full overflow-auto max-h-[calc(100vh-300px)] border rounded-lg shadow-sm">
                            <Table className="w-full table-fixed">
                                <TableHeader className="sticky top-0 z-20">
                                    <TableRow className="bg-[#389196] hover:bg-[#389196] border-b-0">
                                        {headers.map((header, i) => (
                                            <TableHead key={i} className="text-white font-bold text-[10px] uppercase border-r border-white/20 last:border-0 h-auto py-3 text-center align-middle break-words leading-tight">
                                                {header}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.map((row: any, index: number) => {
                                        if (!row) return null;

                                        // Check if it is a TOTAL row for styling
                                        const vals = Object.values(row);
                                        const firstVal = vals.length > 0 ? vals[0] as string : "";
                                        const isTotal = String(firstVal).toUpperCase().includes("TOTAL");

                                        // Row Background logic: Total=Teal, Odd=Beige, Even=White
                                        let rowClass = "bg-white";
                                        if (isTotal) rowClass = "bg-[#389196] text-white font-bold sticky bottom-0 z-10 shadow-lg"; // Sticky Total
                                        else if (index % 2 === 0) rowClass = "bg-[#ffeed9]/30"; // Light Beige

                                        return (
                                            <TableRow key={index} className={`${rowClass} hover:bg-opacity-90 border-b border-black/5`}>
                                                {headers.map((header, i) => {
                                                    const val = row[header];

                                                    // Formatting
                                                    let displayVal = val;
                                                    let alignClass = "text-right"; // Default number alignment

                                                    if (typeof val === 'number') {
                                                        const headerLower = header.toLowerCase();
                                                        if (headerLower.includes("%")) {
                                                            displayVal = (val * 100).toLocaleString("id-ID", {
                                                                maximumFractionDigits: 1,
                                                                signDisplay: "auto"
                                                            }) + "%";
                                                        } else {
                                                            displayVal = val.toLocaleString("id-ID", {
                                                                minimumFractionDigits: 0,
                                                                maximumFractionDigits: 2,
                                                                signDisplay: "auto"
                                                            });
                                                        }
                                                    } else {
                                                        alignClass = "text-left";
                                                        if (!val) displayVal = "-";
                                                    }

                                                    // Specific alignment for first column (BIDANG)
                                                    if (i === 0) {
                                                        alignClass = "text-left font-medium";
                                                        if (typeof displayVal === 'string') {
                                                            displayVal = displayVal.replace(" - JUSOL", "");
                                                        }
                                                    }

                                                    // Explicitly force bold for TOTAL row
                                                    const cellWeight = isTotal ? "font-extrabold" : "";

                                                    return (
                                                        <TableCell key={i} className={`text-[10px] px-1 py-2 border-r border-black/5 last:border-0 ${alignClass} ${cellWeight} break-words leading-tight`}>
                                                            {displayVal}
                                                        </TableCell>
                                                    );
                                                })}
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </SectionShell>
            </div>
        </main>
    );
}
