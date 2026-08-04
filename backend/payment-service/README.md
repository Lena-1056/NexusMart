# Payment Service

This is the Java Spring Boot microservice responsible for handling payment processing and Razorpay integration.

## Tech Stack

- Java 17+
- Spring Boot 3
- Spring Data JPA
- PostgreSQL

## Database

This service connects to the `ecommerce` PostgreSQL database.

## Installation & Running

1. Ensure PostgreSQL is running.
2. Update the values in `src/main/resources/application.properties` with your PostgreSQL database password, JWT token, Razorpay key ID, and Razorpay secret key.
3. Run `mvn clean install` to download dependencies.
4. Start the application using:

```bash
mvn spring-boot:run
```

The server will start on port **8085**.

## Required Configuration Values

- `spring.datasource.password`: Enter your PostgreSQL database password
- `jwt.secret`: Enter your JWT token
- `razorpay.key.id`: Enter your Razorpay key ID
- `razorpay.key.secret`: Enter your Razorpay secret key

## Key Endpoints

- Payment initialization and callback endpoints are handled by the service controllers.
