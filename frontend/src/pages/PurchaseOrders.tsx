
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPurchaseOrders, createPurchaseOrder, updatePurchaseOrder, getPurchaseOrder, getVendors, getVendorProducts, getRequests, getAllVendorProducts, getOptimizationInsights, requestQuote } from '../lib/api';
import { Plus, Search, ChevronRight, FileText, X, Pencil, Clock, Info, Tag, Send, CheckSquare, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

const PurchaseOrders = () => {
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRFQModalOpen, setIsRFQModalOpen] = useState(false);
    const [poToEdit, setPoToEdit] = useState<any>(null);

    const { data: pos, isLoading } = useQuery({
        queryKey: ['purchaseOrders'],
        queryFn: getPurchaseOrders,
    });

    const filteredPOs = pos?.filter(po =>
        po.PO_NUMBER.toLowerCase().includes(search.toLowerCase()) ||
        po.VENDOR_NAME?.toLowerCase().includes(search.toLowerCase())
    );

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
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Purchase Orders
                    </h1>
                    <p className="text-muted-foreground text-lg">Manage procurement and track orders.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsRFQModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 text-foreground border border-border rounded-2xl font-semibold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                    >
                        <Send size={20} />
                        Request Quote
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all"
                    >
                        <Plus size={20} />
                        Create PO
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/40 dark:bg-slate-900/40 backdrop-blur-md p-2 rounded-2xl border border-white/20 shadow-sm">
                <div className="relative w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="Search POs or Vendors..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-border/50 bg-white/50 dark:bg-slate-800/50 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                </div>
            </div>

            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/20 rounded-3xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/50 dark:bg-slate-800/50">
                                <th className="text-left py-4 px-6 font-semibold text-sm text-muted-foreground uppercase tracking-wider">PO Number</th>
                                <th className="text-left py-4 px-6 font-semibold text-sm text-muted-foreground uppercase tracking-wider">Vendor</th>
                                <th className="text-left py-4 px-6 font-semibold text-sm text-muted-foreground uppercase tracking-wider">Status</th>
                                <th className="text-left py-4 px-6 font-semibold text-sm text-muted-foreground uppercase tracking-wider">Amount</th>
                                <th className="text-left py-4 px-6 font-semibold text-sm text-muted-foreground uppercase tracking-wider">Created</th>
                                <th className="text-right py-4 px-6 font-semibold text-sm text-muted-foreground uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center">
                                        <div className="flex justify-center">
                                            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredPOs?.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                                        No purchase orders found.
                                    </td>
                                </tr>
                            ) : (
                                filteredPOs?.map((po) => (
                                    <tr key={po.PO_NUMBER} className="hover:bg-white/50 dark:hover:bg-white/5 transition-colors group">
                                        <td className="py-4 px-6 font-mono font-medium">{po.PO_NUMBER}</td>
                                        <td className="py-4 px-6 font-medium">{po.VENDOR_NAME}</td>
                                        <td className="py-4 px-6">
                                            <span className={`px - 3 py - 1 rounded - full text - xs font - bold uppercase tracking - wider ${getStatusColor(po.STATUS)} `}>
                                                {po.STATUS}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 font-medium">${po.TOTAL_AMOUNT.toFixed(2)}</td>
                                        <td className="py-4 px-6 text-sm text-muted-foreground">
                                            {format(new Date(po.CREATED_AT), 'MMM d, yyyy')}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <button
                                                    onClick={() => {
                                                        setPoToEdit(po);
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                                <Link
                                                    to={`/purchase-orders/${encodeURIComponent(po.PO_NUMBER)}`}
                                                    className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                                                >
                                                    View
                                                    <ChevronRight size={16} />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <POModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setPoToEdit(null);
                }}
                poToEdit={poToEdit}
            />

            <RFQModal
                isOpen={isRFQModalOpen}
                onClose={() => setIsRFQModalOpen(false)}
            />
        </div>
    );
};

const POItemRow = ({ item, idx, vendorProducts, selectedVendor, handleUpdateQuantity, handleRemoveItem }: any) => {
    const product = vendorProducts?.find((p: any) => p.PRODUCT_ID === item.product_id);
    
    // Fetch insights for this specific item and vendor combination
    const { data: insights } = useQuery({
        queryKey: ['insights', selectedVendor, item.product_id],
        queryFn: () => getOptimizationInsights(selectedVendor, item.product_id),
        enabled: !!selectedVendor && !!item.product_id,
    });

    // Check if the current quantity meets or exceeds the rule threshold
    const discountActive = insights?.rule && item.quantity >= insights.rule.MIN_QTY;

    // Apply discount logic visually (assuming discount_pct is something like 10)
    const effectivePrice = discountActive && insights?.rule
        ? item.unit_price * (1 - (insights.rule.DISCOUNT_PCT / 100))
        : item.unit_price;

    return (
        <div key={idx} className={`flex flex-col gap-2 p-3 rounded-xl border transition-all ${discountActive ? 'bg-green-500/10 border-green-500/30' : 'bg-secondary/20 border-border/50'}`}>
            <div className="flex items-center gap-4">
                <div className="flex-1">
                    <p className="font-medium">{product?.PRODUCT_NAME}</p>
                    <div className="flex items-center gap-2">
                        <p className={`text-xs ${discountActive ? 'text-green-600 dark:text-green-400 font-bold' : 'text-muted-foreground'}`}>
                            ${effectivePrice.toFixed(2)} / {product?.UNIT_OF_MEASURE}
                            {discountActive && ' (Discount Applied)'}
                        </p>
                        {!discountActive && effectivePrice !== item.unit_price && (
                            <p className="text-xs text-muted-foreground line-through">${item.unit_price}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleUpdateQuantity(idx, parseInt(e.target.value) || 1)}
                        className="w-20 px-3 py-1.5 rounded-lg border border-border bg-white dark:bg-slate-800 text-center"
                    />
                    <button onClick={() => handleRemoveItem(idx)} className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors">
                        <X size={16} />
                    </button>
                </div>
            </div>
            {/* Optimization Insights Block */}
            {insights && (insights.rule || insights.history.last_order_date) && (
                <div className="mt-2 text-xs bg-black/5 dark:bg-white/5 rounded-lg p-2 flex flex-col gap-1.5 border border-border/30">
                    <div className="flex items-center gap-1.5 font-semibold text-primary/80">
                        <Info size={14} /> Optimization Insights
                    </div>
                    {insights.rule && (
                        <div className="flex items-start gap-1.5 text-muted-foreground">
                            <Tag size={12} className="mt-0.5 shrink-0" />
                            <span>Rule active: Order {insights.rule.MIN_QTY}+ for {insights.rule.DISCOUNT_PCT}% off. {insights.rule.NOTES}</span>
                        </div>
                    )}
                    {insights.history.last_order_date && (
                        <div className="flex items-start gap-1.5 text-muted-foreground">
                            <Clock size={12} className="mt-0.5 shrink-0" />
                            <span>History: Last ordered {insights.history.last_order_qty} units on {insights.history.last_order_date}. (Total {insights.history.qty_past_90_days} in last 90 days).</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const POModal = ({ isOpen, onClose, poToEdit }: { isOpen: boolean; onClose: () => void; poToEdit?: any }) => {
    const [step, setStep] = useState(1);
    const [selectedVendor, setSelectedVendor] = useState('');
    const [items, setItems] = useState<{ product_id: string; quantity: number; unit_price: number }[]>([]);

    const queryClient = useQueryClient();

    const { data: vendors } = useQuery({
        queryKey: ['vendors'],
        queryFn: getVendors,
    });

    const { data: vendorProducts } = useQuery({
        queryKey: ['vendorProducts', selectedVendor],
        queryFn: () => getVendorProducts(selectedVendor),
        enabled: !!selectedVendor,
    });

    const { data: poDetails } = useQuery({
        queryKey: ['poDetails', poToEdit?.PO_NUMBER],
        queryFn: () => getPurchaseOrder(poToEdit.PO_NUMBER),
        enabled: !!poToEdit,
    });

    const { data: actionableRequests } = useQuery({
        queryKey: ['requests', 'actionable'],
        queryFn: async () => {
            const [pending, quoted] = await Promise.all([getRequests('pending'), getRequests('quote_requested')]);
            return [...(pending || []), ...(quoted || [])];
        },
        enabled: !poToEdit && isOpen,
    });

    const { data: allVendorProducts } = useQuery({
        queryKey: ['allVendorProducts'],
        queryFn: getAllVendorProducts,
        enabled: !poToEdit && actionableRequests && actionableRequests.length > 0 && isOpen,
    });

    useEffect(() => {
        if (poToEdit && poDetails) {
            setSelectedVendor(poToEdit.VENDOR_ID);
            setStep(2);
            if (poDetails.items) {
                setItems(poDetails.items.map((i: any) => ({
                    product_id: i.PRODUCT_ID,
                    quantity: i.QUANTITY_ORDERED,
                    unit_price: i.UNIT_PRICE
                })));
            }
        } else if (!isOpen) {
            setSelectedVendor('');
            setStep(1);
            setItems([]);
        }
    }, [poToEdit, poDetails, isOpen]);

    const mutation = useMutation({
        mutationFn: (data: any) => poToEdit ? updatePurchaseOrder(poToEdit.PO_NUMBER, data) : createPurchaseOrder(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
            if (poToEdit) queryClient.invalidateQueries({ queryKey: ['purchaseOrder', poToEdit.PO_NUMBER] });
            onClose();
            setStep(1);
            setSelectedVendor('');
            setItems([]);
            alert(`PO ${poToEdit ? 'updated' : 'created'} successfully!`);
        },
    });

    const handleAddItem = (product: any) => {
        setItems([...items, { product_id: product.PRODUCT_ID, quantity: 1, unit_price: product.PRICE }]);
    };

    const handleUpdateQuantity = (index: number, quantity: number) => {
        const newItems = [...items];
        newItems[index].quantity = quantity;
        setItems(newItems);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleSubmit = () => {
        mutation.mutate({
            vendor_id: selectedVendor,
            items: items
        });
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-md"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-white/10 flex flex-col max-h-[90vh]"
                >
                    <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-blue-500/20 to-indigo-600/20" />

                    <div className="relative p-8 pb-0 shrink-0">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">{poToEdit ? 'Edit Purchase Order' : 'Create Purchase Order'}</h2>
                                    <p className="text-muted-foreground text-sm font-medium">Step {step} of 2</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
                                <X size={20} className="text-muted-foreground" />
                            </button>
                        </div>
                    </div>

                    <div className="p-8 pt-4 overflow-y-auto flex-1">
                        {step === 1 ? (
                            <div className="space-y-4">
                                {!poToEdit && actionableRequests && actionableRequests.length > 0 && (
                                    <div className="space-y-4 mb-8">
                                        <label className="text-sm font-semibold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2">
                                            <Clock size={16} /> Pending & Quoted Requests
                                        </label>
                                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl overflow-hidden">
                                            <table className="w-full text-sm">
                                                <thead className="bg-amber-500/10 text-amber-700/70 dark:text-amber-500/70 text-xs uppercase">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left">Product</th>
                                                        <th className="px-4 py-2 text-left">Qty</th>
                                                        <th className="px-4 py-2 text-left">Potential Vendors</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-amber-500/10">
                                                    {actionableRequests.map(req => {
                                                        const suppliers = allVendorProducts?.filter(vp => vp.PRODUCT_ID === req.PRODUCT_ID) || [];
                                                        const vendorNames = suppliers.map(s => {
                                                            const v = vendors?.find(vend => vend.VENDOR_ID === s.VENDOR_ID);
                                                            return v ? v.VENDOR_NAME : s.VENDOR_ID;
                                                        }).join(', ');
                                                        
                                                        return (
                                                            <tr key={req.REQUEST_ID} className={req.STATUS === 'quote_requested' ? 'opacity-70' : ''}>
                                                                <td className="px-4 py-3 font-medium text-amber-900 dark:text-amber-100">
                                                                    {req.PRODUCT_NAME}
                                                                    {req.STATUS === 'quote_requested' && <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full uppercase font-bold">Quoted</span>}
                                                                </td>
                                                                <td className="px-4 py-3 font-bold text-amber-700 dark:text-amber-400">{req.QUANTITY_NEEDED}</td>
                                                                <td className="px-4 py-3 text-amber-700/70 dark:text-amber-400/70">{vendorNames || 'No vendors configured'}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Select Vendor</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {vendors?.map(v => (
                                        <button
                                            key={v.VENDOR_ID}
                                            onClick={() => {
                                                setSelectedVendor(v.VENDOR_ID);
                                                setStep(2);
                                            }}
                                            className="flex items-center gap-4 p-4 rounded-xl border border-border bg-secondary/10 hover:bg-secondary/30 hover:border-primary/50 transition-all text-left group"
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                                <Building2 size={20} className="text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-bold">{v.VENDOR_NAME}</p>
                                                <p className="text-xs text-muted-foreground">{v.CONTACT_NAME}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-lg">Add Items</h3>
                                    {!poToEdit && (
                                        <button onClick={() => setStep(1)} className="text-sm text-primary hover:underline">Change Vendor</button>
                                    )}
                                </div>

                                {!poToEdit && actionableRequests && actionableRequests.length > 0 && (
                                    <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/20 flex items-center justify-between mt-4">
                                        <div>
                                            <p className="font-bold text-amber-700 dark:text-amber-500">Actionable Requests Found</p>
                                            <p className="text-sm text-amber-700/70 dark:text-amber-500/70">There are pending or quoted requests that this vendor can fulfill.</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const newItems = [...items];
                                                actionableRequests.forEach(req => {
                                                    const vp = vendorProducts?.find(vProd => vProd.PRODUCT_ID === req.PRODUCT_ID);
                                                    if (vp) {
                                                        const existingIdx = newItems.findIndex(i => i.product_id === req.PRODUCT_ID);
                                                        if (existingIdx >= 0) {
                                                            newItems[existingIdx].quantity += req.QUANTITY_NEEDED;
                                                        } else {
                                                            newItems.push({
                                                                product_id: req.PRODUCT_ID, quantity: req.QUANTITY_NEEDED, unit_price: vp.PRICE
                                                            });
                                                        }
                                                    }
                                                });
                                                setItems(newItems);
                                            }}
                                            className="px-4 py-2 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 transition-colors text-sm"
                                        >
                                            Auto-Fill Requests
                                        </button>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Available Products</label>
                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                        {vendorProducts?.map(vp => (
                                            <button
                                                key={vp.PRODUCT_ID}
                                                onClick={() => handleAddItem(vp)}
                                                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-secondary/10 hover:bg-secondary/30 transition-colors whitespace-nowrap"
                                            >
                                                <Plus size={16} />
                                                <span>{vp.PRODUCT_NAME}</span>
                                                <span className="text-xs text-muted-foreground ml-1">(${vp.PRICE})</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Order Items</label>
                                    {items.length === 0 ? (
                                        <div className="text-center py-8 border-2 border-dashed border-border rounded-xl text-muted-foreground">
                                            No items added yet.
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {items.map((item, idx) => (
                                                <POItemRow
                                                    key={idx}
                                                    item={item}
                                                    idx={idx}
                                                    vendorProducts={vendorProducts}
                                                    selectedVendor={selectedVendor}
                                                    handleUpdateQuantity={handleUpdateQuantity}
                                                    handleRemoveItem={handleRemoveItem}
                                                />
                                            ))}
                                            <div className="flex justify-end pt-4 border-t border-border">
                                                <p className="text-lg font-bold">
                                                    Total: ${items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-8 pt-0 shrink-0 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl font-semibold hover:bg-secondary transition-colors"
                        >
                            Cancel
                        </button>
                        {step === 2 && (
                            <button
                                onClick={handleSubmit}
                                disabled={mutation.isPending || items.length === 0}
                                className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
                            >
                                {mutation.isPending ? 'Saving...' : poToEdit ? 'Save Changes' : 'Create PO'}
                            </button>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

const RFQModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const [step, setStep] = useState(1);
    const [selectedRequests, setSelectedRequests] = useState<number[]>([]);
    const [selectedVendors, setSelectedVendors] = useState<string[]>([]);

    const queryClient = useQueryClient();

    const { data: pendingRequests } = useQuery({
        queryKey: ['requests', 'pending'],
        queryFn: () => getRequests('pending'),
        enabled: isOpen,
    });

    const { data: vendors } = useQuery({
        queryKey: ['vendors'],
        queryFn: getVendors,
        enabled: isOpen,
    });

    const mutation = useMutation({
        mutationFn: () => requestQuote({
            request_ids: selectedRequests,
            vendor_ids: selectedVendors,
            requested_by: 'Current User' // Update with real user if available
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['requests'] });
            onClose();
            setStep(1);
            setSelectedRequests([]);
            setSelectedVendors([]);
            alert('Quotes requested successfully!');
        },
    });

    useEffect(() => {
        if (!isOpen) {
            setStep(1);
            setSelectedRequests([]);
            setSelectedVendors([]);
        }
    }, [isOpen]);

    const handleToggleRequest = (id: number) => {
        setSelectedRequests(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
    };

    const handleToggleVendor = (id: string) => {
        setSelectedVendors(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-md"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-white/10 flex flex-col max-h-[90vh]"
                >
                    <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-indigo-500/20 to-purple-600/20" />

                    <div className="relative p-8 pb-0 shrink-0">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
                                    <Send size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">Request for Quote (RFQ)</h2>
                                    <p className="text-muted-foreground text-sm font-medium">Step {step} of 2</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
                                <X size={20} className="text-muted-foreground" />
                            </button>
                        </div>
                    </div>

                    <div className="p-8 pt-4 overflow-y-auto flex-1">
                        {step === 1 ? (
                            <div className="space-y-4">
                                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider block">
                                    Select Pending Requests
                                </label>
                                {!pendingRequests || pendingRequests.length === 0 ? (
                                    <div className="text-center py-8 border-2 border-dashed border-border rounded-xl text-muted-foreground">
                                        No pending requests available.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {pendingRequests.map(req => (
                                            <div
                                                key={req.REQUEST_ID}
                                                onClick={() => handleToggleRequest(req.REQUEST_ID)}
                                                className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${selectedRequests.includes(req.REQUEST_ID) ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-500/30' : 'bg-transparent border-border hover:bg-secondary/20'}`}
                                            >
                                                <div className="text-indigo-500">
                                                    {selectedRequests.includes(req.REQUEST_ID) ? <CheckSquare size={20} /> : <Square size={20} />}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-bold">{req.PRODUCT_NAME}</p>
                                                    <p className="text-xs text-muted-foreground">Qty: {req.QUANTITY_NEEDED} | {req.URGENCY} urgency</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-lg">Select Vendors</h3>
                                    <button onClick={() => setStep(1)} className="text-sm text-primary hover:underline">Back to Requests</button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {vendors?.map(v => (
                                        <div
                                            key={v.VENDOR_ID}
                                            onClick={() => handleToggleVendor(v.VENDOR_ID)}
                                            className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${selectedVendors.includes(v.VENDOR_ID) ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-500/30' : 'bg-secondary/10 border-border hover:bg-secondary/30'}`}
                                        >
                                            <div className="text-indigo-500">
                                                {selectedVendors.includes(v.VENDOR_ID) ? <CheckSquare size={20} /> : <Square size={20} />}
                                            </div>
                                            <div>
                                                <p className="font-bold">{v.VENDOR_NAME}</p>
                                                <p className="text-xs text-muted-foreground">{v.EMAIL || 'No email'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-8 pt-0 shrink-0 flex justify-end gap-3">
                         <button
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl font-semibold hover:bg-secondary transition-colors"
                        >
                            Cancel
                        </button>
                        {step === 1 ? (
                             <button
                                onClick={() => setStep(2)}
                                disabled={selectedRequests.length === 0}
                                className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all disabled:opacity-50"
                            >
                                Continue
                            </button>
                        ) : (
                             <button
                                onClick={() => mutation.mutate()}
                                disabled={mutation.isPending || selectedVendors.length === 0}
                                className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/25 hover:shadow-xl transition-all disabled:opacity-50"
                            >
                                {mutation.isPending ? 'Sending...' : 'Send for Quote'}
                            </button>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

// Helper component for icon
const Building2 = ({ size, className }: { size: number, className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
        <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
        <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
        <path d="M10 6h4" />
        <path d="M10 10h4" />
        <path d="M10 14h4" />
        <path d="M10 18h4" />
    </svg>
);

export default PurchaseOrders;
