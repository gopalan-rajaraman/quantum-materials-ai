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

    # Variables — swept by Bayesian Optimization (4, matches notebook)
    VARIABLES = ['GTE', 'GTI', 'FRA', 'Pressure']

    # Target
    TARGET = 'PL_FWHM'

    # Variable ranges — exactly as in notebook Step 3
    VARIABLE_RANGES = {
        'GTE':      (500, 1100),   # Growth Temperature [°C]
        'GTI':      (5, 60),       # Growth Time [min]
        'FRA':      (0, 600),      # Ar Flow Rate [sccm]
        'Pressure': (1, 760),      # Chamber Pressure [Torr]
    }

    def __init__(self, fill_unknown: str = 'Unknown'):
        self.fill_unknown = fill_unknown
        self.label_encoders: Dict[str, LabelEncoder] = {}
        self.constant_values: Dict[str, Any] = {}
        # StandardScaler for X — matches notebook's scaler_X = StandardScaler()
        self.scaler_X = StandardScaler()
        # SimpleImputer for missing variable values — matches notebook
        self.imputer = SimpleImputer(strategy='mean')
        self.feature_cols: List[str] = []
        self._fitted = False

    def fit_on_data(self, df: pd.DataFrame) -> None:
        """
        Fit encoders and scalers on dataset.
        Matches notebook Steps 4 (encoding) and 6 (feature matrix + scaling).

        Args:
            df: Filtered Thermal CVD dataframe (TOCVD == 'Thermal CVD' already applied)
        """
        # Step 4: Fit categorical LabelEncoders (fill NaN with 'Unknown')
        for col in self.CAT_CONSTANTS:
            series = df[col].fillna(self.fill_unknown).astype(str)
            le = LabelEncoder()
            le.fit(series.unique())
            self.label_encoders[col] = le
            # Store mode as fixed constant value
            self.constant_values[col] = series.mode()[0]

        # Store numerical constant medians for reference
        for col in self.NUM_CONSTANTS:
            if col in df.columns:
                val = pd.to_numeric(df[col], errors='coerce').dropna()
                self.constant_values[col] = float(val.median()) if len(val) > 0 else 0.0
            else:
                self.constant_values[col] = 0.0

        # Step 6: Build raw feature matrix and fit imputer + scaler
        X_raw = self._build_raw_feature_matrix(df)
        self.imputer.fit(X_raw[:, len(self.CAT_CONSTANTS):])  # impute only variable columns
        X_imputed = X_raw.copy()
        X_imputed[:, len(self.CAT_CONSTANTS):] = self.imputer.transform(
            X_raw[:, len(self.CAT_CONSTANTS):]
        )
        self.scaler_X.fit(X_imputed)

        # Feature column names for reference
        self.feature_cols = (
            [c + '_enc' for c in self.CAT_CONSTANTS]
            + self.VARIABLES
        )

        self._fitted = True

    def set_constant(self, col: str, value: Any) -> None:
        """Update a constant value (e.g., switching precursor)."""
        if col not in self.CAT_CONSTANTS and col not in self.NUM_CONSTANTS:
            raise ValueError(f"Column {col} is not a known constant")
        self.constant_values[col] = value

    def _build_raw_feature_matrix(self, df: pd.DataFrame) -> np.ndarray:
        """
        Build raw (unscaled) feature matrix matching notebook Step 6.
        Layout: [P1_enc, P2_enc, ..., Class_enc, GTE, GTI, FRA, Pressure]
        """
        df_work = df.copy()

        # Encode categoricals (fill NaN with 'Unknown')
        cat_features = []
        for col in self.CAT_CONSTANTS:
            df_work[col] = df_work[col].fillna(self.fill_unknown).astype(str)
            if col in self.label_encoders:
                le = self.label_encoders[col]
                # Handle unseen category values gracefully
                new_vals = set(df_work[col].unique()) - set(le.classes_)
                if new_vals:
                    le.classes_ = np.append(le.classes_, sorted(new_vals))
                encoded = le.transform(df_work[col])
            else:
                le = LabelEncoder()
                le.fit(df_work[col].unique())
                self.label_encoders[col] = le
                encoded = le.transform(df_work[col])
            cat_features.append(encoded.reshape(-1, 1))

        const_features = np.hstack(cat_features).astype(float)

        # Variable features (4 cols), raw — imputation happens externally
        var_features = df_work[self.VARIABLES].apply(
            pd.to_numeric, errors='coerce'
        ).values.astype(float)

        return np.hstack([const_features, var_features])

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

        # Impute missing variable values (columns 8-11) with mean
        X_raw[:, len(self.CAT_CONSTANTS):] = self.imputer.transform(
            X_raw[:, len(self.CAT_CONSTANTS):]
        )

        X_scaled = self.scaler_X.transform(X_raw)
        y = pd.to_numeric(df[self.TARGET], errors='coerce').values.astype(float)
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

        # Build cat constant features using mode values
        cat_feats = []
        for col in self.CAT_CONSTANTS:
            le = self.label_encoders[col]
            val = str(self.constant_values.get(col, self.fill_unknown))
            if val not in le.classes_:
                val = self.fill_unknown
                if val not in le.classes_:
                    le.classes_ = np.append(le.classes_, [val])
            encoded = le.transform([val])[0]
            cat_feats.append(float(encoded))

        # Variable features
        var_feats = [float(var_dict[v]) for v in self.VARIABLES]

        X_raw = np.array([cat_feats + var_feats])
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
        # Variables are in columns 8-11 (after the 8 cat constants)
        n_cats = len(self.CAT_CONSTANTS)
        var_dict = {}
        for i, var in enumerate(self.VARIABLES):
            var_dict[var] = float(X_raw[0, n_cats + i])
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
