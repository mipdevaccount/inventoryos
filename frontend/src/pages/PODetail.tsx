import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPurchaseOrder, updatePOStatus } from '../lib/api';
import { ArrowLeft, FileText, DollarSign, Building2, Package, CheckCircle2, Truck, XCircle } from 'lucide-react';
import { format } from 'date-fns';

const PODetail = () => {
    const { poNumber } = useParams<{ poNumber: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: po, isLoading } = useQuery({
        queryKey: ['purchaseOrder', poNumber],
        queryFn: () => getPurchaseOrder(poNumber!),
        enabled: !!poNumber,
    });

    const statusMutation = useMutation({
        mutationFn: (status: string) => updatePOStatus(poNumber!, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchaseOrder', poNumber] });
        },
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    if (!po) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <p className="text-xl font-semibold text-muted-foreground">Purchase Order not found.</p>
                <button onClick={() => navigate('/purchase-orders')} className="text-primary hover:underline">
                    Back to List
                </button>
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Draft': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
            case 'Ordered': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
            case 'Partial': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
            case 'Received': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
            case 'Closed': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="space-y-6">
                <button
                    onClick={() => navigate('/purchase-orders')}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft size={18} />
                    Back to List
                </button>

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/25 shrink-0">
                            <FileText size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">{po.PO_NUMBER}</h1>
                            <div className="flex items-center gap-3 mt-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(po.STATUS)}`}>
                                    {po.STATUS}
                                </span>
                                <span className="text-muted-foreground text-sm">
                                    Created on {format(new Date(po.CREATED_AT), 'MMMM d, yyyy')}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        {po.STATUS === 'Draft' && (
                            <button
                                onClick={() => statusMutation.mutate('Ordered')}
                                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-600/25 hover:bg-blue-700 transition-all"
                            >
                                <Truck size={18} />
                                Mark as Ordered
                            </button>
                        )}
                        {po.STATUS === 'Ordered' && (
                            <button
                                onClick={() => statusMutation.mutate('Received')}
                                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold shadow-lg shadow-green-600/25 hover:bg-green-700 transition-all"
                            >
                                <CheckCircle2 size={18} />
                                Mark Received
                            </button>
                        )}
                        {po.STATUS !== 'Closed' && po.STATUS !== 'Received' && (
                            <button
                                onClick={() => statusMutation.mutate('Closed')}
                                className="flex items-center gap-2 px-6 py-3 bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 rounded-xl font-semibold hover:bg-slate-300 dark:hover:bg-slate-700 transition-all"
                            >
                                <XCircle size={18} />
                                Close PO
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Vendor Info */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/20 rounded-3xl p-6 shadow-lg">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Building2 size={20} className="text-primary" />
                            Vendor Details
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Vendor</p>
                                <p className="font-medium text-lg">{po.VENDOR_NAME}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Vendor ID</p>
                                <p className="font-mono">{po.VENDOR_ID}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/20 rounded-3xl p-6 shadow-lg">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <DollarSign size={20} className="text-primary" />
                            Order Summary
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span className="font-medium">${po.TOTAL_AMOUNT.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Tax (0%)</span>
                                <span className="font-medium">$0.00</span>
                            </div>
                            <div className="pt-4 border-t border-border flex justify-between items-center">
                                <span className="font-bold text-lg">Total</span>
                                <span className="font-bold text-lg text-primary">${po.TOTAL_AMOUNT.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items List */}
                <div className="lg:col-span-2">
                    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/20 rounded-3xl shadow-lg overflow-hidden">
                        <div className="p-6 border-b border-white/10">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Package size={20} className="text-primary" />
                                Line Items
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-white/50 dark:bg-slate-800/50">
                                        <th className="text-left py-4 px-6 font-semibold text-sm text-muted-foreground uppercase tracking-wider">Product</th>
                                        <th className="text-center py-4 px-6 font-semibold text-sm text-muted-foreground uppercase tracking-wider">Qty</th>
                                        <th className="text-right py-4 px-6 font-semibold text-sm text-muted-foreground uppercase tracking-wider">Unit Price</th>
                                        <th className="text-right py-4 px-6 font-semibold text-sm text-muted-foreground uppercase tracking-wider">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {po.items?.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
                                            <td className="py-4 px-6">
                                                <div>
                                                    <p className="font-medium">{item.PRODUCT_NAME}</p>
                                                    <p className="text-xs text-muted-foreground font-mono">{item.PRODUCT_ID}</p>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-center font-medium">
                                                {item.QUANTITY_ORDERED} {item.UNIT_OF_MEASURE}
                                            </td>
                                            <td className="py-4 px-6 text-right font-mono">
                                                ${item.UNIT_PRICE.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="py-4 px-6 text-right font-mono font-bold">
                                                ${(item.QUANTITY_ORDERED * item.UNIT_PRICE).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PODetail;
