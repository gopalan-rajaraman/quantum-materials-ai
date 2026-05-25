"""
MongoDB-based routes for dataset management.
"""

from fastapi import APIRouter, HTTPException, File, UploadFile
from typing import List, Dict, Any, Optional
from datetime import datetime
import pandas as pd
import io
from bson import ObjectId

from app.database.mongodb_config import (
    get_datasets_collection,
    get_activity_log_collection
)
from app.database.mongodb_models import DatasetModel, ActivityLogModel

router = APIRouter(prefix="/api/datasets", tags=["datasets"])


@router.get("/list")
async def list_datasets(user_id: Optional[str] = None):
    """Get all datasets for a user."""
    collection = get_datasets_collection()
    
    query = {}
    if user_id:
        query["user_id"] = ObjectId(user_id)
    
    cursor = collection.find(query).sort("created_at", -1)
    datasets = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        if "user_id" in doc:
            doc["user_id"] = str(doc["user_id"])
        datasets.append(doc)
    
    return {"datasets": datasets}


@router.get("/{dataset_id}")
async def get_dataset(dataset_id: str):
    """Get a specific dataset by ID."""
    collection = get_datasets_collection()
    
    try:
        doc = await collection.find_one({"_id": ObjectId(dataset_id)})
        if not doc:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        doc["_id"] = str(doc["_id"])
        if "user_id" in doc:
            doc["user_id"] = str(doc["user_id"])
        
        return doc
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/create")
async def create_dataset(dataset_data: Dict[str, Any]):
    """Create a new dataset."""
    collection = get_datasets_collection()
    
    dataset = {
        "name": dataset_data.get("name", "Untitled Dataset"),
        "description": dataset_data.get("description", ""),
        "user_id": ObjectId(dataset_data.get("user_id")) if dataset_data.get("user_id") else None,
        "status": "unlocked",
        "experiment_id_range": dataset_data.get("experiment_id_range", ""),
        "total_experiments": dataset_data.get("total_experiments", 0),
        "numerical_constants": dataset_data.get("numerical_constants", {}),
        "categorical_constants": dataset_data.get("categorical_constants", {}),
        "variables_to_vary": dataset_data.get("variables_to_vary", []),
        "minimum_runs_required": dataset_data.get("minimum_runs_required", 0),
        "total_planned_runs": dataset_data.get("total_planned_runs", 0),
        "data": dataset_data.get("data", []),
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    result = await collection.insert_one(dataset)
    dataset["_id"] = str(result.inserted_id)
    
    # Log activity
    await log_activity("Dataset Created", f"Dataset '{dataset['name']}' created", "bg-purple-500")
    
    return dataset


@router.put("/{dataset_id}")
async def update_dataset(dataset_id: str, dataset_data: Dict[str, Any]):
    """Update an existing dataset."""
    collection = get_datasets_collection()
    
    try:
        update_data = {k: v for k, v in dataset_data.items() if k != "_id"}
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        if "user_id" in update_data and update_data["user_id"]:
            update_data["user_id"] = ObjectId(update_data["user_id"])
        
        result = await collection.update_one(
            {"_id": ObjectId(dataset_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        return {"message": "Dataset updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{dataset_id}")
async def delete_dataset(dataset_id: str):
    """Delete a dataset."""
    collection = get_datasets_collection()
    
    try:
        result = await collection.delete_one({"_id": ObjectId(dataset_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        await log_activity("Dataset Deleted", f"Dataset {dataset_id} deleted", "bg-red-500")
        
        return {"message": "Dataset deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/upload")
async def upload_dataset(files: list[UploadFile] = File(...), user_id: Optional[str] = None):
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
            "user_id": ObjectId(user_id) if user_id else None,
            "status": "unlocked",
            "total_experiments": total_rows,
            "data": combined_df.to_dict(orient='records'),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        result = await collection.insert_one(dataset)
        dataset["_id"] = str(result.inserted_id)
        
        await log_activity("Dataset Uploaded", f"{', '.join(filenames)} uploaded ({total_rows} rows)", "bg-purple-500")
        
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
async def lock_dataset(dataset_id: str):
    """Lock a dataset to prevent modifications."""
    collection = get_datasets_collection()
    
    try:
        result = await collection.update_one(
            {"_id": ObjectId(dataset_id)},
            {"$set": {"status": "locked", "updated_at": datetime.utcnow().isoformat()}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        await log_activity("Dataset Locked", f"Dataset {dataset_id} locked", "bg-orange-500")
        
        return {"message": "Dataset locked successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{dataset_id}/unlock")
async def unlock_dataset(dataset_id: str):
    """Unlock a dataset to allow modifications."""
    collection = get_datasets_collection()
    
    try:
        result = await collection.update_one(
            {"_id": ObjectId(dataset_id)},
            {"$set": {"status": "unlocked", "updated_at": datetime.utcnow().isoformat()}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        await log_activity("Dataset Unlocked", f"Dataset {dataset_id} unlocked", "bg-green-500")
        
        return {"message": "Dataset unlocked successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/activity-log")
async def get_activity_log(limit: int = 20):
    """Get recent activity log entries."""
    collection = get_activity_log_collection()
    
    cursor = collection.find().sort("timestamp", -1).limit(limit)
    activities = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        if "user_id" in doc and doc["user_id"]:
            doc["user_id"] = str(doc["user_id"])
        activities.append(doc)
    
    return {"activities": activities}


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


@router.get("/dashboard-stats")
async def get_dashboard_stats():
    """Get dashboard statistics."""
    datasets_collection = get_datasets_collection()
    
    total_datasets = await datasets_collection.count_documents({})
    locked_datasets = await datasets_collection.count_documents({"status": "locked"})
    in_progress_datasets = await datasets_collection.count_documents({"status": "in_progress"})
    
    # Get activity log
    activities_collection = get_activity_log_collection()
    cursor = activities_collection.find().sort("timestamp", -1).limit(8)
    activity_log = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        if "user_id" in doc and doc["user_id"]:
            doc["user_id"] = str(doc["user_id"])
        activity_log.append(doc)
    
    return {
        "total_datasets": total_datasets,
        "locked_datasets": locked_datasets,
        "in_progress_datasets": in_progress_datasets,
        "unlocked_datasets": total_datasets - locked_datasets - in_progress_datasets,
        "activity_log": activity_log
    }
