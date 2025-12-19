"use client";

import Link from "next/link";
import { Users, UserCircle, Activity, Shield, ChevronRight } from "lucide-react";

interface SettingsCardProps {
    title: string;
    description: string;
    icon: React.ElementType;
    href: string;
    colorClass: string;
    bgClass: string;
}

function SettingsCard({ title, description, icon: Icon, href, colorClass, bgClass }: SettingsCardProps) {
    return (
        <Link href={href} className="block group">
            <div className="bg-white p-6 rounded-2xl border border-surface-border shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer flex items-center justify-between h-full">
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${bgClass} group-hover:scale-105 transition-transform`}>
                        <Icon className={`w-6 h-6 ${colorClass}`} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">{title}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2">{description}</p>
                    </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
            </div>
        </Link>
    );
}

export default function SettingsPage() {
    return (
        <main className="min-h-screen p-8 bg-slate-50/50">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">System Settings</h1>
                    <p className="text-slate-500 mt-2">
                        Manage your system settings and configurations.
                    </p>
                </div>

                {/* Grid Layout */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <SettingsCard
                        title="My Profile"
                        description="Update your personal details and password."
                        icon={UserCircle}
                        href="/settings/profile"
                        colorClass="text-blue-600"
                        bgClass="bg-blue-100"
                    />
                    <SettingsCard
                        title="User Management"
                        description="Manage users, roles (Admin/User), and permissions."
                        icon={Users}
                        href="/settings/users"
                        colorClass="text-purple-600"
                        bgClass="bg-purple-100"
                    />
                    <SettingsCard
                        title="Activity Log"
                        description="View system activity logs and audit trails."
                        icon={Activity}
                        href="/settings/activity"
                        colorClass="text-emerald-600"
                        bgClass="bg-emerald-100"
                    />
                    <SettingsCard
                        title="Security Settings"
                        description="Configure security policies and access controls."
                        icon={Shield}
                        href="/settings/security"
                        colorClass="text-amber-600"
                        bgClass="bg-amber-100"
                    />
                </div>
            </div>
        </main>
    );
}
