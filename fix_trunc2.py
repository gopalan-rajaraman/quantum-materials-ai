import json

path = r"c:\Users\Khushboo\OneDrive\Desktop\quantam-ai\WS2_CVD_Bayesian_Optimization.ipynb"
with open(path, "r", encoding="utf-8-sig") as f:
    content = f.read().rstrip()

closing = '"\n          }\n        }\n      ]\n    }\n  ]\n}'

fixed_content = content + closing
try:
    json.loads(fixed_content)
    with open(path, "w", encoding="utf-8") as f:
        f.write(fixed_content)
    print("Fixed original notebook truncation!")
except json.JSONDecodeError as e:
    print("Still failed to parse original:", e)
