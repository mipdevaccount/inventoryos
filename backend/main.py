from fastapi import FastAPI, HTTPException, Body, UploadFile, File
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import io
import pandas as pd
import sys
import os

# Add utils to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from utils.csv_data import (
    get_all_products, get_product_by_id, add_product, update_product,
    submit_request, get_all_requests, update_request_status, get_request_counts,
    get_all_vendors, add_vendor, update_vendor, add_vendor_product, get_vendor_products, get_all_vendor_products,
    create_purchase_order, update_po, get_all_pos, get_po_details, update_po_status,
    get_vendor_by_id, get_all_rules, add_rule, update_rule, get_optimization_insights
)

# V3 imports
from utils.v3_data import (
    get_all_jobs, get_job_by_id, create_job,
    get_job_bom, add_bom_item,
    get_consumption_history, record_consumption,
    get_vendor_performance, record_po_delivery
)
from ml.forecasting import ForecastingEngine
from ml.vendor_selection import VendorSelector
from ml.risk_scoring import RiskPredictor
from auth.routes import router as auth_router


app = FastAPI(title="Inventory Request System API")
app.include_router(auth_router)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# V3 - Initialize ML/AI engines
forecasting_engine = ForecastingEngine()
vendor_selector = VendorSelector()
risk_predictor = RiskPredictor()


# Models
class ProductCreate(BaseModel):
    product_id: str
    product_name: str
    description: Optional[str] = None
    location: Optional[str] = None
    unit_of_measure: str = "each"

class RequestCreate(BaseModel):
    product_id: str
    requested_by: str
    quantity_needed: int
    urgency: str = "medium"
    notes: Optional[str] = None

class StatusUpdate(BaseModel):
    request_id: int
    status: str
    updated_by: str

class VendorCreate(BaseModel):
    vendor_id: str
    vendor_name: str
    contact_name: str
    email: str
    phone: str
    address: str

class VendorProductCreate(BaseModel):
    product_id: str
    price: float
    sku_number: str
    lead_time_days: int

class POItem(BaseModel):
    product_id: str
    quantity: int
    unit_price: float

class POCreate(BaseModel):
    vendor_id: str
    items: List[POItem]

class POStatusUpdate(BaseModel):
    status: str

class RuleCreate(BaseModel):
    rule_id: str
    vendor_id: str
    product_id: str
    min_qty: int
    discount_pct: float
    notes: str

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "v3.0.0"}

@app.get("/api/products")
async def list_products(active_only: bool = True):
    df = get_all_products(active_only)
    if df.empty:
        return []
        
    for col in ['PRODUCT_NAME', 'LOCATION', 'UNIT_OF_MEASURE', 'PRODUCT_ID', 'DESCRIPTION']:
        if col in df.columns:
            df[col] = df[col].fillna('')
            
    # Replace NaNs with None for JSON compatibility
    df = df.replace({float('nan'): None})
    return df.to_dict(orient="records")

@app.get("/api/products/export")
async def export_products():
    from utils.csv_data import PRODUCTS_FILE
    return FileResponse(PRODUCTS_FILE, media_type="text/csv", filename="products.csv")

@app.post("/api/products/upload")
async def upload_products(file: UploadFile = File(...)):
    contents = await file.read()
    df_new = pd.read_csv(io.BytesIO(contents))
    from utils.csv_data import PRODUCTS_FILE, _read_products
    df_existing = _read_products()
    
    # Fill NAs
    df_new = df_new.fillna('')
    
    # Merge using concat and drop duplicates keeping the last (new)
    df_combined = pd.concat([df_existing, df_new]).drop_duplicates(subset=['PRODUCT_ID'], keep='last')
    df_combined.to_csv(PRODUCTS_FILE, index=False)
    return {"message": "Success"}

@app.get("/api/products/{product_id}")
async def get_product(product_id: str):
    product = get_product_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    # Replace NaNs with None for JSON compatibility
    for k, v in product.items():
        if isinstance(v, float) and pd.isna(v):
            product[k] = None
    return product

