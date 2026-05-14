"""
Gaussian Process surrogate model for Thermal CVD Bayesian Optimization.
"""

import numpy as np
import pickle
from typing import Tuple, Optional
from sklearn.gaussian_process import GaussianProcessRegressor
from sklearn.gaussian_process.kernels import Matern, WhiteKernel, ConstantKernel
from sklearn.metrics import mean_absolute_error, r2_score


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

        # Matérn 5/2 kernel with additive white noise
        self.kernel = (
            ConstantKernel(1.0, (1e-3, 1e3))
            * Matern(length_scale=1.0, length_scale_bounds=(1e-2, 1e2), nu=2.5)
            + WhiteKernel(noise_level=1.0, noise_level_bounds=(1e-5, 1e2))
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
        self.gp = GaussianProcessRegressor(
            kernel=self.kernel,
            n_restarts_optimizer=self.n_restarts,
            normalize_y=True,
            random_state=self.random_state,
        )
        self.gp.fit(X_train, y_train)
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

    def get_metrics(self, X_train: np.ndarray, y_train: np.ndarray) -> dict:
        """
        Get in-sample performance metrics.

        Args:
            X_train: Training features
            y_train: Training targets

        Returns:
            Dictionary with MAE and R² score
        """
        if not self._fitted or self.gp is None:
            raise RuntimeError("Model not fitted. Call fit() first.")

        y_pred = self.gp.predict(X_train)
        mae = mean_absolute_error(y_train, y_pred)
        r2 = r2_score(y_train, y_pred)

        return {
            'MAE_meV': float(mae),
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
