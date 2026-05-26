import sys
from pathlib import Path
sys.path.append('c:/Users/Khushboo/OneDrive/Desktop/quantam-ai/quantum-materials-ai/backend')

import app.routes.thermal_cvd_routes as routes
from sklearn.gaussian_process.kernels import Matern, ConstantKernel, WhiteKernel

# Initialize
routes.init_thermal_cvd_model()
opt = routes.optimizer_instance

# Update kernel bounds
opt.gp_model.kernel = (
    ConstantKernel(1.0, (1e-3, 1e3))
    * Matern(length_scale=1.0, length_scale_bounds=(0.5, 1e2), nu=2.5)
    + WhiteKernel(noise_level=0.1, noise_level_bounds=(1e-5, 1e1))
)

opt.gp_model.fit(opt.X_train, opt.y_train_scaled)

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
