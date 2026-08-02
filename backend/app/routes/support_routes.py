from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from datetime import datetime, timezone
import random
from app.database.mongodb_config import get_support_requests_collection
from app.email_utils import send_support_email
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/support",
    tags=["Support"]
)

class SupportRequest(BaseModel):
    full_name: str
    email: EmailStr
    category: str
    message: str

@router.post("/contact")
async def submit_support_contact(request: SupportRequest):
    try:
        # Generate ticket ID LF-2026-XXXX
        ticket_num = random.randint(1000, 9999)
        ticket_id = f"LF-2026-{ticket_num}"
        
        now = datetime.now(timezone.utc)
        
        # Save to DB
        doc = {
            "ticket_id": ticket_id,
            "full_name": request.full_name,
            "email": request.email,
            "category": request.category,
            "message": request.message,
            "status": "Open",
            "created_at": now.isoformat()
        }
        
        collection = get_support_requests_collection()
        await collection.insert_one(doc)
        
        # Format time for email
        formatted_time = now.strftime("%d %b %Y, %I:%M %p UTC")
        
        # Send Email
        await send_support_email(
            ticket_id=ticket_id,
            full_name=request.full_name,
            email=request.email,
            category=request.category,
            message=request.message,
            submitted_at=formatted_time
        )
        
        return {
            "success": True,
            "ticket_id": ticket_id
        }
        
    except Exception as e:
        logger.error(f"Error submitting support request: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to submit support request")
