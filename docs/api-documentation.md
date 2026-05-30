# Polyglot E-Commerce Platform API Documentation

This document outlines the primary REST API endpoints for all 14 microservices in the platform. The API Gateway routes requests to these underlying services based on the path prefix.

## 1. Authentication Service (Java)
Base Path: `/api/auth`
- `POST /login`: Authenticates a user and returns a JWT.
- `POST /register`: Registers a new customer.
- `POST /logout`: Invalidates the current token.
- `GET /validate`: Validates a JWT token.

## 2. User Service (Java)
Base Path: `/api/users`
- `GET /{id}`: Retrieves user profile.
- `PUT /{id}`: Updates user profile.
- `DELETE /{id}`: Deletes a user account.
- `GET /me`: Retrieves the currently authenticated user's profile.

## 3. Product Service (Golang)
Base Path: `/api/products`
- `GET /`: Lists products (paginated).
- `GET /{id}`: Retrieves product details.
- `POST /`: Creates a new product (Seller/Admin only).
- `PUT /{id}`: Updates a product (Seller/Admin only).
- `DELETE /{id}`: Deletes a product (Seller/Admin only).

## 4. Inventory Service (Golang)
Base Path: `/api/inventory`
- `GET /{productId}`: Retrieves stock level for a product.
- `POST /reserve`: Reserves stock during checkout.
- `POST /release`: Releases reserved stock if checkout fails.
- `PUT /{productId}`: Updates stock level (Seller/Admin only).

## 5. Cart Service (Java)
Base Path: `/api/cart`
- `GET /`: Retrieves the user's active cart.
- `POST /items`: Adds an item to the cart.
- `PUT /items/{itemId}`: Updates item quantity.
- `DELETE /items/{itemId}`: Removes an item.
- `DELETE /`: Clears the cart.

## 6. Order Service (Java)
Base Path: `/api/orders`
- `POST /`: Creates a new order from the cart.
- `GET /`: Lists user's order history.
- `GET /{id}`: Retrieves order details.
- `PUT /{id}/status`: Updates order status (Seller/Admin only).

## 7. Payment Service (Java)
Base Path: `/api/payments`
- `POST /process`: Processes payment for an order.
- `GET /{orderId}`: Retrieves payment status for an order.
- `POST /webhook`: Webhook for payment gateway callbacks.

## 8. Notification Service (Python)
Base Path: `/api/notifications`
- `POST /email`: Sends an email notification.
- `POST /sms`: Sends an SMS notification.
- `GET /`: Retrieves user's in-app notifications.
- `PUT /{id}/read`: Marks notification as read.

## 9. Review Service (Python)
Base Path: `/api/reviews`
- `GET /product/{productId}`: Retrieves reviews for a product.
- `POST /product/{productId}`: Submits a new review.
- `PUT /{id}`: Updates a review.
- `DELETE /{id}`: Deletes a review.

## 10. Search Service (Golang)
Base Path: `/api/search`
- `GET /`: Full-text search for products.
- `GET /suggestions`: Autocomplete suggestions.

## 11. Wishlist Service (Golang)
Base Path: `/api/wishlists`
- `GET /`: Retrieves the user's wishlist.
- `POST /items/{productId}`: Adds a product to the wishlist.
- `DELETE /items/{productId}`: Removes a product.

## 12. Seller Service (Golang)
Base Path: `/api/sellers`
- `GET /{id}`: Retrieves seller profile.
- `PUT /{id}`: Updates seller profile.
- `GET /{id}/dashboard`: Retrieves seller analytics.
- `POST /onboard`: Registers a new seller account.

## 13. Admin Service (Python)
Base Path: `/api/admin`
- `GET /dashboard`: Platform analytics (users, sales).
- `GET /users`: Lists all users.
- `PUT /users/{id}/status`: Bans/activates a user.
- `GET /sellers/pending`: Lists sellers awaiting approval.
- `PUT /sellers/{id}/approve`: Approves a seller.

## 14. API Gateway (Golang)
Port: `8080`
- Routes all `/api/*` traffic to the respective internal microservices using reverse proxy routing. Handles CORS, Rate Limiting, and initial Token Validation.
