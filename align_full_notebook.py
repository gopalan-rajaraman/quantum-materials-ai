
import json
import shutil

NOTEBOOK_PATHS = [
    r"c:\Users\Khushboo\OneDrive\Desktop\quantam-ai\WS2_CVD_Bayesian_Optimization.ipynb",
    r"c:\Users\Khushboo\OneDrive\Desktop\quantam-ai\WS2_CVD_Bayesian_Optimization_Final.ipynb",
]

# ─── EXACT CODE BLOCKS FROM THE APP ──────────────────────────────────────────

STEP0_IMPORTS = """\
# Install required packages
!pip install scikit-learn scipy numpy pandas openpyxl matplotlib seaborn -q

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import matplotlib.gridspec as gridspec
import seaborn as sns
from scipy.stats import norm, qmc
from sklearn.gaussian_process import GaussianProcessRegressor
from sklearn.gaussian_process.kernels import Matern, ConstantKernel as C, WhiteKernel
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_absolute_error, r2_score, mean_squared_error
from sklearn.model_selection import LeaveOneOut, cross_val_score
import warnings
warnings.filterwarnings('ignore')

# Plotting style
plt.rcParams.update({
    'figure.dpi': 150,
    'font.family': 'DejaVu Sans',
    'axes.spines.top': False,
    'axes.spines.right': False,
    'axes.titlesize': 13,
    'axes.labelsize': 11,
})
COLORS = {
    'primary': '#2E86AB',
    'secondary': '#A23B72',
    'accent': '#F18F01',
    'success': '#5C9E31',
    'danger': '#E84855',
    'bg': '#F7F9FC',
    'gp_mean': '#2E86AB',
    'gp_ci': '#AED6F1',
    'acq': '#F18F01',
    'obs': '#E84855',
    'next': '#5C9E31',
}
print('All libraries loaded successfully!')
"""

STEP1_LOAD = """\
import io

print('Loading WS2 Thermal CVD database...')
print('   Required column: TOCVD (to filter Thermal CVD rows)')
print('   Target column:   PL FWHM (what we want to minimize)')
print()

# ── Load the 17-point dataset (same file used by the app) ──────────────────
file_name = 'WS2_ThermalCVD_BlankCells_17points.xlsx'
df_raw = pd.read_excel(file_name)

# Replace 'NS' (Not Specified) with NaN — matches app logic
df_raw = df_raw.replace('NS', np.nan)

# Handle PL FWHM column name variant
if 'PL_FWHM' not in df_raw.columns and 'PL FWHM' in df_raw.columns:
    df_raw = df_raw.rename(columns={'PL FWHM': 'PL_FWHM'})

print(f'\n✅ File loaded: {file_name}')
print(f'📊 Total rows: {len(df_raw)} | Total columns: {len(df_raw.columns)}')
print(f'   Columns: {list(df_raw.columns)}')
"""

STEP2_FILTER = """\
# ─── Column name mapping (auto-detect or use defaults) ──────────────────────
COL_MAP = {
    'P1':          'P1',
    'P2':          'P2',
    'CP1':         'CP1',
    'CP2':         'CP2',
    'FRP1':        'FRP1',
    'FRP2':        'FRP2',
    'SA':          'SA',
    'Substrate':   'Substrate',
    'CG':          'CG',
    'FRA':         'FRA',
    'FRH':         'FRH',
    'GTE':         'GTE',
    'GTI':         'GTI',
    'HR':          'HR',
    'Pressure':    'Pressure',
    'COM':         'COM',
    'PC':          'PC',
    'TOCVD':       'TOCVD',
    'Class':       'Class',
    'PL_peak':     'PL Peak Position',
    'FWHM':        'PL_FWHM',
}

# Filter Thermal CVD — matches app: df[df['TOCVD'] == 'Thermal CVD']
if COL_MAP['TOCVD'] not in df_raw.columns:
    raise ValueError(f"Column '{COL_MAP['TOCVD']}' not found. Available: {list(df_raw.columns)}")

df = df_raw[df_raw[COL_MAP['TOCVD']] == 'Thermal CVD'].copy().reset_index(drop=True)

# Coerce known numeric columns (matches app logic)
num_cols = ['FRH', 'HR', 'FRP1', 'FRP2', 'CP1', 'CP2', 'GTE', 'GTI', 'FRA', 'Pressure', 'PL_FWHM']
for col in num_cols:
    if col in df.columns:
        df[col] = pd.to_numeric(df[col], errors='coerce')

print(f'🧪 Thermal CVD experiments found: {len(df)}')
print(f'   FWHM range: {df[COL_MAP["FWHM"]].min()} – {df[COL_MAP["FWHM"]].max()} meV')
print()

display(df.style.set_caption('Thermal CVD Experiments (Your Database)').background_gradient(
    subset=[COL_MAP['FWHM']], cmap='RdYgN_r'))
"""

