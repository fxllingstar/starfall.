from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from manager import manager
from database import get_server_members, save_message # Updated import

app = FastAPI()

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    await manager.connect(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            
      
            content = data.get("content", "")
            
            if data["type"] == "dm":
                recipient_id = data["recipient_id"]
                # Save to Postgres
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