"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Lock, User, Loader2, ArrowRight } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ username: "", password: "" });
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!formData.username || !formData.password) {
            setError("Please enter username and password");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Login failed");
            }

            const data = await response.json();

            // Store token and user info
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            // Redirect to dashboard
            router.push("/");
        } catch (error: any) {
            console.error("Login error:", error);
            setError(error.message || "Invalid username or password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex w-full bg-white">
            {/* Left Side - Form */}
            <div className="w-full lg:w-[480px] flex flex-col justify-between p-8 lg:p-12 z-10 bg-white">
                {/* Header Logo */}
                <div>
                    <div className="flex items-center gap-3 mb-10">
                        <div className="relative w-10 h-10">
                            {/* Fallback if logo not found, but it should be standard */}
                            <Image
                                src="/logo-pln.png"
                                alt="PLN Logo"
                                width={40}
                                height={40}
                                className="object-contain"
                            />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight">PLN GROUP</h1>
                            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Power Beyond Generations</p>
                        </div>
                    </div>
                </div>

                {/* Form Section */}
                <div className="w-full max-w-sm mx-auto">
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back</h2>
                        <p className="text-slate-500">
                            Sign in to access the <span className="text-blue-600 font-semibold">Revas</span> Dashboard.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-lg bg-red-50 border-l-4 border-red-500 flex items-start gap-3">
                            <div className="text-red-500 mt-0.5">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="text-sm text-red-700 font-medium">{error}</div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-slate-700 ml-1">Username</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    <User className="h-5 w-5" />
                                </div>
                                <input
                                    type="text"
                                    name="username"
                                    placeholder="Enter your corporate ID"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 placeholder:text-slate-400"
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    <Lock className="h-5 w-5" />
                                </div>
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 placeholder:text-slate-400"
                                    autoComplete="current-password"
                                />
                            </div>
                            <div className="flex justify-end">
                                <a href="#" className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline">
                                    Forgot password?
                                </a>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg shadow-blue-600/20 transition-all hover:shadow-blue-600/40 flex items-center justify-center gap-2"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    Sign In <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </Button>
                    </form>
                </div>

                {/* Footer */}
                <div className="text-center">
                    <p className="text-xs text-slate-400">
                        © 2025 PT PLN (Persero). All Rights Reserved.<br />
                        <span className="text-slate-300">Internal Corporate Use Only. Unauthorized access is prohibited.</span>
                    </p>
                </div>
            </div>

            {/* Right Side - Image/Background */}
            <div className="hidden lg:block flex-1 relative bg-slate-900 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-slate-900/60 z-10" />
                <Image
                    src="/login-bg.png"
                    alt="Corporate background"
                    fill
                    className="object-cover object-center opacity-80"
                    priority
                />

                {/* Overlay Text */}
                <div className="absolute bottom-0 left-0 right-0 p-12 z-20 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent pt-32">
                    <div className="max-w-2xl">
                        <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
                            Digital Transformation for <br /> <span className="text-cyan-400">Revenue Excellence</span>
                        </h2>
                        <p className="text-slate-300 text-lg leading-relaxed max-w-lg">
                            Integrated monitoring, strategic analytics, and real-time insights for PLN Group revenue performance.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
