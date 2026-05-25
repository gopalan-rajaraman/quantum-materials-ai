import requests

for i in range(4):
    # 1. Suggest
    res3 = requests.post("http://localhost:8000/thermal-cvd/suggest", json={"n_suggestions": 1})
    sugg = res3.json()["recommendations"][0]
    
    # 2. Add experiment
    exp = {
        "GTE": sugg["GTE_celsius"],
        "GTI": sugg["GTI_minutes"],
        "FRA": sugg["FRA_sccm"],
        "Pressure": sugg["Pressure_Torr"],
        "PL_FWHM": 20.0 - i  # Slowly improving
    }
    requests.post("http://localhost:8000/thermal-cvd/add-experiment", json=exp)

print("Added 4 experiments!")
