"""
Data encoding and preprocessing for Thermal CVD Bayesian Optimization.
Handles categorical constants and numeric variable encoding.
"""

import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder, MinMaxScaler
from typing import Dict, Tuple, Any, List


class ThermalCVDEncoder:
    """
    Encodes constants (categorical & numeric) and variables for Thermal CVD BO.
    LabelEncoders are fitted on ALL known categories so that new constant values
    can be encoded without re-fitting.
    """

    # Constants - fixed for each experimental setup
    CAT_CONSTANTS = ['P1', 'P2', 'Substrate', 'CG', 'COM', 'PC', 'TOCVD', 'SA', 'Class']
    NUM_CONSTANTS = ['FRH', 'HR', 'FRP1', 'FRP2', 'CP1', 'CP2']

    # Variables - swept by Bayesian Optimization
    VARIABLES = ['GTE', 'GTI', 'FRA', 'Pressure']

    # Target
    TARGET = 'PL_FWHM'

    # Variable ranges — matched to notebook Step 3
    VARIABLE_RANGES = {
        'GTE': (500, 1100),      # Growth Temperature [°C]
        'GTI': (5, 60),          # Growth Time [min]
        'FRA': (0, 600),         # Ar Flow Rate [sccm]
        'Pressure': (1, 760),    # Chamber Pressure [Torr]
    }

    def __init__(self, fill_unknown: str = 'Unknown'):
        self.fill_unknown = fill_unknown
        self.label_encoders: Dict[str, LabelEncoder] = {}
        self.constant_values: Dict[str, Any] = {}
        self.scaler = MinMaxScaler()
        self.feature_cols: List[str] = []
        self._fitted = False

    def fit_on_data(self, df: pd.DataFrame) -> None:
        """
        Fit encoders and determine constant values from dataset.

        Args:
            df: Raw dataset with all columns
        """
        # Fit categorical LabelEncoders
        for col in self.CAT_CONSTANTS:
            series = df[col].fillna(self.fill_unknown)
            le = LabelEncoder()
            le.fit(series.unique())
            self.label_encoders[col] = le

            # Store mode as the fixed value
            mode_val = series.mode()[0]
            self.constant_values[col] = mode_val

        # Set numeric constants to median
        for col in self.NUM_CONSTANTS:
            val = df[col].dropna().median() if df[col].dropna().shape[0] > 0 else 0.0
            self.constant_values[col] = val

        # Fit the feature scaler
        X = self._build_feature_matrix(df)
        self.scaler.fit(X)

        # Define feature columns
        self.feature_cols = (
            self.VARIABLES
            + [c + '_enc' for c in self.CAT_CONSTANTS]
            + self.NUM_CONSTANTS
        )

        self._fitted = True

    def set_constant(self, col: str, value: Any) -> None:
        """
        Update a constant value (e.g., changing precursor for a new setup).

        Args:
            col: Column name
            value: New value for the constant
        """
        if col not in self.CAT_CONSTANTS and col not in self.NUM_CONSTANTS:
            raise ValueError(f"Column {col} is not a known constant")
        self.constant_values[col] = value

    def _build_feature_matrix(self, df: pd.DataFrame) -> np.ndarray:
        """Build feature matrix from dataframe."""
        df_work = df.copy()

        # Encode categoricals
        for col in self.CAT_CONSTANTS:
            df_work[col] = df_work[col].fillna(self.fill_unknown)
            if col in self.label_encoders:
                le = self.label_encoders[col]
                # Handle unseen values
                new_vals = set(df_work[col].unique()) - set(le.classes_)
                if new_vals:
                    le.classes_ = np.append(le.classes_, list(new_vals))
                df_work[col + '_enc'] = le.transform(df_work[col])
            else:
                le = LabelEncoder()
                le.fit(df_work[col].unique())
                self.label_encoders[col] = le
                df_work[col + '_enc'] = le.transform(df_work[col])

        # Fill numeric constants
        for col in self.NUM_CONSTANTS:
            df_work[col] = df_work[col].fillna(self.constant_values.get(col, 0.0))

        # Fill variables with median if missing
        for col in self.VARIABLES:
            if col in df_work.columns:
                df_work[col] = df_work[col].fillna(df_work[col].median())

        feature_cols = (
            self.VARIABLES
            + [c + '_enc' for c in self.CAT_CONSTANTS]
            + self.NUM_CONSTANTS
        )
        return df_work[feature_cols].values

    def encode_observation(self, df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        """
        Encode a dataset for training.

        Args:
            df: Raw dataset

        Returns:
            X: Scaled feature matrix
            y: Target values
        """
        X = self._build_feature_matrix(df)
        X_scaled = self.scaler.transform(X)
        y = df[self.TARGET].values
        return X_scaled, y

    def encode_variables(self, var_dict: Dict[str, float]) -> np.ndarray:
        """
        Encode a point defined only by variables, using current constants.

        Args:
            var_dict: Dictionary with variable values {GTE: 800, GTI: 20, FRA: 100, Pressure: 50}

        Returns:
            Single-row scaled feature matrix
        """
        if not self._fitted:
            raise RuntimeError("Encoder not fitted. Call fit_on_data first.")

        # Build feature row
        features = []

        # Variables
        for var in self.VARIABLES:
            features.append(var_dict[var])

        # Categorical constants (encoded)
        for col in self.CAT_CONSTANTS:
            le = self.label_encoders[col]
            val = self.constant_values[col]
            encoded = le.transform([val])[0]
            features.append(encoded)

        # Numeric constants
        for col in self.NUM_CONSTANTS:
            features.append(self.constant_values[col])

        X = np.array([features])
        X_scaled = self.scaler.transform(X)
        return X_scaled

    def decode_variables(self, X_scaled: np.ndarray) -> Dict[str, float]:
        """
        Reverse transform from scaled features back to variable values.

        Args:
            X_scaled: Scaled feature matrix (single row)

        Returns:
            Dictionary of variable values
        """
        X = self.scaler.inverse_transform(X_scaled)
        var_dict = {}
        for i, var in enumerate(self.VARIABLES):
            var_dict[var] = float(X[0, i])
        return var_dict

    def get_encoding_info(self) -> Dict[str, Any]:
        """
        Get encoding maps and current constant values (for documentation).

        Returns:
            Dictionary with encoding info
        """
        info = {
            'constants': self.constant_values.copy(),
            'label_maps': {},
            'variables': self.VARIABLES,
            'variable_ranges': self.VARIABLE_RANGES,
        }

        for col, le in self.label_encoders.items():
            mapping = {cls: int(idx) for idx, cls in enumerate(le.classes_)}
            info['label_maps'][col] = mapping

        return info
