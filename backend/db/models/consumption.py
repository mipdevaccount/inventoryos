"""
Consumption history model
"""
from sqlalchemy import Column, String, Date, Numeric, Integer, ForeignKey, Index
from sqlalchemy.orm import relationship
from db.models.base import BaseModel, TimestampMixin


class ConsumptionHistory(BaseModel, TimestampMixin):
    __tablename__ = "consumption_history"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(String(50), ForeignKey("products.product_id"), nullable=False)
    job_id = Column(String(50), ForeignKey("jobs.job_id"), nullable=False)
    date = Column(Date, nullable=False)
    quantity = Column(Numeric(10, 2), nullable=False)
    shift = Column(String(50))
    team = Column(String(50))
    
    # Relationships
    product = relationship("Product")
    job = relationship("Job")
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_product_date', 'product_id', 'date'),
        Index('idx_job', 'job_id'),
    )
    
    def __repr__(self):
        return f"<ConsumptionHistory {self.id}: {self.product_id} on {self.date}>"
