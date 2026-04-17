import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Mail, Loader2 } from 'lucide-react';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        try {
            if (rememberMe) {
                localStorage.setItem('remember_me', 'true');
            } else {
                localStorage.removeItem('remember_me');
            }
            await login({ email, password });
            navigate('/');
        } catch (err: any) {
            setError(err.message || err.response?.data?.detail || 'Invalid email or password');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100/20 via-background to-background dark:from-indigo-950/20 px-4 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[128px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-[128px] pointer-events-none" />

            <div className="max-w-md w-full relative z-10 mt-[-10vh]">
                <div className="text-center mb-10">
                    <div className="relative inline-block mb-4">
                        <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full" />
                        <img src="/logo.jpg" alt="Commander Logo" className="h-20 w-auto object-contain relative z-10 mx-auto rounded-full shadow-lg border border-white/10" />
                    </div>
                    <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent drop-shadow-sm">Commander</h1>
                    <p className="text-[11px] font-bold text-muted-foreground tracking-[0.25em] uppercase mt-2">Inventory OS</p>
                </div>
                
                <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-white/20 dark:border-white/5 p-8 rounded-[2rem] shadow-2xl relative">
                    <h2 className="text-2xl font-bold mb-8 text-foreground text-center">Sign In</h2>
                    
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium text-center shadow-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground ml-1">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-indigo-500 transition-colors h-5 w-5" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-foreground shadow-sm"
                                    placeholder="admin@commander.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground ml-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-indigo-500 transition-colors h-5 w-5" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-foreground shadow-sm"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                                />
                                Remember me
                            </label>
                            <a href="#" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">Forgot password?</a>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold py-3.5 rounded-xl shadow-[0_8px_16px_-4px_rgba(99,102,241,0.4)] hover:shadow-[0_12px_20px_-4px_rgba(99,102,241,0.5)] transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-6 active:scale-[0.98]"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                            {isSubmitting ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
