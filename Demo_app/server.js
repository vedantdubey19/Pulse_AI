import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pulse from 'pulse-node-sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = join(__dirname, 'public');

const app = express();

app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

pulse.init({
  endpoint: process.env.PULSE_BACKEND_URL || 'http://localhost:8080',
  apiKey: process.env.PULSE_API_KEY || 'pk_shopfast_demo',
  environment: process.env.NODE_ENV || 'production',
  serviceName: 'shopfast'
});

app.use(pulse.middleware());
app.use(express.static(publicDir));

const products = [
  { id: 'sku_pod', name: 'PulsePods Pro', price: 129, stock: 184, category: 'audio' },
  { id: 'sku_charge', name: 'AeroCharge 65W', price: 49, stock: 322, category: 'power' },
  { id: 'sku_watch', name: 'NovaWatch SE', price: 249, stock: 71, category: 'wearables' },
  { id: 'sku_bag', name: 'Atlas Backpack', price: 89, stock: 126, category: 'travel' },
  { id: 'sku_key', name: 'Drift Keyboard', price: 159, stock: 94, category: 'workspace' }
];

const recentOrders = [];
const activeCrashes = [];
let activeMode = 'normal';

process.on('uncaughtException', (error) => {
  console.error('[ShopFast] Uncaught exception captured:', error.message);
  activeCrashes.push({
    id: `crash_${Date.now()}`,
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

process.on('unhandledRejection', (reason) => {
  console.error('[ShopFast] Unhandled rejection captured:', reason);
});

function nowIso() {
  return new Date().toISOString();
}

function requestId() {
  return `req_${Math.random().toString(36).slice(2, 10)}`;
}

function randomRegion() {
  return ['us-east-1', 'eu-west-1', 'ap-south-1', 'us-west-2'][Math.floor(Math.random() * 4)];
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function jitter(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function errorResponse(res, status, code, message, extra = {}) {
  return res.status(status).json({
    ok: false,
    requestId: requestId(),
    timestamp: nowIso(),
    mode: activeMode,
    error: { code, message },
    ...extra
  });
}

function successResponse(res, status, payload = {}) {
  return res.status(status).json({
    ok: true,
    requestId: requestId(),
    timestamp: nowIso(),
    mode: activeMode,
    region: randomRegion(),
    ...payload
  });
}

function normalizeScenario(value) {
  const scenario = String(value || '').toLowerCase();
  if (['normal', 'payment_failure', 'error_storm', 'latency_spike'].includes(scenario)) {
    return scenario;
  }
  return null;
}

function scenarioForRoute(routeKey) {
  const scenario = activeMode;

  if (scenario === 'error_storm' || scenario === 'payment_failure') {
    if (routeKey === 'payments') {
      return {
        status: 500,
        body: {
          error: 'Connection timeout to payment gateway',
          code: 'PAYMENT_GATEWAY_TIMEOUT'
        }
      };
    }
  }

  if (scenario === 'latency_spike' && routeKey === 'checkout') {
    return {
      status: 200,
      delayMs: jitter(1200, 1800)
    };
  }

  return {
    status: 200,
    delayMs: 0
  };
}

async function respondRoute(res, routeKey, payloadBuilder) {
  const scenario = scenarioForRoute(routeKey);
  const delayMs = scenario.delayMs || 0;

  if (delayMs > 0) {
    await delay(delayMs);
  }

  if (scenario.status >= 400) {
    return errorResponse(res, scenario.status, scenario.body?.code || 'SHOPFAST_ERROR', scenario.body?.error || 'Request failed', {
      details: scenario.body || null
    });
  }

  const payload = typeof payloadBuilder === 'function' ? payloadBuilder() : payloadBuilder;
  return successResponse(res, 200, payload);
}

function buildCheckoutPayload(items = []) {
  const itemCount = Array.isArray(items) ? items.length : 0;
  const total = Number((59 + Math.random() * 340).toFixed(2));
  return {
    endpoint: '/api/checkout',
    method: 'POST',
    data: {
      orderId: `ord_${Math.random().toString(36).slice(2, 10)}`,
      itemCount: itemCount || 2,
      total,
      status: 'created',
      currency: 'USD'
    }
  };
}

function buildPaymentPayload() {
  return {
    endpoint: '/api/payments/capture',
    method: 'POST',
    data: {
      paymentId: `pay_${Math.random().toString(36).slice(2, 10)}`,
      captured: true,
      processor: 'Stripe'
    }
  };
}

async function handleCheckout(req, res) {
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  const order = buildCheckoutPayload(items);
  await respondRoute(res, 'checkout', () => order);

  recentOrders.unshift({
    orderId: order.data.orderId,
    createdAt: nowIso(),
    total: order.data.total
  });
}

async function handlePaymentCapture(_req, res) {
  if (activeMode === 'error_storm' || activeMode === 'payment_failure') {
    return errorResponse(res, 500, 'PAYMENT_GATEWAY_TIMEOUT', 'Connection timeout to payment gateway');
  }

  return respondRoute(res, 'payments', buildPaymentPayload);
}

function triggerCrash(res) {
  successResponse(res, 202, {
    endpoint: '/api/debug/crash',
    method: 'POST',
    data: { scheduled: true, note: 'Uncaught exception will be thrown asynchronously' }
  });

  setImmediate(() => {
    throw new Error('ShopFast crash test: uncaught exception intentionally triggered');
  });
}

app.get('/', (_req, res) => {
  res.sendFile(join(publicDir, 'index.html'));
});

app.get('/api/v1/health', (_req, res) => {
  successResponse(res, 200, {
    status: 'ok',
    version: '1.0.0',
    uptime: process.uptime(),
    mode: activeMode,
    crashes: activeCrashes.length
  });
});

app.post('/chaos/:scenario', async (req, res) => {
  const scenario = normalizeScenario(req.params.scenario);
  if (!scenario) {
    return errorResponse(res, 400, 'INVALID_SCENARIO', 'Unsupported chaos scenario.');
  }

  activeMode = scenario;
  const duration = Number(req.body?.duration || 60);

  return successResponse(res, 200, {
    mode: activeMode,
    expiresIn: activeMode === 'normal' ? 0 : duration,
    expiresAt: activeMode === 'normal' ? null : new Date(Date.now() + duration * 1000).toISOString()
  });
});

app.get('/chaos/status', (_req, res) => {
  return successResponse(res, 200, {
    mode: activeMode,
    expiresAt: activeMode === 'normal' ? null : new Date(Date.now() + 60000).toISOString(),
    crashes: activeCrashes.slice(-3)
  });
});

app.post('/api/checkout', handleCheckout);

app.post('/api/cart/checkout', handleCheckout);

app.post('/api/payments/capture', handlePaymentCapture);

app.post('/api/payments/process', handlePaymentCapture);

app.get('/api/products', (_req, res) => {
  return successResponse(res, 200, {
    endpoint: '/api/products',
    method: 'GET',
    data: products
  });
});

app.get('/api/inventory', async (_req, res) => {
  await respondRoute(res, 'inventory', () => ({
    endpoint: '/api/inventory',
    method: 'GET',
    data: products.map((item) => ({
      id: item.id,
      name: item.name,
      stock: item.stock,
      price: item.price,
      available: item.stock > 0
    }))
  }));
});

app.post('/api/auth/login', async (req, res) => {
  const email = req.body?.email || 'guest@shopfast.dev';
  if (activeMode === 'error_storm') {
    return errorResponse(res, 500, 'AUTH_DEPENDENCY_TIMEOUT', 'Authentication backend timeout');
  }

  if (activeMode === 'latency_spike') {
    await delay(jitter(350, 600));
  }

  return successResponse(res, 200, {
    endpoint: '/api/auth/login',
    method: 'POST',
    data: {
      userId: `usr_${Math.random().toString(36).slice(2, 10)}`,
      email,
      token: `tok_${Math.random().toString(36).slice(2, 12)}`,
      role: 'customer'
    }
  });
});

app.get('/api/orders', (_req, res) => {
  return successResponse(res, 200, {
    endpoint: '/api/orders',
    method: 'GET',
    data: recentOrders.slice(0, 10)
  });
});

app.get('/api/users/profile', (_req, res) => {
  return successResponse(res, 200, {
    endpoint: '/api/users/profile',
    method: 'GET',
    data: {
      id: `usr_${Math.random().toString(36).slice(2, 10)}`,
      plan: 'plus',
      region: randomRegion()
    }
  });
});

app.post('/api/debug/crash', (_req, res) => {
  triggerCrash(res);
});

app.get('/api/crash-test', (_req, res) => {
  triggerCrash(res);
});

app.use((err, _req, res, _next) => {
  console.error('[ShopFast] Route error:', err);
  return errorResponse(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred.');
});

const PORT = Number(process.env.PORT || 3001);

app.listen(PORT, () => {
  console.log(`ShopFast demo server running at http://localhost:${PORT}`);
  console.log(`Serving dashboard from ${publicDir}`);
});