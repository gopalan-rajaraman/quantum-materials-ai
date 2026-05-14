"""
Bayesian Optimization engine using Expected Improvement (EI) acquisition function.
Suggests optimal experiments to minimize FWHM.
"""

import numpy as np
from scipy.stats import norm
from typing import Tuple, List, Dict, Optional
from dataclasses import dataclass


@dataclass
class BORecommendation:
    """Single Bayesian Optimization recommendation."""
    step: int
    GTE: float
    GTI: float
    FRA: float
    Pressure: float
    predicted_FWHM: float
    uncertainty: float
    EI_value: float


class BayesianOptimizationEngine:
    """
    Bayesian Optimization engine for Thermal CVD minimization.
    Minimizes PL FWHM using Expected Improvement (EI) acquisition.
    """

    def __init__(self, xi: float = 0.01):
        """
        Initialize BO engine.

        Args:
            xi: Exploration-exploitation trade-off parameter in EI.
                Lower xi → more exploration, higher xi → more exploitation.
        """
        self.xi = xi
        self.best_y = None
        self.best_params = None

    @staticmethod
    def expected_improvement(
        X: np.ndarray,
        gp,
        y_best: float,
        xi: float = 0.01,
    ) -> np.ndarray:
        """
        Compute Expected Improvement acquisition function.

        We MINIMIZE FWHM, so:
        - improvement = y_best - mu - xi (negative = good improvement)
        - EI = improvement * Φ(Z) + σ * φ(Z)

        Args:
            X: Scaled feature matrix (n_points, n_features)
            gp: Fitted Gaussian Process model
            y_best: Current best (minimum) observed FWHM
            xi: Exploration parameter

        Returns:
            EI values for each point (higher = more promising)
        """
        mu, sigma = gp.predict(X, return_std=True)
        sigma = np.maximum(sigma, 1e-9)  # Avoid division by zero

        # Improvement if we could predict exactly (we want to minimize)
        improvement = y_best - mu - xi
        Z = improvement / sigma

        # EI = improvement * CDF(Z) + sigma * PDF(Z)
        ei = improvement * norm.cdf(Z) + sigma * norm.pdf(Z)
        ei[sigma < 1e-9] = 0.0

        return ei

    def suggest_next_experiment(
        self,
        X_search: np.ndarray,
        gp,
        y_best: float,
        encoder,
        n_suggestions: int = 1,
    ) -> List[BORecommendation]:
        """
        Suggest the next experiment(s) with highest EI.

        Args:
            X_search: Scaled search space
            gp: Fitted GP model
            y_best: Current best observed FWHM
            encoder: ThermalCVDEncoder for decoding variables
            n_suggestions: Number of top suggestions to return

        Returns:
            List of BORecommendation objects
        """
        ei_values = self.expected_improvement(X_search, gp, y_best, xi=self.xi)

        # Get top n indices
        top_indices = np.argsort(-ei_values)[:n_suggestions]

        recommendations = []
        for rank, idx in enumerate(top_indices, 1):
            # Decode to variable space
            var_dict = encoder.decode_variables(X_search[idx : idx + 1])

            # Predict FWHM at this point
            mu, sigma = gp.predict(X_search[idx : idx + 1], return_std=True)

            rec = BORecommendation(
                step=rank,
                GTE=float(var_dict['GTE']),
                GTI=float(var_dict['GTI']),
                FRA=float(var_dict['FRA']),
                Pressure=float(var_dict['Pressure']),
                predicted_FWHM=float(mu[0]),
                uncertainty=float(sigma[0]),
                EI_value=float(ei_values[idx]),
            )
            recommendations.append(rec)

        return recommendations

    def run_bo_loop(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_search: np.ndarray,
        gp,
        encoder,
        n_steps: int = 10,
    ) -> Tuple[List[BORecommendation], Dict]:
        """
        Run full BO loop (simulated).

        In each step:
        1. Fit GP on current observations
        2. Find highest-EI point in search space
        3. Query GP prediction at that point
        4. Add pseudo-observation to training set
        5. Repeat

        Args:
            X_train: Initial scaled training features
            y_train: Initial target values
            X_search: Scaled search space
            gp: GP model object (will be refit in loop)
            encoder: Data encoder
            n_steps: Number of BO steps

        Returns:
            (list of recommendations, convergence history)
        """
        X_obs = X_train.copy()
        y_obs = y_train.copy()
        self.best_y = y_obs.min()
        self.best_params = None

        recommendations = []
        bo_history = {
            'best_fwhm_progression': [self.best_y],
            'proposed_fwhm': [],
            'uncertainty_progression': [],
        }

        for step in range(n_steps):
            # Refit GP
            gp.fit(X_obs, y_obs)

            # Find best point by EI
            ei_vals = self.expected_improvement(X_search, gp, self.best_y, xi=self.xi)
            idx_best = np.argmax(ei_vals)

            # Predict at best point
            mu_new, sigma_new = gp.predict(X_search[idx_best : idx_best + 1], return_std=True)
            y_new = float(mu_new[0])

            # Decode variables
            var_dict = encoder.decode_variables(X_search[idx_best : idx_best + 1])

            # Create recommendation
            rec = BORecommendation(
                step=step + 1,
                GTE=float(var_dict['GTE']),
                GTI=float(var_dict['GTI']),
                FRA=float(var_dict['FRA']),
                Pressure=float(var_dict['Pressure']),
                predicted_FWHM=y_new,
                uncertainty=float(sigma_new[0]),
                EI_value=float(ei_vals[idx_best]),
            )
            recommendations.append(rec)

            # Update tracking
            X_obs = np.vstack([X_obs, X_search[idx_best : idx_best + 1]])
            y_obs = np.append(y_obs, y_new)

            # Update best
            if y_new < self.best_y:
                self.best_y = y_new
                self.best_params = var_dict

            bo_history['proposed_fwhm'].append(y_new)
            bo_history['uncertainty_progression'].append(float(sigma_new[0]))
            bo_history['best_fwhm_progression'].append(self.best_y)

        return recommendations, bo_history

    def recommendations_to_dicts(
        self, recommendations: List[BORecommendation]
    ) -> List[Dict]:
        """Convert recommendations to dictionary format for JSON serialization."""
        return [
            {
                'step': rec.step,
                'GTE_celsius': round(rec.GTE, 2),
                'GTI_minutes': round(rec.GTI, 2),
                'FRA_sccm': round(rec.FRA, 2),
                'Pressure_Torr': round(rec.Pressure, 2),
                'predicted_FWHM_meV': round(rec.predicted_FWHM, 2),
                'uncertainty_meV': round(rec.uncertainty, 2),
                'EI_value': round(rec.EI_value, 6),
            }
            for rec in recommendations
        ]
