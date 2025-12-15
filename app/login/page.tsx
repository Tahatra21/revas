"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";

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
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-bold mb-2">Revas</h1>
                    <p className="text-primary-subtle">Revenue Assurance Monitoring Application</p>
                </div>

                {/* Login Card */}
                <div className="rounded-2xl border border-surface-border bg-surface p-8">
                    <h2 className="text-2xl font-bold mb-6">Sign In</h2>

                    {error && (
                        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/50 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <FormField label="Username" htmlFor="username" required>
                            <input
                                type="text"
                                name="username"
                                placeholder="Enter your username"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                autoComplete="username"
                            />
                        </FormField>

                        <FormField label="Password" htmlFor="password" required>
                            <input
                                type="password"
                                name="password"
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                autoComplete="current-password"
                            />
                        </FormField>

                        <Button type="submit" className="w-full" isLoading={loading}>
                            Sign In
                        </Button>
                    </form>

                    {/* Default Credentials Info */}
                    <div className="mt-6 p-4 rounded-xl bg-bg border border-surface-border">
                        <p className="text-xs text-primary-subtle mb-2">Default Credentials:</p>
                        <p className="text-sm">
                            <span className="font-medium">Username:</span> admin
                        </p>
                        <p className="text-sm">
                            <span className="font-medium">Password:</span> admin123
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-primary-subtle mt-6">
                    PLN Group © 2025
                </p>
            </div>
        </div>
    );
}
