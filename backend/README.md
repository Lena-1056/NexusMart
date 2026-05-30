# NexusMart Backend Microservices Architecture

This directory contains the core microservices that power the NexusMart E-Commerce platform. The backend is built using a polyglot architecture, combining the robust enterprise features of **Java Spring Boot** with the lightweight and fast development capabilities of **Python FastAPI**.

All services share a single PostgreSQL database instance but manage their own isolated schemas to enforce microservice data boundaries.

## Architecture Overview

### Java Spring Boot Services
These services handle heavy transactional logic and secure data management.
1. **auth-service (Port 8081)**: Manages customer authentication, JWT generation, and user registration.
2. **cart-service (Port 8086)**: Handles the customer's shopping cart state.
3. **order-service (Port 8083)**: Manages order placement, processing, and history.

### Python FastAPI Services
These services handle rapid data retrieval, searches, and CRUD operations.
4. **admin-service (Port 8084)**: Admin operations, product catalog management, and approvals.
5. **seller-service (Port 8090)**: Seller dashboard metrics, product uploads, and store management.
6. **search-service (Port 8087)**: Powers the customer-facing product search functionality.
7. **wishlist-service (Port 8088)**: Manages customer wishlists and saved items.
8. **review-service (Port 8089)**: Handles product ratings and customer reviews.
9. **notification-service (Port 8091)**: Handles system alerts and notifications.

---

## Prerequisites

- **Java 17+** (for Spring Boot services)
- **Maven** (for building Java services)
- **Python 3.9+** (for FastAPI services)
- **PostgreSQL 14+** (Running on `localhost:5432`)

## Installation & Setup

### Database Setup
The database requires an `ecommerce` database running on `localhost:5432` with the credentials `postgres` / `1234567890`.
You can initialize the tables using the `database/init.sql` script.

### Running Python Services (FastAPI)
Navigate to any Python service directory (e.g., `search-service`) and run:
```bash
# Install required pip packages
pip install fastapi uvicorn psycopg2 pydantic passlib bcrypt PyJWT

# Run the development server
python -m uvicorn main:app --host 0.0.0.0 --port <PORT> --reload
```
*(Replace `<PORT>` with the specific port for that service listed above)*

### Running Java Services (Spring Boot)
Navigate to any Java service directory (e.g., `auth-service`) and run:
```bash
# Using Maven wrapper (if available) or standard maven
mvn spring-boot:run
```

## Structure Details

- **Python Services**: The logic is primarily housed in a single `main.py` file to keep the microservices ultra-lightweight. They use raw `psycopg2` SQL queries for maximum performance.
- **Java Services**: Follow the standard MVC architecture (`Controller` -> `Service` -> `Repository`). They utilize Spring JDBC Template for database interactions.
