import sys
import os
import json
import numpy as np
sys.path.append(os.getcwd())
from utils.csv_data import get_all_requests

try:
    print("Calling get_all_requests('pending')...")
    df = get_all_requests('pending')
    
    # Simulate main.py logic
    df['SUBMITTED_AT'] = df['SUBMITTED_AT'].astype(str)
    df['UPDATED_AT'] = df['UPDATED_AT'].astype(str)
    
    data = df.to_dict(orient="records")
    print("Serialization test...")
    try:
        json.dumps(data)
        print("JSON serialization successful!")
    except Exception as e:
        print(f"JSON serialization failed: {e}")
        # Check for NaNs
        if df.isnull().values.any():
            print("DataFrame contains NaNs!")
            print(df[df.isnull().any(axis=1)])

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
