"use client";

import * as React from "react";
import clsx from "clsx";

export interface KpiCardProps {
    label: string;
    value: string;
    subLabel?: string;
    icon?: React.ReactNode;
    tone?: "default" | "positive" | "warning" | "negative";
}

const toneBorder: Record<NonNullable<KpiCardProps["tone"]>, string> = {
    default: "border-surface-border",
    positive: "border-emerald-500/60",
    warning: "border-amber-500/60",
    negative: "border-red-500/60",
};

const toneText: Record<NonNullable<KpiCardProps["tone"]>, string> = {
    default: "text-primary-subtle",
    positive: "text-emerald-400",
    warning: "text-amber-300",
    negative: "text-red-400",
};

export function KpiCard({
    label,
    value,
    subLabel,
    icon,
    tone = "default",
}: KpiCardProps) {
    return (
        <div
            className={clsx(
                "rounded-2xl border bg-surface p-4 shadow-sm",
                toneBorder[tone]
            )}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                    <p className="text-xs text-primary-subtle">{label}</p>
                    <p className="text-2xl font-semibold text-primary">{value}</p>
                </div>
                {icon && (
                    <div
                        className={clsx(
                            "inline-flex h-8 w-8 items-center justify-center rounded-full bg-bg/80",
                            toneText[tone]
                        )}
                    >
                        {icon}
                    </div>
                )}
            </div>
            {subLabel && (
                <p className={clsx("mt-1 text-xs", toneText[tone])}>{subLabel}</p>
            )}
        </div>
    );
}
