"""
Vendor model
"""
from sqlalchemy import Column, String, Text, Boolean
from db.models.base import BaseModel, TimestampMixin


class Vendor(BaseModel, TimestampMixin):
    __tablename__ = "vendors"
    
    vendor_id = Column(String(50), primary_key=True)
    vendor_name = Column(String(255), nullable=False)
    contact_name = Column(String(255))
    email = Column(String(255))
    phone = Column(String(50))
    address = Column(Text)
    is_active = Column(Boolean, default=True)
    
    def __repr__(self):
        return f"<Vendor {self.vendor_id}: {self.vendor_name}>"
