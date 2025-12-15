"use client";

import * as React from "react";
import clsx from "clsx";

export interface FormFieldProps {
    label: string;
    htmlFor?: string;
    children: React.ReactNode;
    description?: string;
    error?: string;
    required?: boolean;
}

export function FormField({
    label,
    htmlFor,
    children,
    description,
    error,
    required,
}: FormFieldProps) {
    const describedById = React.useId();
    const hasDescription = Boolean(description || error);

    return (
        <div className="space-y-1.5">
            <label
                htmlFor={htmlFor}
                className="flex items-center gap-1 text-xs font-medium text-primary"
            >
                <span>{label}</span>
                {required && (
                    <span className="text-red-400" aria-hidden="true">
                        *
                    </span>
                )}
            </label>
            <div
                className={clsx(
                    "rounded-xl border bg-bg",
                    error ? "border-red-500/70" : "border-surface-border",
                    "focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/70"
                )}
            >
                {React.cloneElement(children as React.ReactElement<any>, {
                    id: htmlFor,
                    className: clsx(
                        "w-full rounded-xl bg-transparent px-3 py-2 text-sm text-primary placeholder:text-primary-subtle outline-none",
                        (children as any).props?.className
                    ),
                    "aria-invalid": error ? "true" : undefined,
                    "aria-describedby": hasDescription ? describedById : undefined,
                } as any)}
            </div>
            {(description || error) && (
                <p
                    id={describedById}
                    className={clsx(
                        "text-[11px]",
                        error ? "text-red-400" : "text-primary-subtle"
                    )}
                >
                    {error || description}
                </p>
            )}
        </div>
    );
}
