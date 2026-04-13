"""
CSV Data Access Module
Replaces Snowflake database with local CSV file storage for prototyping.
"""

import pandas as pd
import os
from datetime import datetime
from typing import Optional, Dict, List
import fcntl
from contextlib import contextmanager

# Get the directory where this script is located
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data')

PRODUCTS_FILE = os.path.join(DATA_DIR, 'products.csv')
REQUESTS_FILE = os.path.join(DATA_DIR, 'requests.csv')

# V3 - Additional data files
JOBS_FILE = os.path.join(DATA_DIR, 'jobs.csv')
BOM_FILE = os.path.join(DATA_DIR, 'bom.csv')
CONSUMPTION_HISTORY_FILE = os.path.join(DATA_DIR, 'consumption_history.csv')
VENDOR_PERFORMANCE_FILE = os.path.join(DATA_DIR, 'vendor_performance.csv')
QUALITY_EVENTS_FILE = os.path.join(DATA_DIR, 'quality_events.csv')



@contextmanager
def file_lock(file_path):
    """Context manager for file locking to prevent concurrent write issues"""
    lock_file = f"{file_path}.lock"
    with open(lock_file, 'w') as lock:
        try:
            fcntl.flock(lock.fileno(), fcntl.LOCK_EX)
            yield
        finally:
            fcntl.flock(lock.fileno(), fcntl.LOCK_UN)
            try:
                os.remove(lock_file)
            except:
                pass


def _read_products() -> pd.DataFrame:
    """Read products CSV file"""
    if not os.path.exists(PRODUCTS_FILE):
        return pd.DataFrame(columns=['PRODUCT_ID', 'PRODUCT_NAME', 'DESCRIPTION', 
                                     'LOCATION', 'UNIT_OF_MEASURE', 'IS_ACTIVE', 'CREATED_AT'])
    
    df = pd.read_csv(PRODUCTS_FILE)
    if 'CREATED_AT' in df.columns:
        df['CREATED_AT'] = pd.to_datetime(df['CREATED_AT'])
    else:
        df['CREATED_AT'] = None
        
    if 'IS_ACTIVE' in df.columns:
        df['IS_ACTIVE'] = df['IS_ACTIVE'].astype(bool)
    else:
        df['IS_ACTIVE'] = True
    return df


def _write_products(df: pd.DataFrame):
    """Write products CSV file with locking"""
    with file_lock(PRODUCTS_FILE):
        df.to_csv(PRODUCTS_FILE, index=False)


def _read_requests() -> pd.DataFrame:
    """Read requests CSV file"""
    if not os.path.exists(REQUESTS_FILE):
        return pd.DataFrame(columns=['REQUEST_ID', 'PRODUCT_ID', 'REQUESTED_BY', 
                                     'QUANTITY_NEEDED', 'URGENCY', 'STATUS', 'NOTES',
                                     'SUBMITTED_AT', 'UPDATED_AT', 'UPDATED_BY'])
    
    df = pd.read_csv(REQUESTS_FILE)
    if 'SUBMITTED_AT' in df.columns:
        df['SUBMITTED_AT'] = pd.to_datetime(df['SUBMITTED_AT'])
    else:
        df['SUBMITTED_AT'] = None
        
    if 'UPDATED_AT' in df.columns:
        df['UPDATED_AT'] = pd.to_datetime(df['UPDATED_AT'])
    else:
        df['UPDATED_AT'] = None
        
    df['REQUEST_ID'] = df['REQUEST_ID'].astype(int)
    return df


def _write_requests(df: pd.DataFrame):
    """Write requests CSV file with locking"""
    with file_lock(REQUESTS_FILE):
        df.to_csv(REQUESTS_FILE, index=False)


# ============================================
# PRODUCT FUNCTIONS
# ============================================

def get_all_products(active_only: bool = True) -> pd.DataFrame:
    """
    Get all products from the catalog
    
    Args:
        active_only: If True, only return active products
        
    Returns:
        DataFrame with product information
    """
    df = _read_products()
    
    if active_only and not df.empty:
        df = df[df['IS_ACTIVE'] == True]
    
    return df


