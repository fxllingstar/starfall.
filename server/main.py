# starfall.
# Copyright (C) 2026 fxllingstar on GitHub
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as
# published by the Free Software Foundation, either version 3 of the
# License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
# See the GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program. If not, see <https://www.gnu.org/licenses/>.



import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Request, Response
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
from migrations import ensure_pending_messages_table
from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi.middleware.cors import CORSMiddleware
from datetime import timedelta

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(_app: FastAPI):
    ensure_pending_messages_table()
    logger.info("Starfall initialized with pending message support")
    yield

app = FastAPI(lifespan=lifespan)
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

# CORS: credentials require explicit origins (wildcard + credentials is blocked by browsers)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500", "http://localhost:5500"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event() -> None:
    """Initialize database schema on startup."""
    ensure_pending_messages_table()
    logger.info("Starfall initialized with pending message support")

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
async def signup(request: Request, data: UserSignup, response: Response) -> dict:
    """Register a new user account.

    Args:
        request: HTTP request object
        data: Signup credentials
        response: HTTP response object

    Returns:
        Dict with user_id and success status
    """
    if get_user_by_email(data.email):
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed = hash_password(data.password)
    user_id = create_user(data.username, data.email, hashed)

    access_token = create_token({"user_id": user_id}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax"
    )
    return {"user_id": user_id, "status": "success"}

@app.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, data: UserLogin, response: Response) -> dict:
    """Authenticate user and create session token.

    Args:
        request: HTTP request object
        data: Login credentials
        response: HTTP response object

    Returns:
        Dict with user_id and success status
    """
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
async def websocket_endpoint(websocket: WebSocket, user_id: int) -> None:
    """Handle real-time messaging via WebSocket.

    Args:
        websocket: WebSocket connection
        user_id: ID of the connecting user

    Validates JWT token from cookies before accepting connection.
    Syncs pending messages and handles DM/server messaging.
    """
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
        sender = get_user_by_id(user_id)
        if not sender:
            await websocket.close(code=4008)
            return

        sender_name = sender['username']

        while True:
            data = await websocket.receive_json()
            content = data.get("content", "").strip()
            if not content:
                continue

            data["sender_name"] = sender_name
            data["sender_id"] = user_id

            if data["type"] == "dm":
                recipient_id = data.get("recipient_id")
                if not are_users_connected(user_id, recipient_id):
                    logger.warning(f"Unauthorized DM attempt: {user_id} -> {recipient_id}")
                    continue

                save_message(user_id, content, "dm", recipient_id=recipient_id)
                await manager.send_personal_message(data, recipient_id)
                await manager.send_personal_message(data, user_id)

            elif data["type"] == "server":
                server_id = data.get("server_id", 1)
                if not is_user_in_server(user_id, server_id):
                    logger.warning(f"Unauthorized server message: {user_id} -> server {server_id}")
                    continue

                save_message(user_id, content, "server", server_id=server_id)
                member_ids = get_server_members(server_id)
                await manager.broadcast_to_server(data, member_ids)

    except WebSocketDisconnect:
        manager.disconnect(user_id)
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}")
        manager.disconnect(user_id)