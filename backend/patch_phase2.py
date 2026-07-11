import re
import os

routes_path = r"c:\Users\Khushboo\OneDrive\Desktop\quantam-ai\backend\app\routes\user_routes.py"
with open(routes_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add `remember_me` to UserLogin
old_user_login = r'''class UserLogin(BaseModel):
    email: str
    password: str'''
new_user_login = r'''class UserLogin(BaseModel):
    email: str
    password: str
    remember_me: bool = False'''
content = content.replace(old_user_login, new_user_login)

# 2. Add hash_token to imports
content = re.sub(
    r"from app\.auth import create_access_token, get_current_user, create_refresh_token",
    r"from app.auth import create_access_token, get_current_user, create_refresh_token, hash_token",
    content
)
content = re.sub(
    r"from app\.database\.mongodb_config import get_activity_log_collection, get_users_collection",
    r"from app.database.mongodb_config import get_activity_log_collection, get_users_collection, get_sessions_collection",
    content
)

# 3. Add UA parsing helper
ua_parser = r'''
def parse_user_agent(ua_string: str) -> dict:
    if not ua_string:
        return {"browser": "Unknown", "os": "Unknown", "device": "Unknown"}
    ua_lower = ua_string.lower()
    browser = "Unknown"
    if "edg/" in ua_lower or "edge" in ua_lower:
        browser = "Edge"
    elif "chrome" in ua_lower or "crios" in ua_lower:
        browser = "Chrome"
    elif "firefox" in ua_lower or "fxios" in ua_lower:
        browser = "Firefox"
    elif "safari" in ua_lower:
        browser = "Safari"
        
    os_name = "Unknown"
    if "windows" in ua_lower:
        os_name = "Windows"
    elif "mac os" in ua_lower or "macos" in ua_lower:
        os_name = "macOS"
    elif "linux" in ua_lower:
        os_name = "Linux"
    elif "android" in ua_lower:
        os_name = "Android"
    elif "iphone" in ua_lower or "ipad" in ua_lower:
        os_name = "iOS"
        
    device = "Desktop"
    if "mobi" in ua_lower or "android" in ua_lower or "iphone" in ua_lower:
        device = "Mobile"
    if "ipad" in ua_lower or "tablet" in ua_lower:
        device = "Tablet"
        
    return {"browser": browser, "os": os_name, "device": device}
'''
content = content.replace("def hash_password(password: str) -> str:", ua_parser + "\ndef hash_password(password: str) -> str:")

# 4. Modify login to store session
old_login_resp = r'''    refresh_info = create_refresh_token(user["_id"])
    
    response.set_cookie('''
new_login_resp = r'''    refresh_info = create_refresh_token(user["_id"])
    
    # Store session
    ua_string = request.headers.get("User-Agent", "")
    device_info = parse_user_agent(ua_string)
    ip_address = request.client.host if request.client else "Unknown"
    
    session_doc = {
        "user_id": str(user["_id"]),
        "token_hash": hash_token(refresh_info["refresh_token"]),
        "jti": refresh_info.get("jti", ""),
        "browser": device_info["browser"],
        "os": device_info["os"],
        "device": device_info["device"],
        "ip_address": ip_address,
        "created_at": datetime.utcnow(),
        "expires_at": datetime.fromisoformat(refresh_info["expires_at"]),
        "revoked": False
    }
    import asyncio
    asyncio.create_task(get_sessions_collection().insert_one(session_doc))
    
    max_age_refresh = 30 * 24 * 60 * 60 if login_data.remember_me else None
    
    response.set_cookie('''
content = content.replace(old_login_resp, new_login_resp)

content = content.replace(r'max_age=30 * 24 * 60 * 60', r'max_age=max_age_refresh')


# 5. Update /logout to revoke token
old_logout = r'''    response.delete_cookie("qm_access")
    response.delete_cookie("qm_refresh")
    try:'''
new_logout = r'''    refresh_token = request.cookies.get("qm_refresh")
    response.delete_cookie("qm_access")
    response.delete_cookie("qm_refresh")
    if refresh_token:
        try:
            # We can't easily await inside a sync try block unless we do it async, wait, logout is async
            import asyncio
            asyncio.create_task(get_sessions_collection().update_one(
                {"token_hash": hash_token(refresh_token)},
                {"$set": {"revoked": True}}
            ))
        except Exception:
            pass
    try:'''
content = content.replace(old_logout, new_logout)

# 6. Update /refresh for rotation
old_refresh = r'''    from app.auth import create_access_token, create_refresh_token
    access_info = create_access_token(user_id)
    new_refresh_info = create_refresh_token(user_id)
    
    response.set_cookie('''
new_refresh = r'''    from app.auth import create_access_token, create_refresh_token, hash_token
    from app.database.mongodb_config import get_sessions_collection
    import asyncio
    
    # Verify session in DB
    hashed_incoming = hash_token(refresh_token)
    session = await get_sessions_collection().find_one({"token_hash": hashed_incoming})
    
    if not session or session.get("revoked", False):
        if session and session.get("revoked", False):
            # Token theft detected! Revoke all sessions for this user.
            await get_sessions_collection().update_many({"user_id": user_id}, {"$set": {"revoked": True}})
        response.delete_cookie("qm_access")
        response.delete_cookie("qm_refresh")
        raise HTTPException(status_code=401, detail="Session invalid or revoked")
        
    access_info = create_access_token(user_id)
    new_refresh_info = create_refresh_token(user_id)
    
    # Revoke old, insert new
    await get_sessions_collection().update_one({"_id": session["_id"]}, {"$set": {"revoked": True}})
    
    ua_string = request.headers.get("User-Agent", "")
    device_info = parse_user_agent(ua_string)
    ip_address = request.client.host if request.client else "Unknown"
    
    new_session_doc = {
        "user_id": user_id,
        "token_hash": hash_token(new_refresh_info["refresh_token"]),
        "jti": new_refresh_info.get("jti", ""),
        "browser": device_info["browser"],
        "os": device_info["os"],
        "device": device_info["device"],
        "ip_address": ip_address,
        "created_at": datetime.utcnow(),
        "expires_at": datetime.fromisoformat(new_refresh_info["expires_at"]),
        "revoked": False
    }
    await get_sessions_collection().insert_one(new_session_doc)
    
    response.set_cookie('''
content = content.replace(old_refresh, new_refresh)

with open(routes_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Phase 2 Patched user_routes.py successfully.")
