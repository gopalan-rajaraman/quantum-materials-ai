import pandas as pd

def encode_categorical_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Applies one-hot encoding to categorical features in the dataset.
    Returns the fully encoded dataframe.
    """
    df_encoded = df.copy()
    categorical_cols = df_encoded.select_dtypes(exclude=['number']).columns
    
    if len(categorical_cols) > 0:
        df_encoded = pd.get_dummies(df_encoded, columns=categorical_cols, drop_first=True)
        
    return df_encoded
