"""
Admin Service — FastAPI + PostgreSQL
Port: 8084

Handles ALL admin dashboard endpoints:
  - Dashboard stats
  - User management
  - Seller management
  - Product approval
  - Order monitoring
  - Reviews management
  - Notifications
"""

import secrets
import psycopg2
import psycopg2.extras
from contextlib import contextmanager
import uuid
import json
import random
import string
import os
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env'))
from email_utils import send_seller_status_email, send_product_status_email
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import jwt

SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "")
ALGORITHM = "HS256"

app = FastAPI(title="Admin Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    if request.method == "OPTIONS" or request.url.path in ["/health", "/api/admin/health", "/api/auth/login"]:
        return await call_next(request)
    
    if request.method == "GET" and request.url.path.startswith("/api/products"):
        return await call_next(request)
    
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        return JSONResponse(status_code=401, content={"detail": "Missing or invalid token"})
    token = auth.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256", "HS384", "HS512"])
        if payload.get("role") != "ADMIN":
            return JSONResponse(status_code=403, content={"detail": "Admin access required"})
        request.state.user = payload
    except Exception as e:
        print(f"JWT DECODE ERROR: {repr(e)}")
        print(f"Token: {token}")
        print(f"Secret: {SECRET_KEY}")
        return JSONResponse(status_code=401, content={"detail": "Invalid token"})
        
    return await call_next(request)

# ── Database ──────────────────────────────────────────────────────────────────

DB_CONFIG = {
    "host":     "127.0.0.1",
    "port":     5432,
    "dbname":   "ecommerce",
    "user":     "postgres",
    "password": os.environ.get("DB_PASSWORD", ""),
}

@contextmanager
def db():
    conn = psycopg2.connect(**DB_CONFIG)
    conn.autocommit = False
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        yield cur, conn
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        conn.close()

def jrow(r): return dict(r) if r else None
def jrows(rs): return [dict(r) for r in rs]

@app.on_event("startup")
def startup():
    try:
        with db() as (cur, conn):
            cur.execute("SELECT 1")
        print("[OK] Admin service connected to PostgreSQL")
    except Exception as e:
        print(f"[ERROR] DB connection failed: {e}")
        raise

# ── Models ────────────────────────────────────────────────────────────────────

class StatusUpdate(BaseModel):
    status: str

class BroadcastMsg(BaseModel):
    message: str
    type: Optional[str] = "SYSTEM"

# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health")
@app.get("/api/admin/health")
def health():
    return {"status": "ok", "service": "admin-service", "port": 8084}

# ── Dashboard Stats ───────────────────────────────────────────────────────────

@app.get("/api/admin/dashboard")
def dashboard_stats():
    with db() as (cur, conn):
        cur.execute("SELECT COUNT(*) as cnt FROM users_schema.users")
        users = cur.fetchone()["cnt"]

        cur.execute("SELECT COUNT(*) as cnt, COALESCE(SUM(amount),0) as rev FROM orders_schema.orders")
        o = cur.fetchone()
        orders, revenue = o["cnt"], float(o["rev"])

        cur.execute("SELECT COUNT(*) as cnt FROM sellers_schema.sellers WHERE status='APPROVED'")
        sellers = cur.fetchone()["cnt"]

        cur.execute("SELECT COUNT(*) as cnt FROM products_schema.products WHERE status='PENDING'")
        pending_products = cur.fetchone()["cnt"]

    return {
        "revenue":        revenue,
        "orders":         orders,
        "newUsers":       users,
        "activeSellers":  sellers,
        "pendingProducts": pending_products,
        "avgOrderVal":    round(revenue / orders, 2) if orders > 0 else 0,
        "revenueChange":  "+12%",
        "ordersChange":   "+8%",
    }

@app.get("/api/admin/analytics")
def analytics():
    with db() as (cur, conn):
        cur.execute("""
            SELECT SUBSTRING(date,1,7) as month,
                   SUM(amount)         as revenue,
                   COUNT(id)           as orders
            FROM orders_schema.orders
            GROUP BY SUBSTRING(date,1,7)
            ORDER BY month ASC LIMIT 12
        """)
        monthly = [{"month": r["month"], "revenue": float(r["revenue"]), "orders": r["orders"]}
                   for r in cur.fetchall()]

        cur.execute("""
            SELECT o.product as name, COUNT(o.id) as sales,
                   SUM(o.amount) as revenue, MAX(p.emoji) as emoji
            FROM orders_schema.orders o
            LEFT JOIN products_schema.products p ON o.product = p.name
            GROUP BY o.product ORDER BY sales DESC LIMIT 5
        """)
        top_products = [{"name": r["name"], "sales": r["sales"],
                         "revenue": float(r["revenue"]), "emoji": r["emoji"] or ""}
                        for r in cur.fetchall()]

    return {"monthly": monthly, "topProducts": top_products}

# ── Users ─────────────────────────────────────────────────────────────────────

@app.get("/api/users")
def list_users():
    with db() as (cur, conn):
        cur.execute("SELECT id, name, email, role, status, joined, orders FROM users_schema.users ORDER BY name")
        return jrows(cur.fetchall())

@app.put("/api/users/{user_id}/status")
def update_user_status(user_id: str, body: StatusUpdate):
    with db() as (cur, conn):
        cur.execute("""
            UPDATE users_schema.users SET status=%s WHERE id=%s
            RETURNING id, name, email, role, status, joined, orders
        """, (body.status, user_id))
        row = cur.fetchone(); conn.commit()
    if not row: raise HTTPException(404, "User not found")
    return jrow(row)

@app.delete("/api/users/{user_id}")
def delete_user(user_id: str):
    with db() as (cur, conn):
        cur.execute("DELETE FROM users_schema.users WHERE id=%s RETURNING id", (user_id,))
        row = cur.fetchone(); conn.commit()
    if not row: raise HTTPException(404, "User not found")
    return {"deleted": user_id}

# ── Sellers ───────────────────────────────────────────────────────────────────

@app.get("/api/sellers")
def list_sellers():
    with db() as (cur, conn):
        cur.execute("SELECT id, store, owner, email, cat, status, revenue, rating FROM sellers_schema.sellers ORDER BY store")
        return jrows(cur.fetchall())

@app.put("/api/sellers/{seller_id}/status")
def update_seller_status(seller_id: str, body: StatusUpdate):
    with db() as (cur, conn):
        cur.execute("""
            UPDATE sellers_schema.sellers SET status=%s WHERE id=%s
            RETURNING id, store, owner, email, cat, status, revenue, rating
        """, (body.status, seller_id))
        row = cur.fetchone(); conn.commit()
    if not row: raise HTTPException(404, "Seller not found")
    
    send_seller_status_email(row['email'], row['owner'], row['store'], row['status'])
    
    return jrow(row)

# ── Products ──────────────────────────────────────────────────────────────────

@app.get("/api/products")
def list_products():
    with db() as (cur, conn):
        cur.execute("SELECT id, name, seller, cat, sub_category, brand, price, status, date, emoji, description FROM products_schema.products ORDER BY date DESC")
        return jrows(cur.fetchall())

@app.get("/api/products/{product_id}")
def get_product(product_id: str):
    with db() as (cur, conn):
        cur.execute("SELECT id, name, seller, cat, sub_category, brand, price, status, date, emoji, description FROM products_schema.products WHERE id = %s", (product_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(404, "Product not found")
        return jrow(row)

@app.put("/api/products/{product_id}/status")
def update_product_status(product_id: str, body: StatusUpdate):
    with db() as (cur, conn):
        cur.execute("""
            UPDATE products_schema.products SET status=%s WHERE id=%s
            RETURNING id, name, seller, cat, sub_category, brand, price, status, date, emoji, description
        """, (body.status, product_id))
        row = cur.fetchone(); conn.commit()
        
        seller_row = None
        if row:
            cur.execute("SELECT owner, email FROM sellers_schema.sellers WHERE store=%s", (row['seller'],))
            seller_row = cur.fetchone()
            
    if not row: raise HTTPException(404, "Product not found")
    
    if seller_row:
        send_product_status_email(seller_row['email'], seller_row['owner'], row['name'], row['status'])
        
    return jrow(row)

# ── Orders ────────────────────────────────────────────────────────────────────

@app.get("/api/orders")
def list_orders():
    with db() as (cur, conn):
        cur.execute("""
            SELECT o.id, o.customer, o.seller, o.product, o.amount, o.status, o.payment, o.date, p.sub_category, p.brand
            FROM orders_schema.orders o
            LEFT JOIN products_schema.products p ON o.product = p.name
            ORDER BY o.date DESC
        """)
        return jrows(cur.fetchall())

@app.put("/api/orders/{order_id}/status")
def update_order_status(order_id: str, body: StatusUpdate):
    with db() as (cur, conn):
        cur.execute("""
            UPDATE orders_schema.orders SET status=%s WHERE id=%s
            RETURNING id, customer, seller, product, amount, status, payment, date
        """, (body.status, order_id))
        row = cur.fetchone(); conn.commit()
    if not row: raise HTTPException(404, "Order not found")
    return jrow(row)

# ── Reviews ───────────────────────────────────────────────────────────────────

@app.get("/api/reviews")
def list_reviews():
    with db() as (cur, conn):
        cur.execute("SELECT id, product, customer, rating, comment, status, date, flagged FROM reviews_schema.reviews ORDER BY date DESC")
        return jrows(cur.fetchall())

@app.put("/api/reviews/{review_id}/status")
def update_review_status(review_id: str, body: StatusUpdate):
    with db() as (cur, conn):
        cur.execute("""
            UPDATE reviews_schema.reviews SET status=%s WHERE id=%s
            RETURNING id, product, customer, rating, comment, status, date, flagged
        """, (body.status, review_id))
        row = cur.fetchone(); conn.commit()
    if not row: raise HTTPException(404, "Review not found")
    return jrow(row)

@app.put("/api/reviews/{review_id}/flag")
def flag_review(review_id: str):
    with db() as (cur, conn):
        cur.execute("""
            UPDATE reviews_schema.reviews SET flagged = NOT flagged WHERE id=%s
            RETURNING id, product, customer, rating, comment, status, date, flagged
        """, (review_id,))
        row = cur.fetchone(); conn.commit()
    if not row: raise HTTPException(404, "Review not found")
    return jrow(row)

@app.delete("/api/reviews/{review_id}")
def delete_review(review_id: str):
    with db() as (cur, conn):
        cur.execute("DELETE FROM reviews_schema.reviews WHERE id=%s RETURNING id", (review_id,))
        row = cur.fetchone(); conn.commit()
    if not row: raise HTTPException(404, "Review not found")
    return {"deleted": review_id}

# ── Notifications ─────────────────────────────────────────────────────────────

@app.get("/api/notifications")
def list_notifications():
    with db() as (cur, conn):
        cur.execute("SELECT id, type, message, recipient, time, read FROM notifications_schema.notifications ORDER BY time DESC")
        return jrows(cur.fetchall())

@app.put("/api/notifications/{notif_id}/read")
def mark_read(notif_id: str):
    with db() as (cur, conn):
        cur.execute("""
            UPDATE notifications_schema.notifications SET read=TRUE WHERE id=%s
            RETURNING id, type, message, recipient, time, read
        """, (notif_id,))
        row = cur.fetchone(); conn.commit()
    if not row: raise HTTPException(404, "Notification not found")
    return jrow(row)

@app.delete("/api/notifications/{notif_id}")
def delete_notification(notif_id: str):
    with db() as (cur, conn):
        cur.execute("DELETE FROM notifications_schema.notifications WHERE id=%s RETURNING id", (notif_id,))
        row = cur.fetchone(); conn.commit()
    if not row: raise HTTPException(404, "Notification not found")
    return {"deleted": notif_id}

@app.post("/api/notifications/broadcast")
def broadcast(body: BroadcastMsg):
    notif_id = "NTF-" + secrets.token_hex(4)
    from datetime import datetime
    time_str = datetime.now().strftime("%Y-%m-%d %H:%M")
    with db() as (cur, conn):
        cur.execute("""
            INSERT INTO notifications_schema.notifications (id, type, message, recipient, time, read)
            VALUES (%s, %s, %s, 'ALL', %s, FALSE)
            RETURNING id, type, message, recipient, time, read
        """, (notif_id, body.type, body.message, time_str))
        row = cur.fetchone(); conn.commit()
    return jrow(row)

# ── Run ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8084, reload=True)
