import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getVendor, getVendorProducts, addVendorProduct, getProducts } from '../lib/api';
import { ArrowLeft, Building2, Mail, Phone, MapPin, Plus, DollarSign, Clock, Package, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const VendorProfile = () => {
    const { vendorId } = useParams<{ vendorId: string }>();
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data: vendor, isLoading: isLoadingVendor } = useQuery({
        queryKey: ['vendor', vendorId],
        queryFn: () => getVendor(vendorId!),
        enabled: !!vendorId,
    });

    const { data: vendorProducts, isLoading: isLoadingProducts } = useQuery({
        queryKey: ['vendorProducts', vendorId],
        queryFn: () => getVendorProducts(vendorId!),
        enabled: !!vendorId,
    });

    if (isLoadingVendor) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    if (!vendor) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <p className="text-xl font-semibold text-muted-foreground">Vendor not found.</p>
                <button onClick={() => navigate('/vendors')} className="text-primary hover:underline">
                    Back to Directory
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="space-y-6">
                <button
                    onClick={() => navigate('/vendors')}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft size={18} />
                    Back to Directory
                </button>

                <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/20 rounded-3xl p-8 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-indigo-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                    <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/25 shrink-0">
                            <Building2 size={40} />
                        </div>

                        <div className="flex-1 space-y-4">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">{vendor.VENDOR_NAME}</h1>
                                <p className="text-muted-foreground font-mono mt-1">{vendor.VENDOR_ID}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center shrink-0">
                                        <Building2 size={18} className="text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Contact</p>
                                        <p className="font-medium">{vendor.CONTACT_NAME}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center shrink-0">
                                        <Mail size={18} className="text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Email</p>
                                        <a href={`mailto:${vendor.EMAIL}`} className="font-medium hover:text-primary transition-colors">
                                            {vendor.EMAIL}
                                        </a>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center shrink-0">
                                        <Phone size={18} className="text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Phone</p>
                                        <p className="font-medium">{vendor.PHONE}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center shrink-0">
                                        <MapPin size={18} className="text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Address</p>
                                        <p className="font-medium truncate max-w-[200px]" title={vendor.ADDRESS}>{vendor.ADDRESS}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pricing Sheet */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Pricing Sheet</h2>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all text-sm"
                    >
                        <Plus size={18} />
                        Add Product
                    </button>
                </div>

                <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10 bg-white/50 dark:bg-slate-800/50">
                                    <th className="text-left py-4 px-6 font-semibold text-sm text-muted-foreground uppercase tracking-wider">Product</th>
                                    <th className="text-left py-4 px-6 font-semibold text-sm text-muted-foreground uppercase tracking-wider">SKU</th>
                                    <th className="text-left py-4 px-6 font-semibold text-sm text-muted-foreground uppercase tracking-wider">Price</th>
                                    <th className="text-left py-4 px-6 font-semibold text-sm text-muted-foreground uppercase tracking-wider">Lead Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {isLoadingProducts ? (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center">
                                            <div className="flex justify-center">
                                                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                            </div>
                                        </td>
                                    </tr>
                                ) : vendorProducts?.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-muted-foreground">
                                            No products associated with this vendor yet.
                                        </td>
                                    </tr>
                                ) : (
                                    vendorProducts?.map((vp) => (
                                        <tr key={vp.PRODUCT_ID} className="hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0">
                                                        <Package size={18} className="text-muted-foreground" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{vp.PRODUCT_NAME}</p>
                                                        <p className="text-xs text-muted-foreground font-mono">{vp.PRODUCT_ID}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 font-mono text-sm">{vp.SKU_NUMBER}</td>
                                            <td className="py-4 px-6 font-medium">${vp.PRICE.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / {vp.UNIT_OF_MEASURE}</td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Clock size={14} className="text-muted-foreground" />
                                                    <span>{vp.LEAD_TIME_DAYS} days</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <AddVendorProductModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                vendorId={vendorId!}
            />
        </div>
    );
};

const AddVendorProductModal = ({ isOpen, onClose, vendorId }: { isOpen: boolean; onClose: () => void; vendorId: string }) => {
    const [formData, setFormData] = useState({
        product_id: '',
        price: '',
        sku_number: '',
        lead_time_days: ''
    });

    const queryClient = useQueryClient();

    // Fetch all products for the dropdown
    const { data: products } = useQuery({
        queryKey: ['products'],
        queryFn: () => getProducts(true),
    });

    const mutation = useMutation({
        mutationFn: (data: any) => addVendorProduct(vendorId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendorProducts', vendorId] });
            onClose();
            setFormData({
                product_id: '',
                price: '',
                sku_number: '',
                lead_time_days: ''
            });
        },
    });

    const handleSubmit = () => {
        if (!formData.product_id || !formData.price) return;

        mutation.mutate({
            product_id: formData.product_id,
            price: parseFloat(formData.price),
            sku_number: formData.sku_number,
            lead_time_days: parseInt(formData.lead_time_days) || 0
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
                    className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-white/10"
                >
                    <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-blue-500/20 to-indigo-600/20" />

                    <div className="relative p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
                                    <DollarSign size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">Add Product Pricing</h2>
                                    <p className="text-muted-foreground text-sm font-medium">Link a product to this vendor.</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
                                <X size={20} className="text-muted-foreground" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Product</label>
                                <select
                                    value={formData.product_id}
                                    onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/30 focus:bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                                >
                                    <option value="">Select a product...</option>
                                    {products?.map(p => (
                                        <option key={p.PRODUCT_ID} value={p.PRODUCT_ID}>
                                            {p.PRODUCT_NAME} ({p.PRODUCT_ID})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Price</label>
                                    <div className="relative">
                                        <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-secondary/30 focus:bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Lead Time (Days)</label>
                                    <input
                                        type="number"
                                        value={formData.lead_time_days}
                                        onChange={(e) => setFormData({ ...formData, lead_time_days: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/30 focus:bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        placeholder="e.g., 7"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Vendor SKU</label>
                                <input
                                    type="text"
                                    value={formData.sku_number}
                                    onChange={(e) => setFormData({ ...formData, sku_number: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/30 focus:bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    placeholder="Optional SKU"
                                />
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end gap-3">
                            <button
                                onClick={onClose}
                                className="px-6 py-3 rounded-xl font-semibold hover:bg-secondary transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={mutation.isPending || !formData.product_id || !formData.price}
                                className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
                            >
                                {mutation.isPending ? 'Adding...' : 'Add Pricing'}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default VendorProfile;
