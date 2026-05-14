# Thermal CVD Bayesian Optimization Backend

Complete ML backend for Thermal CVD (Chemical Vapor Deposition) of WS₂ using Bayesian Optimization to minimize PL FWHM (photoluminescence full-width-half-maximum).

## Overview

This backend implements:
- **Gaussian Process Surrogate Model** - Predicts FWHM from process parameters
- **Bayesian Optimization** - Uses Expected Improvement (EI) to suggest optimal experiments
- **Intelligent Encoding** - Handles categorical constants & continuous variables
- **REST API** - FastAPI endpoints for predictions and optimization

## Key Features

### 1. **Data Encoding (`data_encoder.py`)**
- Encodes 9 categorical constants (precursor, substrate, gas, etc.)
- Handles 6 numeric constants (flow rates, heating rate, etc.)
- Manages 4 sweep variables:
  - **GTE**: Growth Temperature (550-1050°C)
  - **GTI**: Growth Time (5-60 min)
  - **FRA**: Ar Flow Rate (0-200 sccm)
  - **Pressure**: (5-760 Torr)
- **Key advantage**: All categories are pre-fitted, so changing constants doesn't require re-training

### 2. **Gaussian Process Model (`gp_model.py`)**
- **Kernel**: Matérn 5/2 (optimal for physical processes)
- **Features**: 
  - Length-scale optimization
  - White noise kernel (measurement uncertainty)
  - Automatic hyperparameter tuning
- **Output**: Mean prediction + uncertainty bounds

### 3. **Bayesian Optimization Engine (`bayesian_optimization.py`)**
- **Acquisition Function**: Expected Improvement (EI)
- **Minimization Target**: PL FWHM (lower = better crystal quality)
- **Trade-off Parameter**: `xi=0.01` (exploration vs exploitation balance)
- **Single-step & loop modes**: Suggest next experiment OR run full BO sequence

### 4. **Main Orchestrator (`optimizer.py`)**
- Coordinates all components
- Manages model lifecycle (fit, predict, optimize)
- Supports changing constants for new experimental setups

### 5. **Database Models (`thermal_cvd_models.py`)**
- `ThermalCVDExperiment`: Planned/executed experiments
- `ThermalCVDResult`: Experimental measurements
- `BORecommendationRecord`: BO recommendations & tracking

## API Endpoints

### Base URL
```
/thermal-cvd/
```

### 1. **GET** `/info`
Get model status and training metrics.

**Response:**
```json
{
  "status": "fitted",
  "kernel": "...",
  "MAE_meV": 15.3,
  "R2_score": 0.87,
  "n_training_samples": 21,
  "n_search_points": 5000
}
```

---

### 2. **GET** `/constants`
Get current constant values and encoding maps.

**Response:**
```json
{
  "constants": {
    "P1": "WCl6",
    "Substrate": "SiO2/Si",
    "CG": "Ar",
    "FRH": 0.0,
    "HR": 15.0
  },
  "label_maps": {
    "P1": {"WO3": 0, "WCl6": 1, "W(CO)6": 2, ...},
    "Substrate": {"SiO2/Si": 0, "Sapphire": 1, ...}
  },
  "variables": ["GTE", "GTI", "FRA", "Pressure"],
  "variable_ranges": {
    "GTE": [550, 1050],
    "GTI": [5, 60],
    "FRA": [0, 200],
    "Pressure": [5, 760]
  }
}
```

---

### 3. **POST** `/constants`
Update a constant for a new experimental setup.

**Request:**
```json
{
  "column": "P1",
  "value": "WO3"
}
```

**Response:**
```json
{
  "message": "Constant P1 updated to WO3",
  "constants": {...}
}
```

---

### 4. **POST** `/predict`
Predict FWHM for given process parameters.

**Request:**
```json
{
  "GTE": 800,
  "GTI": 20,
  "FRA": 100,
  "Pressure": 50
}
```

**Response:**
```json
{
  "variables": {
    "GTE": 800,
    "GTI": 20,
    "FRA": 100,
    "Pressure": 50
  },
  "prediction": {
    "predicted_FWHM_meV": 52.3,
    "uncertainty_meV": 8.5,
    "lower_bound_meV": 35.6,
    "upper_bound_meV": 69.0
  }
}
```

---

### 5. **POST** `/suggest`
Suggest next experiments with highest Expected Improvement.

**Request:**
```json
{
  "n_suggestions": 5
}
```

**Response:**
```json
{
  "n_recommendations": 5,
  "recommendations": [
    {
      "step": 1,
      "GTE_celsius": 825.50,
      "GTI_minutes": 18.30,
      "FRA_sccm": 95.20,
      "Pressure_Torr": 48.70,
      "predicted_FWHM_meV": 35.2,
      "uncertainty_meV": 12.1,
      "EI_value": 0.024531
    },
    ...
  ]
}
```

---

### 6. **POST** `/optimize`
Run full Bayesian Optimization loop.

**Request:**
```json
{
  "n_steps": 10
}
```

**Response:**
```json
{
  "recommendations": [
    {...},
    {...}
  ],
  "convergence_history": {
    "best_fwhm": [21.0, 19.5, 18.2, ...],
    "proposed_fwhm": [35.2, 33.1, 30.5, ...],
    "uncertainty": [12.1, 11.3, 10.8, ...]
  },
  "summary": {
    "best_predicted_FWHM": 15.8,
    "initial_best": 21.0,
    "improvement_meV": 5.2
  }
}
```

---