def get_product_by_id(product_id: str) -> Optional[Dict]:
    """
    Get a single product by ID
    
    Args:
        product_id: The product ID to look up
        
    Returns:
        Dictionary with product information or None if not found
    """
    df = _read_products()
    
    if df.empty:
        return None
    
    product = df[df['PRODUCT_ID'] == product_id]
    
    if product.empty:
        return None
    
    return product.iloc[0].to_dict()


def add_product(product_id: str, product_name: str, description: str = None, 
                location: str = None, unit_of_measure: str = 'each') -> bool:
    """
    Add a new product to the catalog
    
    Args:
        product_id: Unique product identifier
        product_name: Product name
        description: Product description
        location: Storage location
        unit_of_measure: Unit of measure (each, box, lot, etc.)
        
    Returns:
        True if successful, False otherwise
    """
    try:
        df = _read_products()
        
        # Check if product already exists
        if not df.empty and product_id in df['PRODUCT_ID'].values:
            return False
        
        # Create new product record
        new_product = pd.DataFrame([{
            'PRODUCT_ID': product_id,
            'PRODUCT_NAME': product_name,
            'DESCRIPTION': description or '',
            'LOCATION': location or '',
            'UNIT_OF_MEASURE': unit_of_measure,
            'IS_ACTIVE': True,
            'CREATED_AT': datetime.now()
        }])
        
        # Append to existing data
        df = pd.concat([df, new_product], ignore_index=True)
        _write_products(df)
        
        return True
    except Exception as e:
        print(f"Error adding product: {e}")
        return False


def update_product(product_id: str, **kwargs) -> bool:
    """
    Update product fields
    
    Args:
        product_id: Product ID to update
        **kwargs: Fields to update (product_name, description, location, unit_of_measure, is_active)
        
    Returns:
        True if successful, False otherwise
    """
    try:
        df = _read_products()
        
        if df.empty or product_id not in df['PRODUCT_ID'].values:
            return False
        
        # Update fields
        idx = df[df['PRODUCT_ID'] == product_id].index[0]
        
        for key, value in kwargs.items():
            column_name = key.upper()
            if column_name in df.columns:
                df.at[idx, column_name] = value
        
        _write_products(df)
        return True
    except Exception as e:
        print(f"Error updating product: {e}")
        return False


# ============================================
# REQUEST FUNCTIONS
# ============================================

def submit_request(product_id: str, requested_by: str, quantity_needed: int,
                   urgency: str = 'medium', notes: str = None) -> bool:
    """
    Submit a new inventory request
    
    Args:
        product_id: Product being requested
        requested_by: Name of person making request
        quantity_needed: Quantity requested
        urgency: Priority level (low, medium, high)
        notes: Optional notes
        
    Returns:
        True if successful, False otherwise
    """
    try:
        df = _read_requests()
        
        # Generate new request ID
        if df.empty:
            new_id = 1
        else:
            new_id = df['REQUEST_ID'].max() + 1
        
        # Create new request
        new_request = pd.DataFrame([{
            'REQUEST_ID': new_id,
            'PRODUCT_ID': product_id,
            'REQUESTED_BY': requested_by,
            'QUANTITY_NEEDED': quantity_needed,
            'URGENCY': urgency,
            'STATUS': 'pending',
            'NOTES': notes or '',
            'SUBMITTED_AT': datetime.now(),
            'UPDATED_AT': datetime.now(),
            'UPDATED_BY': ''
        }])
        
        # Append to existing data
        df = pd.concat([df, new_request], ignore_index=True)
        _write_requests(df)
        
        return True
    except Exception as e:
        print(f"Error submitting request: {e}")
        return False


