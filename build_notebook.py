import json

def md(text):
    return {"cell_type": "markdown", "metadata": {}, "source": text}

def code(text):
    return {"cell_type": "code", "execution_count": None, "metadata": {}, "outputs": [], "source": text}

cells = []

# ── TITLE ──────────────────────────────────────────────────────────────────
cells.append(md(
    "# WS2 Thermal CVD — Bayesian Optimization\n"
    "**Objective:** Minimize PL FWHM of WS2 films using Gaussian Process Regression + Expected Improvement.\n\n"
    "Uses the same ML pipeline as the production app backend:\n"
    "- Dataset: `WS2_ThermalCVD_BlankCells_17points.xlsx`\n"
    "- Kernel: ARD Matern nu=2.5 + WhiteKernel (`gp_model.py`)\n"
    "- Preprocessing: StandardScaler + SimpleImputer (`data_encoder.py`)\n"
    "- Search: Latin Hypercube 5000 pts (`optimizer.py`)"
))

# ── STEP 0: IMPORTS ─────────────────────────────────────────────────────────
cells.append(md("## Step 0 — Install & Import"))
cells.append(code(
    "!pip install scikit-learn scipy numpy pandas openpyxl matplotlib seaborn -q\n"
    "\n"
    "import numpy as np\n"
    "import pandas as pd\n"
    "import matplotlib.pyplot as plt\n"
    "import seaborn as sns\n"
    "from scipy.stats import norm, qmc\n"
    "from sklearn.gaussian_process import GaussianProcessRegressor\n"
    "from sklearn.gaussian_process.kernels import Matern, ConstantKernel as C, WhiteKernel\n"
    "from sklearn.preprocessing import LabelEncoder, StandardScaler\n"
    "from sklearn.impute import SimpleImputer\n"
    "from sklearn.metrics import r2_score\n"
    "from sklearn.model_selection import LeaveOneOut, cross_val_score\n"
    "import warnings\n"
    "warnings.filterwarnings('ignore')\n"
    "\n"
    "plt.rcParams.update({'figure.dpi': 150, 'font.family': 'DejaVu Sans',\n"
    "                     'axes.spines.top': False, 'axes.spines.right': False})\n"
    "print('Libraries loaded.')"
))

# ── STEP 1: LOAD DATA ───────────────────────────────────────────────────────
cells.append(md("## Step 1 — Load Dataset\nLoads `WS2_ThermalCVD_BlankCells_17points.xlsx` — the same file used by the app."))
cells.append(code(
    "# Same preprocessing as thermal_cvd_routes.py\n"
    "FILE = 'WS2_ThermalCVD_BlankCells_17points.xlsx'\n"
    "df_raw = pd.read_excel(FILE)\n"
    "\n"
    "# Replace 'NS' with NaN — matches app logic\n"
    "df_raw = df_raw.replace('NS', np.nan)\n"
    "\n"
    "# Normalise PL FWHM column name\n"
    "if 'PL_FWHM' not in df_raw.columns and 'PL FWHM' in df_raw.columns:\n"
    "    df_raw = df_raw.rename(columns={'PL FWHM': 'PL_FWHM'})\n"
    "\n"
    "print(f'File: {FILE}')\n"
    "print(f'Rows: {len(df_raw)}  |  Columns: {len(df_raw.columns)}')\n"
    "print(f'Columns: {list(df_raw.columns)}')\n"
    "df_raw.head()"
))

# ── STEP 2: FILTER ──────────────────────────────────────────────────────────
cells.append(md("## Step 2 — Filter Thermal CVD\nKeep only rows where `TOCVD == 'Thermal CVD'` — identical to the app filter."))
cells.append(code(
    "# Matches: df[df['TOCVD'] == 'Thermal CVD'] in data_encoder.py\n"
    "df = df_raw[df_raw['TOCVD'] == 'Thermal CVD'].copy().reset_index(drop=True)\n"
    "\n"
    "# Coerce numeric columns\n"
    "num_cols = ['FRH', 'HR', 'FRP1', 'FRP2', 'CP1', 'CP2',\n"
    "            'GTE', 'GTI', 'FRA', 'Pressure', 'PL_FWHM']\n"
    "for col in num_cols:\n"
    "    if col in df.columns:\n"
    "        df[col] = pd.to_numeric(df[col], errors='coerce')\n"
    "\n"
    "print(f'Thermal CVD rows found: {len(df)}')\n"
    "print(f'FWHM range: {df[\"PL_FWHM\"].min()} to {df[\"PL_FWHM\"].max()} meV')\n"
    "display(df.style.set_caption('Thermal CVD Dataset').background_gradient(\n"
    "    subset=['PL_FWHM'], cmap='RdYlGn_r'))"
))

