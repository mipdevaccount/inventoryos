"""
Reorder recommendation cache model
"""
from sqlalchemy import Column, String, Numeric, Integer, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from db.models.base import BaseModel, TimestampMixin


class ReorderRecommendation(BaseModel, TimestampMixin):
    __tablename__ = "reorder_recommendations"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(String(50), ForeignKey("products.product_id"), nullable=False)
    recommended_quantity = Column(Numeric(10, 2), nullable=False)
    confidence_score = Column(Numeric(3, 2), nullable=False)
    reason = Column(Text)
    recommended_vendor_id = Column(String(50), ForeignKey("vendors.vendor_id"))
    unit_price = Column(Numeric(10, 2))
    days_until_stockout = Column(Integer)
    computed_at = Column(DateTime(timezone=True), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    
    # Relationships
    product = relationship("Product")
    vendor = relationship("Vendor")
    
    # Indexes
    __table_args__ = (
        Index('idx_product', 'product_id'),
        Index('idx_expires', 'expires_at'),
    )
    
    def __repr__(self):
        return f"<ReorderRecommendation {self.id}: {self.product_id}>"
