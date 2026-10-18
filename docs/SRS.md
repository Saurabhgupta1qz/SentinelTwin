# SentinelTwin — Software Requirements Specification (SRS)

**Document ID:** SRS-001  
**Project:** SentinelTwin  
**Standard:** IEEE 830-1998 Compliant  
**Version:** 1.0.0  
**Status:** Approved for Implementation  

---

## 1. Introduction

### 1.1 Purpose
This document provides the complete, authoritative functional and non-functional requirements specification for **SentinelTwin**, an AI-powered external incident intelligence, dependency analysis, and digital-twin simulation platform. It serves as the primary technical specification for development by autonomous AI coding agents (Google Antigravity / Claude Code) and human engineering leads during Kritical Hacks 2026.

### 1.2 System Scope
SentinelTwin enables organisations to model their internal service architecture as a directed dependency graph, ingest external incident signals from the live web using TinyFish (TinySearch and TinyFetch), verify and normalise external evidence, simulate downstream failure propagation using NetworkX, test recovery levers (such as secondary payment gateway cutover), and generate evidence-grounded incident briefs using Claude 3.5 Sonnet.

### 1.3 Definitions, Acronyms, and Abbreviations
- **DAG:** Directed Acyclic Graph.
- **Digital Twin:** A mathematical in-memory graph representation of infrastructure dependencies used for deterministic scenario simulation without production risk.
- **Blast Radius:** The set of downstream services, workflows, and estimated user volumes directly or transitively impacted by an upstream service failure.
- **TinyFish:** AI-first web capability platform providing live Google web search (`TinySearch`), headless Chromium scraping/markdown extraction (`TinyFetch`), and goal-oriented autonomous web execution (`TinyAgent`).
- **Data Provenance:** The explicit labeling of information origin: **Real** (live web/API data), **Computed** (deterministic graph calculations), or **Simulated** (hypothetical model assumptions).
- **P0 / P1 / P2:** Priority tiers (P0 = Critical MVP for 24h demo, P1 = High value secondary, P2 = Post-hackathon future scope).

---

## 2. Overall Description

### 2.1 Product Perspective & System Boundaries
SentinelTwin is a standalone, client-server web application. It runs locally or inside a single container, communicating outbound with public web intelligence providers (TinyFish APIs) and AI inference services (Anthropic Claude API).

```
+------------------------------------------------------------------------+
|                            USER INTERFACE                              |
|   React 18 + Vite + Tailwind CSS + React Flow DAG Canvas + Recharts    |
+------------------------------------------------------------------------+
                                   | (HTTP REST + SSE /streaming)
                                   v
+------------------------------------------------------------------------+
|                          SENTINELTWIN BACKEND                          |
|                       FastAPI (Python 3.11+)                           |
|  +--------------------+  +--------------------+  +------------------+  |
|  | Intelligence Layer |  | Digital Twin Engine|  | Mitigation & AI  |  |
|  | TinyFish Adapter   |  | NetworkX Graph Sim |  | Recovery Planner |  |
|  | Evidence Normalizer|  | Blast Radius Calc  |  | Claude 3.5 Brief |  |
|  +--------------------+  +--------------------+  +------------------+  |
|                                  |                                     |
|                       SQLite Persistence Layer                         |
+------------------------------------------------------------------------+
              |                                            |
              v                                            v
     [TinyFish Cloud APIs]                        [Anthropic Claude API]
  - TinySearch (Web Index)                    - Claude 3.5 Sonnet
  - TinyFetch (Headless Render)               - Grounded JSON Report
```

### 2.2 Operational Assumptions
1. Single-user local developer or incident-responder console for the 24-hour hackathon.
2. The infrastructure graph is configured once per demo session or loaded from a verified reference profile (`paypulse_fintech_stack.json`).
3. External web content retrieved via TinyFish is strictly considered **untrusted input** and sanitized against prompt injection and cross-site scripting (XSS).

---

## 3. Specific Functional Requirements (FR)

