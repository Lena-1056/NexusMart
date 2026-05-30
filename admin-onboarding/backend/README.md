# NexusMart Admin Onboarding Backend

This is a standalone Spring Boot microservice dedicated exclusively to the Admin Onboarding portal. It handles the registration and initial setup of platform administrators.

## Prerequisites
- Java 17+
- Maven
- PostgreSQL running locally on `localhost:5432`

## How to Install
1. Navigate to this directory (`F:/ECommerce/admin-onboarding/backend`).
2. Ensure you have the `ecommerce` database created in PostgreSQL with the default credentials (`postgres`/`1234567890`).
3. Run `mvn clean install` to resolve dependencies.

## Project Structure
- **controller/**: Contains the `OnboardingController.java` which exposes the REST endpoints (`/api/onboard`).
- **service/**: Contains the business logic (`AdminService.java`) and the asynchronous email notification logic (`NotificationService.java`).
- **repository/**: Spring Data or JDBC configurations.

## How to Run
Run the application using the Spring Boot Maven plugin:
```bash
mvn spring-boot:run
```
The server will start on port **8085**.

## How to Use
This backend exposes a POST endpoint at `http://localhost:8085/api/onboard`.
It accepts a JSON payload with `name`, `email`, and `tempPassword`. Upon success, it inserts the new admin into the `admin_users` table and simulates sending a welcome email asynchronously without blocking the HTTP response.
