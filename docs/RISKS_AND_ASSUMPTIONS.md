# SentinelTwin — Technical Risks, Assumptions & Mitigation Matrix (RISKS_AND_ASSUMPTIONS)

**Document ID:** RISK-001  
**Project:** SentinelTwin  
**Version:** 1.0.0  

---

## 1. Technical Risk Assessment & Mitigation Matrix

| Risk ID | Category | Risk Description | Severity | Likelihood | Pre-Emptive Mitigation & Plan B |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RSK-01** | External API | TinyFish wallet credits exhausted or rate limit (HTTP 429) hit during live presentation. | **CRITICAL** | Medium | **Dual-Mode Adapter:** Automatic fallback to verified local static fixture (`fixtures/tinyfish_stripe_outage.json`). UI gracefully labels output as `FIXTURE REPLAY`. |
| **RSK-02** | Live Outage | No major cloud or payment provider experiences a live public outage during the hackathon judging window. | **HIGH** | High | **Historical Replay Engine:** Curated and verified historical outage dataset (Stripe Oct 2024 outage) accessible via a single navbar toggle with prominent historical watermark. |
| **RSK-03** | LLM Reliability | Anthropic Claude 3.5 API latency spike ($> 10\text{s}$) or server error during report generation. | **MEDIUM** | Medium | **Deterministic Jinja2 Fallback:** System automatically swaps to local markdown template generator if response is not returned within 3.5 seconds. |
| **RSK-04** | Security | Ingested third-party news or status pages contain prompt injection targeting LLM brief generator. | **HIGH** | Low | **XML Delimiter Isolation & System Prompt Hardening:** All untrusted web content is placed inside `<untrusted_web_evidence>` tags with explicit model instructions forbidding prompt overrides. |
| **RSK-05** | Security | SSRF vulnerability allowing attacker to probe localhost or AWS cloud metadata (`169.254.169.254`). | **CRITICAL** | Low | **SSRFProtector Middleware:** Strict DNS resolution check that intercepts and blocks requests to loopback (`127.0.0.0/8`), RFC 1918 private subnets, and link-local addresses. |
| **RSK-06** | Scope Creep | Team spends excessive time on bonus features (Brand Guard or Anomaly Detection), jeopardizing core DAG demo. | **HIGH** | Medium | **Strict Milestone Cutoff:** Brand Guard (FR-14) and Anomaly Detection (FR-15) are strictly classified as P2. They are blocked from implementation until P0 end-to-end integration passes tests. |

---

## 2. Explicit Operational Assumptions

1. **Local Workstation Prototype:** Designed as a single-user operational console running locally on `localhost:8000` / `localhost:5173` without complex multi-tenant enterprise IAM.
2. **Deterministic Graph Semantics:** The infrastructure dependency graph is modeled as a Directed Acyclic Graph (DAG) with known service weights and baseline concurrent active users.
3. **Decision-Support Isolation:** SentinelTwin never executes direct API or CLI mutations on customer production infrastructure. All recovery runbooks are generated for human review and approval.
4. **Data Provenance Integrity:** Every metric on the dashboard must be explicitly categorized as **Real**, **Computed**, or **Simulated** to prevent false claims during judging.

---

## 3. Open Technical Questions & Resolution Plan

| Open Question | Impact | Resolution Strategy |
| :--- | :--- | :--- |
| **Q1:** Does TinySearch return Google rank-stable indices consistently across regions? | Investigation results may vary between team member laptops. | Enforce `"location": "US", "language": "en"` in all search requests. |
| **Q2:** What happens if a user configures a cyclical dependency edge in the graph? | BFS propagation could enter infinite recursion if not guarded. | NetworkX `nx.is_directed_acyclic_graph(G)` validation checks prevent cyclical edge creation on the canvas. |
| **Q3:** How does the system handle status pages behind Cloudflare Turnstile / CAPTCHAs? | Headless browser fetch may return 403 or challenge page. | TinyFetch handles basic bot mitigation; if challenge persists, the system flags the source as `CHALLENGE_BLOCKED` and relies on TinySearch news snippets. |
