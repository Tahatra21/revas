"use client";

import { useState, useEffect } from "react";
import { Shield, Key, Smartphone, Lock, Save, Globe, Loader2 } from "lucide-react";
import { SectionShell } from "@/components/ui/section-shell";
import { Button } from "@/components/ui/button";

export default function SecuritySettingsPage() {
    const [twoFactor, setTwoFactor] = useState(false);
    const [passwordExpiry, setPasswordExpiry] = useState(true);
    const [sessionTimeout, setSessionTimeout] = useState("30");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch("/api/settings/security");
            if (res.ok) {
                const data = await res.json();
                setTwoFactor(data.two_factor_enabled === "true");
                setPasswordExpiry(data.password_expiry === "true");
                setSessionTimeout(data.session_timeout);
            }
        } catch (error) {
            console.error("Failed to load settings");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                two_factor_enabled: twoFactor,
                password_expiry: passwordExpiry,
                session_timeout: sessionTimeout
            };

            const res = await fetch("/api/settings/security", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert("Security settings updated successfully!");
                // Optionally refresh to confirm
            } else {
                throw new Error("Failed to save");
            }
        } catch (error) {
            alert("Failed to save security settings.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-primary-subtle">Loading security policies...</div>;

    return (
        <main className="p-8 max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-primary">Security Settings</h1>
                <p className="text-primary-subtle">Configure security policies and access controls</p>
            </div>

            <div className="space-y-6">
                {/* 2FA Section */}
                <SectionShell title="Global Two-Factor Authentication" description="Enforce 2FA for all users">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                            <Smartphone className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-medium text-slate-900">Enforce Authenticator App</h3>
                            <p className="text-sm text-slate-500 mb-4">Require all users to set up 2FA using Google Authenticator or Authy upon next login.</p>

                            {twoFactor ? (
                                <div className="space-y-3">
                                    <div className="bg-emerald-50 text-emerald-700 px-4 py-3 rounded-lg text-sm border border-emerald-100 flex items-center gap-2">
                                        <Shield className="w-4 h-4" /> 2FA Policy is <strong>ENABLED</strong>
                                    </div>
                                    <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setTwoFactor(false)}>
                                        Disable 2FA Enforcement
                                    </Button>
                                </div>
                            ) : (
                                <Button onClick={() => setTwoFactor(true)}>
                                    Enable 2FA Enforcement
                                </Button>
                            )}
                        </div>
                    </div>
                </SectionShell>

                {/* Password Policy */}
                <SectionShell title="Password Policy" description="Manage password requirements for users">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-surface-border">
                            <div className="flex items-center gap-3">
                                <Key className="w-5 h-5 text-slate-400" />
                                <div>
                                    <p className="text-sm font-medium text-slate-900">Enforce Password Expiry</p>
                                    <p className="text-xs text-slate-500">Users must change password every 90 days</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={passwordExpiry} onChange={() => setPasswordExpiry(!passwordExpiry)} className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-surface-border">
                            <div className="flex items-center gap-3">
                                <Lock className="w-5 h-5 text-slate-400" />
                                <div>
                                    <p className="text-sm font-medium text-slate-900">Session Timeout</p>
                                    <p className="text-xs text-slate-500">Auto-logout inactive users</p>
                                </div>
                            </div>
                            <select
                                value={sessionTimeout}
                                onChange={(e) => setSessionTimeout(e.target.value)}
                                className="text-sm border-gray-300 rounded-lg px-3 py-1 bg-white border outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="15">15 Minutes</option>
                                <option value="30">30 Minutes</option>
                                <option value="60">1 Hour</option>
                                <option value="240">4 Hours</option>
                            </select>
                        </div>
                    </div>
                </SectionShell>

                {/* Login Monitoring */}
                <SectionShell title="Login Monitoring" description="Monitor suspicious login attempts">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                            <Globe className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-medium text-slate-900">Suspicious IP Detection</h3>
                            <p className="text-sm text-slate-500">Notify admins when a login occurs from an unknown IP address or new device.</p>
                        </div>
                        <Button variant="outline" className="text-green-600 border-green-200 bg-green-50 pointer-events-none">
                            Active
                        </Button>
                    </div>
                </SectionShell>

                <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200">
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Security Settings
                    </Button>
                </div>
            </div>
        </main>
    );
}
