"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    PieChart,
    DollarSign,
    Database,
    Menu,
    X,
    ChevronDown,
} from "lucide-react";
import { useState } from "react";
import clsx from "clsx";

const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Pipeline", href: "/pipeline", icon: PieChart },
    {
        name: "Revenue",
        icon: DollarSign,
        children: [
            { name: "Targets", href: "/revenue/target" },
            { name: "Actuals", href: "/revenue/actual" },
        ],
    },
    {
        name: "Master Data",
        icon: Database,
        children: [
            { name: "Regions", href: "/master/region" },
            { name: "SBUs", href: "/master/sbu" },
            { name: "Customers", href: "/master/customer" },
            { name: "Service Categories", href: "/master/service-category" },
        ],
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [expandedItems, setExpandedItems] = useState<string[]>(["Revenue", "Master Data"]);

    const toggleExpanded = (name: string) => {
        setExpandedItems((prev) =>
            prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]
        );
    };

    return (
        <>
            {/* Mobile menu button */}
            <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-surface border border-surface-border"
            >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Sidebar */}
            <aside
                className={clsx(
                    "fixed top-0 left-0 z-40 h-screen w-64 bg-surface border-r border-surface-border transition-transform",
                    mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="p-6 border-b border-surface-border">
                        <h1 className="text-2xl font-bold">Revas</h1>
                        <p className="text-xs text-primary-subtle">Revenue Monitoring</p>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href;
                            const isExpanded = expandedItems.includes(item.name);
                            const hasChildren = "children" in item && item.children;

                            return (
                                <div key={item.name}>
                                    {hasChildren ? (
                                        <>
                                            <button
                                                onClick={() => toggleExpanded(item.name)}
                                                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium text-primary-subtle hover:bg-surface-border/50 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <item.icon className="w-5 h-5" />
                                                    <span>{item.name}</span>
                                                </div>
                                                <ChevronDown
                                                    className={clsx(
                                                        "w-4 h-4 transition-transform",
                                                        isExpanded && "rotate-180"
                                                    )}
                                                />
                                            </button>
                                            {isExpanded && (
                                                <div className="ml-8 mt-1 space-y-1">
                                                    {item.children.map((child) => {
                                                        const isChildActive = pathname === child.href;
                                                        return (
                                                            <Link
                                                                key={child.href}
                                                                href={child.href}
                                                                className={clsx(
                                                                    "block px-3 py-2 rounded-xl text-sm transition-colors",
                                                                    isChildActive
                                                                        ? "bg-accent text-white font-medium"
                                                                        : "text-primary-subtle hover:bg-surface-border/50"
                                                                )}
                                                            >
                                                                {child.name}
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <Link
                                            href={item.href!}
                                            className={clsx(
                                                "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                                                isActive
                                                    ? "bg-accent text-white"
                                                    : "text-primary-subtle hover:bg-surface-border/50"
                                            )}
                                        >
                                            <item.icon className="w-5 h-5" />
                                            <span>{item.name}</span>
                                        </Link>
                                    )}
                                </div>
                            );
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="p-4 border-t border-surface-border">
                        <div className="px-3 py-2 rounded-xl bg-bg">
                            <p className="text-xs font-medium">Admin User</p>
                            <p className="text-xs text-primary-subtle">admin@revas.com</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {mobileMenuOpen && (
                <div
                    onClick={() => setMobileMenuOpen(false)}
                    className="lg:hidden fixed inset-0 z-30 bg-black/50"
                />
            )}
        </>
    );
}
