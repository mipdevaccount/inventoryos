"""
Product model
"""
from sqlalchemy import Column, String, Text, Boolean, Numeric
from db.models.base import BaseModel, TimestampMixin


class Product(BaseModel, TimestampMixin):
    __tablename__ = "products"
    
    product_id = Column(String(50), primary_key=True)
    product_name = Column(String(255), nullable=False)
    description = Column(Text)
    location = Column(String(100))
    unit_of_measure = Column(String(50), default="each")
    current_stock = Column(Numeric(10, 2), default=0)
    reorder_point = Column(Numeric(10, 2))
    is_active = Column(Boolean, default=True)
    
    def __repr__(self):
        return f"<Product {self.product_id}: {self.product_name}>"
