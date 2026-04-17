import { supabase } from './supabase';

// === AUTHENTICATION ===
export const login = async (data: any) => {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
    });
    if (error) throw error;
    // Mock user response structure for the app
    return { token: authData.session?.access_token, user: authData.user };
};

export const register = async (data: any) => {
    const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: { data: { name: data.name } }
    });
    if (error) throw error;
    return authData.user;
};

export const getMe = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) throw new Error("Not logged in");
    return session.user;
};

export const logout = async () => {
    await supabase.auth.signOut();
};

export const getUsers = async () => {
    const { data, error } = await supabase.from('profiles').select('*').order('full_name');
    if (error) throw error;
    return data.map((u: any) => ({
        user_id: u.id,
        email: u.email,
        full_name: u.full_name,
        role: u.role,
        is_active: u.is_active
    }));
};

export const getProfile = async (userId: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) throw error;
    return data;
};

export const deleteUser = async (userId: string) => {
    // Instead of deleting from auth.users, we disable the profile
    const { error } = await supabase.from('profiles').update({ is_active: false, role: 'disabled' }).eq('id', userId);
    if (error) throw error;
    return { success: true };
};

export const updateUserRole = async (userId: string, role: string) => {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
    if (error) throw error;
    return { success: true };
};

// === INTERFACES ===
export interface Product {
    PRODUCT_ID: string;
    PRODUCT_NAME: string;
    DESCRIPTION: string;
    LOCATION: string;
    UNIT_OF_MEASURE: string;
    IS_ACTIVE: boolean;
}

export interface Request {
    REQUEST_ID: number;
    PRODUCT_ID: string;
    PRODUCT_NAME?: string;
    LOCATION?: string;
    REQUESTED_BY: string;
    QUANTITY_NEEDED: number;
    UNIT_OF_MEASURE?: string;
    URGENCY: 'low' | 'medium' | 'high';
    STATUS: 'pending' | 'ordered' | 'received' | 'cancelled';
    SUBMITTED_AT: string;
    UPDATED_AT: string;
    UPDATED_BY: string;
    NOTES: string;
}

// === PRODUCTS ===
export const getProducts = async (activeOnly = true) => {
    let query = supabase.from('products').select('*');
    if (activeOnly) {
        query = query.eq('is_active', true);
    }
    const { data, error } = await query;
    if (error) throw error;
    // Map to uppercase keys to match existing components
    return data.map(p => ({
        PRODUCT_ID: p.product_id,
        PRODUCT_NAME: p.product_name,
        DESCRIPTION: p.description,
        LOCATION: p.location,
        UNIT_OF_MEASURE: p.unit_of_measure,
        IS_ACTIVE: p.is_active
    }));
};

export const addProduct = async (data: any) => {
    const { error } = await supabase.from('products').insert([{
        product_id: data.product_id,
        product_name: data.product_name,
        description: data.description,
        location: data.location,
        unit_of_measure: data.unit_of_measure
    }]);
    if (error) throw error;
    return { success: true };
};

export const updateProduct = async (productId: string, data: any) => {
    const { error } = await supabase.from('products')
        .update({
            product_name: data.product_name,
            description: data.description,
            location: data.location,
            unit_of_measure: data.unit_of_measure
        })
        .eq('product_id', productId);
    if (error) throw error;
    return { success: true };
};

export const deleteProduct = async (productId: string) => {
    const { error } = await supabase.from('products').delete().eq('product_id', productId);
    if (error) throw error;
    return { success: true };
};

// === REQUESTS ===
export const getRequests = async (status?: string) => {
    let query = supabase.from('requests').select('*, products(product_name, location, unit_of_measure)').order('submitted_at', { ascending: false });
    if (status) {
        query = query.eq('status', status);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data.map((r: any) => ({
        REQUEST_ID: r.request_id,
        PRODUCT_ID: r.product_id,
        PRODUCT_NAME: r.products?.product_name || '',
        LOCATION: r.products?.location || '',
        REQUESTED_BY: r.requested_by,
        QUANTITY_NEEDED: r.quantity_needed,
        UNIT_OF_MEASURE: r.products?.unit_of_measure || 'each',
        URGENCY: r.urgency,
        STATUS: r.status,
        NOTES: r.notes || '',
        SUBMITTED_AT: r.submitted_at,
        UPDATED_AT: r.updated_at,
        UPDATED_BY: r.updated_by
    }));
};

export const submitRequest = async (data: any) => {
    const { error } = await supabase.from('requests').insert([{
        product_id: data.product_id,
        requested_by: data.requested_by,
        quantity_needed: data.quantity_needed,
        urgency: data.urgency,
        notes: data.notes
    }]);
    if (error) throw error;
    return { success: true };
};

export const updateRequestStatus = async (data: any) => {
    const { error } = await supabase.from('requests')
        .update({ status: data.status, updated_by: data.updated_by, updated_at: new Date() })
        .eq('request_id', data.request_id);
    if (error) throw error;
    return { success: true };
};

export const getCounts = async () => {
    const { data, error } = await supabase.from('requests').select('status');
    if (error) throw error;
    const counts = { pending: 0, ordered: 0, received: 0, cancelled: 0 } as any;
    data.forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1; });
    return counts;
};

