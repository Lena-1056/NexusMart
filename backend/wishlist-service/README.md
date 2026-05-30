# Wishlist Service

This is a Python FastAPI microservice responsible for managing customer wishlists (saving favorite items).

## Tech Stack
- **Python 3.9+**
- **FastAPI**
- **Psycopg2**

## Database
This service connects to the `ecommerce` PostgreSQL database and manages data within the `wishlist_schema`.

## Installation & Running
1. Install dependencies:
```bash
pip install fastapi uvicorn psycopg2-binary
```
2. Start the application using:
```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8088 --reload
```
The server will start on port **8088**.

## Key Endpoints
- `GET /api/wishlist/{email}`: Retrieve a customer's saved wishlist items
- `POST /api/wishlist/toggle`: Add or remove an item from the wishlist
