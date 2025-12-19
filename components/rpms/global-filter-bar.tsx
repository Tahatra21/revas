"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface GlobalFilterBarProps {
    year: number;
    month: number;
    targetType: string;
    onFilterChange: (key: string, value: any) => void;
}

export function GlobalFilterBar({ year, month, targetType, onFilterChange }: GlobalFilterBarProps) {
    return (
        <div className="bg-surface border-b p-4 flex flex-wrap gap-4 items-center justify-between sticky top-0 z-20">
            <div className="flex items-center gap-4">
                <h2 className="text-lg font-bold text-foreground">RPMS Dashboard</h2>
                <div className="h-6 w-px bg-border" />

                {/* Year Select */}
                <Select value={String(year)} onValueChange={(v) => onFilterChange("year", Number(v))}>
                    <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2025">2025</SelectItem>
                    </SelectContent>
                </Select>

                {/* Month Select */}
                <Select value={String(month)} onValueChange={(v) => onFilterChange("month", Number(v))}>
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                            <SelectItem key={m} value={String(m)}>
                                {new Date(0, m - 1).toLocaleString('default', { month: 'long' })}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Target Type Select */}
                <Select value={targetType} onValueChange={(v) => onFilterChange("targetType", v)}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Target Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="RKAP">RKAP</SelectItem>
                        <SelectItem value="BEYOND_RKAP">Beyond RKAP</SelectItem>
                        <SelectItem value="COMMITMENT">Commitment</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Button variant="outline" className="text-xs" disabled>
                Export PDF
            </Button>
        </div>
    );
}
