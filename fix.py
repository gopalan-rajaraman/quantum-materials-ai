path = r"c:\Users\Khushboo\OneDrive\Desktop\quantam-ai\WS2_CVD_Bayesian_Optimization_Final.ipynb"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

bad_str = '        "file_name = "WS2_ThermalCVD_BlankCells_17points.xlsx"\\n",'
good_str = '        "file_name = \'WS2_ThermalCVD_BlankCells_17points.xlsx\'\\n",'

if bad_str in content:
    content = content.replace(bad_str, good_str)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Fix applied to Final.")
else:
    print("Bad string not found in Final.")

path2 = r"c:\Users\Khushboo\OneDrive\Desktop\quantam-ai\WS2_CVD_Bayesian_Optimization.ipynb"
with open(path2, "r", encoding="utf-8") as f:
    content2 = f.read()

if bad_str in content2:
    content2 = content2.replace(bad_str, good_str)
    with open(path2, "w", encoding="utf-8") as f:
        f.write(content2)
    print("Fix applied to original.")
else:
    print("Bad string not found in original.")
