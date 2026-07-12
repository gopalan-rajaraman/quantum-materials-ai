"""
User authentication and management routes.
"""
 
import hashlib
import logging
import os
from app.config import settings
import secrets
from datetime import datetime, timedelta
from typing import Optional
 
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request, Response
from google.auth.transport import requests
from google.oauth2 import id_token
from pydantic import BaseModel, field_validator
 
from app.auth import parse_user_agent, hash_token, create_access_token, get_current_user, create_refresh_token
from app.database.mongodb_config import get_sessions_collection, get_activity_log_collection, get_users_collection, get_datasets_collection
from app.email_utils import send_password_reset_email, send_verification_email, send_auth_email
 
logger = logging.getLogger(__name__)
 
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
    remember_me: bool = False
 
 
def hash_password(password: str) -> str:
    """Hash password using SHA-256."""
    return hashlib.sha256(password.encode()).hexdigest()
 
 
def serialize_user(user: dict) -> dict:
    """Return a copy of the user document safe to send to clients."""
    safe = dict(user)
    safe["_id"] = str(safe["_id"])
    if safe.get("active_dataset_id"):
        safe["active_dataset_id"] = str(safe["active_dataset_id"])
    safe.pop("password_hash", None)
    safe.pop("verification_token", None)
    safe.pop("reset_password_token", None)
    safe.pop("reset_token_created_at", None)
    return safe
 
 
async def handle_successful_login(user: dict, response: Response, request: Request, provider: str, remember_me: bool = False) -> dict:
    safe_user = serialize_user(user)
    user_id_str = safe_user["_id"]
    
    # Generate tokens
    refresh_info = create_refresh_token(user_id_str)
    jti = refresh_info["jti"]
    refresh_token = refresh_info["refresh_token"]
    
    access_info = create_access_token(user_id_str, sid=jti)
    access_token = access_info["access_token"]
    
    # Parse metadata
    ua_data = parse_user_agent(request)
    ip_address = request.headers.get("X-Forwarded-For", request.client.host if request.client else "Unknown").split(",")[0].strip()
    
    now = datetime.utcnow()
    expires_at = now + timedelta(days=30 if remember_me else 1)
    
    session_doc = {
        "user_id": ObjectId(user_id_str),
        "jti": jti,
        "token_hash": hash_token(refresh_token),
        "provider": provider,
        "device_name": ua_data.get("device_name"),
        "browser": ua_data.get("browser"),
        "os": ua_data.get("os"),
        "ip_address": ip_address,
        "created_at": now,
        "last_used_at": now,
        "expires_at": expires_at,
        "remember_me": remember_me,
        "revoked": False
    }
    
    sessions_collection = get_sessions_collection()
    
    # Enforce session cap of 10
    active_sessions = await sessions_collection.find({"user_id": ObjectId(user_id_str), "revoked": False}).sort("last_used_at", 1).to_list(length=100)
    if len(active_sessions) >= 10:
        # Revoke the oldest session
        oldest = active_sessions[0]
        await sessions_collection.update_one({"_id": oldest["_id"]}, {"$set": {"revoked": True}})
        
    await sessions_collection.insert_one(session_doc)
    
    # Set cookies
    max_age = 30 * 24 * 60 * 60 if remember_me else 24 * 60 * 60
    response.set_cookie(
        key="qm_access",
        value=access_token,
        httponly=True,
        secure=False,  # Set to True in production
        samesite="lax",
        max_age=15 * 60
    )
    response.set_cookie(
        key="qm_refresh",
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=max_age
    )
    
    # Log login activity
    activity_collection = get_activity_log_collection()
    await activity_collection.insert_one({
        "title": f"{provider.capitalize()} Login",
        "desc": f"User {user['email']} logged in successfully.",
        "color": "bg-green-500",
        "time": now.strftime("%Y-%m-%d %H:%M:%S"),
        "timestamp": now.isoformat(),
        "user_id": ObjectId(user_id_str)
    })
    
    return {
        "user_id": user_id_str,
        "user": safe_user,
    }
 
 
