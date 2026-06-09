"""
User authentication and management routes.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
from bson import ObjectId
import hashlib

from app.database.mongodb_config import get_users_collection, get_activity_log_collection
from app.auth import create_access_token, get_current_user
from app.database.mongodb_models import UserModel

router = APIRouter(prefix="/api/users", tags=["users"])


class UserCreate(BaseModel):
    full_name: str
    email: str
    department: str = ""
    institute: str = ""
    role: str = ""
    password: str
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        if '@' not in v:
            raise ValueError('Invalid email format')
        return v


class UserLogin(BaseModel):
    email: str
    password: str


def hash_password(password: str) -> str:
    """Hash password using SHA-256."""
    return hashlib.sha256(password.encode()).hexdigest()


@router.post("/register")
async def register_user(user_data: UserCreate):
    """Register a new user."""
    collection = get_users_collection()
    
    # Check if user already exists
    existing_user = await collection.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Generate verification token
    import secrets
    verification_token = secrets.token_urlsafe(32)
    
    # Create new user
    user = {
        "full_name": user_data.full_name,
        "email": user_data.email,
        "department": user_data.department,
        "institute": user_data.institute,
        "role": user_data.role or "user",
        "password_hash": hash_password(user_data.password),
        "is_verified": True,
        "verification_token": verification_token,
        "member_since": datetime.utcnow().isoformat(),
        "created_at": datetime.utcnow().isoformat()
    }
    
    result = await collection.insert_one(user)
    user["_id"] = str(result.inserted_id)
    user.pop("password_hash", None)
    user.pop("verification_token", None)
    
    # TODO: Send verification email here
    # For now, we'll log the verification link
    verification_link = f"http://localhost:5173/verify-email?token={verification_token}"
    print(f"Verification link for {user_data.email}: {verification_link}")
    
    return {
        "message": "User registered successfully. Please check your email for verification.",
        "user": user
    }


class VerifyEmailRequest(BaseModel):
    token: str


@router.post("/verify-email")
async def verify_email(request: VerifyEmailRequest):
    """Verify user email with token."""
    collection = get_users_collection()
    
    user = await collection.find_one({"verification_token": request.token})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")
    
    if user.get("is_verified", False):
        raise HTTPException(status_code=400, detail="Email already verified")
    
    await collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"is_verified": True, "verification_token": None}}
    )
    
    return {"message": "Email verified successfully"}


@router.post("/login")
async def login_user(login_data: UserLogin):
    """Login user and return user data."""
    collection = get_users_collection()
    
    user = await collection.find_one({"email": login_data.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if user["password_hash"] != hash_password(login_data.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check if email is verified
    # if not user.get("is_verified", False):
    #     raise HTTPException(status_code=403, detail="Please verify your email before logging in")
    
    # Create a JWT access token for the user
    token_info = create_access_token(str(user["_id"]))

    # Prepare user object to return (don't expose password hash)
    user["_id"] = str(user["_id"])
    user.pop("password_hash", None)
    user.pop("verification_token", None)

    # Log login activity
    activity_collection = get_activity_log_collection()
    await activity_collection.insert_one({
        "title": "User Login",
        "desc": f"User {user['email']} logged in successfully.",
        "color": "bg-green-500",
        "time": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
        "timestamp": datetime.utcnow().isoformat(),
        "user_id": ObjectId(user["_id"])
    })

    return {
        "access_token": token_info["access_token"],
        "token_type": "bearer",
        "expires_at": token_info["expires_at"],
        "user_id": user["_id"]
    }


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return current_user


@router.get("/{user_id}")
async def get_user(user_id: str, current_user: dict = Depends(get_current_user)):
    """Get user by ID. Only the user themself or admin can access another user's data."""
    # Only allow access to own profile unless admin
    if current_user["_id"] != user_id and current_user.get("role", "user") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    collection = get_users_collection()
    try:
        user = await collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        user.pop("verification_token", None)
        
        return user
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{user_id}")
async def update_user(user_id: str, user_data: dict, current_user: dict = Depends(get_current_user)):
    """Update user information. Only the user themself or admin can update."""
    # Only allow updating own profile unless admin
    if current_user["_id"] != user_id and current_user.get("role", "user") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    collection = get_users_collection()
    try:
        # Don't allow updating password through this endpoint
        if "password_hash" in user_data:
            del user_data["password_hash"]
        if "password" in user_data:
            del user_data["password"]

        # Only admin can change role
        if "role" in user_data and current_user.get("role", "user") != "admin":
            del user_data["role"]

        update_data = {k: v for k, v in user_data.items() if k != "_id"}

        result = await collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")

        return {"message": "User updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
