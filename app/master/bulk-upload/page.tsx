"use client";

import { useState } from "react";
import { Upload, FileSpreadsheet, Download, Activity, PieChart, ChevronRight, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

interface BulkUploadCardProps {
    title: string;
    description: string;
    icon: React.ElementType;
    onClick: () => void;
    colorClass: string;
    bgClass: string;
}

function BulkUploadCard({ title, description, icon: Icon, onClick, colorClass, bgClass }: BulkUploadCardProps) {
    return (
        <div
            onClick={onClick}
            className="group bg-white p-6 rounded-2xl border border-surface-border shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer flex items-center justify-between"
        >
            <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${bgClass} group-hover:scale-105 transition-transform`}>
                    <Icon className={`w-6 h-6 ${colorClass}`} />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">{title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2">{description}</p>
                </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
        </div>
    );
}

export default function BulkUploadPage() {
    // State
    const [activeModal, setActiveModal] = useState<'rpms' | 'pipeline' | 'pln' | null>(null);

    // Upload States
    const [pipelineFile, setPipelineFile] = useState<File | null>(null);
    const [plnFile, setPlnFile] = useState<File | null>(null);
    const [rpmsFile, setRpmsFile] = useState<File | null>(null);
    const [uploadingPipeline, setUploadingPipeline] = useState(false);
    const [uploadingPln, setUploadingPln] = useState(false);
    const [uploadingRpms, setUploadingRpms] = useState(false);

    const [plnMonth, setPlnMonth] = useState(new Date().getMonth() + 1);
    const [plnYear, setPlnYear] = useState(new Date().getFullYear());
    const [isAdmin, setIsAdmin] = useState(false);
    const [isCheckingRole, setIsCheckingRole] = useState(true);

    // Check role on mount
    useState(() => {
        if (typeof window !== "undefined") {
            try {
                const userStr = localStorage.getItem("user");
                if (userStr) {
                    const user = JSON.parse(userStr);
                    // Standardize role check (case insensitive)
                    if (user.role?.toLowerCase() === 'admin') {
                        setIsAdmin(true);
                    }
                }
            } catch (e) {
                console.error("Error parsing user role", e);
            } finally {
                setIsCheckingRole(false);
            }
        }
    });

    if (!isCheckingRole && !isAdmin) {
        return (
            <main className="min-h-screen p-8 bg-slate-50/50 flex flex-col items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="bg-red-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                        <Activity className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Restricted Access</h1>
                    <p className="text-gray-500 max-w-md mx-auto">
                        You do not have permission to access the Bulk Upload feature.
                        This area is restricted to <strong>Administrators</strong> only.
                    </p>
                    <Button variant="outline" onClick={() => window.history.back()}>
                        Go Back
                    </Button>
                </div>
            </main>
        );
    }


    // Handlers
    const handleRpmsUpload = async () => {
        if (!rpmsFile) return;
        setUploadingRpms(true);
        try {
            const formData = new FormData();
            formData.append("file", rpmsFile);
            const response = await fetch("/api/rpms/upload", { method: "POST", body: formData });
            if (response.ok) {
                const res = await response.json();
                alert(`Success! Processed ${res.count} rows.`);
                setRpmsFile(null);
                setActiveModal(null);
            } else {
                alert("Upload failed.");
            }
        } catch (e) {
            console.error(e);
            alert("Error uploading RPMS file.");
        } finally {
            setUploadingRpms(false);
        }
    };

    const handlePipelineUpload = async () => {
        if (!pipelineFile) { alert("Please select a file first"); return; }
        setUploadingPipeline(true);
        try {
            const formData = new FormData();
            formData.append("file", pipelineFile);
            const response = await fetch("/api/pipeline/bulk-upload", { method: "POST", body: formData });
            if (response.ok) {
                const result = await response.json();
                alert(`Success! Uploaded ${result.inserted || 0} pipeline records.`);
                setPipelineFile(null);
                setActiveModal(null);
            } else {
                const error = await response.json();
                alert(`Error: ${error.message || "Upload failed"}`);
            }
        } catch (error) {
            alert("Network error during upload");
        } finally {
            setUploadingPipeline(false);
        }
    };

    const handlePlnUpload = async () => {
        if (!plnFile) { alert("Please select a file first"); return; }
        setUploadingPln(true);
        try {
            const formData = new FormData();
            formData.append("file", plnFile);
            formData.append("uploaded_by", "admin");
            formData.append("period_month", plnMonth.toString());
            formData.append("period_year", plnYear.toString());

            const response = await fetch("/api/revenue/import", { method: "POST", body: formData });
            if (response.ok) {
                alert("Revenue PLN data uploaded successfully!");
                setPlnFile(null);
                setActiveModal(null);
            } else {
                const error = await response.json();
                alert(`Error: ${error.message || "Upload failed"}`);
            }
        } catch (error) {
            alert("Network error during upload");
        } finally {
            setUploadingPln(false);
        }
    };

    return (
        <main className="min-h-screen p-8 bg-slate-50/50">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Bulk Upload Center</h1>
                    <p className="text-slate-500 mt-2">
                        Centralized data management for easy bulk imports and updates.
                    </p>
                </div>

                {/* Grid Layout */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <BulkUploadCard
                        title="RPMS Data Import"
                        description="Upload Target & Realization data"
                        icon={Activity}
                        colorClass="text-emerald-600"
                        bgClass="bg-emerald-100"
                        onClick={() => setActiveModal('rpms')}
                    />
                    <BulkUploadCard
                        title="Pipeline Management"
                        description="Import multiple pipeline opportunities via Excel"
                        icon={PieChart}
                        colorClass="text-purple-600"
                        bgClass="bg-purple-100"
                        onClick={() => setActiveModal('pipeline')}
                    />
                    <BulkUploadCard
                        title="Revenue PLN"
                        description="Detail Non-Retail revenue data import"
                        icon={FileSpreadsheet}
                        colorClass="text-blue-600"
                        bgClass="bg-blue-100"
                        onClick={() => setActiveModal('pln')}
                    />
                    <BulkUploadCard
                        title="Data Templates"
                        description="Download standard Excel templates for imports"
                        icon={LayoutGrid}
                        colorClass="text-amber-600"
                        bgClass="bg-amber-100"
                        onClick={() => alert("Templates coming soon!")}
                    />
                </div>
            </div>

            {/* Modals */}
            <Modal isOpen={activeModal === 'rpms'} onClose={() => setActiveModal(null)} title="RPMS Data Import">
                <div className="space-y-6">
                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-sm text-emerald-800">
                        Upload file <strong>Book3.xlsx</strong> untuk memperbarui data Target RKAP, Komitmen, Beyond, dan Realisasi.
                    </div>
                    <div className="space-y-4">
                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors">
                            <Activity className="w-10 h-10 text-gray-300 mb-3" />
                            <p className="text-sm text-gray-500 mb-4">Click to select or drag file here</p>
                            <input
                                id="rpms-upload"
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={(e) => setRpmsFile(e.target.files?.[0] || null)}
                                className="hidden"
                            />
                            <Button
                                variant="secondary"
                                onClick={() => document.getElementById("rpms-upload")?.click()}
                            >
                                {rpmsFile ? rpmsFile.name : "Choose File"}
                            </Button>
                        </div>
                        <Button
                            onClick={handleRpmsUpload}
                            disabled={!rpmsFile || uploadingRpms}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            {uploadingRpms ? "Processing..." : "Upload Process"}
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={activeModal === 'pipeline'} onClose={() => setActiveModal(null)} title="Pipeline Import">
                <div className="space-y-6">
                    <div className="flex justify-between items-center bg-purple-50 p-4 rounded-xl border border-purple-100">
                        <span className="text-sm text-purple-800">Need the standard format?</span>
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-purple-700 border-purple-200 hover:bg-purple-100"
                            onClick={() => window.location.href = "/templates/pipeline-template.xlsx"}
                        >
                            <Download className="w-4 h-4 mr-2" /> Template
                        </Button>
                    </div>
                    <div className="space-y-4">
                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors">
                            <PieChart className="w-10 h-10 text-gray-300 mb-3" />
                            <input
                                id="pipeline-upload"
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={(e) => setPipelineFile(e.target.files?.[0] || null)}
                                className="hidden"
                            />
                            <Button
                                variant="secondary"
                                onClick={() => document.getElementById("pipeline-upload")?.click()}
                            >
                                {pipelineFile ? pipelineFile.name : "Select Excel File"}
                            </Button>
                        </div>
                        <Button
                            onClick={handlePipelineUpload}
                            disabled={!pipelineFile || uploadingPipeline}
                            isLoading={uploadingPipeline}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            {uploadingPipeline ? "Uploading..." : "Import Pipeline"}
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={activeModal === 'pln'} onClose={() => setActiveModal(null)} title="Revenue PLN Import">
                <div className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800">
                        Wajib sheet: <strong>DETAIL NON RETAIL</strong>. Bulan/Tahun terdeteksi otomatis.
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 mb-1 block">Month (Override)</label>
                            <select
                                value={plnMonth}
                                onChange={(e) => setPlnMonth(Number(e.target.value))}
                                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            >
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 mb-1 block">Year (Override)</label>
                            <select
                                value={plnYear}
                                onChange={(e) => setPlnYear(Number(e.target.value))}
                                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            >
                                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors">
                            <FileSpreadsheet className="w-10 h-10 text-gray-300 mb-3" />
                            <input
                                id="pln-upload"
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={(e) => setPlnFile(e.target.files?.[0] || null)}
                                className="hidden"
                            />
                            <Button
                                variant="secondary"
                                onClick={() => document.getElementById("pln-upload")?.click()}
                            >
                                {plnFile ? plnFile.name : "Select Excel File"}
                            </Button>
                        </div>
                        <Button
                            onClick={handlePlnUpload}
                            disabled={!plnFile || uploadingPln}
                            isLoading={uploadingPln}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {uploadingPln ? "Uploading..." : "Import Data"}
                        </Button>
                    </div>
                </div>
            </Modal>
        </main>
    );
}
