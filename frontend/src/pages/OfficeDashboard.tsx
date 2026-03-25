import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRequests, updateRequestStatus, getCounts } from '../lib/api';
import { Package, CheckCircle, Clock, Search, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

const OfficeDashboard = () => {
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [search, setSearch] = useState('');
    const queryClient = useQueryClient();

    const { data: requests, isLoading } = useQuery({
        queryKey: ['requests', statusFilter],
        queryFn: () => getRequests(statusFilter === 'all' ? undefined : statusFilter),
    });

    const { data: counts } = useQuery({
        queryKey: ['counts'],
        queryFn: getCounts,
    });

    const updateStatusMutation = useMutation({
        mutationFn: updateRequestStatus,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['requests'] });
            queryClient.invalidateQueries({ queryKey: ['counts'] });
        },
    });

    const filteredRequests = requests?.filter(r =>
        r.PRODUCT_NAME.toLowerCase().includes(search.toLowerCase()) ||
        r.REQUESTED_BY.toLowerCase().includes(search.toLowerCase())
    );

    const stats = [
        { label: 'Pending Requests', value: counts?.pending || 0, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
        { label: 'Orders Placed', value: counts?.ordered || 0, icon: Package, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
        { label: 'Received Items', value: counts?.received || 0, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    ];

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    Office Dashboard
                </h1>
                <p className="text-muted-foreground text-lg">Overview of inventory requests and status.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-3">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={cn(
                            "relative overflow-hidden p-6 rounded-3xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border shadow-sm hover:shadow-md transition-all duration-300 group",
                            stat.border
                        )}
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <stat.icon size={64} />
                        </div>

                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                                <p className="text-4xl font-bold mt-2">{stat.value}</p>
                            </div>
                            <div className={cn("p-4 rounded-2xl", stat.bg)}>
                                <stat.icon className={cn("w-8 h-8", stat.color)} />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/40 dark:bg-slate-900/40 backdrop-blur-md p-2 rounded-2xl border border-white/20 shadow-sm">
                <div className="flex items-center gap-2 w-full md:w-auto p-1">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-border/50">
                        <Filter size={16} className="text-muted-foreground" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-transparent font-medium outline-none cursor-pointer text-sm"
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="ordered">Ordered</option>
                            <option value="received">Received</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>

                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <input
                        type="text"
                        placeholder="Search requests..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border/50 bg-white/50 dark:bg-slate-800/50 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                    />
                </div>
            </div>

            {/* Requests Table */}
            <div className="rounded-3xl border border-white/20 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/30 text-muted-foreground font-semibold uppercase tracking-wider text-xs">
                            <tr>
                                <th className="px-8 py-6">Product</th>
                                <th className="px-6 py-6">Requested By</th>
                                <th className="px-6 py-6">Qty</th>
                                <th className="px-6 py-6">Urgency</th>
                                <th className="px-6 py-6">Status</th>
                                <th className="px-6 py-6">Date</th>
                                <th className="px-6 py-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                                            <p>Loading requests...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredRequests?.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                                        No requests found matching your filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredRequests?.map((request) => (
                                    <tr key={request.REQUEST_ID} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div>
                                                <p className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">{request.PRODUCT_NAME}</p>
                                                <p className="text-xs font-mono text-muted-foreground bg-secondary/50 inline-block px-1.5 py-0.5 rounded mt-1">{request.PRODUCT_ID}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-[10px] text-white font-bold">
                                                    {request.REQUESTED_BY.charAt(0)}
                                                </div>
                                                <span className="font-medium">{request.REQUESTED_BY}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="font-bold text-base">{request.QUANTITY_NEEDED}</span>
                                            <span className="text-muted-foreground text-xs ml-1">{request.UNIT_OF_MEASURE}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={cn(
                                                "px-3 py-1 rounded-full text-xs font-bold border shadow-sm",
                                                request.URGENCY === 'high' ? "bg-red-500/10 text-red-600 border-red-200 dark:border-red-900/50" :
                                                    request.URGENCY === 'medium' ? "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-900/50" :
                                                        "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-900/50"
                                            )}>
                                                {request.URGENCY.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <StatusBadge status={request.STATUS} />
                                        </td>
                                        <td className="px-6 py-5 text-muted-foreground font-medium">
                                            {new Date(request.SUBMITTED_AT).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <select
                                                value={request.STATUS}
                                                onChange={(e) => updateStatusMutation.mutate({
                                                    request_id: request.REQUEST_ID,
                                                    status: e.target.value,
                                                    updated_by: 'Admin'
                                                })}
                                                className="text-xs font-medium border border-border rounded-lg px-3 py-1.5 bg-background hover:bg-accent cursor-pointer outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="ordered">Ordered</option>
                                                <option value="received">Received</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const StatusBadge = ({ status }: { status: string }) => {
    const styles = {
        pending: "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-900/50",
        ordered: "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-900/50",
        received: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-900/50",
        cancelled: "bg-slate-500/10 text-slate-600 border-slate-200 dark:border-slate-800/50",
    };

    return (
        <span className={cn(
            "px-3 py-1 rounded-full text-xs font-bold border shadow-sm flex items-center w-fit gap-1.5",
            styles[status as keyof typeof styles] || styles.pending
        )}>
            <span className={cn("w-1.5 h-1.5 rounded-full",
                status === 'pending' ? "bg-amber-500" :
                    status === 'ordered' ? "bg-blue-500" :
                        status === 'received' ? "bg-emerald-500" : "bg-slate-500"
            )} />
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
};

export default OfficeDashboard;
