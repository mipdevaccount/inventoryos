"""
V3 Data Access Functions
Functions for jobs, BOM, consumption history, and vendor performance tracking.
"""

import pandas as pd
import os
from datetime import datetime
from typing import Optional, Dict, List
import sys

# Add parent directory to path to import from utils
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.csv_data import file_lock, DATA_DIR

# File paths
JOBS_FILE = os.path.join(DATA_DIR, 'jobs.csv')
BOM_FILE = os.path.join(DATA_DIR, 'bom.csv')
CONSUMPTION_HISTORY_FILE = os.path.join(DATA_DIR, 'consumption_history.csv')
VENDOR_PERFORMANCE_FILE = os.path.join(DATA_DIR, 'vendor_performance.csv')
QUALITY_EVENTS_FILE = os.path.join(DATA_DIR, 'quality_events.csv')


# ============================================
# JOBS FUNCTIONS
# ============================================

def _read_jobs() -> pd.DataFrame:
    """Read jobs CSV file"""
    if not os.path.exists(JOBS_FILE):
        return pd.DataFrame(columns=[
            'JOB_ID', 'JOB_TYPE', 'PRIORITY', 'DUE_DATE', 'MARGIN', 
            'STATUS', 'CREATED_AT', 'CHASSIS', 'CUSTOMER'
        ])
    df = pd.read_csv(JOBS_FILE)
    df['DUE_DATE'] = pd.to_datetime(df['DUE_DATE'])
    df['CREATED_AT'] = pd.to_datetime(df['CREATED_AT'])
    return df


def _write_jobs(df: pd.DataFrame):
    """Write jobs CSV file with locking"""
    with file_lock(JOBS_FILE):
        df.to_csv(JOBS_FILE, index=False)


def get_all_jobs(status_filter: str = None) -> List[Dict]:
    """Get all jobs, optionally filtered by status"""
    df = _read_jobs()
    if df.empty:
        return []
    
    if status_filter:
        df = df[df['STATUS'] == status_filter]
    
    df = df.fillna('')
    return df.to_dict(orient="records")


def get_job_by_id(job_id: str) -> Optional[Dict]:
    """Get a single job by ID"""
    df = _read_jobs()
    if df.empty:
        return None
    
    job = df[df['JOB_ID'] == job_id]
    if job.empty:
        return None
    
    result = job.iloc[0].to_dict()
    return {k: (v if pd.notna(v) else '') for k, v in result.items()}


def create_job(job_id: str, job_type: str, priority: str, due_date: str,
               margin: float, chassis: str = '', customer: str = '') -> bool:
    """Create a new job"""
    try:
        df = _read_jobs()
        
        if not df.empty and job_id in df['JOB_ID'].values:
            return False
        
        new_job = pd.DataFrame([{
            'JOB_ID': job_id,
            'JOB_TYPE': job_type,
            'PRIORITY': priority,
            'DUE_DATE': due_date,
            'MARGIN': margin,
            'STATUS': 'planning',
            'CREATED_AT': datetime.now(),
            'CHASSIS': chassis,
            'CUSTOMER': customer
        }])
        
        df = pd.concat([df, new_job], ignore_index=True)
        _write_jobs(df)
        
        return True
    except Exception as e:
        print(f"Error creating job: {e}")
        return False


# ============================================
# BOM FUNCTIONS
# ============================================

def _read_bom() -> pd.DataFrame:
    """Read BOM CSV file"""
    if not os.path.exists(BOM_FILE):
        return pd.DataFrame(columns=[
            'JOB_ID', 'PRODUCT_ID', 'QUANTITY_REQUIRED', 'QUANTITY_ALLOCATED', 'NOTES'
        ])
    return pd.read_csv(BOM_FILE)


def _write_bom(df: pd.DataFrame):
    """Write BOM CSV file with locking"""
    with file_lock(BOM_FILE):
        df.to_csv(BOM_FILE, index=False)


def get_job_bom(job_id: str) -> List[Dict]:
    """Get BOM for a specific job"""
    df = _read_bom()
    if df.empty:
        return []
    
    bom = df[df['JOB_ID'] == job_id]
    if bom.empty:
        return []
    
    bom = bom.fillna('')
    return bom.to_dict(orient="records")


def add_bom_item(job_id: str, product_id: str, quantity_required: float, notes: str = '') -> bool:
    """Add an item to a job's BOM"""
    try:
        df = _read_bom()
        
        new_item = pd.DataFrame([{
            'JOB_ID': job_id,
            'PRODUCT_ID': product_id,
            'QUANTITY_REQUIRED': quantity_required,
            'QUANTITY_ALLOCATED': 0,
            'NOTES': notes
        }])
        
        df = pd.concat([df, new_item], ignore_index=True)
        _write_bom(df)
        
        return True
    except Exception as e:
        print(f"Error adding BOM item: {e}")
        return False


