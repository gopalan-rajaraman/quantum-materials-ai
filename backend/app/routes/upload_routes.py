from fastapi import APIRouter, File, UploadFile, HTTPException, Depends, Form
import io
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from bson import ObjectId

from datetime import datetime
import pandas as pd
import numpy as np
import app.routes.thermal_cvd_routes as cvd_routes
from app.database.mongodb_config import get_datasets_collection, get_activity_log_collection
from app.auth import get_current_user

class SpreadsheetData(BaseModel):
    data: List[Dict[str, Any]]
    name: Optional[str] = None

class UploadWithConstants(BaseModel):
    files: List[str]  # This would be handled differently in multipart form
    cat_constants: Optional[Dict[str, str]] = None  # P1, P2, Substrate, CG, COM, PC, SA, Class
    num_constants: Optional[Dict[str, float]] = None  # FRH, HR, FRP1, FRP2, CP1, CP2

router = APIRouter(
    prefix="/api/datasets",
    tags=["datasets"]
)

async def log_activity(title: str, desc: str, color: str = "bg-cyan-500", user_id: Optional[str] = None):
    """Append an event to the activity log in MongoDB."""
    collection = get_activity_log_collection()
    await collection.insert_one({
        "title": title,
        "desc": desc,
        "color": color,
        "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "timestamp": datetime.utcnow().isoformat(),
        "user_id": ObjectId(user_id) if user_id else None
    })

