import requests
import time

try:
    print("Reloading model via API...")
    requests.post('http://localhost:8000/reload')
    
    print("Running BO loop via API for 5 iterations...")
    for i in range(5):
        res = requests.post('http://localhost:8000/simulate-run')
        if res.status_code == 200:
            data = res.json()
            print(f"Iteration {i+1}: FWHM = {data['predicted_FWHM_meV']:.2f} +- {data['uncertainty_meV']:.2f}")
        else:
            print(f"Error {res.status_code}: {res.text}")
        time.sleep(1)
        
    print("Success!")
except Exception as e:
    print(f"Failed to connect to API: {e}")
