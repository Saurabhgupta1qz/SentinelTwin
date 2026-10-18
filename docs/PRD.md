# SentinelTwin — Product Requirements Document (PRD)

**Document ID:** PRD-001  
**Project:** SentinelTwin  
**Hackathon:** Kritical Hacks 2026 (Track: Open Innovation — TinyFish Integrated)  
**Version:** 1.0.0  
**Status:** Approved for Phased Architecture & Implementation  
**Target Window:** 24-Hour Implementation Window  

---

## 1. Executive Summary

Modern digital businesses—fintech startups, e-commerce retailers, and educational institutions—operate on a fragile web of third-party cloud dependencies: payment gateways (Stripe, Razorpay), cloud compute (AWS, GCP), DNS routers (Cloudflare), identity providers (Auth0, Okta), and communication APIs (Twilio, SendGrid). 

When an external provider experiences an outage, internal systems fail catastrophically before engineering teams even realise the root cause is external. Existing status aggregators (such as StatusGator or IsDown) tell engineering teams that a service is down, but they fail to answer the critical questions:
- *Which of MY specific internal microservices, workflows, and user cohorts depend on this degraded provider?*
- *What is the blast radius propagation across my directed service graph?*
- *What deterministic recovery levers (e.g., failover routing to backup gateway) will restore service before user SLA breach?*
- *What verifiable public web evidence corroborates this incident?*

**SentinelTwin** bridges this gap. It connects live external web intelligence gathered via TinyFish to an organisation-specific infrastructure dependency graph. It simulates failure propagation deterministically using graph mathematics, quantifies business and workflow risks, and evaluates recovery alternatives in a digital twin sandbox **without modifying production infrastructure**.

```
+------------------+      +-------------------+      +-------------------+      +------------------+
|  LIVE WEB SIGNAL | ---> | VERIFIED EVIDENCE | ---> | IMPACT SIMULATION | ---> |  RECOVERY PLAN   |
| (News/Advisories)|      | (Status/Page DOM) |      | (Blast Radius/DAG)|      | (Ranked Levers)  |
+------------------+      +-------------------+      +-------------------+      +------------------+
```

---

## 2. Product Identity & Core Value Proposition

- **Project Name:** SentinelTwin
- **One-Line Pitch:** *"Other tools tell you a provider is down. SentinelTwin tells you what it means for YOUR business, and tests the recovery before your users feel it."*
- **Primary Tagline:** *"Know the risk. Simulate the impact. Prepare the recovery."*
- **Target Audience:**
  1. Small and medium-sized fintech and e-commerce engineering teams (P0).
  2. SRE / DevOps incident responders (P0).
  3. Campus IT administrators managing academic infrastructure (P1).
  4. Managed Service Providers (MSPs) supporting multi-client operations (P2).

### 2.1 Competitive Differentiation Matrix

| Capability | Generic Status Aggregators (StatusGator, IsDown) | Traditional APM / Synthetics (Datadog, New Relic) | SentinelTwin |
| :--- | :--- | :--- | :--- |
| **External Incident Discovery** | Polls official RSS/status endpoints | Internal synthetic check alerts | **News-First TinyFish Search + Status Page Fetch** |
| **Early Warning Delta** | High latency (waits for official status update) | Immediate internal failure detection | **Minutes ahead via public news & social incident posts** |
| **Internal Graph Mapping** | None (global provider view only) | High overhead (requires agents on all servers) | **Zero-agent, DAG-based configuration** |
| **Propagation Modeling** | None | Post-hoc tracing only | **Deterministic NetworkX Digital Twin propagation** |
| **Recovery Simulation** | None | None | **Interactive mitigation sandbox (e.g. backup gateway switch)** |
| **Production Risk** | Read-only | Agent performance overhead | **100% Safe Decision Support (Zero production mutation)** |
| **Audit & Governance** | Minimal | High complexity | **Evidence-grounded AI Incident Brief with sources & provenance** |

---

## 3. Product Vision & Principles

1. **Defensive Decision Support Only:** SentinelTwin provides intelligence, simulation, and recommendation. It **never** mutates production routing, DNS, database records, or gateway configurations.
2. **Absolute Data Provenance:** Every metric and card on the dashboard must be explicitly classified as **Real**, **Computed**, or **Simulated**. Zero phantom metrics.
3. **News-First Early Warning:** Provider status pages often lag 20–45 minutes behind real outages. Public news, incident reports, and developer advisories are treated as early signals, cross-referenced with official pages.
4. **Deterministic Simulation:** Impact propagation must be based on transparent, mathematical graph traversal (BFS/DFS downstream propagation with edge weights and criticality multipliers), not ungrounded LLM hallucinations.
5. **Fail-Safe Offline Resilience:** If external APIs (TinyFish, Anthropic) or internet connectivity fail during a demo or incident, deterministic historical fixtures and offline replay ensure uninterrupted operational continuity.

---

## 4. Key Personas

