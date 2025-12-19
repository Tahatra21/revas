"use client";

import { useState, useEffect } from "react";
import { Activity, Search, Filter, Calendar, FileText, User, Shield, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LogEntry {
    id: number;
    userName: string;
    action: string;
    details: string;
    createdAt: string;
    type: "info" | "success" | "warning" | "critical" | "system";
    time: string; // From API formatting
}

export default function ActivityLogPage() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("all");

    useEffect(() => {
        // Debounce search
        const timeoutId = setTimeout(() => {
            fetchLogs();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchTerm, filterType]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchTerm) params.append("search", searchTerm);
            if (filterType !== "all") params.append("type", filterType);
            params.append("limit", "100");

            const response = await fetch(`/api/settings/activity?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();
                setLogs(data);
            }
        } catch (error) {
            console.error("Failed to fetch logs:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen p-8 bg-slate-50/50">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Activity Log</h1>
                        <p className="text-slate-500 mt-1">Audit trail of system activities and user actions.</p>
                    </div>
                    <button
                        onClick={fetchLogs}
                        className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
                    </button>
                </div>

                <div className="bg-white rounded-xl border border-surface-border shadow-sm overflow-hidden min-h-[500px]">
                    {/* Toolbar */}
                    <div className="p-4 border-b border-surface-border flex gap-4 items-center justify-between">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search logs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-sm border border-surface-border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
                            >
                                <option value="all">All Types</option>
                                <option value="info">Info</option>
                                <option value="success">Success</option>
                                <option value="warning">Warning</option>
                                <option value="critical">Critical</option>
                                <option value="system">System</option>
                            </select>
                        </div>
                    </div>

                    {/* Timeline / List */}
                    <div className="divide-y divide-surface-border">
                        {loading && logs.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">Loading activity history...</div>
                        ) : logs.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">
                                <Activity className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                                <p>No logs found matching your search.</p>
                            </div>
                        ) : (
                            logs.map(log => (
                                <div key={log.id} className="p-4 flex items-start gap-4 hover:bg-slate-50/50 transition-colors">
                                    <div className={`mt-1 p-2 rounded-full flex-shrink-0 ${log.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
                                        log.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                                            log.type === 'critical' ? 'bg-red-100 text-red-600' :
                                                log.type === 'system' ? 'bg-purple-100 text-purple-600' :
                                                    'bg-blue-100 text-blue-600'
                                        }`}>
                                        {log.type === 'system' ? <Activity className="w-4 h-4" /> :
                                            log.type === 'critical' ? <Shield className="w-4 h-4" /> :
                                                <FileText className="w-4 h-4" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <p className="text-sm font-semibold text-slate-900">{log.action}</p>
                                            <span className="text-xs text-slate-400 whitespace-nowrap">{log.time}</span>
                                        </div>
                                        <p className="text-sm text-slate-600 mt-0.5">{log.details}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Badge variant="outline" className="text-xs font-normal bg-slate-50 text-slate-600 border-slate-200">
                                                <User className="w-3 h-3 mr-1" /> {log.userName}
                                            </Badge>
                                            <Badge variant="outline" className="text-xs font-normal capitalize bg-slate-50 text-slate-600 border-slate-200">
                                                {log.type}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
