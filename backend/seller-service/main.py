"""
Seller Service — FastAPI + PostgreSQL
Port: 8090

Handles ALL seller-dashboard endpoints:
  - Seller auth (register / login)
  - Products (CRUD for seller's products)
  - Orders   (read + status update)
  - Dashboard stats
"""

import secrets
import psycopg2
import psycopg2.extras
from datetime import date
from contextlib import contextmanager
import uuid
import json
import random
import string
import os
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env'))
from email_utils import send_seller_pending_email, send_seller_forgot_password_email, send_seller_password_changed_email

from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import bcrypt
import jwt
from datetime import datetime, timedelta

SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "Enter your JWT token")
ALGORITHM = "HS256"

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=1)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# ─── App ─────────────────────────────────────────────────────────────────────

app = FastAPI(title="Seller Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    if request.method == "OPTIONS" or request.url.path in ["/health", "/api/sellers/login", "/api/sellers/register", "/api/sellers", "/api/sellers/forgot-password", "/api/sellers/reset-password"]:
        return await call_next(request)
    
    if request.url.path.endswith("/revenue"):
        return await call_next(request)
    
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        return JSONResponse(status_code=401, content={"detail": "Missing or invalid token"})
    token = auth.split(" ")[1]
    try:
        jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except:
        return JSONResponse(status_code=401, content={"detail": "Invalid token"})
        
    return await call_next(request)

# ─── Database ─────────────────────────────────────────────────────────────────

DB_CONFIG = {
    "host":     "127.0.0.1",
    "port":     5432,
    "dbname":   "ecommerce",
    "user":     "postgres",
    "password": os.environ.get("DB_PASSWORD", "Enter your PostgreSQL password"),
}

def get_conn():
    conn = psycopg2.connect(**DB_CONFIG)
    conn.autocommit = False
    return conn

@contextmanager
def db_cursor():
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        yield cur, conn
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        conn.close()

def startup_migrate():
    """Ensure required columns exist."""
    try:
        with db_cursor() as (cur, conn):
            cur.execute("""
                ALTER TABLE sellers_schema.sellers
                ADD COLUMN IF NOT EXISTS password VARCHAR(255) DEFAULT 'password',
                ADD COLUMN IF NOT EXISTS temp_password VARCHAR(255) DEFAULT NULL
            """)
            cur.execute("""
                ALTER TABLE products_schema.products
                ADD COLUMN IF NOT EXISTS description TEXT
            """)
            cur.execute("""
                ALTER TABLE sellers_schema.sellers
                ADD COLUMN IF NOT EXISTS city VARCHAR(255) DEFAULT 'Mumbai',
                ADD COLUMN IF NOT EXISTS state VARCHAR(255) DEFAULT 'Maharashtra',
                ADD COLUMN IF NOT EXISTS address TEXT DEFAULT ''
            """)
            conn.commit()
            print("[OK] DB migration OK")
    except Exception as e:
        print(f"[WARN] DB migration warning: {e}")

@app.on_event("startup")
def on_startup():
    try:
        with db_cursor() as (cur, conn):
            cur.execute("SELECT 1")
        print("[OK] Connected to PostgreSQL on 127.0.0.1:5432/ecommerce")
    except Exception as e:
        print(f"[ERROR] DB connection FAILED: {e}")
        raise
    startup_migrate()

# ─── ID Generator ─────────────────────────────────────────────────────────────

def gen_id(prefix: str) -> str:
    return f"{prefix}{secrets.token_hex(4)}"

# ─── Pydantic Models ──────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    store:    str
    owner:    str
    email:    str
    password: str
    cat:      Optional[str] = "Electronics"
    city:     Optional[str] = "Mumbai"
    state:    Optional[str] = "Maharashtra"
    address:  Optional[str] = ""

class LoginRequest(BaseModel):
    email:    str
    password: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    tempPassword: str
    newPassword: str

class StatusUpdate(BaseModel):
    Status: str

class ProfileUpdate(BaseModel):
    store:    str
    owner:    str
    email:    str
    cat:      str
    password: Optional[str] = None
    city:     Optional[str] = "Mumbai"
    state:    Optional[str] = "Maharashtra"
    address:  Optional[str] = ""

class ProductCreate(BaseModel):
    name:        str
    seller:      str
    cat:         str
    price:       float
    emoji:       Optional[str] = "📦"
    description: Optional[str] = None
    sub_category: Optional[str] = "Other"
    brand:       Optional[str] = "Generic"

# ─── Health ───────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "seller-service", "port": 8090}

# ─── Sellers ──────────────────────────────────────────────────────────────────

@app.get("/api/sellers")
def list_sellers():
    with db_cursor() as (cur, conn):
        cur.execute("""
            SELECT id, store, owner, email, cat, status, revenue, rating, city, state, address
            FROM sellers_schema.sellers
            ORDER BY store
        """)
        rows = cur.fetchall()
    return [dict(r) for r in rows]


@app.post("/api/sellers/register", status_code=201)
def register_seller(body: RegisterRequest):
    if not body.email or not body.password or not body.store:
        raise HTTPException(400, "store, email and password are required")

    seller_id = gen_id("SLR-")
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(body.password.encode('utf-8'), salt).decode('utf-8')
    try:
        with db_cursor() as (cur, conn):
            cur.execute("""
                INSERT INTO sellers_schema.sellers
                    (id, store, owner, email, password, cat, status, revenue, rating, city, state, address)
                VALUES (%s, %s, %s, %s, %s, %s, 'PENDING', 0, 0, %s, %s, %s)
                RETURNING id, store, owner, email, cat, status, revenue, rating, city, state, address
            """, (seller_id, body.store, body.owner, body.email, hashed_password, body.cat, body.city, body.state, body.address))
            row = cur.fetchone()
            conn.commit()
            
            # Send Email
            send_seller_pending_email(body.email, body.owner, body.store)
    except psycopg2.errors.UniqueViolation:
        raise HTTPException(409, "Email already registered")
    except Exception as e:
        raise HTTPException(500, str(e))
    return dict(row)


@app.post("/api/sellers/login")
def login_seller(body: LoginRequest):
    with db_cursor() as (cur, conn):
        cur.execute("""
            SELECT id, store, owner, email, password, cat, status, revenue, rating, city, state, address
            FROM sellers_schema.sellers
            WHERE email = %s
        """, (body.email,))
        row = cur.fetchone()

    if row is None:
        raise HTTPException(401, "No account found with that email")

    if not bcrypt.checkpw(body.password.encode('utf-8'), row["password"].encode('utf-8')):
        raise HTTPException(401, "Incorrect password")

    result = dict(row)
    del result["password"]     # never send password back
    token = create_access_token(data={"id": row["id"], "email": row["email"], "role": "SELLER"})
    return {"token": token, "user": result}

@app.post("/api/sellers/forgot-password")
def forgot_password(body: ForgotPasswordRequest):
    with db_cursor() as (cur, conn):
        cur.execute("SELECT id, owner, email FROM sellers_schema.sellers WHERE email = %s", (body.email,))
        row = cur.fetchone()

    if row is None:
        raise HTTPException(404, "No account found with that email")

    # Generate 8 char temp password
    temp_password = secrets.token_hex(4)

    with db_cursor() as (cur, conn):
        cur.execute("""
            UPDATE sellers_schema.sellers
            SET temp_password = %s
            WHERE email = %s
        """, (temp_password, body.email))
        conn.commit()

    reset_link = "http://localhost:5174/reset-password"
    send_seller_forgot_password_email(row["email"], row["owner"], temp_password, reset_link)
    
    return {"message": "Temporary password and reset link sent to your email."}

@app.post("/api/sellers/reset-password")
def reset_password(body: ResetPasswordRequest):
    with db_cursor() as (cur, conn):
        cur.execute("SELECT id, owner, email, temp_password FROM sellers_schema.sellers WHERE email = %s", (body.email,))
        row = cur.fetchone()

    if row is None:
        raise HTTPException(404, "No account found with that email")

    if not row["temp_password"] or row["temp_password"] != body.tempPassword:
        raise HTTPException(401, "Incorrect or expired temporary password")

    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(body.newPassword.encode('utf-8'), salt).decode('utf-8')

    with db_cursor() as (cur, conn):
        cur.execute("""
            UPDATE sellers_schema.sellers
            SET password = %s, temp_password = NULL
            WHERE email = %s
        """, (hashed_password, body.email))
        conn.commit()

    login_link = "http://localhost:5174/login"
    send_seller_password_changed_email(row["email"], row["owner"], login_link)

    return {"message": "Password updated successfully"}


@app.put("/api/sellers/{seller_id}/status")
def update_seller_status(seller_id: str, body: StatusUpdate):
    with db_cursor() as (cur, conn):
        cur.execute("""
            UPDATE sellers_schema.sellers
            SET status = %s
            WHERE id = %s
            RETURNING id, store, owner, email, cat, status, revenue, rating
        """, (body.Status, seller_id))
        row = cur.fetchone()
        conn.commit()
    if row is None:
        raise HTTPException(404, "Seller not found")
    return dict(row)


@app.put("/api/sellers/{seller_id}/profile")
def update_seller_profile(seller_id: str, body: ProfileUpdate):
    try:
        with db_cursor() as (cur, conn):
            if body.password:
                salt = bcrypt.gensalt()
                hashed_password = bcrypt.hashpw(body.password.encode('utf-8'), salt).decode('utf-8')
                cur.execute("""
                    UPDATE sellers_schema.sellers
                    SET store=%s, owner=%s, email=%s, cat=%s, password=%s, city=%s, state=%s, address=%s
                    WHERE id=%s
                    RETURNING id, store, owner, email, cat, status, revenue, rating, city, state, address
                """, (body.store, body.owner, body.email, body.cat, hashed_password, body.city, body.state, body.address, seller_id))
            else:
                cur.execute("""
                UPDATE sellers_schema.sellers
                SET store=%s, owner=%s, email=%s, cat=%s, city=%s, state=%s, address=%s
                WHERE id = %s
                RETURNING id, store, owner, email, cat, status, revenue, rating, city, state, address
            """, (body.store, body.owner, body.email, body.cat, body.city, body.state, body.address, seller_id))
            row = cur.fetchone()
            conn.commit()
    except psycopg2.errors.UniqueViolation:
        raise HTTPException(409, "Email already in use by another account")
    except Exception as e:
        raise HTTPException(500, str(e))
    if row is None:
        raise HTTPException(404, "Seller not found")
    return dict(row)


@app.put("/api/sellers/{store_name}/revenue")
def update_seller_revenue(store_name: str, amount: float):
    with db_cursor() as (cur, conn):
        cur.execute("""
            UPDATE sellers_schema.sellers
            SET revenue = revenue + %s
            WHERE store = %s OR id = %s
            RETURNING id, store, owner, email, cat, status, revenue, rating
        """, (amount, store_name, store_name))
        row = cur.fetchone()
        conn.commit()
    if row is None:
        raise HTTPException(404, "Seller not found")
    return dict(row)

@app.get("/api/sellers/dashboard/{store_name:path}")
def dashboard_stats(store_name: str):
    with db_cursor() as (cur, conn):
        # Products stats
        cur.execute("""
            SELECT
                COUNT(*)                                        AS total_products,
                COUNT(*) FILTER (WHERE status = 'APPROVED')    AS active_products
            FROM products_schema.products
            WHERE seller = %s
        """, (store_name,))
        prod_row = cur.fetchone()

        # Orders stats
        cur.execute("""
            SELECT
                COUNT(*)                                            AS total_orders,
                COALESCE(SUM(amount) FILTER (WHERE status != 'CANCELLED'), 0) AS revenue,
                COUNT(*) FILTER (WHERE status IN ('PENDING','PROCESSING'))    AS pending_orders,
                COUNT(*) FILTER (WHERE status = 'DELIVERED')                 AS delivered_orders
            FROM orders_schema.orders
            WHERE seller = %s
        """, (store_name,))
        ord_row = cur.fetchone()

    return {
        "totalProducts":   prod_row["total_products"],
        "activeProducts":  prod_row["active_products"],
        "totalOrders":     ord_row["total_orders"],
        "revenue":         float(ord_row["revenue"]),
        "pendingOrders":   ord_row["pending_orders"],
        "deliveredOrders": ord_row["delivered_orders"],
    }

# ─── Products ─────────────────────────────────────────────────────────────────

@app.get("/api/products")
def list_all_products():
    with db_cursor() as (cur, conn):
        cur.execute("""
            SELECT id, name, seller, cat, sub_category, brand, price, status, date, emoji, description
            FROM products_schema.products
            ORDER BY date DESC
        """)
        rows = cur.fetchall()
    return [dict(r) for r in rows]


@app.get("/api/products/seller/{store_name:path}")
def get_products_by_seller(store_name: str):
    with db_cursor() as (cur, conn):
        cur.execute("""
            SELECT id, name, seller, cat, sub_category, brand, price, status, date, emoji, description
            FROM products_schema.products
            WHERE seller = %s
            ORDER BY date DESC
        """, (store_name,))
        rows = cur.fetchall()
    return [dict(r) for r in rows]


@app.post("/api/products", status_code=201)
def create_product(body: ProductCreate):
    if not body.name or not body.seller:
        raise HTTPException(400, "name and seller are required")
    product_id = secrets.token_hex(8)
    today = str(date.today())
    try:
        with db_cursor() as (cur, conn):
            cur.execute("""
                INSERT INTO products_schema.products
                    (id, name, seller, cat, sub_category, brand, price, status, date, emoji, description)
                VALUES (%s, %s, %s, %s, %s, %s, %s, 'PENDING', %s, %s, %s)
                RETURNING id, name, seller, cat, sub_category, brand, price, status, date, emoji, description
            """, (product_id, body.name, body.seller, body.cat, body.sub_category, body.brand, body.price, today, body.emoji, body.description))
            row = cur.fetchone()
            conn.commit()
    except Exception as e:
        raise HTTPException(500, str(e))
    return dict(row)


@app.put("/api/products/{product_id}/status")
def update_product_status(product_id: str, body: StatusUpdate):
    with db_cursor() as (cur, conn):
        cur.execute("""
            UPDATE products_schema.products
            SET status = %s
            WHERE id = %s
            RETURNING id, name, seller, cat, sub_category, brand, price, status, date, emoji, description
        """, (body.Status, product_id))
        row = cur.fetchone()
        conn.commit()
    if row is None:
        raise HTTPException(404, "Product not found")
    return dict(row)

# ─── Orders ───────────────────────────────────────────────────────────────────

@app.get("/api/orders/seller/{store_name:path}")
def get_orders_by_seller(store_name: str):
    with db_cursor() as (cur, conn):
        cur.execute("""
            SELECT o.id, o.customer, o.seller, o.product, o.amount, o.status, o.payment, o.date, p.sub_category, p.brand
            FROM orders_schema.orders o
            LEFT JOIN products_schema.products p ON o.product = p.name
            WHERE o.seller = %s
            ORDER BY o.date DESC
        """, (store_name,))
        rows = cur.fetchall()
    return [dict(r) for r in rows]


@app.put("/api/orders/{order_id}/status")
def update_order_status(order_id: str, body: StatusUpdate):
    with db_cursor() as (cur, conn):
        cur.execute("""
            UPDATE orders_schema.orders
            SET status = %s
            WHERE id = %s
            RETURNING id, customer, seller, product, amount, status, payment, date
        """, (body.Status, order_id))
        row = cur.fetchone()
        conn.commit()
    if row is None:
        raise HTTPException(404, "Order not found")
    return dict(row)


# ─── Run ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8090, reload=True)

