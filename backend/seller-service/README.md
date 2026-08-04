# Seller Service

This is a Python FastAPI microservice responsible for seller registration, authentication, dashboard analytics, and product inventory management.

## Tech Stack
- **Python 3.9+**
- **FastAPI**
- **Psycopg2** (for raw SQL execution)

## Database
This service connects to the `ecommerce` PostgreSQL database and primarily interacts with the `sellers_schema` and `products_schema`.

## Installation & Running
1. Ensure you have Python installed.
2. Enter your PostgreSQL password and JWT token in `main.py` before starting the service.
3. Install the required dependencies:
```bash
pip install fastapi uvicorn psycopg2-binary pydantic
```
4. Start the application using:
```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8090 --reload
```
The server will start on port **8090**.

## Key Endpoints
- `POST /api/sellers/register`: Register a new store
- `POST /api/sellers/login`: Authenticate seller
- `GET /api/sellers/dashboard/{store}`: Retrieve seller analytics
