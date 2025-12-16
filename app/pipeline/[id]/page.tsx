"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Trash2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionShell } from "@/components/ui/section-shell";

interface Pipeline {
    id: number;
    sbu_id: number;
    customer_id: number;
    sbuCode: string;
    customerName: string;
    jenis_layanan: string;
    nama_layanan: string;
    kapasitas: string;
    satuan_kapasitas: string;
    originating: string;
    terminating: string;
    nilai_otc: number;
    nilai_mrc: number;
    est_revenue: number;
    mapping_revenue: number;
    type_pendapatan: string;
    warna_status_potensi: string;
    current_status: string;
    periode_snapshot: string;
}

export default function PipelineDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const [pipeline, setPipeline] = useState<Pipeline | null>(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [id, setId] = useState<string>("");

    useEffect(() => {
        params.then((p) => {
            setId(p.id);
            fetchPipeline(p.id);
        });
    }, [params]);

    const fetchPipeline = async (pipelineId: string) => {
        try {
            const response = await fetch(`/api/pipeline/${pipelineId}`);
            if (!response.ok) throw new Error("Pipeline not found");
            const data = await response.json();
            setPipeline(data);
        } catch (error) {
            console.error("Error fetching pipeline:", error);
            alert("Failed to load pipeline");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this pipeline?")) return;

        try {
            const response = await fetch(`/api/pipeline/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) throw new Error("Failed to delete");

            router.push("/pipeline");
        } catch (error) {
            console.error("Error deleting pipeline:", error);
            alert("Failed to delete pipeline");
        }
    };

    // Helper function to format revenue in billions with M suffix
    const formatRevenue = (value: number): string => {
        const billions = value / 1000000000; // Convert to billions  
        return `Rp ${billions.toFixed(2)} M`;
    };

    if (loading) {
        return (
            <main className="min-h-screen p-8">
                <div className="max-w-4xl mx-auto text-center py-12">
                    <p className="text-primary-subtle">Loading pipeline...</p>
                </div>
            </main>
        );
    }

    if (!pipeline) {
        return (
            <main className="min-h-screen p-8">
                <div className="max-w-4xl mx-auto text-center py-12">
                    <p className="text-primary-subtle">Pipeline not found</p>
                    <Link href="/pipeline">
                        <Button className="mt-4">Back to Pipeline</Button>
                    </Link>
                </div>
            </main>
        );
    }

    const statusColors: Record<string, string> = {
        HIJAU: "bg-emerald-500/20 text-emerald-400 border-emerald-500/50",
        KUNING: "bg-amber-500/20 text-amber-300 border-amber-500/50",
        MERAH: "bg-red-500/20 text-red-400 border-red-500/50",
    };

    return (
        <main className="min-h-screen p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/pipeline">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="w-4 h-4" />
                                Back
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-4xl font-bold">Pipeline Detail</h1>
                            <p className="text-primary-subtle">ID: {pipeline.id}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {!editMode && (
                            <>
                                <Button variant="secondary" onClick={() => setEditMode(true)}>
                                    <Edit className="w-4 h-4" />
                                    Edit
                                </Button>
                                <Button variant="danger" onClick={handleDelete}>
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                </Button>
                            </>
                        )}
                        {editMode && (
                            <>
                                <Button variant="ghost" onClick={() => setEditMode(false)}>
                                    <X className="w-4 h-4" />
                                    Cancel
                                </Button>
                                <Button>
                                    <Save className="w-4 h-4" />
                                    Save
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Basic Information */}
                <SectionShell title="Basic Information">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <p className="text-xs text-primary-subtle mb-1">SBU</p>
                            <p className="font-medium">{pipeline.sbuCode}</p>
                        </div>
                        <div>
                            <p className="text-xs text-primary-subtle mb-1">Customer</p>
                            <p className="font-medium">{pipeline.customerName}</p>
                        </div>
                        <div>
                            <p className="text-xs text-primary-subtle mb-1">Service Name</p>
                            <p className="font-medium">{pipeline.nama_layanan}</p>
                        </div>
                        <div>
                            <p className="text-xs text-primary-subtle mb-1">Service Type</p>
                            <p className="font-medium">{pipeline.jenis_layanan || "-"}</p>
                        </div>
                    </div>
                </SectionShell>

                {/* Revenue Information */}
                <SectionShell title="Revenue Information">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <p className="text-xs text-primary-subtle mb-1">Estimated Revenue</p>
                            <p className="text-2xl font-semibold font-mono">
                                {formatRevenue(pipeline.est_revenue)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-primary-subtle mb-1">Mapping Revenue</p>
                            <p className="text-2xl font-semibold font-mono">
                                {formatRevenue(pipeline.mapping_revenue || 0)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-primary-subtle mb-1">OTC Value</p>
                            <p className="font-medium font-mono">
                                {formatRevenue(pipeline.nilai_otc || 0)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-primary-subtle mb-1">MRC Value</p>
                            <p className="font-medium font-mono">
                                {formatRevenue(pipeline.nilai_mrc || 0)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-primary-subtle mb-1">Revenue Type</p>
                            <p className="font-medium">{pipeline.type_pendapatan || "-"}</p>
                        </div>
                    </div>
                </SectionShell>

                {/* Technical Details */}
                <SectionShell title="Technical Details">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <p className="text-xs text-primary-subtle mb-1">Capacity</p>
                            <p className="font-medium">
                                {pipeline.kapasitas || "-"} {pipeline.satuan_kapasitas || ""}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-primary-subtle mb-1">Originating</p>
                            <p className="font-medium">{pipeline.originating || "-"}</p>
                        </div>
                        <div>
                            <p className="text-xs text-primary-subtle mb-1">Terminating</p>
                            <p className="font-medium">{pipeline.terminating || "-"}</p>
                        </div>
                    </div>
                </SectionShell>

                {/* Status Information */}
                <SectionShell title="Status Information">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <p className="text-xs text-primary-subtle mb-1">Status Color</p>
                            <span
                                className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${statusColors[pipeline.warna_status_potensi]
                                    }`}
                            >
                                {pipeline.warna_status_potensi}
                            </span>
                        </div>
                        <div>
                            <p className="text-xs text-primary-subtle mb-1">Current Status</p>
                            <p className="font-medium">{pipeline.current_status || "-"}</p>
                        </div>
                        <div>
                            <p className="text-xs text-primary-subtle mb-1">Period Snapshot</p>
                            <p className="font-medium">
                                {new Date(pipeline.periode_snapshot).toLocaleDateString("id-ID")}
                            </p>
                        </div>
                    </div>
                </SectionShell>
            </div>
        </main>
    );
}