# ============================================
# CONSUMPTION HISTORY FUNCTIONS
# ============================================

def _read_consumption_history() -> pd.DataFrame:
    """Read consumption history CSV file"""
    if not os.path.exists(CONSUMPTION_HISTORY_FILE):
        return pd.DataFrame(columns=[
            'PRODUCT_ID', 'JOB_ID', 'DATE', 'QUANTITY', 'SHIFT', 'TEAM'
        ])
    df = pd.read_csv(CONSUMPTION_HISTORY_FILE)
    df['DATE'] = pd.to_datetime(df['DATE'])
    return df


def _write_consumption_history(df: pd.DataFrame):
    """Write consumption history CSV file with locking"""
    with file_lock(CONSUMPTION_HISTORY_FILE):
        df.to_csv(CONSUMPTION_HISTORY_FILE, index=False)


def get_consumption_history(product_id: str, days: int = 90) -> pd.DataFrame:
    """Get consumption history for a product"""
    df = _read_consumption_history()
    if df.empty:
        return pd.DataFrame()
    
    # Filter to product
    df = df[df['PRODUCT_ID'] == product_id]
    
    # Filter to recent days
    cutoff_date = datetime.now() - pd.Timedelta(days=days)
    df = df[df['DATE'] >= cutoff_date]
    
    return df[['DATE', 'QUANTITY']].sort_values('DATE')


def record_consumption(product_id: str, job_id: str, quantity: float, 
                      shift: str = '', team: str = '') -> bool:
    """Record product consumption"""
    try:
        df = _read_consumption_history()
        
        new_record = pd.DataFrame([{
            'PRODUCT_ID': product_id,
            'JOB_ID': job_id,
            'DATE': datetime.now(),
            'QUANTITY': quantity,
            'SHIFT': shift,
            'TEAM': team
        }])
        
        df = pd.concat([df, new_record], ignore_index=True)
        _write_consumption_history(df)
        
        return True
    except Exception as e:
        print(f"Error recording consumption: {e}")
        return False


# ============================================
# VENDOR PERFORMANCE FUNCTIONS
# ============================================

def _read_vendor_performance() -> pd.DataFrame:
    """Read vendor performance CSV file"""
    if not os.path.exists(VENDOR_PERFORMANCE_FILE):
        return pd.DataFrame(columns=[
            'VENDOR_ID', 'PO_NUMBER', 'PRODUCT_CATEGORY', 'ORDERED_DATE', 
            'EXPECTED_DELIVERY_DATE', 'RECEIVED_DATE', 'QUALITY_SCORE', 'IS_DELAYED'
        ])
    df = pd.read_csv(VENDOR_PERFORMANCE_FILE)
    df['ORDERED_DATE'] = pd.to_datetime(df['ORDERED_DATE'])
    df['EXPECTED_DELIVERY_DATE'] = pd.to_datetime(df['EXPECTED_DELIVERY_DATE'])
    df['RECEIVED_DATE'] = pd.to_datetime(df['RECEIVED_DATE'])
    return df


def _write_vendor_performance(df: pd.DataFrame):
    """Write vendor performance CSV file with locking"""
    with file_lock(VENDOR_PERFORMANCE_FILE):
        df.to_csv(VENDOR_PERFORMANCE_FILE, index=False)


def get_vendor_performance(vendor_id: str = None) -> pd.DataFrame:
    """Get vendor performance data"""
    df = _read_vendor_performance()
    if df.empty:
        return pd.DataFrame()
    
    if vendor_id:
        df = df[df['VENDOR_ID'] == vendor_id]
    
    return df


def record_po_delivery(po_number: str, vendor_id: str, product_category: str,
                       ordered_date: str, expected_date: str, received_date: str,
                       quality_score: float = 1.0) -> bool:
    """Record PO delivery for vendor performance tracking"""
    try:
        df = _read_vendor_performance()
        
        # Determine if delayed
        is_delayed = pd.to_datetime(received_date) > pd.to_datetime(expected_date)
        
        new_record = pd.DataFrame([{
            'VENDOR_ID': vendor_id,
            'PO_NUMBER': po_number,
            'PRODUCT_CATEGORY': product_category,
            'ORDERED_DATE': ordered_date,
            'EXPECTED_DELIVERY_DATE': expected_date,
            'RECEIVED_DATE': received_date,
            'QUALITY_SCORE': quality_score,
            'IS_DELAYED': is_delayed
        }])
        
        df = pd.concat([df, new_record], ignore_index=True)
        _write_vendor_performance(df)
        
        return True
    except Exception as e:
        print(f"Error recording PO delivery: {e}")
        return False