# ── STEP 3: CONSTANTS & VARIABLES ───────────────────────────────────────────
cells.append(md("## Step 3 — Constants & Optimization Variables\nExact same classification as `ThermalCVDEncoder` in `data_encoder.py`."))
cells.append(code(
    "# From app/ml_models/thermal_cvd/data_encoder.py\n"
    "\n"
    "# Categorical constants (fixed per experiment setup)\n"
    "CAT_CONSTANTS = ['P1', 'P2', 'Substrate', 'CG', 'COM', 'PC', 'SA', 'Class']\n"
    "\n"
    "# Numerical constants (not optimised)\n"
    "NUM_CONSTANTS = ['FRH', 'HR', 'FRP1', 'FRP2', 'CP1', 'CP2']\n"
    "\n"
    "# The 4 variables Bayesian Optimisation will sweep\n"
    "VARIABLES = ['GTE', 'GTI', 'FRA', 'Pressure']\n"
    "\n"
    "# Exact bounds from optimizer.py VARIABLE_RANGES\n"
    "VARIABLE_RANGES = {\n"
    "    'GTE':      (500,  1100),  # Growth Temperature [C]\n"
    "    'GTI':      (5,    60),    # Growth Time [min]\n"
    "    'FRA':      (0,    100),   # Ar Flow Rate [sccm]\n"
    "    'Pressure': (1,    760),   # Chamber Pressure [Torr]\n"
    "}\n"
    "\n"
    "TARGET = 'PL_FWHM'\n"
    "\n"
    "print(f'Categorical constants ({len(CAT_CONSTANTS)}): {CAT_CONSTANTS}')\n"
    "print(f'Numerical constants  ({len(NUM_CONSTANTS)}): {NUM_CONSTANTS}')\n"
    "print(f'\\nOptimization variables:')\n"
    "for v, (lo, hi) in VARIABLE_RANGES.items():\n"
    "    obs = df[v].dropna().tolist()\n"
    "    print(f'  {v:12s}  range [{lo} - {hi}]  observed: {obs}')\n"
    "print(f'\\nTarget: {TARGET}  (minimize = better crystal quality)')"
))

# ── STEP 4: ENCODE ──────────────────────────────────────────────────────────
cells.append(md("## Step 4 — Encode Categorical Constants\nSame as `ThermalCVDEncoder.fit_on_data()` — LabelEncoder per categorical column."))
cells.append(code(
    "label_encoders = {}\n"
    "constant_values = {}\n"
    "\n"
    "print('Categorical encoding:')\n"
    "for col in CAT_CONSTANTS:\n"
    "    series = df[col].fillna('Unknown').astype(str)\n"
    "    le = LabelEncoder()\n"
    "    le.fit(series.unique())\n"
    "    label_encoders[col] = le\n"
    "    constant_values[col] = series.mode()[0]\n"
    "    print(f'  {col:12s} mode={repr(constant_values[col]):20s} classes={list(le.classes_)}')\n"
    "\n"
    "print('\\nNumerical constant medians:')\n"
    "for col in NUM_CONSTANTS:\n"
    "    if col in df.columns:\n"
    "        val = pd.to_numeric(df[col], errors='coerce').dropna()\n"
    "        constant_values[col] = float(val.median()) if len(val) > 0 else 0.0\n"
    "    else:\n"
    "        constant_values[col] = 0.0\n"
    "    print(f'  {col:6s} = {constant_values[col]}')"
))

