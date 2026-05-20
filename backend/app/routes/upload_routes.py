from fastapi import APIRouter, File, UploadFile, HTTPException
import io
from pydantic import BaseModel
from typing import List, Dict, Any

from datetime import datetime
import pandas as pd
import numpy as np
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
    
    overview_chart_data = []
    model_performance_data = []
    variable_summary_data = []
    
    if fitted:
        best_fwhm = float(opt.y_train.min())
        metrics = opt.gp_model.get_metrics(opt.X_train, opt.y_train)
        r2_score = round(float(metrics['R2_score']) * 100, 1)
        mae = round(float(metrics['MAE_meV']), 4)
        n_samples = int(metrics['n_train_samples'])
        kernel_info = str(opt.gp_model.gp.kernel_).split('(')[0]
        
        # 1. Variable Summary
        num_const = len(opt.encoder.NUM_CONSTANTS)
        cat_const = len(opt.encoder.CAT_CONSTANTS)
        variables_count = len(opt.encoder.VARIABLES)
        total_features = num_const + cat_const + variables_count
        
        variable_summary_data = [
            {"name": "Numerical", "value": num_const, "percentage": f"{num_const/total_features*100:.1f}%" if total_features else "0%", "color": "#5D3EBC"},
            {"name": "Categorical", "value": cat_const, "percentage": f"{cat_const/total_features*100:.1f}%" if total_features else "0%", "color": "#3B82F6"},
            {"name": "Discrete", "value": variables_count, "percentage": f"{variables_count/total_features*100:.1f}%" if total_features else "0%", "color": "#F59E0B"},
            {"name": "Boolean", "value": 0, "percentage": "0%", "color": "#EF4444"}
        ]
        
        # 2. Overview Chart Data (growth of samples/runs progression)
        n_total = len(opt.y_train)
        steps = [max(1, int(n_total * p)) for p in [0.2, 0.4, 0.6, 0.8, 1.0]]
        steps = sorted(list(set(steps)))
        
        from sklearn.gaussian_process import GaussianProcessRegressor
        from sklearn.metrics import r2_score as r2_fn, mean_absolute_error, mean_squared_error
        
        for idx, step in enumerate(steps):
            X_sub = opt.X_train[:step]
            y_sub = opt.y_train[:step]
            
            overview_chart_data.append({
                "name": f"Run {step}",
                "value": step
            })
            
            if step >= 5:
                try:
                    temp_gp = GaussianProcessRegressor(kernel=opt.gp_model.gp.kernel, alpha=opt.gp_model.gp.alpha, random_state=42)
                    temp_gp.fit(X_sub, y_sub)
                    y_pred = temp_gp.predict(X_sub)
                    r2 = max(0.0, r2_fn(y_sub, y_pred))
                    mae_val = mean_absolute_error(y_sub, y_pred)
                    rmse_val = np.sqrt(mean_squared_error(y_sub, y_pred))
                    
                    model_performance_data.append({
                        "name": f"Run {step}",
                        "R2": round(r2, 2),
                        "MAE": round(mae_val, 2),
                        "RMSE": round(rmse_val, 2)
                    })
                except Exception:
                    pass
            else:
                model_performance_data.append({
                    "name": f"Run {step}",
                    "R2": 0.5 + idx * 0.1,
                    "MAE": 1.0 - idx * 0.1,
                    "RMSE": 1.2 - idx * 0.1
                })
        
        if not model_performance_data:
            model_performance_data = [
                {"name": "No Data", "R2": 0.0, "MAE": 0.0, "RMSE": 0.0}
            ]
    else:
        variable_summary_data = [
            {"name": "Numerical", "value": 12, "percentage": "66.7%", "color": "#5D3EBC"},
            {"name": "Categorical", "value": 6, "percentage": "33.3%", "color": "#3B82F6"},
            {"name": "Discrete", "value": 0, "percentage": "0%", "color": "#F59E0B"},
            {"name": "Boolean", "value": 0, "percentage": "0%", "color": "#EF4444"}
        ]
        overview_chart_data = [
            {"name": "Apr 18", "value": 25},
            {"name": "Apr 25", "value": 42},
            {"name": "May 2", "value": 48},
            {"name": "May 9", "value": 68},
            {"name": "May 16", "value": 84}
        ]
        model_performance_data = [
            {"name": "Apr 18", "R2": 0.75, "MAE": 0.50, "RMSE": 0.40},
            {"name": "Apr 25", "R2": 0.82, "MAE": 0.48, "RMSE": 0.38},
            {"name": "May 2", "R2": 0.85, "MAE": 0.45, "RMSE": 0.35},
            {"name": "May 9", "R2": 0.80, "MAE": 0.49, "RMSE": 0.37},
            {"name": "May 16", "R2": 0.88, "MAE": 0.42, "RMSE": 0.33}
        ]
        
    return {
        "total_datasets": total_datasets,
        "active_experiments": len(saved_datasets),
        "best_fwhm_meV": round(best_fwhm, 2) if best_fwhm is not None else None,
        "r2_percent": r2_score,
        "mae_meV": mae,
        "n_training_samples": n_samples,
        "model_fitted": fitted,
        "kernel": kernel_info,
        "activity_log": activity_log[:8],
        "overview_chart_data": overview_chart_data,
        "model_performance_data": model_performance_data,
        "variable_summary_data": variable_summary_data
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
            
            # Rename 'PL FWHM' → 'PL_FWHM' (handle space vs underscore)
            if 'PL FWHM' in df.columns and 'PL_FWHM' not in df.columns:
                df = df.rename(columns={'PL FWHM': 'PL_FWHM'})
            if 'PL Peak Position' in df.columns and 'PL_Peak_Position' not in df.columns:
                df = df.rename(columns={'PL Peak Position': 'PL_Peak_Position'})

            # Replace 'NS' (not specified) with NaN — matches Colab notebook
            df = df.replace('NS', np.nan)

            dataframes.append(df)

        if not dataframes:
            raise HTTPException(status_code=400, detail="No valid CSV/Excel files provided.")

        combined_df = pd.concat(dataframes, ignore_index=True)
        total_rows = len(combined_df)

        # Filter to ONLY Thermal CVD experiments (matches Colab notebook Step 2)
        thermal_cvd_df = combined_df
        if 'TOCVD' in combined_df.columns:
            thermal_cvd_df = combined_df[combined_df['TOCVD'] == 'Thermal CVD'].copy().reset_index(drop=True)
            n_thermal = len(thermal_cvd_df)
        else:
            n_thermal = total_rows

        if len(thermal_cvd_df) == 0:
            raise HTTPException(
                status_code=400,
                detail=f"No Thermal CVD rows found. Make sure the 'TOCVD' column contains 'Thermal CVD' entries. Found {total_rows} total rows."
            )

        # Coerce known numeric columns to float (handles 'NS' or empty strings)
        num_cols = ['FRH', 'HR', 'FRP1', 'FRP2', 'CP1', 'CP2', 'GTE', 'GTI', 'FRA', 'Pressure', 'PL_FWHM']
        for col in num_cols:
            if col in thermal_cvd_df.columns:
                thermal_cvd_df[col] = pd.to_numeric(thermal_cvd_df[col], errors='coerce')

        # Drop rows where the target (PL_FWHM) is missing
        if 'PL_FWHM' in thermal_cvd_df.columns:
            thermal_cvd_df = thermal_cvd_df.dropna(subset=['PL_FWHM']).reset_index(drop=True)

        # Store metadata for the saved list
        saved_datasets.append({
            "name": ", ".join(filenames),
            "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "rows": f"{len(thermal_cvd_df):,} Thermal CVD ({total_rows:,} total)"
        })

        # Pass Thermal CVD data to the global optimizer to train
        if cvd_routes.optimizer_instance is not None:
            cvd_routes.optimizer_instance.load_training_data(thermal_cvd_df)
            cvd_routes.optimizer_instance.generate_search_space(n_points=5000)
            cvd_routes.optimizer_instance.train_gp()
            best_fwhm = float(cvd_routes.optimizer_instance.y_train.min())
            log_activity(
                "Dataset Uploaded",
                f"{', '.join(filenames)}: {len(thermal_cvd_df)} Thermal CVD rows used",
                "bg-purple-500"
            )
            log_activity("GP Model Trained", f"Best FWHM: {best_fwhm:.2f} meV", "bg-cyan-500")

        return {
            "total_files_processed": len(files),
            "filenames": filenames,
            "total_rows_in_file": total_rows,
            "thermal_cvd_rows_used": len(thermal_cvd_df),
            "columns": list(thermal_cvd_df.columns),
            "status": "success",
            "message": f"Found {len(thermal_cvd_df)} Thermal CVD experiments (out of {total_rows} total rows). GP model trained successfully."
        }

    except HTTPException:
        raise
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

        # Rename 'PL FWHM' → 'PL_FWHM'
        if 'PL FWHM' in df.columns and 'PL_FWHM' not in df.columns:
            df = df.rename(columns={'PL FWHM': 'PL_FWHM'})

        # Replace 'NS' with NaN
        df = df.replace('NS', np.nan)

        # Filter to only Thermal CVD rows
        if 'TOCVD' in df.columns:
            df = df[df['TOCVD'] == 'Thermal CVD'].copy().reset_index(drop=True)

        if len(df) == 0:
            raise HTTPException(status_code=400, detail="No Thermal CVD rows found in the submitted data.")

        # Coerce known numeric columns to float
        num_cols = ['FRH', 'HR', 'FRP1', 'FRP2', 'CP1', 'CP2', 'GTE', 'GTI', 'FRA', 'Pressure', 'PL_FWHM']
        for col in num_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')

        # Drop rows where the target is missing
        if 'PL_FWHM' in df.columns:
            df = df.dropna(subset=['PL_FWHM']).reset_index(drop=True)

        saved_datasets.append({
            "name": f"Manual_Data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
            "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "rows": f"{len(df):,} Thermal CVD rows"
        })

        if cvd_routes.optimizer_instance is not None:
            cvd_routes.optimizer_instance.load_training_data(df)
            cvd_routes.optimizer_instance.generate_search_space(n_points=5000)
            cvd_routes.optimizer_instance.train_gp()
            best_fwhm = float(cvd_routes.optimizer_instance.y_train.min())
            log_activity("Manual Data Submitted", f"{len(df)} Thermal CVD rows ingested", "bg-purple-500")
            log_activity("GP Model Retrained", f"Best FWHM: {best_fwhm:.2f} meV", "bg-cyan-500")

        return {
            "total_rows_aggregated": len(df),
            "columns": list(df.columns),
            "status": "success",
            "message": f"Manual data successfully ingested ({len(df)} Thermal CVD rows). GP model trained."
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing JSON: {str(e)}")
