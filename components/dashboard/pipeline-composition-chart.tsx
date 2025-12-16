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
        value: item.value / 1000000000, // Convert to Billions for display
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
                    paddingAngle={5}
                    dataKey="value"
                >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.name] || "#94a3b8"} />
                    ))}
                </Pie>
                <Tooltip
                    contentStyle={{
                        backgroundColor: "#ffffff",
                        borderColor: "#e2e8f0",
                        borderRadius: "8px",
                        color: "#1e293b",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                    }}
                    formatter={(value: number, name: string, props: any) => [
                        `Rp ${props.payload.rawValue.toLocaleString("id-ID")}`,
                        name
                    ]}
                />
                <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    formatter={(value, entry: any) => (
                        <span className="text-slate-600 font-medium ml-1">
                            {value} <span className="text-slate-400 font-normal">({entry.payload.value.toFixed(1)}M)</span>
                        </span>
                    )}
                />
            </PieChart>
        </ResponsiveContainer>
    );
}
