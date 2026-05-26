import pandas as pd

data = [
    ["WO3", "Sulfur", 35, 2000, None, None, "graphite", "Ar", None, 100, 0, 1000, 20, 15, 730, "Rapid", "Quartz boat", "Thermal CVD", "Monolayer", 1.99, 21],
    ["WCl6", "Sulfur", 200, 800, None, None, "SiO2/Si", "Ar", None, 2.5, 0, 800, 15, 15, None, "Natural", "Al2O3 crucible", "Thermal CVD", "Nanosheet", 2.014, 124],
    ["W(CO)6", "H2S", None, None, 0.00017, 7, None, "Sapphire", "CH4", 0, 200, 800, 30, None, 50, "Bubbler", "Thermal CVD", None, None, 1.99, 60],
    ["W(CO)6", "DTBS", None, None, 0.00735, 7.28, None, "SiO2/Si", "H2/Ar", 500, 25, 850, None, 20, 50, "Bubbler", "Thermal CVD", None, None, 2.01, 69],
    ["W(CO)6", "Sulfur", None, None, None, None, "Graphene", "He", None, 0, 0, 600, None, None, None, "Sulfur boat", "Thermal CVD", None, None, 1.99, 27],
    ["WF6", "H2S", None, None, 0.025, 0.33, "NaCl", "SiO2/Si", "Ar", 100, 0, 640, 40, None, 7.5, "Ceramic boat", "Thermal CVD", None, None, 1.97, 48],
    ["WF6", "H2S", None, None, None, None, "SnCl4", "SiO2/Si", "Ar", None, 0, 550, None, None, 30, "Gas cylinder", "Thermal CVD", None, None, 2.01, 60],
    ["WO3", "Sulfur", 45, 1800, None, None, "graphite", "Ar", None, 90, 0, 920, 22, 14, 700, "Rapid", "Quartz boat", "Thermal CVD", "Monolayer", 1.99, 28],
    ["W(CO)6", "H2S", None, None, 0.0002, 6.5, None, "Sapphire", "CH4", 0, 180, 760, 28, None, 45, "Bubbler", "Thermal CVD", None, None, 1.98, 54],
    ["WF6", "H2S", None, None, 0.018, 0.28, "NaCl", "SiO2/Si", "Ar", 110, 0, 670, 35, None, 10, "Ceramic boat", "Thermal CVD", None, None, 1.97, 43],
    ["WO3", "Sulfur", 30, 1900, None, None, "graphite", "Ar", None, 95, 0, 980, 18, 16, 720, "Rapid", "Quartz boat", "Thermal CVD", "Monolayer", 1.99, 24],
    ["W(CO)6", "DTBS", None, None, 0.006, 6.8, None, "SiO2/Si", "H2/Ar", 450, 20, 830, None, 18, 40, "Bubbler", "Thermal CVD", None, None, 2, 57],
    ["WF6", "H2S", None, None, 0.022, 0.35, "SnCl4", "SiO2/Si", "Ar", 120, 0, 650, 42, None, 8, "Gas cylinder", "Thermal CVD", None, None, 1.96, 41],
    ["W(CO)6", "Sulfur", None, None, None, None, "Graphene", "He", None, 0, 0, 620, None, None, None, "Sulfur boat", "Thermal CVD", None, None, 1.99, 26],
    ["WO3", "Sulfur", 50, 2100, None, None, "graphite", "Ar", None, 105, 0, 1010, 21, 15, 735, "Rapid", "Quartz boat", "Thermal CVD", "Monolayer", 1.99, 22],
    ["WF6", "H2S", None, None, 0.02, 0.3, "NaCl", "SiO2/Si", "Ar", 95, 0, 660, 38, None, 9, "Ceramic boat", "Thermal CVD", None, None, 1.97, 45],
    ["W(CO)6", "H2S", None, None, 0.00015, 7.1, None, "Sapphire", "CH4", 0, 210, 790, 32, None, 52, "Bubbler", "Thermal CVD", None, None, 1.99, 58]
]

cols = ['P1', 'P2', 'CP1', 'CP2', 'FRP1', 'FRP2', 'SA', 'Substrate', 'CG', 'FRA', 'FRH', 'GTE', 'GTI', 'HR', 'Pressure', 'COM', 'PC', 'TOCVD', 'Class', 'PL Peak Position', 'PL_FWHM']

df_new = pd.DataFrame(data, columns=cols)
out_path = 'C:/Users/Khushboo/OneDrive/Desktop/AI-Material-Optimization/screenshot_data.xlsx'
df_new.to_excel(out_path, index=False)
print(f"Created new excel file: {out_path} with {len(df_new)} rows.")
