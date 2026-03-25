"""
Job and BOM models
"""
from sqlalchemy import Column, String, Date, Numeric, Integer, Text, ForeignKey
from sqlalchemy.orm import relationship
from db.models.base import BaseModel, TimestampMixin


class Job(BaseModel, TimestampMixin):
    __tablename__ = "jobs"
    
    job_id = Column(String(50), primary_key=True)
    job_type = Column(String(100))
    priority = Column(String(20))
    due_date = Column(Date)
    margin = Column(Numeric(12, 2))
    status = Column(String(50))
    chassis = Column(String(100))
    customer = Column(String(255))
    
    # Relationships
    bom_items = relationship("BOMItem", back_populates="job", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Job {self.job_id}: {self.job_type}>"


class BOMItem(BaseModel, TimestampMixin):
    __tablename__ = "bom"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    job_id = Column(String(50), ForeignKey("jobs.job_id"), nullable=False)
    product_id = Column(String(50), ForeignKey("products.product_id"), nullable=False)
    quantity_required = Column(Numeric(10, 2), nullable=False)
    quantity_allocated = Column(Numeric(10, 2), default=0)
    notes = Column(Text)
    
    # Relationships
    job = relationship("Job", back_populates="bom_items")
    product = relationship("Product")
    
    def __repr__(self):
        return f"<BOMItem {self.id}: Job {self.job_id} - {self.product_id}>"