STEP3_PARAMS = """\
# ─── EXACT SAME CONSTANTS \u0026 VARIABLES AS THE APP ────────────────────────────
# (Matches ThermalCVDEncoder in app/ml_models/thermal_cvd/data_encoder.py)

# Categorical constants (8) — Note: TOCVD excluded (already filtered)
CAT_CONSTANTS = ['P1', 'P2', 'Substrate', 'CG', 'COM', 'PC', 'SA', 'Class']

# Numerical constants — stored for reference only, NOT in feature matrix
NUM_CONSTANTS = ['FRH', 'HR', 'FRP1', 'FRP2', 'CP1', 'CP2']

# Variables — the 4 parameters swept by Bayesian Optimization
VARIABLES = ['GTE', 'GTI', 'FRA', 'Pressure']

# Variable bounds — EXACT same as app's VARIABLE_RANGES
VARIABLE_RANGES = {
    'GTE':      (500, 1100),   # Growth Temperature [°C]
    'GTI':      (5, 60),       # Growth Time [min]
    'FRA':      (0, 100),      # Ar Flow Rate [sccm]
    'Pressure': (1, 760),      # Chamber Pressure [Torr]
}

TARGET = 'PL_FWHM'

print('=' * 60)
print('📊 PARAMETER CLASSIFICATION SUMMARY (Matches App)')
print('=' * 60)
print(f'\n🔒 Categorical Constants ({len(CAT_CONSTANTS)}): {CAT_CONSTANTS}')
print(f'🔢 Numerical Constants ({len(NUM_CONSTANTS)}): {NUM_CONSTANTS}')
print(f'\n🎯 Optimization Variables ({len(VARIABLES)}):')
for v, (lo, hi) in VARIABLE_RANGES.items():
    obs = df[v].dropna().tolist()
    print(f'   {v:12s} | Range: [{lo:6} – {hi:6}] | Observed: {obs}')
print(f'\n🎯 Target: {TARGET} (meV) — we want to MINIMIZE this!')
print('=' * 60)
"""

STEP4_ENCODE = """\
# ─── STEP 4: ENCODE — Matches app's ThermalCVDEncoder.fit_on_data() ─────────

# 1. Fit categorical LabelEncoders (fill NaN with 'Unknown')
label_encoders = {}
constant_values = {}

for col in CAT_CONSTANTS:
    series = df[col].fillna('Unknown').astype(str)
    le = LabelEncoder()
    le.fit(series.unique())
    label_encoders[col] = le
    constant_values[col] = series.mode()[0]
    print(f'   {col:12s} | Fixed at: {repr(constant_values[col]):20s} | Options: {list(le.classes_)}')

# 2. Store numerical constant medians for reference
for col in NUM_CONSTANTS:
    if col in df.columns:
        val = pd.to_numeric(df[col], errors='coerce').dropna()
        constant_values[col] = float(val.median()) if len(val) > 0 else 0.0
    else:
        constant_values[col] = 0.0

print()
"""

