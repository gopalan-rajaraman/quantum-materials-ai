import re

path = r"c:\Users\Khushboo\OneDrive\Desktop\quantam-ai\backend\app\routes\user_routes.py"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add Response to fastapi imports
content = re.sub(
    r"from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request",
    r"from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request, Response",
    content
)

# 2. Add create_refresh_token to app.auth imports
content = re.sub(
    r"from app\.auth import create_access_token, get_current_user",
    r"from app.auth import create_access_token, get_current_user, create_refresh_token",
    content
)

# 3. Update /verify-email invalid token message
content = re.sub(
    r'raise HTTPException\(status_code=400, detail="Invalid or expired verification token"\)',
    r'raise HTTPException(status_code=400, detail="Invalid token. It may have expired or your email is already verified.")',
    content
)

# 4. Update /verify-email already verified response
content = re.sub(
    r'raise HTTPException\(status_code=400, detail="Email already verified"\)',
    r'return {"message": "Email already verified"}',
    content
)

# 5. Update /reset-password unset block
old_unset = r'"\$unset": \{"reset_password_token": "", "reset_token_created_at": ""\}'
new_unset = r'"$unset": {"reset_password_token": "", "reset_token_created_at": "", "verification_token": ""}, "$set": {"password_hash": hash_password(request.new_password), "is_verified": True}'
content = re.sub(
    r'"\$set": \{"password_hash": hash_password\(request\.new_password\)\},\s*"\$unset": \{"reset_password_token": "", "reset_token_created_at": ""\}',
    new_unset,
    content
)

# 6. Update /login signature and logic
old_login_def = r'@router\.post\("/login"\)\nasync def login_user\(login_data: UserLogin, request: Request, background_tasks: BackgroundTasks\):'
new_login_def = r'@router.post("/login")\nasync def login_user(login_data: UserLogin, request: Request, response: Response, background_tasks: BackgroundTasks):'
content = content.replace(old_login_def, new_login_def)

old_login_resp = r'response = build_auth_response\(user\)'
new_login_resp = r'''res = build_auth_response(user)
    
    refresh_info = create_refresh_token(user["_id"])
    
    response.set_cookie(
        key="qm_access",
        value=res["access_token"],
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=15 * 60
    )
    response.set_cookie(
        key="qm_refresh",
        value=refresh_info["refresh_token"],
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=30 * 24 * 60 * 60
    )
    
    # Do not mutate the response dict variable name unexpectedly for the rest of the function
    auth_response_data = res'''
content = content.replace(old_login_resp, new_login_resp)

# We also need to fix the activity_collection insert which uses `response["user_id"]`
content = content.replace(r'ObjectId(response["user_id"])', r'ObjectId(auth_response_data["user_id"])')
content = content.replace(r'return response', r'return auth_response_data')

# 7. Update /logout signature and logic
old_logout = r'''@router.post("/logout")
async def logout_user(request: Request, current_user: dict = Depends(get_current_user)):
    """Log out user (records the event)."""
    try:'''
new_logout = r'''@router.post("/logout")
async def logout_user(request: Request, response: Response, current_user: dict = Depends(get_current_user)):
    """Log out user (records the event)."""
    response.delete_cookie("qm_access")
    response.delete_cookie("qm_refresh")
    try:'''
content = content.replace(old_logout, new_logout)

# 8. Add /refresh endpoint at the end of the file
refresh_endpoint = r'''
@router.post("/refresh")
async def refresh_token(request: Request, response: Response):
    """Silent refresh endpoint."""
    refresh_token = request.cookies.get("qm_refresh")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="No refresh token")
        
    from jose import jwt, JWTError
    from app.auth import SECRET_KEY, ALGORITHM
    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
        
    from app.auth import create_access_token, create_refresh_token
    access_info = create_access_token(user_id)
    new_refresh_info = create_refresh_token(user_id)
    
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
        value=new_refresh_info["refresh_token"],
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=30 * 24 * 60 * 60
    )
    
    return {"authenticated": True}
'''
if "/refresh" not in content:
    content += refresh_endpoint

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Patched user_routes.py successfully.")
