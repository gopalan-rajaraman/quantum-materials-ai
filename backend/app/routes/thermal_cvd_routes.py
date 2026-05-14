"""
API routes for Thermal CVD Bayesian Optimization.
Handles model training, predictions, and optimization requests.
FastAPI routes for integration with FastAPI backend.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import pandas as pd
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
            # Try to load from thermal_cvd_rows.xlsx or labelled.xlsx
            workspace_root = Path(__file__).parent.parent.parent.parent.parent
            if (workspace_root / 'labelled.xlsx').exists():
                data_file = str(workspace_root / 'labelled.xlsx')
            elif (workspace_root / 'thermal_cvd_rows.xlsx').exists():
                data_file = str(workspace_root / 'thermal_cvd_rows.xlsx')

        if data_file and Path(data_file).exists():
            df = pd.read_excel(data_file)

            # Clean column names (replace spaces with underscores if needed)
            df.columns = [col.replace(' ', '_') if col not in ['PL Peak Position', 'PL_FWHM', 'PL FWHM'] else col for col in df.columns]

            # Handle PL FWHM column name variants
            if 'PL_FWHM' not in df.columns and 'PL FWHM' in df.columns:
                df = df.rename(columns={'PL FWHM': 'PL_FWHM'})

            optimizer_instance.load_training_data(df)
            optimizer_instance.generate_search_space(n_points=5000)
            optimizer_instance.train_gp()

            print(f'✓ Thermal CVD optimizer initialized with {len(df)} training samples')
        else:
            print('⚠ No training data found. Optimizer initialized but not fitted.')

    except Exception as e:
        print(f'✗ Error initializing thermal CVD model: {e}')
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


@router.get("/health")
def health_check():
    """Health check endpoint."""
    status = 'healthy'
    if optimizer_instance is None:
        status = 'uninitialized'
    elif not optimizer_instance._fitted:
        status = 'not_fitted'

    return {'status': status}


@router.post("/reload")
def reload_model():
    """Reload model from training data."""
    try:
        init_thermal_cvd_model()
        return {'message': 'Model reloaded successfully'}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
