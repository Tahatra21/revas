"use client";

import * as React from "react";

export interface SectionShellProps {
    title: string;
    description?: string;
    actions?: React.ReactNode;
    children: React.ReactNode;
}

export function SectionShell({
    title,
    description,
    actions,
    children,
}: SectionShellProps) {
    return (
        <section className="rounded-2xl border border-surface-border bg-surface p-4 shadow-sm">
            <header className="mb-3 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                    <h2 className="text-sm font-semibold text-primary">{title}</h2>
                    {description && (
                        <p className="text-xs text-primary-subtle">{description}</p>
                    )}
                </div>
                {actions && <div className="flex items-center gap-2">{actions}</div>}
            </header>
            <div>{children}</div>
        </section>
    );
}