@app.post("/api/products")
async def create_product(product: ProductCreate):
    success = add_product(
        product.product_id,
        product.product_name,
        product.description,
        product.location,
        product.unit_of_measure
    )
    if not success:
        raise HTTPException(status_code=400, detail="Product ID already exists or error creating product")
    return {"message": "Product created successfully"}

@app.put("/api/products/{product_id}")
async def edit_product(product_id: str, product: ProductCreate):
    success = update_product(
        product_id,
        product_name=product.product_name,
        description=product.description,
        location=product.location,
        unit_of_measure=product.unit_of_measure
    )
    if not success:
        raise HTTPException(status_code=404, detail="Product not found or error updating")
    return {"message": "Product updated successfully"}

@app.get("/api/requests")
async def list_requests(status: Optional[str] = None):
    df = get_all_requests(status)
    if df.empty:
        return []
    # Convert dates to strings for JSON serialization
    df['SUBMITTED_AT'] = df['SUBMITTED_AT'].astype(str)
    df['UPDATED_AT'] = df['UPDATED_AT'].astype(str)
    
    # Provide default empty strings for critical frontend UI string fields
    for col in ['PRODUCT_NAME', 'LOCATION', 'UNIT_OF_MEASURE', 'PRODUCT_ID', 'REQUESTED_BY', 'NOTES']:
        if col in df.columns:
            df[col] = df[col].fillna('')
            
    # Replace remaining NaNs with None for JSON compatibility
    df = df.replace({float('nan'): None})
    return df.to_dict(orient="records")

@app.post("/api/submit")
async def create_request(request: RequestCreate):
    success = submit_request(
        request.product_id,
        request.requested_by,
        request.quantity_needed,
        request.urgency,
        request.notes
    )
    if not success:
        raise HTTPException(status_code=500, detail="Error submitting request")
    return {"message": "Request submitted successfully"}

@app.post("/api/update_status")
async def update_status(update: StatusUpdate):
    success = update_request_status(
        update.request_id,
        update.status,
        update.updated_by
    )
    if not success:
        raise HTTPException(status_code=400, detail="Error updating status")
    return {"message": "Status updated successfully"}

@app.get("/api/counts")
async def get_counts():
    return get_request_counts()

# Vendor Endpoints
@app.get("/api/vendors")
async def list_vendors():
    return get_all_vendors()

@app.get("/api/vendors/export")
async def export_vendors():
    from utils.csv_data import VENDORS_FILE
    return FileResponse(VENDORS_FILE, media_type="text/csv", filename="vendors.csv")

@app.post("/api/vendors/upload")
async def upload_vendors(file: UploadFile = File(...)):
    contents = await file.read()
    df_new = pd.read_csv(io.BytesIO(contents))
    from utils.csv_data import VENDORS_FILE, _read_vendors
    df_existing = _read_vendors()
    
    df_new = df_new.fillna('')
    df_combined = pd.concat([df_existing, df_new]).drop_duplicates(subset=['VENDOR_ID'], keep='last')
    df_combined.to_csv(VENDORS_FILE, index=False)
    return {"message": "Success"}

