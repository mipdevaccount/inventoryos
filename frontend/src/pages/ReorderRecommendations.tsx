import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getReorderRecommendations, createPOFromRecommendation } from '../lib/api';
import { TrendingUp, Package, AlertCircle, CheckCircle, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';

const ReorderRecommendations = () => {
    const queryClient = useQueryClient();


    const { data: recommendations, isLoading, error } = useQuery({
        queryKey: ['reorderRecommendations'],
        queryFn: getReorderRecommendations,
        refetchInterval: 60000, // Refresh every minute
    });

    const createPOMutation = useMutation({
        mutationFn: createPOFromRecommendation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reorderRecommendations'] });
            queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
        },
    });

    const handleCreatePO = (productId: string) => {
        if (confirm('Create a purchase order for this recommendation?')) {
            createPOMutation.mutate(productId);
        }
    };

    const getConfidenceColor = (score: number) => {
        if (score >= 0.7) return 'text-green-600 bg-green-100';
        if (score >= 0.4) return 'text-yellow-600 bg-yellow-100';
        return 'text-red-600 bg-red-100';
    };

    const getUrgencyColor = (days: number) => {
        if (days <= 7) return 'border-red-500 bg-red-50';
        if (days <= 14) return 'border-yellow-500 bg-yellow-50';
        return 'border-blue-500 bg-blue-50';
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Analyzing inventory and generating recommendations...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-3xl p-6">
                <div className="flex items-center gap-3">
                    <AlertCircle className="text-red-600" size={24} />
                    <div>
                        <h3 className="font-semibold text-red-900">Error Loading Recommendations</h3>
                        <p className="text-red-700 text-sm mt-1">
                            {error instanceof Error ? error.message : 'Failed to load recommendations'}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    Smart Reorder Recommendations
                </h1>
                <p className="text-muted-foreground text-lg">
                    AI-powered inventory forecasting and reorder suggestions
                </p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/20 rounded-3xl p-6 shadow-lg"
                >
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <TrendingUp size={24} />
                        </div>
                        <p className="font-semibold text-muted-foreground">Active Recommendations</p>
                    </div>
                    <h3 className="text-3xl font-bold">{recommendations?.length || 0}</h3>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/20 rounded-3xl p-6 shadow-lg"
                >
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                            <AlertCircle size={24} />
                        </div>
                        <p className="font-semibold text-muted-foreground">Urgent (≤7 days)</p>
                    </div>
                    <h3 className="text-3xl font-bold">
                        {recommendations?.filter(r => r.days_until_stockout <= 7).length || 0}
                    </h3>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/20 rounded-3xl p-6 shadow-lg"
                >
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                            <CheckCircle size={24} />
                        </div>
                        <p className="font-semibold text-muted-foreground">High Confidence</p>
                    </div>
                    <h3 className="text-3xl font-bold">
                        {recommendations?.filter(r => r.confidence_score >= 0.7).length || 0}
                    </h3>
                </motion.div>
            </div>

            {/* Recommendations List */}
            <div className="space-y-4">
                {!recommendations || recommendations.length === 0 ? (
                    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/20 rounded-3xl p-12 text-center">
                        <Package size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="text-xl font-semibold mb-2">No Recommendations</h3>
                        <p className="text-muted-foreground">
                            All products are adequately stocked, or there isn't enough historical data for forecasting.
                        </p>
                    </div>
                ) : (
                    recommendations.map((rec, idx) => (
                        <motion.div
                            key={rec.product_id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border-2 ${getUrgencyColor(rec.days_until_stockout)} rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all`}
                        >
                            <div className="flex items-start justify-between gap-6">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <h3 className="text-xl font-bold">{rec.product_name}</h3>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getConfidenceColor(rec.confidence_score)}`}>
                                            {Math.round(rec.confidence_score * 100)}% Confidence
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Current Stock</p>
                                            <p className="text-lg font-semibold">{rec.current_stock}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Recommended Order</p>
                                            <p className="text-lg font-semibold text-blue-600">{rec.recommended_quantity}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Days Until Stockout</p>
                                            <p className={`text-lg font-semibold ${rec.days_until_stockout <= 7 ? 'text-red-600' : 'text-green-600'}`}>
                                                {rec.days_until_stockout}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Estimated Cost</p>
                                            <p className="text-lg font-semibold">
                                                ${(rec.recommended_quantity * rec.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 mb-4">
                                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">AI Reasoning:</p>
                                        <p className="text-sm text-blue-800 dark:text-blue-200">{rec.reason}</p>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <span className="font-semibold">Recommended Vendor:</span>
                                        <span>{rec.recommended_vendor}</span>
                                        <span className="text-xs">@ ${rec.unit_price}/unit</span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => handleCreatePO(rec.product_id)}
                                        disabled={createPOMutation.isPending}
                                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                                    >
                                        <ShoppingCart size={18} />
                                        Create PO
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ReorderRecommendations;
