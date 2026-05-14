import pandas as pd
from sklearn.preprocessing import StandardScaler

def normalize_features(df: pd.DataFrame, target_col: str = None) -> pd.DataFrame:
    """
    Applies standard scaling (Z-score normalization) to all numerical features.
    Excludes the target column if provided.
    """
    df_norm = df.copy()
    numerical_cols = df_norm.select_dtypes(include=['number']).columns.tolist()
    
    if target_col and target_col in numerical_cols:
        numerical_cols.remove(target_col)
        
    if len(numerical_cols) > 0:
        scaler = StandardScaler()
        df_norm[numerical_cols] = scaler.fit_transform(df_norm[numerical_cols])
        
    return df_norm
