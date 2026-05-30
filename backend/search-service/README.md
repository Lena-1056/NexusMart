# Search Service

This is a Python FastAPI microservice responsible for handling rapid product searches for the customer storefront.

## Tech Stack
- **Python 3.9+**
- **FastAPI**
- **Psycopg2**

## Database
This service queries the `products_schema` within the `ecommerce` PostgreSQL database. It only returns products with an `APPROVED` status.

## Installation & Running
1. Install dependencies:
```bash
pip install fastapi uvicorn psycopg2-binary
```
2. Start the application using:
```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8087 --reload
```
The server will start on port **8087**.

## Key Endpoints
- `GET /api/search?q={query}`: Search for products by name, category, or seller.
