import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export const api = axios.create({
    baseURL: API_URL,
});

export const setAuthToken = (token: string | null) => {
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        localStorage.setItem('commander_token', token);
    } else {
        delete api.defaults.headers.common['Authorization'];
        localStorage.removeItem('commander_token');
    }
};

const savedToken = localStorage.getItem('commander_token');
if (savedToken) {
    setAuthToken(savedToken);
}

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            setAuthToken(null);
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// === AUTHENTICATION ===
export const login = async (data: any) => {
    const formData = new URLSearchParams();
    formData.append('username', data.email);
    formData.append('password', data.password);
    
    const response = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    return response.data;
};

export const register = async (data: any) => {
    const response = await api.post('/auth/register', data);
    return response.data;
};

export const getMe = async () => {
    const response = await api.get('/auth/me');
    return response.data;
};

export const logout = async () => {
    try { await api.post('/auth/logout'); } catch (e) {}
    setAuthToken(null);
};

export const getUsers = async () => {
    const response = await api.get('/auth/users');
    return response.data;
};

export const deleteUser = async (userId: number) => {
    const response = await api.delete(`/auth/users/${userId}`);
    return response.data;
};


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
    PRODUCT_NAME: string;
    LOCATION: string;
    REQUESTED_BY: string;
    QUANTITY_NEEDED: number;
    UNIT_OF_MEASURE: string;
    URGENCY: 'low' | 'medium' | 'high';
    STATUS: 'pending' | 'ordered' | 'received' | 'cancelled';
    SUBMITTED_AT: string;
    UPDATED_AT: string;
    UPDATED_BY: string;
    NOTES: string;
}

export const getProducts = async (activeOnly = true) => {
    const response = await api.get<Product[]>('/products', {
        params: { active_only: activeOnly },
    });
    return response.data;
};

export const getRequests = async (status?: string) => {
    const response = await api.get<Request[]>('/requests', {
        params: { status },
    });
    return response.data;
};

export const submitRequest = async (data: {
    product_id: string;
    requested_by: string;
    quantity_needed: number;
    urgency: string;
    notes?: string;
}) => {
    const response = await api.post('/submit', data);
    return response.data;
};

export const updateRequestStatus = async (data: {
    request_id: number;
    status: string;
    updated_by: string;
}) => {
    const response = await api.post('/update_status', data);
    return response.data;
};

export const addProduct = async (data: {
    product_id: string;
    product_name: string;
    description?: string;
    location?: string;
    unit_of_measure: string;
}) => {
    const response = await api.post('/products', data);
    return response.data;
};

export const getCounts = async () => {
    const response = await api.get<Record<string, number>>('/counts');
    return response.data;
};

export interface Vendor {
    VENDOR_ID: string;
    VENDOR_NAME: string;
    CONTACT_NAME: string;
    EMAIL: string;
    PHONE: string;
    ADDRESS: string;
    RATING: number;
    CREATED_AT: string;
}

export interface VendorProduct {
    VENDOR_ID: string;
    PRODUCT_ID: string;
    PRODUCT_NAME: string;
    UNIT_OF_MEASURE: string;
    PRICE: number;
    SKU_NUMBER: string;
    LEAD_TIME_DAYS: number;
}

export interface PurchaseOrder {
    PO_NUMBER: string;
    VENDOR_ID: string;
    VENDOR_NAME: string;
    STATUS: 'Draft' | 'Ordered' | 'Partial' | 'Received' | 'Closed';
    TOTAL_AMOUNT: number;
    CREATED_AT: string;
    UPDATED_AT: string;
    items?: POItem[];
}

export interface POItem {
    PO_NUMBER: string;
    PRODUCT_ID: string;
    PRODUCT_NAME: string;
    UNIT_OF_MEASURE: string;
    QUANTITY_ORDERED: number;
    QUANTITY_RECEIVED: number;
    UNIT_PRICE: number;
}

export const getVendors = async () => {
    const response = await api.get<Vendor[]>('/vendors');
    return response.data;
};

export const getVendor = async (vendorId: string) => {
    const response = await api.get<Vendor>(`/vendors/${vendorId}`);
    return response.data;
};

export const addVendor = async (data: {
    vendor_id: string;
    vendor_name: string;
    contact_name: string;
    email: string;
    phone: string;
    address: string;
}) => {
    const response = await api.post('/vendors', data);
    return response.data;
};

export const getVendorProducts = async (vendorId: string) => {
    const response = await api.get<VendorProduct[]>(`/vendors/${vendorId}/products`);
    return response.data;
};

export const addVendorProduct = async (vendorId: string, data: {
    product_id: string;
    price: number;
    sku_number: string;
    lead_time_days: number;
}) => {
    const response = await api.post(`/vendors/${vendorId}/products`, data);
    return response.data;
};

export const getPurchaseOrders = async () => {
    const response = await api.get<PurchaseOrder[]>('/purchase_orders');
    return response.data;
};

export const createPurchaseOrder = async (data: {
    vendor_id: string;
    items: { product_id: string; quantity: number; unit_price: number }[];
}) => {
    const response = await api.post('/purchase_orders', data);
    return response.data;
};

export const getPurchaseOrder = async (poNumber: string) => {
    const response = await api.get<PurchaseOrder>(`/purchase_orders/${poNumber}`);
    return response.data;
};

export const updatePOStatus = async (poNumber: string, status: string) => {
    const response = await api.post(`/purchase_orders/${poNumber}/status`, { status });
    return response.data;
};

// ============================================
// V3 - REORDER RECOMMENDATIONS
// ============================================

export interface ReorderRecommendation {
    product_id: string;
    product_name: string;
    current_stock: number;
    recommended_quantity: number;
    confidence_score: number;
    reason: string;
    recommended_vendor: string;
    recommended_vendor_id: string | null;
    unit_price: number;
    days_until_stockout: number;
}

export const getReorderRecommendations = async () => {
    const response = await api.get<ReorderRecommendation[]>('/v3/recommendations/reorder');
    return response.data;
};

export const createPOFromRecommendation = async (productId: string) => {
    const response = await api.post(`/v3/recommendations/reorder/${productId}/create-po`);
    return response.data;
};

// ============================================
// V3 - RISK ASSESSMENT
// ============================================

export interface PORiskAssessment {
    po_number: string;
    delay_probability: number;
    risk_level: 'low' | 'medium' | 'high';
    confidence: string;
    arrival_range: {
        earliest: string;
        expected: string;
        latest: string;
        confidence: string;
    };
    impact: {
        impact_score: number;
        affected_jobs_count: number;
        high_priority_count: number;
        total_margin_at_risk: number;
        severity: string;
    };
}

export interface AtRiskPO {
    po_number: string;
    vendor_name: string;
    total_amount: number;
    status: string;
    risk_level: 'low' | 'medium' | 'high';
    delay_probability: number;
    impact_score: number;
}

export const getPORiskAssessment = async (poNumber: string) => {
    const response = await api.get<PORiskAssessment>(`/v3/risk/po/${poNumber}`);
    return response.data;
};

export const getAtRiskPOs = async () => {
    const response = await api.get<AtRiskPO[]>('/v3/risk/at-risk-pos');
    return response.data;
};

// ============================================
// V3 - AI ASSISTANT
// ============================================

export const chatWithAI = async (message: string, context?: any) => {
    const response = await api.post('/v3/ai/chat', { message, context });
    return response.data;
};