// === VENDORS ===
export interface Vendor {
    VENDOR_ID: string;
    VENDOR_NAME: string;
    CONTACT_NAME: string;
    EMAIL: string;
    PHONE: string;
    ADDRESS: string;
}

export const getVendors = async () => {
    const { data, error } = await supabase.from('vendors').select('*');
    if (error) throw error;
    return data.map(v => ({
        VENDOR_ID: v.vendor_id,
        VENDOR_NAME: v.vendor_name,
        CONTACT_NAME: v.contact_name,
        EMAIL: v.email,
        PHONE: v.phone,
        ADDRESS: v.address
    }));
};

export const getVendor = async (vendorId: string) => {
    const { data, error } = await supabase.from('vendors').select('*').eq('vendor_id', vendorId).single();
    if (error) throw error;
    return {
        VENDOR_ID: data.vendor_id,
        VENDOR_NAME: data.vendor_name,
        CONTACT_NAME: data.contact_name,
        EMAIL: data.email,
        PHONE: data.phone,
        ADDRESS: data.address
    };
};

export const addVendor = async (data: any) => {
    const { error } = await supabase.from('vendors').insert([{
        vendor_id: data.vendor_id,
        vendor_name: data.vendor_name,
        contact_name: data.contact_name,
        email: data.email,
        phone: data.phone,
        address: data.address
    }]);
    if (error) throw error;
    return { success: true };
};

export const updateVendor = async (vendorId: string, data: any) => {
    const { error } = await supabase.from('vendors')
        .update({
            vendor_name: data.vendor_name,
            contact_name: data.contact_name,
            email: data.email,
            phone: data.phone,
            address: data.address
        })
        .eq('vendor_id', vendorId);
    if (error) throw error;
    return { success: true };
};

export const getVendorProducts = async (vendorId: string) => {
    const { data, error } = await supabase.from('vendor_products').select('*, products(product_name, unit_of_measure)').eq('vendor_id', vendorId);
    if (error) throw error;
    return data.map((vp: any) => ({
        VENDOR_ID: vp.vendor_id,
        PRODUCT_ID: vp.product_id,
        PRICE: vp.price,
        SKU_NUMBER: vp.sku_number,
        LEAD_TIME_DAYS: vp.lead_time_days,
        PRODUCT_NAME: vp.products?.product_name || '',
        UNIT_OF_MEASURE: vp.products?.unit_of_measure || ''
    }));
};

export const getAllVendorProducts = async () => {
    const { data, error } = await supabase.from('vendor_products').select('*, products(product_name, unit_of_measure), vendors(vendor_name)');
    if (error) throw error;
    return data.map((vp: any) => ({
        VENDOR_ID: vp.vendor_id,
        PRODUCT_ID: vp.product_id,
        PRICE: vp.price,
        SKU_NUMBER: vp.sku_number,
        LEAD_TIME_DAYS: vp.lead_time_days,
        PRODUCT_NAME: vp.products?.product_name || '',
        VENDOR_NAME: vp.vendors?.vendor_name || '',
        UNIT_OF_MEASURE: vp.products?.unit_of_measure || ''
    }));
};

export const addVendorProduct = async (vendorId: string, data: any) => {
    const { error } = await supabase.from('vendor_products').insert([{
        vendor_id: vendorId,
        product_id: data.product_id,
        price: data.price,
        sku_number: data.sku_number,
        lead_time_days: data.lead_time_days
    }]);
    if (error) throw error;
    return { success: true };
};

// === PURCHASE ORDERS ===
export const getPurchaseOrders = async () => {
    const { data, error } = await supabase.from('purchase_orders').select('*, vendors(vendor_name)').order('created_at', { ascending: false });
    if (error) throw error;
    return data.map((po: any) => ({
        PO_NUMBER: po.po_number,
        VENDOR_ID: po.vendor_id,
        VENDOR_NAME: po.vendors?.vendor_name || '',
        STATUS: po.status,
        TOTAL_AMOUNT: po.total_amount,
        CREATED_AT: po.created_at
    }));
};

export const createPurchaseOrder = async (data: { vendor_id: string; items: any[] }) => {
    // Generate simple PO number for client side creation
    const poNumber = `CI${Date.now().toString().slice(-8)}`;
    const totalAmount = data.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    
    // Insert PO First
    const { error: poError } = await supabase.from('purchase_orders').insert([{
        po_number: poNumber,
        vendor_id: data.vendor_id,
        status: 'Draft',
        total_amount: totalAmount
    }]);
    if (poError) throw poError;

    // Insert Items
    const itemsData = data.items.map(item => ({
        po_number: poNumber,
        product_id: item.product_id,
        quantity_ordered: item.quantity,
        unit_price: item.unit_price
    }));
    const { error: itemsError } = await supabase.from('po_items').insert(itemsData);
    if (itemsError) throw itemsError;

    return { po_number: poNumber, success: true };
};

