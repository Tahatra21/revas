"use client";

import { useState, useEffect } from "react";
import { Upload, FileSpreadsheet, Download, Calendar, ArrowUpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionShell } from "@/components/ui/section-shell";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Toast } from "@/components/ui/toast";

interface RevenueData {
    kode_bidang: string;
    realisasi_billion: number;
}

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

    useEffect(() => {
        fetchData();
    }, [periodMonth, periodYear]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/revenue/pln?year=${periodYear}&month=${periodMonth}`);
            const result = await response.json();
            setData(result.data || []);
            setHeaders(result.headers || []);
            setLastUpdated(result.lastUpdated);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
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
                // Download result
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `Updated_${file.name}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                // Refresh data
                await fetchData();
                setFile(null); // Reset file
                // Optional: Show success toast
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

                {/* Filters & Actions */}
                <SectionShell title="Period & Data Management" description="Filter data or update via upload">
                    <div className="flex flex-col md:flex-row gap-6 items-end justify-between">
                        <div className="flex gap-4">
                            <div>
                                <label className="block text-xs font-medium mb-1.5 ml-1">Month</label>
                                <select
                                    value={periodMonth}
                                    onChange={(e) => setPeriodMonth(parseInt(e.target.value))}
                                    className="px-4 py-2 rounded-xl border border-surface-border bg-bg text-primary w-40"
                                >
                                    {[...Array(12)].map((_, i) => (
                                        <option key={i + 1} value={i + 1}>
                                            {new Date(0, i).toLocaleString('default', { month: 'long' })}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5 ml-1">Year</label>
                                <input
                                    type="number"
                                    value={periodYear}
                                    onChange={(e) => setPeriodYear(parseInt(e.target.value))}
                                    className="px-4 py-2 rounded-xl border border-surface-border bg-bg text-primary w-28"
                                />
                            </div>
                        </div>

                        {/* Upload Simple UI */}
                        <div className="flex gap-3 items-center">
                            <input
                                id="file-upload-pln"
                                type="file"
                                accept=".xlsx"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                            {file ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-primary-subtle truncate max-w-[150px]">{file.name}</span>
                                    <Button
                                        onClick={handleUpload}
                                        isLoading={isUploading}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                    >
                                        <ArrowUpCircle className="w-4 h-4" />
                                        Process Upload
                                    </Button>
                                    <Button onClick={() => setFile(null)} variant="ghost" size="sm">Cancel</Button>
                                </div>
                            ) : (
                                <Button
                                    onClick={() => document.getElementById("file-upload-pln")?.click()}
                                    variant="outline"
                                >
                                    <Upload className="w-4 h-4" />
                                    Import Update (.xlsx)
                                </Button>
                            )}
                        </div>
                    </div>
                </SectionShell>

                {/* Data Table */}
                <SectionShell
                    title={`Realisasi ${new Date(0, periodMonth - 1).toLocaleString('default', { month: 'long' })} ${periodYear}`}
                    description={lastUpdated ? `Last updated: ${new Date(lastUpdated).toLocaleString()}` : "No data found for this period"}
                >
                    {loading ? (
                        <div className="py-12 text-center text-primary-subtle">Loading data...</div>
                    ) : data.length === 0 ? (
                        <div className="py-12 text-center text-primary-subtle flex flex-col items-center">
                            <FileSpreadsheet className="w-12 h-12 text-slate-200 mb-4" />
                            <p>No data available for this period.</p>
                            <p className="text-xs mt-1">Upload a "Lampiran Pendapatan" file to populate data.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-accent text-white hover:bg-accent">
                                        <TableHead className="w-[50px] text-white">No</TableHead>
                                        {headers.map((header, i) => (
                                            <TableHead key={i} className="whitespace-nowrap text-white font-semibold text-xs uppercase border-r border-white/20 last:border-0 h-10">
                                                {header}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.map((row: any, index: number) => {
                                        // Check if it is a TOTAL row for styling
                                        const firstVal = Object.values(row)[0] as string;
                                        const isTotal = String(firstVal).toUpperCase().includes("TOTAL");

                                        return (
                                            <TableRow key={index} className={isTotal ? "bg-[#339396] font-bold text-white hover:bg-[#339396]" : index % 2 === 0 ? "bg-orange-50/30" : "bg-white"}>
                                                <TableCell className={`text-xs ${isTotal ? "text-white" : "text-primary-subtle"}`}>{index + 1}</TableCell>
                                                {headers.map((header, i) => {
                                                    const val = row[header];
                                                    // Simple formatting heuristic
                                                    let displayVal = val;
                                                    if (typeof val === 'number') {
                                                        displayVal = val.toLocaleString("id-ID", { maximumFractionDigits: 2 });
                                                    }
                                                    return (
                                                        <TableCell key={i} className="text-xs border-r border-slate-100 last:border-0">
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
