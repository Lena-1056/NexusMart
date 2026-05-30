-- Create schemas for different microservices
CREATE SCHEMA IF NOT EXISTS users_schema;
CREATE SCHEMA IF NOT EXISTS products_schema;
CREATE SCHEMA IF NOT EXISTS sellers_schema;
CREATE SCHEMA IF NOT EXISTS orders_schema;
CREATE SCHEMA IF NOT EXISTS notifications_schema;
CREATE SCHEMA IF NOT EXISTS reviews_schema;

-- ==========================================
-- Users Service Tables
-- ==========================================
CREATE TABLE users_schema.users (
    id VARCHAR(50) PRIMARY KEY, -- USR-[8 digits]
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'CUSTOMER', -- CUSTOMER, ADMIN
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, SUSPENDED
    orders INT DEFAULT 0,
    joined VARCHAR(50)
);

-- ==========================================
-- Sellers Service Tables
-- ==========================================
CREATE TABLE sellers_schema.sellers (
    id VARCHAR(50) PRIMARY KEY, -- SLR-[8 hex]
    store VARCHAR(255) NOT NULL,
    owner VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL DEFAULT 'password',
    cat VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, SUSPENDED
    revenue DECIMAL(15, 2) DEFAULT 0.0,
    rating DECIMAL(3, 1) DEFAULT 0.0
);

-- ==========================================
-- Products Service Tables
-- ==========================================
CREATE TABLE products_schema.products (
    id VARCHAR(50) PRIMARY KEY, -- PDR-[8 hex]
    name VARCHAR(255) NOT NULL,
    seller VARCHAR(255) NOT NULL,
    cat VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    date VARCHAR(50),
    emoji TEXT,
    description TEXT
);

-- ==========================================
-- Orders Service Tables
-- ==========================================
CREATE TABLE orders_schema.orders (
    id VARCHAR(50) PRIMARY KEY, -- ORD-[8 hex]
    customer VARCHAR(255) NOT NULL,
    seller VARCHAR(255) NOT NULL,
    product VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED
    payment VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, PAID, REFUNDED
    payment_method VARCHAR(50),
    date VARCHAR(50),
    address VARCHAR(500)
);

-- ==========================================
-- Notifications Service Tables
-- ==========================================
CREATE TABLE notifications_schema.notifications (
    id VARCHAR(50) PRIMARY KEY, -- NTF-[8 hex]
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    recipient VARCHAR(50) NOT NULL,
    time VARCHAR(50),
    read BOOLEAN DEFAULT FALSE
);

-- ==========================================
-- Reviews Service Tables
-- ==========================================
CREATE TABLE reviews_schema.reviews (
    id VARCHAR(50) PRIMARY KEY, -- RVW-[8 hex]
    product VARCHAR(255) NOT NULL,
    customer VARCHAR(255) NOT NULL,
    rating INT NOT NULL,
    comment TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED
    date VARCHAR(50),
    flagged BOOLEAN DEFAULT FALSE
);

-- ==========================================
-- No seed data — database starts clean.
-- Use the Admin Dashboard to create real data.
-- Admin login: username=admin password=admin (hardcoded in frontend)
-- ==========================================
-- ==========================================
-- Carts Schema
-- ==========================================
CREATE SCHEMA IF NOT EXISTS carts_schema;

CREATE TABLE IF NOT EXISTS carts_schema.carts (
    id VARCHAR(50) PRIMARY KEY,
    customer_email VARCHAR(255) NOT NULL,
    product_id VARCHAR(50) NOT NULL,
    quantity INT NOT NULL DEFAULT 1
);

-- ==========================================
-- Wishlists Schema
-- ==========================================
CREATE SCHEMA IF NOT EXISTS wishlists_schema;

CREATE TABLE IF NOT EXISTS wishlists_schema.wishlists (
    id VARCHAR(50) PRIMARY KEY,
    customer_email VARCHAR(255) NOT NULL,
    product_id VARCHAR(50) NOT NULL
);
