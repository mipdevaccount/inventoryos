import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, Shield, Mail, Lock, User as UserIcon, Loader2, CheckCircle2 } from 'lucide-react';

const UserManagement: React.FC = () => {
    const { register } = useAuth();
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        role: 'user'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

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
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to register user');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">User Management</h1>
                <p className="text-muted-foreground mt-1">Register new users and manage system access.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card border rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 bg-primary/10 rounded-xl">
                            <UserPlus className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="text-xl font-semibold">Register New User</h2>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 text-sm font-medium flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5" />
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium ml-1">Full Name</label>
                            <div className="relative group">
                                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors h-5 w-5" />
                                <input
                                    type="text"
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    className="w-full bg-background border rounded-xl py-2.5 pl-11 pr-4 outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-sm"
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium ml-1">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors h-5 w-5" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full bg-background border rounded-xl py-2.5 pl-11 pr-4 outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-sm"
                                    placeholder="john@commander.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium ml-1">Initial Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors h-5 w-5" />
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full bg-background border rounded-xl py-2.5 pl-11 pr-4 outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-sm"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium ml-1">System Role</label>
                            <div className="relative group">
                                <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors h-5 w-5 z-10" />
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className="w-full bg-background border rounded-xl py-2.5 pl-11 pr-4 appearance-none outline-none focus:ring-2 focus:ring-primary/50 transition-all relative shadow-sm"
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
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-6 shadow-md"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                            {isSubmitting ? 'Registering...' : 'Complete Registration'}
                        </button>
                    </form>
                </div>

                {/* Additional Info / Security Guidelines */}
                <div className="space-y-6">
                    <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl p-6">
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
            </div>
        </div>
    );
};

export default UserManagement;