# ── STEP 5: FEATURE MATRIX ──────────────────────────────────────────────────
cells.append(md("## Step 5 — Build Feature Matrix & Scale\nBuilds 4-feature matrix `[GTE, GTI, FRA, Pressure]`, imputes missing values, then scales.\nIdentical to `_build_raw_feature_matrix()` in `data_encoder.py`."))
cells.append(code(
    "# Build raw matrix from the 4 optimization variables\n"
    "X_raw = df[VARIABLES].apply(pd.to_numeric, errors='coerce').values.astype(float)\n"
    "y_raw = pd.to_numeric(df[TARGET], errors='coerce').values.astype(float)\n"
    "\n"
    "# Drop rows where target is missing\n"
    "valid_mask = ~np.isnan(y_raw)\n"
    "X_raw = X_raw[valid_mask]\n"
    "y_raw = y_raw[valid_mask]\n"
    "\n"
    "# Impute missing variable values with column mean (same as app)\n"
    "imputer = SimpleImputer(strategy='mean')\n"
    "X_imputed = imputer.fit_transform(X_raw)\n"
    "\n"
    "# Scale X — StandardScaler, same as app's scaler_X\n"
    "scaler_X = StandardScaler()\n"
    "X_scaled = scaler_X.fit_transform(X_imputed)\n"
    "\n"
    "# Scale y — StandardScaler, same as app's scaler_y\n"
    "scaler_y = StandardScaler()\n"
    "y_scaled = scaler_y.fit_transform(y_raw.reshape(-1, 1)).ravel()\n"
    "\n"
    "print(f'Feature matrix: {X_scaled.shape}  ->  variables={VARIABLES}')\n"
    "print(f'y (raw meV):  {y_raw.tolist()}')\n"
    "print(f'y (scaled):   {np.round(y_scaled, 3).tolist()}')\n"
    "\n"
    "pd.DataFrame(X_scaled, columns=VARIABLES).assign(\n"
    "    FWHM_raw=y_raw, FWHM_scaled=y_scaled\n"
    ").style.set_caption('Scaled Feature Matrix').background_gradient(\n"
    "    subset=['FWHM_raw'], cmap='RdYlGn_r')"
))

# ── STEP 6: SEARCH SPACE ────────────────────────────────────────────────────
cells.append(md("## Step 6 — Generate Search Space\n5000-point Latin Hypercube over all 4 variable bounds.\nSame as `generate_search_space(n_points=5000)` in `optimizer.py`."))
cells.append(code(
    "N_SEARCH = 5000\n"
    "\n"
    "var_names = list(VARIABLE_RANGES.keys())\n"
    "l_bounds  = [VARIABLE_RANGES[v][0] for v in var_names]\n"
    "u_bounds  = [VARIABLE_RANGES[v][1] for v in var_names]\n"
    "\n"
    "sampler      = qmc.LatinHypercube(d=len(var_names), seed=42)\n"
    "sample       = sampler.random(n=N_SEARCH)\n"
    "X_search_raw = qmc.scale(sample, l_bounds, u_bounds)\n"
    "\n"
    "# Apply same imputer + scaler used on training data\n"
    "X_search = scaler_X.transform(imputer.transform(X_search_raw))\n"
    "\n"
    "print(f'Search space: {X_search.shape}  (LHS seed=42, n={N_SEARCH})')\n"
    "pd.DataFrame(X_search_raw[:5], columns=var_names).round(2)"
))

# ── STEP 7: GP MODEL ────────────────────────────────────────────────────────
cells.append(md("## Step 7 — Train Gaussian Process\nExact kernel from `ThermalCVDGPModel` in `gp_model.py`:\n`ConstantKernel * Matern(nu=2.5, ARD) + WhiteKernel`"))
cells.append(code(
    "# Exact same kernel as gp_model.py\n"
    "kernel = (\n"
    "    C(1.0, (0.1, 10.0))\n"
    "    * Matern(length_scale=[1.0]*4, length_scale_bounds=(0.1, 10.0), nu=2.5)\n"
    "    + WhiteKernel(noise_level=1e-3, noise_level_bounds=(1e-4, 1e-1))\n"
    ")\n"
    "\n"
    "gp = GaussianProcessRegressor(\n"
    "    kernel=kernel,\n"
    "    n_restarts_optimizer=15,\n"
    "    normalize_y=True,\n"
    "    random_state=42\n"
    ")\n"
    "gp.fit(X_scaled, y_scaled)\n"
    "\n"
    "# Predict on training set\n"
    "y_pred_sc, y_std_sc = gp.predict(X_scaled, return_std=True)\n"
    "y_pred = scaler_y.inverse_transform(y_pred_sc.reshape(-1, 1)).ravel()\n"
    "y_std  = y_std_sc * scaler_y.scale_[0]\n"
    "\n"
    "# Leave-One-Out cross-validation\n"
    "loo    = LeaveOneOut()\n"
    "scores = cross_val_score(gp, X_scaled, y_scaled, cv=loo, scoring='r2')\n"
    "\n"
    "print('GP trained  (ARD Matern nu=2.5 + WhiteKernel)')\n"
    "print(f'  Optimized kernel: {gp.kernel_}')\n"
    "print(f'  LOO R2 scores:    {scores.round(3)}')\n"
    "print(f'  Mean LOO R2:      {scores.mean():.3f}')\n"
    "print()\n"
    "print('Predicted vs Actual FWHM:')\n"
    "for i, (act, pred, std) in enumerate(zip(y_raw, y_pred, y_std)):\n"
    "    print(f'  Exp {i+1:2d}: actual={act:.0f} meV  predicted={pred:.1f} +/- {std:.1f} meV')"
))

