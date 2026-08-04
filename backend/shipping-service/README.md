# Shipping Service

This is the Java Spring Boot microservice responsible for shipping and delivery operations.

## Tech Stack

- Java 17+
- Spring Boot 3
- Spring Data JPA
- PostgreSQL

## Database

This service connects to the `ecommerce` PostgreSQL database.

## Installation & Running

1. Ensure PostgreSQL is running.
2. Update the PostgreSQL password in `src/main/resources/application.properties` before starting the service.
3. Run `mvn clean install` to download dependencies.
4. Start the application using:

```bash
mvn spring-boot:run
```

The server will start on port **8094**.

## Required Configuration

- `spring.datasource.password`: Enter your PostgreSQL password
