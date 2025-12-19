
"use client";

import { useMemo } from "react";
import { AlertTriangle, TrendingUp, Target, Lightbulb, CheckCircle2 } from "lucide-react";

interface StrategicAnalysisProps {
    data: {
        summary: any;
        charts: any;
        leaderboard: any;
    };
}

type InsightType = "critical" | "warning" | "opportunity" | "success" | "info";

interface Insight {
    type: InsightType;
    title: string;
    message: React.ReactNode;
    icon: React.ReactNode;
}

export function StrategicAnalysisCard({ data }: StrategicAnalysisProps) {
    const insights = useMemo(() => {
        const generatedInsights: Insight[] = [];
        const { summary, charts, leaderboard } = data;

        // 1. RKAP PERFORMANCE (Revenue vs Target)
        const totalGap = (summary.actualTotalYTD || 0) - (summary.targetRkap || 0);
        const rkapAch = summary.targetRkap > 0 ? (summary.actualTotalYTD / summary.targetRkap) * 100 : 0;

        if (rkapAch < 90) {
            generatedInsights.push({
                type: "critical",
                title: "RKAP Performance Alert",
                message: <>
                    Realization is <strong>{rkapAch.toFixed(1)}%</strong> of RKAP Target.
                    Gap of <strong>Rp {Math.abs(totalGap / 1000000000).toFixed(1)}M</strong> needs immediate attention.
                </>,
                icon: <AlertTriangle className="w-5 h-5" />
            });
        } else {
            generatedInsights.push({
                type: "success",
                title: "RKAP On Track",
                message: <>
                    Strong performance with <strong>{rkapAch.toFixed(1)}%</strong> achievement against RKAP.
                    Revenue goal is secured.
                </>,
                icon: <CheckCircle2 className="w-5 h-5" />
            });
        }

        // 2. BEYOND kWh POTENTIAL
        const beyondTarget = summary.targetBeyondRkap || 0;
        generatedInsights.push({
            type: "info",
            title: "Beyond kWh Outlook",
            message: <>
                Beyond kWh Target is <strong>Rp {(beyondTarget / 1000000000).toFixed(1)}M</strong>.
                Ensure specific initiatives in the pipeline are prioritized to meet this segment.
            </>,
            icon: <Lightbulb className="w-5 h-5" />
        });

        // 3. COMMITMENT RELIABILITY
        const commitmentTarget = summary.targetKomitmen || 0;
        generatedInsights.push({
            type: "warning",
            title: "Commitment Target Status",
            message: <>
                Commitment Target stands at <strong>Rp {(commitmentTarget / 1000000000).toFixed(1)}M</strong>.
                Monitor the 'KUNING' status deals closely as they are pivotal for this target.
            </>,
            icon: <Target className="w-5 h-5" />
        });

        // 4. PROJECTION & FORECAST
        // Simulating weighted projection if missing from summary
        const weightedProjection = summary.weightedRevenue || 0;
        const projectedAch = summary.targetRkap > 0 ? ((weightedProjection + (summary.actualTotalYTD || 0)) / summary.targetRkap) * 100 : 0;

        generatedInsights.push({
            type: "opportunity",
            title: "Projection Accuracy",
            message: <>
                Combined (Actual + Weighted Pipeline) projects a year-end standing of <strong>{projectedAch.toFixed(1)}%</strong>.
                Acceleration is needed to close the remaining gap.
            </>,
            icon: <TrendingUp className="w-5 h-5" />
        });

        // 5. PIPELINE RISK PROFILE
        const redStatus = charts.pipelineByStatus?.find((d: any) => d.name === "MERAH");
        const totalPipeline = summary.totalPipelineValue || 1;
        const redShare = redStatus ? (redStatus.value / totalPipeline) * 100 : 0;

        generatedInsights.push({
            type: redShare > 30 ? "critical" : "success",
            title: "Pipeline Risk Profile",
            message: <>
                <strong>{redShare.toFixed(1)}%</strong> of pipeline value is 'High Risk' (MERAH).
                {redShare > 30 ? "Initiate mitigation plans immediately." : "Risk level is manageable."}
            </>,
            icon: redShare > 30 ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />
        });

        // 6. GROWTH / MARKET INSIGHT
        const topProduct = charts.topProducts?.[0];
        generatedInsights.push({
            type: "info",
            title: "Top Growth Driver",
            message: <>
                <strong>{topProduct?.name || "Services"}</strong> is leading demand.
                Focus cross-selling efforts here to maximize wallet share.
            </>,
            icon: <TrendingUp className="w-5 h-5" />
        });

        return generatedInsights;
    }, [data]);

    const getStyles = (type: InsightType) => {
        switch (type) {
            case "critical":
                return "bg-red-50 border-red-100 text-red-900 icon-red-600";
            case "warning":
                return "bg-amber-50 border-amber-100 text-amber-900 icon-amber-600";
            case "success":
                return "bg-emerald-50 border-emerald-100 text-emerald-900 icon-emerald-600";
            case "opportunity":
                return "bg-blue-50 border-blue-100 text-blue-900 icon-blue-600";
            default:
                return "bg-slate-50 border-slate-100 text-slate-900 icon-slate-600";
        }
    };

    return (
        <div className="space-y-4 p-2">
            {insights.map((insight, index) => {
                const style = getStyles(insight.type);
                return (
                    <div key={index} className={`p-4 rounded-lg border ${style} flex gap-3 items-start transition-all hover:shadow-sm`}>
                        <div className={`mt-0.5 shrink-0`}>
                            <span className={style.split(' ').find(c => c.startsWith('icon-'))?.replace('icon-', 'text-') || ""}>
                                {insight.icon}
                            </span>
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm mb-1">{insight.title}</h3>
                            <p className="text-xs leading-relaxed opacity-90">
                                {insight.message}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
