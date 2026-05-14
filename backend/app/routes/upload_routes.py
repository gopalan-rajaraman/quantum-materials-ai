from fastapi import APIRouter, File, UploadFile, HTTPException
import io
from pydantic import BaseModel
from typing import List, Dict, Any

from datetime import datetime
import pandas as pd
from app.routes.thermal_cvd_routes import optimizer_instance

class SpreadsheetData(BaseModel):
    data: List[Dict[str, Any]]

router = APIRouter(
    prefix="/api/datasets",
    tags=["datasets"]
)

# Global in-memory storage for saved datasets
saved_datasets = []

@router.get("/saved")
async def get_saved_datasets():
    """Returns the list of previously uploaded datasets."""
    return {"datasets": saved_datasets}

@router.post("/upload")
async def upload_datasets(files: list[UploadFile] = File(...)):
    """
    Upload multiple CSV or Excel datasets, parse them with Pandas,
    concatenate them into a single dataframe, and detect columns.
    """
    dataframes = []
    
    try:
        for file in files:
            filenames.append(file.filename)
            contents = await file.read()
            
            if file.filename.endswith('.csv'):
                df = pd.read_csv(io.BytesIO(contents))
            elif file.filename.endswith(('.xls', '.xlsx')):
                df = pd.read_excel(io.BytesIO(contents))
            else:
                continue
            
            # Clean column names
            df.columns = [col.replace(' ', '_') if col not in ['PL Peak Position', 'PL_FWHM', 'PL FWHM'] else col for col in df.columns]
            if 'PL_FWHM' not in df.columns and 'PL FWHM' in df.columns:
                df = df.rename(columns={'PL FWHM': 'PL_FWHM'})
                
            dataframes.append(df)
            
        if not dataframes:
            raise HTTPException(status_code=400, detail="No valid CSV/Excel files provided.")
            
        combined_df = pd.concat(dataframes, ignore_index=True)
        total_rows = len(combined_df)
        
        # Store metadata for the saved list
        saved_datasets.append({
            "name": ", ".join(filenames),
            "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "rows": f"{total_rows:,}"
        })
        
        # Pass data to the global optimizer to train
        if optimizer_instance is not None:
            optimizer_instance.load_training_data(combined_df)
            optimizer_instance.generate_search_space(n_points=5000)
            optimizer_instance.train_gp()
            
        return {
            "total_files_processed": len(files),
            "filenames": filenames,
            "total_rows_aggregated": total_rows,
            "columns": list(combined_df.columns),
            "status": "success",
            "message": "Datasets successfully aggregated and ML model trained."
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@router.post("/upload-json")
async def upload_json_data(payload: SpreadsheetData):
    """
    Accepts raw JSON data from the frontend spreadsheet component,
    converts it to a pandas DataFrame, and processes it.
    """
    try:
        # Filter out empty rows based on variables or target
        valid_data = [row for row in payload.data if row.get('PL_FWHM') or row.get('GTE')]
        if not valid_data:
            raise HTTPException(status_code=400, detail="No valid data provided.")
            
        df = pd.DataFrame(valid_data)
        
        # Clean column names
        df.columns = [col.replace(' ', '_') if col not in ['PL Peak Position', 'PL_FWHM', 'PL FWHM'] else col for col in df.columns]
        if 'PL_FWHM' not in df.columns and 'PL FWHM' in df.columns:
            df = df.rename(columns={'PL FWHM': 'PL_FWHM'})
            
        # Convert numeric columns where possible
        for col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='ignore')
            
        saved_datasets.append({
            "name": f"Manual_Data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
            "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "rows": f"{len(valid_data):,}"
        })
        
        if optimizer_instance is not None:
            optimizer_instance.load_training_data(df)
            optimizer_instance.generate_search_space(n_points=5000)
            optimizer_instance.train_gp()
            
        return {
            "total_rows_aggregated": len(valid_data),
            "columns": list(df.columns),
            "status": "success",
            "message": "Manual data successfully ingested and ML model trained."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing JSON: {str(e)}")
