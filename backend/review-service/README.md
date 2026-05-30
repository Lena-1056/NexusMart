# Review Service

This is a Python FastAPI microservice responsible for handling customer ratings and reviews for products.

## Tech Stack
- **Python 3.9+**
- **FastAPI**
- **Psycopg2**

## Database
This service connects to the `ecommerce` PostgreSQL database and manages data within the `reviews_schema`.

## Installation & Running
1. Install dependencies:
```bash
pip install fastapi uvicorn psycopg2-binary
```
2. Start the application using:
```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8089 --reload
```
The server will start on port **8089**.

## Key Endpoints
- `GET /api/reviews/{product_id}`: Retrieve all reviews for a specific product
- `POST /api/reviews`: Submit a new customer review
