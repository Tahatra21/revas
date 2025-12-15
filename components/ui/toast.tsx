"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
    id: string;
    type: ToastType;
    message: string;
}

interface ToastContextType {
    showToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((type: ToastType, message: string) => {
        const id = Math.random().toString(36).substring(7);
        setToasts((prev) => [...prev, { id, type, message }]);

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, 5000);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    };

    const icons = {
        success: CheckCircle,
        error: XCircle,
        info: Info,
        warning: AlertTriangle,
    };

    const styles = {
        success: "bg-emerald-500/20 border-emerald-500/50 text-emerald-400",
        error: "bg-red-500/20 border-red-500/50 text-red-400",
        info: "bg-blue-500/20 border-blue-500/50 text-blue-400",
        warning: "bg-amber-500/20 border-amber-500/50 text-amber-300",
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast Container */}
            <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-md">
                {toasts.map((toast) => {
                    const Icon = icons[toast.type];
                    return (
                        <div
                            key={toast.id}
                            className={`flex items-center gap-3 p-4 rounded-xl border ${styles[toast.type]} shadow-lg animate-slide-in`}
                        >
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            <p className="flex-1 text-sm">{toast.message}</p>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="flex-shrink-0 hover:opacity-70 transition-opacity"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within ToastProvider");
    }
    return context;
}
