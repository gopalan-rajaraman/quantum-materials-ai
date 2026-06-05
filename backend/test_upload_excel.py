import requests
import json
import traceback

base_url = "http://127.0.0.1:8000"
excel_path = r"c:\Users\Khushboo\OneDrive\Desktop\quantam-ai\WS2_ThermalCVD_BlankCells_17points.xlsx"

try:
    print("1. Uploading Excel file...")
    with open(excel_path, 'rb') as f:
        files = {'files': ('data.xlsx', f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
        res1 = requests.post(f"{base_url}/api/datasets/upload", files=files)
        
    print("Upload status:", res1.status_code)
    if res1.status_code != 200:
        print("Upload Error:", res1.text)
        exit(1)

    print("\n2. Getting suggestions...")
    res2 = requests.post(f"{base_url}/thermal-cvd/suggest", json={"n_suggestions": 1})
    print("Suggest status:", res2.status_code)
    if res2.status_code == 200:
        sugg = res2.json()["recommendations"][0]
        
        print("\n3. Adding experiment...")
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
