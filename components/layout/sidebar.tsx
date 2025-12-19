"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    PieChart,
    DollarSign,
    Database,
    Menu,
    X,
    ChevronDown,
    LogOut,
    User,
    Activity,
    Settings,
} from "lucide-react";
import { useState, useEffect } from "react";
import clsx from "clsx";

const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Pipeline", href: "/pipeline", icon: PieChart },
    {
        name: "Revenue",
        icon: DollarSign,
        children: [
            { name: "Target", href: "/revenue/target" },
            { name: "Actual", href: "/revenue/actual" },
            { name: "Rev Performance", href: "/rpms/dashboard" },
            /*{ name: "Revenue PLN", href: "/revenue/pln" },*/
        ],
    },
    {
        name: "Master Data",
        icon: Database,
        children: [
            { name: "Overview", href: "/master" },
            { name: "Bulk Upload", href: "/master/bulk-upload" },
        ],
    },
    {
        name: "Settings",
        icon: Settings,
        href: "/settings",
    },
];

// Refresh Sidebar Cache
export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [expandedItems, setExpandedItems] = useState<string[]>(["Revenue", "Master Data"]);
    const [revenueOpen, setRevenueOpen] = useState(false);
    const [masterDataOpen, setMasterDataOpen] = useState(false);
    const [user, setUser] = useState<any>(null); // Initialize as null to match server

    const handleLogout = () => {
        // Clear authentication data
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        // Redirect to login
        router.push("/login");
    };

    // Get user info from localStorage on client side only
    useEffect(() => {
        if (typeof window !== "undefined") {
            const userStr = localStorage.getItem("user");
            if (userStr) {
                try {
                    setUser(JSON.parse(userStr));
                } catch {
                    // Ignore parse errors
                }
            }
        }
    }, []);

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
                    "fixed top-0 left-0 z-40 h-screen w-52 bg-surface border-r border-surface-border transition-transform",
                    mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="p-4 border-b border-surface-border">
                        <img
                            src="/logo-pln.png"
                            alt="PLN Icon Plus"
                            className="h-12 w-auto object-contain"
                        />
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
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
                                                className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium text-primary-subtle hover:bg-surface-border/50 transition-colors"

                                            >
                                                <div className="flex items-center gap-2">
                                                    <item.icon className="w-4 h-4" />
                                                    <span>{item.name}</span>
                                                </div>
                                                <ChevronDown
                                                    className={clsx(
                                                        "w-3 h-3 transition-transform",
                                                        isExpanded && "rotate-180"
                                                    )}
                                                />
                                            </button>
                                            {isExpanded && (
                                                <div className="ml-7 mt-0.5 space-y-0.5">
                                                    {item.children.map((child) => {
                                                        const isChildActive = pathname === child.href;
                                                        return (
                                                            <Link
                                                                key={child.href}
                                                                href={child.href}
                                                                className={clsx(
                                                                    "block px-3 py-1.5 rounded-lg text-xs transition-colors",
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
                                                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                                                isActive
                                                    ? "bg-accent text-white"
                                                    : "text-primary-subtle hover:bg-surface-border/50"
                                            )}
                                        >
                                            <item.icon className="w-4 h-4" />
                                            <span>{item.name}</span>
                                        </Link>
                                    )}
                                </div>
                            );
                        })}
                    </nav>

                    {/* User Info & Logout */}
                    <div className="p-4 border-t border-surface-border mt-auto">
                        <Link href="/settings/profile" className="block group">
                            <div className="bg-surface-active/30 rounded-xl p-3 mb-2 flex items-center gap-3 transition-colors hover:bg-surface-active/50 cursor-pointer">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center border border-blue-200 shadow-sm group-hover:scale-105 transition-transform">
                                    <span className="text-blue-700 font-bold text-sm">
                                        {(user?.username || "A").charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate capitalize text-primary group-hover:text-blue-600 transition-colors">
                                        {user?.username || "Admin"}
                                    </p>
                                    <p className="text-[10px] text-primary-subtle capitalize truncate">
                                        {user?.role || "Administrator"}
                                    </p>
                                </div>
                                <Settings className="w-4 h-4 text-primary-subtle group-hover:text-blue-500 transition-colors" />
                            </div>
                        </Link>

                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100/80 transition-all border border-red-100 hover:border-red-200"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Sign Out</span>
                        </button>
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
