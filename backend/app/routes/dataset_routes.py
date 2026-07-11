"""
MongoDB-based routes for dataset management.
"""

from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from typing import List, Dict, Any, Optional
from datetime import datetime
import pandas as pd
import io
from bson import ObjectId

from app.database.mongodb_config import (
    get_datasets_collection,
    get_experiments_collection,
    get_users_collection,
    get_dataset_events_collection,
    get_activity_log_collection
)
from app.database.mongodb_models import DatasetModel, ActivityLogModel
from app.auth import get_current_user

router = APIRouter(prefix="/api/datasets", tags=["datasets"])


# ──────────────────────────────────────────────────────
# IMPORTANT: Static GET routes MUST come BEFORE /{dataset_id}
# to prevent FastAPI from matching them as a dataset_id parameter.
# ──────────────────────────────────────────────────────

@router.get("/list")
async def list_datasets(current_user: dict = Depends(get_current_user)):
    """Get all datasets for a user."""
    collection = get_datasets_collection()
    
    query = {"user_id": ObjectId(current_user["_id"])}
    
    cursor = collection.find(query).sort("created_at", -1)
    datasets = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        if "user_id" in doc:
            doc["user_id"] = str(doc["user_id"])
        datasets.append(doc)
    
    return {"datasets": datasets}


