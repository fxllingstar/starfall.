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
from fastapi import WebSocket
from typing import Dict
from database import (
    get_pending_messages, mark_message_delivered, get_user_by_id,
    queue_pending_message
)

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: Dict[int, WebSocket] = {}

    async def connect(self, user_id: int, websocket: WebSocket) -> None:
        """Accept WebSocket connection and sync pending messages.

        Args:
            user_id: ID of the connecting user
            websocket: WebSocket connection
        """
        await websocket.accept()
        self.active_connections[user_id] = websocket

        try:
            await self._sync_pending_messages(user_id)
        except Exception as e:
            logger.error(f"Error syncing pending messages for user {user_id}: {e}")

    def disconnect(self, user_id: int) -> None:
        """Remove user from active connections.

        Args:
            user_id: ID of the disconnecting user
        """
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(
        self, message: dict, user_id: int, queue_if_offline: bool = True
    ) -> None:
        """Send DM to user, queue if offline.

        Args:
            message: Message dict containing sender_id, content, etc.
            user_id: Recipient user ID
            queue_if_offline: Whether to queue message if user is offline
        """
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_json(message)
            except Exception as e:
                logger.error(f"Error sending message to user {user_id}: {e}")
                if queue_if_offline:
                    sender_id = message.get("sender_id")
                    content = message.get("content", "")
                    queue_pending_message(user_id, sender_id, content, "dm")
        elif queue_if_offline:
            sender_id = message.get("sender_id")
            content = message.get("content", "")
            queue_pending_message(user_id, sender_id, content, "dm")

    async def broadcast_to_server(
        self, message: dict, server_member_ids: list
    ) -> None:
        """Broadcast server message to online members, queue for offline.

        Args:
            message: Message dict containing sender_id, content, server_id, etc.
            server_member_ids: List of member user IDs in the server
        """
        sender_id = message.get("sender_id")
        content = message.get("content", "")
        server_id = message.get("server_id")

        for user_id in server_member_ids:
            if user_id in self.active_connections:
                try:
                    await self.active_connections[user_id].send_json(message)
                except Exception as e:
                    logger.error(f"Error broadcasting to user {user_id}: {e}")
                    queue_pending_message(
                        user_id, sender_id, content, "server", server_id
                    )
            else:
                queue_pending_message(
                    user_id, sender_id, content, "server", server_id
                )

    async def _sync_pending_messages(self, user_id: int) -> None:
        """Send all pending messages to a newly connected user.

        Args:
            user_id: ID of the user to sync messages for
        """
        pending = get_pending_messages(user_id)
        if not pending:
            return

        websocket = self.active_connections.get(user_id)
        if not websocket:
            return

        for msg in pending:
            try:
                sender = get_user_by_id(msg["sender_id"])
                payload = {
                    "type": msg["msg_type"],
                    "content": msg["content"],
                    "sender_id": msg["sender_id"],
                    "sender_name": sender["username"] if sender else "Unknown",
                    "server_id": msg["server_id"],
                    "pending": True
                }
                await websocket.send_json(payload)
                mark_message_delivered(msg["id"])
            except Exception as e:
                logger.error(f"Error delivering pending message {msg['id']}: {e}")

manager = ConnectionManager()