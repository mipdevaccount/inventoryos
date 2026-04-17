import { useQuery } from '@tanstack/react-query';
import { getVendors, getPurchaseOrders } from '../lib/api';
import { BarChart3, TrendingUp, DollarSign, PieChart, ArrowUpRight, ArrowDownRight, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';

const Reports = () => {
    const { data: vendors } = useQuery({
        queryKey: ['vendors'],
        queryFn: getVendors,
    });

    const { data: pos } = useQuery({
        queryKey: ['purchaseOrders'],
        queryFn: getPurchaseOrders,
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
            <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    Reports & Analytics
                </h1>
                <p className="text-muted-foreground text-lg">Insights into procurement performance and spend.</p>
            </div>

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
        </div>
    );
};

export default Reports;
