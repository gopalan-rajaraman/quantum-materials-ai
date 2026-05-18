"""
API routes for Thermal CVD Bayesian Optimization.
Handles model training, predictions, and optimization requests.
FastAPI routes for integration with FastAPI backend.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import pandas as pd
import numpy as np
import traceback
from pathlib import Path
from typing import Optional, List, Dict, Any

from app.ml_models.thermal_cvd import ThermalCVDOptimizer

# Global optimizer instance (initialized on startup)
optimizer_instance: Optional[ThermalCVDOptimizer] = None

router = APIRouter(prefix="/thermal-cvd", tags=["thermal-cvd"])


# ============================================================================
# Pydantic Models for Request/Response
# ============================================================================


class PredictionRequest(BaseModel):
    GTE: float
    GTI: float
    FRA: float
    Pressure: float


class SuggestRequest(BaseModel):
    n_suggestions: int = 5


class OptimizeRequest(BaseModel):
    n_steps: int = 10


class ConstantUpdateRequest(BaseModel):
    column: str
    value: Any


# ============================================================================
# Initialization
# ============================================================================


def init_thermal_cvd_model(data_file: Optional[str] = None):
    """
    Initialize the thermal CVD optimizer with training data.

    Args:
        data_file: Path to training data CSV/Excel file
    """
    global optimizer_instance

    try:
        optimizer_instance = ThermalCVDOptimizer()

        # Load default training data
        if data_file is None:
            # Search known absolute paths first, then relative paths as fallback
            known_paths = [
                Path(r'C:\Users\Khushboo\OneDrive\Desktop\AI-Material-Optimization\labelled.xlsx'),
                Path(r'C:\Users\Khushboo\OneDrive\Desktop\AI-Material-Optimization\thermal_cvd_rows.xlsx'),
            ]
            # Also try relative to the workspace root
            workspace_root = Path(__file__).parent.parent.parent.parent.parent
            known_paths += [
                workspace_root / 'labelled.xlsx',
                workspace_root / 'thermal_cvd_rows.xlsx',
                Path(__file__).parent.parent.parent.parent / 'labelled.xlsx',
            ]
            for p in known_paths:
                if p.exists():
                    data_file = str(p)
                    break

        if data_file and Path(data_file).exists():
            df = pd.read_excel(data_file)

            # Clean column names (replace spaces with underscores if needed)
            df.columns = [col.replace(' ', '_') if col not in ['PL Peak Position', 'PL_FWHM', 'PL FWHM'] else col for col in df.columns]

            # Handle PL FWHM column name variants
            if 'PL_FWHM' not in df.columns and 'PL FWHM' in df.columns:
                df = df.rename(columns={'PL FWHM': 'PL_FWHM'})

            # Coerce known numeric columns (handles 'NS' or empty strings)
            num_cols = ['FRH', 'HR', 'FRP1', 'FRP2', 'CP1', 'CP2', 'GTE', 'GTI', 'FRA', 'Pressure', 'PL_FWHM']
            for col in num_cols:
                if col in df.columns:
                    df[col] = pd.to_numeric(df[col], errors='coerce')

            optimizer_instance.load_training_data(df)
            optimizer_instance.generate_search_space(n_points=5000)
            optimizer_instance.train_gp()

            print(f'Thermal CVD optimizer initialized with {len(df)} training samples')
        else:
            print('No training data found. Optimizer initialized but not fitted.')

    except Exception as e:
        print(f'Error initializing thermal CVD model: {e}')
        traceback.print_exc()


# ============================================================================
# ROUTES
# ============================================================================


@router.get("/info")
def get_model_info():
    """Get current model status and metrics."""
    if optimizer_instance is None:
        raise HTTPException(status_code=503, detail="Model not initialized")

    try:
        info = optimizer_instance.get_model_info()
        return info
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/constants")
def get_constants():
    """Get current constant values and encoding maps."""
    if optimizer_instance is None:
        raise HTTPException(status_code=503, detail="Model not initialized")

    try:
        info = optimizer_instance.get_encoding_info()
        return info
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/constants")
def set_constant(request: ConstantUpdateRequest):
    """Update a constant value for a new experimental setup."""
    if optimizer_instance is None:
        raise HTTPException(status_code=503, detail="Model not initialized")

    try:
        optimizer_instance.set_constant(request.column, request.value)

        return {
            'message': f'Constant {request.column} updated to {request.value}',
            'constants': optimizer_instance.get_encoding_info()['constants'],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/predict")
def predict_fwhm(request: PredictionRequest):
    """
    Predict FWHM for given process variables.

    Args:
        GTE: Growth Temperature (°C)
        GTI: Growth Time (min)
        FRA: Ar Flow Rate (sccm)
        Pressure: Pressure (Torr)
    """
    if optimizer_instance is None or not optimizer_instance._fitted:
        raise HTTPException(status_code=503, detail="Model not fitted")

    try:
        result = optimizer_instance.predict_fwhm(
            GTE=request.GTE,
            GTI=request.GTI,
            FRA=request.FRA,
            Pressure=request.Pressure,
        )

        return {
            'variables': {
                'GTE': request.GTE,
                'GTI': request.GTI,
                'FRA': request.FRA,
                'Pressure': request.Pressure,
            },
            'prediction': result,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/suggest")
def suggest_experiments(request: SuggestRequest):
    """
    Suggest next experiments with highest Expected Improvement.

    Args:
        n_suggestions: Number of recommendations to return (default=5)
    """
    if optimizer_instance is None or not optimizer_instance._fitted:
        raise HTTPException(status_code=503, detail="Model not fitted")

    try:
        recommendations = optimizer_instance.suggest_next_experiment(
            n_suggestions=request.n_suggestions
        )

        return {
            'n_recommendations': len(recommendations),
            'recommendations': recommendations,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/optimize")
def run_optimization(request: OptimizeRequest):
    """
    Run full Bayesian Optimization loop.

    Args:
        n_steps: Number of BO iterations (default=10)
    """
    if optimizer_instance is None or not optimizer_instance._fitted:
        raise HTTPException(status_code=503, detail="Model not fitted")

    try:
        result = optimizer_instance.run_bo_optimization(n_steps=request.n_steps)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/simulate-run")
def simulate_run():
    """Simulate running the highest EI experiment and update the model."""
    if optimizer_instance is None or not optimizer_instance._fitted:
        raise HTTPException(status_code=503, detail="Model not fitted")
        
    try:
        result = optimizer_instance.simulate_experiment()
        # Log activity
        from app.routes.upload_routes import log_activity
        fwhm = result.get('predicted_FWHM_meV', '?')
        log_activity("BO Experiment Simulated", f"Predicted FWHM: {fwhm:.2f} meV | Samples: {result.get('new_total_samples')}", "bg-emerald-500")
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class AddExperimentRequest(BaseModel):
    GTE: float
    GTI: float
    FRA: float
    Pressure: float
    PL_FWHM: float

@router.post("/add-experiment")
def add_experiment(request: AddExperimentRequest):
    """Add a manual experiment result and update the model."""
    if optimizer_instance is None or not optimizer_instance._fitted:
        raise HTTPException(status_code=503, detail="Model not fitted")
        
    try:
        var_dict = {
            'GTE': request.GTE,
            'GTI': request.GTI,
            'FRA': request.FRA,
            'Pressure': request.Pressure,
        }
        result = optimizer_instance.add_experiment(var_dict, request.PL_FWHM)
        
        # Log activity
        from app.routes.upload_routes import log_activity
        log_activity("Experiment Result Added", f"FWHM: {request.PL_FWHM:.2f} meV | Samples: {result.get('new_total_samples')}", "bg-emerald-500")
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
def health_check():
    """Health check endpoint."""
    status = 'healthy'
    if optimizer_instance is None:
        status = 'uninitialized'
    elif not optimizer_instance._fitted:
        status = 'not_fitted'

    return {'status': status}


@router.get("/plot-data")
def get_plot_data():
    """Get 1D slice of Surrogate and EI along GTE parameter."""
    if optimizer_instance is None or not optimizer_instance._fitted:
        raise HTTPException(status_code=503, detail="Model not fitted")
        
    try:
        # Get the best recommended point to fix the other variables
        recommendations = optimizer_instance.suggest_next_experiment(n_suggestions=1)
        best = recommendations[0]
        
        # Sweep GTE while keeping others fixed
        gte_range = np.linspace(550, 1050, 100)
        
        var_dicts = []
        for gte in gte_range:
            var_dicts.append({
                'GTE': float(gte),
                'GTI': best['GTI_minutes'],
                'FRA': best['FRA_sccm'],
                'Pressure': best['Pressure_Torr']
            })
            
        X_search_list = [optimizer_instance.encoder.encode_variables(vd)[0] for vd in var_dicts]
        X_sweep = np.array(X_search_list)
        
        # Calculate MU, SIGMA
        mu, sigma = optimizer_instance.gp_model.predict(X_sweep, return_std=True)
        
        # Calculate EI
        y_best = optimizer_instance.y_train.min()
        ei_vals = optimizer_instance.bo_engine.expected_improvement(
            X_sweep, optimizer_instance.gp_model.gp, y_best, xi=0.01
        )
        
        return {
            'x': gte_range.tolist(),
            'mu': mu.tolist(),
            'sigma': sigma.tolist(),
            'ei': ei_vals.tolist(),
            'fixed_params': {
                'GTI': best['GTI_minutes'],
                'FRA': best['FRA_sccm'],
                'Pressure': best['Pressure_Torr']
            }
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reload")
def reload_model():
    """Reload model from training data."""
    try:
        init_thermal_cvd_model()
        return {'message': 'Model reloaded successfully'}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
