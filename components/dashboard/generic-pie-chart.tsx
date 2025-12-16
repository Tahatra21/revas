"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from "recharts";

interface GenericPieChartProps {
    data: Array<{
        name: string;
        value: number;
    }>;
    colors?: string[];
    valuePrefix?: string;
}

const DEFAULT_COLORS = [
    "#3b82f6", // Blue
    "#8b5cf6", // Violet
    "#f59e0b", // Amber
    "#10b981", // Emerald
    "#ec4899", // Pink
    "#6366f1", // Indigo
    "#f97316", // Orange
    "#14b8a6", // Teal
    "#84cc16", // Lime
    "#06b6d4", // Cyan
];

export function GenericPieChart({ data, colors = DEFAULT_COLORS, valuePrefix = "Rp " }: GenericPieChartProps) {
    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-[300px] text-primary-subtle">No data available</div>;
    }

    const chartData = data.map((item) => ({
        name: item.name,
        value: item.value / 1000000000, // Convert to Billions for display consistency
        rawValue: item.value
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
                    paddingAngle={2}
                    dataKey="value"
                // label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                </Pie>
                <Tooltip
                    contentStyle={{
                        backgroundColor: "#ffffff",
                        borderColor: "#e2e8f0",
                        borderRadius: "8px",
                        color: "#1e293b"
                    }}
                    formatter={(value: number, name: string, props: any) => [
                        `${valuePrefix}${props.payload.rawValue.toLocaleString("id-ID")}`,
                        name
                    ]}
                />
                <Legend
                    verticalAlign="bottom"
                    align="center"
                    iconType="circle"
                    wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                    formatter={(value, entry: any) => (
                        <span className="text-slate-600 ml-1">
                            {value} <span className="text-slate-400">({entry.payload.value.toFixed(1)}{valuePrefix === "Rp " ? "M" : ""})</span>
                        </span>
                    )}
                />
            </PieChart>
        </ResponsiveContainer>
    );
}
