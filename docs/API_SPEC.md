# SentinelTwin — Backend REST & SSE API Specification (API_SPEC)

**Document ID:** API-001  
**Project:** SentinelTwin  
**Protocol:** HTTP/1.1 & HTTP/2 REST + Server-Sent Events (SSE)  
**Base URL:** `http://localhost:8000/api`  
**OpenAPI Interactive Docs:** `http://localhost:8000/docs`  
**Version:** 1.0.0  

---

## 1. Overview & Standard Headers

All REST endpoints consume and emit `application/json` unless explicitly typed as `text/event-stream`. Standard response codes follow RFC 7231.

### Common Response Headers
- `Content-Type`: `application/json` (or `text/event-stream` for live logs)
- `X-Sentinel-Version`: `1.0.0`
- `X-Data-Provenance`: Indicates whether returned payload is `REAL`, `COMPUTED`, or `SIMULATED`.

---

## 2. API Endpoint Matrix

| Method | Endpoint | Description | Provenance |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Healthcheck and external API availability status | REAL |
| `GET` | `/api/environment` | Retrieve active infrastructure stack (nodes & edges) | REAL / PERSISTED |
| `POST` | `/api/environment/reset` | Reset stack to reference PayPulse 12-node baseline | REAL |
| `POST` | `/api/environment/nodes` | Add or update a service node in the graph | REAL |
| `POST` | `/api/investigation/start` | Start live TinyFish web investigation (returns run ID) | REAL |
| `GET` | `/api/investigation/stream/{run_id}` | SSE stream of real-time activity and crawler logs | REAL / STREAM |
| `GET` | `/api/investigation/evidence` | Get all verified evidence items for active incident | REAL / REPLAY |
| `POST` | `/api/investigation/replay` | Load verified historical incident replay (Stripe Oct 2024)| REPLAY |
| `POST` | `/api/simulation/propagate` | Inject failure on a node and compute DAG blast radius | COMPUTED |
| `POST` | `/api/simulation/mitigate` | Evaluate a recovery action (e.g. gateway switch) | COMPUTED |
| `POST` | `/api/reports/generate` | Generate grounded Claude 3.5 AI incident brief | REAL / LLM |

---

## 3. Endpoint Specifications

### 3.1 Health Check (`GET /api/health`)
Returns backend operational status and connectivity state of external APIs.

#### Response `200 OK`
```json
{
  "status": "HEALTHY",
  "version": "1.0.0",
  "database": "CONNECTED",
  "external_integrations": {
    "tinyfish": {
      "configured": true,
      "mode": "LIVE_API"
    },
    "anthropic": {
      "configured": true,
      "mode": "LIVE_CLAUDE_3_5"
    }
  },
  "active_environment": "env-paypulse-fintech"
}
```

---

### 3.2 Get Environment (`GET /api/environment`)
Returns current nodes and directed edges formatted for React Flow canvas.

#### Response `200 OK`
```json
{
  "id": "env-paypulse-fintech",
  "name": "PayPulse Fintech Stack",
  "description": "Production reference stack with primary Stripe and standby Razorpay gateways",
  "nodes": [
    {
      "id": "srv-stripe-primary",
      "name": "Stripe Payments Gateway",
      "category": "PAYMENT_GATEWAY",
      "criticality": "MISSION_CRITICAL",
      "provider_name": "Stripe, Inc.",
      "status_url": "https://status.stripe.com",
      "fallback_node_id": "srv-razorpay-backup",
      "simulated_users_baseline": 25000,
      "status": "HEALTHY",
      "position": { "x": 100, "y": 200 }
    },
    {
      "id": "srv-checkout-svc",
      "name": "Checkout Microservice",
      "category": "API_BACKEND",
      "criticality": "MISSION_CRITICAL",
      "provider_name": "Internal Engineering",
      "status_url": null,
      "fallback_node_id": null,
      "simulated_users_baseline": 22000,
      "status": "HEALTHY",
      "position": { "x": 350, "y": 200 }
    }
  ],
  "edges": [
    {
      "id": "edge-checkout-stripe",
      "source": "srv-checkout-svc",
      "target": "srv-stripe-primary",
      "is_hard_dependency": true,
      "label": "processes card tokens"
    }
  ]
}
```

---

### 3.3 Start Investigation (`POST /api/investigation/start`)
Initiates asynchronous discovery using TinySearch and TinyFetch across all configured third-party nodes.

#### Request Body
```json
{
  "mode": "LIVE_WEB",
  "target_providers": ["Stripe, Inc.", "Cloudflare", "AWS", "Auth0"]
}
```

#### Response `202 Accepted`
```json
{
  "run_id": "inv-20261018-091422",
  "status": "STARTED",
  "stream_url": "/api/investigation/stream/inv-20261018-091422",
  "message": "Investigation dispatched to TinyFish intelligence layer."
}
```

---

### 3.4 Stream Investigation Logs (`GET /api/investigation/stream/{run_id}`)
Server-Sent Events endpoint pushing progress messages, external web signals, and graph updates.

#### Event Stream Protocol (`text/event-stream`)
```
event: log
data: {"timestamp": "2026-10-18T09:14:23Z", "level": "INFO", "message": "Initiating TinySearch queries for 4 providers..."}

event: log
data: {"timestamp": "2026-10-18T09:14:24Z", "level": "INFO", "message": "TinySearch hit: 'Elevated API 500 error rates on v1/charges' (domain: status.stripe.com)"}

event: evidence
data: {"id": "evi-001", "source_title": "Stripe API Elevated Errors", "source_url": "https://status.stripe.com", "verification_grade": "OFFICIAL_CONFIRMED", "snippet": "We are experiencing elevated 500 error rates when creating charges..."}

event: incident_mapped
data: {"node_id": "srv-stripe-primary", "status": "DEGRADED", "confidence": 0.95, "rationale": "Direct domain match with status_url"}

event: complete
data: {"status": "FINISHED", "total_evidence": 3, "affected_nodes_count": 1}
```

