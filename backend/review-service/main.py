from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import psycopg2
import os
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env'))
from psycopg2.extras import RealDictCursor

app = FastAPI(title="Review Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_URL = f"postgresql://postgres:{os.environ.get('DB_PASSWORD', '')}@127.0.0.1:5432/ecommerce"

def get_db_connection():
    return psycopg2.connect(DB_URL, cursor_factory=RealDictCursor)

from pydantic import BaseModel
import uuid
import datetime

class CreateReview(BaseModel):
    product: str
    customer: str
    rating: int
    comment: str

@app.post("/api/reviews")
def create_review(req: CreateReview):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        rid = "REV-" + uuid.uuid4().hex[:8]
        cur.execute(
            "INSERT INTO reviews_schema.reviews (id, product, customer, rating, comment, status, date, flagged) VALUES (%s, %s, %s, %s, %s, 'PENDING', %s, FALSE) RETURNING *",
            (rid, req.product, req.customer, req.rating, req.comment, datetime.date.today())
        )
        review = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        return review
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/reviews")
def get_reviews():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM reviews_schema.reviews ORDER BY date DESC")
        reviews = cur.fetchall()
        cur.close()
        conn.close()
        return reviews
    except Exception as e:
        print(f"Database error: {e}")
        return []

@app.get("/api/reviews/{product_id}")
def get_product_reviews(product_id: str):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM reviews_schema.reviews WHERE product = %s ORDER BY date DESC", (product_id,))
        reviews = cur.fetchall()
        cur.close()
        conn.close()
        return reviews
    except Exception as e:
        print(f"Database error: {e}")
        return []

@app.put("/api/reviews/{r_id}/status")
def update_status(r_id: str, status: str):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("UPDATE reviews_schema.reviews SET status = %s, flagged = FALSE WHERE id = %s RETURNING *", (status, r_id))
        review = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        if review:
            return review
        raise HTTPException(status_code=404, detail="Review not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/reviews/{r_id}/flag")
def toggle_flag(r_id: str):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("UPDATE reviews_schema.reviews SET flagged = NOT flagged WHERE id = %s RETURNING *", (r_id,))
        review = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        if review:
            return review
        raise HTTPException(status_code=404, detail="Review not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/reviews/{r_id}")
def delete_review(r_id: str):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM reviews_schema.reviews WHERE id = %s", (r_id,))
        conn.commit()
        cur.close()
        conn.close()
        return {"status": "deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8089)
