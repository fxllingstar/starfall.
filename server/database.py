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
    conn = det_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT user_id FROM server_members WHERE server_id = %s;", (server_id,))
            members = cur.fetchall()
            return [member['user_id'] for member in members]
        
    finally:
        conn.close()

        