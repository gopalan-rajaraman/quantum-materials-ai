import sys
from pathlib import Path
sys.path.append('c:/Users/Khushboo/OneDrive/Desktop/quantam-ai/backend')

import app.routes.thermal_cvd_routes as routes
routes.init_thermal_cvd_model()
opt = routes.optimizer_instance
print("VARIABLES:", opt.encoder.VARIABLES)
print("RANGES:", opt.encoder.VARIABLE_RANGES)