export const getPurchaseOrder = async (poNumber: string) => {
    const { data: po, error } = await supabase.from('purchase_orders').select('*, vendors(vendor_name)').eq('po_number', poNumber).single();
    if (error) throw error;
    
    const { data: items, error: itemsError } = await supabase.from('po_items').select('*, products(product_name, unit_of_measure)').eq('po_number', poNumber);
    if (itemsError) throw itemsError;

    return {
        PO_NUMBER: po.po_number,
        VENDOR_ID: po.vendor_id,
        VENDOR_NAME: po.vendors?.vendor_name || '',
        STATUS: po.status,
        TOTAL_AMOUNT: po.total_amount,
        CREATED_AT: po.created_at,
        items: items.map((i: any) => ({
            PRODUCT_ID: i.product_id,
            PRODUCT_NAME: i.products?.product_name || '',
            UNIT_OF_MEASURE: i.products?.unit_of_measure || '',
            QUANTITY_ORDERED: i.quantity_ordered,
            QUANTITY_RECEIVED: 0,
            UNIT_PRICE: i.unit_price
        }))
    };
};

export const updatePOStatus = async (poNumber: string, status: string) => {
    const { error } = await supabase.from('purchase_orders').update({ status, updated_at: new Date() }).eq('po_number', poNumber);
    if (error) throw error;
    return { success: true };
};

export const updatePurchaseOrder = async (poNumber: string, data: any) => {
    return { success: true }; // Stub for any generic update
};

// === RULES & MOCKS ===
export interface OrderingRule {
    RULE_ID: string;
    VENDOR_ID: string;
    PRODUCT_ID: string;
    MIN_QTY: number;
    DISCOUNT_PCT: number;
    NOTES: string;
    VENDOR_NAME?: string;
    PRODUCT_NAME?: string;
}

export const getRules = async () => {
    const { data, error } = await supabase.from('vendor_product_rules').select('*');
    if (error) throw error;
    return data.map((r: any) => ({
        RULE_ID: r.rule_id,
        VENDOR_ID: r.vendor_id,
        PRODUCT_ID: r.product_id,
        MIN_QTY: r.min_qty,
        DISCOUNT_PCT: r.discount_pct,
        NOTES: r.notes
    })) as OrderingRule[];
};

export const createRule = async (data: any) => {
    const { error } = await supabase.from('vendor_product_rules').insert([{
        rule_id: data.rule_id,
        vendor_id: data.vendor_id,
        product_id: data.product_id,
        min_qty: data.min_qty,
        discount_pct: data.discount_pct,
        notes: data.notes
    }]);
    if (error) throw error;
    return { success: true };
};

export const updateRule = async (ruleId: string, data: any) => {
    const { error } = await supabase.from('vendor_product_rules')
        .update({
            min_qty: data.min_qty,
            discount_pct: data.discount_pct,
            notes: data.notes
        })
        .eq('rule_id', ruleId);
    if (error) throw error;
    return { success: true };
};

export const getOptimizationInsights = async (vendorId?: any, productId?: any) => {
    return { rule: null, history: { last_order_date: null, last_order_qty: 0, qty_past_90_days: 0 } };
};

// MOCK DATA FOR V3 ML PREDICTIONS
export const getReorderRecommendations = async () => {
    return [
        {
            product_id: "PROD001",
            product_name: "Aluminum Sheet 4x8 3mm",
            current_stock: 12,
            recommended_quantity: 45,
            confidence_score: 0.85,
            reason: "High priority jobs scheduled. Historical consumption trending at 8.2 units/day.",
            recommended_vendor: "Hayward's Hardware",
            recommended_vendor_id: "VND-002",
            unit_price: 125.50,
            days_until_stockout: 9
        }
    ];
};

export const createPOFromRecommendation = async (data: any) => {
    return { success: true, po_number: "CI00000099" };
};

export const getPORiskAssessment = async (poNumber: string) => {
    return {
        po_number: poNumber,
        delay_probability: 0.25,
        risk_level: 'low',
        confidence: 'high',
        arrival_range: { earliest: 'Tomorrow', expected: 'In 3 days', latest: 'In 5 days', confidence: '80%' },
        impact: { impact_score: 15, affected_jobs_count: 0, high_priority_count: 0, total_margin_at_risk: 0, severity: 'Low' }
    };
};

export const getAtRiskPOs = async () => {
    return [];
};

export const requestQuote = async (data: any) => { return { success: true }; };
export const exportProductsCSV = async () => {};
export const uploadProductsCSV = async (file?: any) => {};
export const exportVendorsCSV = async () => {};
export const uploadVendorsCSV = async (file?: any) => {};