STEP5_FEATURE_MATRIX = """\
# ─── STEP 5: BUILD FEATURE MATRIX \u0026 SCALE ───────────────────────────────────
# Matches app: _build_raw_feature_matrix() → imputer → scaler_X
# Feature layout: [GTE, GTI, FRA, Pressure]  (4D — variables only)

# Build raw variable feature matrix
X_raw = df[VARIABLES].apply(pd.to_numeric, errors='coerce').values.astype(float)
y_raw = pd.to_numeric(df[TARGET], errors='coerce').values.astype(float)

# Remove rows with missing target
valid_mask = ~np.isnan(y_raw)
X_raw = X_raw[valid_mask]
y_raw = y_raw[valid_mask]

# Impute missing variable values with mean — matches app's SimpleImputer(strategy='mean')
imputer = SimpleImputer(strategy='mean')
X_imputed = imputer.fit_transform(X_raw)

# Scale X — matches app's StandardScaler for X
scaler_X = StandardScaler()
X_scaled = scaler_X.fit_transform(X_imputed)

# Scale y — matches app's StandardScaler for y (scaler_y)
scaler_y = StandardScaler()
y_scaled = scaler_y.fit_transform(y_raw.reshape(-1, 1)).ravel()

print(f'✅ Feature matrix built: {X_scaled.shape} (n_samples × n_variables)')
print(f'   Variables: {VARIABLES}')
print(f'   y (raw FWHM meV): {y_raw.tolist()}')
print(f'   y (scaled):        {np.round(y_scaled, 3).tolist()}')
"""

STEP6_SEARCH_SPACE = """\
# ─── STEP 6: GENERATE SEARCH SPACE ──────────────────────────────────────────
# Matches app's generate_search_space() using Latin Hypercube Sampling

from scipy.stats import qmc

N_SEARCH = 5000  # Same as app: n_points=5000

var_names = list(VARIABLE_RANGES.keys())
l_bounds = [VARIABLE_RANGES[v][0] for v in var_names]
u_bounds = [VARIABLE_RANGES[v][1] for v in var_names]

sampler = qmc.LatinHypercube(d=len(var_names), seed=42)
sample = sampler.random(n=N_SEARCH)
X_search_raw = qmc.scale(sample, l_bounds, u_bounds)

# Scale search space using the same scaler_X
X_search_imputed = imputer.transform(X_search_raw)
X_search = scaler_X.transform(X_search_imputed)

print(f'✅ Search space generated: {X_search.shape}')
print(f'   Using Latin Hypercube Sampling (seed=42) — same as app')
"""

STEP7_GP = """\
# ─── STEP 7: GP KERNEL \u0026 MODEL ───────────────────────────────────────────────
# EXACT same kernel as app's ThermalCVDGPModel in gp_model.py:
#   ConstantKernel(1.0, (0.1, 10.0))
#   * Matern(length_scale=[1.0,1.0,1.0,1.0], length_scale_bounds=(0.1, 10.0), nu=2.5)
#   + WhiteKernel(noise_level=1e-3, noise_level_bounds=(1e-4, 1e-1))
# n_restarts_optimizer=15, normalize_y=True, random_state=42

kernel = (
    C(1.0, (0.1, 10.0))
    * Matern(length_scale=[1.0, 1.0, 1.0, 1.0], length_scale_bounds=(0.1, 10.0), nu=2.5)
    + WhiteKernel(noise_level=1e-3, noise_level_bounds=(1e-4, 1e-1))
)

gp = GaussianProcessRegressor(
    kernel=kernel,
    n_restarts_optimizer=15,
    normalize_y=True,
    random_state=42
)

gp.fit(X_scaled, y_scaled)

# Predict on training data (in scaled space, then inverse-transform)
y_pred_scaled, y_std_scaled = gp.predict(X_scaled, return_std=True)
y_pred = scaler_y.inverse_transform(y_pred_scaled.reshape(-1, 1)).ravel()
y_std  = y_std_scaled * scaler_y.scale_[0]

# Cross-validate (LOO for small dataset)
loo = LeaveOneOut()
scores = cross_val_score(gp, X_scaled, y_scaled, cv=loo, scoring='r2')

print('✅ GP Model Trained! (Exact app logic: ARD Matern nu=2.5 + WhiteKernel)')
print(f'   Kernel (optimized): {gp.kernel_}')
print(f'   LOO R² scores: {scores.round(3)}')
print(f'   Mean LOO R²: {scores.mean():.3f}')
print()
print('   Predicted vs Actual FWHM:')
for i, (act, pred, std) in enumerate(zip(y_raw, y_pred, y_std)):
    print(f'   Exp {i+1}: Actual={act:.0f} meV | Predicted={pred:.1f} ± {std:.1f} meV')
"""

