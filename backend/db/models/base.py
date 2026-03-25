"""
Base model with common fields and utilities
"""
from sqlalchemy import Column, DateTime
from sqlalchemy.sql import func
from db.database import Base


class TimestampMixin:
    """Mixin to add created_at and updated_at timestamps"""
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class BaseModel(Base):
    """Abstract base model with common functionality"""
    __abstract__ = True
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}
