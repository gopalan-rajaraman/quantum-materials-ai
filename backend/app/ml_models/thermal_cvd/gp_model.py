"""
Gaussian Process surrogate model for Thermal CVD Bayesian Optimization.
"""

import numpy as np
import pickle
from typing import Tuple, Optional
from sklearn.gaussian_process import GaussianProcessRegressor
from sklearn.gaussian_process.kernels import Matern, ConstantKernel, WhiteKernel
from sklearn.metrics import mean_absolute_error, r2_score, mean_squared_error


class ThermalCVDGPModel:
    """
    Gaussian Process surrogate model using Matérn 5/2 kernel.
    Optimized for physical process modeling (smooth but not infinitely smooth).
    """

    def __init__(self, random_state: int = 42, n_restarts: int = 10):
        """
        Initialize GP with Matérn 5/2 kernel.

        Args:
            random_state: Random seed for reproducibility
            n_restarts: Number of optimizer restarts
        """
        self.random_state = random_state
        self.n_restarts = n_restarts

        # Matérn 5/2 kernel with WhiteKernel for noise estimation
        # Matches notebook Step 7
        # Use a larger length scale bound to force a smooth curve and avoid overfitting
        self.kernel = (
            ConstantKernel(1.0, (1e-1, 1e1))
            * Matern(length_scale=2.0, length_scale_bounds=(1.0, 10.0), nu=2.5)
            + WhiteKernel(noise_level=0.1, noise_level_bounds=(1e-3, 1e1))
        )

        self.gp: Optional[GaussianProcessRegressor] = None
        self._fitted = False

    def fit(self, X_train: np.ndarray, y_train: np.ndarray) -> None:
        """
        Fit GP to training data.

        Args:
            X_train: Scaled feature matrix (n_samples, n_features)
            y_train: Target values (PL FWHM in meV)
        """
        # normalize_y=False: y is already StandardScaler-transformed before being passed here
        # (matches notebook: gp.fit(X_scaled, y_scaled) with normalize_y=False)
        # Using normalize_y=True would double-normalize and corrupt kernel hyperparameters
        self.gp = GaussianProcessRegressor(
            kernel=self.kernel,
            n_restarts_optimizer=self.n_restarts,
            normalize_y=False,
            random_state=self.random_state,
        )
        self.gp.fit(X_train, y_train)
        self._fitted = True

    def fast_fit(self, X_train: np.ndarray, y_train: np.ndarray) -> None:
        """Lightweight fit for use inside the BO loop.
        Matches notebook Step 9: n_restarts_optimizer=5, normalize_y=False.
        """
        gp = GaussianProcessRegressor(
            kernel=self.kernel,
            n_restarts_optimizer=5,
            normalize_y=False,
            random_state=self.random_state,
        )
        gp.fit(X_train, y_train)
        self.gp = gp
        self._fitted = True

    def predict(self, X: np.ndarray, return_std: bool = True) -> Tuple[np.ndarray, Optional[np.ndarray]]:
        """
        Predict mean and std at given points.

        Args:
            X: Scaled feature matrix
            return_std: Whether to return uncertainty

        Returns:
            (mean, std) or (mean,) depending on return_std
        """
        if not self._fitted or self.gp is None:
            raise RuntimeError("Model not fitted. Call fit() first.")

        if return_std:
            return self.gp.predict(X, return_std=True)
        else:
            return self.gp.predict(X)

    def get_metrics(self, X_train: np.ndarray, y_train: np.ndarray,
                    y_true_raw: np.ndarray = None, y_pred_raw: np.ndarray = None) -> dict:
        """
        Get in-sample performance metrics.

        Args:
            X_train: Training features
            y_train: Training targets (scaled if using notebook pipeline)
            y_true_raw: Optional raw targets in meV (for human-readable reporting)
            y_pred_raw: Optional raw predictions in meV (for human-readable reporting)

        Returns:
            Dictionary with MAE and R² score (in meV units if raw values provided)
        """
        if not self._fitted or self.gp is None:
            raise RuntimeError("Model not fitted. Call fit() first.")

        y_pred_scaled = self.gp.predict(X_train)

        # Compute metrics in raw (meV) space if provided, else use scaled space
        if y_true_raw is not None and y_pred_raw is not None:
            mae = mean_absolute_error(y_true_raw, y_pred_raw)
            r2 = r2_score(y_true_raw, y_pred_raw)
            rmse = float(np.sqrt(mean_squared_error(y_true_raw, y_pred_raw)))
        else:
            mae = mean_absolute_error(y_train, y_pred_scaled)
            r2 = r2_score(y_train, y_pred_scaled)
            rmse = float(np.sqrt(mean_squared_error(y_train, y_pred_scaled)))

        return {
            'MAE_meV': float(mae),
            'RMSE_meV': rmse,
            'R2_score': float(r2),
            'n_train_samples': len(y_train),
            'kernel': str(self.gp.kernel_),
        }

    def save(self, filepath: str) -> None:
        """Save model to disk."""
        if not self._fitted or self.gp is None:
            raise RuntimeError("Model not fitted. Cannot save.")
        with open(filepath, 'wb') as f:
            pickle.dump(self, f)

    @classmethod
    def load(cls, filepath: str) -> 'ThermalCVDGPModel':
        """Load model from disk."""
        with open(filepath, 'rb') as f:
            return pickle.load(f)

    def get_kernel_info(self) -> str:
        """Get human-readable kernel info."""
        if self.gp is None:
            return "Not fitted"
        return str(self.gp.kernel_)
