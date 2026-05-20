"""
Main Thermal CVD ML orchestrator.
Coordinates data encoding, GP training, and Bayesian Optimization.
"""

import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Any
from datetime import datetime

from .data_encoder import ThermalCVDEncoder
from .gp_model import ThermalCVDGPModel
from .bayesian_optimization import BayesianOptimizationEngine


class ThermalCVDOptimizer:
    """
    Main ML pipeline for Thermal CVD WS₂ Bayesian Optimization.
    """

    def __init__(self):
        self.encoder = ThermalCVDEncoder()
        self.gp_model = ThermalCVDGPModel()
        self.bo_engine = BayesianOptimizationEngine(xi=0.01)

        self.X_train: Optional[np.ndarray] = None
        self.y_train: Optional[np.ndarray] = None
        self.X_search: Optional[np.ndarray] = None

        self._fitted = False
        self._training_info = {
            'timestamp': None,
            'n_training_samples': 0,
            'initial_samples': 0,
            'n_search_points': 5000,
        }

    def load_training_data(self, df: pd.DataFrame) -> None:
        """
        Load and process training data.

        Args:
            df: Raw dataset with all columns
        """
        # Fit encoder
        self.encoder.fit_on_data(df)

        # Build training features and targets
        self.X_train, self.y_train = self.encoder.encode_observation(df)

        # Set initial samples on first load
        if self._training_info['initial_samples'] == 0:
            self._training_info['initial_samples'] = len(self.y_train)

        self._training_info['n_training_samples'] = len(self.y_train)
        self._training_info['timestamp'] = datetime.now().isoformat()

    def generate_search_space(self, n_points: int = 5000) -> None:
        """
        Generate synthetic search space by random sampling of variable ranges.

        Args:
            n_points: Number of points in search space
        """
        if not self.encoder._fitted:
            raise RuntimeError("Encoder not fitted. Call load_training_data first.")

        np.random.seed(42)
        var_dicts = []

        for _ in range(n_points):
            var_dict = {}
            for var, (lo, hi) in self.encoder.VARIABLE_RANGES.items():
                var_dict[var] = np.random.uniform(lo, hi)
            var_dicts.append(var_dict)

        # Encode all points
        X_search_list = []
        for var_dict in var_dicts:
            X_scaled = self.encoder.encode_variables(var_dict)
            X_search_list.append(X_scaled[0])

        self.X_search = np.array(X_search_list)
        self._training_info['n_search_points'] = n_points

    def train_gp(self) -> Dict[str, Any]:
        """
        Train Gaussian Process model on training data.

        Returns:
            Dictionary with training metrics
        """
        if self.X_train is None or self.y_train is None:
            raise RuntimeError("No training data loaded. Call load_training_data first.")

        self.gp_model.fit(self.X_train, self.y_train)
        self._fitted = True

        metrics = self.gp_model.get_metrics(self.X_train, self.y_train)
        return metrics

    def predict_fwhm(self, **variables) -> Dict[str, float]:
        """
        Predict FWHM for given variables.

        Args:
            **variables: GTE, GTI, FRA, Pressure values

        Returns:
            Dictionary with predicted mean, std, and bounds
        """
        if not self._fitted:
            raise RuntimeError("Model not fitted. Call train_gp() first.")

        X_scaled = self.encoder.encode_variables(variables)
        mu, sigma = self.gp_model.predict(X_scaled, return_std=True)

        return {
            'predicted_FWHM_meV': float(mu[0]),
            'uncertainty_meV': float(sigma[0]),
            'lower_bound_meV': float(mu[0] - 1.96 * sigma[0]),
            'upper_bound_meV': float(mu[0] + 1.96 * sigma[0]),
        }

    def suggest_next_experiment(self, n_suggestions: int = 5) -> List[Dict]:
        """
        Suggest next experiments with highest Expected Improvement.

        Args:
            n_suggestions: Number of recommendations to return

        Returns:
            List of suggested experiment dictionaries
        """
        if not self._fitted or self.X_search is None:
            raise RuntimeError(
                "Model not fitted or search space not generated. "
                "Call train_gp() and generate_search_space() first."
            )

        y_best = self.y_train.min()
        recommendations = self.bo_engine.suggest_next_experiment(
            self.X_search,
            self.gp_model.gp,
            y_best,
            self.encoder,
            n_suggestions=n_suggestions,
        )

        return self.bo_engine.recommendations_to_dicts(recommendations)

    def run_bo_optimization(self, n_steps: int = 10) -> Dict[str, Any]:
        """
        Run full Bayesian Optimization loop.

        Args:
            n_steps: Number of BO iterations

        Returns:
            Dictionary with recommendations and convergence history
        """
        if not self._fitted or self.X_search is None:
            raise RuntimeError(
                "Model not fitted or search space not generated. "
                "Call train_gp() and generate_search_space() first."
            )

        # Create new BO engine for this run
        bo_engine = BayesianOptimizationEngine(xi=0.01)
        recommendations, history = bo_engine.run_bo_loop(
            self.X_train,
            self.y_train,
            self.X_search,
            self.gp_model,   # pass the wrapper so fast_fit is available
            self.encoder,
            n_steps=n_steps,
        )

        return {
            'recommendations': self.bo_engine.recommendations_to_dicts(recommendations),
            'convergence_history': {
                'best_fwhm': [float(v) for v in history['best_fwhm_progression']],
                'proposed_fwhm': [float(v) for v in history['proposed_fwhm']],
                'uncertainty': [float(v) for v in history['uncertainty_progression']],
            },
            'summary': {
                'best_predicted_FWHM': float(bo_engine.best_y),
                'initial_best': float(self.y_train.min()),
                'improvement_meV': float(self.y_train.min() - bo_engine.best_y),
            },
        }

    def simulate_experiment(self) -> Dict[str, Any]:
        """
        Simulate running the highest EI experiment by appending its GP prediction
        to the training data and refitting the model. This advances the Active Learning loop.
        """
        if not self._fitted or self.X_search is None:
            raise RuntimeError("Model not fitted.")
            
        y_best = self.y_train.min()
        
        # 1. Find best point by EI
        ei_vals = self.bo_engine.expected_improvement(self.X_search, self.gp_model.gp, y_best, xi=self.bo_engine.xi)
        idx_best = np.argmax(ei_vals)
        
        # 2. Predict FWHM at this best point
        mu_new, sigma_new = self.gp_model.predict(self.X_search[idx_best : idx_best + 1], return_std=True)
        y_new = float(mu_new[0])
        
        # 3. Permanently add to training set
        self.X_train = np.vstack([self.X_train, self.X_search[idx_best : idx_best + 1]])
        self.y_train = np.append(self.y_train, y_new)
        
        # 4. Refit model
        metrics = self.train_gp()
        self._training_info['n_training_samples'] = len(self.y_train)
        
        # Decode variables for response
        var_dict = self.encoder.decode_variables(self.X_search[idx_best : idx_best + 1])
        
        return {
            'simulated_experiment': var_dict,
            'predicted_FWHM_meV': y_new,
            'uncertainty_meV': float(sigma_new[0]),
            'new_total_samples': len(self.y_train),
            'metrics': metrics
        }

    def add_experiment(self, var_dict: Dict[str, Any], fwhm_result: float) -> Dict[str, Any]:
        """
        Add a manual experiment result to the training data and retrain the model.
        """
        if not self._fitted:
            raise RuntimeError("Model not fitted.")
            
        # Encode variables
        X_new = self.encoder.encode_variables(var_dict)
        
        # Append to training set
        self.X_train = np.vstack([self.X_train, X_new])
        self.y_train = np.append(self.y_train, float(fwhm_result))
        
        # Refit model
        metrics = self.train_gp()
        self._training_info['n_training_samples'] = len(self.y_train)
        
        return {
            'added_experiment': var_dict,
            'FWHM_meV': float(fwhm_result),
            'new_total_samples': len(self.y_train),
            'metrics': metrics
        }

    def set_constant(self, col: str, value: Any) -> None:
        """
        Change a constant value for a new experimental setup.

        Args:
            col: Column name (e.g., 'P1', 'Substrate', 'CG')
            value: New value
        """
        self.encoder.set_constant(col, value)

    def get_encoding_info(self) -> Dict[str, Any]:
        """Get current encoding and constant values."""
        return self.encoder.get_encoding_info()

    def get_model_info(self) -> Dict[str, Any]:
        """Get model status and metrics."""
        if not self._fitted:
            return {'status': 'not fitted'}

        metrics = self.gp_model.get_metrics(self.X_train, self.y_train)
        return {
            'status': 'fitted',
            'kernel': self.gp_model.get_kernel_info(),
            **metrics,
            **self._training_info,
        }

    def save_model(self, dirpath: str) -> None:
        """Save all components to directory."""
        import pickle

        dirpath = Path(dirpath)
        dirpath.mkdir(parents=True, exist_ok=True)

        with open(dirpath / 'optimizer.pkl', 'wb') as f:
            pickle.dump(self, f)

    @classmethod
    def load_model(cls, dirpath: str) -> 'ThermalCVDOptimizer':
        """Load optimizer from directory."""
        import pickle

        with open(Path(dirpath) / 'optimizer.pkl', 'rb') as f:
            return pickle.load(f)
