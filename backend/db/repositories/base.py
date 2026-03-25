"""
Repository pattern for database access
Base repository with common CRUD operations
"""
from typing import TypeVar, Generic, Type, List, Optional
from sqlalchemy.orm import Session
from db.models.base import BaseModel

ModelType = TypeVar("ModelType", bound=BaseModel)


class BaseRepository(Generic[ModelType]):
    """Base repository with common database operations"""
    
    def __init__(self, model: Type[ModelType], db: Session):
        self.model = model
        self.db = db
    
    def get(self, id: any) -> Optional[ModelType]:
        """Get single record by ID"""
        return self.db.query(self.model).filter(
            self.model.__table__.primary_key.columns.values()[0] == id
        ).first()
    
    def get_all(self, skip: int = 0, limit: int = 100) -> List[ModelType]:
        """Get all records with pagination"""
        return self.db.query(self.model).offset(skip).limit(limit).all()
    
    def create(self, obj: ModelType) -> ModelType:
        """Create new record"""
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj
    
    def update(self, obj: ModelType) -> ModelType:
        """Update existing record"""
        self.db.commit()
        self.db.refresh(obj)
        return obj
    
    def delete(self, id: any) -> bool:
        """Delete record by ID"""
        obj = self.get(id)
        if obj:
            self.db.delete(obj)
            self.db.commit()
            return True
        return False
    
    def count(self) -> int:
        """Count total records"""
        return self.db.query(self.model).count()
