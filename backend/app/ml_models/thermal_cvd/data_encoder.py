"""
Data encoding and preprocessing for Thermal CVD Bayesian Optimization.
Matches the Colab notebook pipeline exactly:
  - Feature order: [cat_enc × 8, vars × 4] (TOCVD excluded, NUM_CONSTANTS excluded)
  - X scaler: StandardScaler (zero mean, unit variance)
  - y scaler: StandardScaler (stored separately in optimizer)
  - Missing variable imputation: mean (via SimpleImputer equivalent)
"""

import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from typing import Dict, Tuple, Any, List


class ThermalCVDEncoder:
    """
    Encodes constants (categorical) and variables for Thermal CVD BO.
    Exactly matches Colab notebook Step 3-6 pipeline.

    Feature matrix layout (12 features):
        [P1_enc, P2_enc, Substrate_enc, CG_enc, COM_enc, PC_enc, SA_enc, Class_enc,
         GTE, GTI, FRA, Pressure]

    TOCVD and numerical constants (FRH, HR, FRP1, FRP2, CP1, CP2) are NOT in
    the feature matrix — they are stored for reference only (as in the notebook).
    """

    # Categorical constants (8) — exactly as in notebook Step 3
    # Note: TOCVD is excluded because data is pre-filtered to 'Thermal CVD'
    CAT_CONSTANTS = ['P1', 'P2', 'Substrate', 'CG', 'COM', 'PC', 'SA', 'Class']

    # Numerical constants — stored for reference, NOT in feature matrix (matches notebook)
    NUM_CONSTANTS = ['FRH', 'HR', 'FRP1', 'FRP2', 'CP1', 'CP2']

    # Variables — swept by Bayesian Optimization (exactly 4, dynamic per dataset)
    # Target features will be stored per-instance.
    
    # Targets
    TARGET_FWHM = 'PL_FWHM'
    TARGET_PEAK = 'PL Peak Pc'

    def __init__(self, fill_unknown: str = 'Unknown'):
        self.fill_unknown = fill_unknown
        self.label_encoders: Dict[str, LabelEncoder] = {}
        self.constant_values: Dict[str, Any] = {}
        # StandardScaler for X — matches notebook's scaler_X = StandardScaler()
        self.scaler_X = StandardScaler()
        # SimpleImputer for missing variable values — matches notebook
        self.imputer = SimpleImputer(strategy='mean')
        self.feature_cols: List[str] = []
        self.VARIABLES: List[str] = []
        self.VARIABLE_RANGES: Dict[str, Tuple[float, float]] = {}
        self._fitted = False

    def set_variables(self, variables: List[str]) -> None:
        """Set the numerical optimization variables."""
        if len(variables) != 4:
            raise ValueError(f"Exactly 4 optimization variables required, got {len(variables)}: {variables}")
        self.VARIABLES = variables

    def fit_on_data(self, df: pd.DataFrame) -> None:
        """
        Fit encoders and scalers on dataset.
        Matches notebook Steps 4 (encoding) and 6 (feature matrix + scaling).

        Args:
            df: Filtered Thermal CVD dataframe (TOCVD == 'Thermal CVD' already applied)
        """
        # Step 4: Fit categorical LabelEncoders (fill NaN with 'Unknown')
        for col in self.CAT_CONSTANTS:
            if col in df.columns:
                series = df[col].fillna(self.fill_unknown).astype(str)
            else:
                series = pd.Series([self.fill_unknown] * len(df))
            le = LabelEncoder()
            le.fit(series.unique())
            self.label_encoders[col] = le
            # Store mode as fixed constant value
            self.constant_values[col] = series.mode()[0] if not series.empty else self.fill_unknown

        # Store numerical constant medians for reference
        for col in self.NUM_CONSTANTS:
            if col in df.columns:
                val = pd.to_numeric(df[col], errors='coerce').dropna()
                self.constant_values[col] = float(val.median()) if len(val) > 0 else 0.0
            else:
                self.constant_values[col] = 0.0

        # Compute dynamic ranges for optimization variables
        if not self.VARIABLES:
            self.VARIABLES = ['GTE', 'GTI', 'FRA', 'Pressure']  # Fallback if not set
            
        for var in self.VARIABLES:
            if var in df.columns:
                series = pd.to_numeric(df[var], errors='coerce').dropna()
                if len(series) > 0:
                    v_min = float(series.min())
                    v_max = float(series.max())
                    v_avg = float(series.mean())
                    
                    # Calculate ranges using abs(avg - min) and avg + max as requested
                    lower_limit = abs(v_avg - v_min)
                    upper_limit = v_avg + v_max
                    self.VARIABLE_RANGES[var] = (lower_limit, upper_limit)
                else:
                    self.VARIABLE_RANGES[var] = (0.0, 1000.0) # Default fallback
            else:
                self.VARIABLE_RANGES[var] = (0.0, 1000.0)

        # Step 6: Build raw feature matrix and fit imputer + scaler
        X_raw = self._build_raw_feature_matrix(df)
        self.imputer.fit(X_raw)  # impute all variable columns
        X_imputed = self.imputer.transform(X_raw)
        self.scaler_X.fit(X_imputed)

        # Feature column names for reference
        self.feature_cols = self.VARIABLES

        self._fitted = True

    def set_constant(self, col: str, value: Any) -> None:
        """Update a constant value (e.g., switching precursor)."""
        if col not in self.CAT_CONSTANTS and col not in self.NUM_CONSTANTS:
            raise ValueError(f"Column {col} is not a known constant")
        self.constant_values[col] = value

    def set_constants_from_dict(self, cat_constants: Dict[str, str], num_constants: Dict[str, float]) -> None:
        """Set multiple constants from dictionaries."""
        for col, val in cat_constants.items():
            if col in self.CAT_CONSTANTS:
                self.constant_values[col] = val
        for col, val in num_constants.items():
            if col in self.NUM_CONSTANTS:
                self.constant_values[col] = float(val)

    def _build_raw_feature_matrix(self, df: pd.DataFrame) -> np.ndarray:
        """
        Build raw (unscaled) feature matrix matching 4D BO refactor.
        Layout: [GTE, GTI, FRA, Pressure]
        """
        df_work = df.copy()

        # Variable features (4 cols), raw — imputation happens externally
        var_features = df_work[self.VARIABLES].apply(
            pd.to_numeric, errors='coerce'
        ).values.astype(float)

        return var_features

    def encode_observation(self, df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        """
        Encode a dataset for GP training.
        Returns StandardScaler-transformed X and raw y (target).

        Args:
            df: Filtered Thermal CVD dataframe

        Returns:
            X_scaled: (n, 12) scaled feature matrix
            y: (n,) target FWHM values (meV, raw — y scaling is in the optimizer)
        """
        X_raw = self._build_raw_feature_matrix(df)

        # Impute missing variable values
        X_raw = self.imputer.transform(X_raw)

        X_scaled = self.scaler_X.transform(X_raw)
        y = pd.to_numeric(df[self.TARGET_FWHM], errors='coerce').values.astype(float)
        return X_scaled, y

    def encode_variables(self, var_dict: Dict[str, float]) -> np.ndarray:
        """
        Encode a candidate point defined only by variable values.
        Uses current constant values for the categorical features.

        Args:
            var_dict: {GTE: 800, GTI: 20, FRA: 100, Pressure: 50}

        Returns:
            (1, 12) scaled feature matrix
        """
        if not self._fitted:
            raise RuntimeError("Encoder not fitted. Call fit_on_data first.")

        # Variable features only (4D GP)
        var_feats = [float(var_dict[v]) for v in self.VARIABLES]

        X_raw = np.array([var_feats])
        X_scaled = self.scaler_X.transform(X_raw)
        return X_scaled

    def decode_variables(self, X_scaled: np.ndarray) -> Dict[str, float]:
        """
        Reverse transform to get variable values from scaled feature matrix.

        Args:
            X_scaled: (1, 12) scaled feature matrix

        Returns:
            Dictionary of variable values
        """
        X_raw = self.scaler_X.inverse_transform(X_scaled)
        var_dict = {}
        for i, var in enumerate(self.VARIABLES):
            var_dict[var] = float(X_raw[0, i])
        return var_dict

    def get_encoding_info(self) -> Dict[str, Any]:
        """Get encoding maps and current constant values."""
        info = {
            'constants': self.constant_values.copy(),
            'label_maps': {},
            'variables': self.VARIABLES,
            'variable_ranges': self.VARIABLE_RANGES,
            'feature_cols': self.feature_cols,
            'n_features': len(self.feature_cols),
        }
        for col, le in self.label_encoders.items():
            mapping = {cls: int(idx) for idx, cls in enumerate(le.classes_)}
            info['label_maps'][col] = mapping
        return info
