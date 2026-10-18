# Changelog

All notable changes to the **SentinelTwin** project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2026-10-18 (AZINHACK '26 6-Hour Implementation Delivery)

### Decisions on Open Conflicts & Invariants
- **Graph Validity:** Reject dangling edges and self-loops on write. Block cycles at validate/simulate returning HTTP `409 Conflict` with error code `GRAPH_INVALID`.
- **Health Endpoints:** Served simultaneously at `/health` and `/api/v1/health`.
- **Payload Limits:** Strict `413 Payload Too Large` middleware rejecting request bodies $> 1\text{MB}$ ($1,048,576\text{ bytes}$).
- **Rounding:** Enforced exact arithmetic `ROUND_HALF_UP` (via Python `decimal.Decimal`) across all percentages and scores.
- **Retry Policy:** Maximum 2 exponential backoff retries for external HTTP calls.
- **Feature Prioritization:** Brand Guard and internal anomaly detection classified strictly as P2 (post-hackathon future scope).

### Scope Cuts (Delivered for 6-Hour Window)
- **Persistence:** Replaced SQLite/database with fast in-memory store initialized from verified JSON fixtures (`backend/fixtures/paynest_graph.json` and `backend/fixtures/stripe_outage_historical.json`).
- **Web Capabilities:** Implemented TinyFish `TinySearch` (live index) and `TinyFetch` (headless Chromium render). TinyAgent multi-step login workflow omitted.
- **Reporting:** Grounded template-based Markdown incident postmortem set as default (`REPORT_MODE=template`), eliminating external LLM latency during hackathon presentations.

### Added & Verified
- **Simulation Engine (`backend/app/core/simulation.py`):**
  - NetworkX directed acyclic graph model reproducing exact golden numbers:
    - Pre-mitigation Weighted Score: $W = 23.2$
    - Post-mitigation Weighted Score: $W = 10.2$ (matching $10.x$)
    - Users at Risk: $1,964 \rightarrow 200$ users ($19.6\% \rightarrow 2.0\%$)
    - Simulated Transaction Success Rate: $88.7\%$ (failure rate $11.3\%$)
- **API Endpoints (`backend/app/main.py`):**
  - `/health` & `/api/v1/health`
  - `/api/environment` & `/api/environment/reset`
  - `/api/environment/nodes` & `/api/environment/edges` (with cycle/self-loop rejections)
  - `/api/investigation/replay` & `/api/investigation/live`
  - `/api/investigation/evidence`
  - `/api/simulation/propagate` & `/api/simulation/mitigate`
  - `/api/reports/generate`
- **TinyFish Adapter & Security (`backend/app/services/tinyfish_client.py`):**
  - Search & Fetch adapter with timeout handling (10s total, 5s connect) and max 2 retries.
  - Invariant: Never treats empty or COMPLETED without text as success; falls back to deterministic fixtures.
  - SSRF protection layer (`validate_url_for_ssrf`) blocking loopback (`127.0.0.0/8`, `::1`), RFC 1918 private subnets, and cloud instance metadata (`169.254.169.254`).
- **Frontend Dashboard (`frontend/src/`):**
  - React 18 + Vite + Tailwind CSS + `@xyflow/react` operations console.
  - Interactive DAG canvas with status legend (Emerald healthy, Amber degraded, Red failed, Grey unknown).
  - Prominent historical replay watermark banner: `⚠️ HISTORICAL INCIDENT REPLAY — NOT A LIVE OUTAGE`.
  - Side-by-side Golden Metric comparison cards.
  - Interactive What-If "Kill Node" simulation injector.
  - Digital Twin Recovery lever (Razorpay secondary gateway failover).
  - Ranked recovery action plan with copyable CLI runbook commands.
  - Evidence stream with clickable source citations.
  - Postmortem Markdown viewer with one-click clipboard copy.
- **Automated Tests:**
  - 16/16 backend pytest unit and integration tests passing (`backend/tests/`).
  - Production TypeScript & Vite build passing (`npm run build`).

---

## [1.0.0] - 2026-10-18 (Phase 1: Architecture & Requirements Package)
- Initial complete documentation package (PRD, SRS, SRD, HLD, LLD, API_SPEC, SIMULATION_MODEL, etc.).
