/**
 * Demo app endpoint catalog.
 */

export const DEMO_ENDPOINTS = [
  { path: '/api/products', method: 'GET', service: 'Catalog Service' },
  { path: '/api/auth/login', method: 'POST', service: 'Authentication Service' },
  { path: '/api/cart/checkout', method: 'POST', service: 'Checkout Service' },
  { path: '/api/payments/process', method: 'POST', service: 'Payment Service' },
  { path: '/api/orders', method: 'GET', service: 'Order Service' },
  { path: '/api/inventory', method: 'GET', service: 'Inventory Service' },
  { path: '/api/users/profile', method: 'GET', service: 'User Service' }
];
