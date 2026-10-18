# SentinelTwin — System Requirements Document (SRD)

**Document ID:** SRD-001  
**Project:** SentinelTwin  
**Version:** 1.0.0  
**Target Window:** 24-Hour Implementation Window  

---

## 1. System Operating Environment

### 1.1 Host Operating Systems Supported
- **Windows 11 / Windows 10** (PowerShell 7+ / 5.1, WSL2 optional).
- **macOS** (Sonoma / Ventura, Apple Silicon arm64 & Intel x86_64).
- **Linux** (Ubuntu 22.04 LTS / 24.04 LTS, Debian 12).

### 1.2 Minimum & Recommended Hardware Specifications

| Resource | Minimum (Development & Demo) | Recommended Production Spec |
| :--- | :--- | :--- |
| **CPU** | 2 Physical Cores (2.0 GHz+) | 4+ Cores (3.0 GHz+) |
| **RAM** | 4 GB Available Memory | 8 GB+ Memory |
| **Disk Space** | 2 GB Free Storage (SSD preferred) | 10 GB Free Storage |
| **Network** | Broadband internet for TinyFish & Claude API calls | Redundant low-latency uplink |

---

## 2. Technology Stack & Software Dependencies

### 2.1 Backend Runtime & Libraries (Python 3.11+)
- **Runtime:** Python `3.11.x` or `3.12.x`.
- **Framework:** `FastAPI` (v0.111.0+) — Asynchronous REST API routing, Pydantic data serialization, OpenAPI generation.
- **ASGI Server:** `Uvicorn` (v0.30.0+) with `uvloop` for high-throughput asynchronous request loops.
- **Graph Mathematics & Digital Twin Engine:** `NetworkX` (v3.3+) — In-memory directed acyclic graph manipulation, shortest path computation, topological sorting, and blast-radius traversal.
- **HTTP Client:** `HTTPX` (v0.27.0+) — Async HTTP client for outbound communication with TinyFish and status endpoints.
- **LLM Integration:** `anthropic` (v0.28.0+) — Official SDK for structured incident reporting via Claude 3.5 Sonnet.
- **Persistence Layer:** `aiosqlite` (v0.20.0+) / `SQLite3` — Serverless relational database for local state persistence.
- **Test Framework:** `pytest` (v8.2.0+), `pytest-asyncio` (v0.23.0+) for automated verification.

### 2.2 Frontend Runtime & Libraries (Node.js 18+ / React 18)
- **Runtime:** Node.js `v18.18+` or `v20.x` LTS.
- **Package Manager:** `npm` (v9.x+) or `pnpm` (v8.x+).
- **Build Tool:** `Vite` (v5.3+) — Instant hot-module replacement and optimized ES bundle compilation.
- **UI Framework:** `React` (v18.3+) with `TypeScript` (v5.4+).
- **Styling:** `Tailwind CSS` (v3.4+) with `@tailwindcss/forms` and `@tailwindcss/typography`.
- **Graph Canvas:** `@xyflow/react` (React Flow v12.0+) — GPU-accelerated interactive canvas, custom nodes, edge routing, minimap, and zoom/pan controls.
- **Metrics & Visualization:** `Recharts` (v2.12+) — Responsive SVG-based comparative charts for blast radius and recovery deltas.
- **Iconography:** `Lucide React` (v0.395+) — Crisp, consistent SVG icons for operations-console aesthetic.

---

## 3. External API Prerequisites & Credentials

### 3.1 TinyFish AI Web Capabilities Platform
- **Service Role:** Primary web intelligence engine for news-first incident detection, status page retrieval, and headless DOM extraction.
- **Required Secret:** `TINYFISH_API_KEY` (Stored server-side in `.env`).
- **Endpoint Contracts:**
  - Search: `GET https://api.search.tinyfish.ai`
  - Fetch: `POST https://api.fetch.tinyfish.ai`
  - Agent: `POST https://api.agent.tinyfish.ai`
- **Fallback Guarantee:** Pre-loaded static JSON fixtures (`/backend/fixtures/tinyfish_stripe_outage.json`) enable 100% offline development and zero-failure hackathon demonstrations.

### 3.2 Anthropic Claude API
- **Service Role:** Evidence synthesis, incident brief generation, and executive summary formulation.
- **Required Secret:** `ANTHROPIC_API_KEY` (Stored server-side in `.env`).
- **Model Target:** `claude-3-5-sonnet-20241022` or `claude-3-haiku-20240307`.
- **Fallback Guarantee:** Deterministic string-interpolated markdown template engine activated when API key is missing or offline.

---

## 4. Operating Assumptions & Boundary Constraints

1. **Safety & Zero Production Touch:** SentinelTwin is exclusively an observational, analytical, and simulated decision-support system. It has **no network or credential access** to modify live customer production environments (no AWS IAM roles, no Stripe secret keys, no Cloudflare API tokens).
2. **Untrusted Web Content:** All content ingested through TinyFish is treated as hostile untrusted input. The backend strictly isolates HTML/text, applies length truncation, and strips executable scripts before UI rendering or LLM processing.
3. **Deterministic Local Simulation:** The digital twin simulation calculates propagation using purely deterministic mathematical formulas over the local in-memory graph.
4. **Data Isolation:** No sensitive infrastructure topology or private IP ranges are leaked to external LLMs. LLM prompts only receive abstracted service role labels (e.g., "Primary Payment Gateway", "Checkout Microservice").
