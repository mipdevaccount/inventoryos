"""
Repositories package
"""
from db.repositories.base import BaseRepository
from db.repositories.product import ProductRepository
from db.repositories.recommendation import RecommendationRepository

__all__ = [
    "BaseRepository",
    "ProductRepository",
    "RecommendationRepository",
]