# ─────────────────────────────────────────────────────────────────────────────

STEP_REPLACEMENTS = {
    # key = substring to look for in the cell's source, value = new source
    "All libraries loaded successfully": STEP0_IMPORTS,
    "Please upload your Excel file":     STEP1_LOAD,
    "Filter Thermal CVD":                STEP2_FILTER,
    "PARAMETER CLASSIFICATION":          STEP3_PARAMS,
    "CATEGORICAL_CONSTANTS":             STEP4_ENCODE,
    "scaler_X = StandardScaler":         STEP5_FEATURE_MATRIX,
    "search_space":                      STEP6_SEARCH_SPACE,
    "GP Kernel":                         STEP7_GP,
}

def fix_notebook(path):
    print(f"\n{'='*60}\nFixing: {path}\n{'='*60}")
    with open(path, 'r', encoding='utf-8') as f:
        nb = json.load(f)

    replaced = []
    for cell in nb.get('cells', []):
        if cell.get('cell_type') != 'code':
            continue
        source = ''.join(cell.get('source', []))
        for marker, new_code in STEP_REPLACEMENTS.items():
            if marker in source:
                cell['source'] = new_code.splitlines(keepends=True)
                replaced.append(marker)
                print(f"  [DONE] Replaced cell with marker: '{marker}'")
                break

    with open(path, 'w', encoding='utf-8') as f:
        json.dump(nb, f, indent=2, ensure_ascii=False)
    print(f"Done. Replaced {len(replaced)} cells.")

for p in NOTEBOOK_PATHS:
    fix_notebook(p)

print("\n\nBoth notebooks now exactly match the app's ML pipeline!")
# Copy the final notebook to a new aligned version
shutil.copy(r"c:\\Users\\Khushboo\\OneDrive\\Desktop\\quantam-ai\\WS2_CVD_Bayesian_Optimization_Final.ipynb",
            r"c:\\Users\\Khushboo\\OneDrive\\Desktop\\quantam-ai\\WS2_CVD_Bayesian_Optimization_Final_aligned.ipynb")
print("Created aligned final notebook: WS2_CVD_Bayesian_Optimization_Final_aligned.ipynb")
import re

NOTEBOOK_PATHS = [
    r"c:\Users\Khushboo\OneDrive\Desktop\quantam-ai\WS2_CVD_Bayesian_Optimization.ipynb",
    r"c:\Users\Khushboo\OneDrive\Desktop\quantam-ai\WS2_CVD_Bayesian_Optimization_Final.ipynb",
]

# ─── EXACT CODE BLOCKS FROM THE APP ──────────────────────────────────────────

STEP0_IMPORTS = """\
# Install required packages
!pip install scikit-learn scipy numpy pandas openpyxl matplotlib seaborn -q

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import matplotlib.gridspec as gridspec
import seaborn as sns
from scipy.stats import norm, qmc
from sklearn.gaussian_process import GaussianProcessRegressor
from sklearn.gaussian_process.kernels import Matern, ConstantKernel as C, WhiteKernel
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_absolute_error, r2_score, mean_squared_error
from sklearn.model_selection import LeaveOneOut, cross_val_score
import warnings
warnings.filterwarnings('ignore')

# Plotting style
plt.rcParams.update({
    'figure.dpi': 150,
    'font.family': 'DejaVu Sans',
    'axes.spines.top': False,
    'axes.spines.right': False,
    'axes.titlesize': 13,
    'axes.labelsize': 11,
})
COLORS = {
    'primary': '#2E86AB',
    'secondary': '#A23B72',
    'accent': '#F18F01',
    'success': '#5C9E31',
    'danger': '#E84855',
    'bg': '#F7F9FC',
    'gp_mean': '#2E86AB',
    'gp_ci': '#AED6F1',
    'acq': '#F18F01',
    'obs': '#E84855',
    'next': '#5C9E31',
}
print('All libraries loaded successfully!')
"""

