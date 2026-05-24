# ShopFast Pulse Demo

Interactive Node.js/Express demo for ShopFast, a mock e-commerce platform that integrates the Pulse SDK.

## Run

```bash
npm install
npm start
```

Open:

- `http://localhost:3001` for the ShopFast dashboard
- `http://localhost:8080/ws` for the Pulse backend WebSocket
- `http://localhost:8080/api/v1/rca` for AI RCA requests

## Features

- Mock e-commerce endpoints: `/api/checkout`, `/api/payments/capture`, `/api/inventory`, `/api/auth/login`
- Chaos controls: normal traffic, payment error storm, latency spike, crash test
- Live request feed and canvas charts
- Pulse WebSocket incident ticker
- Terminal-style AI RCA overlay
