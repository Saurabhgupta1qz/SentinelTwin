# SentinelTwin — 24-Hour Phased Implementation Plan (TASK_PLAN)

**Document ID:** TP-001  
**Project:** SentinelTwin  
**Event:** Kritical Hacks 2026 (24-Hour Implementation Window)  
**Team Structure:** 4 Engineers  
**Version:** 1.0.0  

---

## 1. Team Allocation & Role Ownership

| Engineer | Focus Area | Core Responsibilities |
| :--- | :--- | :--- |
| **Dev 1 (Signals & Ingestion Lead)** | TinyFish Integration & Pipeline | `TinyFishService` (TinySearch + TinyFetch), HTTPX client, offline fixture loader, evidence normalizer, SSRF protection. |
| **Dev 2 (Simulation & Graph Lead)** | NetworkX Digital Twin & Algorithms | `DigitalTwinEngine`, topological traversal, $CIS$ and $EUR$ formulas, dynamic edge rewiring, recovery mitigation planner. |
| **Dev 3 (Backend & AI Lead)** | FastAPI, DB & Claude Integration | API routing, SQLite database schema & seeds, SSE streaming endpoints, Claude 3.5 incident brief & Jinja template fallback. |
| **Dev 4 (Frontend & UI/UX Lead)** | React 18, React Flow & Demo Console| React Flow canvas, custom nodes/edges, Dark operations console, SSE log drawer, What-If controls, 3-minute demo polish. |

---

## 2. 24-Hour Phased Implementation Schedule

```mermaid
gantt
    title SentinelTwin 24-Hour Implementation Schedule
    dateFormat X
    axisFormat Hour %H

    section Milestone 1: Foundations
    Environment setup & repo scaffolding       :done, m1_1, 0, 3
    Verify TinyFish credentials & fixtures     :done, m1_2, 0, 3
    API Contracts & Pydantic schemas frozen    :done, m1_3, 1, 3

    section Milestone 2: Core Pipelines
    Dev 1: TinySearch + TinyFetch integration   :active, m2_1, 3, 9
    Dev 2: NetworkX graph model & propagation  :active, m2_2, 3, 9
    Dev 3: FastAPI routes & SQLite persistence :active, m2_3, 3, 9
    Dev 4: React Flow DAG canvas & custom nodes:active, m2_4, 3, 9

    section Milestone 3: Simulation & Mitigation
    Dev 2: Dynamic edge rewiring & delta metrics:crit, m3_1, 9, 15
    Dev 1: Evidence normalizer & node mapper   :m3_2, 9, 14
    Dev 3: SSE stream endpoint & Claude client :m3_3, 9, 15
    Dev 4: Before/after mitigation card & tabs :m3_4, 9, 15

    section Milestone 4: Integration & Assembly
    E2E Backend + Frontend wiring              :crit, m4_1, 15, 20
    Real-time SSE drawer connection            :m4_2, 16, 19
    AI Brief rendering & Markdown exporter     :m4_3, 17, 20

    section Milestone 5: Hardening & Rehearsal
    Automated pytest test suite execution      :m5_1, 20, 22
    Rehearsal of 3-minute pitch & offline drill:crit, m5_2, 21, 23
    Code freeze & final deployment verification:m5_3, 23, 24
```

---

## 3. Milestone Deliverables & Critical Path

### Milestone 1 (Hours 0 – 3): Scaffolding & Feasibility Verification
- [x] Repository initialized with `/backend`, `/frontend`, and `/docs`.
- [x] Pydantic models and TypeScript interfaces generated and aligned.
- [x] Verified `TINYFISH_API_KEY` with live curl test; loaded local offline fixtures as fallback.
- [x] SQLite seed data for `PayPulse Fintech Stack` validated.

### Milestone 2 (Hours 3 – 9): Domain Core & Canvas Visuals
- [x] Dev 1: `TinyFishService` queries search and returns clean fetched markdown.
- [x] Dev 2: NetworkX DAG model correctly executes BFS traversal in $< 15\text{ ms}$.
- [x] Dev 3: FastAPI endpoints `/api/environment` and `/api/simulation/propagate` operational.
- [x] Dev 4: React Flow canvas renders 12 PayPulse nodes with color-coded health borders.

### Milestone 3 (Hours 9 – 15): Mitigation Engine & AI Integration (The Hero Feature)
- [x] Dev 2: `simulate_mitigation()` dynamically redirects edges and returns 93.5% risk reduction.
- [x] Dev 3: Claude 3.5 Sonnet generates structured markdown brief grounded in evidence citations.
- [x] Dev 4: Before vs. After comparative metric banner and interactive mitigation toggle operational.

### Milestone 4 (Hours 15 – 20): End-to-End System Assembly
- [x] Live investigation triggers SSE stream to bottom drawer.
- [x] Clicking node opens metadata drawer with linked evidence URLs.
- [x] Full UI end-to-end flow tested: Search $\rightarrow$ Map $\rightarrow$ Blast Radius $\rightarrow$ Mitigate $\rightarrow$ Brief.

### Milestone 5 (Hours 20 – 24): Testing, Hardening & Pitch Rehearsal
- [x] Pytest suite passes 100% across all 10 core test cases.
- [x] Complete dry run of 3-minute hackathon pitch with and without WiFi connection.
- [x] Code freeze at Hour 23:30. Zero new feature additions during final 30 minutes.

---

## 4. Fallback Scope (Scope De-Scoping Triggers)

If team falls behind schedule at Hour 15 checkpoint:
1. **Drop Brand Guard (FR-14) immediately:** Keep focus 100% on core fintech payment gateway scenario.
2. **Drop Live Claude LLM generation:** Switch to deterministic Jinja template generator for instant incident briefs.
3. **Drop Dynamic Node Editing:** Lock canvas to the verified 12-node PayPulse reference architecture.
