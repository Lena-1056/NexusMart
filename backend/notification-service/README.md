# Notification Service

This is a Python FastAPI microservice responsible for centralized system alerts and notifications.

## Tech Stack
- **Python 3.9+**
- **FastAPI**
- **Psycopg2**

## Database
This service connects to the `ecommerce` PostgreSQL database. It does not actively write data, but it handles system-wide alerting architectures.

## Installation & Running
1. Install dependencies:
```bash
pip install fastapi uvicorn psycopg2-binary
```
2. Start the application using:
```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8091 --reload
```
The server will start on port **8091**.