STEP1_LOAD = """\
import io

print('Loading WS2 Thermal CVD database...')
print('   Required column: TOCVD (to filter Thermal CVD rows)')
print('   Target column:   PL FWHM (what we want to minimize)')
print()

# ── Load the 17-point dataset (same file used by the app) ──────────────────
file_name = 'WS2_ThermalCVD_BlankCells_17points.xlsx'
df_raw = pd.read_excel(file_name)

# Replace 'NS' (Not Specified) with NaN — matches app logic
df_raw = df_raw.replace('NS', np.nan)

# Handle PL FWHM column name variant
if 'PL_FWHM' not in df_raw.columns and 'PL FWHM' in df_raw.columns:
    df_raw = df_raw.rename(columns={'PL FWHM': 'PL_FWHM'})

print(f'\\n✅ File loaded: {file_name}')
print(f'📊 Total rows: {len(df_raw)} | Total columns: {len(df_raw.columns)}')
print(f'   Columns: {list(df_raw.columns)}')
"""

STEP2_FILTER = """\
# ─── Column name mapping (auto-detect or use defaults) ──────────────────────
COL_MAP = {
    'P1':          'P1',
    'P2':          'P2',
    'CP1':         'CP1',
    'CP2':         'CP2',
    'FRP1':        'FRP1',
    'FRP2':        'FRP2',
    'SA':          'SA',
    'Substrate':   'Substrate',
    'CG':          'CG',
    'FRA':         'FRA',
    'FRH':         'FRH',
    'GTE':         'GTE',
    'GTI':         'GTI',
    'HR':          'HR',
    'Pressure':    'Pressure',
    'COM':         'COM',
    'PC':          'PC',
    'TOCVD':       'TOCVD',
    'Class':       'Class',
    'PL_peak':     'PL Peak Position',
    'FWHM':        'PL_FWHM',
}

# Filter Thermal CVD — matches app: df[df['TOCVD'] == 'Thermal CVD']
if COL_MAP['TOCVD'] not in df_raw.columns:
    raise ValueError(f"Column '{COL_MAP['TOCVD']}' not found. Available: {list(df_raw.columns)}")

df = df_raw[df_raw[COL_MAP['TOCVD']] == 'Thermal CVD'].copy().reset_index(drop=True)

# Coerce known numeric columns (matches app logic)
num_cols = ['FRH', 'HR', 'FRP1', 'FRP2', 'CP1', 'CP2', 'GTE', 'GTI', 'FRA', 'Pressure', 'PL_FWHM']
for col in num_cols:
    if col in df.columns:
        df[col] = pd.to_numeric(df[col], errors='coerce')

print(f'🧪 Thermal CVD experiments found: {len(df)}')
print(f'   FWHM range: {df[COL_MAP["FWHM"]].min()} – {df[COL_MAP["FWHM"]].max()} meV')
print()

display(df.style.set_caption('Thermal CVD Experiments (Your Database)').background_gradient(
    subset=[COL_MAP['FWHM']], cmap='RdYlGn_r'))
"""

STEP3_PARAMS = """\
# ─── EXACT SAME CONSTANTS & VARIABLES AS THE APP ────────────────────────────
# (Matches ThermalCVDEncoder in app/ml_models/thermal_cvd/data_encoder.py)

# Categorical constants (8) — Note: TOCVD excluded (already filtered)
CAT_CONSTANTS = ['P1', 'P2', 'Substrate', 'CG', 'COM', 'PC', 'SA', 'Class']

# Numerical constants — stored for reference only, NOT in feature matrix
NUM_CONSTANTS = ['FRH', 'HR', 'FRP1', 'FRP2', 'CP1', 'CP2']

# Variables — the 4 parameters swept by Bayesian Optimization
VARIABLES = ['GTE', 'GTI', 'FRA', 'Pressure']

# Variable bounds — EXACT same as app's VARIABLE_RANGES
VARIABLE_RANGES = {
    'GTE':      (500, 1100),   # Growth Temperature [°C]
    'GTI':      (5, 60),       # Growth Time [min]
    'FRA':      (0, 100),      # Ar Flow Rate [sccm]
    'Pressure': (1, 760),      # Chamber Pressure [Torr]
}

TARGET = 'PL_FWHM'

print('=' * 60)
print('📊 PARAMETER CLASSIFICATION SUMMARY (Matches App)')
print('=' * 60)
print(f'\\n🔒 Categorical Constants ({len(CAT_CONSTANTS)}): {CAT_CONSTANTS}')
print(f'🔢 Numerical Constants ({len(NUM_CONSTANTS)}): {NUM_CONSTANTS}')
print(f'\\n🎯 Optimization Variables ({len(VARIABLES)}):')
for v, (lo, hi) in VARIABLE_RANGES.items():
    obs = df[v].dropna().tolist()
    print(f'   {v:12s} | Range: [{lo:6} – {hi:6}] | Observed: {obs}')
print(f'\\n🎯 Target: {TARGET} (meV) — we want to MINIMIZE this!')
print('=' * 60)
"""

