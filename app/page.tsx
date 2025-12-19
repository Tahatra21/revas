"use client";

import { useState, useEffect } from "react";
import { Target, TrendingUp, DollarSign, PieChart, Briefcase, Zap } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { SectionShell } from "@/components/ui/section-shell";
import { MonthlyRevenueChart } from "@/components/dashboard/monthly-revenue-chart";
import { MonthlyRevenueBeyondChart } from "@/components/dashboard/monthly-revenue-beyond-chart";
import { PipelineCompositionChart } from "@/components/dashboard/pipeline-composition-chart";
import { GenericPieChart } from "@/components/dashboard/generic-pie-chart";
import { HorizontalBarChart } from "@/components/dashboard/horizontal-bar-chart";
import { SbuLeaderboard } from "@/components/dashboard/sbu-leaderboard";
import { StrategicAnalysisCard } from "@/components/dashboard/strategic-analysis-card";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "@/components/ui/table";

export default function HomePage() {
    const [year, setYear] = useState(new Date().getFullYear());
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, [year]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/dashboard/analytics?year=${year}`);
            if (!response.ok) throw new Error("Failed to fetch dashboard data");
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            // Default empty data structure
            setData({
                summary: {},
                charts: {
                    monthlyRevenue: [],
                    pipelineByStatus: [],
                    pipelineBySegment: [],
                    pipelineByGroup: [],
                    topSegments: [],
                    topProducts: [],
                },
                leaderboard: {
                    sbu: []
                }
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen p-8">
                <div className="max-w-7xl mx-auto text-center py-12">
                    <p className="text-primary-subtle">Loading dashboard analytics...</p>
                </div>
            </main>
        );
    }

    const { summary, charts, leaderboard } = data;

    return (
        <main className="min-h-screen p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header with Year Selector */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
                        <p className="text-primary-subtle">
                            Strategic Revenue Assurance & Pipeline Intelligence
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="text-sm font-medium">Year:</label>
                        <select
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                            className="px-4 py-2 rounded-xl border border-surface-border bg-surface text-primary focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/70"
                        >
                            {[2024, 2025, 2026, 2027].map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Section 1: Executive KPI Cards */}
                <section className="grid gap-4 md:grid-cols-4">
                    <KpiCard
                        label="Weighted Projection"
                        value={`Rp ${(summary.weightedRevenue / 1000000000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} M`}
                        icon={<TrendingUp className="w-4 h-4" />}
                        subLabel="Probability adjusted (90/50/10)"
                        tone="positive"
                    />
                    <KpiCard
                        label="Total Pipeline Value"
                        value={`Rp ${(summary.totalPipelineValue / 1000000000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} M`}
                        icon={<DollarSign className="w-4 h-4" />}
                        subLabel="Gross potential value"
                    />
                    <KpiCard
                        label="Active Opportunities"
                        value={summary.totalDeals?.toLocaleString()}
                        icon={<Briefcase className="w-4 h-4" />}
                        subLabel="Total deals in pipeline"
                    />
                    <KpiCard
                        label="Win Rate Potential"
                        value={`${summary.winRatePotential}%`}
                        icon={<Zap className="w-4 h-4" />}
                        subLabel="% of HIJAU status deals"
                        tone={summary.winRatePotential > 30 ? "positive" : "warning"}
                    />
                </section>

                {/* Section 1.5: Revenue Targets */}
                <section className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                    <div className="bg-white p-6 rounded-2xl border border-surface-border shadow-sm flex flex-col">
                        <span className="text-sm font-medium text-slate-500 mb-1 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            TARGET RKAP
                        </span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-slate-900">
                                {(summary.targetRkap || 0).toLocaleString("id-ID", { maximumFractionDigits: 1 })} M
                            </span>
                        </div>
                        <span className="text-xs text-slate-400 mt-2">Baseline Annual Target</span>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-surface-border shadow-sm flex flex-col">
                        <span className="text-sm font-medium text-slate-500 mb-1 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            TARGET KOMITMEN
                        </span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-emerald-700">
                                {(summary.targetKomitmen || 0).toLocaleString("id-ID", { maximumFractionDigits: 1 })} M
                            </span>
                        </div>
                        <span className="text-xs text-slate-400 mt-2">Commitment Target</span>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-surface-border shadow-sm flex flex-col">
                        <span className="text-sm font-medium text-slate-500 mb-1 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                            TARGET BEYOND
                        </span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-amber-700">
                                {(summary.targetBeyondRkap || 0).toLocaleString("id-ID", { maximumFractionDigits: 1 })} M
                            </span>
                        </div>
                        <span className="text-xs text-slate-400 mt-2">Beyond RKAP Target</span>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-surface-border shadow-sm flex flex-col">
                        <span className="text-sm font-medium text-slate-500 mb-1 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                            TARGET NR
                        </span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-orange-600">
                                {(summary.targetNr || 0).toLocaleString("id-ID", { maximumFractionDigits: 1 })} M
                            </span>
                        </div>
                        <span className="text-xs text-slate-400 mt-2">Non-Retail Target</span>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-surface-border shadow-sm flex flex-col bg-emerald-50/50 border-emerald-100">
                        <span className="text-sm font-medium text-emerald-800 mb-1 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            REALISASI YTD
                        </span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-emerald-800">
                                {(summary.actualTotalYTD || 0).toLocaleString("id-ID", { maximumFractionDigits: 1 })} M
                            </span>
                            <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                                {summary.targetRkap > 0 ? ((summary.actualTotalYTD / summary.targetRkap) * 100).toFixed(1) : 0}% Ach
                            </span>
                        </div>
                        <span className="text-xs text-emerald-600/70 mt-2">Total Actual Revenue</span>
                    </div>
                </section>

                {/* Section 2: Macro Trends */}
                <section className="grid gap-6 grid-cols-1">
                    <SectionShell
                        title="Monthly Revenue Trend (RKAP)"
                        description="Target RKAP vs Realization (NR & CO)"
                    >
                        <MonthlyRevenueChart data={charts.monthlyRevenue} />
                    </SectionShell>

                    <SectionShell
                        title="Monthly Revenue Trend (Beyond)"
                        description="Target Beyond vs Realization (NR & CO)"
                    >
                        <MonthlyRevenueBeyondChart data={charts.monthlyRevenue} />
                    </SectionShell>
                </section>

                {/* Section: Pipeline Composition (3 Pie Charts) */}
                <section className="grid gap-4 md:grid-cols-3">
                    <SectionShell
                        title="By Status"
                        description="Composition by potential status"
                    >
                        {/* Use dedicated component for consistent colors */}
                        <PipelineCompositionChart data={charts.pipelineByStatus.map((d: any) => ({ color: d.name, value: d.value }))} />
                    </SectionShell>

                    <SectionShell
                        title="By Industry Segment"
                        description="Composition by industry"
                    >
                        <GenericPieChart data={charts.pipelineBySegment} />
                    </SectionShell>

                    <SectionShell
                        title="By Customer Group"
                        description="Composition by PLN group"
                    >
                        <GenericPieChart data={charts.pipelineByGroup} />
                    </SectionShell>
                </section>

                {/* Section 3: Market Intelligence */}
                <section className="grid gap-4 md:grid-cols-2">
                    <SectionShell
                        title="Top Performing Segments"
                        description="Where is the revenue coming from?"
                    >
                        <HorizontalBarChart data={charts.topSegments} color="#8b5cf6" />
                    </SectionShell>

                    <SectionShell
                        title="Top Demanded Products"
                        description="Most requested services in pipeline"
                    >
                        <HorizontalBarChart data={charts.topProducts} color="#f59e0b" />
                    </SectionShell>
                </section>

                {/* Section 4: Performance Leaderboards */}
                <section className="grid gap-4 lg:grid-cols-2">
                    <SectionShell
                        title="SBU Performance Leaderboard"
                        description="Top SBUs by pipeline value contribution"
                    >
                        <SbuLeaderboard data={leaderboard.sbu} />
                    </SectionShell>

                    <SectionShell
                        title="Strategic Analysis"
                        description="Actionable insights & anomaly detection"
                    >
                        <StrategicAnalysisCard data={data} />
                    </SectionShell>
                </section>
            </div>
        </main>
    );
}
