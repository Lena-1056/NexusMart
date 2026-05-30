# NexusMart Customer Storefront

This is the primary customer-facing React application where shoppers can browse products, add items to their cart, and checkout.

## Prerequisites
- Node.js (v16+)
- npm or yarn

## How to Install
1. Navigate to this directory (`F:/ECommerce/frontend/react-customer-app`).
2. Run `npm install` to install all dependencies.

## Project Structure
- **src/pages/**: Contains all storefront views including `Home` (product catalog), `ProductDetails`, `Cart`, `Checkout`, `Wishlist`, and `MyOrders`.
- **src/services/api.js**: Centralized configuration mapping frontend requests to the respective microservices (Auth, Product, Cart, Order, Review, Wishlist, Search).
- **src/index.css**: Contains the core design system and responsive styles.

## How to Run
Run the Vite development server using:
```bash
npx vite --port 5175 --host
```
The application will be accessible at `http://localhost:5175`.

## How to Use
- **Shopping**: Browse products on the homepage or use the search bar.
- **Product Details**: Click on any product to view reviews, details, and add to cart.
- **Account**: Register for an account to manage your wishlist and view your order history.
- **Checkout**: Proceed to the cart and securely complete your purchase.
