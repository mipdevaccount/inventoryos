"""
Product repository with custom queries
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from db.models.product import Product
from db.repositories.base import BaseRepository


class ProductRepository(BaseRepository[Product]):
    """Product-specific database operations"""
    
    def __init__(self, db: Session):
        super().__init__(Product, db)
    
    def get_by_id(self, product_id: str) -> Optional[Product]:
        """Get product by ID"""
        return self.db.query(Product).filter(Product.product_id == product_id).first()
    
    def get_active(self) -> List[Product]:
        """Get all active products"""
        return self.db.query(Product).filter(Product.is_active == True).all()
    
    def search(self, query: str) -> List[Product]:
        """Search products by name or description"""
        search_term = f"%{query}%"
        return self.db.query(Product).filter(
            (Product.product_name.ilike(search_term)) |
            (Product.description.ilike(search_term))
        ).all()
    
    def get_low_stock(self, threshold: float = None) -> List[Product]:
        """Get products below reorder point"""
        query = self.db.query(Product).filter(Product.is_active == True)
        
        if threshold:
            query = query.filter(Product.current_stock < threshold)
        else:
            query = query.filter(Product.current_stock < Product.reorder_point)
        
        return query.all()
    
    def update_stock(self, product_id: str, quantity_change: float) -> Optional[Product]:
        """Update product stock level"""
        product = self.get_by_id(product_id)
        if product:
            product.current_stock += quantity_change
            self.db.commit()
            self.db.refresh(product)
        return product
