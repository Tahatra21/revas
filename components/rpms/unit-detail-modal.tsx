"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface UnitDetailModalProps {
    unitId: number | null;
    isOpen: boolean;
    onClose: () => void;
    currentYear: number;
}

interface MonthlyData {
    month: number;
    monthName: string;
    rkap: number;
    beyond: number;
    commitment: number;
    nr: number;
    actual: number;
}

interface DetailResponse {
    unit: {
        id: number;
        name: string;
        code: string;
        sbuName: string;
    };
    monthlyData: MonthlyData[];
}

export function UnitDetailModal({ unitId, isOpen, onClose, currentYear }: UnitDetailModalProps) {
    const [data, setData] = useState<DetailResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && unitId) {
            setLoading(true);
            setError(null);
            setData(null);

            fetch(`/api/matrix/${unitId}?year=${currentYear}`)
                .then(res => {
                    if (!res.ok) throw new Error("Failed to load details");
                    return res.json();
                })
                .then(setData)
                .catch(err => setError(err.message))
                .finally(() => setLoading(false));
        }
    }, [isOpen, unitId, currentYear]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat("id-ID", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(val);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={data ? data.unit.sbuName : "Loading..."} // Use SBU Name as Title
        >
            <div className="space-y-4">
                {loading && <div className="text-center py-8 text-primary-subtle">Loading data...</div>}

                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg">
                        {error}
                    </div>
                )}

                {data && (
                    <>
                        <div className="text-sm text-primary-subtle mb-2">
                            Code: <span className="text-primary font-medium">{data.unit.code}</span>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto border border-surface-border/50 rounded-lg">
                            <Table>
                                <TableHeader className="bg-surface-active/30 sticky top-0 backdrop-blur-md">
                                    <TableRow>
                                        <TableHead>Month</TableHead>
                                        <TableHead className="text-right">RKAP</TableHead>
                                        <TableHead className="text-right">Beyond</TableHead>
                                        <TableHead className="text-right">Commitment</TableHead>
                                        <TableHead className="text-right">NR</TableHead>
                                        <TableHead className="text-right text-success">Realisasi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.monthlyData.map((row) => (
                                        <TableRow key={row.month} className="hover:bg-surface-hover/50">
                                            <TableCell className="font-medium text-primary-subtle">
                                                {row.monthName}
                                            </TableCell>
                                            <TableCell className="text-right">{formatCurrency(row.rkap)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(row.beyond)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(row.commitment)}</TableCell>
                                            <TableCell className="text-right text-warning">{formatCurrency(row.nr)}</TableCell>
                                            <TableCell className="text-right text-success font-semibold">{formatCurrency(row.actual)}</TableCell>
                                        </TableRow>
                                    ))}
                                    {/* Total Row */}
                                    <TableRow className="bg-surface-active/10 border-t-2 border-surface-border">
                                        <TableCell className="font-bold">TOTAL</TableCell>
                                        <TableCell className="text-right font-bold text-primary">
                                            {formatCurrency(data.monthlyData.reduce((s, x) => s + x.rkap, 0))}
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-primary">
                                            {formatCurrency(data.monthlyData.reduce((s, x) => s + x.beyond, 0))}
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-primary">
                                            {formatCurrency(data.monthlyData.reduce((s, x) => s + x.commitment, 0))}
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-warning">
                                            {formatCurrency(data.monthlyData.reduce((s, x) => s + x.nr, 0))}
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-success">
                                            {formatCurrency(data.monthlyData.reduce((s, x) => s + x.actual, 0))}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}
