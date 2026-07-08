"""
MongoDB-based routes for experiment management.
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from datetime import datetime
from bson import ObjectId

from app.database.mongodb_config import get_experiments_collection
from app.auth import get_current_user

router = APIRouter(prefix="/api/experiments", tags=["experiments"])


@router.get("/list")
async def list_experiments(current_user: dict = Depends(get_current_user)):
    """Get all experiments for a user."""
    collection = get_experiments_collection()
    
    query = {"user_id": ObjectId(current_user["_id"])}
    
    cursor = collection.find(query).sort("created_at", -1)
    experiments = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        if "user_id" in doc:
            doc["user_id"] = str(doc["user_id"])
        experiments.append(doc)
    
    return {"experiments": experiments}


@router.get("/{experiment_id}")
async def get_experiment(experiment_id: str, current_user: dict = Depends(get_current_user)):
    """Get a specific experiment by ID."""
    collection = get_experiments_collection()
    
    try:
        doc = await collection.find_one({"_id": ObjectId(experiment_id), "user_id": ObjectId(current_user["_id"])})
        if not doc:
            raise HTTPException(status_code=404, detail="Experiment not found or access denied")
        
        doc["_id"] = str(doc["_id"])
        if "user_id" in doc:
            doc["user_id"] = str(doc["user_id"])
        
        return doc
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/create")
async def create_experiment(experiment_data: Dict[str, Any], current_user: dict = Depends(get_current_user)):
    """Create a new experiment."""
    collection = get_experiments_collection()
    
    experiment = {
        "name": experiment_data.get("name", "Untitled Experiment"),
        "description": experiment_data.get("description", ""),
        "user_id": ObjectId(current_user["_id"]),
        "dataset_id": ObjectId(experiment_data.get("dataset_id")) if experiment_data.get("dataset_id") else None,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    result = await collection.insert_one(experiment)
    experiment["_id"] = str(result.inserted_id)
    
    return experiment


@router.put("/{experiment_id}")
async def update_experiment(experiment_id: str, experiment_data: Dict[str, Any], current_user: dict = Depends(get_current_user)):
    """Update an existing experiment."""
    collection = get_experiments_collection()
    
    try:
        update_data = {k: v for k, v in experiment_data.items() if k != "_id"}
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        result = await collection.update_one(
            {"_id": ObjectId(experiment_id), "user_id": ObjectId(current_user["_id"])},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Experiment not found or access denied")
        
        return {"message": "Experiment updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{experiment_id}")
async def delete_experiment(experiment_id: str, current_user: dict = Depends(get_current_user)):
    """Delete an experiment."""
    collection = get_experiments_collection()
    
    try:
        result = await collection.delete_one({"_id": ObjectId(experiment_id), "user_id": ObjectId(current_user["_id"])})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Experiment not found or access denied")
        
        return {"message": "Experiment deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{experiment_id}/variables")
async def get_experiment_variables(experiment_id: str, current_user: dict = Depends(get_current_user)):
    """Get required variables schema for an experiment."""
    # For now, hardcode Thermal CVD variables, later fetch from DB based on experiment_id
    from app.services.alias_registry import AliasRegistry
    
    if experiment_id == "Thermal CVD" or "Thermal CVD" in experiment_id:
        return {
            "inputs": [],
            "outputs": [
                {"name": "PL_FWHM", "desc": "Photoluminescence FWHM", "type": "numeric", "aliases": AliasRegistry.get_aliases("PL_FWHM")}
            ],
            "sample_identifier": {
                "name": "Exp Number", "desc": "Experiment Number", "type": "string|numeric", "aliases": AliasRegistry.get_aliases("Exp Number")
            },
            "constants": [
                {
                    "name": "P1",
                    "label": "Precursor 1",
                    "type": "categorical",
                    "options": ["W(CO)6", "WO3", "WCl6", "WF6", "MoO3"]
                },
                {
                    "name": "P2",
                    "label": "Precursor 2",
                    "type": "categorical",
                    "options": ["H2S", "Sulfur", "DTBS", "Se"]
                },
                {
                    "name": "Substrate",
                    "label": "Substrate",
                    "type": "categorical",
                    "options": ["SiO2/Si", "Sapphire (C-plane)", "graphite", "Graphene", "Quartz"]
                },
                {
                    "name": "CG",
                    "label": "Carrier Gas",
                    "type": "categorical",
                    "options": ["Ar", "H2", "H2/Ar", "He"]
                },
                {
                    "name": "COM",
                    "label": "Cooling Method",
                    "type": "categorical",
                    "options": ["Natural", "Rapid", "NS"]
                },
                {
                    "name": "PC",
                    "label": "Precursor Container",
                    "type": "categorical",
                    "options": ["Bubbler", "Quartz boat", "Al2O3 crucible", "Sulfur boat", "Ceramic boat", "Gas cylinders"]
                },
                {
                    "name": "SA",
                    "label": "Sample Additive",
                    "type": "categorical",
                    "options": ["NaCl", "SnCl4"]
                },
                {
                    "name": "Class",
                    "label": "Morphology Class",
                    "type": "categorical",
                    "options": ["Monolayer", "Nanosheets"]
                },
                {
                    "name": "FRH",
                    "label": "Hydrogen Flow Rate (sccm)",
                    "type": "numeric"
                },
                {
                    "name": "HR",
                    "label": "Heating Rate (°C/min)",
                    "type": "numeric"
                },
                {
                    "name": "FRP1",
                    "label": "Flow Rate P1 (sccm)",
                    "type": "numeric"
                },
                {
                    "name": "FRP2",
                    "label": "Flow Rate P2 (sccm)",
                    "type": "numeric"
                },
                {
                    "name": "CP1",
                    "label": "Carrier Pressure 1 (Torr)",
                    "type": "numeric"
                },
                {
                    "name": "CP2",
                    "label": "Carrier Pressure 2 (Torr)",
                    "type": "numeric"
                }
            ]
        }
    
    raise HTTPException(status_code=404, detail="Experiment variables not configured")
