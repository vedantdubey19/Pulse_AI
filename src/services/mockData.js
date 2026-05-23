/**
 * All mock data for the application.
 */

export const ENDPOINTS = [
  { path: '/api/orders/checkout', method: 'POST', latency: 843, error: 34, status: 'DEGRADED', service: 'Order Service' },
  { path: '/api/auth/verify', method: 'GET', latency: 2840, error: 2, status: 'SLOW', service: 'Auth Service' },
  { path: '/api/products/search', method: 'GET', latency: 120, error: 0, status: 'HEALTHY', service: 'Search Service' },
  { path: '/api/payments/process', method: 'POST', latency: 1200, error: 12, status: 'DEGRADED', service: 'Payment Service' },
  { path: '/api/users/profile', method: 'GET', latency: 89, error: 0, status: 'HEALTHY', service: 'Auth Service' },
  { path: '/api/webhooks/stripe', method: 'POST', latency: 450, error: 5, status: 'WARNING', service: 'Payment Service' }
];

export const INCIDENTS = [
  { id: 1, severity: 'high', endpoint: '/api/orders/checkout', cause: 'DB connection pool exhausted — active=10, idle=0, waiting=142', time: '2m', rcaReady: true, affected: '4,201', duration: 'Ongoing' },
  { id: 2, severity: 'medium', endpoint: '/api/payments/process', cause: 'Stripe API latency elevated — P95 at 3200ms (SLA: 1000ms)', time: '14m', rcaReady: true, affected: '890', duration: 'Ongoing' },
  { id: 3, severity: 'low', endpoint: '/api/auth/verify', cause: 'Redis cache miss rate spike — 45% miss rate (baseline: 5%)', time: '42m', rcaReady: false, affected: '120', duration: 'Ongoing' },
  { id: 4, severity: 'resolved', endpoint: '/api/webhooks/stripe', cause: 'Webhook signature validation failed — invalid HMAC digest', time: '2h', rcaReady: false, affected: '45', duration: '12m' },
  { id: 5, severity: 'resolved', endpoint: '/api/products/search', cause: 'ElasticSearch node OOM — heap usage exceeded 95%', time: '5h', rcaReady: true, affected: '12k', duration: '45m' }
];

export const TIMELINE_EVENTS = [
  { time: '14:02:31', text: 'First error detected on POST /api/orders/checkout', color: '#ef4444' },
  { time: '14:02:45', text: 'Error rate crossed 10% threshold — incident auto-detection triggered', color: '#f59e0b' },
  { time: '14:03:00', text: 'Incident auto-created (severity: HIGH) — alert dispatched', color: '#ef4444' },
  { time: '14:03:01', text: 'AI Root Cause Analysis triggered automatically', color: '#8b5cf6' },
  { time: '14:03:04', text: 'RCA complete — root cause: DB connection pool exhaustion identified', color: '#8b5cf6' },
  { time: '14:05:00', text: 'Discord alert sent to #engineering channel', color: '#3b82f6' }
];

export const RCA_DATA = {
  rootCause: `Database connection pool exhausted. The <span class="font-mono">/api/orders/checkout</span> endpoint is holding connections open during a long-running transaction in the payment validation step. Under load, the pool (max: 10) fills completely, causing subsequent requests to timeout after 30s.`,
  evidence: [
    '34% of requests returned 500 in the last 15 minutes',
    'Average query time increased from 45ms to 840ms at 14:02',
    'Connection wait time exceeded 5000ms threshold',
    'Correlated with a deploy at 13:58 that added a new DB query'
  ],
  recommendation: `Increase connection pool size to 25 (edit <span class="font-mono text-secondary">DATABASE_POOL_SIZE</span> env var), and add connection timeout handling with exponential backoff in the checkout service. Consider adding a circuit breaker for the payment validation step.`,
  logs: `2026-05-23T14:02:31Z ERROR [CheckoutService] Timeout acquiring DB connection after 30000ms
2026-05-23T14:02:31Z WARN  [DBPool] Pool exhausted: active=10, idle=0, waiting=142
2026-05-23T14:02:32Z ERROR [PaymentValidator] Transaction rolled back due to connection loss
2026-05-23T14:02:32Z INFO  [API] 500 Internal Server Error - POST /api/orders/checkout - 30042ms
2026-05-23T14:02:33Z ERROR [CheckoutService] Timeout acquiring DB connection after 30000ms`
};

export const TOPOLOGY_NODES = [
  { id: 'gateway', label: 'API Gateway', type: 'gateway', x: 400, y: 60, status: 'healthy' },
  { id: 'auth', label: 'Auth Service', type: 'service', x: 150, y: 180, status: 'warning' },
  { id: 'orders', label: 'Order Service', type: 'service', x: 350, y: 180, status: 'critical' },
  { id: 'payments', label: 'Payment Service', type: 'service', x: 550, y: 180, status: 'degraded' },
  { id: 'search', label: 'Search Service', type: 'service', x: 700, y: 180, status: 'healthy' },
  { id: 'postgres', label: 'PostgreSQL', type: 'database', x: 250, y: 320, status: 'critical' },
  { id: 'redis', label: 'Redis', type: 'database', x: 100, y: 320, status: 'warning' },
  { id: 'stripe', label: 'Stripe API', type: 'external', x: 500, y: 320, status: 'degraded' },
  { id: 'elastic', label: 'Elasticsearch', type: 'database', x: 700, y: 320, status: 'healthy' }
];

export const TOPOLOGY_EDGES = [
  { from: 'gateway', to: 'auth' },
  { from: 'gateway', to: 'orders' },
  { from: 'gateway', to: 'payments' },
  { from: 'gateway', to: 'search' },
  { from: 'auth', to: 'redis' },
  { from: 'auth', to: 'postgres' },
  { from: 'orders', to: 'postgres' },
  { from: 'orders', to: 'payments' },
  { from: 'payments', to: 'stripe' },
  { from: 'search', to: 'elastic' }
];

export const SERVICE_DETAILS = {
  gateway: { latency: '12ms', errorRate: '0%', requests: '45k/min', lastIncident: 'None' },
  auth: { latency: '2840ms', errorRate: '2%', requests: '12k/min', lastIncident: '42m ago' },
  orders: { latency: '843ms', errorRate: '34%', requests: '8k/min', lastIncident: '2m ago' },
  payments: { latency: '1200ms', errorRate: '12%', requests: '4k/min', lastIncident: '14m ago' },
  search: { latency: '120ms', errorRate: '0%', requests: '22k/min', lastIncident: '5h ago' },
  postgres: { latency: '840ms', errorRate: '34%', requests: '15k/min', lastIncident: '2m ago' },
  redis: { latency: '8ms', errorRate: '0.5%', requests: '30k/min', lastIncident: '42m ago' },
  stripe: { latency: '3200ms', errorRate: '8%', requests: '2k/min', lastIncident: '14m ago' },
  elastic: { latency: '45ms', errorRate: '0%', requests: '22k/min', lastIncident: '5h ago' }
};
