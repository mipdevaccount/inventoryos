"""
Recommendation repository for cached ML predictions
"""
from typing import List, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_
from db.models.recommendation import ReorderRecommendation
from db.repositories.base import BaseRepository


class RecommendationRepository(BaseRepository[ReorderRecommendation]):
    """Recommendation cache operations"""
    
    def __init__(self, db: Session):
        super().__init__(ReorderRecommendation, db)
    
    def get_active_recommendations(self) -> List[ReorderRecommendation]:
        """Get all non-expired recommendations"""
        now = datetime.now()
        return self.db.query(ReorderRecommendation).filter(
            ReorderRecommendation.expires_at > now
        ).all()
    
    def get_by_product(self, product_id: str) -> Optional[ReorderRecommendation]:
        """Get latest recommendation for a product"""
        now = datetime.now()
        return self.db.query(ReorderRecommendation).filter(
            and_(
                ReorderRecommendation.product_id == product_id,
                ReorderRecommendation.expires_at > now
            )
        ).order_by(ReorderRecommendation.computed_at.desc()).first()
    
    def save_recommendation(
        self,
        product_id: str,
        recommended_quantity: float,
        confidence_score: float,
        reason: str,
        recommended_vendor_id: str,
        unit_price: float,
        days_until_stockout: int,
        ttl_hours: int = 6
    ) -> ReorderRecommendation:
        """Save or update recommendation"""
        # Delete old recommendations for this product
        self.db.query(ReorderRecommendation).filter(
            ReorderRecommendation.product_id == product_id
        ).delete()
        
        # Create new recommendation
        now = datetime.now()
        rec = ReorderRecommendation(
            product_id=product_id,
            recommended_quantity=recommended_quantity,
            confidence_score=confidence_score,
            reason=reason,
            recommended_vendor_id=recommended_vendor_id,
            unit_price=unit_price,
            days_until_stockout=days_until_stockout,
            computed_at=now,
            expires_at=now + timedelta(hours=ttl_hours)
        )
        
        self.db.add(rec)
        self.db.commit()
        self.db.refresh(rec)
        return rec
    
    def cleanup_expired(self) -> int:
        """Delete expired recommendations"""
        now = datetime.now()
        count = self.db.query(ReorderRecommendation).filter(
            ReorderRecommendation.expires_at <= now
        ).delete()
        self.db.commit()
        return count