@router.post("/register")
async def register_user(user_data: UserCreate, request: Request, response: Response, background_tasks: BackgroundTasks):
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
    user["_id"] = result.inserted_id
 
    try:
        await send_verification_email(user_data.email, user_data.full_name, verification_token)
        logger.info("Verification email sent to %s", user_data.email)
    except Exception:
        logger.exception("Failed to send verification email to %s", user_data.email)
        email_sent = False
        
    background_tasks.add_task(
        send_auth_email,
        event="signup",
        to_email=user_data.email,
        user=user
    )

    auth_data = await handle_successful_login(user, response, request, provider="local", remember_me=False)
    
    if email_sent:
        message = "User registered successfully. Please check your email for verification."
    else:
        message = "Account created. We couldn't send the verification email. Please request a new verification email from your profile."
        
    return {
        "message": message,
        **auth_data,
    }
 
 
class VerifyEmailRequest(BaseModel):
    token: str
 
 
@router.post("/verify-email")
async def verify_email(request: VerifyEmailRequest):
    """Verify user email with token."""
    collection = get_users_collection()
    
    user = await collection.find_one({"verification_token": request.token})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid token. It may have expired or your email is already verified.")
    
    if user.get("is_verified", False):
        return {"message": "Email already verified"}
    
    await collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"is_verified": True, "verification_token": None}}
    )
    
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
        logger.info("Forgot-password: no account for %s (returning generic success)", email)
        return {"message": "If that email is registered, a reset link has been sent."}
 
    reset_token = secrets.token_urlsafe(32)
    await collection.update_one(
        {"_id": user["_id"]},
        {"$set": {
            "reset_password_token": reset_token,
            "reset_token_created_at": datetime.utcnow().isoformat(),
        }},
    )
    logger.info("Reset token stored for user_id=%s email=%s", user["_id"], email)
 
    try:
        await send_password_reset_email(email, reset_token)
        logger.info("Password reset email sent to %s", email)
    except Exception:
        logger.exception("Failed to send password reset email to %s", email)
 
    return {"message": "If that email is registered, a reset link has been sent."}
 
 
