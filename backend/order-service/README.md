# Order Service

This is the Java Spring Boot microservice responsible for order placement, tracking, and historical order data.

## Tech Stack
- **Java 17+**
- **Spring Boot 3**
- **Spring Data JPA**

## Database
This service connects to the `ecommerce` PostgreSQL database and manages data within the `orders_schema`.

## Installation & Running
1. Ensure PostgreSQL is running.
2. Run `mvn clean install` to download dependencies.
3. Start the application using:
```bash
mvn spring-boot:run
```
The server will start on port **8083**.

## Key Endpoints
- `GET /api/orders`: Retrieve all orders
- `POST /api/orders`: Create a new order during checkout
