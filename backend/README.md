# NexusMart Backend Microservices Architecture

This directory contains the core microservices that power the NexusMart E-Commerce platform. The backend is built using a polyglot architecture, combining the robust enterprise features of **Java Spring Boot**, the lightweight and fast development capabilities of **Python FastAPI**, and the high-performance execution of **Go (Golang)**.

All services share a single PostgreSQL database instance but manage their own isolated schemas to enforce microservice data boundaries.

## Architecture Overview

### Java Spring Boot Services

These services handle heavy transactional logic and secure data management.

1. **auth-service (Port 8081)**: Manages customer authentication, JWT generation, and user registration.
2. **cart-service (Port 8086)**: Handles the customer's shopping cart state.
3. **order-service (Port 8083)**: Manages order placement, processing, and history.
4. **shipping-service**: Manages shipping and delivery status updates.
5. **payment-service**: Handles transaction processing and checkout.

### Python FastAPI Services

These services handle rapid data retrieval, searches, and CRUD operations. 6. **inventory-service (Port 8098)**: Manages product stock and inventory tracking. 7. **admin-service (Port 8084)**: Admin operations, product catalog management, and approvals. 8. **seller-service (Port 8090)**: Seller dashboard metrics, product uploads, and store management. 9. **search-service (Port 8087)**: Powers the customer-facing product search functionality. 10. **wishlist-service (Port 8088)**: Manages customer wishlists and saved items. 11. **review-service (Port 8089)**: Handles product ratings and customer reviews. 12. **notification-service (Port 8091)**: Handles system alerts and notifications.

### Go (Golang) Services

These services provide high-concurrency API routing and core catalog operations. 13. **api-gateway (Port 8080)**: Central entry point routing frontend requests to the appropriate backend microservices. 14. **product-service (Port 8085)**: Manages the product catalog.

---

## Prerequisites

- **Java 17+** (for Spring Boot services)
- **Maven** (for building Java services)
- **Python 3.9+** (for FastAPI services)
- **Go 1.20+** (for Golang services)
- **PostgreSQL 14+** (Running on `localhost:5432`)

## Installation & Setup

### Environment Variables (.env)

**CRITICAL**: You must create a `.env` file in the root `NexusMart` directory before starting the backend. This file is ignored by Git to protect secrets.
Required variables:

- `DB_PASSWORD`: Your PostgreSQL password
- `JWT_SECRET_KEY`: Secret for JWT token generation
- `SMTP_PASSWORD`: Password for email notifications

### Service-specific configuration

Before starting the backend services, update the configuration values in each service as follows:

- **Auth service** (`auth-service/src/main/resources/application.properties`)
  - Enter your PostgreSQL password
  - Enter your SMTP email address and Gmail app password
- **Cart service** (`cart-service/src/main/resources/application.properties`)
  - Enter your PostgreSQL password
- **Order service** (`order-service/src/main/resources/application.properties`)
  - Enter your PostgreSQL password
- **Payment service** (`payment-service/src/main/resources/application.properties`)
  - Enter your PostgreSQL password
  - Enter your own JWT token (`jwt.secret`)
  - Enter your Razorpay key ID and secret key (`razorpay.key.id`, `razorpay.key.secret`)
- **Shipping service** (`shipping-service/src/main/resources/application.properties`)
  - Enter your PostgreSQL password
- **Admin service** (`admin-service/main.py`)
  - Enter your PostgreSQL password
  - Enter your own JWT token
- **Seller service** (`seller-service/main.py`)
  - Enter your PostgreSQL password
  - Enter your own JWT token
- **Notification service** (`notification-service` configuration)
  - Enter your SMTP email address and Gmail app password

### Automated Startup

The easiest way to start or stop all backend microservices at once is by running the PowerShell scripts located in the root directory:

```powershell
.\start_all.ps1
.\stop_all.ps1
```

### Database Setup

The database requires an `ecommerce` database running on `localhost:5432` with the credentials `postgres` / `1234567890`.
You can initialize the tables using the `database/init.sql` script.

### Running Python Services Manually (FastAPI)

Navigate to any Python service directory (e.g., `search-service`) and run:

```bash
# Install required pip packages
pip install fastapi uvicorn psycopg2 pydantic passlib bcrypt PyJWT

# Run the development server
python -m uvicorn main:app --host 0.0.0.0 --port <PORT> --reload
```

_(Replace `<PORT>` with the specific port for that service listed above)_

### Running Java Services Manually (Spring Boot)

Navigate to any Java service directory (e.g., `auth-service`) and run:

```bash
# Using Maven wrapper (if available) or standard maven
mvn spring-boot:run
```

### Running Go Services Manually

Navigate to any Go service directory (e.g., `api-gateway`) and run:

```bash
go run main.go
```

## Structure Details

- **Python Services**: The logic is primarily housed in a single `main.py` file to keep the microservices ultra-lightweight. They use raw `psycopg2` SQL queries for maximum performance.
- **Java Services**: Follow the standard MVC architecture (`Controller` -> `Service` -> `Repository`). They utilize Spring JDBC Template for database interactions.
