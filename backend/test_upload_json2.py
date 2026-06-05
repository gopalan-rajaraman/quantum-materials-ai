import requests
import json
import traceback
import pandas as pd
import numpy as np

base_url = "http://127.0.0.1:8000"
excel_path = r"c:\Users\Khushboo\OneDrive\Desktop\quantam-ai\WS2_ThermalCVD_BlankCells_17points.xlsx"

try:
    print("1. Reading Excel to JSON...")
    df = pd.read_excel(excel_path)
    df = df.replace({np.nan: None})
    data = df.to_dict(orient='records')
    
    upload_data = {
        "name": "json_test_dataset",
        "data": data
    }
    
    print("2. Uploading JSON...")
    res1 = requests.post(f"{base_url}/api/datasets/upload-json", json=upload_data)
        
    print("Upload status:", res1.status_code)
    if res1.status_code != 200:
        print("Upload Error:", res1.text)
        exit(1)

    print("\n3. Getting suggestions...")
    res2 = requests.post(f"{base_url}/thermal-cvd/suggest", json={"n_suggestions": 1})
    print("Suggest status:", res2.status_code)
    if res2.status_code == 200:
        sugg = res2.json()["recommendations"][0]
        
        print("\n4. Adding experiment...")
        exp_data = {
            "GTE": sugg["GTE_celsius"],
            "GTI": sugg["GTI_minutes"],
            "FRA": sugg["FRA_sccm"],
            "Pressure": sugg["Pressure_Torr"],
            "PL_FWHM": 19.5
        }
        res3 = requests.post(f"{base_url}/thermal-cvd/add-experiment", json=exp_data)
        print("Add Exp status:", res3.status_code)
        print(res3.text)
    else:
        print("Suggest Error:", res2.text)
        
except Exception as e:
    traceback.print_exc()
