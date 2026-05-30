# NexusMart E-Commerce Platform

Welcome to the **NexusMart** E-Commerce platform! This repository contains the complete full-stack codebase for a modern, scalable e-commerce solution, divided into a React frontend suite and a polyglot microservices backend.

## Project Structure

This project has been thoroughly cleaned of old monolithic boilerplate and is structured as follows:

*   **`frontend/`**: Contains four isolated Vite/React single-page applications:
    *   `react-customer-app`: The main shopping portal for customers.
    *   `react-seller-dashboard`: The portal for sellers to manage inventory and view metrics.
    *   `react-admin-dashboard`: The master control panel for site administrators.
    *   `react-delivery-partner-app`: The portal for delivery drivers to track and claim shipments.
*   **`backend/`**: Contains 15 independent microservices:
    *   **Java Spring Boot**: `auth-service`, `cart-service`, `order-service`, `payment-service`, `shipping-service`, `inventory-service`, `product-service`, `user-service`, `api-gateway`
    *   **Python FastAPI**: `admin-service`, `seller-service`, `search-service`, `wishlist-service`, `review-service`, `notification-service`
*   **`database/`**: Contains the SQL schema definitions (`init.sql`) and setup scripts to configure the PostgreSQL database.
*   **`admin-onboarding/`**: A standalone tool for onboarding new administrators.

*(Note: If you'd like to view the architectural workflow or database Entity Relationship (ER) diagrams, you can find them in the `architecture.mmd` and `database_schema.mmd` files in the root directory).*

## Security

The platform employs industry-standard security practices:
*   **Passwords** are securely hashed using `BCrypt` before being stored in the database.
*   **Authentication** is managed via JSON Web Tokens (`JWT`). The Java authentication service generates signed JWTs upon login, which are then validated by strict middleware across all Python and Java microservices to protect secure routes.

## Quick Start

### 1. Database Setup
You can instantly spin up the required PostgreSQL database using the included Docker configuration:
```bash
docker-compose up -d
```
Alternatively, if you have PostgreSQL installed locally on port `5432`, you can manually execute the `database/init.sql` script to create the tables. You must provide a valid PostgreSQL username and password via environment variables like `DB_PASSWORD`.

### 2. Configure Local Environment
This project uses `.env` files to hide database passwords and JWT secrets from GitHub. Before running anything, you must set up your local secrets:
1. Copy the `F:\ECommerce\.env.example` file and rename it to `F:\ECommerce\.env`.
2. Open the `.env` file and insert your local PostgreSQL password.

### 3. Launch Everything
If you are on Windows, you don't need to open 12 different terminal windows to start this project! We have provided a unified startup script that will automatically read your `.env` file and inject the passwords into all 11 microservices securely.

Just open PowerShell, navigate to this root directory, and run:
```powershell
.\start_all.ps1
```
This script will automatically boot all 15 microservices and 4 frontend portals simultaneously on their respective ports.

### 4. Data Seeding
If you need sample products with rich descriptions and multiple high-quality images (like on Amazon), you can run the included Python seeder:
```bash
python backend/seed_products_v3.py
```

*(Note: If you get an execution policy error, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` first).*