def get_all_requests(status_filter: str = None) -> pd.DataFrame:
    """
    Get all requests with product details
    
    Args:
        status_filter: Optional status to filter by (pending, ordered, received, cancelled)
        
    Returns:
        DataFrame with request and product information joined
    """
    requests_df = _read_requests()
    
    if requests_df.empty:
        return pd.DataFrame()
    
    # Filter by status if specified
    if status_filter:
        requests_df = requests_df[requests_df['STATUS'] == status_filter]
    
    # Join with products to get product details
    products_df = _read_products()
    
    if products_df.empty:
        return requests_df
    
    # Merge on PRODUCT_ID
    result = requests_df.merge(
        products_df[['PRODUCT_ID', 'PRODUCT_NAME', 'LOCATION', 'UNIT_OF_MEASURE']],
        on='PRODUCT_ID',
        how='left'
    )
    
    # Sort by submitted date (newest first)
    result = result.sort_values('SUBMITTED_AT', ascending=False)
    
    return result


def update_request_status(request_id: int, status: str, updated_by: str) -> bool:
    """
    Update the status of a request
    
    Args:
        request_id: Request ID to update
        status: New status (pending, ordered, received, cancelled)
        updated_by: Name of person updating the status
        
    Returns:
        True if successful, False otherwise
    """
    try:
        df = _read_requests()
        
        if df.empty or request_id not in df['REQUEST_ID'].values:
            return False
        
        # Update status
        idx = df[df['REQUEST_ID'] == request_id].index[0]
        df.at[idx, 'STATUS'] = status
        df.at[idx, 'UPDATED_AT'] = datetime.now()
        df.at[idx, 'UPDATED_BY'] = updated_by
        
        _write_requests(df)
        return True
    except Exception as e:
        print(f"Error updating request status: {e}")
        return False


def get_request_counts() -> Dict[str, int]:
    """
    Get count of requests by status
    
    Returns:
        Dictionary with status counts
    """
    df = _read_requests()
    
    if df.empty:
        return {'pending': 0, 'ordered': 0, 'received': 0, 'cancelled': 0}
    
    counts = df['STATUS'].value_counts().to_dict()
    
    # Ensure all statuses are present
    result = {'pending': 0, 'ordered': 0, 'received': 0, 'cancelled': 0}
    result.update(counts)
    
    return result


# ============================================
# VENDOR FUNCTIONS
# ============================================

VENDORS_FILE = os.path.join(DATA_DIR, 'vendors.csv')
VENDOR_PRODUCTS_FILE = os.path.join(DATA_DIR, 'vendor_products.csv')


def _read_vendors() -> pd.DataFrame:
    """Read vendors CSV file"""
    if not os.path.exists(VENDORS_FILE):
        return pd.DataFrame(columns=['VENDOR_ID', 'VENDOR_NAME', 'CONTACT_NAME', 'EMAIL', 'PHONE', 'ADDRESS'])
    return pd.read_csv(VENDORS_FILE)


def _write_vendors(df: pd.DataFrame):
    """Write vendors CSV file with locking"""
    with file_lock(VENDORS_FILE):
        df.to_csv(VENDORS_FILE, index=False)


def _read_vendor_products() -> pd.DataFrame:
    """Read vendor products CSV file"""
    if not os.path.exists(VENDOR_PRODUCTS_FILE):
        return pd.DataFrame(columns=['VENDOR_ID', 'PRODUCT_ID', 'PRICE', 'SKU_NUMBER', 'LEAD_TIME_DAYS'])
    return pd.read_csv(VENDOR_PRODUCTS_FILE)


def _write_vendor_products(df: pd.DataFrame):
    """Write vendor products CSV file with locking"""
    with file_lock(VENDOR_PRODUCTS_FILE):
        df.to_csv(VENDOR_PRODUCTS_FILE, index=False)


def get_all_vendors() -> List[Dict]:
    df = _read_vendors()
    if df.empty:
        return []
    # Replace NaN with empty strings to avoid JSON serialization issues
    df = df.fillna('')
    return df.to_dict(orient="records")


def get_vendor_by_id(vendor_id: str) -> Optional[Dict]:
    df = _read_vendors()
    if df.empty:
        return None
    
    vendor = df[df['VENDOR_ID'] == vendor_id]
    if vendor.empty:
        return None
    
    # Replace NaN with empty strings
    result = vendor.iloc[0].to_dict()
    return {k: (v if pd.notna(v) else '') for k, v in result.items()}


