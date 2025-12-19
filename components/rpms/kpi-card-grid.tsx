"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Activity, Target, TrendingUp } from "lucide-react";

interface KPIData {
    actualYTD: number;
    targetYTD: number;
    achievementPct: number;
    gap: number;
    forecastAmount: number;
}

interface KPICardGridProps {
    data: KPIData;
    loading?: boolean;
}

export function KPICardGrid({ data, loading }: KPICardGridProps) {
    if (loading) return <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-surface rounded-xl" />)}
    </div>;

    const formatMoney = (val: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4">
            <KPICard
                title="Actual YTD"
                value={formatMoney(data.actualYTD)}
                icon={<Activity className="text-blue-500" />}
                subtext="Realization to date"
            />
            <KPICard
                title="Achievement"
                value={`${data.achievementPct.toFixed(1)}%`}
                icon={<Target className={data.achievementPct >= 95 ? "text-emerald-500" : "text-amber-500"} />}
                subtext="Vs Target YTD"
                statusColor={data.achievementPct >= 95 ? "text-emerald-500" : data.achievementPct >= 80 ? "text-yellow-500" : "text-red-500"}
            />
            <KPICard
                title="Gap"
                value={formatMoney(Math.abs(data.gap))}
                icon={<ArrowDownRight className="text-red-500" />}
                subtext={data.gap >= 0 ? "Surplus" : "Shortfall"}
                statusColor={data.gap >= 0 ? "text-emerald-500" : "text-red-500"}
            />
            <KPICard
                title="EOY Forecast"
                value={formatMoney(data.forecastAmount)}
                icon={<TrendingUp className="text-purple-500" />}
                subtext="Projected End of Year"
            />
        </div>
    );
}

function KPICard({ title, value, icon, subtext, statusColor }: any) {
    return (
        <Card className="bg-surface border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className={cn("text-2xl font-bold", statusColor)}>{value}</div>
                <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
            </CardContent>
        </Card>
    );
}
