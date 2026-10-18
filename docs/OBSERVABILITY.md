# SentinelTwin — Observability, Logging & Diagnostics (OBSERVABILITY)

**Document ID:** OBS-001  
**Project:** SentinelTwin  
**Logging Standard:** Structured JSON Logging + Real-Time Server-Sent Events (SSE)  
**Version:** 1.0.0  

---

## 1. Observability Architecture

In high-stress incident response, transparency and execution auditability are paramount. SentinelTwin implements a three-tier observability stack:

```
+-------------------------------------------------------------------------------+
|                             OBSERVABILITY STACK                               |
|                                                                               |
|  [Tier 1: SRE Console Drawer]   [Tier 2: Structured JSON Logs]   [Tier 3: Provenance Badges]|
|  - Real-time SSE event stream   - Timestamp, level, correlation  - Visual UI origin badges  |
|  - Visible to operators during   - Rotated file and stdout       - REAL vs COMPUTED vs      |
|    live investigation           - Traceable run_id               - SIMULATED vs REPLAY      |
+-------------------------------------------------------------------------------+
```

---

## 2. Structured Log Schema (Backend)

All backend events emit structured JSON log entries using Python's standard `logging` library configured with a custom JSON formatter:

```json
{
  "timestamp": "2026-10-18T09:14:24.120Z",
  "level": "INFO",
  "logger": "sentineltwin.investigation",
  "run_id": "inv-20261018-091422",
  "event": "TINYSEARCH_QUERY_SUCCESS",
  "provider": "Stripe, Inc.",
  "query": "Stripe status outage degradation",
  "results_count": 3,
  "top_hit_domain": "status.stripe.com",
  "duration_ms": 342,
  "provenance": "REAL_WEB_SIGNAL"
}
```

---

## 3. Server-Sent Events (SSE) Activity Stream Protocol

The frontend execution drawer connects to `/api/investigation/stream/{run_id}` to display live crawler actions.

### Event Types & Payloads:

| Event Name | Purpose | Example Payload |
| :--- | :--- | :--- |
| `log` | Informational crawler step | `{"message": "Querying TinySearch for AWS..."}` |
| `evidence_discovered` | Raw signal found | `{"title": "Stripe Outage", "url": "..."}` |
| `evidence_verified` | Evaluated by normalizer | `{"id": "evi-01", "grade": "OFFICIAL_CONFIRMED"}` |
| `node_updated` | Graph canvas node transition | `{"node_id": "srv-stripe-primary", "status": "FAILED"}` |
| `simulation_complete` | Blast radius calculated | `{"affected_count": 5, "cis": 4.85}` |
| `error` | Graceful warning/error | `{"code": "RATE_LIMIT", "fallback": "FIXTURE_LOADED"}` |

---

## 4. Data Provenance Policy & Tagging Standards

To eliminate hallucination and false representation, every data point exposed to the user or API consumer must carry an immutable provenance tag:

- **`REAL`**: Retrieved from live web queries via TinyFish or verified third-party status APIs.
- **`COMPUTED`**: Derived through deterministic mathematical graph algorithms in NetworkX (e.g. shortest paths, topological descendants, Cascade Impact Score).
- **`SIMULATED`**: Synthetic assumptions (e.g. baseline concurrent user counts, hypothetical financial loss estimates).
- **`HISTORICAL_REPLAY`**: Verified historical outage data (e.g. Stripe Oct 2024 outage) explicitly replayed for drill purposes.
