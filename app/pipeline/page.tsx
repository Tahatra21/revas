"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Filter } from "lucide-react";
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
