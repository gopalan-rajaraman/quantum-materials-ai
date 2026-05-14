import pandas as pd
import numpy as np

def clean_dataset(df: pd.DataFrame) -> pd.DataFrame:
    """
    Cleans the uploaded dataset by handling missing values.
    - Fills missing numerical values with the column mean.
    - Fills missing categorical values with the mode.
    """
    df_clean = df.copy()
    
    numerical_cols = df_clean.select_dtypes(include=['number']).columns
    categorical_cols = df_clean.select_dtypes(exclude=['number']).columns
    
    # Fill numerical with mean
    for col in numerical_cols:
        df_clean[col] = df_clean[col].fillna(df_clean[col].mean())
        
    # Fill categorical with mode
    for col in categorical_cols:
        if not df_clean[col].mode().empty:
            df_clean[col] = df_clean[col].fillna(df_clean[col].mode()[0])
            
    return df_clean
