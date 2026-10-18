# SentinelTwin

> *"Other tools tell you a provider is down. SentinelTwin tells you what it means for YOUR business, and tests the recovery before your users feel it."*

[![Track: Open Innovation](https://img.shields.io/badge/Track-Open%20Innovation%20(TinyFish%20Integrated)-blue.svg)](#)
[![Hackathon: AZINHACK '26](https://img.shields.io/badge/Hackathon-AZINHACK%20'26-green.svg)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Tests: 16 Passed](https://img.shields.io/badge/Tests-16%20Passed-emerald.svg)](#)

SentinelTwin is an AI-powered infrastructure resilience, external incident intelligence, dependency analysis, and digital-twin simulation platform built for **AZINHACK '26**. It connects live external web intelligence gathered via TinyFish (`TinySearch` and `TinyFetch`) to an organization-specific infrastructure dependency graph (`PayNest Fintech Stack`). It simulates failure propagation deterministically using NetworkX graph mathematics, quantifies business and workflow risks, and evaluates recovery alternatives in a digital twin sandbox **without modifying production infrastructure**.

---

## 🌟 Core Product Flow

```
+--------------------+      +----------------------+      +----------------------+      +--------------------+
|  LIVE WEB SIGNAL   | ---> |  VERIFIED EVIDENCE   | ---> |  IMPACT SIMULATION   | ---> |   RECOVERY PLAN    |
| (TinySearch News)  |      | (TinyFetch Headless) |      | (NetworkX DAG Model) |      | (Razorpay Failover)|
+--------------------+      +----------------------+      +----------------------+      +--------------------+
```

1. **Live Web Signal:** TinyFish AI searches Google's live index (`TinySearch`) for early-warning news, tweets, and advisories minutes before official status pages report disruption.
2. **Verified Evidence:** `TinyFetch` renders status pages via managed headless Chromium, extracting clean Markdown and assigning deterministic verification grades.
3. **Impact Simulation:** An in-memory NetworkX digital twin traverses directed service dependencies, computing topological blast radius, affected business workflows, and users at risk.
4. **Recovery Plan:** Operators test mitigation levers (e.g., secondary gateway failover from Stripe to Razorpay) with before-and-after recovery metrics.
5. **Incident Brief:** Generates an executive postmortem strictly grounded in verified citation URLs.

---

## 🎯 Verified Golden Simulation Benchmarks (PayNest Stack)

All values are deterministically reproduced and tested via automated pytest suite:

| Metric | Pre-Mitigation Outage (Stripe Down) | Post-Mitigation (Razorpay Failover) | Impact / Recovery Delta |
| :--- | :--- | :--- | :--- |
| **Weighted Impact Score ($W$)** | **$23.2$** | **$10.2$** (matches $10.x$) | **$56.0\%$ Reduction** |
| **Users at Risk** | **$19.6\%$** ($1,964$ users) | **$2.0\%$** ($200$ users) | **$89.8\%$ User Risk Reduction** |
| **Transaction Success Rate** | **$88.7\%$** ($11.3\%$ failure) | **$98.8\%$** ($1.2\%$ failure) | **$+10.1\%$ Success Improvement** |
| **Impacted Services** | **5 services** | **1 service** (unmigrated webhook) | **$80.0\%$ Service Recovery** |

---

## 🚀 Quickstart Guide

### 1. Backend Setup & Test Execution
```bash
# Verify Python 3.11+ is installed
python --version

# Run automated test suite (16 tests verifying golden values, cycles, and SSRF)
python -m pytest backend/tests/ -v

# Start FastAPI server
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
*API docs live at `http://localhost:8000/docs`.*
*Health checks served at `http://localhost:8000/health` and `http://localhost:8000/api/v1/health`.*

### 2. Frontend Setup & Launch
```bash
cd frontend

# Install dependencies (React 18 + Vite + Tailwind + @xyflow/react)
npm install

# Build production bundle
npm run build

# Start dev server
npm run dev
```
*Operations console live at `http://localhost:5173`.*

---

## 🔒 Security & Data Provenance Rules

1. **Zero Production Mutation:** SentinelTwin is strictly an analytical decision-support tool. It has zero credentials or capability to execute changes on live cloud or payment provider environments.
2. **Explicit Data Provenance:** Every metric on screen carries an origin badge:
   - `[REAL WEB SIGNAL]`: Live verified data from TinyFish crawl.
   - `[COMPUTED MODEL]`: Mathematically derived in NetworkX.
   - `[SIMULATED ASSUMPTION]`: Explicitly labeled model parameters.
   - `[HISTORICAL REPLAY]`: Verified historical outage drill data.
3. **SSRF Protection:** Built-in IP filter blocks requests to loopback (`127.0.0.0/8`, `::1`), private RFC 1918 subnets, and cloud instance metadata (`169.254.169.254`).
4. **Never Treat COMPLETED or Empty as Success:** TinyFish results must be non-empty; otherwise, the system seamlessly falls back to verified offline fixtures.

---

## 👥 Hackathon Team & Delivery

- **Track:** Open Innovation — TinyFish Integrated
- **Event:** AZINHACK '26
- **Architecture & Build:** Fast-track 6-Hour Implementation Complete
