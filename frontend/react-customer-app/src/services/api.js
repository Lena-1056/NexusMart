export const SERVICES = {
  USER: 'http://localhost:8081/api',       // Java user-service
  PRODUCT: 'http://localhost:8084/api',    // Python admin-service
  SEARCH: 'http://localhost:8087/api',     // Python search-service
  ORDER: 'http://localhost:8083/api',      // Java order-service
  CART: 'http://localhost:8086/api',       // Java cart-service
  PAYMENT: 'http://localhost:8085/api',    // Java payment-service
  REVIEW: 'http://localhost:8092/api',     // Python review-service
  WISHLIST: 'http://localhost:8088/api',   // Go wishlist-service
}

export const getAuthHeaders = () => {
  const token = localStorage.getItem('customerAuthToken')
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

export const getCustomer = () => {
  try {
    const c = localStorage.getItem('customerAuth')
    return c && c !== 'undefined' ? JSON.parse(c) : null
  } catch (e) {
    console.error("Error parsing customer from localStorage:", e);
    return null;
  }
}

export const setCustomer = (data) => {
  localStorage.setItem('customerAuth', JSON.stringify(data.user))
  localStorage.setItem('customerAuthToken', data.token)
}

export const clearCustomer = () => {
  localStorage.removeItem('customerAuth')
  localStorage.removeItem('customerAuthToken')
}
