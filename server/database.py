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



import os
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor


load_dotenv()
DB_CONFIG = {
 "dbname": os.getenv("DB_NAME"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASS"),
    "host": os.getenv("DB_HOST"),
    "port": os.getenv("DB_PORT")
}

def get_db_connection():
    conn = psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)
    return conn

try:
    connection = get_db_connection()
    print("Starfall is successfully connected to (Postgres)!")
    connection.close()
except Exception as e:
    print(f"Connection failed: {e}")

def get_server_members(server_id: int) -> list:
    """Fetch all user ID's :>"""
    conn =get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT user_id FROM server_members WHERE server_id = %s;", (server_id,))
            members = cur.fetchall()
            return [member['user_id'] for member in members]
        
    finally:
        conn.close()


def get_user_by_username(username: str):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("Select * FROM users WHERE username = %s;", (username,))
            return cur.fetchone()
    finally:
        conn.close()

def is_user_in_server(user_id: int, server_id: int) -> bool:
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT 1 FROM server_members WHERE user_id = %s AND server_id = %s;",
                (user_id, server_id)
            )
            return cur.fetchone() is not None  # Add return
    finally:
        conn.close()

def get_user_by_id(user_id: int):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, username FROM users WHERE id = %s;", (user_id,))
            return cur.fetchone()
    finally:
        conn.close()


def are_users_connected(user_id: int, recipient_id: int) -> bool:
    """Check if two users are connected (friends/can DM)"""
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT 1 FROM friendships WHERE (user_id = %s AND friend_id = %s) OR (user_id = %s AND friend_id = %s);",
                (user_id, recipient_id, recipient_id, user_id)
            )
            return cur.fetchone() is not None
    finally:
        conn.close()


def save_message(sender_id: int, content: str, msg_type: str, recipient_id: int = None, server_id: int = None):
    """Save a msg to the database"""
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            if msg_type == "server":
                cur.execute(
                    "INSERT INTO messages (sender_id, content, server_id) VALUES (%s, %s, %s);",
                    (sender_id, content, server_id)
                )

            elif msg_type == "dm":
                cur.execute(
                    "INSERT INTO messages (sender_id, content, recipient_id) VALUES (%s, %s, %s);",
                    (sender_id, content, recipient_id)
                )
        conn.commit()
    finally:
        conn.close()


def create_user(username: str, email: str, password_hash: str):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO users (username, email, hashed_password) VALUES (%s, %s, %s) RETURNING id;",
                (username, email, password_hash)
            )
            user_id = cur.fetchone()["id"]
            conn.commit()
            return user_id
    finally:
        conn.close()

def get_user_by_email(email: str):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM users WHERE email = %s;", (email,))
            return cur.fetchone()
    finally:
        conn.close()