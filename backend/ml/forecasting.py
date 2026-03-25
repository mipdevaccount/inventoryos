"""
Forecasting Engine for Commander V3
Provides time series forecasting and consumption prediction for inventory management.
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from prophet import Prophet
import warnings
warnings.filterwarnings('ignore')


class ForecastingEngine:
    """
    Handles consumption forecasting and reorder recommendations.
    Uses Facebook Prophet for time series forecasting with seasonality detection.
    """
    
    def __init__(self):
        self.models = {}  # Cache trained models per product
        
    def predict_consumption(
        self, 
        product_id: str, 
        historical_data: pd.DataFrame,
        horizon_days: int = 30
    ) -> Dict:
        """
        Predict future consumption for a product.
        
        Args:
            product_id: Product identifier
            historical_data: DataFrame with columns ['date', 'quantity']
            horizon_days: Number of days to forecast
            
        Returns:
            Dict with predictions, confidence intervals, and metrics
        """
        if historical_data.empty or len(historical_data) < 14:
            return {
                'predictions': [],
                'total_predicted': 0,
                'confidence_score': 0.0,
                'error': 'Insufficient historical data (need at least 14 days)'
            }
        
        try:
            # Prepare data for Prophet
            df = historical_data.copy()
            df.columns = ['ds', 'y']  # Prophet requires these column names
            df['ds'] = pd.to_datetime(df['ds'])
            
            # Train model
            model = Prophet(
                daily_seasonality=True,
                weekly_seasonality=True,
                yearly_seasonality=False,  # Not enough data typically
                changepoint_prior_scale=0.05  # Conservative changepoint detection
            )
            model.fit(df)
            
            # Make predictions
            future = model.make_future_dataframe(periods=horizon_days)
            forecast = model.predict(future)
            
            # Extract future predictions only
            future_forecast = forecast.tail(horizon_days)
            
            # Calculate confidence score based on uncertainty width
            avg_uncertainty = (future_forecast['yhat_upper'] - future_forecast['yhat_lower']).mean()
            avg_prediction = future_forecast['yhat'].mean()
            confidence_score = max(0.0, min(1.0, 1.0 - (avg_uncertainty / (avg_prediction + 1))))
            
            # Cache model
            self.models[product_id] = model
            
            return {
                'predictions': future_forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].to_dict('records'),
                'total_predicted': max(0, future_forecast['yhat'].sum()),
                'confidence_score': round(confidence_score, 2),
                'avg_daily_consumption': round(future_forecast['yhat'].mean(), 2),
                'peak_day': future_forecast.loc[future_forecast['yhat'].idxmax(), 'ds'].strftime('%Y-%m-%d')
            }
            
        except Exception as e:
            return {
                'predictions': [],
                'total_predicted': 0,
                'confidence_score': 0.0,
                'error': f'Forecasting error: {str(e)}'
            }
    
    def calculate_reorder_point(
        self,
        product_id: str,
        current_stock: float,
        lead_time_days: int,
        safety_factor: float = 1.5
    ) -> Dict:
        """
        Calculate dynamic reorder point based on forecasted consumption.
        
        Args:
            product_id: Product identifier
            current_stock: Current inventory level
            lead_time_days: Vendor lead time in days
            safety_factor: Multiplier for safety stock (default 1.5)
            
        Returns:
            Dict with reorder point, safety stock, and recommendation
        """
        # Get forecast for lead time period
        if product_id not in self.models:
            return {
                'reorder_point': 0,
                'safety_stock': 0,
                'should_reorder': False,
                'error': 'No forecast model available'
            }
        
        model = self.models[product_id]
        future = model.make_future_dataframe(periods=lead_time_days)
        forecast = model.predict(future)
        lead_time_forecast = forecast.tail(lead_time_days)
        
        # Expected consumption during lead time
        expected_consumption = max(0, lead_time_forecast['yhat'].sum())
        
        # Safety stock based on forecast uncertainty
        uncertainty = (lead_time_forecast['yhat_upper'] - lead_time_forecast['yhat_lower']).sum()
        safety_stock = uncertainty * safety_factor
        
        # Reorder point
        reorder_point = expected_consumption + safety_stock
        
        return {
            'reorder_point': round(reorder_point, 2),
            'safety_stock': round(safety_stock, 2),
            'expected_consumption': round(expected_consumption, 2),
            'should_reorder': current_stock < reorder_point,
            'days_until_stockout': self._estimate_stockout_days(current_stock, lead_time_forecast)
        }
    
    def recommend_order_quantity(
        self,
        product_id: str,
        current_stock: float,
        reorder_point: float,
        horizon_days: int = 60
    ) -> Dict:
        """
        Recommend optimal order quantity using Economic Order Quantity (EOQ) principles
        adjusted with forecast data.
        
        Args:
            product_id: Product identifier
            current_stock: Current inventory level
            reorder_point: Calculated reorder point
            horizon_days: Planning horizon
            
        Returns:
            Dict with recommended order quantity and reasoning
        """
        if product_id not in self.models:
            return {
                'recommended_quantity': 0,
                'error': 'No forecast model available'
            }
        
        model = self.models[product_id]
        future = model.make_future_dataframe(periods=horizon_days)
        forecast = model.predict(future)
        horizon_forecast = forecast.tail(horizon_days)
        
        # Total expected consumption over horizon
        total_consumption = max(0, horizon_forecast['yhat'].sum())
        
        # Recommended quantity: cover horizon minus current stock
        recommended_qty = max(0, total_consumption - current_stock + reorder_point)
        
        return {
            'recommended_quantity': round(recommended_qty, 2),
            'covers_days': horizon_days,
            'expected_consumption': round(total_consumption, 2),
            'reasoning': f'Covers {horizon_days} days of forecasted consumption with safety buffer'
        }
    
    def explain_recommendation(
        self,
        product_id: str,
        upcoming_jobs: List[Dict] = None
    ) -> str:
        """
        Generate natural language explanation for reorder recommendation.
        
        Args:
            product_id: Product identifier
            upcoming_jobs: List of upcoming jobs using this product
            
        Returns:
            Human-readable explanation string
        """
        if product_id not in self.models:
            return "No forecast data available for this product."
        
        explanation_parts = []
        
        # Add job-based reasoning if available
        if upcoming_jobs and len(upcoming_jobs) > 0:
            high_priority_jobs = [j for j in upcoming_jobs if j.get('priority') == 'high']
            if high_priority_jobs:
                explanation_parts.append(
                    f"{len(high_priority_jobs)} high-priority job(s) scheduled in next 4 weeks"
                )
        
        # Add consumption trend
        model = self.models[product_id]
        future = model.make_future_dataframe(periods=30)
        forecast = model.predict(future)
        recent_trend = forecast.tail(30)['yhat'].mean()
        
        if recent_trend > 0:
            explanation_parts.append(f"Average daily consumption trending at {recent_trend:.1f} units")
        
        return ". ".join(explanation_parts) if explanation_parts else "Based on historical consumption patterns"
    
    def _estimate_stockout_days(self, current_stock: float, forecast: pd.DataFrame) -> int:
        """Estimate days until stockout based on forecast."""
        cumulative = 0
        for idx, row in forecast.iterrows():
            cumulative += max(0, row['yhat'])
            if cumulative >= current_stock:
                return idx + 1
        return len(forecast)  # Won't run out in forecast period