### Persona A: Sarah — Lead SRE at Fictional Fintech "PayPulse"
- **Context:** PayPulse processes $500k/hr via Stripe, with an idle secondary backup gateway (Razorpay). 
- **Pain Point:** When Stripe's tokenization endpoint began throwing 502 errors during an unannounced AWS us-east-1 network glitch, PayPulse discovered it 22 minutes later through user checkout drop-offs.
- **SentinelTwin Goal:** Detect early signals via TinySearch/TinyFetch within 2 minutes, map the failure to `CheckoutService` and `SubscriptionWorker`, simulate failover to Razorpay, and verify that 94% of transaction drop-off is mitigated before approving the failover.

### Persona B: Alex — CTO of a Mid-Market E-Commerce Brand
- **Context:** Manages a lean 6-person engineering team. Cannot afford enterprise Datadog or Chaos Engineering suites.
- **Pain Point:** Lacks visibility into how external outages (Cloudflare DNS, SendGrid, Shopify API) cascade into internal cart abandonment.
- **SentinelTwin Goal:** Upload or configure an intuitive 12-node dependency graph, test "What-If" failure scenarios during architecture reviews, and generate executive incident reports with single-click AI summaries.

---

## 5. Scope & Feature Boundaries

### 5.1 In-Scope for 24-Hour Hackathon (MVP - P0)
- **FR-01 Infrastructure Configuration:** Interactive canvas supporting 10–15 nodes with service roles, criticalities, and fallback linkages. Pre-configured with the "PayPulse Fintech" reference architecture.
- **FR-02 Interactive Dependency Graph:** React Flow directed acyclic graph (DAG) visualising healthy (green), degraded (amber), failed (red), and unknown (grey) states.
- **FR-03 TinyFish External Intelligence Integration:** Real backend integration with `TinySearch` (news/incident discovery) and `TinyFetch` (status page and advisory verification).
- **FR-04 News-First Early Warning Pipeline:** Ingestion and normalization of early incident signals with source URLs, publication timestamps, and extraction snippets.
- **FR-05 Evidence Verification & Normalization:** Internal incident schema ranking evidence confidence (Unverified News, Corroborated Official, Replay/Fixture).
- **FR-06 Incident-to-Dependency Mapper:** Fuzzy and alias-based matching connecting external incident reports to internal graph nodes with explainable rationale.
- **FR-07 NetworkX Digital Twin Engine:** Deterministic graph failure propagation modeling direct and indirect downstream impacts.
- **FR-08 Interactive What-If Scenario Simulator:** Manual failure injection on any node with real-time blast-radius calculation.
- **FR-09 Recovery Mitigation Simulation:** Pre-configured mitigation lever (failover from Primary Stripe Gateway to Secondary Razorpay Gateway) with before-and-after metric deltas.
- **FR-10 Ranked Recovery Action Plan:** Deterministic rule-based ranking of mitigation steps based on criticality, difficulty, and risk reduction.
- **FR-11 Grounded AI Incident Brief:** Claude 3.5 Sonnet / deterministic fallback report synthesising timeline, graph blast radius, recovery options, and evidence citations.
- **FR-12 Historical Incident Replay:** Verified historical outage dataset (Stripe Oct 2024 elevated error rates) clearly watermarked as `HISTORICAL INCIDENT REPLAY — NOT A LIVE OUTAGE`.
- **FR-13 High-Fidelity Dark Operations Console:** Responsive UI with real-time SSE stream/activity logs, metric cards, and split-screen comparison.

### 5.2 Out-of-Scope (Explicit Non-Goals for 24h Window)
- **Automatic Production Execution:** No webhooks or AWS/Cloudflare API calls that automatically toggle live DNS or traffic.
- **Multi-Tenant RBAC / Auth:** Single-tenant local operational workstation model for hackathon demo.
- **Automated Domain Takedowns:** Brand Guard (P2) is strictly limited to passive domain lookup; no automated abuse reports or legal takedowns.
- **Continuous Background Heartbeat Monitoring:** Real-time cron daemons polling 500+ services continuously (reserved for post-hackathon roadmap).

---

## 6. Success Metrics & Key Performance Indicators (KPIs)

1. **Investigation Turnaround Time:** Full TinyFish search + fetch + evidence extraction completes in $< 8\text{ seconds}$ on live API, or $< 500\text{ ms}$ on cached/fixture fallback.
2. **Simulation Computation Latency:** NetworkX propagation and mitigation delta calculation completes in $< 50\text{ ms}$ for a 15-node, 25-edge graph.
3. **Evidence Citation Rigour:** 100% of reported incidents cite a verified domain URL, timestamp, and raw snippet quote.
4. **Demo Reliability:** Deterministic offline mode ensures zero broken states or runtime crashes during live 3-minute hackathon judging.
5. **Zero Phantom Metrics:** 100% compliance with Data Provenance badges (Real, Computed, Simulated).
