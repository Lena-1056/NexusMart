# NexusMart Seller Dashboard

This React application allows independent sellers to manage their store on NexusMart.

## Prerequisites
- Node.js (v16+)
- npm or yarn

## How to Install
1. Navigate to this directory (`F:/ECommerce/frontend/react-seller-dashboard`).
2. Run `npm install` to install dependencies.

## Project Structure
- **src/pages/**: Contains views such as `Dashboard` (sales metrics), `MyProducts` (inventory management), and `MyOrders` (order fulfillment).
- **src/components/**: Reusable UI components.
- **src/App.jsx**: Handles routing and authentication state (localStorage).

## How to Run
Run the Vite development server using:
```bash
npx vite --port 5174 --host
```
The application will be accessible at `http://localhost:5174`.

## How to Use
- **Registration**: Create a new seller account. Your initial status will be `PENDING`.
- **Approval**: Wait for a platform Admin to approve your store. Once approved, log out and log back in to refresh your status.
- **Products**: Add new products, set prices, and upload images.
- **Orders**: Monitor incoming orders and update their shipping status.