def add_vendor(vendor_id: str, vendor_name: str, contact_name: str, email: str, 
               phone: str, address: str) -> bool:
    try:
        df = _read_vendors()
        
        if not df.empty and vendor_id in df['VENDOR_ID'].values:
            return False
        
        new_vendor = pd.DataFrame([{
            'VENDOR_ID': vendor_id,
            'VENDOR_NAME': vendor_name,
            'CONTACT_NAME': contact_name,
            'EMAIL': email,
            'PHONE': phone,
            'ADDRESS': address
        }])
        
        df = pd.concat([df, new_vendor], ignore_index=True)
        _write_vendors(df)
        
        return True
    except Exception as e:
        print(f"Error adding vendor: {e}")
        return False


def update_vendor(vendor_id: str, **kwargs) -> bool:
    """
    Update vendor fields
    
    Args:
        vendor_id: Vendor ID to update
        **kwargs: Fields to update (vendor_name, contact_name, email, phone, address)
        
    Returns:
        True if successful, False otherwise
    """
    try:
        df = _read_vendors()
        
        if df.empty or vendor_id not in df['VENDOR_ID'].values:
            return False
        
        # Update fields
        idx = df[df['VENDOR_ID'] == vendor_id].index[0]
        
        for key, value in kwargs.items():
            column_name = key.upper()
            if column_name in df.columns:
                df.at[idx, column_name] = value
        
        _write_vendors(df)
        return True
    except Exception as e:
        print(f"Error updating vendor: {e}")
        return False


def get_all_vendor_products() -> List[Dict]:
    """Get all vendor products"""
    df = _read_vendor_products()
    if df.empty:
        return []
        
    # Join with products to get product names
    products_df = _read_products()
    if not products_df.empty:
        result = pd.merge(df, products_df[['PRODUCT_ID', 'PRODUCT_NAME']], on='PRODUCT_ID', how='left')
    else:
        result = df
        result['PRODUCT_NAME'] = 'Unknown'
        
    # Replace NaN with appropriate defaults
    result = result.fillna({'SKU_NUMBER': '', 'LEAD_TIME_DAYS': 0, 'PRODUCT_NAME': 'Unknown'})
    
    return result.to_dict(orient="records")

def get_vendor_products(vendor_id: str) -> List[Dict]:
    """Get all products for a specific vendor with pricing"""
    vp_df = _read_vendor_products()
    
    if vp_df.empty:
        return []
    
    # Filter by vendor
    vp_df = vp_df[vp_df['VENDOR_ID'] == vendor_id]
    
    if vp_df.empty:
        return []
    
    # Join with products to get product details
    products_df = _read_products()
    
    if products_df.empty:
        return []
    
    result = vp_df.merge(
        products_df[['PRODUCT_ID', 'PRODUCT_NAME', 'UNIT_OF_MEASURE']],
        on='PRODUCT_ID',
        how='left'
    )
    
    # Replace NaN with appropriate defaults
    result = result.fillna({'SKU_NUMBER': '', 'LEAD_TIME_DAYS': 0})
    
    return result.to_dict(orient="records")


def add_vendor_product(vendor_id: str, product_id: str, price: float, 
                       sku_number: str = '', lead_time_days: int = 0) -> bool:
    try:
        df = _read_vendor_products()
        
        # Check if this vendor-product combination already exists
        if not df.empty:
            existing = df[(df['VENDOR_ID'] == vendor_id) & (df['PRODUCT_ID'] == product_id)]
            if not existing.empty:
                return False
        
        new_vp = pd.DataFrame([{
            'VENDOR_ID': vendor_id,
            'PRODUCT_ID': product_id,
            'PRICE': price,
            'SKU_NUMBER': sku_number,
            'LEAD_TIME_DAYS': lead_time_days
        }])
        
        df = pd.concat([df, new_vp], ignore_index=True)
        _write_vendor_products(df)
        
        return True
    except Exception as e:
        print(f"Error adding vendor product: {e}")
        return False


# ============================================
# PURCHASE ORDER FUNCTIONS
# ============================================

