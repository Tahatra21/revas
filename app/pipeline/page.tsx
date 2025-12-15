"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Upload, Download, FileSpreadsheet, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionShell } from "@/components/ui/section-shell";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "@/components/ui/table";

interface Pipeline {
    id: number;
    sbuCode: string;
    customerName: string;
    namaLayanan: string;
    estRevenue: number;
    currentStatus: string;
    warnaStatusPotensi: "HIJAU" | "KUNING" | "MERAH";
    periodeSnapshot: string;
}

interface SBU {
    id: number;
    code: string;
    name: string;
}

const statusColors = {
    HIJAU: "bg-emerald-500/20 text-emerald-400 border-emerald-500/50",
    KUNING: "bg-amber-500/20 text-amber-300 border-amber-500/50",
    MERAH: "bg-red-500/20 text-red-400 border-red-500/50",
};

export default function PipelinePage() {
    const [pipelines, setPipelines] = useState<Pipeline[]>([]);
    const [sbus, setSbus] = useState<SBU[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSbu, setSelectedSbu] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("");

    // Upload states
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState<any>(null);

    useEffect(() => {
        fetchSBUs();
        fetchPipelines();
    }, [selectedSbu, selectedStatus]);

    const fetchSBUs = async () => {
        try {
            const response = await fetch("/api/master/sbu");
            const data = await response.json();
            setSbus(data);
        } catch (error) {
            console.error("Error fetching SBUs:", error);
        }
    };

    const fetchPipelines = async () => {
        try {
            setLoading(true);
            let url = "/api/pipeline?";
            if (selectedSbu) url += `sbu=${selectedSbu}&`;
            if (selectedStatus) url += `status=${selectedStatus}&`;

            const response = await fetch(url);
            const data = await response.json();
            setPipelines(data);
        } catch (error) {
            console.error("Error fetching pipelines:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setUploadResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setUploadResult(null);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/upload/pipeline", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();
            setUploadResult(data);

            if (response.ok && data.success > 0) {
                setFile(null);
                const fileInput = document.getElementById("file-upload") as HTMLInputElement;
                if (fileInput) fileInput.value = "";
                // Refresh pipeline list
                fetchPipelines();
            }
        } catch (error) {
            console.error("Upload error:", error);
            setUploadResult({ message: "Upload failed", errors: 1 });
        } finally {
            setUploading(false);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const response = await fetch("/api/download/pipeline-template");
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "Pipeline_Upload_Template.xlsx";
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error("Download error:", error);
        }
    };

    const filteredPipelines = pipelines.filter((pipeline) =>
        pipeline.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pipeline.namaLayanan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pipeline.sbuCode?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <main className="min-h-screen p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">Pipeline Management</h1>
                        <p className="text-primary-subtle">
                            Manage revenue pipeline opportunities
                        </p>
                    </div>
                    <Link href="/pipeline/new">
                        <Button>
                            <Plus className="w-4 h-4" />
                            New Pipeline
                        </Button>
                    </Link>
                </div>

                {/* Upload Section */}
                <SectionShell
                    title="Bulk Upload"
                    description="Upload multiple pipeline data from Excel"
                >
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Download Template */}
                        <div className="p-4 rounded-xl border border-surface-border">
                            <div className="flex items-center gap-3 mb-3">
                                <FileSpreadsheet className="w-6 h-6 text-emerald-500" />
                                <div>
                                    <p className="font-medium text-sm">Excel Template</p>
                                    <p className="text-xs text-primary-subtle">
                                        Download template dengan contoh data
                                    </p>
                                </div>
                            </div>
                            <Button onClick={handleDownloadTemplate} variant="secondary" size="sm">
                                <Download className="w-4 h-4" />
                                Download Template
                            </Button>
                        </div>

                        {/* Upload File */}
                        <div className="p-4 rounded-xl border border-surface-border">
                            <div className="mb-3">
                                <label htmlFor="file-upload" className="block text-sm font-medium mb-2">
                                    Upload Excel File
                                </label>
                                <input
                                    id="file-upload"
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={handleFileChange}
                                    className="block w-full text-xs text-primary
                                        file:mr-3 file:py-1.5 file:px-3
                                        file:rounded-lg file:border-0
                                        file:text-xs file:font-semibold
                                        file:bg-accent file:text-white
                                        hover:file:bg-accent/90
                                        file:cursor-pointer cursor-pointer"
                                />
                            </div>
                            <Button
                                onClick={handleUpload}
                                disabled={!file || uploading}
                                isLoading={uploading}
                                size="sm"
                            >
                                <Upload className="w-4 h-4" />
                                {uploading ? "Uploading..." : "Upload Data"}
                            </Button>
                        </div>
                    </div>

                    {/* Upload Result */}
                    {uploadResult && (
                        <div className="mt-4 p-4 rounded-xl border border-surface-border bg-surface">
                            <div className="flex items-center gap-3 mb-2">
                                {uploadResult.errors === 0 ? (
                                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                                ) : (
                                    <XCircle className="w-5 h-5 text-amber-500" />
                                )}
                                <div>
                                    <p className="font-medium text-sm">{uploadResult.message}</p>
                                    <p className="text-xs text-primary-subtle">
                                        Berhasil: {uploadResult.success || 0} | Gagal: {uploadResult.errors || 0}
                                    </p>
                                </div>
                            </div>
                            {uploadResult.errorDetails && uploadResult.errorDetails.length > 0 && (
                                <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                                    <p className="font-medium text-amber-900 text-xs mb-1">Errors:</p>
                                    <ul className="text-xs text-amber-800 space-y-0.5">
                                        {uploadResult.errorDetails.map((error: string, index: number) => (
                                            <li key={index}>• {error}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </SectionShell>

                {/* Filters */}
                <SectionShell title="Filters" description="Filter pipeline data">
                    <div className="grid gap-4 md:grid-cols-3">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-subtle" />
                            <input
                                type="text"
                                placeholder="Search customer or service..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-xl border border-surface-border bg-bg text-primary placeholder:text-primary-subtle focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/70"
                            />
                        </div>

                        {/* SBU Filter */}
                        <select
                            value={selectedSbu}
                            onChange={(e) => setSelectedSbu(e.target.value)}
                            className="px-4 py-2 rounded-xl border border-surface-border bg-bg text-primary focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/70"
                        >
                            <option value="">All SBUs</option>
                            {sbus.map((sbu) => (
                                <option key={sbu.id} value={sbu.id}>
                                    {sbu.code} - {sbu.name}
                                </option>
                            ))}
                        </select>

                        {/* Status Filter */}
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="px-4 py-2 rounded-xl border border-surface-border bg-bg text-primary focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/70"
                        >
                            <option value="">All Status</option>
                            <option value="HIJAU">HIJAU (Most Likely)</option>
                            <option value="KUNING">KUNING (Possible)</option>
                            <option value="MERAH">MERAH (At Risk)</option>
                        </select>
                    </div>
                </SectionShell>

                {/* Pipeline Table */}
                <SectionShell
                    title="Pipeline Opportunities"
                    description={`Showing ${filteredPipelines.length} opportunities`}
                >
                    {loading ? (
                        <div className="text-center py-12 text-primary-subtle">
                            Loading pipelines...
                        </div>
                    ) : filteredPipelines.length === 0 ? (
                        <div className="text-center py-12 text-primary-subtle">
                            No pipelines found. Try adjusting your filters.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>SBU</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Service</TableHead>
                                    <TableHead className="text-right">Est Revenue</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Color</TableHead>
                                    <TableHead>Period</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPipelines.map((pipeline) => (
                                    <TableRow key={pipeline.id}>
                                        <TableCell className="font-medium">
                                            {pipeline.sbuCode}
                                        </TableCell>
                                        <TableCell>{pipeline.customerName}</TableCell>
                                        <TableCell className="max-w-xs truncate">
                                            {pipeline.namaLayanan}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            Rp {pipeline.estRevenue.toLocaleString("id-ID")}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {pipeline.currentStatus || "-"}
                                        </TableCell>
                                        <TableCell>
                                            <span
                                                className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${statusColors[pipeline.warnaStatusPotensi]
                                                    }`}
                                            >
                                                {pipeline.warnaStatusPotensi}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {new Date(pipeline.periodeSnapshot).toLocaleDateString("id-ID")}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link href={`/pipeline/${pipeline.id}`}>
                                                <Button variant="ghost" size="sm">
                                                    View
                                                </Button>
                                            </Link>
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
