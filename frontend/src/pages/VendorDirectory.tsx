
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getVendors, addVendor, updateVendor, exportVendorsCSV, uploadVendorsCSV } from '../lib/api';
import { Search, Plus, Building2, Phone, Mail, MapPin, X, Download, Upload, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const VendorDirectory = () => {
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [vendorToEdit, setVendorToEdit] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();

    const { data: vendors, isLoading } = useQuery({
        queryKey: ['vendors'],
        queryFn: getVendors,
    });

    const uploadMutation = useMutation({
        mutationFn: uploadVendorsCSV,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendors'] });
            alert('Vendors uploaded successfully!');
        },
        onError: (e: any) => {
            alert('Upload failed: ' + e.message);
        }
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            uploadMutation.mutate(file);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const filteredVendors = vendors?.filter(v =>
        v.VENDOR_NAME.toLowerCase().includes(search.toLowerCase()) ||
        v.CONTACT_NAME.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Vendor Directory
                    </h1>
                    <p className="text-muted-foreground text-lg">Manage suppliers and contact information.</p>
                </div>

                <div className="flex flex-wrap gap-3 justify-end items-center">
                    <button
                        onClick={exportVendorsCSV}
                        className="flex items-center gap-2 px-6 py-3 bg-white/50 dark:bg-slate-800/50 text-foreground border border-border/50 rounded-2xl font-semibold shadow-sm hover:bg-white dark:hover:bg-slate-800 hover:shadow-md hover:-translate-y-0.5 transition-all"
                    >
                        <Download size={20} />
                        Download CSV
                    </button>
                    <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadMutation.isPending}
                        className="flex items-center gap-2 px-6 py-3 bg-white/50 dark:bg-slate-800/50 text-foreground border border-border/50 rounded-2xl font-semibold shadow-sm hover:bg-white dark:hover:bg-slate-800 hover:shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
                    >
                        <Upload size={20} />
                        {uploadMutation.isPending ? 'Uploading...' : 'Upload CSV'}
                    </button>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all"
                    >
                        <Plus size={20} />
                        Add Vendor
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/40 dark:bg-slate-900/40 backdrop-blur-md p-2 rounded-2xl border border-white/20 shadow-sm">
                <div className="relative w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="Search vendors..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-border/50 bg-white/50 dark:bg-slate-800/50 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    <div className="col-span-full flex justify-center py-12">
                        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                    </div>
                ) : filteredVendors?.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                        No vendors found.
                    </div>
                ) : (
                    filteredVendors?.map((vendor) => (
                        <Link to={`/vendors/${encodeURIComponent(vendor.VENDOR_ID)}`} key={vendor.VENDOR_ID}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="group relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/20 rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 h-full"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="relative z-10 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
                                                <Building2 size={24} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg leading-tight">{vendor.VENDOR_NAME}</h3>
                                                <p className="text-xs text-muted-foreground font-mono mt-1">{vendor.VENDOR_ID}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setVendorToEdit(vendor);
                                                setIsModalOpen(true);
                                            }}
                                            className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                                            title="Edit Vendor"
                                        >
                                            <Pencil size={18} />
                                        </button>
                                    </div>

                                    <div className="space-y-3 pt-2">
                                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                            <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0">
                                                <Building2 size={14} />
                                            </div>
                                            <span className="font-medium text-foreground">{vendor.CONTACT_NAME}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                            <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0">
                                                <Mail size={14} />
                                            </div>
                                            <span className="truncate">
                                                {vendor.EMAIL}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                            <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0">
                                                <Phone size={14} />
                                            </div>
                                            <span>{vendor.PHONE}</span>
                                        </div>
                                        <div className="flex items-start gap-3 text-sm text-muted-foreground">
                                            <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0 mt-0.5">
                                                <MapPin size={14} />
                                            </div>
                                            <span className="line-clamp-2">{vendor.ADDRESS}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </Link>
                    ))
                )}
            </div>

            <VendorModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setVendorToEdit(null);
                }}
                vendorToEdit={vendorToEdit}
            />
        </div>
    );
};

const VendorModal = ({ isOpen, onClose, vendorToEdit }: { isOpen: boolean; onClose: () => void; vendorToEdit?: any }) => {
    const [formData, setFormData] = useState({
        vendor_id: '',
        vendor_name: '',
        contact_name: '',
        email: '',
        phone: '',
        address: ''
    });

    useEffect(() => {
        if (vendorToEdit) {
            setFormData({
                vendor_id: vendorToEdit.VENDOR_ID || '',
                vendor_name: vendorToEdit.VENDOR_NAME || '',
                contact_name: vendorToEdit.CONTACT_NAME || '',
                email: vendorToEdit.EMAIL || '',
                phone: vendorToEdit.PHONE || '',
                address: vendorToEdit.ADDRESS || ''
            });
        } else {
            setFormData({
                vendor_id: '',
                vendor_name: '',
                contact_name: '',
                email: '',
                phone: '',
                address: ''
            });
        }
    }, [vendorToEdit, isOpen]);

    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (data: any) => vendorToEdit ? updateVendor(vendorToEdit.VENDOR_ID, data) : addVendor(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendors'] });
            onClose();
            setFormData({
                vendor_id: '',
                vendor_name: '',
                contact_name: '',
                email: '',
                phone: '',
                address: ''
            });
            alert(`Vendor ${vendorToEdit ? 'updated' : 'added'} successfully!`);
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
                    <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-blue-500/20 to-indigo-600/20" />

                    <div className="relative p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
                                    <Building2 size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">{vendorToEdit ? 'Edit Vendor' : 'Add New Vendor'}</h2>
                                    <p className="text-muted-foreground font-medium">Enter vendor details below.</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
                                <X size={24} className="text-muted-foreground" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Vendor ID</label>
                                <input
                                    type="text"
                                    value={formData.vendor_id}
                                    onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/30 focus:bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    placeholder="e.g., V-001"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Vendor Name</label>
                                <input
                                    type="text"
                                    value={formData.vendor_name}
                                    onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/30 focus:bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    placeholder="e.g., Acme Corp"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Contact Name</label>
                                <input
                                    type="text"
                                    value={formData.contact_name}
                                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/30 focus:bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    placeholder="e.g., John Doe"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/30 focus:bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    placeholder="john@example.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Phone</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/30 focus:bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    placeholder="(555) 123-4567"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Address</label>
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/30 focus:bg-background focus:ring-2 focus:ring-primary/20 outline-none h-24 resize-none transition-all"
                                    placeholder="123 Business St, City, State"
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
                                {mutation.isPending ? 'Saving...' : vendorToEdit ? 'Save Changes' : 'Add Vendor'}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default VendorDirectory;
