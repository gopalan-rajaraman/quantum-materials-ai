import sys
from pathlib import Path
sys.path.append('c:/Users/Khushboo/OneDrive/Desktop/quantam-ai/quantum-materials-ai/backend')

import app.routes.thermal_cvd_routes as routes

# Initialize
routes.init_thermal_cvd_model()
opt = routes.optimizer_instance

# Print kernel
print("Optimized Kernel:", opt.gp_model.gp.kernel_)

# Print R2 and MAE
y_pred_scaled = opt.gp_model.gp.predict(opt.X_train)
y_pred = opt.scaler_y.inverse_transform(y_pred_scaled.reshape(-1, 1)).ravel()

metrics = opt.gp_model.get_metrics(
    opt.X_train, 
    opt.y_train_scaled,
    y_true_raw=opt.y_train,
    y_pred_raw=y_pred
)
print("Metrics:", metrics)