# ── STEP 8: ACQUISITION FUNCTION ────────────────────────────────────────────
cells.append(md("## Step 8 — Expected Improvement & Next Experiment\nSame EI formula used by the app optimizer."))
cells.append(code(
    "def expected_improvement(X_cand, gp, best_y_scaled, xi=0.01):\n"
    "    mu, sigma = gp.predict(X_cand, return_std=True)\n"
    "    sigma = sigma.ravel()\n"
    "    mu    = mu.ravel()\n"
    "    z  = (best_y_scaled - mu - xi) / (sigma + 1e-9)\n"
    "    ei = (best_y_scaled - mu - xi) * norm.cdf(z) + sigma * norm.pdf(z)\n"
    "    ei[sigma < 1e-10] = 0.0\n"
    "    return ei\n"
    "\n"
    "best_idx   = int(np.argmin(y_raw))\n"
    "best_y_sc  = y_scaled[best_idx]\n"
    "\n"
    "ei_values   = expected_improvement(X_search, gp, best_y_sc)\n"
    "best_ei_idx = int(np.argmax(ei_values))\n"
    "next_raw    = X_search_raw[best_ei_idx]\n"
    "next_params = dict(zip(var_names, next_raw))\n"
    "\n"
    "print(f'Current best: Exp {best_idx+1}  FWHM = {y_raw[best_idx]:.0f} meV')\n"
    "print(f'Max EI: {ei_values.max():.6f}')\n"
    "print()\n"
    "print('=== NEXT SUGGESTED EXPERIMENT ===')\n"
    "for v, val in next_params.items():\n"
    "    lo, hi = VARIABLE_RANGES[v]\n"
    "    print(f'  {v:12s}: {val:8.2f}   (range {lo} - {hi})')"
))

# ── STEP 9: PLOTS ───────────────────────────────────────────────────────────
cells.append(md("## Step 9 — Visualize GP Performance"))
cells.append(code(
    "fig, axes = plt.subplots(1, 2, figsize=(14, 5))\n"
    "\n"
    "# --- Predicted vs Actual ---\n"
    "ax = axes[0]\n"
    "ax.errorbar(y_raw, y_pred, yerr=2*y_std, fmt='none',\n"
    "            color='#AED6F1', alpha=0.7, capsize=5, label='+/-2sigma')\n"
    "sc = ax.scatter(y_raw, y_pred, c=y_raw, cmap='RdYlGn_r', s=150,\n"
    "                edgecolors='black', zorder=5,\n"
    "                vmin=y_raw.min(), vmax=y_raw.max())\n"
    "plt.colorbar(sc, ax=ax, label='Actual FWHM (meV)')\n"
    "for i, (xa, xp) in enumerate(zip(y_raw, y_pred)):\n"
    "    ax.annotate(f'Exp {i+1}', (xa, xp), xytext=(5, 5),\n"
    "                textcoords='offset points', fontsize=8)\n"
    "lims = [min(y_raw.min(), y_pred.min())-5, max(y_raw.max(), y_pred.max())+5]\n"
    "ax.plot(lims, lims, 'k--', lw=1.5, alpha=0.5, label='Perfect fit')\n"
    "ax.set_xlabel('Actual PL FWHM (meV)')\n"
    "ax.set_ylabel('GP Predicted PL FWHM (meV)')\n"
    "ax.set_title('GP: Predicted vs Actual', fontweight='bold')\n"
    "ax.legend(fontsize=8)\n"
    "\n"
    "# --- Residuals ---\n"
    "ax2 = axes[1]\n"
    "residuals  = y_pred - y_raw\n"
    "bar_colors = ['#5C9E31' if abs(r) < 10 else '#E84855' for r in residuals]\n"
    "ax2.bar(range(len(residuals)), residuals, color=bar_colors, edgecolor='white')\n"
    "ax2.axhline(0, color='black', lw=1.5, linestyle='--')\n"
    "ax2.set_xticks(range(len(residuals)))\n"
    "ax2.set_xticklabels([f'Exp {i+1}' for i in range(len(residuals))])\n"
    "ax2.set_xlabel('Experiment')\n"
    "ax2.set_ylabel('Residual (meV)')\n"
    "ax2.set_title('Prediction Residuals', fontweight='bold')\n"
    "\n"
    "plt.suptitle('Gaussian Process Surrogate Model', fontsize=13, fontweight='bold')\n"
    "plt.tight_layout()\n"
    "plt.savefig('gp_performance.png', dpi=150, bbox_inches='tight')\n"
    "plt.show()"
))

