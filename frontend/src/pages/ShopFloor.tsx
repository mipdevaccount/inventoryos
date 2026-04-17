import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProducts, submitRequest, updateStock, type Product } from '../lib/api';
import { Search, MapPin, Ruler } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const ShopFloor = () => {
    const [search, setSearch] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'request' | 'inventory'>('request');

    const { data: products, isLoading } = useQuery({
        queryKey: ['products'],
        queryFn: () => getProducts(true),
    });

    // Handle Scan-to-Request (QR Code)
    useEffect(() => {
        if (products && products.length > 0) {
            const params = new URLSearchParams(window.location.search);
            const requestProductId = params.get('request_product');

            if (requestProductId) {
                const product = products.find(p => p.PRODUCT_ID === requestProductId);
                if (product) {
                    setSelectedProduct(product);
                    setIsModalOpen(true);

                    // Clean up URL without refreshing
                    const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
                    window.history.pushState({ path: newUrl }, '', newUrl);
                }
            }
        }
    }, [products]);

    const filteredProducts = products?.filter(p =>
        p.PRODUCT_NAME.toLowerCase().includes(search.toLowerCase()) ||
        p.PRODUCT_ID.toLowerCase().includes(search.toLowerCase())
    );

    const handleProductClick = (product: Product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Shop Floor
                    </h1>
                    <p className="text-muted-foreground text-lg">Select a product to request inventory or view current levels.</p>
                </div>

                <div className="relative w-full md:w-96 group">
                    <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-border/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all text-lg"
                        />
                    </div>
                </div>
            </div>

            <div className="flex bg-secondary/50 p-1 rounded-xl w-fit border border-white/20 backdrop-blur-md">
                <button 
                    onClick={() => setActiveTab('request')}
                    className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${activeTab === 'request' ? 'bg-white dark:bg-slate-800 text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-white/5'}`}
                >
                    Request Inventory
                </button>
                <button 
                    onClick={() => setActiveTab('inventory')}
                    className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${activeTab === 'inventory' ? 'bg-white dark:bg-slate-800 text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-white/5'}`}
                >
                    Current Levels
                </button>
            </div>

            {isLoading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-48 rounded-3xl bg-muted/50 animate-pulse" />
                    ))}
                </div>
            ) : activeTab === 'request' ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredProducts?.map((product, index) => (
                        <motion.div
                            key={product.PRODUCT_ID}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            layoutId={`product-${product.PRODUCT_ID}`}
                            onClick={() => handleProductClick(product)}
                            className="group relative overflow-hidden rounded-3xl border border-white/20 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-6 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-primary/25 group-hover:scale-110 transition-transform duration-300">
                                        {product.PRODUCT_NAME.charAt(0)}
                                    </div>
                                    <span className="text-xs font-mono font-medium text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full border border-border/50">
                                        {product.PRODUCT_ID}
                                    </span>
                                </div>

                                <h3 className="font-bold text-xl mb-2 group-hover:text-primary transition-colors line-clamp-1">
                                    {product.PRODUCT_NAME}
                                </h3>
                                <p className="text-sm text-muted-foreground mb-6 line-clamp-2 h-10 leading-relaxed">
                                    {product.DESCRIPTION || 'No description available'}
                                </p>

                                <div className="flex items-center gap-4 text-sm text-muted-foreground pt-4 border-t border-border/50">
                                    <div className="flex items-center gap-1.5">
                                        <MapPin size={14} className="text-primary" />
                                        <span className="font-medium">{product.LOCATION || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Ruler size={14} className="text-primary" />
                                        <span className="font-medium">{product.UNIT_OF_MEASURE}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/20 rounded-3xl shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white/50 dark:bg-slate-800/50 border-b border-border">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Product</th>
                                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Location</th>
                                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">Stock Level</th>
                                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {filteredProducts?.map(product => {
                                    const stock = product.CURRENT_STOCK || 0;
                                    let colorClass = 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 border-green-200 dark:border-green-500/30';
                                    let statusText = 'Healthy';
                                    
                                    if (stock < 5) {
                                        colorClass = 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-200 dark:border-red-500/30';
                                        statusText = 'Critical';
                                    } else if (stock <= 10) {
                                        colorClass = 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/30';
                                        statusText = 'Warning';
                                    }

                                    return (
                                        <tr key={product.PRODUCT_ID} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-foreground text-base max-w-sm truncate" title={product.PRODUCT_NAME}>{product.PRODUCT_NAME}</div>
                                                <div className="text-xs text-muted-foreground font-mono mt-1">{product.PRODUCT_ID}</div>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-muted-foreground">
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={14} className="text-primary" />
                                                    {product.LOCATION || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="font-bold text-xl">{stock}</span> <span className="text-sm text-muted-foreground font-medium">{product.UNIT_OF_MEASURE}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border ${colorClass} shadow-sm inline-block min-w-[100px] text-center`}>
                                                    {statusText}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredProducts?.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                                            No products found matching your search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <RequestModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                product={selectedProduct}
            />
        </div>
    );
};

const RequestModal = ({ isOpen, onClose, product }: { isOpen: boolean; onClose: () => void; product: Product | null }) => {
    const { user } = useAuth();
    const [quantity, setQuantity] = useState(1);
    const [urgency, setUrgency] = useState('medium');
    const [notes, setNotes] = useState('');
    const [name, setName] = useState('');
    const [requestedUnit, setRequestedUnit] = useState(product?.UNIT_OF_MEASURE || 'Each');
    const queryClient = useQueryClient();

    useEffect(() => {
        if (isOpen && user) {
            setName(user.full_name || user.email || '');
            setQuantity(1);
            setUrgency('medium');
            setNotes('');
            setRequestedUnit(product?.UNIT_OF_MEASURE || 'Each');
            
            // Lock body scroll and prevent background tapping on mobile
            document.body.style.overflow = 'hidden';
            document.body.style.touchAction = 'none';
        }
        
        return () => {
            document.body.style.overflow = 'unset';
            document.body.style.touchAction = 'unset';
        };
    }, [isOpen, user, product]);

    const mutation = useMutation({
        mutationFn: submitRequest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['requests'] });
            onClose();
            setQuantity(1);
            setUrgency('medium');
            setNotes('');
            // Show success toast (could be implemented globally)
            alert('Request submitted successfully!');
        },
    });

    const stockMutation = useMutation({
        mutationFn: ({ productId, stock }: { productId: string, stock: number }) => updateStock(productId, stock),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        }
    });

    const handleStockUpdate = () => {
        const input = window.prompt(`Correct the actual inventory level for ${product?.PRODUCT_NAME}:`, (product?.CURRENT_STOCK || 0).toString());
        if (input !== null) {
            const newStock = parseInt(input);
            if (!isNaN(newStock) && newStock >= 0) {
                stockMutation.mutate({ productId: product!.PRODUCT_ID, stock: newStock });
            } else {
                alert("Please enter a valid stock number.");
            }
        }
    };

    if (!isOpen || !product) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[999] flex items-center justify-center p-4" style={{ WebkitOverflowScrolling: 'touch' }}>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-md cursor-pointer"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-white/10"
                >
                    <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-primary/20 to-indigo-600/20" />

                    <div className="relative p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white font-bold text-3xl shadow-lg shadow-primary/25 shrink-0">
                                    {product.PRODUCT_NAME.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-xl md:text-2xl font-bold line-clamp-1">Request Inventory</h2>
                                    <p className="text-muted-foreground font-medium line-clamp-1">
                                        {product.PRODUCT_NAME}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right flex-shrink-0 ml-4 hidden sm:block">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">On Hand</p>
                                <button 
                                    type="button"
                                    onClick={handleStockUpdate}
                                    disabled={stockMutation.isPending}
                                    title="Click to correct actual stock level"
                                    className={`inline-flex items-center justify-center px-4 py-1.5 rounded-full font-bold text-sm border shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50 disabled:hover:scale-100
                                        ${(product.CURRENT_STOCK || 0) < 5 ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' : 
                                          (product.CURRENT_STOCK || 0) <= 10 ? 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20' : 
                                          'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20'}`}>
                                    {stockMutation.isPending ? '...' : (product.CURRENT_STOCK || 0)}
                                </button>
                                <p className="text-[8px] mt-1 text-muted-foreground max-w-[80px] leading-tight ml-auto cursor-pointer" onClick={handleStockUpdate}>
                                    Click to correct stock level
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Your Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter your name"
                                    className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/30 focus:bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex justify-between">
                                        Quantity
                                        {product.UNIT_OF_MEASURE && <span className="text-xs normal-case opacity-60 ml-2">(Standard: {product.UNIT_OF_MEASURE})</span>}
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            min="1"
                                            value={quantity}
                                            onChange={(e) => setQuantity(parseInt(e.target.value))}
                                            className="w-1/2 px-4 py-3 rounded-xl border border-border bg-secondary/30 focus:bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        />
                                        <select
                                            value={requestedUnit}
                                            onChange={(e) => setRequestedUnit(e.target.value)}
                                            className="w-1/2 px-4 py-3 rounded-xl border border-border bg-secondary/30 focus:bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                                        >
                                            {Array.from(new Set([
                                                product.UNIT_OF_MEASURE || 'Each',
                                                'Each', 'Box', 'Case', 'Pack', 'Pallet', 'Bottle', 'Gallon', 'Roll', 'Pair', 'Set'
                                            ])).map(u => (
                                                <option key={u} value={u}>{u}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Urgency</label>
                                    <select
                                        value={urgency}
                                        onChange={(e) => setUrgency(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/30 focus:bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                                    >
                                        <option value="low">Low - 1 - 2 weeks</option>
                                        <option value="medium">Medium - 1 week</option>
                                        <option value="high">High - 1-2 days</option>
                                        <option value="urgent">Urgent - immediate</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Notes (Optional)</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Any additional details..."
                                    className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/30 focus:bg-background focus:ring-2 focus:ring-primary/20 outline-none h-24 resize-none transition-all"
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
                                onClick={() => {
                                    if (!name) {
                                        alert('Please enter your name');
                                        return;
                                    }
                                    mutation.mutate({
                                        product_id: product.PRODUCT_ID,
                                        requested_by: name,
                                        quantity_needed: quantity,
                                        urgency,
                                        notes: `[Requested Unit: ${requestedUnit}] ${notes}`.trim()
                                    });
                                }}
                                disabled={mutation.isPending}
                                className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
                            >
                                {mutation.isPending ? 'Submitting...' : 'Submit Request'}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ShopFloor;
