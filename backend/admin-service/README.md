# Admin Service

This is a Python FastAPI microservice responsible for platform administration tasks, including product catalog retrieval and approval workflows.

## Tech Stack
- **Python 3.9+**
- **FastAPI**
- **Psycopg2** (for raw SQL execution)

## Database
This service connects to the `ecommerce` PostgreSQL database and primarily interacts with the `products_schema` and `sellers_schema`.

## Installation & Running
1. Ensure you have Python installed.
2. Install the required dependencies:
```bash
pip install fastapi uvicorn psycopg2-binary pydantic
```
3. Start the application using:
```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8084 --reload
```
The server will start on port **8084**.

## Key Endpoints
- `GET /api/products`: List all products
- `GET /api/products/{id}`: Get specific product details
- `PUT /api/products/{id}/status`: Approve or reject a product