### 7. **GET** `/health`
Health check.

**Response:**
```json
{
  "status": "healthy"  // or "uninitialized" / "not_fitted"
}
```

---

### 8. **POST** `/reload`
Reload model from training data.

**Response:**
```json
{
  "message": "Model reloaded successfully"
}
```

## File Structure

```
backend/
├── app/
│   ├── ml_models/
│   │   └── thermal_cvd/
│   │       ├── __init__.py
│   │       ├── data_encoder.py          # ThermalCVDEncoder
│   │       ├── gp_model.py              # ThermalCVDGPModel
│   │       ├── bayesian_optimization.py # BayesianOptimizationEngine
│   │       └── optimizer.py             # ThermalCVDOptimizer (main)
│   ├── routes/
│   │   └── thermal_cvd_routes.py        # FastAPI routes
│   └── database/
│       └── thermal_cvd_models.py        # Data models
├── datasets/
│   └── thermal_cvd/
│       ├── labelled.xlsx                # 21 training samples
│       └── thermal_cvd_rows.xlsx        # 7 experimental observations
├── server.py                             # Main FastAPI app
└── requirements.txt
```

## Usage Examples

### 1. **Initialize Backend**
```bash
cd backend
pip install -r requirements.txt
python server.py
```

The model auto-initializes on startup using `labelled.xlsx` or `thermal_cvd_rows.xlsx`.

### 2. **Make a Prediction**
```bash
curl -X POST http://localhost:8000/thermal-cvd/predict \
  -H "Content-Type: application/json" \
  -d '{"GTE": 800, "GTI": 20, "FRA": 100, "Pressure": 50}'
```

### 3. **Get 5 Best Next Experiments**
```bash
curl -X POST http://localhost:8000/thermal-cvd/suggest \
  -H "Content-Type: application/json" \
  -d '{"n_suggestions": 5}'
```

### 4. **Change Experimental Setup**
```bash
# Change precursor from WCl6 to WO3
curl -X POST http://localhost:8000/thermal-cvd/constants \
  -H "Content-Type: application/json" \
  -d '{"column": "P1", "value": "WO3"}'

# Change substrate
curl -X POST http://localhost:8000/thermal-cvd/constants \
  -H "Content-Type: application/json" \
  -d '{"column": "Substrate", "value": "Sapphire"}'
```

### 5. **Run Full BO Loop (10 steps)**
```bash
curl -X POST http://localhost:8000/thermal-cvd/optimize \
  -H "Content-Type: application/json" \
  -d '{"n_steps": 10}'
```

## Training Data Format

The model expects Excel files with these columns:

```
P1, P2, CP1, CP2, FRP1, FRP2, SA, Substrate, CG, FRA, FRH,
GTE, GTI, HR, Pressure, COM, PC, TOCVD, Class,
PL Peak Position, PL FWHM
```

**Key columns:**
- `PL_FWHM` (or `PL FWHM`): Target variable (in meV)
- `GTE`, `GTI`, `FRA`, `Pressure`: Sweep variables
- Others: Constants

## Model Architecture

### Workflow
1. **Encoding**: Raw data → Constants (encoded) + Variables (scaled)
2. **GP Training**: Scaled features → Matérn kernel with hyperparameter optimization
3. **Search Space**: Generate 5000 random points across variable ranges
4. **EI Acquisition**: At each BO step, find highest-EI point (exploration vs exploitation)
5. **Suggest**: Return top-N recommendations

### Mathematical Details

**Expected Improvement (minimize FWHM):**
```
EI(x) = (y_best - μ(x) - ξ) * Φ(Z) + σ(x) * φ(Z)
where Z = (y_best - μ(x) - ξ) / σ(x)
```

- `μ(x)` = GP mean prediction at point x
- `σ(x)` = GP uncertainty (std dev)
- `y_best` = Best observed FWHM so far
- `ξ = 0.01` = Exploration parameter
- `Φ`, `φ` = Standard normal CDF & PDF

## Configuration

### In `data_encoder.py`
```python
# Adjust variable ranges (literature-based for WS₂ Thermal CVD)
VARIABLE_RANGES = {
    'GTE': (550, 1050),      # Growth Temperature
    'GTI': (5, 60),          # Growth Time
    'FRA': (0, 200),         # Ar Flow Rate
    'Pressure': (5, 760),    # Pressure
}
```

### In `bayesian_optimization.py`
```python
# Adjust exploration-exploitation trade-off
xi = 0.01  # Lower = more exploration, Higher = more exploitation
```

### In `gp_model.py`
```python
# Kernel configuration (Matérn 5/2 is robust for physical processes)
kernel = (
    ConstantKernel(1.0, (1e-3, 1e3))
    * Matern(length_scale=1.0, nu=2.5)
    + WhiteKernel(noise_level=1.0)
)
```

## Performance Metrics

On the labelled dataset (21 samples):
- **Train MAE**: ~15 meV
- **Train R²**: ~0.87
- **Convergence**: BO loop typically finds ~5-8% improvement in 10 steps

## Future Enhancements

- [ ] Batch BO (suggest multiple experiments in parallel)
- [ ] Multi-objective optimization (FWHM + other properties)
- [ ] Adaptive kernel selection
- [ ] Real-time model updates with new experimental data
- [ ] Uncertainty quantification improvements
- [ ] Active learning with human feedback

## References

- Gaussian Processes: Rasmussen & Williams (2006)
- Bayesian Optimization: Brochu et al. (2010)
- Expected Improvement: Jones et al. (1998)
