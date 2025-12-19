"use client";

import { useState, useEffect } from "react";
import { GlobalFilterBar } from "@/components/rpms/global-filter-bar";
import { KPICardGrid } from "@/components/rpms/kpi-card-grid";
import { PerformanceMatrixTable } from "@/components/rpms/performance-matrix-table";

export default function RPMSDashboardPage() {
    const [filter, setFilter] = useState({
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        targetType: "RKAP"
    });

    const [kpiData, setKpiData] = useState<any>({
        actualYTD: 0, targetYTD: 0, achievementPct: 0, gap: 0, forecastAmount: 0
    });
    const [matrixData, setMatrixData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, [filter]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const query = `?year=${filter.year}&month=${filter.month}&targetType=${filter.targetType}`;

            const [kpiRes, matrixRes] = await Promise.all([
                fetch(`/api/kpi${query}`),
                fetch(`/api/matrix${query}`)
            ]);

            if (kpiRes.ok) {
                setKpiData(await kpiRes.json());
            }
            if (matrixRes.ok) {
                setMatrixData(await matrixRes.json());
            }

        } catch (error) {
            console.error("Dashboard Load Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key: string, value: any) => {
        setFilter(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="min-h-screen bg-bg flex flex-col">
            <GlobalFilterBar
                year={filter.year}
                month={filter.month}
                targetType={filter.targetType}
                onFilterChange={handleFilterChange}
            />

            <main className="flex-1 space-y-6 pb-8">
                <KPICardGrid data={kpiData} loading={loading} />

                <div className="space-y-2">
                    <h3 className="px-4 text-lg font-bold">Performance Matrix</h3>
                    <PerformanceMatrixTable data={matrixData} loading={loading} />
                </div>
            </main>
        </div>
    );
}
