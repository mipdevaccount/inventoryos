"""
Sample Data Generator for Commander V3
Generates realistic historical data for testing AI/ML features.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
import sys

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from utils.csv_data import DATA_DIR, get_all_products, get_all_vendors
from utils.v3_data import (
    record_consumption, create_job, add_bom_item, record_po_delivery,
    CONSUMPTION_HISTORY_FILE, JOBS_FILE, BOM_FILE, VENDOR_PERFORMANCE_FILE
)

def generate_consumption_history(days=90):
    """Generate realistic consumption history for all products"""
    print("Generating consumption history...")
    
    products_df = get_all_products()
    if products_df.empty:
        print("No products found. Please add products first.")
        return
    
    # Convert DataFrame to list of dicts
    products = products_df.to_dict(orient='records')
    
    # Create consumption patterns for each product
    for product in products[:10]:  # Limit to first 10 products for demo
        product_id = product['PRODUCT_ID']
        
        # Generate daily consumption with some randomness and trend
        base_consumption = np.random.uniform(5, 20)
        trend = np.random.uniform(-0.1, 0.1)
        seasonality = np.random.uniform(0.5, 1.5)
        
        consumption_data = []
        for i in range(days):
            date = datetime.now() - timedelta(days=days-i)
            
            # Add trend, seasonality, and noise
            day_of_week = date.weekday()
            weekly_factor = 1.2 if day_of_week < 5 else 0.5  # More on weekdays
            
            quantity = max(0, base_consumption + 
                          (trend * i) + 
                          (seasonality * np.sin(i / 7 * 2 * np.pi)) +
                          np.random.normal(0, 2)) * weekly_factor
            
            consumption_data.append({
                'PRODUCT_ID': product_id,
                'JOB_ID': f'JOB-{np.random.randint(1000, 1999)}',
                'DATE': date.strftime('%Y-%m-%d'),
                'QUANTITY': round(quantity, 2),
                'SHIFT': np.random.choice(['Day', 'Night']),
                'TEAM': np.random.choice(['Team A', 'Team B', 'Team C'])
            })
        
        # Write to CSV
        df = pd.DataFrame(consumption_data)
        if os.path.exists(CONSUMPTION_HISTORY_FILE):
            existing = pd.read_csv(CONSUMPTION_HISTORY_FILE)
            df = pd.concat([existing, df], ignore_index=True)
        
        df.to_csv(CONSUMPTION_HISTORY_FILE, index=False)
    
    print(f"✓ Generated consumption history for {len(products[:10])} products")



def generate_jobs(count=20):
    """Generate sample jobs"""
    print("Generating jobs...")
    
    job_types = ['Dump Body', 'Forestry Chipper', 'Service Body', 'Flatbed', 'Custom Build']
    priorities = ['low', 'medium', 'high']
    chassis_types = ['F-550', 'F-650', 'RAM 5500', 'Silverado 5500', 'International']
    
    jobs_created = 0
    for i in range(count):
        job_id = f'JOB-{1000 + i}'
        job_type = np.random.choice(job_types)
        priority = np.random.choice(priorities, p=[0.3, 0.5, 0.2])
        due_date = (datetime.now() + timedelta(days=np.random.randint(7, 90))).strftime('%Y-%m-%d')
        margin = round(np.random.uniform(5000, 25000), 2)
        chassis = np.random.choice(chassis_types)
        customer = f"Customer-{np.random.randint(100, 999)}"
        
        success = create_job(job_id, job_type, priority, due_date, margin, chassis, customer)
        if success:
            jobs_created += 1
    
    print(f"✓ Generated {jobs_created} jobs")


def generate_bom():
    """Generate BOM entries for jobs"""
    print("Generating BOM entries...")
    
    # Read jobs
    if not os.path.exists(JOBS_FILE):
        print("No jobs found. Generate jobs first.")
        return
    
    jobs_df = pd.read_csv(JOBS_FILE)
    products_df = get_all_products()
    
    if products_df.empty:
        print("No products found.")
        return
    
    products = products_df.to_dict(orient='records')
    bom_count = 0
    for _, job in jobs_df.iterrows():
        # Each job gets 3-8 random products
        num_items = np.random.randint(3, 9)
        selected_products = np.random.choice(products, size=min(num_items, len(products)), replace=False)
        
        for product in selected_products:
            quantity = round(np.random.uniform(1, 50), 2)
            notes = f"Required for {job['JOB_TYPE']}"
            
            success = add_bom_item(job['JOB_ID'], product['PRODUCT_ID'], quantity, notes)
            if success:
                bom_count += 1
    
    print(f"✓ Generated {bom_count} BOM entries")


def generate_vendor_performance():
    """Generate vendor performance history"""
    print("Generating vendor performance data...")
    
    vendors = get_all_vendors()
    if len(vendors) == 0:
        print("No vendors found.")
        return

    
    categories = ['Aluminum', 'Steel', 'Fasteners', 'Hydraulics', 'Electrical', 'Paint']
    
    performance_data = []
    for vendor in vendors:
        vendor_id = vendor['VENDOR_ID']
        
        # Generate 10-30 historical orders per vendor
        num_orders = np.random.randint(10, 31)
        
        # Each vendor has a base reliability (some are better than others)
        base_on_time_rate = np.random.uniform(0.7, 0.95)
        base_quality = np.random.uniform(0.8, 1.0)
        
        for i in range(num_orders):
            po_number = f'PO-{np.random.randint(10000, 99999)}'
            category = np.random.choice(categories)
            
            # Order date in past 6 months
            days_ago = np.random.randint(1, 180)
            ordered_date = (datetime.now() - timedelta(days=days_ago)).strftime('%Y-%m-%d')
            
            # Expected delivery 7-21 days after order
            expected_lead_time = np.random.randint(7, 22)
            expected_date = (datetime.now() - timedelta(days=days_ago) + timedelta(days=expected_lead_time)).strftime('%Y-%m-%d')
            
            # Actual delivery - sometimes late
            is_on_time = np.random.random() < base_on_time_rate
            if is_on_time:
                actual_lead_time = expected_lead_time + np.random.randint(-2, 3)
            else:
                actual_lead_time = expected_lead_time + np.random.randint(3, 15)
            
            received_date = (datetime.now() - timedelta(days=days_ago) + timedelta(days=actual_lead_time)).strftime('%Y-%m-%d')
            
            # Quality score with some variation
            quality_score = min(1.0, max(0.0, base_quality + np.random.normal(0, 0.1)))
            
            performance_data.append({
                'VENDOR_ID': vendor_id,
                'PO_NUMBER': po_number,
                'PRODUCT_CATEGORY': category,
                'ORDERED_DATE': ordered_date,
                'EXPECTED_DELIVERY_DATE': expected_date,
                'RECEIVED_DATE': received_date,
                'QUALITY_SCORE': round(quality_score, 2),
                'IS_DELAYED': not is_on_time,
                'EXPECTED_LEAD_TIME': expected_lead_time
            })
    
    # Write to CSV
    df = pd.DataFrame(performance_data)
    df.to_csv(VENDOR_PERFORMANCE_FILE, index=False)
    
    print(f"✓ Generated {len(performance_data)} vendor performance records")


def main():
    """Generate all sample data"""
    print("\n" + "="*60)
    print("Commander V3 Sample Data Generator")
    print("="*60 + "\n")
    
    # Ensure data directory exists
    os.makedirs(DATA_DIR, exist_ok=True)
    
    # Generate data
    generate_consumption_history(days=90)
    generate_jobs(count=20)
    generate_bom()
    generate_vendor_performance()
    
    print("\n" + "="*60)
    print("✓ Sample data generation complete!")
    print("="*60)
    print("\nYou can now:")
    print("1. View Smart Reorder recommendations")
    print("2. See risk assessments for POs")
    print("3. Test AI-powered forecasting")
    print("\nRestart the backend server to load the new data.")
    print("="*60 + "\n")


if __name__ == "__main__":
    main()
