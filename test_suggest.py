import requests

res = requests.post("http://localhost:8000/api/thermal-cvd/suggest", json={"n_suggestions": 1})
print(res.status_code)
print(res.json())
