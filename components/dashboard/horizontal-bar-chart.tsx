"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from "recharts";

interface HorizontalBarChartProps {
    data: Array<{
        name: string;
        value: number;
    }>;
    color?: string;
    valuePrefix?: string;
}

export function HorizontalBarChart({ data, color = "#3b82f6", valuePrefix = "Rp " }: HorizontalBarChartProps) {
    const formatValue = (value: number) => {
        if (value >= 1000000000) {
            return `${(value / 1000000000).toFixed(1)}B`;
        }
        if (value >= 1000000) {
            return `${(value / 1000000).toFixed(1)}M`;
        }
        return value.toLocaleString();
    };

    // Trim long names
    const processedData = data.map(item => ({
        ...item,
        shortName: item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name
    }));

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart
                data={processedData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" tickFormatter={formatValue} stroke="#64748b" tick={{ fontSize: 12 }} />
                <YAxis dataKey="shortName" type="category" width={120} stroke="#64748b" tick={{ fontSize: 12 }} />
                <Tooltip
                    cursor={{ fill: '#f1f5f9' }}
                    content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                            return (
                                <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
                                    <p className="font-semibold text-slate-800 mb-1">{payload[0].payload.name}</p>
                                    <p className="text-sm text-slate-600">
                                        {valuePrefix}{Number(payload[0].value).toLocaleString("id-ID")}
                                    </p>
                                </div>
                            );
                        }
                        return null;
                    }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {processedData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}