@router.get("/dashboard-stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    """Get dashboard statistics for the current user."""
    datasets_collection = get_datasets_collection()
    
    user_filter = {"user_id": ObjectId(current_user["_id"])}
    
    total_datasets = await datasets_collection.count_documents(user_filter)
    locked_datasets = await datasets_collection.count_documents({**user_filter, "status": "locked"})
    in_progress_datasets = await datasets_collection.count_documents({**user_filter, "status": "in_progress"})
    unlocked_datasets = total_datasets - locked_datasets - in_progress_datasets
    
    # Compute total experiments (sum of total_experiments across all datasets)
    total_experiments = 0
    n_training_samples = 0
    cursor = datasets_collection.find(user_filter)
    async for doc in cursor:
        total_experiments += doc.get("total_experiments", 0)
        data = doc.get("data", [])
        n_training_samples += len(data) if isinstance(data, list) else 0
    
    # Get activity log
    activities_collection = get_activity_log_collection()
    log_cursor = activities_collection.find({"user_id": ObjectId(current_user["_id"])}).sort("timestamp", -1).limit(8)
    activity_log = []
    async for doc in log_cursor:
        doc["_id"] = str(doc["_id"])
        if "user_id" in doc and doc["user_id"]:
            doc["user_id"] = str(doc["user_id"])
        activity_log.append(doc)
    
    # Variable summary for the dashboard donut chart
    variable_summary_data = [
        {"name": "Numerical", "value": 7, "color": "#5D3EBC", "percentage": "58%"},
        {"name": "Categorical", "value": 3, "color": "#3B82F6", "percentage": "25%"},
        {"name": "Constants", "value": 2, "color": "#10B981", "percentage": "17%"},
    ]
    
    return {
        "total_datasets": total_datasets,
        "locked_datasets": locked_datasets,
        "in_progress_datasets": in_progress_datasets,
        "unlocked_datasets": unlocked_datasets,
        "active_experiments": total_experiments,
        "n_training_samples": n_training_samples,
        "activity_log": activity_log,
        "variable_summary_data": variable_summary_data,
    }


@router.get("/activity-log")
async def get_activity_log(limit: int = 20, current_user: dict = Depends(get_current_user)):
    """Get recent activity log entries for the current user."""
    collection = get_activity_log_collection()
    
    cursor = collection.find({"user_id": ObjectId(current_user["_id"])}).sort("timestamp", -1).limit(limit)
    activities = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        if "user_id" in doc and doc["user_id"]:
            doc["user_id"] = str(doc["user_id"])
        activities.append(doc)
    
    return {"activities": activities}


# ──────────────────────────────────────────────────────
# Parameterized routes (/{dataset_id}) MUST come AFTER
# all static GET routes above.
# ──────────────────────────────────────────────────────

@router.post("/{dataset_id}/activate")
async def activate_dataset(dataset_id: str, current_user: dict = Depends(get_current_user)):
    """Set the active dataset for the current user."""
    users_collection = get_users_collection()
    datasets_collection = get_datasets_collection()
    
    # Check if dataset exists and belongs to user
    dataset = await datasets_collection.find_one({"_id": ObjectId(dataset_id), "user_id": ObjectId(current_user["_id"])})
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found or access denied")
        
    await users_collection.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$set": {"active_dataset_id": ObjectId(dataset_id)}}
    )
    
    # Log audit event
    events_collection = get_dataset_events_collection()
    await events_collection.insert_one({
        "dataset_id": ObjectId(dataset_id),
        "event_type": "Dataset activated",
        "details": {"user_id": str(current_user["_id"])},
        "created_at": datetime.utcnow().isoformat()
    })
    
    return {"message": "Dataset activated successfully", "dataset_id": dataset_id}


@router.get("/{dataset_id}/summary")
async def get_dataset_summary(dataset_id: str, current_user: dict = Depends(get_current_user)):
    """Get a lightweight summary of a dataset."""
    collection = get_datasets_collection()
    dataset = await collection.find_one({"_id": ObjectId(dataset_id), "user_id": ObjectId(current_user["_id"])})
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    experiments_collection = get_experiments_collection()
    historical_count = await experiments_collection.count_documents({"dataset_id": ObjectId(dataset_id), "type": "historical"})
    bo_count = await experiments_collection.count_documents({"dataset_id": ObjectId(dataset_id), "type": "bo"})
    
    return {
        "id": str(dataset["_id"]),
        "name": dataset.get("name", ""),
        "rows": dataset.get("row_count", historical_count + bo_count),
        "historical": historical_count,
        "bo_iterations": dataset.get("bo_iterations", bo_count),
        "best_fwhm": dataset.get("best_fwhm", None),
        "last_bo_run": dataset.get("last_bo_run", None),
        "last_updated": dataset.get("updated_at"),
        "optimizer_version": dataset.get("optimizer_version", "v1"),
        "status": dataset.get("status", "ready")
    }

@router.get("/{dataset_id}/experiments")
async def get_dataset_experiments(
    dataset_id: str, 
    page: int = 1, 
    page_size: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """Get paginated experiments for a dataset."""
    collection = get_datasets_collection()
    dataset = await collection.find_one({"_id": ObjectId(dataset_id), "user_id": ObjectId(current_user["_id"])})
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    experiments_collection = get_experiments_collection()
    skip = (page - 1) * page_size
    
    cursor = experiments_collection.find({"dataset_id": ObjectId(dataset_id)}).sort("experiment_number", 1).skip(skip).limit(page_size)
    
    experiments = []
    async for exp in cursor:
        exp["_id"] = str(exp["_id"])
        exp["dataset_id"] = str(exp["dataset_id"])
        experiments.append(exp)
        
    total_count = await experiments_collection.count_documents({"dataset_id": ObjectId(dataset_id)})
    
    return {
        "data": experiments,
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": (total_count + page_size - 1) // page_size
    }

# ──────────────────────────────────────────────────────


@router.get("/{dataset_id}")
async def get_dataset(dataset_id: str, current_user: dict = Depends(get_current_user)):
    """Get a specific dataset by ID."""
    collection = get_datasets_collection()
    
    try:
        doc = await collection.find_one({"_id": ObjectId(dataset_id), "user_id": ObjectId(current_user["_id"])})
        if not doc:
            raise HTTPException(status_code=404, detail="Dataset not found or access denied")
        
        doc["_id"] = str(doc["_id"])
        if "user_id" in doc:
            doc["user_id"] = str(doc["user_id"])
        
        return doc
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/create")
async def create_dataset(dataset_data: Dict[str, Any], current_user: dict = Depends(get_current_user)):
    """Create a new dataset."""
    collection = get_datasets_collection()
    
    dataset = {
        "name": dataset_data.get("name", "Untitled Dataset"),
        "description": dataset_data.get("description", ""),
        "user_id": ObjectId(current_user["_id"]),
        "status": "ready",
        "experiment_id_range": dataset_data.get("experiment_id_range", ""),
        "total_experiments": 0,
        "row_count": 0,
        "numerical_constants": dataset_data.get("numerical_constants", {}),
        "categorical_constants": dataset_data.get("categorical_constants", {}),
        "variables_to_vary": dataset_data.get("variables_to_vary", []),
        "minimum_runs_required": dataset_data.get("minimum_runs_required", 0),
        "total_planned_runs": dataset_data.get("total_planned_runs", 0),
        "column_mapping": {},
        "optimizer_config": {},
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    result = await collection.insert_one(dataset)
    dataset["_id"] = str(result.inserted_id)
    
    # If data is provided, insert it into experiments collection
    data = dataset_data.get("data", [])
    if data:
        experiments_collection = get_experiments_collection()
        experiments_to_insert = []
        for i, row in enumerate(data):
            experiments_to_insert.append({
                "dataset_id": result.inserted_id,
                "experiment_number": i + 1,
                "type": "historical",
                "schema_version": 1,
                "status": "completed",
                "parameters": row,
                "created_at": datetime.utcnow().isoformat()
            })
        if experiments_to_insert:
            await experiments_collection.insert_many(experiments_to_insert)
            await collection.update_one(
                {"_id": result.inserted_id},
                {"$set": {"row_count": len(experiments_to_insert), "total_experiments": len(experiments_to_insert)}}
            )
            
    # Log activity
    await log_activity("Dataset Created", f"Dataset '{dataset['name']}' created", "bg-purple-500", user_id=current_user["_id"])
    
    # Audit Event
    events_collection = get_dataset_events_collection()
    await events_collection.insert_one({
        "dataset_id": result.inserted_id,
        "event_type": "Dataset created",
        "details": {"rows": len(data)},
        "created_at": datetime.utcnow().isoformat()
    })
    
    return dataset


@router.put("/{dataset_id}")
async def update_dataset(dataset_id: str, dataset_data: Dict[str, Any], current_user: dict = Depends(get_current_user)):
    """Update an existing dataset."""
    collection = get_datasets_collection()
    
    try:
        update_data = {k: v for k, v in dataset_data.items() if k != "_id"}
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        result = await collection.update_one(
            {"_id": ObjectId(dataset_id), "user_id": ObjectId(current_user["_id"])},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Dataset not found or access denied")
        
        return {"message": "Dataset updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{dataset_id}")
async def delete_dataset(dataset_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a dataset."""
    collection = get_datasets_collection()
    
    try:
        result = await collection.delete_one({"_id": ObjectId(dataset_id), "user_id": ObjectId(current_user["_id"])})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Dataset not found or access denied")
        
        await log_activity("Dataset Deleted", f"Dataset {dataset_id} deleted", "bg-red-500", user_id=current_user["_id"])
        
        return {"message": "Dataset deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/upload")
async def upload_dataset(files: list[UploadFile] = File(...), current_user: dict = Depends(get_current_user)):
    """Upload and process dataset files."""
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
            df.columns = [col.replace(' ', '_') if col not in ['PL Peak Position', 'PL Peak Pc', 'PL_FWHM', 'PL FWHM'] else col for col in df.columns]
            if 'PL_FWHM' not in df.columns and 'PL FWHM' in df.columns:
                df = df.rename(columns={'PL FWHM': 'PL_FWHM'})
                
            dataframes.append(df)
        
        if not dataframes:
            raise HTTPException(status_code=400, detail="No valid CSV/Excel files provided.")
            
        combined_df = pd.concat(dataframes, ignore_index=True)
        total_rows = len(combined_df)
        
        # Coerce known numeric columns
        num_cols = ['FRH', 'HR', 'FRP1', 'FRP2', 'CP1', 'CP2', 'GTE', 'GTI', 'FRA', 'Pressure', 'PL_FWHM']
        for col in num_cols:
            if col in combined_df.columns:
                combined_df[col] = pd.to_numeric(combined_df[col], errors='coerce')
        
        # Create dataset record
        collection = get_datasets_collection()
        dataset = {
            "name": ", ".join(filenames),
            "description": f"Uploaded on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            "user_id": ObjectId(current_user["_id"]),
            "status": "ready",
            "total_experiments": total_rows,
            "row_count": total_rows,
            "column_mapping": {},
            "optimizer_config": {},
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        result = await collection.insert_one(dataset)
        dataset_id = result.inserted_id
        
        # Insert experiments
        experiments_collection = get_experiments_collection()
        experiments_to_insert = []
        data_records = combined_df.to_dict(orient='records')
        for i, row in enumerate(data_records):
            experiments_to_insert.append({
                "dataset_id": dataset_id,
                "experiment_number": i + 1,
                "type": "historical",
                "schema_version": 1,
                "status": "completed",
                "parameters": row,
                "created_at": datetime.utcnow().isoformat()
            })
        if experiments_to_insert:
            await experiments_collection.insert_many(experiments_to_insert)
            
        dataset["_id"] = str(dataset_id)
        
        await log_activity("Dataset Uploaded", f"{', '.join(filenames)} uploaded ({total_rows} rows)", "bg-purple-500", user_id=current_user["_id"])
        
        return {
            "dataset_id": str(result.inserted_id),
            "total_files_processed": len(files),
            "filenames": filenames,
            "total_rows_aggregated": total_rows,
            "columns": list(combined_df.columns),
            "status": "success",
            "message": "Dataset uploaded successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")


@router.post("/{dataset_id}/lock")
async def lock_dataset(dataset_id: str, current_user: dict = Depends(get_current_user)):
    """Lock a dataset to prevent modifications."""
    collection = get_datasets_collection()
    
    try:
        result = await collection.update_one(
            {"_id": ObjectId(dataset_id), "user_id": ObjectId(current_user["_id"])},
            {"$set": {"status": "locked", "updated_at": datetime.utcnow().isoformat()}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Dataset not found or access denied")
        
        await log_activity("Dataset Locked", f"Dataset {dataset_id} locked", "bg-orange-500", user_id=current_user["_id"])
        
        return {"message": "Dataset locked successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{dataset_id}/unlock")
async def unlock_dataset(dataset_id: str, current_user: dict = Depends(get_current_user)):
    """Unlock a dataset to allow modifications."""
    collection = get_datasets_collection()
    
    try:
        result = await collection.update_one(
            {"_id": ObjectId(dataset_id), "user_id": ObjectId(current_user["_id"])},
            {"$set": {"status": "unlocked", "updated_at": datetime.utcnow().isoformat()}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Dataset not found or access denied")
        
        await log_activity("Dataset Unlocked", f"Dataset {dataset_id} unlocked", "bg-green-500", user_id=current_user["_id"])
        
        return {"message": "Dataset unlocked successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


async def log_activity(title: str, description: str, color: str = "bg-cyan-500", user_id: Optional[str] = None):
    """Helper function to log activity."""
    collection = get_activity_log_collection()
    
    activity = {
        "title": title,
        "description": description,
        "color": color,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    if user_id:
        activity["user_id"] = ObjectId(user_id)
    
    await collection.insert_one(activity)
