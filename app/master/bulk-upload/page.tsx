"use client";

import { useState } from "react";
import { Upload, FileSpreadsheet, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionShell } from "@/components/ui/section-shell";

export default function BulkUploadPage() {
    const [pipelineFile, setPipelineFile] = useState<File | null>(null);
    const [plnFile, setPlnFile] = useState<File | null>(null);
    const [uploadingPipeline, setUploadingPipeline] = useState(false);
    const [uploadingPln, setUploadingPln] = useState(false);

    // Manual period override for PLN upload
    const [plnMonth, setPlnMonth] = useState(new Date().getMonth() + 1);
    const [plnYear, setPlnYear] = useState(new Date().getFullYear());

    const handlePipelineUpload = async () => {
        if (!pipelineFile) {
            alert("Please select a file first");
            return;
        }

        setUploadingPipeline(true);
        try {
            const formData = new FormData();
            formData.append("file", pipelineFile);

            const response = await fetch("/api/pipeline/bulk-upload", {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                const result = await response.json();
                alert(`Success! Uploaded ${result.inserted || 0} pipeline records.`);
                setPipelineFile(null);
            } else {
                const error = await response.json();
                alert(`Error: ${error.message || "Upload failed"}`);
            }
        } catch (error) {
            console.error("Pipeline upload error:", error);
            alert("Network error during upload");
        } finally {
            setUploadingPipeline(false);
        }
    };

    const handlePlnUpload = async () => {
        if (!plnFile) {
            alert("Please select a file first");
            return;
        }

        setUploadingPln(true);
        try {
            const formData = new FormData();
            formData.append("file", plnFile);
            formData.append("uploaded_by", "admin");
            // Add manual period override (optional, API will auto-detect if not provided)
            formData.append("period_month", plnMonth.toString());
            formData.append("period_year", plnYear.toString());

            const response = await fetch("/api/revenue/import", {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                alert("Revenue PLN data uploaded successfully!");
                setPlnFile(null);
            } else {
                const error = await response.json();
                alert(`Error: ${error.message || "Upload failed"}`);
            }
        } catch (error) {
            console.error("PLN upload error:", error);
            alert("Network error during upload");
        } finally {
            setUploadingPln(false);
        }
    };

    return (
        <main className="min-h-screen p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-4xl font-bold mb-2">Bulk Upload</h1>
                    <p className="text-primary-subtle">
                        Upload multiple data records from Excel files
                    </p>
                </div>

                {/* Pipeline Upload Section */}
                <SectionShell
                    title="Pipeline Management"
                    description="Upload multiple pipeline data from Excel"
                >
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Template Download */}
                        <div className="space-y-4">
                            <div className="flex items-start gap-3 p-4 bg-bg/50 rounded-xl border border-surface-border">
                                <FileSpreadsheet className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-1" />
                                <div className="flex-1">
                                    <h3 className="font-semibold text-sm mb-1">Excel Template</h3>
                                    <p className="text-xs text-primary-subtle mb-3">
                                        Download template dengan contoh data
                                    </p>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => {
                                            // Download template logic
                                            window.location.href = "/templates/pipeline-template.xlsx";
                                        }}
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Download Template
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Upload File */}
                        <div className="space-y-4">
                            <div className="p-4 bg-bg/50 rounded-xl border border-surface-border">
                                <h3 className="font-semibold text-sm mb-3">Upload Excel File</h3>
                                <input
                                    id="pipeline-upload"
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={(e) => setPipelineFile(e.target.files?.[0] || null)}
                                    className="hidden"
                                />
                                <div className="space-y-3">
                                    <Button
                                        variant="secondary"
                                        onClick={() => document.getElementById("pipeline-upload")?.click()}
                                        className="w-full"
                                    >
                                        Choose File
                                    </Button>
                                    {pipelineFile && (
                                        <div className="text-xs text-primary-subtle bg-surface px-3 py-2 rounded-lg">
                                            Selected: {pipelineFile.name}
                                        </div>
                                    )}
                                    <Button
                                        onClick={handlePipelineUpload}
                                        disabled={!pipelineFile || uploadingPipeline}
                                        isLoading={uploadingPipeline}
                                        className="w-full"
                                    >
                                        <Upload className="w-4 h-4 mr-2" />
                                        {uploadingPipeline ? "Uploading..." : "Upload Data"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </SectionShell>

                {/* Revenue PLN Upload Section */}
                <SectionShell
                    title="Revenue PLN"
                    description="Upload data DETAIL NON RETAIL (sheet REVENUE PLN optional)"
                >
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Template Info */}
                        <div className="space-y-4">
                            <div className="flex items-start gap-3 p-4 bg-bg/50 rounded-xl border border-surface-border">
                                <FileSpreadsheet className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                                <div className="flex-1">
                                    <h3 className="font-semibold text-sm mb-1">Expected Format</h3>
                                    <p className="text-xs text-primary-subtle mb-2">
                                        File Excel wajib mengandung sheet:
                                    </p>
                                    <ul className="text-xs text-primary-subtle space-y-1 list-disc list-inside">
                                        <li><strong>DETAIL NON RETAIL</strong> (Required)</li>
                                        <li>REVENUE PLN (Optional)</li>
                                    </ul>
                                    <p className="text-xs text-amber-400 mt-3">
                                        💡 Bulan/tahun terdeteksi otomatis dari header Excel, atau dapat di-set manual dibawah.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Upload File */}
                        <div className="space-y-4">
                            <div className="p-4 bg-bg/50 rounded-xl border border-surface-border">
                                <h3 className="font-semibold text-sm mb-3">Upload Excel File</h3>

                                {/* Manual Period Override */}
                                <div className="mb-4 grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-xs text-primary-subtle mb-1 block">Bulan (Override)</label>
                                        <select
                                            value={plnMonth}
                                            onChange={(e) => setPlnMonth(Number(e.target.value))}
                                            className="w-full px-3 py-2 text-sm bg-surface border border-surface-border rounded-lg"
                                        >
                                            <option value={1}>Januari</option>
                                            <option value={2}>Februari</option>
                                            <option value={3}>Maret</option>
                                            <option value={4}>April</option>
                                            <option value={5}>Mei</option>
                                            <option value={6}>Juni</option>
                                            <option value={7}>Juli</option>
                                            <option value={8}>Agustus</option>
                                            <option value={9}>September</option>
                                            <option value={10}>Oktober</option>
                                            <option value={11}>November</option>
                                            <option value={12}>Desember</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-primary-subtle mb-1 block">Tahun (Override)</label>
                                        <select
                                            value={plnYear}
                                            onChange={(e) => setPlnYear(Number(e.target.value))}
                                            className="w-full px-3 py-2 text-sm bg-surface border border-surface-border rounded-lg"
                                        >
                                            <option value={2024}>2024</option>
                                            <option value={2025}>2025</option>
                                            <option value={2026}>2026</option>
                                        </select>
                                    </div>
                                </div>

                                <input
                                    id="pln-upload"
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={(e) => setPlnFile(e.target.files?.[0] || null)}
                                    className="hidden"
                                />
                                <div className="space-y-3">
                                    <Button
                                        variant="secondary"
                                        onClick={() => document.getElementById("pln-upload")?.click()}
                                        className="w-full"
                                    >
                                        Choose File
                                    </Button>
                                    {plnFile && (
                                        <div className="text-xs text-primary-subtle bg-surface px-3 py-2 rounded-lg">
                                            Selected: {plnFile.name}
                                        </div>
                                    )}
                                    <Button
                                        onClick={handlePlnUpload}
                                        disabled={!plnFile || uploadingPln}
                                        isLoading={uploadingPln}
                                        className="w-full"
                                    >
                                        <Upload className="w-4 h-4 mr-2" />
                                        {uploadingPln ? "Uploading..." : "Upload Data"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </SectionShell>
            </div>
        </main>
    );
}
