
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProducts, addProduct } from '../lib/api';
import { Search, Plus, Package, MapPin, Ruler, X, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'react-qr-code';

const ProductCatalog = () => {
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [qrProduct, setQrProduct] = useState<{ id: string; name: string } | null>(null);

    const { data: products, isLoading } = useQuery({
        queryKey: ['products'],
        queryFn: () => getProducts(true),
    });

    const filteredProducts = products?.filter(p =>
        p.PRODUCT_NAME.toLowerCase().includes(search.toLowerCase()) ||
        p.PRODUCT_ID.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Product Catalog
                    </h1>
                    <p className="text-muted-foreground text-lg">Manage inventory items and details.</p>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all"
                >
                    <Plus size={20} />
                    Add Product
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/40 dark:bg-slate-900/40 backdrop-blur-md p-2 rounded-2xl border border-white/20 shadow-sm">
                <div className="relative w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-border/50 bg-white/50 dark:bg-slate-800/50 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                </div>
            </div>

            <div className="rounded-3xl border border-white/20 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/30 text-muted-foreground font-semibold uppercase tracking-wider text-xs">
                            <tr>
                                <th className="px-8 py-6">Product Name</th>
                                <th className="px-6 py-6">ID</th>
                                <th className="px-6 py-6">Description</th>
                                <th className="px-6 py-6">Location</th>
                                <th className="px-6 py-6">Unit</th>
                                <th className="px-6 py-6">Status</th>
                                <th className="px-6 py-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                                            <p>Loading catalog...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredProducts?.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                                        No products found.
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts?.map((product) => (
                                    <tr key={product.PRODUCT_ID} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold shadow-sm">
                                                    {product.PRODUCT_NAME.charAt(0)}
                                                </div>
                                                <span className="font-semibold text-base">{product.PRODUCT_NAME}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="font-mono text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded border border-border/50">
                                                {product.PRODUCT_ID}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-muted-foreground max-w-xs truncate">
                                            {product.DESCRIPTION || '-'}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <MapPin size={14} />
                                                <span>{product.LOCATION || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <Ruler size={14} />
                                                <span>{product.UNIT_OF_MEASURE}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${product.IS_ACTIVE
                                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-900/50'
                                                : 'bg-slate-500/10 text-slate-600 border-slate-200 dark:border-slate-800/50'
                                                }`}>
                                                {product.IS_ACTIVE ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <button
                                                onClick={() => setQrProduct({ id: product.PRODUCT_ID, name: product.PRODUCT_NAME })}
                                                className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                                                title="Generate QR Code"
                                            >
                                                <QrCode size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AddProductModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />

            <QRCodeModal
                product={qrProduct}
                onClose={() => setQrProduct(null)}
            />
        </div>
    );
};

const QRCodeModal = ({ product, onClose }: { product: { id: string; name: string } | null; onClose: () => void }) => {
    if (!product) return null;

    // URL to scan - points to the main shop floor with a query param
    const scanUrl = `${window.location.origin}/?request_product=${product.id}`;

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
                    className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-white/10"
                >
                    <div className="p-8 flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg mb-6">
                            <QrCode size={32} />
                        </div>

                        <h2 className="text-2xl font-bold mb-2">{product.name}</h2>
                        <p className="text-muted-foreground text-sm mb-8">Scan to request this item</p>

                        <div className="p-4 bg-white rounded-xl shadow-inner border border-slate-100">
                            <QRCode
                                value={scanUrl}
                                size={200}
                                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                viewBox={`0 0 256 256`}
                            />
                        </div>

                        <p className="mt-6 text-xs text-muted-foreground font-mono bg-secondary/50 px-3 py-1 rounded-full">
                            ID: {product.id}
                        </p>

                        <button
                            onClick={onClose}
                            className="mt-8 w-full py-3 rounded-xl font-semibold hover:bg-secondary transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

const AddProductModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const [formData, setFormData] = useState({
        product_id: '',
        product_name: '',
        description: '',
        unit_of_measure: 'EA',
        location: '',
        is_active: true
    });

    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: addProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            onClose();
            setFormData({
                product_id: '',
                product_name: '',
                description: '',
                unit_of_measure: 'EA',
                location: '',
                is_active: true
            });
            alert('Product added successfully!');
        },
    });

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
                    className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-white/10"
                >
                    <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-primary/20 to-indigo-600/20" />

                    <div className="relative p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-primary/25">
                                    <Package size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">Add New Product</h2>
                                    <p className="text-muted-foreground font-medium">Enter product details below.</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
                                <X size={24} className="text-muted-foreground" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Product ID</label>
                                <input
                                    type="text"
                                    value={formData.product_id}
                                    onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/30 focus:bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    placeholder="e.g., P-1001"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Product Name</label>
                                <input
                                    type="text"
                                    value={formData.product_name}
                                    onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/30 focus:bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    placeholder="e.g., Safety Gloves"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/30 focus:bg-background focus:ring-2 focus:ring-primary/20 outline-none h-24 resize-none transition-all"
                                    placeholder="Product description..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Unit of Measure</label>
                                <select
                                    value={formData.unit_of_measure}
                                    onChange={(e) => setFormData({ ...formData, unit_of_measure: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/30 focus:bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                                >
                                    <option value="EA">Each (EA)</option>
                                    <option value="BOX">Box</option>
                                    <option value="PKG">Package</option>
                                    <option value="ROLL">Roll</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Location</label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/30 focus:bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    placeholder="e.g., A-12-3"
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
                                onClick={() => mutation.mutate(formData)}
                                disabled={mutation.isPending}
                                className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
                            >
                                {mutation.isPending ? 'Adding...' : 'Add Product'}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ProductCatalog;

