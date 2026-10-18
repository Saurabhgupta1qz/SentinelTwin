# SentinelTwin — Use Cases & User Journeys

**Document ID:** UC-001  
**Project:** SentinelTwin  
**Version:** 1.0.0  

---

## 1. System Actors

| Actor ID | Actor Role | Description |
| :--- | :--- | :--- |
| **ACT-01** | **Incident Commander (SRE Lead)** | Primary operator responding to real-time alerts or investigating degraded service performance. Initiates live investigations, inspects blast radius, and decides on recovery actions. |
| **ACT-02** | **DevOps / Infrastructure Engineer** | Models and configures the organization's infrastructure dependency graph, service criticalities, and fallback linkages. Runs what-if chaos drills. |
| **ACT-03** | **Engineering Executive (VP/CTO)** | Consumes executive incident briefs, evaluates risk summaries, and reviews before-and-after mitigation numbers for stakeholder communication. |
| **ACT-04** | **Automated Intelligence Agent (TinyFish)** | Autonomous external service querying web search, fetching status pages, extracting clean evidence markdown, and feeding signals to SentinelTwin backend. |

---

## 2. Core User Stories

| ID | As a... | I want to... | So that... | Priority |
| :--- | :--- | :--- | :--- | :--- |
| **US-01** | SRE Lead | Ingest live news and status signals for my external vendors via TinyFish | I learn about third-party outages minutes before my internal alerts trigger. | **P0** |
| **US-02** | DevOps Engineer | Define a directed dependency graph linking internal services to external SaaS/cloud providers | I can clearly visualize upstream dependencies and downstream failure paths. | **P0** |
| **US-03** | SRE Lead | See external incident evidence linked directly to the impacted node on my graph | I can verify whether an alleged outage actually affects our specific infrastructure component. | **P0** |
| **US-04** | SRE Lead | Simulate downstream cascade impact when an external provider fails | I understand which business-critical user flows (e.g., checkout, login) are at immediate risk. | **P0** |
| **US-05** | Incident Commander | Test a recovery mitigation action (e.g., toggle to backup payment gateway) in the digital twin | I can verify that the mitigation resolves the blast radius before executing it in production. | **P0** |
| **US-06** | Engineering Exec | Generate an evidence-grounded incident postmortem brief with verified source citations | I can immediately brief executive leadership and customers with accurate, unhallucinated facts. | **P0** |
| **US-07** | Hackathon Judge | Run a deterministic replay of a verified historical outage when no live outage is occurring | I can evaluate the complete end-to-end platform capabilities reliably within 3 minutes. | **P0** |

---

## 3. Detailed Use Case Specifications

### UC-01: Ingest Live Incident Intelligence & Map to Internal Graph
- **Primary Actor:** ACT-01 (Incident Commander).
- **Preconditions:** SentinelTwin dashboard is open; `PayPulse Fintech Stack` is loaded.
- **Trigger:** User clicks the **"Start Live Investigation"** button on the console navigation bar.
- **Main Success Scenario:**
  1. Frontend sends `POST /api/investigation/start` to backend.
  2. Backend triggers `TinyFishService.run_investigation()` which dispatches queries to `TinySearch` for configured external providers (Stripe, AWS, Cloudflare, Auth0).
  3. Real-time execution logs stream back via Server-Sent Events (SSE) to the frontend activity console (`"Querying TinySearch for 'Stripe status outage'..."`).
  4. TinySearch discovers an active incident signal; backend invokes `TinyFetch` to extract clean markdown from `https://status.stripe.com`.
  5. Backend `EvidenceNormalizer` parses the raw evidence, assigns verification grade `OFFICIAL_CONFIRMED`, and maps the signal to node `srv-stripe-primary`.
  6. Graph canvas dynamically transitions node `srv-stripe-primary` into `DEGRADED` (amber) or `FAILED` (red).
  7. Evidence panel highlights the new signal with clickable source URL, timestamp, and excerpt.
- **Alternative Flow (Offline / Rate-Limited):**
  - If TinyFish API returns an error or no active outage is discovered, the backend logs `"Live web query clear. Offering 1-click Historical Replay."` The user toggles `Historical Incident Replay` and the scenario continues deterministically using verified historical fixtures.