@router.get("/dashboard")
@router.get("/dashboard-stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    """Returns live stats for the Dashboard page."""
    opt = cvd_routes.optimizer_instance

    datasets_collection = get_datasets_collection()
    activity_collection = get_activity_log_collection()

    query = {"user_id": ObjectId(current_user["_id"])}
    saved_datasets_count = await datasets_collection.count_documents(query)

    fitted = opt is not None and opt._fitted
    total_datasets = saved_datasets_count

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

    # Fetch recent activity from MongoDB for user
    activity_log = []
    cursor = activity_collection.find().sort("timestamp", -1).limit(8)
    async for doc in cursor:
        # Only show activities that belong to the user or have no user_id (system activities)
        if "user_id" in doc and doc["user_id"] and doc["user_id"] != ObjectId(current_user["_id"]):
            continue
        doc["_id"] = str(doc["_id"])
        if "user_id" in doc and doc["user_id"] is not None:
            doc["user_id"] = str(doc["user_id"])
        activity_log.append(doc)

    return {
        "total_datasets": total_datasets,
        "active_experiments": saved_datasets_count,
        "best_fwhm_meV": round(best_fwhm, 2) if best_fwhm is not None else None,
        "r2_percent": r2_score,
        "mae_meV": mae,
        "n_training_samples": n_samples,
        "model_fitted": fitted,
        "kernel": kernel_info,
        "activity_log": activity_log,
        "overview_chart_data": overview_chart_data,
        "model_performance_data": model_performance_data,
        "variable_summary_data": variable_summary_data
    }

@router.get("/list")
async def get_saved_datasets(current_user: dict = Depends(get_current_user)):
    """Returns the list of previously uploaded datasets with live ML model info."""
    import app.routes.thermal_cvd_routes as cvd_routes
    datasets_collection = get_datasets_collection()

    query = {"user_id": ObjectId(current_user["_id"])}
    enriched = []
    cursor = datasets_collection.find(query).sort("created_at", -1)

    i = 0
    async for ds in cursor:
        entry = dict(ds)
        entry['_id'] = str(entry['_id'])
        if 'user_id' in entry and entry['user_id'] is not None:
            entry['user_id'] = str(entry['user_id'])
        d_id = entry.get('dataset_id', '')
        if d_id.startswith('DS_'):
            d_id = d_id.replace('DS_', 'EXP_')
        elif not d_id:
            d_id = f'EXP_{100 + i + 1}'
        entry['id'] = d_id
        entry['target'] = 'PL_FWHM (meV)'
        entry.pop('data', None)

        # Use actual status from database, default to 'unlocked' if not set
        entry['status'] = entry.get('status', 'unlocked')

        # Pull live best value from the model if fitted
        if cvd_routes.optimizer_instance is not None and cvd_routes.optimizer_instance._fitted:
            best_fwhm = float(cvd_routes.optimizer_instance.y_train.min())
            entry['bestValue'] = f'{best_fwhm:.2f} meV'
        else:
            entry['bestValue'] = '--'

        enriched.append(entry)
        i += 1


    return {"datasets": enriched}

@router.post("/{dataset_id}/lock")
async def lock_dataset(dataset_id: str, current_user: dict = Depends(get_current_user)):
    """Lock a dataset to prevent modifications."""
    if not ObjectId.is_valid(dataset_id):
        raise HTTPException(status_code=404, detail="Dataset not found")
    collection = get_datasets_collection()
    try:
        result = await collection.update_one(
            {"_id": ObjectId(dataset_id), "user_id": ObjectId(current_user["_id"])},
            {"$set": {"status": "locked", "updated_at": datetime.utcnow().isoformat()}}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Dataset not found or access denied")
        await log_activity("Dataset Locked", f"Dataset {dataset_id} locked", "bg-orange-500", current_user["_id"])
        return {"message": "Dataset locked successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{dataset_id}/unlock")
async def unlock_dataset(dataset_id: str, current_user: dict = Depends(get_current_user)):
    """Unlock a dataset to allow modifications."""
    if not ObjectId.is_valid(dataset_id):
        raise HTTPException(status_code=404, detail="Dataset not found")
    collection = get_datasets_collection()
    try:
        result = await collection.update_one(
            {"_id": ObjectId(dataset_id), "user_id": ObjectId(current_user["_id"])},
            {"$set": {"status": "unlocked", "updated_at": datetime.utcnow().isoformat()}}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Dataset not found or access denied")
        await log_activity("Dataset Unlocked", f"Dataset {dataset_id} unlocked", "bg-green-500", current_user["_id"])
        return {"message": "Dataset unlocked successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{dataset_id}")
async def get_dataset(dataset_id: str, current_user: dict = Depends(get_current_user)):
    """Get a specific saved dataset by ID."""
    if not ObjectId.is_valid(dataset_id):
        raise HTTPException(status_code=404, detail="Dataset not found")
    collection = get_datasets_collection()
    try:
        doc = await collection.find_one({"_id": ObjectId(dataset_id)})
        if not doc:
            raise HTTPException(status_code=404, detail="Dataset not found")
        # Check ownership
        if doc.get("user_id") and doc["user_id"] != ObjectId(current_user["_id"]):
            raise HTTPException(status_code=403, detail="Access denied")
        doc["_id"] = str(doc["_id"])
        if "user_id" in doc and doc["user_id"] is not None:
            doc["user_id"] = str(doc["user_id"])
        import math
        def clean_nan(obj):
            if isinstance(obj, float) and math.isnan(obj):
                return None
            elif isinstance(obj, dict):
                return {k: clean_nan(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [clean_nan(v) for v in obj]
            return obj
        return clean_nan(doc)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{dataset_id}")
async def delete_dataset(dataset_id: str, current_user: dict = Depends(get_current_user)):
    """Deletes a dataset from MongoDB by its ObjectId."""
    if not ObjectId.is_valid(dataset_id):
        raise HTTPException(status_code=404, detail="Dataset not found")
    collection = get_datasets_collection()
    try:
        # Check ownership first
        existing = await collection.find_one({"_id": ObjectId(dataset_id)})
        if not existing:
            raise HTTPException(status_code=404, detail="Dataset not found")
        if existing.get("user_id") and existing["user_id"] != ObjectId(current_user["_id"]):
            raise HTTPException(status_code=403, detail="Access denied")
        result = await collection.delete_one({"_id": ObjectId(dataset_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Dataset not found")
        await log_activity("Dataset Deleted", f"Deleted dataset with ID {dataset_id}", "bg-red-500", current_user["_id"])
        return {"message": "Dataset deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/saved/{dataset_id}")
async def get_saved_dataset(dataset_id: str, current_user: dict = Depends(get_current_user)):
    """Get a specific saved dataset by ID."""
    collection = get_datasets_collection()
    try:
        doc = await collection.find_one({"_id": ObjectId(dataset_id)})
        if not doc:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        # Check ownership
        if doc.get("user_id") and doc["user_id"] != ObjectId(current_user["_id"]):
            raise HTTPException(status_code=403, detail="Access denied")
        
        doc["_id"] = str(doc["_id"])
        if "user_id" in doc and doc["user_id"] is not None:
            doc["user_id"] = str(doc["user_id"])
            
        import math
        def clean_nan(obj):
            if isinstance(obj, float) and math.isnan(obj):
                return None
            elif isinstance(obj, dict):
                return {k: clean_nan(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [clean_nan(v) for v in obj]
            return obj
            
        return clean_nan(doc)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/saved/{dataset_id}")
async def delete_saved_dataset(dataset_id: str, current_user: dict = Depends(get_current_user)):
    """Deletes a dataset from MongoDB by its ObjectId."""
    collection = get_datasets_collection()
    try:
        if dataset_id == 'default_fallback':
            return {"message": "Cannot delete default dataset."}
        
        # Check ownership first
        existing = await collection.find_one({"_id": ObjectId(dataset_id)})
        if not existing:
            raise HTTPException(status_code=404, detail="Dataset not found")
        if existing.get("user_id") and existing["user_id"] != ObjectId(current_user["_id"]):
            raise HTTPException(status_code=403, detail="Access denied")
        
        result = await collection.delete_one({"_id": ObjectId(dataset_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Dataset not found")
            
        await log_activity("Dataset Deleted", f"Deleted dataset with ID {dataset_id}", "bg-red-500")
        return {"message": "Dataset deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/upload")
async def upload_datasets(
    files: list[UploadFile] = File(...),
    cat_constants: Optional[str] = Form(None),
    num_constants: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload CSV or Excel datasets with only 4 optimizing parameters + target.
    Constants are provided as JSON strings from dropdown selection.
    Variable ranges are automatically calculated from the data.
    """
    dataframes = []
    datasets_collection = get_datasets_collection()

    try:
        # Parse constants from JSON strings
        cat_constants_dict = {}
        num_constants_dict = {}
        if cat_constants:
            import json
            cat_constants_dict = json.loads(cat_constants)
        if num_constants:
            num_constants_dict = json.loads(num_constants)

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

            # Replace 'NS' (not specified) with NaN
            df = df.replace('NS', np.nan)

            dataframes.append(df)

        if not dataframes:
            raise HTTPException(status_code=400, detail="No valid CSV/Excel files provided.")

        combined_df = pd.concat(dataframes, ignore_index=True)
        total_rows = len(combined_df)

        # Generate unique Dataset ID and Experiment Numbers
        dataset_count = await datasets_collection.count_documents({"user_id": ObjectId(current_user["_id"])})
        dataset_id = f"EXP_{dataset_count + 1:03d}"
        exp_numbers = [f"{dataset_id}_{i+1:03d}" for i in range(total_rows)]
        combined_df.insert(0, 'Exp Number', exp_numbers)

        # Check if this is a simplified upload (only variables + target)
        required_vars = ['GTE', 'GTI', 'FRA', 'Pressure', 'PL_FWHM']
        has_all_vars = all(col in combined_df.columns for col in required_vars)

        if has_all_vars:
            # Simplified upload - add constants from form data
            for col, val in cat_constants_dict.items():
                combined_df[col] = val
            for col, val in num_constants_dict.items():
                combined_df[col] = val
            combined_df['TOCVD'] = 'Thermal CVD'
            thermal_cvd_df = combined_df

            # Calculate automatic variable ranges from data
            variable_ranges = {}
            for var in ['GTE', 'GTI', 'FRA', 'Pressure']:
                if var in combined_df.columns:
                    values = pd.to_numeric(combined_df[var], errors='coerce').dropna()
                    if len(values) > 0:
                        avg = values.mean()
                        std = values.std()
                        min_val = values.min()
                        max_val = values.max()
                        # Use user requested avg - min and avg + max as range
                        lower = max(0, avg - min_val)
                        upper = avg + max_val
                        variable_ranges[var] = (float(lower), float(upper))
            n_thermal = len(thermal_cvd_df)
        else:
            # Full upload - filter to Thermal CVD
            thermal_cvd_df = combined_df
            if 'TOCVD' in combined_df.columns:
                thermal_cvd_df = combined_df[combined_df['TOCVD'] == 'Thermal CVD'].copy().reset_index(drop=True)
            n_thermal = len(thermal_cvd_df)
            if len(thermal_cvd_df) == 0:
                n_thermal = total_rows

        # Ensure variable_ranges is always populated
        if not variable_ranges or len(variable_ranges) == 0:
            # Use encoder default ranges
            from app.ml_models.thermal_cvd.data_encoder import ThermalCVDEncoder
            encoder = ThermalCVDEncoder()
            variable_ranges = encoder.VARIABLE_RANGES.copy()

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

        # Store metadata into MongoDB
        dataset_record = {
            "name": ", ".join(filenames),
            "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "created_at": datetime.utcnow().isoformat(),
            "rows": f"{len(thermal_cvd_df):,} Thermal CVD ({total_rows:,} total)",
            "dataset_id": dataset_id,
            "experiment_id_range": f"{dataset_id}_EXP_001 to {dataset_id}_EXP_{total_rows:03d}",
            "data": combined_df.to_dict(orient='records'),
            "user_id": ObjectId(current_user["_id"]),
            "status": "Locked",
            "cat_constants": cat_constants_dict,
            "num_constants": num_constants_dict,
            "variable_ranges": variable_ranges if has_all_vars else {}
        }
        insert_result = await datasets_collection.insert_one(dataset_record)

        # Pass Thermal CVD data to the global optimizer to train
        if cvd_routes.optimizer_instance is not None:
            cvd_routes.optimizer_instance.load_training_data(thermal_cvd_df)
            # Set constants from form data if provided
            if cat_constants_dict or num_constants_dict:
                cvd_routes.optimizer_instance.encoder.set_constants_from_dict(cat_constants_dict, num_constants_dict)
            cvd_routes.optimizer_instance.generate_search_space(n_points=5000)
            cvd_routes.optimizer_instance.train_gp()
            best_fwhm = float(cvd_routes.optimizer_instance.y_train.min())
            # Store optimizer for this specific user
            cvd_routes.set_optimizer(current_user["_id"], cvd_routes.optimizer_instance)
            await log_activity(
                "Dataset Uploaded",
                f"{', '.join(filenames)}: {len(thermal_cvd_df)} Thermal CVD rows used",
                "bg-purple-500",
                current_user["_id"]
            )
            await log_activity("GP Model Trained", f"Best FWHM: {best_fwhm:.2f} meV", "bg-cyan-500", current_user["_id"])

        # Get search space data
        search_space_data = []
        if cvd_routes.optimizer_instance is not None and hasattr(cvd_routes.optimizer_instance, 'X_search'):
            X_search = cvd_routes.optimizer_instance.X_search
            if X_search is not None and len(X_search) > 0:
                # Inverse transform to get original variable values
                X_raw = cvd_routes.optimizer_instance.encoder.scaler_X.inverse_transform(X_search)
                var_names = ['GTE', 'GTI', 'FRA', 'Pressure']
                search_space_data = []
                for row in X_raw:
                    var_dict = {var_names[i]: float(row[i]) for i in range(len(var_names))}
                    search_space_data.append(var_dict)

        return {
            "inserted_id": str(insert_result.inserted_id),
            "total_files_processed": len(files),
            "filenames": filenames,
            "total_rows_in_file": total_rows,
            "thermal_cvd_rows_used": len(thermal_cvd_df),
            "columns": list(thermal_cvd_df.columns),
            "status": "success",
            "message": f"Found {len(thermal_cvd_df)} Thermal CVD experiments (out of {total_rows} total rows). GP model trained successfully.",
            "search_space": search_space_data,
            "variable_ranges": variable_ranges if has_all_vars else {}
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@router.post("/upload-json")
async def upload_json_data(payload: SpreadsheetData, current_user: dict = Depends(get_current_user)):
    """
    Accepts raw JSON data from the frontend spreadsheet component,
    converts it to a pandas DataFrame, and processes it.
    """
    datasets_collection = get_datasets_collection()
    try:
        # Filter out empty rows based on variables or target
        valid_data = [row for row in payload.data if row.get('PL_FWHM') or row.get('GTE')]
        if not valid_data:
            raise HTTPException(status_code=400, detail="No valid data provided.")
            
        df = pd.DataFrame(valid_data)
        total_rows = len(df)
        
        # Generate unique Dataset ID and Experiment Numbers
        dataset_count = await datasets_collection.count_documents({"user_id": ObjectId(current_user["_id"])})
        dataset_id = f"EXP_{dataset_count + 1:03d}"
        exp_numbers = [f"{dataset_id}_{i+1:03d}" for i in range(total_rows)]
        df.insert(0, 'Exp Number', exp_numbers)
        
        # Clean column names
        df.columns = [col.replace(' ', '_') if col not in ['PL Peak Position', 'PL Peak Pc', 'PL_FWHM', 'PL FWHM'] else col for col in df.columns]

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

        dataset_record = {
            "name": payload.name if payload.name else f"Manual_Data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
            "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "created_at": datetime.utcnow().isoformat(),
            "rows": f"{len(df):,} Thermal CVD rows",
            "dataset_id": dataset_id,
            "experiment_id_range": f"{dataset_id}_EXP_001 to {dataset_id}_EXP_{total_rows:03d}",
            "data": df.to_dict(orient='records'),
            "user_id": ObjectId(current_user["_id"])
        }
        await datasets_collection.insert_one(dataset_record)

        if cvd_routes.optimizer_instance is not None:
            cvd_routes.optimizer_instance.load_training_data(df)
            cvd_routes.optimizer_instance.generate_search_space(n_points=5000)
            cvd_routes.optimizer_instance.train_gp()
            best_fwhm = float(cvd_routes.optimizer_instance.y_train.min())
            # Store optimizer for this specific user
            cvd_routes.set_optimizer(current_user["_id"], cvd_routes.optimizer_instance)
            await log_activity("Manual Data Submitted", f"{len(df)} Thermal CVD rows ingested", "bg-purple-500", current_user["_id"])
            await log_activity("GP Model Retrained", f"Best FWHM: {best_fwhm:.2f} meV", "bg-cyan-500", current_user["_id"])

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
