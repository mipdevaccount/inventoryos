import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUsers, deleteUser } from '../lib/api';
import { UserPlus, Shield, Mail, Lock, User as UserIcon, Loader2, CheckCircle2, Trash2, Users } from 'lucide-react';

export interface UserData {
  user_id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

const UserManagement: React.FC = () => {
    const { register, user: currentUser } = useAuth();
    
    // Registration State
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        role: 'user'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // User List State
    const [users, setUsers] = useState<UserData[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [deleteError, setDeleteError] = useState('');

    const fetchUsers = async () => {
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (err) {
            console.error("Failed to load users:", err);
        } finally {
            setIsLoadingUsers(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsSubmitting(true);
        
        try {
            await register(formData);
            setSuccess(`User ${formData.full_name} registered successfully!`);
            setFormData({ full_name: '', email: '', password: '', role: 'user' });
            await fetchUsers(); // Refresh the list
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to register user');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (userId: number, userName: string) => {
        if (window.confirm(`Are you sure you want to permanently delete ${userName}?`)) {
            setDeleteError('');
            try {
                await deleteUser(userId);
                setUsers(users.filter(u => u.user_id !== userId));
            } catch (err: any) {
                setDeleteError(err.response?.data?.detail || 'Failed to delete user');
            }
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">User Management</h1>
                <p className="text-muted-foreground mt-1">Register new users and manage system access.</p>
            </div>

            {deleteError && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 text-sm font-medium">
                    {deleteError}
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* LEFT COLUMN: REGISTRATION & PERMISSIONS */}
                <div className="space-y-6 flex flex-col">
                    {/* REGISTRATION FORM */}
                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 bg-indigo-500/10 rounded-xl">
                            <UserPlus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h2 className="text-xl font-semibold">Register New User</h2>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm font-medium flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5" />
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium ml-1 text-muted-foreground">Full Name</label>
                            <div className="relative group">
                                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-indigo-500 transition-colors h-5 w-5" />
                                <input
                                    type="text"
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    className="w-full bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 pl-11 pr-4 outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium ml-1 text-muted-foreground">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-indigo-500 transition-colors h-5 w-5" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 pl-11 pr-4 outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                                    placeholder="john@commander.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium ml-1 text-muted-foreground">Initial Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-indigo-500 transition-colors h-5 w-5" />
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 pl-11 pr-4 outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium ml-1 text-muted-foreground">System Role</label>
                            <div className="relative group">
                                <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-indigo-500 transition-colors h-5 w-5 z-10" />
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className="w-full bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 pl-11 pr-4 appearance-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all relative shadow-sm"
                                    required
                                >
                                    <option value="user">Standard User</option>
                                    <option value="admin">Admin - Full Access</option>
                                    <option value="office">Office - Manage POs & Products</option>
                                    <option value="shop_floor">Shop Floor - View Inventory & Requests</option>
                                    <option value="read_only">Read Only - View Access Only</option>
                                </select>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-6 shadow-md"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                            {isSubmitting ? 'Registering...' : 'Complete Registration'}
                        </button>
                    </form>
                </div>

                {/* ROLE PERMISSIONS INFO */}
                <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-200 mb-4 flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Role Permissions
                    </h3>
                    <ul className="space-y-4 text-sm text-indigo-800 dark:text-indigo-300">
                        <li className="flex gap-3">
                            <div className="mt-0.5 text-indigo-500">•</div>
                            <div><strong className="block text-indigo-950 dark:text-indigo-100">Admin</strong> Has full access to all system features including user management.</div>
                        </li>
                        <li className="flex gap-3">
                            <div className="mt-0.5 text-indigo-500">•</div>
                            <div><strong className="block text-indigo-950 dark:text-indigo-100">Office</strong> Can manage purchase orders, vendors, and products.</div>
                        </li>
                        <li className="flex gap-3">
                            <div className="mt-0.5 text-indigo-500">•</div>
                            <div><strong className="block text-indigo-950 dark:text-indigo-100">Shop Floor</strong> Can view inventory and submit product requests.</div>
                        </li>
                        <li className="flex gap-3">
                            <div className="mt-0.5 text-indigo-500">•</div>
                            <div><strong className="block text-indigo-950 dark:text-indigo-100">Standard User</strong> Basic system access.</div>
                        </li>
                        <li className="flex gap-3">
                            <div className="mt-0.5 text-indigo-500">•</div>
                            <div><strong className="block text-indigo-950 dark:text-indigo-100">Read Only</strong> Can only view data, no modifications allowed.</div>
                        </li>
                    </ul>
                </div>
                </div>

                {/* RIGHT COLUMN: USER DIRECTORY TABLE */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col h-[700px]">
                    <div className="flex items-center justify-between mb-6 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-violet-500/10 rounded-xl">
                                <Users className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                            </div>
                            <h2 className="text-xl font-semibold">User Directory</h2>
                        </div>
                        <div className="text-sm text-muted-foreground font-medium bg-background/50 px-3 py-1 rounded-full border border-border">
                            {users.length} Total
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto rounded-xl border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-black/20">
                        {isLoadingUsers ? (
                            <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
                                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                                <p>Loading directory...</p>
                            </div>
                        ) : users.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-muted-foreground">
                                No users found.
                            </div>
                        ) : (
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-muted-foreground uppercase bg-slate-50/50 dark:bg-white/5 sticky top-0 z-10 backdrop-blur-md">
                                    <tr>
                                        <th className="px-5 py-4 font-semibold">Name</th>
                                        <th className="px-5 py-4 font-semibold">Email</th>
                                        <th className="px-5 py-4 font-semibold">Role</th>
                                        <th className="px-5 py-4 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                    {users.map((u) => (
                                        <tr key={u.user_id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group">
                                            <td className="px-5 py-3 font-medium text-foreground">{u.full_name}</td>
                                            <td className="px-5 py-3 text-muted-foreground truncate max-w-[150px]" title={u.email}>{u.email}</td>
                                            <td className="px-5 py-3">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border
                                                    ${u.role === 'admin' ? 'bg-indigo-500/10 text-indigo-600 border-indigo-200 dark:border-indigo-500/20' : 
                                                    u.role === 'office' ? 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-500/20' : 
                                                    u.role === 'shop_floor' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-500/20' : 
                                                    'bg-slate-500/10 text-slate-600 border-slate-200 dark:border-slate-500/20'}`}>
                                                    {u.role.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <button
                                                    onClick={() => handleDelete(u.user_id, u.full_name)}
                                                    disabled={currentUser?.email === u.email}
                                                    title={currentUser?.email === u.email ? "Cannot delete yourself" : "Delete User"}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 cursor-pointer"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;
