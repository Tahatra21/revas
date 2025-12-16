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
    segmentIndustri?: string;
    pelangganGroup?: string;
    newCategory?: string;
    targetAktivasi?: string;
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

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

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

    // Helper function to format revenue in billions with M suffix
    const formatRevenue = (value: number): string => {
        const billions = value / 1000000000; // Convert to billions  
        return `${billions.toFixed(2)} M`;
    };

    const filteredPipelines = pipelines.filter((pipeline) =>
        pipeline.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pipeline.namaLayanan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pipeline.sbuCode?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination calculations
    const totalPages = Math.ceil(filteredPipelines.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedPipelines = filteredPipelines.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedSbu, selectedStatus]);

    return (
        <main className="min-h-screen p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold mb-2">Pipeline Management</h1>
                        <p className="text-sm text-primary-subtle">
                            Manage revenue pipeline opportunities
                        </p>
                    </div>
                    <Link href="/pipeline/new">
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Pipeline
                        </Button>
                    </Link>
                </div>

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
                    title="Pipeline Data"
                    description={`Showing ${paginatedPipelines.length} of ${filteredPipelines.length} opportunities (Page ${currentPage}/${totalPages || 1})`}
                >
                    {loading ? (
                        <div className="text-center py-12 text-primary-subtle text-sm">
                            Loading pipelines...
                        </div>
                    ) : filteredPipelines.length === 0 ? (
                        <div className="text-center py-12 text-primary-subtle text-sm">
                            No pipelines found. Try adjusting your filters.
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-sm">SBU</TableHead>
                                        <TableHead className="text-sm">Segment</TableHead>
                                        <TableHead className="text-sm">Group</TableHead>
                                        <TableHead className="text-sm">Customer Name</TableHead>
                                        <TableHead className="text-sm">Service</TableHead>
                                        <TableHead className="text-right text-sm">Est Revenue</TableHead>
                                        <TableHead className="text-sm">Color</TableHead>
                                        <TableHead className="text-sm">TARGET</TableHead>
                                        <TableHead className="text-right text-sm">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedPipelines.map((pipeline) => (
                                        <TableRow key={pipeline.id}>
                                            <TableCell className="font-medium text-sm">
                                                {pipeline.sbuCode}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {pipeline.segmentIndustri || "-"}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {pipeline.pelangganGroup || "-"}
                                            </TableCell>
                                            <TableCell className="text-sm">{pipeline.customerName}</TableCell>
                                            <TableCell className="max-w-xs truncate text-sm">
                                                {pipeline.namaLayanan}
                                            </TableCell>
                                            <TableCell className="text-right text-sm font-mono">
                                                {formatRevenue(pipeline.estRevenue)}
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
                                                {pipeline.targetAktivasi ? new Date(pipeline.targetAktivasi).toLocaleDateString("id-ID") : "-"}
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

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-surface-border">
                                    <div className="text-xs text-primary-subtle">
                                        Showing {startIndex + 1}-{Math.min(endIndex, filteredPipelines.length)} of {filteredPipelines.length}
                                    </div>
                                    <div className="flex gap-1">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="text-xs"
                                        >
                                            Previous
                                        </Button>
                                        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                                            let pageNum;
                                            if (totalPages <= 7) {
                                                pageNum = i + 1;
                                            } else if (currentPage <= 4) {
                                                pageNum = i + 1;
                                            } else if (currentPage >= totalPages - 3) {
                                                pageNum = totalPages - 6 + i;
                                            } else {
                                                pageNum = currentPage - 3 + i;
                                            }

                                            return (
                                                <Button
                                                    key={pageNum}
                                                    variant={currentPage === pageNum ? "primary" : "secondary"}
                                                    size="sm"
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className="text-xs min-w-[32px]"
                                                >
                                                    {pageNum}
                                                </Button>
                                            );
                                        })}
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="text-xs"
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </SectionShell>
            </div>
        </main>
    );
}
