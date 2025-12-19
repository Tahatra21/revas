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

    const formattedData = data.map((item) => ({
        name: item.name,
        value: item.value / 1000000000,
        rawValue: item.value
    }));

    return (
        <div className="flex flex-col items-center w-full">
            <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={formattedData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                        >
                            {formattedData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
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
                                `${valuePrefix}${props.payload.rawValue.toLocaleString("id-ID")}`,
                                name
                            ]}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2 w-full max-h-[120px] overflow-y-auto custom-scrollbar px-2">
                {formattedData.map((entry, index) => (
                    <div key={index} className="flex items-center text-xs text-slate-600">
                        <span
                            className="w-2.5 h-2.5 rounded-full mr-2 flex-shrink-0"
                            style={{ backgroundColor: colors[index % colors.length] }}
                        />
                        <span className="truncate mr-1 max-w-[100px]" title={entry.name}>{entry.name}</span>
                        <span className="text-slate-400 ml-auto whitespace-nowrap">
                            ({entry.value.toFixed(1)}{valuePrefix === "Rp " ? "M" : ""})
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
