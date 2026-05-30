# NexusMart Admin Dashboard

This is the administrative panel for NexusMart, built with React and Vite. It allows platform administrators to manage users, approve/reject products, review seller applications, and monitor the overall health of the platform.

## Prerequisites
- Node.js (v16+)
- npm or yarn

## How to Install
1. Navigate to this directory (`F:/ECommerce/frontend/react-admin-dashboard`).
2. Run `npm install` to install all required dependencies.

## Project Structure
- **src/pages/**: Contains the main views like `Dashboard`, `ProductApproval`, `SellerManagement`, and `ReviewsManagement`.
- **src/components/**: Reusable UI components like `Sidebar` and `Topbar`.
- **src/index.css**: Contains the custom CSS and theming.

## How to Run
Run the development server using:
```bash
npx vite --port 5173 --host
```
The application will be accessible at `http://localhost:5173`.

## How to Use
- **Login**: Use the admin credentials to log in.
- **Product Approval**: Review newly submitted products by sellers and click "Approve" or "Reject".
- **Seller Management**: Manage seller accounts, approve pending sellers, or suspend active ones.
- **Reviews**: Monitor flagged customer reviews.
