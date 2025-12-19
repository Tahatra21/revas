"use client";

import Link from "next/link";
import { Building2, Users, Layers, Scale, ChevronRight } from "lucide-react";

interface MasterDataCardProps {
    title: string;
    description: string;
    icon: React.ElementType;
    href: string;
    colorClass: string;
    bgClass: string;
}

function MasterDataCard({ title, description, icon: Icon, href, colorClass, bgClass }: MasterDataCardProps) {
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

export default function MasterDataPage() {
    return (
        <main className="min-h-screen p-8 bg-slate-50/50">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Master Data Management</h1>
                    <p className="text-slate-500 mt-2">
                        Configure and manage your core system data registries.
                    </p>
                </div>

                {/* Grid Layout */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <MasterDataCard
                        title="SBU Management"
                        description="Manage Strategic Business Units, codes, and regions."
                        icon={Building2}
                        href="/master/sbu"
                        colorClass="text-blue-600"
                        bgClass="bg-blue-100"
                    />
                    <MasterDataCard
                        title="Customers"
                        description="Manage client database, segments, and PLN Groups."
                        icon={Users}
                        href="/master/customer"
                        colorClass="text-emerald-600"
                        bgClass="bg-emerald-100"
                    />
                    <MasterDataCard
                        title="Service Catalog"
                        description="Configure products, service categories, and hierarchy."
                        icon={Layers}
                        href="/master/service-category"
                        colorClass="text-purple-600"
                        bgClass="bg-purple-100"
                    />
                    <MasterDataCard
                        title="Weighting Settings"
                        description="Adjust revenue weighting percentages for monthly projections."
                        icon={Scale}
                        href="/revenue/settings/weight"
                        colorClass="text-amber-600"
                        bgClass="bg-amber-100"
                    />
                </div>
            </div>
        </main>
    );
}
