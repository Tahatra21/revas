"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from "recharts";

interface PipelineCompositionChartProps {
    data: Array<{
        color: string;
        value: number;
    }>;
}

const COLORS: Record<string, string> = {
    HIJAU: "#22c55e",
    KUNING: "#eab308",
    MERAH: "#ef4444",
};

export function PipelineCompositionChart({ data }: PipelineCompositionChartProps) {
    const chartData = data.map((item) => ({
        name: item.color,
        value: item.value / 1000000000, // Convert to Billions
    }));

    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={(entry) => `${entry.name}: ${entry.value.toFixed(1)}M`}
                >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.name] || "#94a3b8"} />
                    ))}
                </Pie>
                <Tooltip
                    contentStyle={{
                        backgroundColor: "#020617",
                        borderColor: "#1e293b",
                        borderRadius: "8px",
                    }}
                />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    );
}
