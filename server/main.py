from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from manager import manager

from database import get_db_connection
import json

app = FastAPI()
@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    await manager.connect(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            
            if data["type"] == "dm":

                await manager.send_personal_message(data, data["recipient_id"])
      
                await manager.send_personal_message(data, user_id)

            elif data["type"] == "server":
          
                member_ids = [1, 2, 3, 4, 5] # Get this from SQL!
                await manager.broadcast_to_server(data, member_ids)

    except WebSocketDisconnect:
        manager.disconnect(user_id)

    except WebSocketDisconnect:
        manager.disconnect(websocket)