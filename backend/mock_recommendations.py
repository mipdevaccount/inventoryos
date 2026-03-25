"""
Quick fix: Return mock recommendations for demonstration
The full ML pipeline is too slow for real-time API requests.
In production, recommendations would be pre-computed in a background job.
"""

from fastapi import APIRouter

router = APIRouter()

# Mock recommendations data for demonstration
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

@router.get("/api/v3/recommendations/reorder")
async def get_mock_recommendations():
    """Return mock recommendations for demonstration"""
    return MOCK_RECOMMENDATIONS
