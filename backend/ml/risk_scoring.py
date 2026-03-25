"""
Risk Scoring and Prediction for Commander V3
Predicts delivery delays and calculates risk scores for purchase orders.
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import warnings
warnings.filterwarnings('ignore')


class RiskPredictor:
    """
    Predicts risk of PO delays using machine learning.
    Uses Random Forest classifier trained on historical delivery data.
    """
    
    def __init__(self):
        self.model = None
        self.label_encoders = {}
        self.is_trained = False
        
    def train(self, historical_pos: pd.DataFrame):
        """
        Train the risk prediction model on historical PO data.
        
        Args:
            historical_pos: DataFrame with columns:
                - VENDOR_ID
                - PRODUCT_CATEGORY
                - ORDERED_DATE
                - EXPECTED_DELIVERY_DATE
                - ACTUAL_DELIVERY_DATE
                - TOTAL_AMOUNT
                - IS_DELAYED (target variable)
        """
        if historical_pos.empty or len(historical_pos) < 20:
            print("Insufficient data for training (need at least 20 records)")
            return False
        
        try:
            df = historical_pos.copy()
            
            # Feature engineering
            df['order_month'] = pd.to_datetime(df['ORDERED_DATE']).dt.month
            df['order_day_of_week'] = pd.to_datetime(df['ORDERED_DATE']).dt.dayofweek
            df['order_amount_log'] = np.log1p(df['TOTAL_AMOUNT'])
            
            # Encode categorical variables
            for col in ['VENDOR_ID', 'PRODUCT_CATEGORY']:
                if col in df.columns:
                    le = LabelEncoder()
                    df[f'{col}_encoded'] = le.fit_transform(df[col].astype(str))
                    self.label_encoders[col] = le
            
            # Select features
            feature_cols = [
                'VENDOR_ID_encoded',
                'PRODUCT_CATEGORY_encoded',
                'order_month',
                'order_day_of_week',
                'order_amount_log'
            ]
            
            X = df[feature_cols]
            y = df['IS_DELAYED'].astype(int)
            
            # Train Random Forest
            self.model = RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                random_state=42,
                class_weight='balanced'
            )
            self.model.fit(X, y)
            self.is_trained = True
            
            return True
            
        except Exception as e:
            print(f"Training error: {e}")
            return False
    
    def predict_delay_probability(
        self,
        vendor_id: str,
        product_category: str,
        order_date: datetime,
        total_amount: float
    ) -> Dict:
        """
        Predict probability of delay for a new PO.
        
        Returns:
            Dict with delay probability and risk level
        """
        if not self.is_trained:
            # Return default risk assessment
            return {
                'delay_probability': 0.3,
                'risk_level': 'medium',
                'confidence': 'low',
                'message': 'Model not trained, using default risk assessment'
            }
        
        try:
            # Prepare features
            features = {
                'order_month': order_date.month,
                'order_day_of_week': order_date.weekday(),
                'order_amount_log': np.log1p(total_amount)
            }
            
            # Encode categoricals
            for col in ['VENDOR_ID', 'PRODUCT_CATEGORY']:
                if col in self.label_encoders:
                    le = self.label_encoders[col]
                    value = vendor_id if col == 'VENDOR_ID' else product_category
                    
                    # Handle unseen categories
                    if value in le.classes_:
                        features[f'{col}_encoded'] = le.transform([value])[0]
                    else:
                        features[f'{col}_encoded'] = -1  # Unknown category
            
            # Create feature vector
            X = pd.DataFrame([features])
            
            # Predict
            prob = self.model.predict_proba(X)[0][1]  # Probability of delay
            
            # Determine risk level
            if prob < 0.3:
                risk_level = 'low'
            elif prob < 0.6:
                risk_level = 'medium'
            else:
                risk_level = 'high'
            
            return {
                'delay_probability': round(prob, 3),
                'risk_level': risk_level,
                'confidence': 'high'
            }
            
        except Exception as e:
            return {
                'delay_probability': 0.3,
                'risk_level': 'medium',
                'confidence': 'low',
                'error': str(e)
            }
    
    def estimate_arrival_range(
        self,
        vendor_id: str,
        expected_lead_time: int,
        vendor_performance: pd.DataFrame
    ) -> Dict:
        """
        Estimate delivery date range based on vendor history.
        
        Returns:
            Dict with earliest, expected, and latest delivery dates
        """
        if vendor_performance.empty:
            # Use expected lead time with buffer
            today = datetime.now()
            return {
                'earliest': (today + timedelta(days=expected_lead_time - 3)).strftime('%Y-%m-%d'),
                'expected': (today + timedelta(days=expected_lead_time)).strftime('%Y-%m-%d'),
                'latest': (today + timedelta(days=expected_lead_time + 5)).strftime('%Y-%m-%d'),
                'confidence': 'low'
            }
        
        # Filter to vendor
        vendor_data = vendor_performance[vendor_performance['VENDOR_ID'] == vendor_id]
        
        if vendor_data.empty:
            today = datetime.now()
            return {
                'earliest': (today + timedelta(days=expected_lead_time - 3)).strftime('%Y-%m-%d'),
                'expected': (today + timedelta(days=expected_lead_time)).strftime('%Y-%m-%d'),
                'latest': (today + timedelta(days=expected_lead_time + 5)).strftime('%Y-%m-%d'),
                'confidence': 'low'
            }
        
        # Calculate actual lead times
        vendor_data['actual_lead_time'] = (
            pd.to_datetime(vendor_data['RECEIVED_DATE']) - 
            pd.to_datetime(vendor_data['ORDERED_DATE'])
        ).dt.days
        
        # Statistics
        mean_lt = vendor_data['actual_lead_time'].mean()
        std_lt = vendor_data['actual_lead_time'].std()
        
        today = datetime.now()
        
        return {
            'earliest': (today + timedelta(days=int(mean_lt - std_lt))).strftime('%Y-%m-%d'),
            'expected': (today + timedelta(days=int(mean_lt))).strftime('%Y-%m-%d'),
            'latest': (today + timedelta(days=int(mean_lt + std_lt))).strftime('%Y-%m-%d'),
            'confidence': 'high' if len(vendor_data) >= 10 else 'medium'
        }
    
    def calculate_impact_score(
        self,
        po_number: str,
        affected_jobs: List[Dict]
    ) -> Dict:
        """
        Calculate impact score if PO is delayed.
        
        Args:
            po_number: PO identifier
            affected_jobs: List of jobs that depend on this PO
            
        Returns:
            Dict with impact score and affected jobs summary
        """
        if not affected_jobs:
            return {
                'impact_score': 0,
                'affected_jobs_count': 0,
                'high_priority_count': 0,
                'total_margin_at_risk': 0
            }
        
        high_priority = sum(1 for j in affected_jobs if j.get('priority') == 'high')
        total_margin = sum(j.get('margin', 0) for j in affected_jobs)
        
        # Impact score: weighted combination
        impact_score = (
            len(affected_jobs) * 10 +  # Base impact per job
            high_priority * 30 +  # Higher weight for priority jobs
            (total_margin / 1000)  # Margin impact
        )
        
        return {
            'impact_score': round(impact_score, 2),
            'affected_jobs_count': len(affected_jobs),
            'high_priority_count': high_priority,
            'total_margin_at_risk': round(total_margin, 2),
            'severity': 'high' if impact_score > 100 else 'medium' if impact_score > 50 else 'low'
        }
