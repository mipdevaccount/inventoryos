"""
Vendor performance tracking model
"""
from sqlalchemy import Column, String, Date, Numeric, Boolean, Integer, ForeignKey, Index
from sqlalchemy.orm import relationship
from db.models.base import BaseModel, TimestampMixin


class VendorPerformance(BaseModel, TimestampMixin):
    __tablename__ = "vendor_performance"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    vendor_id = Column(String(50), ForeignKey("vendors.vendor_id"), nullable=False)
    po_number = Column(String(50))
    product_category = Column(String(100))
    ordered_date = Column(Date)
    expected_delivery_date = Column(Date)
    received_date = Column(Date)
    quality_score = Column(Numeric(3, 2))
    is_delayed = Column(Boolean)
    
    # Relationships
    vendor = relationship("Vendor")
    
    # Indexes
    __table_args__ = (
        Index('idx_vendor', 'vendor_id'),
        Index('idx_po', 'po_number'),
    )
    
    def __repr__(self):
        return f"<VendorPerformance {self.id}: {self.vendor_id} - {self.po_number}>"
