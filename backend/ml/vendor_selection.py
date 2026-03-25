"""
Vendor Selection Algorithm for Commander V3
Multi-criteria vendor scoring and recommendation system.
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional
from datetime import datetime, timedelta


class VendorSelector:
    """
    Intelligent vendor selection based on multiple criteria:
    - Price competitiveness
    - Historical lead time performance
    - Quality scores
    - Current availability
    """
    
    def __init__(self):
        self.weights = {
            'price': 0.4,
            'lead_time': 0.3,
            'quality': 0.2,
            'reliability': 0.1
        }
    
    def score_vendors(
        self,
        product_id: str,
        vendor_products: List[Dict],
        vendor_performance: pd.DataFrame,
        urgency: str = 'normal'
    ) -> List[Dict]:
        """
        Score all vendors for a given product.
        
        Args:
            product_id: Product identifier
            vendor_products: List of vendor-product pricing records
            vendor_performance: Historical performance data
            urgency: 'low', 'normal', 'high' - adjusts weight on lead time
            
        Returns:
            List of vendors with scores, sorted by total score (descending)
        """
        if not vendor_products:
            return []
        
        # Adjust weights based on urgency
        weights = self.weights.copy()
        if urgency == 'high':
            weights['lead_time'] = 0.5
            weights['price'] = 0.2
        elif urgency == 'low':
            weights['price'] = 0.6
            weights['lead_time'] = 0.1
        
        scored_vendors = []
        
        for vp in vendor_products:
            vendor_id = vp['VENDOR_ID']
            
            # Price score (lower is better, normalize to 0-1)
            prices = [v['PRICE'] for v in vendor_products]
            min_price = min(prices)
            price_score = min_price / vp['PRICE'] if vp['PRICE'] > 0 else 0
            
            # Lead time score
            lead_time_score = self._calculate_lead_time_score(
                vendor_id, 
                vp.get('LEAD_TIME_DAYS', 14),
                vendor_performance
            )
            
            # Quality score
            quality_score = self._calculate_quality_score(vendor_id, vendor_performance)
            
            # Reliability score (on-time delivery)
            reliability_score = self._calculate_reliability_score(vendor_id, vendor_performance)
            
            # Weighted total
            total_score = (
                price_score * weights['price'] +
                lead_time_score * weights['lead_time'] +
                quality_score * weights['quality'] +
                reliability_score * weights['reliability']
            )
            
            scored_vendors.append({
                'vendor_id': vendor_id,
                'vendor_name': vp.get('VENDOR_NAME', vendor_id),
                'price': vp['PRICE'],
                'lead_time_days': vp.get('LEAD_TIME_DAYS', 14),
                'total_score': round(total_score, 3),
                'price_score': round(price_score, 3),
                'lead_time_score': round(lead_time_score, 3),
                'quality_score': round(quality_score, 3),
                'reliability_score': round(reliability_score, 3)
            })
        
        # Sort by total score descending
        scored_vendors.sort(key=lambda x: x['total_score'], reverse=True)
        
        return scored_vendors
    
    def recommend_vendor(
        self,
        product_id: str,
        vendor_products: List[Dict],
        vendor_performance: pd.DataFrame,
        urgency: str = 'normal'
    ) -> Optional[Dict]:
        """
        Recommend the best vendor for a product.
        
        Returns:
            Top-scored vendor or None if no vendors available
        """
        scored = self.score_vendors(product_id, vendor_products, vendor_performance, urgency)
        return scored[0] if scored else None
    
    def predict_lead_time(
        self,
        vendor_id: str,
        product_id: str,
        vendor_performance: pd.DataFrame
    ) -> Dict:
        """
        Predict lead time for a vendor-product combination using historical data.
        
        Returns:
            Dict with predicted lead time, confidence interval
        """
        if vendor_performance.empty:
            return {
                'predicted_days': 14,
                'confidence_lower': 10,
                'confidence_upper': 20,
                'confidence': 'low'
            }
        
        # Filter to this vendor
        vendor_data = vendor_performance[vendor_performance['VENDOR_ID'] == vendor_id]
        
        if vendor_data.empty:
            return {
                'predicted_days': 14,
                'confidence_lower': 10,
                'confidence_upper': 20,
                'confidence': 'low'
            }
        
        # Calculate actual lead times
        vendor_data['actual_lead_time'] = (
            pd.to_datetime(vendor_data['RECEIVED_DATE']) - 
            pd.to_datetime(vendor_data['ORDERED_DATE'])
        ).dt.days
        
        # Statistics
        mean_lead_time = vendor_data['actual_lead_time'].mean()
        std_lead_time = vendor_data['actual_lead_time'].std()
        
        # Confidence based on sample size
        n_samples = len(vendor_data)
        if n_samples >= 10:
            confidence = 'high'
        elif n_samples >= 5:
            confidence = 'medium'
        else:
            confidence = 'low'
        
        return {
            'predicted_days': int(round(mean_lead_time)),
            'confidence_lower': int(round(mean_lead_time - std_lead_time)),
            'confidence_upper': int(round(mean_lead_time + std_lead_time)),
            'confidence': confidence,
            'sample_size': n_samples
        }
    
    def _calculate_lead_time_score(
        self,
        vendor_id: str,
        stated_lead_time: int,
        performance: pd.DataFrame
    ) -> float:
        """Calculate lead time score (shorter is better)."""
        if performance.empty:
            # Use stated lead time, normalize to 0-1 (assume max 60 days)
            return max(0, 1 - (stated_lead_time / 60))
        
        vendor_data = performance[performance['VENDOR_ID'] == vendor_id]
        if vendor_data.empty:
            return max(0, 1 - (stated_lead_time / 60))
        
        # Use actual historical lead time
        vendor_data['actual_lead_time'] = (
            pd.to_datetime(vendor_data['RECEIVED_DATE']) - 
            pd.to_datetime(vendor_data['ORDERED_DATE'])
        ).dt.days
        
        avg_lead_time = vendor_data['actual_lead_time'].mean()
        return max(0, 1 - (avg_lead_time / 60))
    
    def _calculate_quality_score(self, vendor_id: str, performance: pd.DataFrame) -> float:
        """Calculate quality score from historical data."""
        if performance.empty or 'QUALITY_SCORE' not in performance.columns:
            return 0.7  # Neutral default
        
        vendor_data = performance[performance['VENDOR_ID'] == vendor_id]
        if vendor_data.empty:
            return 0.7
        
        # Quality score should be 0-1 in data
        return vendor_data['QUALITY_SCORE'].mean()
    
    def _calculate_reliability_score(self, vendor_id: str, performance: pd.DataFrame) -> float:
        """Calculate on-time delivery reliability."""
        if performance.empty:
            return 0.7  # Neutral default
        
        vendor_data = performance[performance['VENDOR_ID'] == vendor_id]
        if vendor_data.empty:
            return 0.7
        
        # Calculate on-time percentage
        vendor_data['actual_lead_time'] = (
            pd.to_datetime(vendor_data['RECEIVED_DATE']) - 
            pd.to_datetime(vendor_data['ORDERED_DATE'])
        ).dt.days
        
        # On-time if within expected lead time + 2 days buffer
        vendor_data['on_time'] = vendor_data['actual_lead_time'] <= (vendor_data.get('EXPECTED_LEAD_TIME', 14) + 2)
        
        return vendor_data['on_time'].mean() if 'on_time' in vendor_data.columns else 0.7
