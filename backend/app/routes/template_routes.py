from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from bson import ObjectId
from datetime import datetime

from app.auth import get_current_user
from app.database.mongodb_config import MongoDB

router = APIRouter(
    prefix="/api/datasets/import-templates",
    tags=["import-templates"]
)

def get_templates_collection():
    return MongoDB.get_database()["import_templates"]

@router.get("")
async def get_templates(experiment_id: str, current_user: dict = Depends(get_current_user)):
    """Fetch templates scoped to the experiment."""
    collection = get_templates_collection()
    cursor = collection.find({
        "experiment_id": experiment_id,
        "$or": [
            {"user_id": ObjectId(current_user["_id"])},
            {"is_default": True}
        ]
    }).sort([("times_used", -1), ("last_used_at", -1)])
    
    templates = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        if doc.get("user_id"):
            doc["user_id"] = str(doc["user_id"])
        templates.append(doc)
    
    return templates

@router.post("")
async def save_template(payload: Dict[str, Any], current_user: dict = Depends(get_current_user)):
    """Save or update a template with experiment_id."""
    collection = get_templates_collection()
    
    template_name = payload.get("name")
    experiment_id = payload.get("experiment_id")
    mapping_json = payload.get("mapping_json", {})
    notes = payload.get("notes", "")

    if not template_name or not experiment_id:
        raise HTTPException(status_code=400, detail="Missing name or experiment_id")

    # Check if a template with this name already exists for the user
    existing = await collection.find_one({
        "name": template_name,
        "experiment_id": experiment_id,
        "user_id": ObjectId(current_user["_id"])
    })

    if existing:
        # Update existing
        await collection.update_one(
            {"_id": existing["_id"]},
            {
                "$set": {
                    "mapping_json": mapping_json,
                    "notes": notes,
                    "updated_at": datetime.utcnow().isoformat(),
                    "version": existing.get("version", 1) + 1
                }
            }
        )
        return {"message": "Template updated successfully", "id": str(existing["_id"])}
    else:
        # Create new
        new_template = {
            "name": template_name,
            "experiment_id": experiment_id,
            "user_id": ObjectId(current_user["_id"]),
            "mapping_json": mapping_json,
            "version": 1,
            "is_default": False,
            "created_by": str(current_user["_id"]),
            "last_used_at": datetime.utcnow().isoformat(),
            "times_used": 0,
            "notes": notes,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        result = await collection.insert_one(new_template)
        return {"message": "Template created successfully", "id": str(result.inserted_id)}
