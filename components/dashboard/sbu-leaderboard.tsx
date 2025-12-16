"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { TrendingUp, Users } from "lucide-react";

interface SbuLeaderboardProps {
    data: Array<{
        code: string;
        name: string;
        value: number;
        deals: number;
    }>;
}

export function SbuLeaderboard({ data }: SbuLeaderboardProps) {
    if (data.length === 0) {
        return <div className="text-center py-8 text-primary-subtle">No data available</div>;
    }

    const maxValue = Math.max(...data.map(d => d.value));

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[80px]">Rank</TableHead>
                    <TableHead>SBU</TableHead>
                    <TableHead className="text-right">Pipeline Value</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((item, index) => (
                    <TableRow key={item.code}>
                        <TableCell className="font-medium text-primary-subtle">#{index + 1}</TableCell>
                        <TableCell>
                            <div className="flex flex-col">
                                <span className="font-semibold">{item.code}</span>
                                <span className="text-xs text-primary-subtle truncate max-w-[150px]">{item.name}</span>
                                {/* Progress Bar */}
                                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                                    <div
                                        className="bg-accent h-1.5 rounded-full"
                                        style={{ width: `${(item.value / maxValue) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell className="text-right align-top">
                            <div className="font-mono font-medium">Rp {(item.value / 1000000000).toFixed(2)} B</div>
                            <div className="flex items-center justify-end gap-1 text-xs text-primary-subtle mt-1">
                                <TrendingUp className="w-3 h-3" />
                                <span>{item.deals} deals</span>
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
