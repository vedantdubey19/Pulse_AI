<div align="center">
  <h1>🚀 Pulse AI</h1>
  <p><b>Intelligent API Failure Detection & Root Cause Analysis Platform</b></p>
  
  [![Go Version](https://img.shields.io/badge/Go-1.21+-00ADD8?logo=go&logoColor=white)](#)
  [![React Version](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=black)](#)
  [![MongoDB](https://img.shields.io/badge/MongoDB-Aggregations-47A248?logo=mongodb&logoColor=white)](#)
  [![Groq](https://img.shields.io/badge/AI-Groq%20Llama%203-F55036?logo=meta)](#)
</div>

---

## 📖 Overview

**Pulse AI** is an enterprise-grade, real-time observability platform designed to monitor microservice architectures, detect silent API failures, and autonomously generate actionable debugging recommendations. 

Traditional monitoring tools require manual threshold tuning and leave developers sifting through thousands of logs during an outage. Pulse AI solves this by employing high-throughput telemetry ingestion, sliding-window heuristics for anomaly detection, and an integrated Large Language Model (LLM) to perform instantaneous Root Cause Analysis (RCA).

---

## ✨ Core Capabilities

- **📡 High-Throughput Telemetry Ingestion:** Processes thousands of concurrent API logs (latency, status codes, methods) with sub-millisecond overhead.
- **🚨 Autonomous Anomaly Detection:** Dynamically calculates traffic baselines using sliding-window aggregations to flag latency spikes and error bursts without manual configuration.
- **🧠 LLM-Powered Root Cause Analysis:** Integrates with the Groq inference engine (Llama 3.1) to analyze localized contextual logs and generate human-readable causal explanations and remediation steps.
- **🕸️ Dynamic Topology Engine:** Constructs a live, interactive dependency graph of all interacting microservices, highlighting degraded nodes in real-time.
- **⚡ Reactive Dashboard:** Features a modern, glassmorphism-inspired React UI powered by WebSockets for instantaneous metrics, charts, and incident alerts.

---

## 🏗 System Architecture

The repository is structured as a full-stack monorepo comprising three specialized environments:

### 1. Pulse Backend (Golang)
The core ingestion and analytics engine.
- **Language:** Go
- **Database:** MongoDB (Time-series aggregations, event deduplication)
- **AI Integration:** Groq API
- **Location:** `/Pulse-Backend/`

### 2. Pulse Dashboard (Frontend)
The real-time observability control plane.
- **Technology:** React, Vite, Chart.js, Vanilla CSS
- **Features:** WebSocket listener, SVG Topology Map, Neural Engine Incident Feed
- **Location:** `/src/` & `/index.html`

### 3. Chaos Demo App (Traffic Generator)
A simulated microservice environment designed to test Pulse AI.
- **Technology:** Node.js, Express
- **Role:** Simulates services (Payments, Orders, Inventory) and exposes endpoints to inject controlled "Chaos" (latency spikes, HTTP 500 bursts).
- **Location:** `/Demo_app/`

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- Go (v1.21+)
- MongoDB (Running locally on port 27017 or a remote cluster)
- Groq API Key (For AI inference capabilities)

### Step 1: Initialize the Analytics Backend
```bash
cd Pulse-Backend
go mod download

# Set the Groq API key for Neural Engine RCA
export GROQ_API_KEY="your-groq-key"

# Boot the ingestion server
go run cmd/server/main.go
```
*Server initialized on `http://localhost:8080`*

### Step 2: Initialize the Observability Dashboard
Open a new terminal session at the root of the project:
```bash
npm install
npm run dev
```
*Dashboard initialized on `http://localhost:5174`*

### Step 3: Initialize the Microservice Traffic Simulator
Open a third terminal session:
```bash
cd Demo_app
npm install
npm start
```
*Simulator initialized on `http://localhost:3001`*

---

## 🎮 Platform Demonstration Guide

To verify the platform's capabilities, execute the following sequence:

1. **Access the Control Plane:** Open the Vite localhost URL in a modern web browser to view the Pulse AI dashboard.
2. **Initialize Traffic:** Navigate to the Demo App (`http://localhost:3001`) and select "Activate" on the standard traffic simulation. Observe the dashboard metrics and RPM charts actively updating via WebSockets.
3. **Inject Anomalies:** In the Demo App, trigger a "Chaos" event (e.g., *Inject High Error Rate* or *Inject Latency Spike*).
4. **Observe Autonomous Detection:**
   - The Go backend's `IncidentDetector` will flag the anomaly and broadcast an event.
   - An **AI Anomaly Card** will immediately surface on the dashboard feed.
   - The **Topology Map** will visually degrade the affected service node.
5. **Execute RCA:** Click **"Investigate"** on the generated anomaly card to request an AI analysis. The system will bundle the contextual telemetry, pass it through the LLM inference engine, and return actionable debugging recommendations.

---

## 👨‍💻 Authors

**Vedant Dubey**  
GitHub: [vedantdubey19](https://github.com/vedantdubey19)

**Shubham Singh**  
*Co-Author & Contributor*
