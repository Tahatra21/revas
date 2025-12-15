"use client";

import { useState, useEffect } from "react";
import { Target, TrendingUp, DollarSign, PieChart } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { SectionShell } from "@/components/ui/section-shell";
import { MonthlyRevenueChart } from "@/components/dashboard/monthly-revenue-chart";
import { PipelineCompositionChart } from "@/components/dashboard/pipeline-composition-chart";
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
    const [summary, setSummary] = useState<any>(null);
    const [fullData, setFullData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, [year]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [summaryRes, fullRes] = await Promise.all([
                fetch(`/api/dashboard/summary?year=${year}`),
                fetch(`/api/dashboard/full?year=${year}`),
            ]);

            if (!summaryRes.ok || !fullRes.ok) {
                throw new Error("Failed to fetch dashboard data");
            }

            const summaryData = await summaryRes.json();
            const fullDataRes = await fullRes.json();

            setSummary(summaryData);
            setFullData(fullDataRes);
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            // Set default values on error
            setSummary({
                targetYearly: 0,
                realizationYearly: 0,
                achievementPct: 0,
                pipelineMostLikely: 0,
            });
            setFullData({
                monthly: [],
                pipelineByColor: [],
                topCustomers: [],
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen p-8">
                <div className="max-w-7xl mx-auto text-center py-12">
                    <p className="text-primary-subtle">Loading dashboard...</p>
                </div>
            </main>
        );
    }

    // Ensure we have data with defaults
    const dashboardSummary = summary || {
        targetYearly: 0,
        realizationYearly: 0,
        achievementPct: 0,
        pipelineMostLikely: 0,
    };

    const dashboardData = fullData || {
        monthly: [],
        pipelineByColor: [],
        topCustomers: [],
    };

    return (
        <main className="min-h-screen p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header with Year Selector */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
                        <p className="text-primary-subtle">
                            Revenue Assurance Monitoring Application for PLN Group
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

                {/* KPI Cards */}
                <section className="grid gap-4 md:grid-cols-4">
                    <KpiCard
                        label="Target Yearly"
                        value={`Rp ${dashboardSummary.targetYearly.toLocaleString("id-ID")}`}
                        icon={<Target className="w-4 h-4" />}
                    />
                    <KpiCard
                        label="Realisasi Yearly"
                        value={`Rp ${dashboardSummary.realizationYearly.toLocaleString("id-ID")}`}
                        icon={<DollarSign className="w-4 h-4" />}
                    />
                    <KpiCard
                        label="Achievement"
                        value={`${dashboardSummary.achievementPct.toFixed(1)}%`}
                        tone={dashboardSummary.achievementPct >= 75 ? "positive" : dashboardSummary.achievementPct >= 50 ? "warning" : "negative"}
                        icon={<TrendingUp className="w-4 h-4" />}
                        subLabel="vs target tahunan"
                    />
                    <KpiCard
                        label="Pipeline Most Likely"
                        value={`Rp ${dashboardSummary.pipelineMostLikely.toLocaleString("id-ID")}`}
                        icon={<PieChart className="w-4 h-4" />}
                        tone="positive"
                    />
                </section>

                {/* Charts Section */}
                <section className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                    <SectionShell
                        title="Monthly Revenue"
                        description="NR dan CO per bulan sepanjang tahun berjalan"
                    >
                        <MonthlyRevenueChart data={dashboardData.monthly} />
                    </SectionShell>

                    <SectionShell
                        title="Pipeline by Status"
                        description="Komposisi pipeline berdasarkan warna status"
                    >
                        <PipelineCompositionChart data={dashboardData.pipelineByColor} />
                    </SectionShell>
                </section>

                {/* Top Customers Table */}
                <SectionShell
                    title="Top 5 Customers by Est Revenue"
                    description="Pelanggan dengan nilai estimasi revenue tertinggi"
                >
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead className="text-right">Est Revenue</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {dashboardData.topCustomers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center text-primary-subtle py-8">
                                        Belum ada data.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                dashboardData.topCustomers.map((row: any) => (
                                    <TableRow key={row.customerName}>
                                        <TableCell>{row.customerName}</TableCell>
                                        <TableCell className="text-right">
                                            Rp {row.totalEstRevenue.toLocaleString("id-ID")}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </SectionShell>
            </div>
        </main>
    );
}