@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """Validate reset token and update the user's password."""
    collection = get_users_collection()
    logger.info("Reset-password attempt with token prefix=%s...", request.token[:8])
 
    user = await collection.find_one({"reset_password_token": request.token})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
 
    # Check token age (expire after 1 hour)
    created_at_str = user.get("reset_token_created_at")
    if created_at_str:
        created_at = datetime.fromisoformat(created_at_str)
        if (datetime.utcnow() - created_at) > timedelta(hours=1):
            raise HTTPException(status_code=400, detail="Reset token has expired. Please request a new one.")
 
    if len(request.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
 
    await collection.update_one(
        {"_id": user["_id"]},
        {"$unset": {"reset_password_token": "", "reset_token_created_at": "", "verification_token": ""}, "$set": {"password_hash": hash_password(request.new_password), "is_verified": True}}
    )
    
    # Revoke all sessions for this user
    sessions_collection = get_sessions_collection()
    await sessions_collection.update_many(
        {"user_id": user["_id"]},
        {"$set": {"revoked": True}}
    )
 
    logger.info("Password reset successful for user_id=%s, sessions revoked.", user["_id"])
    return {"message": "Password reset successfully. You can now log in with your new password."}
 
 
@router.post("/login")
async def login_user(login_data: UserLogin, request: Request, response: Response, background_tasks: BackgroundTasks):
    """Login user and return user data."""
    collection = get_users_collection()
    
    user = await collection.find_one({"email": login_data.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if user["password_hash"] != hash_password(login_data.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    ip_address = request.headers.get("X-Forwarded-For", request.client.host if request.client else "Unknown").split(",")[0].strip()
    user_agent_str = request.headers.get("User-Agent", "Unknown")
    
    background_tasks.add_task(
        send_auth_email,
        event="login",
        to_email=user["email"],
        user=user,
        ip_address=ip_address,
        user_agent=user_agent_str
    )
    
    return await handle_successful_login(user, response, request, provider="local", remember_me=login_data.remember_me)
 
 
class GoogleLoginRequest(BaseModel):
    credential: str
    remember_me: bool = False
    is_signup: bool = False
 
 
@router.post("/google-login")
async def google_login(google_req: GoogleLoginRequest, request: Request, response: Response, background_tasks: BackgroundTasks):
    """Login or register user using Google OAuth."""
    try:
        # Verify the Google token
        client_id = settings.GOOGLE_CLIENT_ID
        if not client_id:
            raise HTTPException(status_code=500, detail="Google Client ID not configured")
            
        idinfo = id_token.verify_oauth2_token(
            google_req.credential, requests.Request(), client_id,
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
            if google_req.is_signup:
                raise HTTPException(status_code=400, detail="This email is already registered. Please log in instead.")
            # User exists, link account if not already linked
            auth_providers = user.get("auth_providers", ["local"])
            update_data = {}
            if "google" not in auth_providers:
                auth_providers.append("google")
                update_data["auth_providers"] = auth_providers
            if not user.get("google_id"):
                update_data["google_id"] = google_id
                
            if update_data:
                await collection.update_one({"_id": user["_id"]}, {"$set": update_data})
            
            event_type = "login"
        else:
            # Create new user
            new_user = {
                "full_name": full_name,
                "email": email,
                "department": "",
                "institute": "",
                "role": "user",
                "auth_providers": ["google"],
                "google_id": google_id,
                "password_hash": None,
                "is_verified": True,
                "verification_token": None,
                "member_since": datetime.utcnow().isoformat(),
                "created_at": datetime.utcnow().isoformat()
            }
            result = await collection.insert_one(new_user)
            user = new_user
            user["_id"] = result.inserted_id
            
            event_type = "signup"
            
        ip_address = request.headers.get("X-Forwarded-For", request.client.host if request.client else "Unknown").split(",")[0].strip()
        user_agent_str = request.headers.get("User-Agent", "Unknown")
        background_tasks.add_task(
            send_auth_email,
            event=event_type,
            to_email=email,
            user=user,
            ip_address=ip_address,
            user_agent=user_agent_str
        )
 
        return await handle_successful_login(user, response, request, provider="google", remember_me=google_req.remember_me)
    except ValueError as e:
        logger.warning("Google token verification failed: %s", e)
        raise HTTPException(status_code=401, detail="Invalid Google token")
 
 
@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return current_user
 
 
@router.post("/logout")
async def logout_user(request: Request, response: Response, current_user: dict = Depends(get_current_user)):
    """Log out user (records the event)."""
    sid = current_user.get("current_sid")
    if sid:
        sessions_collection = get_sessions_collection()
        await sessions_collection.update_one({"jti": sid}, {"$set": {"revoked": True}})
        
    response.delete_cookie("qm_access")
    response.delete_cookie("qm_refresh")
    try:
        activity_collection = get_activity_log_collection()
        if activity_collection is not None:
            ip_address = request.headers.get("X-Forwarded-For", request.client.host if request.client else "Unknown")
            log_entry = {
                "user_id": ObjectId(current_user["_id"]),
                "action": "logout",
                "title": "User Logout",
                "details": f"Logged out from {ip_address}",
                "ip_address": ip_address,
                "timestamp": datetime.utcnow()
            }
            await activity_collection.insert_one(log_entry)
    except Exception as e:
        logger.error(f"Error logging logout: {e}")
        
    return {"message": "Logged out successfully"}

@router.post("/refresh")
async def refresh_token(request: Request, response: Response):
    """Silent refresh endpoint with token rotation."""
    refresh_token = request.cookies.get("qm_refresh")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="No refresh token")
        
    from jose import jwt, JWTError
    from app.auth import SECRET_KEY, ALGORITHM, hash_token, create_access_token, create_refresh_token
    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        old_jti = payload.get("jti")
        if not user_id or not old_jti:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
        
    sessions_collection = get_sessions_collection()
    session = await sessions_collection.find_one({"jti": old_jti, "user_id": ObjectId(user_id)})
    
    if not session:
        raise HTTPException(status_code=401, detail="Session not found")
        
    if session.get("revoked", False):
        logger.warning(f"Attempted reuse of revoked refresh token for user {user_id}, jti: {old_jti}")
        raise HTTPException(status_code=401, detail="Session has been revoked")
        
    if session.get("token_hash") != hash_token(refresh_token):
        raise HTTPException(status_code=401, detail="Token mismatch")
        
    # Rotate token: revoke old session
    await sessions_collection.update_one({"_id": session["_id"]}, {"$set": {"revoked": True}})
    
    # Create new tokens
    access_info = create_access_token(user_id, sid=old_jti) # Keep same SID conceptually or new one? Wait, new refresh token will have new JTI.
    
    new_refresh_info = create_refresh_token(user_id)
    new_jti = new_refresh_info["jti"]
    new_refresh_token = new_refresh_info["refresh_token"]
    
    # Make new access token with new SID
    access_info = create_access_token(user_id, sid=new_jti)
    
    now = datetime.utcnow()
    # Create new session doc keeping some metadata from old
    new_session_doc = {
        "user_id": ObjectId(user_id),
        "jti": new_jti,
        "token_hash": hash_token(new_refresh_token),
        "provider": session.get("provider", "unknown"),
        "device_name": session.get("device_name"),
        "browser": session.get("browser"),
        "os": session.get("os"),
        "ip_address": session.get("ip_address"),
        "created_at": session.get("created_at", now),
        "last_used_at": now,
        "expires_at": session.get("expires_at", now + timedelta(days=30)),
        "remember_me": session.get("remember_me", False),
        "revoked": False
    }
    
    await sessions_collection.insert_one(new_session_doc)
    
    max_age = 30 * 24 * 60 * 60 if new_session_doc["remember_me"] else 24 * 60 * 60
    response.set_cookie(
        key="qm_access",
        value=access_info["access_token"],
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=15 * 60
    )
    response.set_cookie(
        key="qm_refresh",
        value=new_refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=max_age
    )
    
    return {"authenticated": True}

@router.get("/sessions")
async def get_sessions(current_user: dict = Depends(get_current_user)):
    """Get all active sessions for the user."""
    sessions_collection = get_sessions_collection()
    user_id = current_user["_id"]
    current_sid = current_user.get("current_sid")
    
    sessions = await sessions_collection.find({
        "user_id": ObjectId(user_id),
        "revoked": False
    }).sort("last_used_at", -1).to_list(length=100)
    
    result = []
    for s in sessions:
        result.append({
            "jti": s["jti"],
            "device_name": s.get("device_name"),
            "browser": s.get("browser"),
            "os": s.get("os"),
            "ip_address": s.get("ip_address"),
            "created_at": s.get("created_at").isoformat() if s.get("created_at") else None,
            "last_used_at": s.get("last_used_at").isoformat() if s.get("last_used_at") else None,
            "expires_at": s.get("expires_at").isoformat() if s.get("expires_at") else None,
            "remember_me": s.get("remember_me", False),
            "is_current": s["jti"] == current_sid
        })
    return result

@router.delete("/sessions/{jti}")
async def revoke_session(jti: str, current_user: dict = Depends(get_current_user)):
    """Revoke a specific session."""
    sessions_collection = get_sessions_collection()
    user_id = current_user["_id"]
    
    result = await sessions_collection.update_one(
        {"jti": jti, "user_id": ObjectId(user_id)},
        {"$set": {"revoked": True}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
        
    return {"message": "Session revoked"}

@router.get("/active-dataset")
async def get_active_dataset(current_user: dict = Depends(get_current_user)):
    """Get the currently active dataset details for the user."""
    active_dataset_id = current_user.get("active_dataset_id")
    if not active_dataset_id:
        return {"active_dataset": None}

    datasets_collection = get_datasets_collection()
    try:
        dataset = await datasets_collection.find_one({"_id": ObjectId(active_dataset_id)})
        if not dataset:
            return {"active_dataset": None}

        return {
            "active_dataset": {
                "dataset_id": str(dataset["_id"]),
                "dataset_name": dataset.get("name", "Unnamed"),
                "rows": dataset.get("row_count", 0),
                "historical": dataset.get("statistics", {}).get("historical_count", dataset.get("row_count", 0)),
                "bo": dataset.get("statistics", {}).get("completed_bo_iterations", 0),
                "last_updated": dataset.get("updated_at"),
                "status": dataset.get("status", "ready")
            }
        }
    except Exception as e:
        logger.error(f"Error fetching active dataset: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


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
 


