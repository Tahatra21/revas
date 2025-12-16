"use client";

import { useState, useEffect } from "react";
import { Target, TrendingUp, DollarSign, PieChart, Briefcase, Zap } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { SectionShell } from "@/components/ui/section-shell";
import { MonthlyRevenueChart } from "@/components/dashboard/monthly-revenue-chart";
import { PipelineCompositionChart } from "@/components/dashboard/pipeline-composition-chart";
import { GenericPieChart } from "@/components/dashboard/generic-pie-chart";
import { HorizontalBarChart } from "@/components/dashboard/horizontal-bar-chart";
import { SbuLeaderboard } from "@/components/dashboard/sbu-leaderboard";
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
                        value={`Rp ${(summary.weightedRevenue / 1000000000).toFixed(1)} B`}
                        icon={<TrendingUp className="w-4 h-4" />}
                        subLabel="Probability adjusted (90/50/10)"
                        tone="positive"
                    />
                    <KpiCard
                        label="Total Pipeline Value"
                        value={`Rp ${(summary.totalPipelineValue / 1000000000).toFixed(1)} B`}
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

                {/* Section 2: Macro Trends */}
                <section className="grid gap-4 lg:grid-cols-1">
                    <SectionShell
                        title="Monthly Revenue Trend"
                        description="NR vs CO realization trend"
                    >
                        <MonthlyRevenueChart data={charts.monthlyRevenue} />
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

                    {/* Using the same component for simple list, ideally separate but reused for simplicity */}
                    <SectionShell
                        title="Strategic Analysis"
                        description="Actionable insights"
                    >
                        <div className="p-4 space-y-4">
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <h3 className="font-semibold text-blue-900 mb-1">💡 Focus Area</h3>
                                <p className="text-sm text-blue-800">
                                    Top 5 segments contribute to <strong>{((charts.topSegments.reduce((a: number, b: any) => a + b.value, 0) / summary.totalPipelineValue) * 100).toFixed(0)}%</strong> of the total pipeline. Prioritize sales support for these key verticals.
                                </p>
                            </div>
                            <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                                <h3 className="font-semibold text-amber-900 mb-1">⚠️ Risk Alert</h3>
                                <p className="text-sm text-amber-800">
                                    Win Rate Potential is at <strong>{summary.winRatePotential}%</strong>. Aim to convert 'KUNING' opportunities to 'HIJAU' to improve projection accuracy.
                                </p>
                            </div>
                            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                                <h3 className="font-semibold text-emerald-900 mb-1">📈 Growth Driver</h3>
                                <p className="text-sm text-emerald-800">
                                    <strong>{charts.topProducts[0]?.name}</strong> is the top product demand. Ensure capacity and delivery readiness.
                                </p>
                            </div>
                        </div>
                    </SectionShell>
                </section>
            </div>
        </main>
    );
}
