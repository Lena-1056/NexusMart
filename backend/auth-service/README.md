# Auth Service

This is the Java Spring Boot microservice responsible for customer authentication, user registration, and secure session management.

## Tech Stack
- **Java 17+**
- **Spring Boot 3**
- **Spring JDBC Template**

## Database
This service connects to the `ecommerce` PostgreSQL database and manages data within the `users_schema`.

## Installation & Running
1. Ensure PostgreSQL is running.
2. Update the values in `src/main/resources/application.properties` with your PostgreSQL database password, Gmail SMTP address, Gmail app password, and application mail address.
3. Run `mvn clean install` to download dependencies.
4. Start the application using:
```bash
mvn spring-boot:run
```
The server will start on port **8081**.

## Key Endpoints
- `POST /api/auth/customer/register`: Register a new customer
- `POST /api/auth/customer/login`: Authenticate and receive a token
