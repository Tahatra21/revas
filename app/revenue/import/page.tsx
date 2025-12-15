"use client";

import { useState } from "react";
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionShell } from "@/components/ui/section-shell";

export default function RevenueImportPage() {
    const [file, setFile] = useState<File | null>(null);
    const [periodMonth, setPeriodMonth] = useState(new Date().getMonth() + 1);
    const [periodYear, setPeriodYear] = useState(new Date().getFullYear());
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<any>(null); // Success/Error object

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setResult(null);

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
                // Success - file download
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `Updated_${file.name}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                setResult({
                    status: "success",
                    message: "File successfully processed and downloaded!",
                });
                setFile(null);
                // Reset file input
                const fileInput = document.getElementById("file-upload") as HTMLInputElement;
                if (fileInput) fileInput.value = "";
            } else {
                // Error json
                const data = await response.json();
                setResult({
                    status: "error",
                    message: data.message || "Upload failed",
                    details: data.error
                });
            }
        } catch (error: any) {
            console.error("Upload error:", error);
            setResult({
                status: "error",
                message: "Network error or server unavailable",
                details: error.message
            });
        } finally {
            setUploading(false);
        }
    };

    return (
        <main className="min-h-screen p-8">
            <div className="max-w-3xl mx-auto space-y-6">
                <div>
                    <h1 className="text-4xl font-bold mb-2">Revenue Data Import</h1>
                    <p className="text-primary-subtle">
                        Processing "Lampiran Pendapatan" files for Revenue Assurance
                    </p>
                </div>

                <div className="grid gap-6">
                    <SectionShell
                        title="Upload Configuration"
                        description="Select period and file to process"
                    >
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Month</label>
                                    <select
                                        value={periodMonth}
                                        onChange={(e) => setPeriodMonth(parseInt(e.target.value))}
                                        className="w-full px-4 py-2 rounded-xl border border-surface-border bg-bg text-primary"
                                    >
                                        {[...Array(12)].map((_, i) => (
                                            <option key={i + 1} value={i + 1}>
                                                {new Date(0, i).toLocaleString('default', { month: 'long' })}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Year</label>
                                    <input
                                        type="number"
                                        value={periodYear}
                                        onChange={(e) => setPeriodYear(parseInt(e.target.value))}
                                        className="w-full px-4 py-2 rounded-xl border border-surface-border bg-bg text-primary"
                                    />
                                </div>
                            </div>

                            <div className="p-6 border-2 border-dashed border-surface-border rounded-xl bg-surface/50 text-center">
                                <FileSpreadsheet className="w-12 h-12 text-primary-subtle mx-auto mb-3" />
                                <div className="space-y-2">
                                    <label
                                        htmlFor="file-upload"
                                        className="cursor-pointer text-accent hover:underline font-medium"
                                    >
                                        Choose Excel file
                                    </label>
                                    <input
                                        id="file-upload"
                                        type="file"
                                        accept=".xlsx"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                    <p className="text-xs text-primary-subtle">
                                        Surat Lampiran Pendapatan (.xlsx) only
                                    </p>
                                </div>
                                {file && (
                                    <div className="mt-4 p-3 bg-accent/10 rounded-lg inline-flex items-center gap-2 text-sm text-accent">
                                        <FileSpreadsheet className="w-4 h-4" />
                                        {file.name}
                                    </div>
                                )}
                            </div>

                            <Button
                                onClick={handleUpload}
                                disabled={!file || uploading}
                                isLoading={uploading}
                                className="w-full"
                            >
                                <Upload className="w-4 h-4" />
                                {uploading ? "Processing..." : "Process & Download"}
                            </Button>
                        </div>
                    </SectionShell>

                    {result && (
                        <div className={`p-4 rounded-xl border ${result.status === 'success' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                            <div className="flex items-start gap-3">
                                {result.status === 'success' ? (
                                    <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
                                ) : (
                                    <XCircle className="w-6 h-6 text-red-600 shrink-0" />
                                )}
                                <div>
                                    <h3 className={`font-semibold ${result.status === 'success' ? 'text-emerald-900' : 'text-red-900'}`}>
                                        {result.status === 'success' ? 'Success' : 'Processing Failed'}
                                    </h3>
                                    <p className={`text-sm mt-1 ${result.status === 'success' ? 'text-emerald-700' : 'text-red-700'}`}>
                                        {result.message}
                                    </p>
                                    {result.details && (
                                        <div className="mt-2 text-xs font-mono bg-white/50 p-2 rounded">
                                            {result.details}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <SectionShell title="Instructions" description="How to use the import tool">
                        <ul className="text-sm space-y-2 text-primary-subtle list-disc list-inside">
                            <li>Prepare file <strong>Lampiran Pendapatan</strong> (.xlsx)</li>
                            <li>Ensure it contains sheets: <strong>DETAIL NON RETAIL</strong> and <strong>REVENUE PLN</strong></li>
                            <li><strong>DETAIL NON RETAIL</strong> must have columns: "SBU CODE" and "Grand Total"</li>
                            <li><strong>REVENUE PLN</strong> must have headers like "Realisasi [Month]"</li>
                            <li>Select the correct Period (Month/Year) matching the data</li>
                            <li>Click Process to upload. The system will calculate totals and <strong>download the updated file</strong> automatically.</li>
                        </ul>
                    </SectionShell>
                </div>
            </div>
        </main>
    );
}