### FR-01: Infrastructure Stack Definition & Configuration (P0)
- **FR-01.1:** The system shall allow users to view, create, edit, and persist an infrastructure environment containing 10 to 15 interconnected dependencies.
- **FR-01.2:** Each node in the infrastructure graph shall define the following attributes:
  - `id`: Unique slug identifier (e.g., `srv-stripe-primary`).
  - `name`: Human-readable label (e.g., `Stripe Payments Gateway`).
  - `category`: Enum: `PAYMENT_GATEWAY`, `CLOUD_COMPUTE`, `DNS_ROUTER`, `AUTH_PROVIDER`, `DATABASE`, `API_BACKEND`, `FRONTEND_CLIENT`, `NOTIFICATION_SVC`.
  - `criticality`: Enum: `MISSION_CRITICAL` (Weight: 1.0), `HIGH` (Weight: 0.75), `MEDIUM` (Weight: 0.5), `LOW` (Weight: 0.25).
  - `provider_name`: External entity or internal squad (e.g., `Stripe, Inc.`).
  - `status_url`: Public status page or advisory URL (e.g., `https://status.stripe.com`).
  - `fallback_node_id`: Optional nullable identifier pointing to an alternate redundant node (e.g., `srv-razorpay-backup`).
  - `simulated_users_baseline`: Estimated concurrent active user cohort reliant on this node (e.g., `25,000`).
- **FR-01.3:** The system shall ship with a pre-configured, production-style reference profile: `PayPulse Fintech Stack` (12 nodes, 16 edges).

### FR-02: Interactive Dependency Graph Canvas (P0)
- **FR-02.1:** The system shall render an interactive directed graph using `React Flow`.
- **FR-02.2:** Directed edges shall denote dependency direction (`Node A -> Node B` signifies *Node A depends on Node B*; if Node B fails, Node A is downstream impacted).
- **FR-02.3:** Node visual state shall update dynamically based on system state:
  - **Healthy:** Green border and emerald pulse indicator (`#10B981`).
  - **Degraded:** Amber border and yellow caution indicator (`#F59E0B`).
  - **Failed:** Red border and crimson alarm pulse (`#EF4444`).
  - **Unknown / Unverified:** Slate grey muted border (`#64748B`).
- **FR-02.4:** Clicking a node shall open a flyout inspection drawer displaying node metadata, current operational status, direct upstream/downstream neighbors, and attached evidence records.
- **FR-02.5:** Graph state changes (simulated failure or mitigation switch) shall execute with fluid visual transitions without reloading the page.