STEP4_ENCODE = """\
# ─── STEP 4: ENCODE — Matches app's ThermalCVDEncoder.fit_on_data() ─────────

# 1. Fit categorical LabelEncoders (fill NaN with 'Unknown')
label_encoders = {}
constant_values = {}

for col in CAT_CONSTANTS:
    series = df[col].fillna('Unknown').astype(str)
    le = LabelEncoder()
    le.fit(series.unique())
    label_encoders[col] = le
    constant_values[col] = series.mode()[0]
    print(f'   {col:12s} | Fixed at: {repr(constant_values[col]):20s} | Options: {list(le.classes_)}')

# 2. Store numerical constant medians for reference
for col in NUM_CONSTANTS:
    if col in df.columns:
        val = pd.to_numeric(df[col], errors='coerce').dropna()
        constant_values[col] = float(val.median()) if len(val) > 0 else 0.0
    else:
        constant_values[col] = 0.0

print()
"""

STEP5_FEATURE_MATRIX = """\
# ─── STEP 5: BUILD FEATURE MATRIX & SCALE ───────────────────────────────────
# Matches app: _build_raw_feature_matrix() → imputer → scaler_X
# Feature layout: [GTE, GTI, FRA, Pressure]  (4D — variables only)

# Build raw variable feature matrix
X_raw = df[VARIABLES].apply(pd.to_numeric, errors='coerce').values.astype(float)
y_raw = pd.to_numeric(df[TARGET], errors='coerce').values.astype(float)

# Remove rows with missing target
valid_mask = ~np.isnan(y_raw)
X_raw = X_raw[valid_mask]
y_raw = y_raw[valid_mask]

# Impute missing variable values with mean — matches app's SimpleImputer(strategy='mean')
imputer = SimpleImputer(strategy='mean')
X_imputed = imputer.fit_transform(X_raw)

# Scale X — matches app's StandardScaler for X
scaler_X = StandardScaler()
X_scaled = scaler_X.fit_transform(X_imputed)

# Scale y — matches app's StandardScaler for y (scaler_y)
scaler_y = StandardScaler()
y_scaled = scaler_y.fit_transform(y_raw.reshape(-1, 1)).ravel()

print(f'✅ Feature matrix built: {X_scaled.shape} (n_samples × n_variables)')
print(f'   Variables: {VARIABLES}')
print(f'   y (raw FWHM meV): {y_raw.tolist()}')
print(f'   y (scaled):        {np.round(y_scaled, 3).tolist()}')
"""

STEP6_SEARCH_SPACE = """\
# ─── STEP 6: GENERATE SEARCH SPACE ──────────────────────────────────────────
# Matches app's generate_search_space() using Latin Hypercube Sampling

from scipy.stats import qmc

N_SEARCH = 5000  # Same as app: n_points=5000

var_names = list(VARIABLE_RANGES.keys())
l_bounds = [VARIABLE_RANGES[v][0] for v in var_names]
u_bounds = [VARIABLE_RANGES[v][1] for v in var_names]

sampler = qmc.LatinHypercube(d=len(var_names), seed=42)
sample = sampler.random(n=N_SEARCH)
X_search_raw = qmc.scale(sample, l_bounds, u_bounds)

# Scale search space using the same scaler_X
X_search_imputed = imputer.transform(X_search_raw)
X_search = scaler_X.transform(X_search_imputed)

print(f'✅ Search space generated: {X_search.shape}')
print(f'   Using Latin Hypercube Sampling (seed=42) — same as app')
"""

