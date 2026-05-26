import sys
from pathlib import Path
sys.path.append('c:/Users/Khushboo/OneDrive/Desktop/quantam-ai/quantum-materials-ai/backend')

import app.routes.thermal_cvd_routes as routes
import matplotlib.pyplot as plt
import numpy as np

print("Reloading model...")
routes.init_thermal_cvd_model()
opt = routes.optimizer_instance
print(f"Kernel after fit: {opt.gp_model.gp.kernel_}")

best_rec = opt.suggest_next_experiment(n_suggestions=1)[0]
fixed_params = {
    'GTI': best_rec['GTI_minutes'],
    'FRA': best_rec['FRA_sccm'],
    'Pressure': best_rec['Pressure_Torr']
}

gte_range = np.linspace(500, 1100, 100)
var_dicts = []
for gte in gte_range:
    var_dicts.append({
        'GTE': float(gte),
        'GTI': fixed_params['GTI'],
        'FRA': fixed_params['FRA'],
        'Pressure': fixed_params['Pressure']
    })

X_search_list = [opt.encoder.encode_variables(vd)[0] for vd in var_dicts]
X_sweep = np.array(X_search_list)

mu_scaled, sigma_scaled = opt.gp_model.predict(X_sweep, return_std=True)
mu_mev = opt.scaler_y.inverse_transform(mu_scaled.reshape(-1, 1)).ravel()
mu_mev = np.maximum(mu_mev, 0.0)
sigma_mev = sigma_scaled * opt.scaler_y.scale_[0]

print(f"Mu min: {mu_mev.min():.2f}, max: {mu_mev.max():.2f}")
print(f"Sigma min: {sigma_mev.min():.2f}, max: {sigma_mev.max():.2f}")

plt.figure(figsize=(12, 8))
plt.subplot(2, 1, 1)
plt.plot(gte_range, mu_mev, 'b-', label='Predicted FWHM')
plt.fill_between(gte_range, 
                 np.maximum(mu_mev - 1.96*sigma_mev, 0),
                 mu_mev + 1.96*sigma_mev,
                 alpha=0.2, color='blue', label='95% Uncertainty')
plt.title('Gaussian Surrogate Model (GTE Sweep)')
plt.ylabel('FWHM (meV)')
plt.legend()

plt.tight_layout()
artifact_dir = Path("C:/Users/Khushboo/.gemini/antigravity/brain/47ac04c3-e644-433a-886e-f4f6f1878339")
plt.savefig(artifact_dir / "bo_plot2.png")
print("Saved bo_plot2.png")
