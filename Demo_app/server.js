import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend
app.use(express.static(__dirname));

let activeMode = 'normal';

// Chaos API
app.post('/chaos/:scenario', (req, res) => {
    const validModes = ['normal', 'error_burst', 'latency_spike', 'auth_storm', 'cascade'];
    if (validModes.includes(req.params.scenario)) {
        activeMode = req.params.scenario;
        res.json({ success: true, mode: activeMode });
    } else {
        res.status(400).json({ error: 'Invalid scenario' });
    }
});

app.get('/chaos/status', (req, res) => {
    res.json({ mode: activeMode });
});

// Mock endpoints to simulate traffic
const mockHandler = (req, res) => {
    let status = 200;
    let delay = 0;

    // Apply chaos mode effects
    if (activeMode === 'error_burst' && Math.random() < 0.8) {
        status = 500;
    } else if (activeMode === 'latency_spike') {
        delay = 3000;
    } else if (activeMode === 'auth_storm' && req.path.includes('/auth/')) {
        status = 401;
    } else if (activeMode === 'cascade') {
        delay = 2000;
        if (Math.random() < 0.6) status = 500;
    } else if (activeMode === 'normal') {
        // 2% natural error rate
        if (Math.random() < 0.02) status = 500;
    }

    const sendResponseAndLog = async () => {
        res.status(status).json({ success: status < 400 });
        
        try {
            await fetch('http://localhost:8080/api/v1/logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    endpoint: req.path,
                    method: req.method,
                    status: status,
                    latency: delay > 0 ? delay : 20 + Math.floor(Math.random() * 50),
                    service: req.path.split('/')[2] || "demo-service",
                    environment: "production",
                    error: status >= 500 ? "Simulated chaos error" : ""
                })
            });
        } catch (err) {
            // Ignore fetch errors to backend
        }
    };

    if (delay > 0) {
        setTimeout(sendResponseAndLog, delay);
    } else {
        sendResponseAndLog();
    }
};

app.all('/api/*', mockHandler);

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Demo App Server running at http://localhost:${PORT}`);
    
    // Background traffic generator
    const ROUTES = [
        { method: 'POST', path: '/api/orders/checkout', weight: 0.30 },
        { method: 'GET', path: '/api/auth/verify', weight: 0.25 },
        { method: 'POST', path: '/api/payments/process', weight: 0.15 },
        { method: 'GET', path: '/api/products/search', weight: 0.20 },
        { method: 'GET', path: '/api/users/profile', weight: 0.10 }
    ];

    function pickRoute() {
        const rand = Math.random();
        let sum = 0;
        for (const r of ROUTES) {
            sum += r.weight;
            if (rand <= sum) return r;
        }
        return ROUTES[0];
    }

    setInterval(() => {
        const route = pickRoute();
        fetch(`http://localhost:${PORT}${route.path}`, {
            method: route.method,
            headers: { 'Content-Type': 'application/json' }
        }).catch(() => {});
    }, 2000);
});
