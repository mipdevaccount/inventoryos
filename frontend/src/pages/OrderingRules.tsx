import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRules, createRule, updateRule, getProducts, getVendors } from '../lib/api';
import type { OrderingRule } from '../lib/api';
import { Scale, Search, Plus, Pencil, Building2, Package, Tag, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OrderingRules() {
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [ruleToEdit, setRuleToEdit] = useState<OrderingRule | null>(null);

    const { data: rules, isLoading } = useQuery({
        queryKey: ['rules'],
        queryFn: getRules,
    });

    const filteredRules = rules?.filter(r =>
        (r.PRODUCT_NAME || '').toLowerCase().includes(search.toLowerCase()) ||
        (r.VENDOR_NAME || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Ordering Rules
                    </h1>
                    <p className="text-muted-foreground text-lg">Define specific order conditions and tier purchasing logic for optimal fulfillment.</p>
                </div>
                <button
                    onClick={() => { setRuleToEdit(null); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all text-sm group"
                >
                    <Plus size={20} className="group-hover:scale-125 transition-transform" />
                    New Rule
                </button>
            </div>

            <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md p-2 rounded-2xl border border-white/20 shadow-sm flex items-center">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <input
                        type="text"
                        placeholder="Search rules by vendor or product..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border/50 bg-white/50 dark:bg-slate-800/50 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                    />
                </div>
            </div>

            <div className="rounded-3xl border border-white/20 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/30 text-muted-foreground font-semibold uppercase tracking-wider text-xs">
                            <tr>
                                <th className="px-8 py-6">Vendor</th>
                                <th className="px-6 py-6">Product</th>
                                <th className="px-6 py-6">Min Quantity Rule</th>
                                <th className="px-6 py-6">Discount</th>
                                <th className="px-6 py-6" style={{maxWidth: '300px'}}>Notes</th>
                                <th className="px-6 py-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">Loading rules...</td>
                                </tr>
                            ) : filteredRules?.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">No rules found.</td>
                                </tr>
                            ) : (
                                filteredRules?.map((rule) => (
                                    <tr key={rule.RULE_ID} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400">
                                                    <Building2 size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-foreground">{rule.VENDOR_NAME || rule.VENDOR_ID}</p>
                                                    <p className="text-xs text-muted-foreground">ID: {rule.VENDOR_ID}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                             <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                    <Package size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-foreground">{rule.PRODUCT_NAME || rule.PRODUCT_ID}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="font-bold text-lg bg-green-500/10 text-green-700 dark:text-green-500 px-3 py-1 rounded-lg border border-green-500/20">{rule.MIN_QTY}+ Units</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="font-bold text-foreground flex items-center gap-1.5"><Tag size={16} className="text-muted-foreground" /> {rule.DISCOUNT_PCT}%</span>
                                        </td>
                                        <td className="px-6 py-5 text-muted-foreground truncate" style={{maxWidth: '300px'}} title={rule.NOTES}>
                                            {rule.NOTES || '—'}
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <button
                                                onClick={() => { setRuleToEdit(rule); setIsModalOpen(true); }}
                                                className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors inline-block"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <RuleModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setRuleToEdit(null); }}
                ruleToEdit={ruleToEdit}
            />
        </div>
    );
}

const RuleModal = ({ isOpen, onClose, ruleToEdit }: { isOpen: boolean; onClose: () => void; ruleToEdit: OrderingRule | null }) => {
    const [vendorId, setVendorId] = useState('');
    const [productId, setProductId] = useState('');
    const [minQty, setMinQty] = useState(1);
    const [discountPct, setDiscountPct] = useState(0);
    const [notes, setNotes] = useState('');

    const queryClient = useQueryClient();

    const { data: vendors } = useQuery({ queryKey: ['vendors'], queryFn: getVendors });
    const { data: products } = useQuery({ queryKey: ['products'], queryFn: () => getProducts() });

    useEffect(() => {
        if (ruleToEdit) {
            setVendorId(ruleToEdit.VENDOR_ID);
            setProductId(ruleToEdit.PRODUCT_ID);
            setMinQty(ruleToEdit.MIN_QTY);
            setDiscountPct(ruleToEdit.DISCOUNT_PCT);
            setNotes(ruleToEdit.NOTES);
        } else if (!isOpen) {
            setVendorId('');
            setProductId('');
            setMinQty(1);
            setDiscountPct(0);
            setNotes('');
        }
    }, [ruleToEdit, isOpen]);

    const mutation = useMutation({
        mutationFn: (data: any) => ruleToEdit ? updateRule(ruleToEdit.RULE_ID, data) : createRule(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rules'] });
            onClose();
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate({
            rule_id: ruleToEdit ? ruleToEdit.RULE_ID : `R-${Date.now()}`,
            vendor_id: vendorId,
            product_id: productId,
            min_qty: Number(minQty),
            discount_pct: Number(discountPct),
            notes
        });
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
                <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-white/10 flex flex-col max-h-[90vh]">
                    <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-green-500/20 to-teal-600/20" />
                    <form onSubmit={handleSubmit} className="relative flex flex-col h-full">
                        <div className="p-8 pb-4 shrink-0">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-green-500/25">
                                        <Scale size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold">{ruleToEdit ? 'Edit Order Rule' : 'New Order Rule'}</h2>
                                        <p className="text-muted-foreground font-medium">Configure tier thresholds and logic.</p>
                                    </div>
                                </div>
                                <button type="button" onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"><X size={20} className="text-muted-foreground" /></button>
                            </div>
                        </div>

                        <div className="p-8 pt-0 overflow-y-auto space-y-6 flex-1">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Vendor</label>
                                    <select required value={vendorId} onChange={(e) => setVendorId(e.target.value)} disabled={!!ruleToEdit} className="w-full px-4 py-3 rounded-xl border border-border/50 bg-secondary/50 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium disabled:opacity-50">
                                        <option value="">Select Vendor...</option>
                                        {vendors?.map(v => <option key={v.VENDOR_ID} value={v.VENDOR_ID}>{v.VENDOR_NAME}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Product</label>
                                    <select required value={productId} onChange={(e) => setProductId(e.target.value)} disabled={!!ruleToEdit} className="w-full px-4 py-3 rounded-xl border border-border/50 bg-secondary/50 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium disabled:opacity-50">
                                        <option value="">Select Product...</option>
                                        {products?.map(p => <option key={p.PRODUCT_ID} value={p.PRODUCT_ID}>{p.PRODUCT_NAME}</option>)}
                                    </select>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Minimum Quantity</label>
                                    <input required type="number" min="1" value={minQty} onChange={(e) => setMinQty(Number(e.target.value))} className="w-full px-4 py-3 rounded-xl border border-border/50 bg-secondary/50 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Discount (%)</label>
                                    <input required type="number" step="0.01" min="0" max="100" value={discountPct} onChange={(e) => setDiscountPct(Number(e.target.value))} className="w-full px-4 py-3 rounded-xl border border-border/50 bg-secondary/50 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Custom Rule Notes</label>
                                <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Ships palletized, 10% volume discount." className="w-full px-4 py-3 rounded-xl border border-border/50 bg-secondary/50 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium resize-none text-sm" />
                            </div>
                        </div>

                        <div className="p-8 shrink-0 flex justify-end gap-3 bg-secondary/20 border-t border-border/50">
                            <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-colors">Cancel</button>
                            <button type="submit" disabled={mutation.isPending} className="px-8 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0">
                                {mutation.isPending ? 'Saving...' : ruleToEdit ? 'Save Changes' : 'Create Rule'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
