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
        <div className="flex flex-col items-center w-full">
            <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={80}
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
                                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                fontSize: "12px"
                            }}
                            formatter={(value: number, name: string, props: any) => [
                                `Rp ${props.payload.rawValue.toLocaleString("id-ID")}`,
                                name
                            ]}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2 w-full px-2">
                {chartData.map((entry, index) => (
                    <div key={index} className="flex items-center text-xs text-slate-600">
                        <span
                            className="w-2.5 h-2.5 rounded-full mr-2 flex-shrink-0"
                            style={{ backgroundColor: COLORS[entry.name] || "#94a3b8" }}
                        />
                        <span className="truncate mr-1 max-w-[100px]" title={entry.name}>{entry.name}</span>
                        <span className="text-slate-400 ml-auto whitespace-nowrap">
                            ({entry.value.toFixed(1)}M)
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