POS_FILE = os.path.join(DATA_DIR, 'purchase_orders.csv')
PO_ITEMS_FILE = os.path.join(DATA_DIR, 'po_items.csv')


def _read_pos() -> pd.DataFrame:
    """Read purchase orders CSV file"""
    if not os.path.exists(POS_FILE):
        return pd.DataFrame(columns=['PO_NUMBER', 'VENDOR_ID', 'STATUS', 'TOTAL_AMOUNT', 'CREATED_AT'])
    
    df = pd.read_csv(POS_FILE)
    if 'CREATED_AT' in df.columns:
        df['CREATED_AT'] = pd.to_datetime(df['CREATED_AT'])
    else:
        df['CREATED_AT'] = None
    return df


def _write_pos(df: pd.DataFrame):
    """Write purchase orders CSV file with locking"""
    with file_lock(POS_FILE):
        df.to_csv(POS_FILE, index=False)


def _read_po_items() -> pd.DataFrame:
    """Read PO items CSV file"""
    if not os.path.exists(PO_ITEMS_FILE):
        return pd.DataFrame(columns=['PO_NUMBER', 'PRODUCT_ID', 'QUANTITY_ORDERED', 'UNIT_PRICE'])
    return pd.read_csv(PO_ITEMS_FILE)


def _write_po_items(df: pd.DataFrame):
    """Write PO items CSV file with locking"""
    with file_lock(PO_ITEMS_FILE):
        df.to_csv(PO_ITEMS_FILE, index=False)


def create_purchase_order(vendor_id: str, items: List[Dict]) -> str:
    """
    Create a new purchase order
    
    Args:
        vendor_id: Vendor ID
        items: List of dicts with product_id, quantity, unit_price
        
    Returns:
        PO number if successful, empty string otherwise
    """
    try:
        # Generate PO number
        pos_df = _read_pos()
        
        if pos_df.empty:
            po_number = "CI00000001"
        else:
            # Extract numeric part and increment
            last_num = int(pos_df['PO_NUMBER'].iloc[-1][2:])
            po_number = f"CI{last_num + 1:08d}"
        
        # Calculate total
        total_amount = sum(item['quantity'] * item['unit_price'] for item in items)
        
        # Create PO header
        new_po = pd.DataFrame([{
            'PO_NUMBER': po_number,
            'VENDOR_ID': vendor_id,
            'STATUS': 'Draft',
            'TOTAL_AMOUNT': total_amount,
            'CREATED_AT': datetime.now()
        }])
        
        pos_df = pd.concat([pos_df, new_po], ignore_index=True)
        _write_pos(pos_df)
        
        # Create PO items
        po_items_df = _read_po_items()
        
        for item in items:
            new_item = pd.DataFrame([{
                'PO_NUMBER': po_number,
                'PRODUCT_ID': item['product_id'],
                'QUANTITY_ORDERED': item['quantity'],
                'UNIT_PRICE': item['unit_price']
            }])
            
            po_items_df = pd.concat([po_items_df, new_item], ignore_index=True)
        
        _write_po_items(po_items_df)
        
        return po_number
    except Exception as e:
        print(f"Error creating PO: {e}")
        return ""


def update_po(po_number: str, items: List[Dict]) -> bool:
    """
    Update PO items and recalculate total
    """
    try:
        pos_df = _read_pos()
        if pos_df.empty or po_number not in pos_df['PO_NUMBER'].values:
            return False
        
        # Calculate new total
        total_amount = sum(item['quantity'] * item['unit_price'] for item in items)
        
        # Update header total
        idx = pos_df[pos_df['PO_NUMBER'] == po_number].index[0]
        pos_df.at[idx, 'TOTAL_AMOUNT'] = total_amount
        _write_pos(pos_df)
        
        po_items_df = _read_po_items()
        
        # Remove old items
        if not po_items_df.empty:
            po_items_df = po_items_df[po_items_df['PO_NUMBER'] != po_number]
        else:
            po_items_df = pd.DataFrame(columns=['PO_NUMBER', 'PRODUCT_ID', 'QUANTITY_ORDERED', 'UNIT_PRICE'])
            
        # Add new items
        for item in items:
            new_item = pd.DataFrame([{
                'PO_NUMBER': po_number,
                'PRODUCT_ID': item['product_id'],
                'QUANTITY_ORDERED': item['quantity'],
                'UNIT_PRICE': item['unit_price']
            }])
            po_items_df = pd.concat([po_items_df, new_item], ignore_index=True)
            
        _write_po_items(po_items_df)
        return True
    except Exception as e:
        print(f"Error updating PO: {e}")
        return False


