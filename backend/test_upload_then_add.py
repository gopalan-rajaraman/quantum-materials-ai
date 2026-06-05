import requests
import json

base_url = "http://127.0.0.1:8000"

print("1. Uploading JSON dataset...")
upload_data = {
    "name": "test_dataset",
    "data": [
        {"GTE": 800, "GTI": 15, "FRA": 20, "Pressure": 100, "PL_FWHM": 30, "TOCVD": "Thermal CVD"},
        {"GTE": 850, "GTI": 15, "FRA": 20, "Pressure": 100, "PL_FWHM": 25, "TOCVD": "Thermal CVD"},
        {"GTE": 900, "GTI": 20, "FRA": 30, "Pressure": 200, "PL_FWHM": 22, "TOCVD": "Thermal CVD"}
    ]
}

res1 = requests.post(f"{base_url}/api/datasets/upload-json", json=upload_data)
print("Upload status:", res1.status_code)
if res1.status_code != 200:
    print(res1.text)

print("\n2. Getting suggestions...")
res2 = requests.post(f"{base_url}/thermal-cvd/suggest", json={"n_suggestions": 1})
print("Suggest status:", res2.status_code)
if res2.status_code == 200:
    sugg = res2.json()["recommendations"][0]
    print(sugg)
    
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
    print(res2.text)
