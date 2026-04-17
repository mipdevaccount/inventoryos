import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getVendors, getPurchaseOrders, getInventoryAdjustments } from '../lib/api';
import { BarChart3, TrendingUp, DollarSign, PieChart, ArrowUpRight, ArrowDownRight, Building2, ClipboardList } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const Reports = () => {
    const [activeTab, setActiveTab] = useState<'procurement' | 'inventory'>('procurement');
    const { data: vendors } = useQuery({
        queryKey: ['vendors'],
        queryFn: getVendors,
    });

    const { data: pos } = useQuery({
        queryKey: ['purchaseOrders'],
        queryFn: getPurchaseOrders,
    });

    const { data: adjustments } = useQuery({
        queryKey: ['inventoryAdjustments'],
        queryFn: getInventoryAdjustments,
    });

    // Calculate metrics
    const totalSpend = pos?.reduce((sum, po) => sum + po.TOTAL_AMOUNT, 0) || 0;
    const totalOrders = pos?.length || 0;
    const averageOrderValue = totalOrders > 0 ? totalSpend / totalOrders : 0;

    // Calculate spend by vendor
    const spendByVendor = pos?.reduce((acc, po) => {
        acc[po.VENDOR_ID] = (acc[po.VENDOR_ID] || 0) + po.TOTAL_AMOUNT;
        return acc;
    }, {} as Record<string, number>) || {};

    // Sort vendors by spend
    const topVendors = Object.entries(spendByVendor)
        .sort(([, a], [, b]) => b - a)
        .map(([vendorId, amount]) => {
            const vendor = vendors?.find(v => v.VENDOR_ID === vendorId);
            return {
                id: vendorId,
                name: vendor?.VENDOR_NAME || vendorId,
                amount,
                percentage: (amount / totalSpend) * 100
            };
        });

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Reports & Analytics
                    </h1>
                    <p className="text-muted-foreground text-lg">Insights into procurement performance and inventory history.</p>
                </div>
                <div className="flex bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-1.5 rounded-2xl w-fit border border-border shadow-sm">
                    <button
                        onClick={() => setActiveTab('procurement')}
                        className={`px-6 py-2.5 rounded-xl font-bold text-sm tracking-wide transition-all ${activeTab === 'procurement' ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Procurement
                    </button>
                    <button
                        onClick={() => setActiveTab('inventory')}
                        className={`px-6 py-2.5 rounded-xl font-bold text-sm tracking-wide transition-all ${activeTab === 'inventory' ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Inventory Adjustments
                    </button>
                </div>
            </div>

            {activeTab === 'procurement' ? (
                <>
                    {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/20 rounded-3xl p-6 shadow-lg relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <DollarSign size={24} />
                        </div>
                        <p className="font-semibold text-muted-foreground">Total Spend</p>
                    </div>
                    <h3 className="text-3xl font-bold">${totalSpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                    <div className="flex items-center gap-1 mt-2 text-sm text-green-600 font-medium">
                        <ArrowUpRight size={16} />
                        <span>+12.5% from last month</span>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/20 rounded-3xl p-6 shadow-lg relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                            <BarChart3 size={24} />
                        </div>
                        <p className="font-semibold text-muted-foreground">Total Orders</p>
                    </div>
                    <h3 className="text-3xl font-bold">{totalOrders}</h3>
                    <div className="flex items-center gap-1 mt-2 text-sm text-green-600 font-medium">
                        <ArrowUpRight size={16} />
                        <span>+5 new this week</span>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/20 rounded-3xl p-6 shadow-lg relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                            <TrendingUp size={24} />
                        </div>
                        <p className="font-semibold text-muted-foreground">Avg. Order Value</p>
                    </div>
                    <h3 className="text-3xl font-bold">${averageOrderValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                    <div className="flex items-center gap-1 mt-2 text-sm text-red-500 font-medium">
                        <ArrowDownRight size={16} />
                        <span>-2.1% from last month</span>
                    </div>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Spend by Vendor Chart */}
                <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/20 rounded-3xl p-8 shadow-lg">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <PieChart size={20} className="text-primary" />
                        Spend by Vendor
                    </h3>
                    <div className="space-y-6">
                        {topVendors.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">No data available.</p>
                        ) : (
                            topVendors.map((vendor, idx) => (
                                <div key={vendor.id} className="space-y-2">
                                    <div className="flex justify-between text-sm font-medium">
                                        <span>{vendor.name}</span>
                                        <span>${vendor.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({vendor.percentage.toFixed(1)}%)</span>
                                    </div>
                                    <div className="h-3 w-full bg-secondary/50 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${vendor.percentage}%` }}
                                            transition={{ duration: 1, delay: idx * 0.1 }}
                                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Vendor Scorecard */}
                <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/20 rounded-3xl p-8 shadow-lg">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Building2 size={20} className="text-primary" />
                        Vendor Scorecard
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border/50">
                                    <th className="text-left py-3 font-semibold text-sm text-muted-foreground">Vendor</th>
                                    <th className="text-right py-3 font-semibold text-sm text-muted-foreground">Orders</th>
                                    <th className="text-right py-3 font-semibold text-sm text-muted-foreground">Total Spend</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {topVendors.map((vendor) => {
                                    const vendorOrders = pos?.filter(p => p.VENDOR_ID === vendor.id).length || 0;
                                    return (
                                        <tr key={vendor.id} className="group">
                                            <td className="py-4 font-medium">{vendor.name}</td>
                                            <td className="py-4 text-right">{vendorOrders}</td>
                                            <td className="py-4 text-right font-mono">${vendor.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
                </>
            ) : (
                <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/20 rounded-3xl p-8 shadow-lg">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <ClipboardList size={20} className="text-primary" />
                        Manual Inventory Adjustments Log
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white/50 dark:bg-slate-800/50 border-b border-border/50">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Date & Time</th>
                                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Product</th>
                                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">Previous</th>
                                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">New</th>
                                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">Delta</th>
                                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Adjusted By</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {(!adjustments || adjustments.length === 0) ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                            No manual inventory adjustments have been logged yet.
                                        </td>
                                    </tr>
                                ) : (
                                    adjustments.map((log) => {
                                        const delta = log.NEW_STOCK - log.OLD_STOCK;
                                        const isPositive = delta > 0;
                                        const isNegative = delta < 0;
                                        return (
                                            <tr key={log.ADJUSTMENT_ID} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4 text-sm font-medium">
                                                    {format(new Date(log.ADJUSTMENT_DATE), 'MMM d, yyyy HH:mm')}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-foreground text-sm max-w-xs truncate" title={log.PRODUCT_NAME}>{log.PRODUCT_NAME}</div>
                                                    <div className="text-xs text-muted-foreground font-mono mt-0.5">{log.PRODUCT_ID}</div>
                                                </td>
                                                <td className="px-6 py-4 text-center font-mono text-muted-foreground">
                                                    {log.OLD_STOCK}
                                                </td>
                                                <td className="px-6 py-4 text-center font-bold text-lg font-mono">
                                                    {log.NEW_STOCK}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex items-center justify-center px-3 py-1 rounded-lg font-bold text-xs border shadow-sm
                                                        ${isPositive ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/30' : 
                                                          isNegative ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30' : 
                                                          'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'}`}>
                                                        {delta > 0 ? '+' : ''}{delta}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm font-medium">
                                                    {log.ADJUSTED_BY}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;
