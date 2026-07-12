import os

content = '''"""
User authentication and management routes.
"""

import hashlib
import logging
import os
import secrets
from datetime import datetime, timedelta
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request, Response
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from pydantic import BaseModel, field_validator

from app.auth import create_access_token, create_refresh_token, hash_token, get_current_user
from app.database.mongodb_config import get_activity_log_collection, get_users_collection, get_sessions_collection
from app.email_utils import send_password_reset_email, send_verification_email, send_auth_email

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/users", tags=["users"])


class UserCreate(BaseModel):
    full_name: str
    email: str
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
    remember_me: bool = False


def hash_password(password: str) -> str:
    """Hash password using SHA-256."""
    return hashlib.sha256(password.encode()).hexdigest()


def serialize_user(user: dict) -> dict:
    """Return a copy of the user document safe to send to clients."""
    safe = dict(user)
    safe["_id"] = str(safe["_id"])
    safe.pop("password_hash", None)
    safe.pop("verification_token", None)
    safe.pop("reset_password_token", None)
    safe.pop("reset_token_created_at", None)
    return safe


async def set_auth_cookies(response: Response, user_id: str, remember_me: bool, request: Request):
    """Generate tokens and set them as HTTP-only cookies."""
    access_token_data = create_access_token(user_id)
    refresh_token_data = create_refresh_token(user_id)
    
    # Store refresh token in DB
    sessions_col = get_sessions_collection()
    
    # Get device info
    user_agent = request.headers.get("user-agent", "Unknown")
    ip_address = request.headers.get("x-forwarded-for", request.client.host if request.client else "Unknown")
    
    await sessions_col.insert_one({
        "token_hash": hash_token(refresh_token_data["refresh_token"]),
        "jti": refresh_token_data["jti"],
        "user_id": user_id,
        "expires_at": datetime.fromisoformat(refresh_token_data["expires_at"]),
        "created_at": datetime.utcnow(),
        "last_used_at": datetime.utcnow(),
        "revoked": False,
        "device_name": user_agent,
        "ip_address": ip_address
    })
    
    # Set cookies
    # For local dev without HTTPS, Secure must be False. We'll use True if in production.
    # SameSite=Lax is good for most things.
    secure_cookie = False  # Set True in prod with HTTPS
    
    response.set_cookie(
        key="access_token",
        value=access_token_data["access_token"],
        httponly=True,
        secure=secure_cookie,
        samesite="lax",
        max_age=15 * 60  # 15 minutes
    )
    
    # If remember_me is true, max_age is 30 days. Else, Session cookie (no max_age)
    refresh_max_age = 30 * 24 * 60 * 60 if remember_me else None
    response.set_cookie(
        key="refresh_token",
        value=refresh_token_data["refresh_token"],
        httponly=True,
        secure=secure_cookie,
        samesite="lax",
        max_age=refresh_max_age
    )
    
    return access_token_data


@router.post("/register")
async def register_user(user_data: UserCreate, background_tasks: BackgroundTasks):
    """Register a new user."""
    collection = get_users_collection()
    
    # Check if user already exists
    existing_user = await collection.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="This email is already registered. Please log in instead.")
    
    verification_token = secrets.token_urlsafe(32)
    
    # Create new user
    user = {
        "full_name": user_data.full_name,
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "google_id": None,
        "provider": "local",
        "is_verified": False,
        "verification_token": verification_token,
        "failed_login_attempts": 0,
        "locked_until": None,
        "member_since": datetime.utcnow().isoformat(),
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    result = await collection.insert_one(user)
    user["_id"] = result.inserted_id

    try:
        await send_verification_email(user_data.email, user_data.full_name, verification_token)
        logger.info("Verification email sent to %s", user_data.email)
    except Exception:
        logger.exception("Failed to send verification email to %s", user_data.email)

    return {
        "message": "User registered successfully. Please check your email for verification.",
        "user": serialize_user(user)
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
    
    # Token expiry check (24 hours)
    # Since we added this logic later, we\'ll just assume standard flow, 
    # but ideally we store token_created_at.
    
    await collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"is_verified": True, "verification_token": None, "updated_at": datetime.utcnow().isoformat()}}
    )
    
    # Log event
    activity_collection = get_activity_log_collection()
    await activity_collection.insert_one({
        "title": "Email Verified",
        "desc": f"User {user['email']} verified their email.",
        "color": "bg-green-500",
        "time": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
        "timestamp": datetime.utcnow().isoformat(),
        "user_id": user["_id"]
    })
    
    return {"message": "Email verified successfully"}


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """Generate a password-reset token and email a reset link."""
    collection = get_users_collection()
    email = request.email.strip()
    logger.info("Forgot-password requested for %s", email)

    user = await collection.find_one({"email": email})
    if not user:
        return {"message": "If that email is registered, a reset link has been sent."}

    reset_token = secrets.token_urlsafe(32)
    await collection.update_one(
        {"_id": user["_id"]},
        {"$set": {
            "reset_password_token": reset_token,
            "reset_token_created_at": datetime.utcnow().isoformat(),
        }},
    )

    try:
        await send_password_reset_email(email, reset_token)
    except Exception:
        logger.exception("Failed to send password reset email to %s", email)

    return {"message": "If that email is registered, a reset link has been sent."}


@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """Validate reset token and update the user\'s password."""
    collection = get_users_collection()
    sessions_col = get_sessions_collection()

    user = await collection.find_one({"reset_password_token": request.token})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    # Check token age (expire after 30 minutes)
    created_at_str = user.get("reset_token_created_at")
    if created_at_str:
        created_at = datetime.fromisoformat(created_at_str)
        if (datetime.utcnow() - created_at) > timedelta(minutes=30):
            raise HTTPException(status_code=400, detail="Reset token has expired. Please request a new one.")

    await collection.update_one(
        {"_id": user["_id"]},
        {"$set": {
            "password_hash": hash_password(request.new_password),
            "updated_at": datetime.utcnow().isoformat()
         },
         "$unset": {"reset_password_token": "", "reset_token_created_at": ""}}
    )
    
    # Revoke all active sessions
    await sessions_col.update_many(
        {"user_id": str(user["_id"])},
        {"$set": {"revoked": True}}
    )

    activity_collection = get_activity_log_collection()
    await activity_collection.insert_one({
        "title": "Password Reset",
        "desc": f"User {user['email']} reset their password and sessions were revoked.",
        "color": "bg-yellow-500",
        "time": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
        "timestamp": datetime.utcnow().isoformat(),
        "user_id": user["_id"]
    })

    return {"message": "Password reset successfully. You can now log in."}


@router.post("/login")
async def login_user(login_data: UserLogin, request: Request, response: Response):
    """Login user and set cookies."""
    collection = get_users_collection()
    
    user = await collection.find_one({"email": login_data.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
        
    # Check if locked out
    locked_until = user.get("locked_until")
    if locked_until:
        if isinstance(locked_until, str):
            locked_until = datetime.fromisoformat(locked_until)
        if datetime.utcnow() < locked_until:
            raise HTTPException(status_code=403, detail=f"Account is temporarily locked. Try again later.")
    
    if user.get("password_hash") is None:
        raise HTTPException(status_code=400, detail="This account was created using Google. Continue with Google.")
        
    if user["password_hash"] != hash_password(login_data.password):
        # Increment failed login
        fails = user.get("failed_login_attempts", 0) + 1
        update_data = {"failed_login_attempts": fails}
        
        # Exponential backoff
        if fails >= 15:
            update_data["locked_until"] = datetime.utcnow() + timedelta(hours=1)
        elif fails >= 10:
            update_data["locked_until"] = datetime.utcnow() + timedelta(minutes=30)
        elif fails >= 5:
            update_data["locked_until"] = datetime.utcnow() + timedelta(minutes=15)
            
        await collection.update_one({"_id": user["_id"]}, {"$set": update_data})
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    
    # Check if email is verified
    if not user.get("is_verified", False):
        raise HTTPException(status_code=403, detail="Please verify your email before logging in")
    
    # Successful login, reset fails
    await collection.update_one(
        {"_id": user["_id"]},
        {"$set": {
            "failed_login_attempts": 0, 
            "locked_until": None,
            "last_login": datetime.utcnow().isoformat()
        }}
    )
    
    user_id = str(user["_id"])
    await set_auth_cookies(response, user_id, login_data.remember_me, request)
    
    # Log login activity
    activity_collection = get_activity_log_collection()
    await activity_collection.insert_one({
        "title": "User Login",
        "desc": f"User {user['email']} logged in successfully.",
        "color": "bg-green-500",
        "time": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
        "timestamp": datetime.utcnow().isoformat(),
        "user_id": ObjectId(user_id)
    })
 
    return {"user": serialize_user(user)}


@router.post("/refresh")
async def refresh_token(request: Request, response: Response):
    """Rotate refresh token and issue new access token."""
    old_refresh = request.cookies.get("refresh_token")
    if not old_refresh:
        raise HTTPException(status_code=401, detail="No refresh token provided")
        
    hashed = hash_token(old_refresh)
    sessions_col = get_sessions_collection()
    users_col = get_users_collection()
    
    session = await sessions_col.find_one({"token_hash": hashed})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
        
    if session.get("revoked", False):
        # Token theft detected! Revoke all sessions for this user
        await sessions_col.update_many(
            {"user_id": session["user_id"]},
            {"$set": {"revoked": True}}
        )
        logger.warning(f"Token theft detected for user {session['user_id']}. Revoked all sessions.")
        raise HTTPException(status_code=401, detail="Session expired or invalid")
        
    if session.get("expires_at", datetime.utcnow()) < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Refresh token expired")
        
    # Rotate token
    await sessions_col.update_one(
        {"_id": session["_id"]},
        {"$set": {"revoked": True}}
    )
    
    user_id = session["user_id"]
    # We will assume 'remember_me' behavior was long-lived if old max_age was long.
    # But since we can\'t read old max_age from server, we\'ll just set remember_me=True 
    # to maintain the 30-day window on rotation, or infer it based on expire time.
    remember_me = (session["expires_at"] - session["created_at"]) > timedelta(days=1)
    
    await set_auth_cookies(response, user_id, remember_me, request)
    
    user = await users_col.find_one({"_id": ObjectId(user_id)})
    return {"user": serialize_user(user)}


@router.post("/logout")
async def logout_user(request: Request, response: Response):
    """Log out user and revoke refresh token."""
    refresh_token = request.cookies.get("refresh_token")
    
    if refresh_token:
        sessions_col = get_sessions_collection()
        await sessions_col.update_one(
            {"token_hash": hash_token(refresh_token)},
            {"$set": {"revoked": True}}
        )
        
    # Clear cookies
    response.delete_cookie("access_token", samesite="lax")
    response.delete_cookie("refresh_token", samesite="lax")
    return {"message": "Logged out successfully"}


class GoogleLoginRequest(BaseModel):
    credential: str


@router.post("/google-login")
async def google_login(google_req: GoogleLoginRequest, request: Request, response: Response):
    """Login or register user using Google OAuth."""
    try:
        client_id = os.getenv("GOOGLE_CLIENT_ID")
        if not client_id:
            raise HTTPException(status_code=500, detail="Google Client ID not configured")
            
        idinfo = id_token.verify_oauth2_token(
            google_req.credential, google_requests.Request(), client_id,
            clock_skew_in_seconds=10
        )
 
        email = idinfo.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="No email provided by Google")
 
        if not idinfo.get("email_verified", False):
            raise HTTPException(status_code=403, detail="Google email is not verified")
 
        collection = get_users_collection()
        user = await collection.find_one({"email": email})
        
        google_id = idinfo.get("sub")
        full_name = idinfo.get("name", "")
 
        if user:
            # User exists, link account
            auth_providers = user.get("auth_providers", ["local"])
            update_data = {"last_login": datetime.utcnow().isoformat()}
            if "google" not in auth_providers:
                auth_providers.append("google")
                update_data["auth_providers"] = auth_providers
            if not user.get("google_id"):
                update_data["google_id"] = google_id
                
            await collection.update_one({"_id": user["_id"]}, {"$set": update_data})
        else:
            # Create new user
            new_user = {
                "full_name": full_name,
                "email": email,
                "provider": "google",
                "auth_providers": ["google"],
                "google_id": google_id,
                "password_hash": None,
                "is_verified": True,
                "verification_token": None,
                "member_since": datetime.utcnow().isoformat(),
                "created_at": datetime.utcnow().isoformat(),
                "last_login": datetime.utcnow().isoformat()
            }
            result = await collection.insert_one(new_user)
            user = new_user
            user["_id"] = result.inserted_id
 
        user_id = str(user["_id"])
        await set_auth_cookies(response, user_id, True, request)
 
        # Log login activity
        activity_collection = get_activity_log_collection()
        await activity_collection.insert_one({
            "title": "Google Login",
            "desc": f"User {user['email']} logged in via Google.",
            "color": "bg-blue-500",
            "time": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            "timestamp": datetime.utcnow().isoformat(),
            "user_id": ObjectId(user_id)
        })
 
        return {"user": serialize_user(user)}
    except ValueError as e:
        logger.warning("Google token verification failed: %s", e)
        raise HTTPException(status_code=401, detail="Invalid Google token")


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Return the currently authenticated user\'s profile."""
    return current_user


@router.get("/{user_id}")
async def get_user(user_id: str, current_user: dict = Depends(get_current_user)):
    """Get user by ID. Only the user themself or admin can access another user\'s data."""
    if current_user["_id"] != user_id and current_user.get("role", "user") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
 
    collection = get_users_collection()
    try:
        user = await collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return serialize_user(user)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{user_id}")
async def update_user(user_id: str, user_data: dict, current_user: dict = Depends(get_current_user)):
    """Update user information."""
    if current_user["_id"] != user_id and current_user.get("role", "user") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
 
    collection = get_users_collection()
    try:
        if "password_hash" in user_data:
            del user_data["password_hash"]
        if "password" in user_data:
            del user_data["password"]
 
        if "role" in user_data and current_user.get("role", "user") != "admin":
            del user_data["role"]
 
        update_data = {k: v for k, v in user_data.items() if k != "_id"}
        update_data["updated_at"] = datetime.utcnow().isoformat()
 
        result = await collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
 
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
 
        return {"message": "User updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
'''

with open('c:\\Users\\Khushboo\\OneDrive\\Desktop\\quantam-ai\\backend\\app\\routes\\user_routes.py', 'w') as f:
    f.write(content)
