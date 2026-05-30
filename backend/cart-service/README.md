# Cart Service

This is the Java Spring Boot microservice responsible for managing the state of customer shopping carts.

## Tech Stack
- **Java 17+**
- **Spring Boot 3**
- **Spring JDBC Template**

## Database
This service connects to the `ecommerce` PostgreSQL database and manages data within the `cart_schema`.

## Installation & Running
1. Ensure PostgreSQL is running.
2. Run `mvn clean install` to download dependencies.
3. Start the application using:
```bash
mvn spring-boot:run
```
The server will start on port **8086**.

## Key Endpoints
- `GET /api/cart/{email}`: Retrieve a customer's cart
- `POST /api/cart/add`: Add an item to the cart
- `POST /api/cart/remove`: Remove an item from the cart