STEP7_GP = """\
# ─── STEP 7: GP KERNEL & MODEL ───────────────────────────────────────────────
# EXACT same kernel as app's ThermalCVDGPModel in gp_model.py:
#   ConstantKernel(1.0, (0.1, 10.0))
#   * Matern(length_scale=[1.0,1.0,1.0,1.0], length_scale_bounds=(0.1, 10.0), nu=2.5)
#   + WhiteKernel(noise_level=1e-3, noise_level_bounds=(1e-4, 1e-1))
# n_restarts_optimizer=15, normalize_y=True, random_state=42

kernel = (
    C(1.0, (0.1, 10.0))
    * Matern(length_scale=[1.0, 1.0, 1.0, 1.0], length_scale_bounds=(0.1, 10.0), nu=2.5)
    + WhiteKernel(noise_level=1e-3, noise_level_bounds=(1e-4, 1e-1))
)

gp = GaussianProcessRegressor(
    kernel=kernel,
    n_restarts_optimizer=15,
    normalize_y=True,
    random_state=42
)
gp.fit(X_scaled, y_scaled)

# Predict on training data (in scaled space, then inverse-transform)
y_pred_scaled, y_std_scaled = gp.predict(X_scaled, return_std=True)
y_pred = scaler_y.inverse_transform(y_pred_scaled.reshape(-1, 1)).ravel()
y_std  = y_std_scaled * scaler_y.scale_[0]

# Cross-validate (LOO for small dataset)
loo = LeaveOneOut()
scores = cross_val_score(gp, X_scaled, y_scaled, cv=loo, scoring='r2')

print('✅ GP Model Trained! (Exact app logic: ARD Matern nu=2.5 + WhiteKernel)')
print(f'   Kernel (optimized): {gp.kernel_}')
print(f'   LOO R² scores: {scores.round(3)}')
print(f'   Mean LOO R²: {scores.mean():.3f}')
print()
print('   Predicted vs Actual FWHM:')
for i, (act, pred, std) in enumerate(zip(y_raw, y_pred, y_std)):
    print(f'   Exp {i+1}: Actual={act:.0f} meV | Predicted={pred:.1f} ± {std:.1f} meV')
"""

# ─────────────────────────────────────────────────────────────────────────────

STEP_REPLACEMENTS = {
    # key = substring to look for in the cell's source, value = new source
    "All libraries loaded successfully": STEP0_IMPORTS,
    "Please upload your Excel file":     STEP1_LOAD,
    "Filter Thermal CVD":                STEP2_FILTER,
    "PARAMETER CLASSIFICATION":          STEP3_PARAMS,
    "CATEGORICAL_CONSTANTS":             STEP4_ENCODE,
    "scaler_X = StandardScaler":         STEP5_FEATURE_MATRIX,
    "search_space":                      STEP6_SEARCH_SPACE,
    "GP Kernel":                         STEP7_GP,
}

def fix_notebook(path):
    print(f"\n{'='*60}\nFixing: {path}\n{'='*60}")
    with open(path, 'r', encoding='utf-8') as f:
        nb = json.load(f)

    replaced = []
    for cell in nb.get('cells', []):
        if cell.get('cell_type') != 'code':
            continue
        source = ''.join(cell.get('source', []))
        for marker, new_code in STEP_REPLACEMENTS.items():
            if marker in source:
                cell['source'] = new_code.splitlines(keepends=True)
                replaced.append(marker)
                print(f"  [DONE] Replaced cell with marker: '{marker}'")
                break

    with open(path, 'w', encoding='utf-8') as f:
        json.dump(nb, f, indent=2, ensure_ascii=False)
    print(f"Done. Replaced {len(replaced)} cells.")

for p in NOTEBOOK_PATHS:
    fix_notebook(p)

print("\n\nAll notebooks now exactly match the app's ML pipeline!")
