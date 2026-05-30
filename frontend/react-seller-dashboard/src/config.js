// Seller Dashboard API Configuration
// The seller-service runs on port 8090 and handles ALL seller-related endpoints
// (sellers, products, orders) directly from PostgreSQL.
// No API gateway needed for the seller dashboard.

export const API_BASE = 'http://localhost:8090';
export const ORDER_API_BASE = 'http://localhost:8083';
