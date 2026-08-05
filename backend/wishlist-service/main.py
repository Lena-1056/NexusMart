from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env'))
import psycopg2
from psycopg2.extras import RealDictCursor
import uuid
import contextlib

app = FastAPI(title="Wishlist Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
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

class ToggleRequest(BaseModel):
    email: str
    productId: str

@app.get("/api/wishlist/{email}")
def get_wishlist(email: str):
    with db() as (cur, conn):
        cur.execute("SELECT product_id FROM wishlists_schema.wishlists WHERE customer_email = %s", (email,))
        items = cur.fetchall()
        return [item['product_id'] for item in items]

@app.post("/api/wishlist/toggle")
def toggle_wishlist(req: ToggleRequest):
    with db() as (cur, conn):
        # Check if exists
        cur.execute("SELECT id FROM wishlists_schema.wishlists WHERE customer_email = %s AND product_id = %s", (req.email, req.productId))
        existing = cur.fetchone()
        
        if existing:
            # Remove
            cur.execute("DELETE FROM wishlists_schema.wishlists WHERE id = %s", (existing['id'],))
            conn.commit()
            return {"status": "removed"}
        else:
            # Add
            wid = "WSH-" + uuid.uuid4().hex[:8]
            cur.execute(
                "INSERT INTO wishlists_schema.wishlists (id, customer_email, product_id) VALUES (%s, %s, %s)",
                (wid, req.email, req.productId)
            )
            conn.commit()
            return {"status": "added"}

@app.post("/api/wishlist/add")
def add_wishlist(req: ToggleRequest):
    with db() as (cur, conn):
        cur.execute("SELECT id FROM wishlists_schema.wishlists WHERE customer_email = %s AND product_id = %s", (req.email, req.productId))
        existing = cur.fetchone()
        if not existing:
            wid = "WSH-" + uuid.uuid4().hex[:8]
            cur.execute(
                "INSERT INTO wishlists_schema.wishlists (id, customer_email, product_id) VALUES (%s, %s, %s)",
                (wid, req.email, req.productId)
            )
            conn.commit()
        return {"status": "added"}


import uvicorn
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8088)
