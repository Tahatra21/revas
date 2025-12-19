"use client";

import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

interface MonthlyRevenueChartProps {
    data: Array<{
        month: number;
        nr: number;
        co: number;
        target?: number;
        realization?: number;
    }>;
}

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function MonthlyRevenueChart({ data }: MonthlyRevenueChartProps) {
    const chartData = data.map((item) => ({
        month: monthNames[item.month - 1],
        NR: item.nr || 0,
        CO: item.co || 0,
        Target: item.target || 0,
        Realisasi: item.realization || 0,
    }));

    return (
        <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                    contentStyle={{
                        backgroundColor: "#020617",
                        borderColor: "#1e293b",
                        borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#f8fafc" }}
                />
                <Legend />
                <Bar dataKey="NR" fill="#06b6d4" name="Target NR (Miliar)" />
                <Bar dataKey="CO" fill="#8b5cf6" name="Target CO (Miliar)" />
                <Line type="monotone" dataKey="Target" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} name="Target Total (Miliar)" />
                <Line type="monotone" dataKey="Realisasi" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="Realisasi (Miliar)" />
            </ComposedChart>
        </ResponsiveContainer>
    );
}
