from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Request, Response, Cookie
from pydantic import BaseModel, EmailStr, Field
from manager import manager
from security import (
    verify_password, create_token, decode_token, hash_password, 
    ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS
)
from database import (
    get_user_by_email, create_user, get_user_by_id, 
    get_server_members, save_message, is_user_in_server, are_users_connected
)
from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi.middleware.cors import CORSMiddleware
from datetime import timedelta

app = FastAPI()
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

# AUDIT FIX: Restrict CORS (Update this to your actual frontend URL)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5500", "http://127.0.0.1:5500"], 
    allow_credentials=True, # Required for cookies
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# --- Request Models ---
class UserSignup(BaseModel):
    username: str = Field(..., min_length=3, max_length=25)
    email: EmailStr
    password: str = Field(..., min_length=8)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# --- Auth Endpoints ---

@app.post("/signup")
@limiter.limit("3/minute")
async def signup(request: Request, data: UserSignup, response: Response):
    if get_user_by_email(data.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed = hash_password(data.password)
    user_id = create_user(data.username, data.email, hashed)
    
    access_token = create_token({"user_id": user_id}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    
    # AUDIT FIX: Use HttpOnly Cookie
    response.set_cookie(
        key="access_token", 
        value=access_token, 
        httponly=True, 
        secure=False, # Set to True in production (HTTPS)
        samesite="lax"
    )
    return {"user_id": user_id, "status": "success"}

@app.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, data: UserLogin, response: Response):
    user = get_user_by_email(data.email)
    if not user or not verify_password(data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_token({"user_id": user["id"]}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    
    response.set_cookie(
        key="access_token", 
        value=access_token, 
        httponly=True, 
        secure=False, 
        samesite="lax"
    )
    return {"user_id": user["id"], "status": "success"}

# --- WebSocket ---

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    # AUDIT FIX: Get token from Cookie instead of URL Query Param
    token = websocket.cookies.get("access_token")
    
    if not token:
        await websocket.close(code=4008)
        return
    
    payload = decode_token(token)
    if not payload or payload.get("user_id") != user_id:
        await websocket.close(code=4008)
        return

    await manager.connect(user_id, websocket)
    try:
        # Fetch sender info once for efficiency
        sender = get_user_by_id(user_id)
        sender_name = sender['username']

        while True:
            data = await websocket.receive_json()
            content = data.get("content", "").strip()
            if not content: continue

            # AUDIT FIX: Enrich data with sender_name for frontend display
            data["sender_name"] = sender_name

            if data["type"] == "dm":
                recipient_id = data.get("recipient_id")
                if not are_users_connected(user_id, recipient_id): continue
                
                save_message(user_id, content, "dm", recipient_id=recipient_id)
                await manager.send_personal_message(data, recipient_id)
                await manager.send_personal_message(data, user_id)

            elif data["type"] == "server":
                server_id = data.get("server_id", 1)
                if not is_user_in_server(user_id, server_id): continue

                save_message(user_id, content, "server", server_id=server_id)
                member_ids = get_server_members(server_id)
                await manager.broadcast_to_server(data, member_ids)

    except WebSocketDisconnect:
        manager.disconnect(user_id)