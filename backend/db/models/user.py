"""
User and Session models for authentication
"""
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from db.models.base import BaseModel, TimestampMixin
from datetime import datetime


class User(BaseModel, TimestampMixin):
    __tablename__ = "users"
    
    user_id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255))
    role = Column(String(50), default="user", nullable=False)  # admin, office, shop_floor, read_only
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime(timezone=True))
    
    # Relationships
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User {self.email} ({self.role})>"


class Session(BaseModel):
    __tablename__ = "sessions"
    
    session_id = Column(String(255), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="sessions")
    
    def __repr__(self):
        return f"<Session {self.session_id} for user {self.user_id}>"