def get_all_pos() -> List[Dict]:
    """Get all purchase orders with vendor details"""
    pos_df = _read_pos()
    
    if pos_df.empty:
        return []
    
    # Join with vendors
    vendors_df = _read_vendors()
    
    if not vendors_df.empty:
        result = pos_df.merge(
            vendors_df[['VENDOR_ID', 'VENDOR_NAME']],
            on='VENDOR_ID',
            how='left'
        )
    else:
        result = pos_df
        result['VENDOR_NAME'] = ''
    
    # Sort by created date (newest first)
    result = result.sort_values('CREATED_AT', ascending=False)
    
    # Replace NaN with empty strings
    result = result.fillna('')
    
    return result.to_dict(orient="records")


def get_po_details(po_number: str) -> Optional[Dict]:
    """Get PO details including items"""
    pos_df = _read_pos()
    
    if pos_df.empty:
        return None
    
    po = pos_df[pos_df['PO_NUMBER'] == po_number]
    
    if po.empty:
        return None
    
    po_dict = po.iloc[0].to_dict()
    
    # Get vendor details
    vendors_df = _read_vendors()
    if not vendors_df.empty:
        vendor = vendors_df[vendors_df['VENDOR_ID'] == po_dict['VENDOR_ID']]
        if not vendor.empty:
            po_dict['VENDOR_NAME'] = vendor.iloc[0]['VENDOR_NAME']
    
    # Get items
    items_df = _read_po_items()
    
    if not items_df.empty:
        items = items_df[items_df['PO_NUMBER'] == po_number]
        
        # Join with products
        products_df = _read_products()
        
        if not products_df.empty and not items.empty:
            items = items.merge(
                products_df[['PRODUCT_ID', 'PRODUCT_NAME', 'UNIT_OF_MEASURE']],
                on='PRODUCT_ID',
                how='left'
            )
        
        po_dict['items'] = items.to_dict(orient="records")
    else:
        po_dict['items'] = []
    
    return po_dict


def update_po_status(po_number: str, status: str) -> bool:
    """Update PO status"""
    try:
        df = _read_pos()
        
        if df.empty or po_number not in df['PO_NUMBER'].values:
            return False
        
        idx = df[df['PO_NUMBER'] == po_number].index[0]
        df.at[idx, 'STATUS'] = status
        
        _write_pos(df)
        return True
    except Exception as e:
        print(f"Error updating PO status: {e}")
        return False

# ============================================
# ORDERING RULES & OPTIMIZATION INSIGHTS
# ============================================

RULES_FILE = os.path.join(DATA_DIR, 'vendor_product_rules.csv')

def _read_rules() -> pd.DataFrame:
    """Read ordering rules CSV file"""
    if not os.path.exists(RULES_FILE):
        return pd.DataFrame(columns=['RULE_ID', 'VENDOR_ID', 'PRODUCT_ID', 'MIN_QTY', 'DISCOUNT_PCT', 'NOTES'])
    return pd.read_csv(RULES_FILE)

def _write_rules(df: pd.DataFrame):
    """Write ordering rules CSV file with locking"""
    with file_lock(RULES_FILE):
        df.to_csv(RULES_FILE, index=False)

