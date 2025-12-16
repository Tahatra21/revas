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
            formData.append("uploadedBy", "admin");

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
                    description="Upload Lampiran Pendapatan PLN (multi-sheet Excel)"
                >
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Template Info */}
                        <div className="space-y-4">
                            <div className="flex items-start gap-3 p-4 bg-bg/50 rounded-xl border border-surface-border">
                                <FileSpreadsheet className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                                <div className="flex-1">
                                    <h3 className="font-semibold text-sm mb-1">Expected Format</h3>
                                    <p className="text-xs text-primary-subtle mb-2">
                                        File Excel harus mengandung sheet:
                                    </p>
                                    <ul className="text-xs text-primary-subtle space-y-1 list-disc list-inside">
                                        <li>DETAIL NON RETAIL</li>
                                        <li>REVENUE PLN</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Upload File */}
                        <div className="space-y-4">
                            <div className="p-4 bg-bg/50 rounded-xl border border-surface-border">
                                <h3 className="font-semibold text-sm mb-3">Upload Excel File</h3>
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
