# 🚀 Pulse AI — API Failure Detection & Debugging Agent

Pulse AI is an intelligent, real-time observability platform and AI agent designed to monitor microservices, detect silent API failures, group recurring incidents, and provide actionable LLM-powered Root Cause Analysis (RCA) to developers before users even notice an issue.

---

## ✨ Core Features

- **📡 High-Throughput Log Ingestion:** Continuously ingest telemetry (status codes, latencies, endpoints) from your microservices.
- **🚨 Autonomous Anomaly Detection:** Sliding-window heuristics automatically flag latency spikes and error bursts without manual threshold tuning.
- **🧠 AI Root Cause Analysis (RCA):** Integrates with Groq (Llama 3.1) to analyze surrounding contextual logs and generate human-readable explanations and debugging recommendations.
- **🕸️ Dynamic Topology Mapping:** Real-time dependency graph mapping out service connections, highlighting degraded nodes based on live traffic.
- **⚡ Real-time WebSockets:** Live dashboard updates, pulsing metric charts, and "Neural Engine" incident feeds pushed instantly to the UI.

---

## 🏗 Architecture & Tech Stack

This repository is a full monorepo containing all 3 pieces of the end-to-end system:

1. **Pulse Backend (Golang)**
   - **Language:** Go
   - **Database:** MongoDB (Aggregations, Timeseries)
   - **AI:** Groq API (LLM inference)
   - **Location:** `/Pulse-Backend/`

2. **Pulse Dashboard (Frontend)**
   - **Tech:** React, Vite, Vanilla CSS, Chart.js
   - **Features:** Glassmorphism UI, WebSocket client, SVG Topology Engine
   - **Location:** `/src/` & `/index.html`

3. **Chaos Demo App**
   - **Tech:** Node.js, Express
   - **Role:** Simulates a microservice architecture (Payments, Orders, Inventory) and fires simulated normal & "chaos" traffic at the Go backend.
   - **Location:** `/Demo_app/`

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- Go (1.21+)
- MongoDB (running locally on port 27017 or remote cluster)
- Groq API Key (Optional, for AI RCA)

### 1. Start the Go Backend
```bash
cd Pulse-Backend
go mod download

# Optional: Set Groq API key for AI analysis
export GROQ_API_KEY="your-groq-key"

# Run the server
go run cmd/server/main.go
```
*Runs on `http://localhost:8080`*

### 2. Start the Frontend Dashboard
Open a new terminal window at the root of the project:
```bash
npm install
npm run dev
```
*Runs on `http://localhost:5174` (or port specified by Vite)*

### 3. Start the Demo App (Traffic Generator)
Open a third terminal window:
```bash
cd Demo_app
npm install
npm start
```
*Runs on `http://localhost:3001`*

---

## 🎮 How to Demo the Platform

1. **Open the Dashboard:** Navigate to the Vite localhost URL. You will see a sleek, dark-themed UI.
2. **Open the Demo App:** Navigate to `http://localhost:3001`.
3. **Start Traffic:** Click "Activate" on the normal simulation in the Demo App. You will instantly see the RPM, Requests, and Charts light up on the Dashboard.
4. **Trigger Chaos:** Click "Inject High Error Rate" or "Inject Latency Spike".
5. **Watch the AI Agent Work:**
   - The Go backend will instantly detect the anomaly and emit a WebSocket event.
   - The React dashboard will pop an **AI Anomaly Card** and log a **Critical Incident** in the feed.
   - The **Topology Map** will turn the failing service node red.
6. **Investigate:** Click "Investigate" on the anomaly card. The LLM will fetch the contextual logs and generate a structured **Root Cause Analysis** with exact steps on how to fix it!

---

## 👨‍💻 Author

**Vedant Dubey**
GitHub: [vedantdubey19](https://github.com/vedantdubey19)
