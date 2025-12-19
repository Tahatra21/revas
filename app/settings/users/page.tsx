"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, Shield, User, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";

interface UserData {
    id: number;
    username: string;
    email: string;
    full_name: string;
    role: "admin" | "user";
    is_active: boolean;
    last_login: string | null;
}

export default function UserManagementPage() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        username: "",
        full_name: "",
        email: "",
        role: "user",
        password: ""
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/users");
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (user?: UserData) => {
        if (user) {
            setIsEditMode(true);
            setSelectedUser(user);
            setFormData({
                username: user.username,
                full_name: user.full_name || "",
                email: user.email,
                role: user.role,
                password: "" // Keep empty for edit unless changing
            });
        } else {
            setIsEditMode(false);
            setSelectedUser(null);
            setFormData({
                username: "",
                full_name: "",
                email: "",
                role: "user",
                password: ""
            });
        }
        setIsModalOpen(true);
    };

    const handleDelete = async (userId: number) => {
        if (confirm("Are you sure you want to delete this user?")) {
            try {
                const res = await fetch(`/api/users?id=${userId}`, { method: "DELETE" });
                if (res.ok) {
                    fetchUsers();
                } else {
                    alert("Failed to delete user");
                }
            } catch (e) {
                alert("Error deleting user");
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const url = "/api/users";
            const method = isEditMode ? "PUT" : "POST";
            const body = isEditMode
                ? { ...formData, id: selectedUser?.id }
                : formData;

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                setIsModalOpen(false);
                fetchUsers();
            } else {
                const err = await res.json();
                alert(err.message || "Operation failed");
            }
        } catch (error) {
            alert("Error saving user");
        }
    };

    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <main className="min-h-screen p-8 bg-slate-50/50">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
                        <p className="text-slate-500 mt-1">Manage system access and roles.</p>
                    </div>
                    <Button onClick={() => handleOpenModal()}>
                        <Plus className="w-4 h-4 mr-2" /> Add New User
                    </Button>
                </div>

                {/* Filter and Table */}
                <div className="bg-white rounded-xl border border-surface-border shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-surface-border flex gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-sm border border-surface-border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-medium">
                                <tr>
                                    <th className="px-6 py-3">User</th>
                                    <th className="px-6 py-3">Role</th>
                                    <th className="px-6 py-3">Last Login</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-border">
                                {loading ? (
                                    <tr><td colSpan={4} className="p-8 text-center text-gray-500">Loading users...</td></tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr><td colSpan={4} className="p-8 text-center text-gray-500">No users found.</td></tr>
                                ) : (
                                    filteredUsers.map(user => (
                                        <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${user.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                                        {user.role === 'admin' ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-slate-900">{user.full_name || user.username}</div>
                                                        <div className="text-xs text-slate-500">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="outline" className={user.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'}>
                                                    {user.role.toUpperCase()}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">
                                                {user.last_login ? new Date(user.last_login).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => handleOpenModal(user)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition-colors">
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(user.id)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-red-600 transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditMode ? "Edit User" : "Add New User"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Username</label>
                            <input
                                required
                                disabled={isEditMode}
                                type="text"
                                value={formData.username}
                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                                className="w-full px-3 py-2 border border-surface-border rounded-lg text-sm bg-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Full Name</label>
                            <input
                                type="text"
                                value={formData.full_name}
                                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                className="w-full px-3 py-2 border border-surface-border rounded-lg text-sm bg-white"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Email</label>
                        <input
                            required
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-3 py-2 border border-surface-border rounded-lg text-sm bg-white"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Role</label>
                        <div className="grid grid-cols-2 gap-4">
                            <label className={`flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${formData.role === 'admin' ? 'bg-purple-50 border-purple-500 text-purple-700' : 'border-surface-border hover:bg-slate-50'}`}>
                                <input
                                    type="radio"
                                    name="role"
                                    value="admin"
                                    checked={formData.role === 'admin'}
                                    onChange={(e) => setFormData({ ...formData, role: 'admin' })}
                                    className="hidden"
                                />
                                <Shield className="w-4 h-4" />
                                <span className="font-medium text-sm">Admin</span>
                            </label>

                            <label className={`flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${formData.role === 'user' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-surface-border hover:bg-slate-50'}`}>
                                <input
                                    type="radio"
                                    name="role"
                                    value="user"
                                    checked={formData.role === 'user'}
                                    onChange={(e) => setFormData({ ...formData, role: 'user' })}
                                    className="hidden"
                                />
                                <User className="w-4 h-4" />
                                <span className="font-medium text-sm">User</span>
                            </label>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <Info className="w-3 h-3" />
                            {formData.role === 'admin' ? "Full access to all features including bulk upload." : "View-only access. Cannot upload data."}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">{isEditMode ? "New Password (Optional)" : "Password"}</label>
                        <input
                            required={!isEditMode}
                            type="password"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            className="w-full px-3 py-2 border border-surface-border rounded-lg text-sm bg-white"
                            placeholder={isEditMode ? "Leave empty to keep current" : "Enter password"}
                        />
                    </div>

                    <Button type="submit" className="w-full mt-4">
                        {isEditMode ? "Update User" : "Create User"}
                    </Button>
                </form>
            </Modal>
        </main>
    );
}
