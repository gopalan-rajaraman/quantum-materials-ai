import requests
import time
import subprocess
import threading
import sys

def run_server():
    subprocess.run([sys.executable, "server.py"], cwd=r"c:\Users\Khushboo\OneDrive\Desktop\quantam-ai\quantum-materials-ai\backend")

server_thread = threading.Thread(target=run_server)
server_thread.daemon = True
server_thread.start()

# Wait for server to start
time.sleep(10)

try:
    print("Sending add-experiment request...")
    res = requests.post("http://127.0.0.1:8000/thermal-cvd/add-experiment", json={
        "GTE": 100,
        "GTI": 10,
        "FRA": 50,
        "Pressure": 10,
        "PL_FWHM": 20
    })
    print(f"Status: {res.status_code}")
    print(f"Response: {res.text}")
except Exception as e:
    print(f"Error: {e}")
