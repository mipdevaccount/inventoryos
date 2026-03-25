"""
Purchase Order models
"""
from sqlalchemy import Column, String, Numeric, ForeignKey, Integer
from sqlalchemy.orm import relationship
from db.models.base import BaseModel, TimestampMixin


class PurchaseOrder(BaseModel, TimestampMixin):
    __tablename__ = "purchase_orders"
    
    po_number = Column(String(50), primary_key=True)
    vendor_id = Column(String(50), ForeignKey("vendors.vendor_id"), nullable=False)
    status = Column(String(50), default="Draft")
    total_amount = Column(Numeric(12, 2))
    
    # Relationships
    items = relationship("POItem", back_populates="purchase_order", cascade="all, delete-orphan")
    vendor = relationship("Vendor")
    
    def __repr__(self):
        return f"<PurchaseOrder {self.po_number}: {self.status}>"


class POItem(BaseModel, TimestampMixin):
    __tablename__ = "po_items"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    po_number = Column(String(50), ForeignKey("purchase_orders.po_number"), nullable=False)
    product_id = Column(String(50), ForeignKey("products.product_id"), nullable=False)
    quantity = Column(Numeric(10, 2), nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    
    # Relationships
    purchase_order = relationship("PurchaseOrder", back_populates="items")
    product = relationship("Product")
    
    def __repr__(self):
        return f"<POItem {self.id}: {self.product_id} x {self.quantity}>"