def get_all_rules() -> List[Dict]:
    """Get all ordering rules including vendor and product details"""
    df = _read_rules()
    if df.empty:
        return []
    
    # Left join with vendor products/products for context
    vendors_df = _read_vendors()
    if not vendors_df.empty:
        df = df.merge(vendors_df[['VENDOR_ID', 'VENDOR_NAME']], on='VENDOR_ID', how='left')
    else:
        df['VENDOR_NAME'] = ''
        
    products_df = _read_products()
    if not products_df.empty:
        df = df.merge(products_df[['PRODUCT_ID', 'PRODUCT_NAME']], on='PRODUCT_ID', how='left')
    else:
        df['PRODUCT_NAME'] = ''
        
    df = df.fillna('')
    return df.to_dict(orient='records')

def add_rule(rule_id: str, vendor_id: str, product_id: str, min_qty: int, discount_pct: float, notes: str) -> bool:
    """Add a new ordering rule"""
    try:
        df = _read_rules()
        if not df.empty and rule_id in df['RULE_ID'].values:
            return False
            
        new_row = pd.DataFrame([{
            'RULE_ID': rule_id,
            'VENDOR_ID': vendor_id,
            'PRODUCT_ID': product_id,
            'MIN_QTY': min_qty,
            'DISCOUNT_PCT': discount_pct,
            'NOTES': notes
        }])
        
        df = pd.concat([df, new_row], ignore_index=True)
        _write_rules(df)
        return True
    except Exception as e:
        print(f"Error adding ordering rule: {e}")
        return False

def update_rule(rule_id: str, vendor_id: str, product_id: str, min_qty: int, discount_pct: float, notes: str) -> bool:
    """Update an existing rule"""
    try:
        df = _read_rules()
        if df.empty or rule_id not in df['RULE_ID'].values:
            return False
            
        idx = df[df['RULE_ID'] == rule_id].index[0]
        df.at[idx, 'VENDOR_ID'] = vendor_id
        df.at[idx, 'PRODUCT_ID'] = product_id
        df.at[idx, 'MIN_QTY'] = min_qty
        df.at[idx, 'DISCOUNT_PCT'] = discount_pct
        df.at[idx, 'NOTES'] = notes
        
        _write_rules(df)
        return True
    except Exception as e:
        print(f"Error updating rule: {e}")
        return False

def get_optimization_insights(vendor_id: str, product_id: str) -> Dict:
    """Get optimization insights for a vendor-product mapping"""
    insights = {
        "rule": None,
        "history": {
            "last_order_date": None,
            "last_order_qty": 0,
            "qty_past_90_days": 0
        }
    }
    
    # 1. Fetch matching rule (if any)
    rules_df = _read_rules()
    if not rules_df.empty:
        match = rules_df[(rules_df['VENDOR_ID'] == vendor_id) & (rules_df['PRODUCT_ID'] == product_id)]
        if not match.empty:
            # fill nan
            match = match.fillna('')
            insights["rule"] = match.iloc[0].to_dict()
            
    # 2. Fetch history spanning recent POs
    po_items_df = _read_po_items()
    pos_df = _read_pos()
    
    if not po_items_df.empty and not pos_df.empty:
        # Join items dict with pos_df to get dates and vendors
        merged = pd.merge(po_items_df, pos_df, on='PO_NUMBER', how='inner')
        # Filter down
        filtered = merged[(merged['VENDOR_ID'] == vendor_id) & (merged['PRODUCT_ID'] == product_id)].copy()
        
        if not filtered.empty:
            # We must convert to datetime explicitly to process time deltas
            filtered['CREATED_AT'] = pd.to_datetime(filtered['CREATED_AT'])
            # Sort newest first
            filtered = filtered.sort_values('CREATED_AT', ascending=False)
            
            # The most recent order
            insights["history"]["last_order_qty"] = int(filtered.iloc[0]['QUANTITY_ORDERED'])
            insights["history"]["last_order_date"] = filtered.iloc[0]['CREATED_AT'].strftime("%Y-%m-%d")
            
            # Last 90 days
            cutoff_date = pd.Timestamp.now() - pd.Timedelta(days=90)
            recent = filtered[filtered['CREATED_AT'] >= cutoff_date]
            insights["history"]["qty_past_90_days"] = int(recent['QUANTITY_ORDERED'].sum())
            
    return insights
