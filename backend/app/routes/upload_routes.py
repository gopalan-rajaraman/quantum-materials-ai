from fastapi import APIRouter, File, UploadFile, HTTPException
import io
from pydantic import BaseModel
from typing import List, Dict, Any

from datetime import datetime
import pandas as pd
import app.routes.thermal_cvd_routes as cvd_routes

class SpreadsheetData(BaseModel):
    data: List[Dict[str, Any]]

router = APIRouter(
    prefix="/api/datasets",
    tags=["datasets"]
)

# Global in-memory storage for saved datasets
saved_datasets = []

# Global activity log
activity_log = []

def log_activity(title: str, desc: str, color: str = "bg-cyan-500"):
    """Append an event to the activity log (keep last 20)."""
    activity_log.insert(0, {
        "title": title,
        "desc": desc,
        "color": color,
        "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    })
    if len(activity_log) > 20:
        activity_log.pop()

@router.get("/dashboard")
async def get_dashboard_stats():
    """Returns live stats for the Dashboard page."""
    opt = cvd_routes.optimizer_instance
    
    fitted = opt is not None and opt._fitted
    total_datasets = len(saved_datasets) + (1 if fitted and not saved_datasets else 0)
    
    best_fwhm = None
    r2_score = None
    mae = None
    kernel_info = None
    n_samples = 0
    
    if fitted:
        best_fwhm = float(opt.y_train.min())
        metrics = opt.gp_model.get_metrics(opt.X_train, opt.y_train)
        r2_score = round(float(metrics['R2_score']) * 100, 1)
        mae = round(float(metrics['MAE_meV']), 4)
        n_samples = int(metrics['n_train_samples'])
        kernel_info = str(opt.gp_model.gp.kernel_).split('(')[0]
    
    return {
        "total_datasets": total_datasets,
        "active_experiments": len(saved_datasets),
        "best_fwhm_meV": round(best_fwhm, 2) if best_fwhm is not None else None,
        "r2_percent": r2_score,
        "mae_meV": mae,
        "n_training_samples": n_samples,
        "model_fitted": fitted,
        "kernel": kernel_info,
        "activity_log": activity_log[:8]
    }

@router.get("/saved")
async def get_saved_datasets():
    """Returns the list of previously uploaded datasets with live ML model info."""
    import app.routes.thermal_cvd_routes as cvd_routes
    
    enriched = []
    for i, ds in enumerate(saved_datasets):
        entry = dict(ds)
        entry['id'] = f'EXP-{100 + i + 1}'
        entry['target'] = 'PL_FWHM (meV)'
        
        # Pull live best value from the model if fitted
        if cvd_routes.optimizer_instance is not None and cvd_routes.optimizer_instance._fitted:
            best_fwhm = float(cvd_routes.optimizer_instance.y_train.min())
            entry['bestValue'] = f'{best_fwhm:.2f} meV'
            entry['status'] = 'Completed'
        else:
            entry['bestValue'] = '--'
            entry['status'] = 'In Progress'
        
        enriched.append(entry)
    
    # If model is auto-loaded at startup but no manual upload happened, still show it
    if not enriched and cvd_routes.optimizer_instance is not None and cvd_routes.optimizer_instance._fitted:
        best_fwhm = float(cvd_routes.optimizer_instance.y_train.min())
        enriched.append({
            'id': 'EXP-101',
            'name': 'labelled.xlsx (auto-loaded)',
            'date': cvd_routes.optimizer_instance._training_info.get('timestamp', 'N/A'),
            'rows': str(cvd_routes.optimizer_instance._training_info.get('n_training_samples', 0)),
            'target': 'PL_FWHM (meV)',
            'bestValue': f'{best_fwhm:.2f} meV',
            'status': 'Completed',
        })
    
    return {"datasets": enriched}

@router.post("/upload")
async def upload_datasets(files: list[UploadFile] = File(...)):
    """
    Upload multiple CSV or Excel datasets, parse them with Pandas,
    concatenate them into a single dataframe, and detect columns.
    """
    dataframes = []
    
    try:
        filenames = []
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
        
        # Coerce known numeric columns to float (handles 'NS' or empty strings)
        num_cols = ['FRH', 'HR', 'FRP1', 'FRP2', 'CP1', 'CP2', 'GTE', 'GTI', 'FRA', 'Pressure', 'PL_FWHM']
        for col in num_cols:
            if col in combined_df.columns:
                combined_df[col] = pd.to_numeric(combined_df[col], errors='coerce')
        
        # Store metadata for the saved list
        saved_datasets.append({
            "name": ", ".join(filenames),
            "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "rows": f"{total_rows:,}"
        })
        
        # Pass data to the global optimizer to train
        if cvd_routes.optimizer_instance is not None:
            cvd_routes.optimizer_instance.load_training_data(combined_df)
            cvd_routes.optimizer_instance.generate_search_space(n_points=5000)
            cvd_routes.optimizer_instance.train_gp()
            best_fwhm = float(cvd_routes.optimizer_instance.y_train.min())
            log_activity("Dataset Uploaded", f"{', '.join(filenames)} added ({total_rows} rows)", "bg-purple-500")
            log_activity("GP Model Trained", f"Best FWHM so far: {best_fwhm:.2f} meV", "bg-cyan-500")
            
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
            
        # Coerce known numeric columns to float (handles 'NS' or empty strings)
        num_cols = ['FRH', 'HR', 'FRP1', 'FRP2', 'CP1', 'CP2', 'GTE', 'GTI', 'FRA', 'Pressure', 'PL_FWHM']
        for col in num_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
            
        saved_datasets.append({
            "name": f"Manual_Data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
            "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "rows": f"{len(valid_data):,}"
        })
        
        if cvd_routes.optimizer_instance is not None:
            cvd_routes.optimizer_instance.load_training_data(df)
            cvd_routes.optimizer_instance.generate_search_space(n_points=5000)
            cvd_routes.optimizer_instance.train_gp()
            best_fwhm = float(cvd_routes.optimizer_instance.y_train.min())
            log_activity("Manual Data Submitted", f"{len(valid_data)} rows ingested", "bg-purple-500")
            log_activity("GP Model Retrained", f"Best FWHM: {best_fwhm:.2f} meV", "bg-cyan-500")
            
        return {
            "total_rows_aggregated": len(valid_data),
            "columns": list(df.columns),
            "status": "success",
            "message": "Manual data successfully ingested and ML model trained."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing JSON: {str(e)}")
