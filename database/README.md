# Database Configuration

This folder contains the essential scripts for setting up and managing the PostgreSQL database for the NexusMart microservices.

Even though our microservices operate independently, for local development efficiency, they all share a single PostgreSQL database instance. However, to maintain strict microservice isolation boundaries, each service is assigned its own distinct **schema** (e.g., `users_schema`, `products_schema`, `orders_schema`).

## Files

*   **`init.sql`**: The single source of truth for the entire database architecture. It contains all the `CREATE SCHEMA` and `CREATE TABLE` definitions. **Note:** This file does *not* contain any mock seeding data. The database starts completely clean.
*   **`setup_db.py`**: A Python utility script that connects to your local PostgreSQL server, creates the `ecommerce` database if it doesn't exist, and automatically runs `init.sql` to build all the tables.
*   **`clear_data.py`**: A Python utility script used to safely `TRUNCATE` all data from the tables across every schema without dropping the actual tables. Useful for quickly resetting your local environment.

## Getting Started

### 1. Ensure PostgreSQL is Running
You must have a PostgreSQL server running on `localhost:5432` with the following root credentials:
*   **User:** `postgres`
*   **Password:** `1234567890`

You can use the `docker-compose.yml` file at the root of the project to spin this up instantly.

### 2. Run the Setup Script
To build the database and all its tables from scratch, simply run:
```bash
python setup_db.py
```
This will apply the `init.sql` schema and your database will be ready for the microservices!