---

### 3.5 Failure Propagation Simulation (`POST /api/simulation/propagate`)
Calculates topological blast radius, cascade score, and estimated users at risk.

#### Request Body
```json
{
  "root_cause_node_id": "srv-stripe-primary",
  "severity_factor": 1.0,
  "simulate_internal_cascades": true
}
```

#### Response `200 OK`
```json
{
  "provenance": "COMPUTED_GRAPH_MODEL",
  "root_cause_node_id": "srv-stripe-primary",
  "root_cause_node_name": "Stripe Payments Gateway",
  "total_affected_services": 5,
  "cascade_impact_score": 4.85,
  "estimated_users_at_risk": 18400,
  "affected_node_ids": [
    "srv-checkout-svc",
    "srv-order-processing",
    "srv-subscription-worker",
    "srv-customer-portal"
  ],
  "impacted_nodes": [
    {
      "node_id": "srv-checkout-svc",
      "name": "Checkout Microservice",
      "criticality": "MISSION_CRITICAL",
      "cascade_score": 1.0,
      "simulated_users_at_risk": 22000
    },
    {
      "node_id": "srv-order-processing",
      "name": "Order Engine & Webhooks",
      "criticality": "HIGH",
      "cascade_score": 0.75,
      "simulated_users_at_risk": 18000
    }
  ],
  "propagation_paths": [
    ["srv-stripe-primary", "srv-checkout-svc"],
    ["srv-stripe-primary", "srv-checkout-svc", "srv-order-processing"],
    ["srv-stripe-primary", "srv-checkout-svc", "srv-customer-portal"]
  ]
}
```

---

### 3.6 Recovery Mitigation Testing (`POST /api/simulation/mitigate`)
Evaluates dynamic edge re-routing to redundant fallback services and outputs comparative deltas.

#### Request Body
```json
{
  "failed_node_id": "srv-stripe-primary",
  "mitigation_action": "FAILOVER_BACKUP",
  "target_fallback_id": "srv-razorpay-backup"
}
```

#### Response `200 OK`
```json
{
  "provenance": "COMPUTED_GRAPH_MODEL",
  "mitigation_lever": "Switch Primary Checkout Traffic to Backup Gateway (Razorpay)",
  "baseline_metrics": {
    "affected_services": 5,
    "cascade_impact_score": 4.85,
    "users_at_risk": 18400,
    "estimated_tx_failure_rate": 34.2
  },
  "mitigated_metrics": {
    "affected_services": 1,
    "cascade_impact_score": 1.0,
    "users_at_risk": 1200,
    "estimated_tx_failure_rate": 1.8
  },
  "delta": {
    "service_recovery_percentage": 80.0,
    "user_risk_reduction_percentage": 93.48,
    "failure_rate_reduction_percentage": 94.74
  },
  "ranked_action_plan": [
    {
      "priority": "P0",
      "title": "Enable Razorpay Secondary Gateway Route",
      "expected_impact": "Restores 93.5% of checkout transactions",
      "requires_human_approval": true,
      "runbook_command": "aws ssm start-automation-execution --document-name 'PayPulse-Failover-Gateway' --parameters 'Primary=Stripe,Fallback=Razorpay'"
    },
    {
      "priority": "P1",
      "title": "Pause Non-Critical Billing Cron Workers",
      "expected_impact": "Prevents redundant retries and webhook collisions",
      "requires_human_approval": true,
      "runbook_command": "kubectl scale deployment subscription-worker --replicas=0 -n billing"
    }
  ]
}
```

---

### 3.7 Generate AI Incident Brief (`POST /api/reports/generate`)
Returns grounded Markdown postmortem citing active evidence URLs and simulation metrics.

#### Request Body
```json
{
  "incident_id": "inc-stripe-outage-01",
  "include_mitigation_plan": true
}
```

#### Response `200 OK`
```json
{
  "report_id": "brief-20261018-01",
  "generated_at": "2026-10-18T09:16:00Z",
  "model_used": "claude-3-5-sonnet-20241022",
  "is_grounded_in_evidence": true,
  "markdown_content": "# PayPulse Incident Postmortem & Mitigation Brief\n\n**Incident Status:** Active Provider Degradation\n**Affected Component:** Stripe Payments Gateway (`srv-stripe-primary`)\n\n### 1. Verified Evidence & Root Cause\n- Official Provider Status: [Stripe System Status](https://status.stripe.com) reports elevated 500 error rates on charge creation endpoints.\n- News Corroboration: [TechCrunch Incident Alert](https://techcrunch.com) confirms payment latency across North American merchants.\n\n### 2. Digital Twin Blast Radius\n- Directly Affected Services: 5 (`srv-checkout-svc`, `srv-order-processing`, `srv-subscription-worker`, `srv-customer-portal`)\n- Concurrent Users at Risk: 18,400\n- Pre-Mitigation Failure Rate: 34.2%\n\n### 3. Evaluated Recovery Plan\n- **Recommended Lever:** Immediate failover of checkout traffic to `srv-razorpay-backup`.\n- **Projected Risk Reduction:** 93.5% (Users at risk decreases from 18,400 to 1,200).\n\n*Note: Decision support only. Operational execution requires human approval.*"
}
```