### FR-03: TinyFish Web Intelligence Ingestion Pipeline (P0)
- **FR-03.1:** The backend shall provide a dedicated `TinyFishClient` adapter interacting with official TinyFish REST endpoints:
  - `TinySearch`: `GET https://api.search.tinyfish.ai` (Query Google's live web index for incident reports, news, tweets, and developer advisories).
  - `TinyFetch`: `POST https://api.fetch.tinyfish.ai` (Render status URLs via headless Chromium and return structured clean Markdown).
  - `TinyAgent`: `POST https://api.agent.tinyfish.ai` (Optional multi-step exploration for complex status portals).
- **FR-03.2:** The backend shall authenticate with TinyFish exclusively using the server-side environment variable `TINYFISH_API_KEY` via the `X-API-Key` request header.
- **FR-03.3:** The backend shall implement a resilient fallback mechanism: if `TINYFISH_API_KEY` is not configured, expired, or returns HTTP 429/5xx, the system shall seamlessly fall back to local verified fixtures (`fixtures/tinyfish_stripe_outage.json`) while flagging the UI badge as `FIXTURE REPLAY`.

### FR-04: News-First Early Warning Pipeline (P0)
- **FR-04.1:** The investigation engine shall execute queries structured as: `"{provider_name} status outage incident broken degraded"` filtered for recent signals.
- **FR-04.2:** Ingested signals shall capture:
  - `source_title`: Headline or page title.
  - `source_url`: Full verified target URL.
  - `publisher`: Domain or source entity (e.g., `techcrunch.com`, `downdetector.com`, `twitter.com`).
  - `published_at`: ISO-8601 publication timestamp (if extracted) or retrieval timestamp.
  - `raw_snippet`: Extracted text fragment quoting the incident.
  - `signal_type`: `NEWS_REPORT`, `COMMUNITY_ADVISORY`, or `OFFICIAL_STATUS`.

### FR-05: Evidence Verification & Normalization Engine (P0)
- **FR-05.1:** External evidence records shall be normalized into a unified `IncidentEvidence` schema.
- **FR-05.2:** Each evidence item shall be assigned a deterministic verification grade:
  - `OFFICIAL_CONFIRMED`: Status page explicitly reports *Major Outage* or *Degraded Performance*.
  - `NEWS_CORROBORATED`: Two or more independent external news/advisory signals corroborate disruption.
  - `UNVERIFIED_EARLY_WARNING`: Single news or social post without status page confirmation.
  - `REPLAY_HISTORICAL`: Pre-recorded historical incident used for simulation validation.
- **FR-05.3:** The system shall never fabricate evidence, confidence scores, or verification levels.

### FR-06: Incident-to-Dependency Mapping (P0)
- **FR-06.1:** When an incident signal is verified, the system shall evaluate graph nodes using:
  1. Exact domain match (`status_url` hostname matches evidence URL).
  2. Provider name alias match (e.g., "Stripe", "Stripe Inc", "api.stripe.com").
  3. Service category keyword match.
- **FR-06.2:** If confidence score $\ge 0.7$, the incident automatically links to the target node; otherwise, it is flagged for manual user confirmation in the UI.

### FR-07: Deterministic Digital Twin Simulation Engine (P0)
- **FR-07.1:** The backend shall construct a directed graph $G = (V, E)$ using `NetworkX`.
- **FR-07.2:** When Node $v_{target}$ enters state `FAILED` or `DEGRADED`, the engine shall compute:
  - **Direct Downstream Descendants:** Nodes having direct edges depending on $v_{target}$.
  - **Transitive Blast Radius:** Complete topological traversal of all reachable downstream nodes.
  - **Cascade Impact Score ($CIS$):** Formally computed as:
    $$CIS = \sum_{v \in BlastRadius} CriticalityWeight(v) \times SeverityFactor(v)$$
  - **Estimated Users at Risk ($EUR$):** Aggregate baseline user volume across impacted nodes deduplicated by dependency path.

### FR-08: Interactive What-If Scenario Sandbox (P0)
- **FR-08.1:** Users shall be able to click any node on the canvas and trigger a "Simulate Outage" toggle.
- **FR-08.2:** The canvas shall immediately update visually, dimming unaffected nodes, pulsing the failed node in red, and highlighting downstream cascade paths in amber.
- **FR-08.3:** A reset control shall restore the graph to baseline state in $< 100\text{ ms}$.

### FR-09: Recovery Mitigation Simulation (P0)
- **FR-09.1:** The simulation engine shall evaluate configured fallback nodes (e.g., switching primary gateway `srv-stripe-primary` to backup gateway `srv-razorpay-backup`).
- **FR-09.2:** Upon activating the mitigation lever, the engine shall recalculate the graph:
  - Downstream edges are dynamically re-routed to the fallback node.
  - Restored services transition from `FAILED` / `DEGRADED` back to `HEALTHY`.
  - Recalculated $CIS_{mitigated}$ and $EUR_{mitigated}$ are compared side-by-side with incident values.
- **FR-09.3:** The UI shall display a Before-and-After comparative metric banner:
  - Downstream Services Affected: $5 \rightarrow 1$ (80% recovery).
  - Users at Risk: $18,400 \rightarrow 1,200$ (93.5% reduction).
  - Est. Transaction Failure Rate: $32.4\% \rightarrow 1.8\%$.

### FR-10: Ranked Recovery Action Plan (P0)
- **FR-10.1:** The system shall generate a prioritized checklist of mitigation steps ranked by **Risk Reduction Ratio**:
  $$RankScore = \frac{\Delta CIS}{\text{Implementation Effort Score}}$$
- **FR-10.2:** Each action item shall specify: Step Title, Priority Badge (P0/P1), Expected Impact, Required Human Approval flag, and Step-by-Step Runbook execution guide.
- **FR-10.3:** The platform shall display an explicit disclaimer: *"Advisory Only — Human Approval Required Before Production Changes."*

### FR-11: Evidence-Grounded AI Incident Brief (P0)
- **FR-11.1:** The backend shall interface with Anthropic Claude 3.5 Sonnet to generate an executive-ready incident postmortem and tactical brief.
- **FR-11.2:** The prompt context sent to Claude shall strictly contain structured data:
  - Active verified evidence records with exact citation URLs.
  - Graph topological blast radius list.
  - Before-and-After simulation metrics.
- **FR-11.3:** If `ANTHROPIC_API_KEY` is unavailable or fails, a deterministic, schema-identical template generator shall format the markdown report instantly.

### FR-12: Historical Incident Replay Engine (P0)
- **FR-12.1:** The system shall provide a curated historical incident:
  - **Dataset:** *Stripe Global API Elevation Incident (Oct 2024)*.
  - **Primary Source:** `https://status.stripe.com/incidents` archive.
  - **Duration:** 88 minutes degradation affecting checkout authorization endpoints.
- **FR-12.2:** When running in Historical Replay mode, a persistent visual banner must appear across the top of the interface:
  `⚠️ HISTORICAL INCIDENT REPLAY — NOT A LIVE OUTAGE`

### FR-13: High-Fidelity Incident Operations Dashboard (P0)
- **FR-13.1:** The frontend shall render a dark-mode operations console with:
  - Top Navigation Bar: Environment selector, Live/Replay mode toggle, TinyFish API health indicator.
  - Left Canvas (65% width): React Flow dependency graph with zoom/pan and status legend.
  - Right Panel (35% width): Tabbed container displaying:
    1. *Live Evidence Stream:* Ingested signals with verification badges and clickable URLs.
    2. *Simulation & Recovery:* Blast radius metrics and interactive mitigation switches.
    3. *Incident Brief:* Markdown AI postmortem with one-click copy and export.
- **FR-13.2:** Execution logs from TinyFish and simulation passes shall stream to an embedded real-time console drawer.

### FR-14: Brand Guard Lookalike Domain Inspector (P2 - Bonus)
- **FR-14.1:** Users can input an external domain (e.g., `paypulse-verify.com`) to query TinySearch for phishing lookalikes.
- **FR-14.2:** Restricted to passive HTTP metadata extraction; zero automated takedowns or credential testing.

### FR-15: Internal Telemetry Anomaly Detection (P2 - Optional)
- **FR-15.1:** Basic moving average threshold detector on simulated synthetic latency metrics. Strictly marked as simulated.

---

## 4. Non-Functional Requirements (NFR)

### 4.1 Performance & Latency (NFR-01)
- **NFR-01.1:** Digital Twin graph simulation (propagation and mitigation delta) shall execute in $< 50\text{ ms}$ for graphs up to 50 nodes.
- **NFR-01.2:** Local API response time for all endpoints (excluding external web search) shall be $< 100\text{ ms}$ (p95).
- **NFR-01.3:** Frontend initial load and interactive time shall be $< 1.5\text{ seconds}$ on standard broadband.

### 4.2 Security, Safety & Privacy (NFR-02)
- **NFR-02.1:** Zero Production Mutation: The system shall not possess credentials or network pathways capable of modifying production DNS, firewalls, or cloud infrastructure.
- **NFR-02.2:** Secret Isolation: API keys (`TINYFISH_API_KEY`, `ANTHROPIC_API_KEY`) must reside exclusively on the backend in environment variables. Zero leakage into client bundles or git.
- **NFR-02.3:** Input Sanitization: All URLs supplied by users or scraped from external web sources must be validated against SSRF protection policies (blocking `127.0.0.1`, `169.254.169.254`, `localhost`, and internal RFC 1918 subnets).
- **NFR-02.4:** Prompt Injection Defense: Unstructured web text passed to Claude must be encapsulated in XML delimiter tags (`<untrusted_web_evidence>`) with system prompt guardrails.

### 4.3 Reliability & Graceful Degradation (NFR-03)
- **NFR-03.1:** The platform must maintain 100% core demo functionality if TinyFish API is disconnected or rate-limited, switching gracefully to local verified fixtures.
- **NFR-03.2:** The platform must maintain 100% core demo functionality if Anthropic Claude API is unreachable, falling back to deterministic template generation.

### 4.4 Usability & Aesthetics (NFR-04)
- **NFR-04.1:** UI must adhere to a sleek dark-mode operational theme (Tailwind Slate/Zinc/Emerald palette) avoiding clutter, garish neon gradients, or unfunctional mockup buttons.
- **NFR-04.2:** WCAG 2.1 Level AA color contrast compliance across text and status indicators.
