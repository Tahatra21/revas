"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { UnitDetailModal } from "./unit-detail-modal";

interface MatrixRow {
    id: number;
    name: string;
    code: string;
    level: string;
    target: number;
    targetFullYear: number;
    coCurrentMonth: number;
    nrCurrentMonth: number;
    actual: number;
    achievementPct: number;
    gap: number;
    status: 'RED' | 'YELLOW' | 'GREEN';
}

interface PerformanceMatrixTableProps {
    data: MatrixRow[];
    loading?: boolean;
    currentYear?: number;
}

export function PerformanceMatrixTable({ data, loading, currentYear }: PerformanceMatrixTableProps) {
    const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
    const year = currentYear || new Date().getFullYear();

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading Matrix...</div>;

    const formatMoney = (val: number) =>
        new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(val);

    // Calculate Global YTD % (Total YTD Target / Total Full Year Target)
    const totalYTD = data.reduce((sum, r) => sum + r.target, 0);
    const totalFull = data.reduce((sum, r) => sum + r.targetFullYear, 0);
    const globalYTDPct = totalFull > 0 ? (totalYTD / totalFull) * 100 : 0;

    return (
        <>
            <UnitDetailModal
                unitId={selectedUnitId}
                isOpen={!!selectedUnitId}
                onClose={() => setSelectedUnitId(null)}
                currentYear={year}
            />

            <div className="rounded-md border bg-surface mx-4 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-900 border-b border-border hover:bg-slate-900">
                            <TableHead className="text-slate-200 w-[200px]">Unit Name</TableHead>
                            <TableHead className="text-slate-200 text-right">Target RKAP</TableHead>
                            <TableHead className="text-slate-200 text-right">
                                Target (YTD) <span className="text-emerald-400 text-xs">({Math.round(globalYTDPct)}%)</span>
                            </TableHead>
                            <TableHead className="text-slate-200 text-right">Actual (YTD)</TableHead>
                            <TableHead className="text-slate-200 text-right text-blue-300">CO (Bulan Ini)</TableHead>
                            <TableHead className="text-slate-200 text-right text-yellow-300">NR (Bulan Ini)</TableHead>
                            <TableHead className="text-slate-200 text-right">% Ach</TableHead>
                            <TableHead className="text-slate-200 text-right">Gap</TableHead>
                            <TableHead className="text-slate-200 text-center">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((row) => (
                            <TableRow key={row.id} className="hover:bg-muted/50 border-b border-white/5">
                                <TableCell className="font-medium">
                                    <div className={cn(
                                        "flex items-center", // Changed to flex-row/items-center or just block if no flex needed. user said "inline". items-center is safe.
                                        row.level === 'DIVISION' && "pl-4",
                                        row.level === 'SUB_UNIT' && "pl-8"
                                    )}>
                                        <button
                                            onClick={() => setSelectedUnitId(row.id)}
                                            className="text-left hover:text-blue-400 hover:underline focus:outline-none transition-colors truncate"
                                        >
                                            <span className="text-foreground hover:text-blue-400">{row.name}</span>
                                        </button>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground">{formatMoney(row.targetFullYear)}</TableCell>
                                <TableCell className="text-right">{formatMoney(row.target)}</TableCell>
                                <TableCell className="text-right">{formatMoney(row.actual)}</TableCell>
                                <TableCell className="text-right text-blue-600 font-medium">{formatMoney(row.coCurrentMonth)}</TableCell>
                                <TableCell className="text-right text-yellow-600 font-medium">{formatMoney(row.nrCurrentMonth)}</TableCell>
                                <TableCell className="text-right font-bold">
                                    <span className={cn(
                                        row.achievementPct >= 95 ? "text-emerald-500" :
                                            row.achievementPct >= 80 ? "text-yellow-500" : "text-red-500"
                                    )}>
                                        {row.achievementPct.toFixed(1)}%
                                    </span>
                                </TableCell>
                                <TableCell className={cn("text-right", row.gap >= 0 ? "text-emerald-500" : "text-red-500")}>
                                    {formatMoney(row.gap)}
                                </TableCell>
                                <TableCell className="text-center">
                                    <StatusPill status={row.status} />
                                </TableCell>
                            </TableRow>
                        ))}
                        {data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={9} className="h-24 text-center">
                                    No data available for this selection.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </>
    );
}

function StatusPill({ status }: { status: MatrixRow['status'] }) {
    const variants = {
        GREEN: "bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30",
        YELLOW: "bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30",
        RED: "bg-red-500/20 text-red-500 hover:bg-red-500/30",
    };

    return (
        <Badge variant="outline" className={cn("font-mono border-0", variants[status])}>
            {status}
        </Badge>
    );
}
