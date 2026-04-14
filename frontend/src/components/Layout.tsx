import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Package,
    Menu,
    X,
    ShoppingCart,
    Settings,
    LogOut,
    Building2,
    FileText,
    BarChart3,
    Users,
    Scale,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const location = useLocation();
    const { user, logout } = useAuth();

    const navItems = [
        { path: '/', label: 'Shop Floor', icon: ShoppingCart },
        { path: '/admin', label: 'Office Dashboard', icon: LayoutDashboard },
        { path: '/products', label: 'Product Catalog', icon: Package },
        { path: '/vendors', label: 'Vendors', icon: Building2 },
        { path: '/purchase-orders', label: 'Purchase Orders', icon: FileText },
        { path: '/reports', label: 'Reports', icon: BarChart3 },
        { path: '/ordering-rules', label: 'Ordering Rules', icon: Scale },
        ...(user?.role === 'admin' ? [{ path: '/users', label: 'User Management', icon: Users }] : [])
    ];

    return (
        <div className="min-h-screen bg-background text-foreground flex overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100/20 via-background to-background dark:from-indigo-950/20">
            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className={cn(
                    "fixed lg:static inset-y-0 left-0 z-50 transform transition-all duration-300 ease-in-out lg:transform-none flex flex-col",
                    isSidebarCollapsed ? "w-20" : "w-72",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full",
                    "lg:m-4 lg:rounded-2xl border border-white/20 shadow-2xl lg:shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl"
                )}
            >
                <div className="p-6 flex flex-col items-center justify-center text-center relative">
                    <button
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className="absolute -right-3 top-10 border border-border bg-background p-1.5 rounded-full hover:bg-accent transition-colors z-50 shadow-sm hidden lg:flex"
                    >
                        {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>
                    <div className={cn("flex flex-col items-center gap-4 mb-2 transition-all", isSidebarCollapsed && "scale-75")}>
                        <div className="relative">
                            <div className="absolute inset-0 bg-indigo-500 blur-lg opacity-20 rounded-full" />
                            <img src="/logo.jpg" alt="Commander Logo" className={cn("h-20 w-auto max-w-[200px] object-contain relative z-10 transition-all", isSidebarCollapsed && "!h-10")} />
                        </div>
                        <div className={cn("transition-all duration-300 overflow-hidden", isSidebarCollapsed ? "h-0 opacity-0" : "h-auto opacity-100")}>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent leading-tight whitespace-nowrap">
                                Commander
                            </h1>
                            <p className="text-[10px] font-bold text-muted-foreground tracking-[0.2em] uppercase mt-1 whitespace-nowrap">Inventory OS</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="lg:hidden absolute right-4 top-4 p-2 hover:bg-black/5 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="px-4 py-2">
                    <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                </div>

                <nav className="flex-1 px-4 py-4 space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsSidebarOpen(false)}
                                className={cn(
                                    "relative flex items-center px-4 py-3.5 rounded-xl transition-all duration-300 group overflow-hidden",
                                    isSidebarCollapsed ? "justify-center" : "gap-3",
                                    isActive
                                        ? "bg-primary text-white shadow-lg shadow-primary/25"
                                        : "hover:bg-white/50 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground"
                                )}
                                title={isSidebarCollapsed ? item.label : undefined}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeGlow"
                                        className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-20"
                                    />
                                )}
                                <Icon size={20} className={cn("relative z-10 transition-transform duration-300 group-hover:scale-110 shrink-0", isActive ? "text-white" : "")} />
                                {!isSidebarCollapsed && (
                                    <span className="relative z-10 font-medium whitespace-nowrap">{item.label}</span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 mt-auto">
                    <div className={cn(
                        "rounded-2xl bg-gradient-to-br from-white/50 to-white/10 dark:from-white/5 dark:to-transparent border border-white/20 shadow-sm backdrop-blur-md transition-all",
                        isSidebarCollapsed ? "p-2" : "p-4"
                    )}>
                        <div className={cn("flex items-center gap-3", !isSidebarCollapsed && "mb-3")}>
                            <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold shadow-md uppercase mx-auto">
                                {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                            </div>
                            {!isSidebarCollapsed && (
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate capitalize">{user?.full_name || 'User Account'}</p>
                                    <p className="text-xs text-muted-foreground truncate">{user?.email || 'user@commander.com'}</p>
                                </div>
                            )}
                        </div>
                        {!isSidebarCollapsed ? (
                            <div className="flex gap-2 mt-2">
                                <button className="flex-1 flex items-center justify-center gap-2 text-xs font-medium py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                    <Settings size={14} />
                                    Settings
                                </button>
                                <button onClick={logout} className="flex-1 flex items-center justify-center gap-2 text-xs font-medium py-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors">
                                    <LogOut size={14} />
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2 mt-4">
                                <button title="Settings" className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex justify-center text-muted-foreground hover:text-foreground">
                                    <Settings size={18} />
                                </button>
                                <button title="Logout" onClick={logout} className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors flex justify-center">
                                    <LogOut size={18} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Top Bar (Mobile) */}
                <div className="lg:hidden h-16 flex items-center justify-between px-4 sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 hover:bg-accent rounded-lg transition-colors"
                    >
                        <Menu size={24} />
                    </button>
                    <span className="font-bold text-lg">CommanderOS</span>
                    <div className="w-10" />
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-auto p-4 lg:p-8 relative scroll-smooth">
                    <div className="max-w-7xl mx-auto animate-fade-in">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Layout;
