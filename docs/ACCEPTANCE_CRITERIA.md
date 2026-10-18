# SentinelTwin — Acceptance Criteria (AC)

**Document ID:** AC-001  
**Project:** SentinelTwin  
**Standard:** Gherkin (Given-When-Then) & Measurable Technical Thresholds  
**Version:** 1.0.0  

---

## 1. Overview & Evaluation Philosophy

Every requirement in SentinelTwin must meet explicit, automated, and human-verifiable acceptance criteria before being certified ready for production demo at Kritical Hacks 2026. Acceptance criteria are grouped by Functional Requirement (FR) and Non-Functional Requirement (NFR).

---

## 2. Measurable Acceptance Criteria by Feature

### AC-FR-01: Infrastructure Graph Definition
- **AC-01.1 (Graph Initialization):**
  - **Given** a user opens the application for the first time,
  - **When** the dashboard loads,
  - **Then** the pre-configured `PayPulse Fintech Stack` environment shall load automatically with exactly 12 nodes and 16 directed edges.
- **AC-01.2 (Node Schema Validation):**
  - **Given** any node in the environment,
  - **When** its JSON definition is validated against the Pydantic `ServiceNode` schema,
  - **Then** `id`, `name`, `category`, `criticality`, and `simulated_users_baseline` must be non-null and strictly typed.

### AC-FR-02: Interactive React Flow Canvas
- **AC-02.1 (Visual Rendering & Responsiveness):**
  - **Given** the 12-node DAG canvas,
  - **When** a user zooms or pans using mouse/trackpad,
  - **Then** rendering shall maintain a minimum of 50 FPS with zero layout jitter.
- **AC-02.2 (Node State Color Coding):**
  - **Given** an updated node status from the backend,
  - **When** the node state is `HEALTHY`, border must render `#10B981` (Emerald).
  - **When** the node state is `DEGRADED`, border must render `#F59E0B` (Amber).
  - **When** the node state is `FAILED`, border must render `#EF4444` (Red).
  - **When** the node state is `UNKNOWN`, border must render `#64748B` (Slate Grey).

### AC-FR-03 & AC-FR-04: TinyFish Live Intelligence & Early Warning
- **AC-03.1 (Live Web Signal Retrieval):**
  - **Given** a valid `TINYFISH_API_KEY` set in the environment,
  - **When** the user clicks "Start Live Investigation",
  - **Then** the backend must make a verified HTTP `GET` request to `https://api.search.tinyfish.ai` with header `X-API-Key`, returning $\ge 1$ structured result containing `title`, `url`, and `snippet`.
- **AC-03.2 (Status Page Fetch):**
  - **Given** an incident signal URL discovered by TinySearch,
  - **When** `TinyFetch` is invoked via `POST https://api.fetch.tinyfish.ai`,
  - **Then** the response must return structured clean Markdown without HTML tags, script elements, or advertising blocks.
- **AC-03.3 (Zero API Key Graceful Fallback):**
  - **Given** `TINYFISH_API_KEY` is empty, expired, or returns HTTP 429,
  - **When** an investigation is triggered,
  - **Then** the backend must complete the investigation in $< 1\text{ second}$ using verified local fixture `fixtures/tinyfish_stripe_outage.json`, streaming informative logs to the UI and setting the badge to `FIXTURE REPLAY` without error popups.

### AC-FR-05 & AC-FR-06: Evidence Verification & Node Mapping
- **AC-05.1 (Deterministic Verification Tagging):**
  - **Given** ingested evidence from an official status domain (`status.stripe.com`),
  - **When** the evidence normalizer evaluates the signal,
  - **Then** `verification_grade` must equal `OFFICIAL_CONFIRMED`.
  - **Given** an unverified news article or social post,
  - **Then** `verification_grade` must equal `UNVERIFIED_EARLY_WARNING`.
- **AC-06.1 (Automated Graph Node Linking):**
  - **Given** an incident referencing provider `Stripe`,
  - **When** the mapper evaluates graph nodes,
  - **Then** it must link specifically to `srv-stripe-primary` with a match confidence score $\ge 0.85$ and record the match rationale (`"Matched provider alias 'Stripe' and status_url 'status.stripe.com'"`).

