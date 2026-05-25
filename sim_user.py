import requests
import json
import time

# Create dummy data
data = []
for i in range(10):
    data.append({
        "GTE": 700 + i*10,
        "GTI": 15,
        "FRA": 100,
        "Pressure": 200,
        "PL FWHM": 21.0 if i == 0 else 30.0 + i,
        "P1": "W(CO)6",
        "P2": "H2S",
        "Substrate": "SiO2/Si",
        "CG": "Ar",
        "COM": "Natural",
        "PC": "Bubbler",
        "SA": "NaCl",
        "Class": "Monolayer",
        "FRH": 0,
        "TOCVD": "Thermal CVD"
    })

# 1. Upload
res = requests.post("http://localhost:8000/upload-dataset", json=data)
print("Upload:", res.json())
dataset_id = res.json()["dataset_id"]

# 2. Lock
res2 = requests.post(f"http://localhost:8000/lock-dataset/{dataset_id}")
print("Lock:", res2.json())

# Wait a sec for model to initialize
time.sleep(1)

# 3. Suggest
res3 = requests.post("http://localhost:8000/thermal-cvd/suggest", json={"n_suggestions": 1})
print("Suggest:", res3.json())

# 4. Add experiment (user enters FWHM=2.0)
sugg = res3.json()["recommendations"][0]
exp = {
    "GTE": sugg["GTE_celsius"],
    "GTI": sugg["GTI_minutes"],
    "FRA": sugg["FRA_sccm"],
    "Pressure": sugg["Pressure_Torr"],
    "PL_FWHM": 2.0
}
res4 = requests.post("http://localhost:8000/thermal-cvd/add-experiment", json=exp)
print("Add Exp:", res4.json())

# 5. Check progress
res5 = requests.get("http://localhost:8000/thermal-cvd/bo-progress")
print("Progress:", res5.json())
