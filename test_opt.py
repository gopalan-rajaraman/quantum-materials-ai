import asyncio
from backend.app.ml_models.thermal_cvd.optimizer import ThermalCVDOptimizer
from backend.app.ml_models.thermal_cvd.data_encoder import ThermalCVDEncoder
import pandas as pd

df = pd.DataFrame({
    'P1': ['W(CO)6']*10,
    'P2': ['H2S']*10,
    'Substrate': ['SiO2/Si']*10,
    'CG': ['Ar']*10,
    'COM': ['Natural']*10,
    'PC': ['Bubbler']*10,
    'SA': ['NaCl']*10,
    'Class': ['Monolayer']*10,
    'FRH': [0]*10,
    'GTE': [600, 700, 800, 900, 1000, 650, 750, 850, 950, 1050],
    'GTI': [10, 20, 30, 40, 50, 15, 25, 35, 45, 55],
    'FRA': [10, 50, 100, 200, 300, 20, 60, 150, 250, 350],
    'Pressure': [10, 50, 100, 200, 500, 20, 60, 150, 300, 600],
    'TOCVD': ['Thermal CVD']*10,
    'PL FWHM': [120, 100, 80, 60, 40, 110, 90, 70, 50, 30]
})

opt = ThermalCVDOptimizer()
opt.load_training_data(df)
opt.train_gp()
opt.generate_search_space(100)
res = opt.run_bo_optimization(5)
print(res['recommendations'][0])
print(res['summary'])