### UC-02: Deterministic Blast Radius Simulation & What-If Analysis
- **Primary Actor:** ACT-02 (DevOps Engineer).
- **Preconditions:** Infrastructure graph is loaded with 12 nodes.
- **Trigger:** User clicks on `srv-stripe-primary` and toggles **"Simulate Outage"**.
- **Main Success Scenario:**
  1. Frontend invokes `POST /api/simulation/propagate` with target `srv-stripe-primary` and severity `1.0`.
  2. Backend `DigitalTwinEngine` runs topological BFS across directed edges in NetworkX.
  3. Traversal flags downstream dependent nodes:
     - Direct: `srv-checkout-svc` (Mission Critical).
     - Transitive: `srv-order-processing` (High), `srv-subscription-worker` (Medium), `srv-customer-portal` (Low).
  4. Calculation computes:
     - Cascade Impact Score ($CIS$): $4.85 / 5.0$.
     - Estimated Users at Risk ($EUR$): 18,400 active checkout sessions.
     - Simulated Transaction Failure Rate: 34.2%.
  5. Graph canvas dynamically paints impacted nodes in amber/red with animated dashed edge flows indicating failure direction.
  6. Impact summary card updates with calculated metrics and data provenance tag `[COMPUTED MODEL]`.

### UC-03: Recovery Mitigation Testing & Before-and-After Comparison
- **Primary Actor:** ACT-01 (Incident Commander).
- **Preconditions:** Outage simulation is active; blast radius shows 5 affected services.
- **Trigger:** User selects mitigation lever **"Activate Razorpay Secondary Failover"** and clicks **"Test Mitigation"**.
- **Main Success Scenario:**
  1. Frontend invokes `POST /api/simulation/mitigate` with payload `{"failed_node": "srv-stripe-primary", "action": "FAILOVER_BACKUP", "target_node": "srv-razorpay-backup"}`.
  2. Backend dynamically alters graph edges in the simulation memory model:
     - `srv-checkout-svc` dependency switches from `srv-stripe-primary` to `srv-razorpay-backup`.
     - `srv-razorpay-backup` transitions to `HEALTHY_ACTIVE`.
  3. `DigitalTwinEngine` recalculates downstream graph paths:
     - `srv-checkout-svc`, `srv-order-processing`, and `srv-customer-portal` return to `HEALTHY` (green).
     - Only `srv-subscription-worker` remains degraded (due to non-migrated recurring billing webhooks).
  4. Frontend displays comparative **Before vs. After** recovery metrics:
     - Impacted Services: $5 \rightarrow 1$ (80% recovery).
     - Users at Risk: $18,400 \rightarrow 1,200$ (93.5% reduction).
     - Simulated Failure Rate: $34.2\% \rightarrow 1.8\%$.
  5. Recovery Action Plan highlights the exact production command runbook required for human approval.

### UC-04: Generate Evidence-Grounded AI Incident Brief
- **Primary Actor:** ACT-03 (Engineering Executive).
- **Preconditions:** Investigation evidence gathered and recovery mitigation evaluated.
- **Trigger:** User clicks **"Generate AI Incident Brief"** tab.
- **Main Success Scenario:**
  1. Frontend invokes `POST /api/reports/generate`.
  2. Backend aggregates verified evidence citations, graph blast radius data, and recovery calculation deltas into an XML-delimited prompt sent to Claude 3.5 Sonnet.
  3. Claude responds with a structured Markdown report featuring:
     - Executive Overview.
     - Root Cause & Verified Source Citations (with markdown links).
     - Topological Blast Radius Breakdown.
     - Evaluated Recovery Options & Metric Deltas.
     - Human-Approval Action Plan & SRE Recommendations.
  4. Frontend renders the formatted brief with instant "Export Markdown" and "Copy to Clipboard" buttons.

---

## 4. End-to-End User Journey Map (3-Minute Hackathon Demo)

```mermaid
journey
    title 3-Minute SentinelTwin Hackathon Journey
    section 1. Context & Setup (0:00 - 0:45)
      Open SentinelTwin Dark Console: 5: Incident Commander
      Inspect 12-Node PayPulse Fintech Stack: 5: Incident Commander
      Review Healthy Graph Baseline: 5: Incident Commander
    section 2. Live Intelligence & Outage (0:45 - 1:30)
      Trigger TinyFish Web Investigation: 5: Incident Commander, TinyFish
      Stream Real-Time Activity Logs: 5: Incident Commander
      Ingest Verified Stripe Outage Evidence: 5: Incident Commander, TinyFish
      View Graph Auto-Update & Blast Radius: 5: Incident Commander
    section 3. Digital Twin Recovery (1:30 - 2:30)
      Inspect 5 Impacted Services ($500k/hr at risk): 4: Incident Commander
      Select "Razorpay Failover" Mitigation Lever: 5: Incident Commander
      Run Mitigation Simulation: 5: Incident Commander
      Marvel at 93.5% Risk Reduction Banner: 5: Incident Commander, Judges
    section 4. AI Brief & Governance (2:30 - 3:00)
      Generate Evidence-Grounded Incident Brief: 5: Incident Commander, Claude
      Verify Grounded URLs & Zero Production Mutation: 5: Incident Commander, Judges
```
