from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env'))
import psycopg2
from psycopg2.extras import RealDictCursor
import contextlib

app = FastAPI(title="Search Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_CONFIG = {
    "host": "127.0.0.1",
    "port": 5432,
    "dbname": "ecommerce",
    "user": "postgres",
    "password": os.environ.get("DB_PASSWORD", ""),
}

@contextlib.contextmanager
def db():
    conn = psycopg2.connect(**DB_CONFIG)
    try:
        yield conn.cursor(cursor_factory=RealDictCursor), conn
    finally:
        conn.close()

@app.get("/api/search")
def search_products(q: str = ""):
    if not q:
        return []
    with db() as (cur, conn):
        cur.execute("""
            SELECT id, name, seller, cat, sub_category, brand, price, status, date, emoji 
            FROM products_schema.products 
            WHERE status = 'APPROVED' 
            AND (name ILIKE %s OR cat ILIKE %s OR sub_category ILIKE %s OR brand ILIKE %s OR seller ILIKE %s)
            ORDER BY name
        """, (f"%{q}%", f"%{q}%", f"%{q}%", f"%{q}%", f"%{q}%"))
        return cur.fetchall()
