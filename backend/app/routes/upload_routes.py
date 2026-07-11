from app.database.mongodb_config import MongoDB
from app.services.matching_engine import MatchingEngine
import uuid
import asyncio
import os
from fastapi import APIRouter, File, UploadFile, HTTPException, Depends, Form
import io
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from bson import ObjectId
import logging
logger = logging.getLogger(__name__)


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
    user_id = str(current_user["_id"])
    opt = await cvd_routes.get_optimizer(user_id)

    datasets_collection = get_datasets_collection()
    activity_collection = get_activity_log_collection()

    query = {"user_id": ObjectId(user_id)}
    saved_datasets_count = await datasets_collection.count_documents(query)

    fitted = opt is not None and opt._fitted and saved_datasets_count > 0
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
            {"name": "Numerical", "value": 0, "percentage": "0%", "color": "#5D3EBC"},
            {"name": "Categorical", "value": 0, "percentage": "0%", "color": "#3B82F6"},
            {"name": "Discrete", "value": 0, "percentage": "0%", "color": "#F59E0B"},
            {"name": "Boolean", "value": 0, "percentage": "0%", "color": "#EF4444"}
        ]
        overview_chart_data = []
        model_performance_data = []

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
        
        # Calculate best value specific to this dataset
        dataset_data = entry.get('data', [])
        best_fwhm = None
        if dataset_data:
            for row in dataset_data:
                val = row.get('PL_FWHM')
                if val is not None:
                    try:
                        fval = float(val)
                        if best_fwhm is None or fval < best_fwhm:
                            best_fwhm = fval
                    except (ValueError, TypeError):
                        pass

        entry.pop('data', None)

        # Use actual status from database, default to 'unlocked' if not set
        entry['status'] = entry.get('status', 'unlocked')

        if best_fwhm is not None:
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
            
        await log_activity("Dataset Deleted", f"Deleted dataset with ID {dataset_id}", "bg-red-500", current_user["_id"])
        return {"message": "Dataset deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/upload/parse")
