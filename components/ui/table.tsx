"use client";

import * as React from "react";
import clsx from "clsx";

export function Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
    return (
        <div className="w-full overflow-auto scrollbar-thin">
            <table
                className={clsx("min-w-full text-sm", className)}
                {...props}
            />
        </div>
    );
}

export function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
    return (
        <thead
            className={clsx("border-b border-surface-border/60", className)}
            {...props}
        />
    );
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
    return <tbody className={className} {...props} />;
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
    return (
        <tr
            className={clsx(
                "border-t border-surface-border/40 transition-colors hover:bg-surface-border/20",
                className
            )}
            {...props}
        />
    );
}

export function TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
    return (
        <th
            className={clsx(
                "px-3 py-2 text-left text-xs font-medium text-primary-subtle",
                className
            )}
            {...props}
        />
    );
}

export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
    return (
        <td
            className={clsx("px-3 py-2 text-primary", className)}
            {...props}
        />
    );
}
