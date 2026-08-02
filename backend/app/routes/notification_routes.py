from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any, Optional
from datetime import datetime
from bson import ObjectId
from app.database.mongodb_config import get_notifications_collection
from app.routes.user_routes import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

def format_notification(notif: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(notif["_id"]),
        "user_id": str(notif["user_id"]),
        "type": notif.get("type", "system"),
        "title": notif.get("title", ""),
        "message": notif.get("message", ""),
        "icon": notif.get("icon", "bell"),
        "is_read": notif.get("is_read", False),
        "created_at": notif.get("created_at").isoformat() if notif.get("created_at") else None
    }

@router.get("")
async def get_notifications(current_user: Dict = Depends(get_current_user)):
    """Get all notifications for the current user, ordered by most recent."""
    notif_collection = get_notifications_collection()
    user_id = str(current_user["_id"])
    
    cursor = notif_collection.find({"user_id": user_id}).sort("created_at", -1).limit(50)
    notifications = await cursor.to_list(length=50)
    
    return [format_notification(n) for n in notifications]

@router.put("/read")
async def mark_all_read(current_user: Dict = Depends(get_current_user)):
    """Mark all notifications as read for the current user."""
    notif_collection = get_notifications_collection()
    user_id = str(current_user["_id"])
    
    result = await notif_collection.update_many(
        {"user_id": user_id, "is_read": False},
        {"$set": {"is_read": True}}
    )
    
    return {"message": "Notifications marked as read", "modified_count": result.modified_count}

@router.put("/{notif_id}/read")
async def mark_single_read(notif_id: str, current_user: Dict = Depends(get_current_user)):
    """Mark a single notification as read."""
    notif_collection = get_notifications_collection()
    user_id = str(current_user["_id"])
    
    try:
        obj_id = ObjectId(notif_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid notification ID")
        
    result = await notif_collection.update_one(
        {"_id": obj_id, "user_id": user_id},
        {"$set": {"is_read": True}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    return {"message": "Notification marked as read"}

@router.delete("/{notif_id}")
async def delete_notification(notif_id: str, current_user: Dict = Depends(get_current_user)):
    """Delete a single notification."""
    notif_collection = get_notifications_collection()
    user_id = str(current_user["_id"])
    
    try:
        obj_id = ObjectId(notif_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid notification ID")
        
    result = await notif_collection.delete_one({"_id": obj_id, "user_id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    return {"message": "Notification deleted"}
