import urllib.request
import urllib.error

try:
    urllib.request.urlopen('http://localhost:8000/api/datasets/dashboard-stats')
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code)
except Exception as e:
    print("Other Error:", e)
