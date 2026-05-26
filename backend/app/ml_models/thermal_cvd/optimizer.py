"""
Main Thermal CVD ML orchestrator.
Coordinates data encoding, GP training, and Bayesian Optimization.
"""

import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Any
from datetime import datetime
from sklearn.preprocessing import StandardScaler

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
        self.y_train: Optional[np.ndarray] = None  # raw FWHM values (meV)
        self.y_train_scaled: Optional[np.ndarray] = None  # StandardScaler-transformed y
        self.X_search: Optional[np.ndarray] = None

        # y scaler — matches notebook's scaler_y = StandardScaler()
        self.scaler_y = StandardScaler()

        self._fitted = False
        self._training_info = {
            'timestamp': None,
            'n_training_samples': 0,
            'initial_samples': 0,
            'n_search_points': 5000,
        }
        self.ei_history_cache = []
        self.ei_cache_length = 0

    def load_training_data(self, df: pd.DataFrame) -> None:
        """
        Load and process training data.
        Matches notebook Steps 4-6: encode → impute → scale X and y.

        Args:
            df: Filtered Thermal CVD dataframe
        """
        self.df_raw = df

        # Fit encoder (fits scaler_X and imputer inside)
        self.encoder.fit_on_data(df)

        # Build training features and raw targets
        self.X_train, self.y_train = self.encoder.encode_observation(df)

        # Fit and transform y with StandardScaler — matches notebook's scaler_y
        self.scaler_y.fit(self.y_train.reshape(-1, 1))
        self.y_train_scaled = self.scaler_y.transform(
            self.y_train.reshape(-1, 1)
        ).ravel()

        # Set initial samples for BO progress tracking
        self._training_info['initial_samples'] = len(self.y_train)

        self._training_info['n_training_samples'] = len(self.y_train)
        self._training_info['timestamp'] = datetime.now().isoformat()

    def add_batch_experiments(self, df: pd.DataFrame) -> None:
        """
        Add a batch of experimental results to the training data and combine them.
        Matches notebook Step 10: X_combined = np.vstack([X_scaled, X_new_scaled])
        """
        if not self.encoder._fitted or self.X_train is None:
            raise RuntimeError("Base model not fitted. Call load_training_data first.")

        # Encode new observations using existing fitted encoder
        X_new_scaled, y_new = self.encoder.encode_observation(df)

        # Scale new y using existing scaler_y
        y_new_scaled = self.scaler_y.transform(y_new.reshape(-1, 1)).ravel()

        # Combine with existing database (matches Step 10 notebook logic)
        self.X_train = np.vstack([self.X_train, X_new_scaled])
        self.y_train = np.concatenate([self.y_train, y_new])
        self.y_train_scaled = np.concatenate([self.y_train_scaled, y_new_scaled])

        self.df_raw = pd.concat([self.df_raw, df], ignore_index=True)
        self._training_info['n_training_samples'] = len(self.y_train)

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
        Train Gaussian Process model on scaled training data.
        Matches notebook Step 7: gp.fit(X_scaled, y_scaled)

        Returns:
            Dictionary with training metrics (in original meV units)
        """
        if self.X_train is None or self.y_train_scaled is None:
            raise RuntimeError("No training data loaded. Call load_training_data first.")

        # Train on scaled y — exactly as notebook does
        self.gp_model.fit(self.X_train, self.y_train_scaled)
        self._fitted = True

        # Get metrics in original (meV) units by inverse-transforming predictions
        y_pred_scaled, _ = self.gp_model.predict(self.X_train, return_std=True)
        y_pred = self.scaler_y.inverse_transform(
            y_pred_scaled.reshape(-1, 1)
        ).ravel()
        metrics = self.gp_model.get_metrics(self.X_train, self.y_train_scaled,
                                             y_true_raw=self.y_train,
                                             y_pred_raw=y_pred)
        return metrics

    def predict_fwhm(self, **variables) -> Dict[str, float]:
        """
        Predict FWHM for given variables (returns values in meV).
        Inverse-transforms scaled GP output back to meV.

        Args:
            **variables: GTE, GTI, FRA, Pressure values

        Returns:
            Dictionary with predicted mean, std, and bounds in meV
        """
        if not self._fitted:
            raise RuntimeError("Model not fitted. Call train_gp() first.")

        X_scaled = self.encoder.encode_variables(variables)
        mu_scaled, sigma_scaled = self.gp_model.predict(X_scaled, return_std=True)

        # Inverse-transform to meV units
        mu_mev = float(self.scaler_y.inverse_transform([[mu_scaled[0]]])[0, 0])
        mu_mev = max(mu_mev, 0.0)
        sigma_mev = float(sigma_scaled[0] * self.scaler_y.scale_[0])

        lower_bound = max(mu_mev - 1.96 * sigma_mev, 0.0)
        upper_bound = max(mu_mev + 1.96 * sigma_mev, 0.0)

        return {
            'predicted_FWHM_meV': mu_mev,
            'uncertainty_meV': sigma_mev,
            'lower_bound_meV': lower_bound,
            'upper_bound_meV': upper_bound,
        }

    def suggest_next_experiment(self, n_suggestions: int = 5) -> List[Dict]:
        """
        Suggest next experiments with highest Expected Improvement.
        Uses scaled y_best (as in notebook) for the EI calculation.

        Args:
            n_suggestions: Number of recommendations to return
        """
        if not self._fitted or self.X_search is None:
            raise RuntimeError(
                "Model not fitted or search space not generated. "
                "Call train_gp() and generate_search_space() first."
            )

        # Use scaled y_best — matches notebook: y_best_scaled = y_scaled.min()
        y_best_scaled = self.y_train_scaled.min()
        recommendations = self.bo_engine.suggest_next_experiment(
            self.X_search,
            self.gp_model.gp,
            y_best_scaled,
            self.encoder,
            n_suggestions=n_suggestions,
        )

        # Inverse-transform predicted FWHM and uncertainty from scaled space to meV
        # Matches notebook: y_next_real = scaler_y.inverse_transform([[y_next_sim]])[0, 0]
        for rec in recommendations:
            rec.predicted_FWHM = float(
                self.scaler_y.inverse_transform([[rec.predicted_FWHM]])[0, 0]
            )
            rec.predicted_FWHM = max(rec.predicted_FWHM, 0.0)
            rec.uncertainty = float(rec.uncertainty * self.scaler_y.scale_[0])

        return self.bo_engine.recommendations_to_dicts(recommendations)

    def run_bo_optimization(self, n_steps: int = 10) -> Dict[str, Any]:
        """
        Run full Bayesian Optimization loop (active learning simulation).
        Matches notebook Step 9. Uses scaled y internally.
        """
        if not self._fitted or self.X_search is None:
            raise RuntimeError(
                "Model not fitted or search space not generated."
            )

        bo_engine = BayesianOptimizationEngine(xi=0.01)
        recommendations, history = bo_engine.run_bo_loop(
            self.X_train,
            self.y_train_scaled,  # use scaled y — matches notebook
            self.X_search,
            self.gp_model,
            self.encoder,
            n_steps=n_steps,
        )

        # Inverse-transform convergence history to meV with non-negative clipping
        best_fwhm_mev = [
            max(float(self.scaler_y.inverse_transform([[v]])[0, 0]), 0.0)
            for v in history['best_fwhm_progression']
        ]
        proposed_fwhm_mev = [
            max(float(self.scaler_y.inverse_transform([[v]])[0, 0]), 0.0)
            for v in history['proposed_fwhm']
        ]
        best_predicted_raw = max(float(self.scaler_y.inverse_transform([[bo_engine.best_y]])[0, 0]), 0.0)
        initial_best = float(self.y_train.min())

        return {
            'recommendations': bo_engine.recommendations_to_dicts(recommendations),
            'convergence_history': {
                'best_fwhm': best_fwhm_mev,
                'proposed_fwhm': proposed_fwhm_mev,
                'uncertainty': [float(v) for v in history['uncertainty_progression']],
            },
            'summary': {
                'best_predicted_FWHM': best_predicted_raw,
                'initial_best': initial_best,
                'improvement_meV': float(initial_best - best_predicted_raw),
                'observed_fwhm': [float(y) for y in self.y_train],
            },
        }

    def simulate_experiment(self) -> Dict[str, Any]:
        """
        Simulate running the highest EI experiment — adds GP prediction to training
        data and refits. Advances the Active Learning loop.
        """
        if not self._fitted or self.X_search is None:
            raise RuntimeError("Model not fitted.")

        # EI uses scaled y_best
        y_best_scaled = self.y_train_scaled.min()
        ei_vals = self.bo_engine.expected_improvement(
            self.X_search, self.gp_model.gp, y_best_scaled, xi=self.bo_engine.xi
        )
        idx_best = np.argmax(ei_vals)

        # Predict in scaled space, then inverse-transform
        mu_scaled, sigma_scaled = self.gp_model.predict(
            self.X_search[idx_best:idx_best + 1], return_std=True
        )
        y_new_scaled = float(mu_scaled[0])
        y_new_mev = float(self.scaler_y.inverse_transform([[y_new_scaled]])[0, 0])
        y_new_mev = max(y_new_mev, 0.0)
        y_new_scaled = float(self.scaler_y.transform([[y_new_mev]])[0, 0])
        sigma_mev = float(sigma_scaled[0] * self.scaler_y.scale_[0])

        # Append to training set (both raw and scaled)
        self.X_train = np.vstack([self.X_train, self.X_search[idx_best:idx_best + 1]])
        self.y_train = np.append(self.y_train, y_new_mev)
        self.y_train_scaled = np.append(self.y_train_scaled, y_new_scaled)

        # Refit GP
        metrics = self.train_gp()
        self._training_info['n_training_samples'] = len(self.y_train)

        var_dict = self.encoder.decode_variables(self.X_search[idx_best:idx_best + 1])

        return {
            'simulated_experiment': var_dict,
            'predicted_FWHM_meV': y_new_mev,
            'uncertainty_meV': sigma_mev,
            'new_total_samples': len(self.y_train),
            'metrics': metrics
        }

    def add_experiment(self, var_dict: Dict[str, Any], fwhm_result: float) -> Dict[str, Any]:
        """
        Add a real experimental result to the training data and retrain.
        """
        if not self._fitted:
            raise RuntimeError("Model not fitted.")

        X_new = self.encoder.encode_variables(var_dict)
        fwhm_scaled = float(
            self.scaler_y.transform([[float(fwhm_result)]])[0, 0]
        )

        self.X_train = np.vstack([self.X_train, X_new])
        self.y_train = np.append(self.y_train, float(fwhm_result))
        self.y_train_scaled = np.append(self.y_train_scaled, fwhm_scaled)

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

    def get_ei_history(self, X_sweep: np.ndarray) -> List[List[float]]:
        """
        Computes historical Expected Improvement curves across previous BO steps.
        Caches the result to prevent unnecessary refits unless dataset grows.
        """
        current_len = len(self.X_train)
        if self.ei_cache_length == current_len and self.ei_history_cache:
            return self.ei_history_cache
            
        ei_history = []
        n_initial = self._training_info['initial_samples']
        
        # Fast GP refit loop for all historical steps
        for step in range(n_initial, current_len + 1):
            X_sub = self.X_train[:step]
            y_sub = self.y_train_scaled[:step]
            
            self.gp_model.fit(X_sub, y_sub)
            y_best = y_sub.min()
            
            ei_vals = self.bo_engine.expected_improvement(X_sweep, self.gp_model.gp, y_best, xi=0.01)
            ei_history.append(ei_vals.tolist())
            
        # Restore full GP fit
        self.gp_model.fit(self.X_train, self.y_train_scaled)
        
        self.ei_history_cache = ei_history
        self.ei_cache_length = current_len
        return ei_history

    def get_model_info(self) -> Dict[str, Any]:
        """Get model status and metrics in meV units."""
        if not self._fitted:
            return {'status': 'not fitted'}

        # Predict in scaled space, then inverse-transform for meV metrics
        # Matches notebook: y_pred = scaler_y.inverse_transform(y_pred_scaled)
        y_pred_scaled, sigma_scaled = self.gp_model.predict(self.X_train, return_std=True)
        y_pred_raw = self.scaler_y.inverse_transform(
            y_pred_scaled.reshape(-1, 1)
        ).ravel()
        y_pred_raw = np.maximum(y_pred_raw, 0.0)

        mean_sigma_scaled = float(np.mean(sigma_scaled)) if sigma_scaled is not None else 0.0
        confidence = float(np.clip(np.exp(-mean_sigma_scaled), 0.0, 1.0))

        import time
        start_time = time.perf_counter()
        self.gp_model.predict(self.X_train[:1], return_std=True)
        inference_time_ms = float((time.perf_counter() - start_time) * 1000)

        metrics = self.gp_model.get_metrics(
            self.X_train,
            self.y_train_scaled,    # GP was trained on scaled y
            y_true_raw=self.y_train,  # raw meV for human-readable MAE/RMSE
            y_pred_raw=y_pred_raw,
        )
        return {
            'status': 'fitted',
            'kernel': self.gp_model.get_kernel_info(),
            'confidence': confidence,
            'inference_time_ms': round(inference_time_ms, 2),
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