async def parse_dataset(
    files: list[UploadFile] = File(...),
    experiment_id: str = Form("Thermal CVD"),
    current_user: dict = Depends(get_current_user)
):
    """
    Phase 1: Parse the uploaded file, extract columns, and return a preview.
    Saves the file to a temporary location and creates an ImportSession.
    """
    try:
        import os
        import uuid
        
        # Save files temporarily
        temp_dir = os.path.join(os.getcwd(), "temp_uploads")
        os.makedirs(temp_dir, exist_ok=True)
        
        session_id = str(uuid.uuid4())
        
        file = files[0] # Handle one file for simplicity in parsing
        contents = await file.read()
        
        file_path = os.path.join(temp_dir, f"{session_id}_{file.filename}")
        with open(file_path, "wb") as f:
            f.write(contents)
            
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        elif file.filename.endswith(('.xls', '.xlsx')):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")
            
        columns = list(df.columns)
        
        # Generate preview
        preview = df.head(5).replace({np.nan: None}).to_dict(orient='records')
        
        # Detect duplicates
        from collections import Counter
        col_counts = Counter(columns)
        duplicate_headers = [col for col, count in col_counts.items() if count > 1]
        
        # Save session to MongoDB
        session_doc = {
            "session_id": session_id,
            "user_id": ObjectId(current_user["_id"]),
            "experiment_id": experiment_id,
            "file_path": file_path,
            "original_filename": file.filename,
            "columns": columns,
            "preview": preview,
            "duplicate_headers": duplicate_headers,
            "created_at": datetime.utcnow().isoformat()
        }
        
        db = MongoDB.get_database()
        await db["import_sessions"].insert_one(session_doc)
        
        return {
            "import_session_id": session_id,
            "columns": columns,
            "preview": preview,
            "duplicate_headers": duplicate_headers,
            "total_rows": len(df)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ConfirmImportPayload(BaseModel):
    import_session_id: str
    mapping: Dict[str, str]
    optimization_variables: List[str]
    template_id: Optional[str] = None
    save_as_template: Optional[bool] = False
    template_name: Optional[str] = None
    cat_constants: Optional[Dict[str, str]] = {}
    num_constants: Optional[Dict[str, float]] = {}
    initial_training_size: Optional[int] = None
    start_idx: Optional[int] = None
    end_idx: Optional[int] = None

@router.post("/upload/confirm")
async def confirm_import(
    payload: ConfirmImportPayload,
    current_user: dict = Depends(get_current_user)
):
    """
    Phase 2: Confirm mapping, rename columns, create dataset, trigger GP asynchronously.
    """
    try:
        db = MongoDB.get_database()
        datasets_collection = get_datasets_collection()
        
        # 1. Fetch Session
        session = await db["import_sessions"].find_one({"session_id": payload.import_session_id})
        if not session:
            raise HTTPException(status_code=404, detail="Import session not found or expired")
            
        file_path = session["file_path"]
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Uploaded file no longer available")
            
        # 2. Load dataframe
        if session["original_filename"].endswith('.csv'):
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)
            
        total_rows = len(df)
        
        # 3. Apply slice if a specific batch was selected
        if payload.start_idx is not None and payload.end_idx is not None:
            df = df.iloc[payload.start_idx:payload.end_idx].reset_index(drop=True)
            total_rows = len(df)
            
        # 4. Apply Mapping
        # mapping is { internal_name: excel_column }
        # We need to rename dataframe columns from excel_column -> internal_name
        inverted_mapping = {v: k for k, v in payload.mapping.items()}
        df = df.rename(columns=inverted_mapping)
        
        # Default target handling
        if 'PL_FWHM' in df.columns:
            df = df.dropna(subset=['PL_FWHM']).reset_index(drop=True)
            
        if payload.cat_constants:
            for col, val in payload.cat_constants.items():
                df[col] = val
        if payload.num_constants:
            for col, val in payload.num_constants.items():
                df[col] = float(val)
                
        df['TOCVD'] = 'Thermal CVD'
        thermal_cvd_df = df
        
        # 4. Save template if requested
        if payload.save_as_template and payload.template_name:
            template_doc = {
                "name": payload.template_name,
                "experiment_id": session["experiment_id"],
                "user_id": ObjectId(current_user["_id"]),
                "mapping_json": payload.mapping,
                "version": 1,
                "is_default": False,
                "created_by": str(current_user["_id"]),
                "last_used_at": datetime.utcnow().isoformat(),
                "times_used": 1,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            await db["import_templates"].insert_one(template_doc)
            
        # 5. Create Dataset Record
        dataset_count = await datasets_collection.count_documents({"user_id": ObjectId(current_user["_id"])})
        dataset_id = f"EXP_{dataset_count + 1:03d}"
        
        exp_numbers = [f"{dataset_id}_{i+1:03d}" for i in range(len(thermal_cvd_df))]
        if 'Exp Number' not in thermal_cvd_df.columns:
            thermal_cvd_df.insert(0, 'Exp Number', exp_numbers)
        
        dataset_record = {
            "name": session["original_filename"],
            "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "created_at": datetime.utcnow().isoformat(),
            "rows": f"{len(thermal_cvd_df):,} rows",
            "dataset_id": dataset_id,
            "experiment_id_range": f"{dataset_id}_EXP_001 to {dataset_id}_EXP_{len(thermal_cvd_df):03d}",
            "data": thermal_cvd_df.replace({np.nan: None}).to_dict(orient='records'),
            "user_id": ObjectId(current_user["_id"]),
            "status": "unlocked",
            "column_mapping": payload.mapping,
            "optimization_variables": payload.optimization_variables
        }
        
        insert_result = await datasets_collection.insert_one(dataset_record)
        
        # Update user's active dataset
        from app.database.mongodb_config import get_users_collection
        await get_users_collection().update_one(
            {"_id": ObjectId(current_user["_id"])},
            {"$set": {"active_dataset_id": insert_result.inserted_id}}
        )
        
        # 6. Trigger GP Synchronously to get search space
        await run_gp_training_async(thermal_cvd_df, current_user["_id"], payload.optimization_variables, payload.initial_training_size)
        
        search_space = []
        variable_ranges = {}
        opt = await cvd_routes.get_optimizer(current_user["_id"])
        if opt and getattr(opt, '_fitted', False) and getattr(opt, 'X_search', None) is not None:
            X_raw = opt.encoder.scaler_X.inverse_transform(opt.X_search)
            var_names = opt.encoder.VARIABLES
            for row in X_raw:
                search_space.append({var_names[i]: float(row[i]) for i in range(len(var_names))})
            for var in var_names:
                v_min, v_max = opt.encoder.VARIABLE_RANGES[var]
                variable_ranges[var] = [float(v_min), float(v_max)]
        
        # Cleanup
        try:
            os.remove(file_path)
            await db["import_sessions"].delete_one({"session_id": payload.import_session_id})
        except:
            pass
            
        return {
            "status": "success",
            "inserted_id": str(insert_result.inserted_id),
            "message": "Dataset imported successfully",
            "search_space": search_space,
            "variable_ranges": variable_ranges,
            "report": {
                "rows_processed": total_rows,
                "variables_mapped": len(payload.mapping),
                "extra_columns_ignored": len(session["columns"]) - len(payload.mapping)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def run_gp_training_async(df, user_id, optimization_variables, initial_training_size=None):
    """Background task to train GP."""
    try:
        if cvd_routes.optimizer_instance is not None:
            cvd_routes.optimizer_instance.encoder.set_variables(optimization_variables)
            # Drop NaN rows in required num columns for training
            num_cols = optimization_variables + ['PL_FWHM']
            for col in num_cols:
                if col in df.columns:
                    df[col] = pd.to_numeric(df[col], errors='coerce')
            train_df = df.dropna(subset=['PL_FWHM']).reset_index(drop=True)
            
            if len(train_df) > 0:
                cvd_routes.optimizer_instance.load_training_data(train_df)
                if initial_training_size is not None:
                    cvd_routes.optimizer_instance._training_info['initial_samples'] = min(initial_training_size, len(train_df))
                
                cvd_routes.optimizer_instance.generate_search_space(n_points=5000)
                cvd_routes.optimizer_instance.train_gp()
                cvd_routes.set_optimizer(user_id, cvd_routes.optimizer_instance)
                best_fwhm = float(cvd_routes.optimizer_instance.y_train.min())
                await log_activity("GP Model Retrained", f"Best FWHM: {best_fwhm:.2f} meV", "bg-cyan-500", user_id)
    except Exception as e:
        logger.info(f"Async GP Training Error: {e}")



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
        insert_result = await datasets_collection.insert_one(dataset_record)
        
        # Update user's active dataset
        from app.database.mongodb_config import get_users_collection
        await get_users_collection().update_one(
            {"_id": ObjectId(current_user["_id"])},
            {"$set": {"active_dataset_id": insert_result.inserted_id}}
        )

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
