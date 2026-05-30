export const SERVICES = {
  USER: 'http://localhost:8081/api',       // Java auth-service
  PRODUCT: 'http://localhost:8084/api',    // Python admin-service (handles products)
  SEARCH: 'http://localhost:8087/api',     // Python search-service
  CART: 'http://localhost:8086/api',       // Java cart-service
  ORDER: 'http://localhost:8083/api',      // Java order-service
  WISHLIST: 'http://localhost:8088/api',   // Python wishlist-service
  REVIEW: 'http://localhost:8089/api',     // Python review-service
  PAYMENT: 'http://localhost:8085/api',    // Java payment-service
}

export const getAuthHeaders = () => {
  const token = localStorage.getItem('customerAuthToken')
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

export const getCustomer = () => {
  const c = localStorage.getItem('customerAuth')
  return c ? JSON.parse(c) : null
}

export const setCustomer = (data) => {
  localStorage.setItem('customerAuth', JSON.stringify(data.user))
  localStorage.setItem('customerAuthToken', data.token)
}

export const clearCustomer = () => {
  localStorage.removeItem('customerAuth')
  localStorage.removeItem('customerAuthToken')
}