@app.get("/api/vendors/{vendor_id}")
async def get_vendor(vendor_id: str):
    vendor = get_vendor_by_id(vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    # Replace NaNs with None for JSON compatibility
    for k, v in vendor.items():
        if isinstance(v, float) and pd.isna(v):
            vendor[k] = None
    return vendor

@app.post("/api/vendors")
async def create_vendor(vendor: VendorCreate):
    success = add_vendor(
        vendor.vendor_id,
        vendor.vendor_name,
        vendor.contact_name,
        vendor.email,
        vendor.phone,
        vendor.address
    )
    if not success:
        raise HTTPException(status_code=400, detail="Vendor ID already exists or error creating vendor")
    return {"message": "Vendor created successfully"}

@app.put("/api/vendors/{vendor_id}")
async def edit_vendor(vendor_id: str, vendor: VendorCreate):
    success = update_vendor(
        vendor_id,
        vendor_name=vendor.vendor_name,
        contact_name=vendor.contact_name,
        email=vendor.email,
        phone=vendor.phone,
        address=vendor.address
    )
    if not success:
        raise HTTPException(status_code=404, detail="Vendor not found or error updating")
    return {"message": "Vendor updated successfully"}

@app.get("/api/vendors/{vendor_id}/products")
async def list_vendor_products(vendor_id: str):
    df = pd.DataFrame(get_vendor_products(vendor_id))
    if df.empty:
        return []
    df = df.replace({float('nan'): None})
    return df.to_dict(orient="records")

@app.get("/api/vendor-products")
async def list_all_vendor_products():
    df = pd.DataFrame(get_all_vendor_products())
    if df.empty:
        return []
    df = df.replace({float('nan'): None})
    return df.to_dict(orient="records")

@app.post("/api/vendors/{vendor_id}/products")
async def create_vendor_product(vendor_id: str, vp: VendorProductCreate):
    success = add_vendor_product(
        vendor_id,
        vp.product_id,
        vp.price,
        vp.sku_number,
        vp.lead_time_days
    )
    if not success:
        raise HTTPException(status_code=400, detail="Error adding vendor product")
    return {"message": "Vendor product added successfully"}

# Purchase Order Endpoints
@app.get("/api/purchase_orders")
async def list_pos():
    df = pd.DataFrame(get_all_pos())
    if df.empty:
        return []
    df = df.replace({float('nan'): None})
    return df.to_dict(orient="records")

@app.post("/api/purchase_orders")
async def create_po(po: POCreate):
    # Convert Pydantic models to dicts
    items_dict = [item.dict() for item in po.items]
    po_number = create_purchase_order(po.vendor_id, items_dict)
    
    if not po_number:
        raise HTTPException(status_code=500, detail="Error creating purchase order")
        
    # Auto-update pending requests
    try:
        pending_reqs_df = get_all_requests('pending')
        if not pending_reqs_df.empty:
            ordered_product_ids = {item['product_id'] for item in items_dict}
            matches = pending_reqs_df[pending_reqs_df['PRODUCT_ID'].isin(ordered_product_ids)]
            for _, row in matches.iterrows():
                update_request_status(row['REQUEST_ID'], 'ordered', 'PO System')
    except Exception as e:
        print(f"Error auto-updating pending requests: {e}")
        
    return {"message": "Purchase order created successfully", "po_number": po_number}

@app.put("/api/purchase_orders/{po_number}")
async def edit_po(po_number: str, po: POCreate):
    items_dict = [item.dict() for item in po.items]
    success = update_po(po_number, items_dict)
    if not success:
        raise HTTPException(status_code=404, detail="PO not found or error updating")
    return {"message": "PO updated successfully"}

@app.get("/api/purchase_orders/{po_number}")
async def get_po(po_number: str):
    po = get_po_details(po_number)
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")
        
    # Helper to clean dict
    def clean_dict(d):
        if isinstance(d, dict):
            return {k: clean_dict(v) for k, v in d.items()}
        elif isinstance(d, list):
            return [clean_dict(v) for v in d]
        elif isinstance(d, float) and pd.isna(d):
            return None
        return d
        
    return clean_dict(po)

@app.post("/api/purchase_orders/{po_number}/status")
async def update_po_status_endpoint(po_number: str, status_update: POStatusUpdate):
    success = update_po_status(po_number, status_update.status)
    if not success:
        raise HTTPException(status_code=400, detail="Error updating PO status")
    return {"message": "PO status updated successfully"}


# ============================================
# V3 - REORDER RECOMMENDATIONS ENDPOINTS
# ============================================

# Mock recommendations for demonstration (ML pipeline is too slow for real-time)
MOCK_RECOMMENDATIONS = [
    {
        "product_id": "PROD001",
        "product_name": "Aluminum Sheet 4x8 3mm",
        "current_stock": 12,
        "recommended_quantity": 45,
        "confidence_score": 0.85,
        "reason": "3 high-priority dump body jobs scheduled in next 4 weeks. Historical consumption trending at 8.2 units/day.",
        "recommended_vendor": "Hayward's Hardware",
        "recommended_vendor_id": "V-004",
        "unit_price": 125.50,
        "days_until_stockout": 9
    },
    {
        "product_id": "PROD002",
        "product_name": "Hydraulic Cylinder 3\" Bore",
        "current_stock": 3,
        "recommended_quantity": 12,
        "confidence_score": 0.92,
        "reason": "2 forestry chipper builds confirmed. Seasonal demand increase detected.",
        "recommended_vendor": "Test Vendor",
        "recommended_vendor_id": "TEST-001",
        "unit_price": 385.00,
        "days_until_stockout": 5
    },
    {
        "product_id": "PROD003",
        "product_name": "Steel Tubing 2x2x1/8",
        "current_stock": 28,
        "recommended_quantity": 60,
        "confidence_score": 0.78,
        "reason": "Consistent weekly consumption of 15-20 units. Current stock below safety threshold.",
        "recommended_vendor": "Hayward's Hardware",
        "recommended_vendor_id": "V-004",
        "unit_price": 42.75,
        "days_until_stockout": 12
    },
    {
        "product_id": "PROD004",
        "product_name": "LED Work Light Assembly",
        "current_stock": 8,
        "recommended_quantity": 24,
        "confidence_score": 0.88,
        "reason": "Required for all custom builds. 4 jobs in pipeline requiring 6 units each.",
        "recommended_vendor": "Test Vendor",
        "recommended_vendor_id": "TEST-001",
        "unit_price": 89.99,
        "days_until_stockout": 7
    },
    {
        "product_id": "PROD005",
        "product_name": "Powder Coat Paint - Black",
        "current_stock": 15,
        "recommended_quantity": 40,
        "confidence_score": 0.81,
        "reason": "Average consumption 12 units/week. Vendor lead time 14 days.",
        "recommended_vendor": "Hayward's Hardware",
        "recommended_vendor_id": "V-004",
        "unit_price": 67.50,
        "days_until_stockout": 10
    }
]

@app.get("/api/v3/recommendations/reorder")
async def get_reorder_recommendations():
    """Get reorder recommendations (using mock data for demo - ML pipeline is too slow for real-time)"""
    return MOCK_RECOMMENDATIONS



@app.post("/api/v3/recommendations/reorder/{product_id}/create-po")
async def create_po_from_recommendation(product_id: str):
    """Convert a reorder recommendation to a draft PO"""
    try:
        # Get product details
        product = get_product_by_id(product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Get consumption and forecast
        consumption_df = get_consumption_history(product_id, days=90)
        forecast = forecasting_engine.predict_consumption(product_id, consumption_df, horizon_days=30)
        
        current_stock = product.get('CURRENT_STOCK', 0)
        reorder_calc = forecasting_engine.calculate_reorder_point(product_id, current_stock, lead_time_days=14)
        order_qty = forecasting_engine.recommend_order_quantity(
            product_id, current_stock, reorder_calc['reorder_point'], horizon_days=60
        )
        
        # Get recommended vendor
        vendor_products = get_vendor_products(product_id)
        vendor_perf = get_vendor_performance()
        recommended_vendor = vendor_selector.recommend_vendor(product_id, vendor_products, vendor_perf)
        
        if not recommended_vendor:
            raise HTTPException(status_code=400, detail="No vendor available for this product")
        
        # Create PO
        items = [{
            'product_id': product_id,
            'quantity': order_qty['recommended_quantity'],
            'unit_price': recommended_vendor['price']
        }]
        
        po_number = create_purchase_order(recommended_vendor['vendor_id'], items)
        
        if not po_number:
            raise HTTPException(status_code=500, detail="Error creating purchase order")
        
        return {
            "message": "Purchase order created successfully",
            "po_number": po_number,
            "vendor_id": recommended_vendor['vendor_id'],
            "total_amount": order_qty['recommended_quantity'] * recommended_vendor['price']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating PO: {str(e)}")


# ============================================
# V3 - RISK ASSESSMENT ENDPOINTS
# ============================================

@app.get("/api/v3/risk/po/{po_number}")
async def get_po_risk_assessment(po_number: str):
    """Get risk assessment for a purchase order"""
    try:
        po = get_po_details(po_number)
        if not po:
            raise HTTPException(status_code=404, detail="Purchase order not found")
        
        # Get vendor performance data
        vendor_perf = get_vendor_performance(po['VENDOR_ID'])
        
        # Predict delay probability
        risk_assessment = risk_predictor.predict_delay_probability(
            vendor_id=po['VENDOR_ID'],
            product_category='general',  # Would need to add category to products
            order_date=pd.to_datetime(po['CREATED_AT']),
            total_amount=po['TOTAL_AMOUNT']
        )
        
        # Estimate arrival range
        arrival_range = risk_predictor.estimate_arrival_range(
            vendor_id=po['VENDOR_ID'],
            expected_lead_time=14,
            vendor_performance=vendor_perf
        )
        
        # Calculate impact if delayed
        affected_jobs = []  # Would need to query jobs that depend on this PO
        impact = risk_predictor.calculate_impact_score(po_number, affected_jobs)
        
        return {
            'po_number': po_number,
            'delay_probability': risk_assessment['delay_probability'],
            'risk_level': risk_assessment['risk_level'],
            'confidence': risk_assessment['confidence'],
            'arrival_range': arrival_range,
            'impact': impact
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error assessing risk: {str(e)}")


@app.get("/api/v3/risk/at-risk-pos")
async def get_at_risk_pos():
    """Get list of high-risk purchase orders"""
    try:
        all_pos = get_all_pos()
        at_risk = []
        
        for po in all_pos:
            if po['STATUS'] in ['Closed', 'Received']:
                continue  # Skip completed POs
            
            vendor_perf = get_vendor_performance(po['VENDOR_ID'])
            
            risk_assessment = risk_predictor.predict_delay_probability(
                vendor_id=po['VENDOR_ID'],
                product_category='general',
                order_date=pd.to_datetime(po['CREATED_AT']),
                total_amount=po['TOTAL_AMOUNT']
            )
            
            if risk_assessment['risk_level'] in ['medium', 'high']:
                affected_jobs = []
                impact = risk_predictor.calculate_impact_score(po['PO_NUMBER'], affected_jobs)
                
                at_risk.append({
                    'po_number': po['PO_NUMBER'],
                    'vendor_name': po.get('VENDOR_NAME', ''),
                    'total_amount': po['TOTAL_AMOUNT'],
                    'status': po['STATUS'],
                    'risk_level': risk_assessment['risk_level'],
                    'delay_probability': risk_assessment['delay_probability'],
                    'impact_score': impact['impact_score']
                })
        
        # Sort by impact score descending
        at_risk.sort(key=lambda x: x['impact_score'], reverse=True)
        
        return at_risk[:10]  # Return top 10
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting at-risk POs: {str(e)}")


# ============================================
# V3 - JOBS ENDPOINTS
# ============================================

@app.get("/api/v3/jobs")
async def list_jobs(status: Optional[str] = None):
    """Get all jobs"""
    return get_all_jobs(status_filter=status)


@app.get("/api/v3/jobs/{job_id}")
async def get_job(job_id: str):
    """Get job details"""
    job = get_job_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@app.get("/api/v3/jobs/{job_id}/bom")
async def get_bom(job_id: str):
    """Get job BOM"""
    return get_job_bom(job_id)


# ============================================
# V3 - AI ASSISTANT ENDPOINTS (DISABLED)
# ============================================

# ============================================
# PROCUREMENT RULES & OPTIMIZATION INSIGHTS
# ============================================

@app.get("/api/rules")
async def list_rules():
    return get_all_rules()

@app.post("/api/rules")
async def create_rule(rule: RuleCreate):
    success = add_rule(
        rule.rule_id,
        rule.vendor_id,
        rule.product_id,
        rule.min_qty,
        rule.discount_pct,
        rule.notes
    )
    if not success:
        raise HTTPException(status_code=400, detail="Error creating rule")
    return {"message": "Rule created"}

@app.put("/api/rules/{rule_id}")
async def edit_rule(rule_id: str, rule: RuleCreate):
    success = update_rule(
        rule_id,
        rule.vendor_id,
        rule.product_id,
        rule.min_qty,
        rule.discount_pct,
        rule.notes
    )
    if not success:
        raise HTTPException(status_code=404, detail="Rule not found or could not be updated")
    return {"message": "Rule updated"}

@app.get("/api/optimization-insights/{vendor_id}/{product_id}")
async def get_insights(vendor_id: str, product_id: str):
    try:
        insights = get_optimization_insights(vendor_id, product_id)
        return insights
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
