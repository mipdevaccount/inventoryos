-- CommanderOS Supabase Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Products
CREATE TABLE products (
    product_id TEXT PRIMARY KEY,
    product_name TEXT NOT NULL,
    description TEXT,
    location TEXT,
    unit_of_measure TEXT DEFAULT 'each',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Vendors
CREATE TABLE vendors (
    vendor_id TEXT PRIMARY KEY,
    vendor_name TEXT NOT NULL,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Vendor Products
CREATE TABLE vendor_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id TEXT REFERENCES vendors(vendor_id) ON DELETE CASCADE,
    product_id TEXT REFERENCES products(product_id) ON DELETE CASCADE,
    price NUMERIC(10, 2) NOT NULL,
    sku_number TEXT,
    lead_time_days INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(vendor_id, product_id)
);

-- 4. Requests
CREATE TABLE requests (
    request_id SERIAL PRIMARY KEY,
    product_id TEXT REFERENCES products(product_id) ON DELETE CASCADE,
    requested_by TEXT NOT NULL,
    quantity_needed INTEGER NOT NULL,
    urgency TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'pending',
    notes TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_by TEXT
);

-- 5. Purchase Orders
CREATE TABLE purchase_orders (
    po_number TEXT PRIMARY KEY,
    vendor_id TEXT REFERENCES vendors(vendor_id) ON DELETE CASCADE,
    status TEXT DEFAULT 'Draft',
    total_amount NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. PO Items
CREATE TABLE po_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_number TEXT REFERENCES purchase_orders(po_number) ON DELETE CASCADE,
    product_id TEXT REFERENCES products(product_id) ON DELETE CASCADE,
    quantity_ordered INTEGER NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL
);

-- 7. Ordering Rules
CREATE TABLE vendor_product_rules (
    rule_id TEXT PRIMARY KEY,
    vendor_id TEXT REFERENCES vendors(vendor_id) ON DELETE CASCADE,
    product_id TEXT REFERENCES products(product_id) ON DELETE CASCADE,
    min_qty INTEGER DEFAULT 0,
    discount_pct NUMERIC(5, 2) DEFAULT 0.0,
    notes TEXT
);

-- Optional: Set up Row Level Security (RLS) policies 
-- Currently setting to true but allowing all authenticated users full access
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_product_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated full access to products" ON products FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access to vendors" ON vendors FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access to vendor_products" ON vendor_products FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access to requests" ON requests FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access to purchase_orders" ON purchase_orders FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access to po_items" ON po_items FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access to vendor_product_rules" ON vendor_product_rules FOR ALL TO authenticated USING (true);