# ── STEP 10: EI LANDSCAPE ───────────────────────────────────────────────────
cells.append(md("## Step 10 — EI Landscape (2D slices)\nShows where Bayesian Optimization wants to search next."))
cells.append(code(
    "fig, axes = plt.subplots(1, 2, figsize=(14, 5))\n"
    "\n"
    "pairs = [('GTE', 'GTI'), ('FRA', 'Pressure')]\n"
    "\n"
    "for ax, (vx, vy) in zip(axes, pairs):\n"
    "    xi_idx = VARIABLES.index(vx)\n"
    "    yi_idx = VARIABLES.index(vy)\n"
    "    x_lin  = np.linspace(VARIABLE_RANGES[vx][0], VARIABLE_RANGES[vx][1], 60)\n"
    "    y_lin  = np.linspace(VARIABLE_RANGES[vy][0], VARIABLE_RANGES[vy][1], 60)\n"
    "    XX, YY = np.meshgrid(x_lin, y_lin)\n"
    "\n"
    "    grid_raw = np.tile(imputer.statistics_, (XX.size, 1))\n"
    "    grid_raw[:, xi_idx] = XX.ravel()\n"
    "    grid_raw[:, yi_idx] = YY.ravel()\n"
    "    grid_sc = scaler_X.transform(grid_raw)\n"
    "    EI_map  = expected_improvement(grid_sc, gp, best_y_sc).reshape(XX.shape)\n"
    "\n"
    "    cf = ax.contourf(XX, YY, EI_map, levels=25, cmap='YlOrRd')\n"
    "    plt.colorbar(cf, ax=ax, label='Expected Improvement')\n"
    "    ax.scatter(df[vx].dropna(), df[vy].dropna(),\n"
    "               c='white', edgecolors='black', s=80, zorder=5, label='Observed')\n"
    "    ax.scatter([next_params[vx]], [next_params[vy]],\n"
    "               marker='*', s=300, c='#5C9E31', edgecolors='black',\n"
    "               zorder=6, label='Next suggestion')\n"
    "    ax.set_xlabel(vx); ax.set_ylabel(vy)\n"
    "    ax.set_title(f'EI: {vx} vs {vy}', fontweight='bold')\n"
    "    ax.legend(fontsize=8)\n"
    "\n"
    "plt.suptitle('Acquisition Function — Expected Improvement (2D slices)',\n"
    "             fontsize=13, fontweight='bold')\n"
    "plt.tight_layout()\n"
    "plt.savefig('ei_landscape.png', dpi=150, bbox_inches='tight')\n"
    "plt.show()"
))

# ── STEP 11: SUMMARY ────────────────────────────────────────────────────────
cells.append(md("## Step 11 — Summary"))
cells.append(code(
    "print('=' * 60)\n"
    "print('  WS2 THERMAL CVD — BAYESIAN OPTIMIZATION SUMMARY')\n"
    "print('=' * 60)\n"
    "print(f'  Dataset  : {FILE}')\n"
    "print(f'  Samples  : {len(y_raw)} Thermal CVD rows with measured FWHM')\n"
    "print(f'  Variables: {VARIABLES}')\n"
    "print(f'  Target   : {TARGET}')\n"
    "print()\n"
    "print(f'  Best FWHM observed : {y_raw[best_idx]:.0f} meV  (Exp {best_idx+1})')\n"
    "print(f'  Worst FWHM observed: {y_raw.max():.0f} meV')\n"
    "print(f'  Mean FWHM          : {y_raw.mean():.1f} meV')\n"
    "print()\n"
    "print(f'  Kernel  : ARD Matern nu=2.5 + ConstantKernel + WhiteKernel')\n"
    "print(f'  LOO R2  : {scores.mean():.3f}')\n"
    "print()\n"
    "print('  NEXT EXPERIMENT:')\n"
    "for v, val in next_params.items():\n"
    "    print(f'    {v:12s}: {val:.2f}')\n"
    "print('=' * 60)"
))

# ── BUILD NOTEBOOK ──────────────────────────────────────────────────────────
nb = {
    "nbformat": 4,
    "nbformat_minor": 5,
    "metadata": {
        "kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
        "language_info": {"name": "python", "version": "3.10.0"}
    },
    "cells": cells
}

out = r"c:\Users\Khushboo\OneDrive\Desktop\quantam-ai\WS2_ThermalCVD_BayesOpt_Final.ipynb"
with open(out, "w", encoding="utf-8") as f:
    json.dump(nb, f, indent=2, ensure_ascii=False)

print(f"Notebook created: {out}")
print(f"Total cells: {len(cells)}")