### AC-FR-07 & AC-FR-08: NetworkX Digital Twin & What-If Simulation
- **AC-07.1 (Topological Traversal Accuracy):**
  - **Given** failure injected into `srv-stripe-primary`,
  - **When** `DigitalTwinEngine.propagate()` executes,
  - **Then** the returned `affected_nodes` list must contain exactly `srv-checkout-svc`, `srv-order-processing`, `srv-subscription-worker`, and `srv-customer-portal`, and must **not** contain independent nodes such as `srv-internal-db` or `srv-auth0-idp`.
- **AC-07.2 (Simulation Execution Speed):**
  - **Given** a 12-node, 16-edge graph,
  - **When** failure propagation executes,
  - **Then** computation time in NetworkX must be $< 15\text{ milliseconds}$.

### AC-FR-09 & AC-FR-10: Recovery Mitigation & Ranked Action Plan
- **AC-09.1 (Mitigation Delta Recalculation):**
  - **Given** an active simulated failure on `srv-stripe-primary`,
  - **When** the user applies the mitigation lever `FAILOVER_BACKUP` targeting `srv-razorpay-backup`,
  - **Then** the backend must return a side-by-side metric comparison proving:
    1. Impacted node count decreases by $\ge 70\%$ (e.g. $5 \rightarrow 1$).
    2. Estimated users at risk decreases by $\ge 85\%$ (e.g. $18,400 \rightarrow 1,200$).
- **AC-10.1 (Ranked Action Plan Integrity):**
  - **Given** generated recovery actions,
  - **When** inspected in the UI,
  - **Then** the highest-ranked action must be `Switch Primary Checkout Traffic to Backup Gateway (Razorpay)` with explicit tag `HUMAN APPROVAL REQUIRED: TRUE`.

### AC-FR-11: Evidence-Grounded AI Incident Brief
- **AC-11.1 (Source Citation Rigor):**
  - **Given** the generated Claude AI brief,
  - **When** the markdown text is parsed,
  - **Then** every external factual assertion must be accompanied by an exact, clickable markdown hyperlink `[Source](url)` matching an ingested evidence item.
- **AC-11.2 (Zero LLM Hallucination of Metrics):**
  - **Given** the generated brief,
  - **When** metrics are stated (e.g., "18,400 users at risk"),
  - **Then** the numbers must strictly match the deterministic simulation outputs from NetworkX.
- **AC-11.3 (Offline Template Fallback):**
  - **Given** `ANTHROPIC_API_KEY` is not present,
  - **When** the user clicks "Generate Brief",
  - **Then** a clean, complete report must render within $< 200\text{ ms}$ using the deterministic Jinja2/string template engine.

### AC-FR-12: Historical Incident Replay
- **AC-12.1 (Prominent Watermarking):**
  - **Given** the system is in Replay mode,
  - **When** any screen or brief is viewed,
  - **Then** the banner `⚠️ HISTORICAL INCIDENT REPLAY — NOT A LIVE OUTAGE` must be visibly rendered in bold amber across the viewport.

---

## 3. Non-Functional Acceptance Criteria

| Criteria ID | Category | Target Metric | Verification Method |
| :--- | :--- | :--- | :--- |
| **AC-NFR-01** | Performance | Backend graph simulation $< 50\text{ ms}$ | Automated pytest benchmark |
| **AC-NFR-02** | Security | Zero live production mutation capability | Architectural audit & env inspection |
| **AC-NFR-03** | Security | 100% SSRF mitigation on web fetches | Pytest with `127.0.0.1` and `169.254.169.254` payloads |
| **AC-NFR-04** | Security | Zero frontend exposure of API keys | Automated grep check of Vite build bundle |
| **AC-NFR-05** | Reliability | 100% demo pass rate in offline mode | E2E Playwright test with network disabled |
| **AC-NFR-06** | Usability | Dark mode contrast ratio $\ge 4.5:1$ (AA) | Lighthouse accessibility audit |
