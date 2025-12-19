"use client";

import { useState, Fragment } from "react";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface MonthData {
    month: number;
    weight: number;
    targetCumulative: number;
    monthlyActual: number;
    cumulativeActual: number;
    achievementPct: number;
}

interface ComparisonData {
    sbu: { id: number; name: string; code: string };
    rkap: MonthData[];
    beyond: MonthData[];
    commitment: MonthData[];
}

interface ActualComparisonTableProps {
    data: ComparisonData[];
    weights?: number[];
    loading: boolean;
}

export function ActualComparisonTable({ data, weights = [], loading }: ActualComparisonTableProps) {
    if (loading) return <div className="text-center p-8 text-primary-subtle">Loading Comparison Data...</div>;
    if (!data || data.length === 0) return <div className="text-center p-8 text-primary-subtle">No Data Available</div>;

    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

    return (
        <div className="overflow-x-auto border rounded-xl bg-surface">
            <Table className="min-w-[2000px]">
                <TableHeader>
                    <TableRow className="bg-slate-900 border-none hover:bg-slate-900">
                        <TableHead className="w-[200px] sticky left-0 z-10 font-bold bg-slate-900 text-slate-200">SBU / Target Type</TableHead>
                        {months.map((m, i) => (
                            <TableHead key={m} className="text-center w-[120px] bg-slate-900 text-slate-400 border-l border-white/10">
                                <div className="flex flex-col items-center py-1">
                                    <span className="text-[10px] text-slate-500 tracking-wider mb-0.5">
                                        {weights[i] ? `${weights[i]}%` : '-'}
                                    </span>
                                    <span className="text-xs text-slate-300">{m}</span>
                                </div>
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((item) => (
                        <Fragment key={item.sbu.id}>
                            {/* SBU Header Row */}
                            <TableRow className="bg-slate-50 font-bold">
                                <TableCell className="sticky left-0 bg-slate-50 z-10" colSpan={13}>
                                    {item.sbu.code} - {item.sbu.name}
                                </TableCell>
                            </TableRow>

                            {/* Render Rows for each Type */}
                            <ComparisonRow
                                label="Target RKAP"
                                data={item.rkap}
                                type="target"
                            />
                            <ComparisonRow
                                label="Actual (Cum)"
                                data={item.rkap} // Comparison base
                                type="actual"
                            />
                            <ComparisonRow
                                label="% Ach (RKAP)"
                                data={item.rkap}
                                type="pct"
                            />
                            {/* Separator */}
                            <TableRow className="h-2 bg-transparent" />
                        </Fragment>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

function ComparisonRow({ label, data, type }: { label: string, data: MonthData[], type: 'target' | 'actual' | 'pct' }) {
    return (
        <TableRow className="hover:bg-transparent">
            <TableCell className="sticky left-0 bg-bg z-10 font-medium text-xs text-primary-subtle border-r">
                {label}
            </TableCell>
            {data.map((m) => (
                <TableCell key={m.month} className="text-right border-l text-xs">
                    {renderCell(type, m)}
                </TableCell>
            ))}
        </TableRow>
    );
}

function renderCell(type: 'target' | 'actual' | 'pct', data: MonthData) {
    if (type === 'target') return formatMoney(data.targetCumulative);
    if (type === 'actual') return formatMoney(data.cumulativeActual);
    if (type === 'pct') {
        const Val = data.achievementPct;
        return (
            <span className={cn(
                "font-bold",
                Val >= 100 ? "text-emerald-600" : Val >= 80 ? "text-yellow-600" : "text-red-600"
            )}>
                {Val.toFixed(1)}%
            </span>
        );
    }
}

function formatMoney(val: number) {
    if (val === 0) return "-";
    return val.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
