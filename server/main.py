from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Request
from manager import manager
from security import verify_password, create_access_token, decode_token
from database import get_user_by_username, get_server_members, save_message, get_user_by_id, is_user_in_server, are_users_connected
from slowapi import Limiter
from slowapi.util import get_remote_address

app = FastAPI()

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):

    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4008)
        return
    
    payload = decode_token(token)
    if not payload or payload.get("user_id") != user_id:
        await websocket.close(code=4008)
        return
 
 
 
 
    await manager.connect(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
           
            if data["type"] == "server":
                server_id = data.get("server_id")
                if not is_user_in_server(user_id, server_id):
                  
                    continue



      
            content = data.get("content", "")
            
            if data["type"] == "dm":
                recipient_id = data.get("recipient_id")
                recipient = get_user_by_id(recipient_id)
                if not recipient:
                         continue 
                if not are_users_connected(user_id, recipient_id):
                     continue
                


                save_message(sender_id=user_id, content=content, msg_type="dm", recipient_id=recipient_id)
                
                await manager.send_personal_message(data, recipient_id)
                await manager.send_personal_message(data, user_id)

            elif data["type"] == "server":
                server_id = data.get("server_id", 1) 
               
                save_message(sender_id=user_id, content=content, msg_type="server", server_id=server_id)
                member_ids = get_server_members(server_id)
                await manager.broadcast_to_server(data, member_ids)

    except WebSocketDisconnect:
        manager.disconnect(user_id)


@app.post("/login")

@limiter.limit("5/minute") 
async def login(request: Request, data: dict):
    user = get_user_by_username(data.get("username"))
    if not user or not verify_password(data.get("password"), user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token(data={"user_id": user["id"]})
    return {"token": token, "user_id": user["id"]}