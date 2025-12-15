"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

interface MonthlyRevenueChartProps {
    data: Array<{
        month: number;
        nr: number;
        co: number;
    }>;
}

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function MonthlyRevenueChart({ data }: MonthlyRevenueChartProps) {
    const chartData = data.map((item) => ({
        month: monthNames[item.month - 1],
        NR: item.nr / 1000000, // Convert to millions
        CO: item.co / 1000000,
    }));

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
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
                <Bar dataKey="NR" fill="#06b6d4" name="NR (Juta)" />
                <Bar dataKey="CO" fill="#8b5cf6" name="CO (Juta)" />
            </BarChart>
        </ResponsiveContainer>
    );
}
