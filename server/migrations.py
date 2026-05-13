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

from database import get_db_connection
from typing import Optional
import logging

logger = logging.getLogger(__name__)

def ensure_pending_messages_table() -> None:
    """Create pending_messages table if it doesn't exist.

    This table stores messages for users who are currently offline,
    enabling message recovery on reconnect.
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS pending_messages (
                    id SERIAL PRIMARY KEY,
                    recipient_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    sender_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    content TEXT NOT NULL,
                    msg_type VARCHAR(20) NOT NULL,
                    server_id INT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    delivered BOOLEAN DEFAULT FALSE
                );
            """)
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_recipient_delivered
                ON pending_messages (recipient_id, delivered);
            """)
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_created_at
                ON pending_messages (created_at);
            """)
            conn.commit()
            logger.info("pending_messages table ready")
    except Exception as e:
        logger.error(f"Failed to create pending_messages table: {e}")
    finally:
        conn.close()
