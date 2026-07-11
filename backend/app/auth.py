"""JWT-based authentication helpers."""
import os
from app.config import settings
import hashlib
import uuid
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, Request
from jose import JWTError, jwt
from bson import ObjectId

from app.database.mongodb_config import get_users_collection, get_sessions_collection
from user_agents import parse

# Configurable via environment
SECRET_KEY = settings.JWT_SECRET_KEY
ALGORITHM = settings.JWT_ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 30

def create_access_token(subject: str, sid: str = None):
    """Create a JWT access token for the given subject (user id) and session id (sid)."""
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": str(subject), "exp": expire}
    if sid:
        to_encode["sid"] = sid
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": encoded_jwt, "expires_at": expire.isoformat()}

def create_refresh_token(subject: str):
    """Create a refresh token and return the raw token and the jti (JWT ID)."""
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    jti = str(uuid.uuid4())
    to_encode = {"sub": str(subject), "exp": expire, "jti": jti}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return {"refresh_token": encoded_jwt, "jti": jti, "expires_at": expire.isoformat()}

def hash_token(token: str) -> str:
    """Hash a token for database storage."""
    return hashlib.sha256(token.encode()).hexdigest()

def parse_user_agent(request: Request) -> dict:
    """Parse the User-Agent header into browser, os, and device."""
    ua_string = request.headers.get("user-agent", "")
    user_agent = parse(ua_string)
    
    device_name = "Desktop" if user_agent.is_pc else ("Mobile" if user_agent.is_mobile else ("Tablet" if user_agent.is_tablet else "Unknown"))
    if user_agent.device.family and user_agent.device.family != "Other":
        device_name = user_agent.device.family

    return {
        "browser": f"{user_agent.browser.family} {user_agent.browser.version_string}".strip(),
        "os": f"{user_agent.os.family} {user_agent.os.version_string}".strip(),
        "device_name": device_name
    }

async def get_current_user(request: Request):
    """FastAPI dependency that validates the Cookie and returns user dict."""
    token = request.cookies.get("qm_access")
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        sid: str = payload.get("sid")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")
    except JWTError as e:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

    user = await get_users_collection().find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    user["_id"] = str(user["_id"])
    if user.get("active_dataset_id"):
        user["active_dataset_id"] = str(user["active_dataset_id"])
    user.pop("password_hash", None)
    user.pop("verification_token", None)
    user["current_sid"] = sid
    
    # Rate-limited session last_used_at update (every 10 minutes)
    if sid:
        sessions_collection = get_sessions_collection()
        session = await sessions_collection.find_one({"jti": sid})
        if session and not session.get("revoked", False):
            last_used = session.get("last_used_at")
            now = datetime.utcnow()
            # If never used or last used more than 10 minutes ago
            if not last_used or (now - last_used > timedelta(minutes=10)):
                await sessions_collection.update_one(
                    {"_id": session["_id"]},
                    {"$set": {"last_used_at": now}}
                )

    return user
