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

## 🎮 Beginner-Friendly Demo Guide

Not sure how to test it out? Follow this simple step-by-step walkthrough to see Pulse AI in action!

### Step 1: Open Your Windows
You will need two browser windows open side-by-side:
1. **The Pulse Dashboard:** Open `http://localhost:5174` (or whatever URL Vite gave you). This is your main control center where you monitor the system.
2. **The Demo App:** Open `http://localhost:3001`. This acts as your "fake" application. It simulates a live website with a Payments service, an Orders service, and an Inventory service.

### Step 2: Turn on Normal Traffic
On the **Demo App** screen, find the "Standard Traffic Simulation" box and click **Activate**. 
Now, look at your **Pulse Dashboard**. You should see the numbers coming alive! The charts will start moving, showing about ~30 requests per minute. This means your backend is successfully tracking healthy traffic. 

### Step 3: Break Things on Purpose (Chaos!)
Time to test the AI. Go back to the **Demo App** and find the **"Inject Chaos Scenarios"** section. 
Click on a red button like **"Inject High Error Rate"** or **"Inject Latency Spike"**. 
*What you are doing here is simulating a sudden database crash or network failure in your fake application.*

### Step 4: Watch the System Catch the Error
Without you needing to refresh the page, look at the **Pulse Dashboard**:
- A red **AI Anomaly Card** will pop up on the screen, alerting you that something went wrong.
- If you click over to the **Topology Map** tab, you will see the exact service (like `payments` or `inventory`) turn red and throb, showing you exactly where the system is failing in real-time.

### Step 5: Ask the AI for Help
On the Dashboard, click the **"Investigate"** button inside the red Anomaly Card. 
This tells the Groq AI Engine to read the failing logs. In a few seconds, the AI will generate a **Root Cause Analysis (RCA)**. It will explain exactly *why* the failure happened in plain English, and provide a bulleted list of suggestions on how to fix it!

---

## 👨‍💻 Authors

**Vedant Dubey**  
GitHub: [vedantdubey19](https://github.com/vedantdubey19)

**Shubham Singh**  
*Co-Author & Contributor*
