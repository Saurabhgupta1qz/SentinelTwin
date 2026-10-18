# SentinelTwin — Data Model (DATABASE)

**Project:** SentinelTwin (AZINHACK '26)
**Version:** 1.1.0 (aligned to the implementation)

## 1. Current status

**There is no database in the current backend.** A search of the application source for `sqlite` and
`aiosqlite` finds no usage. The graph is built in memory by `DigitalTwinEngine` from a Python dict
(seed data), and investigation results live in process memory or fixture files.

Consequences (confirm each):
- Nodes or edges added through the API are probably lost when the server restarts.
- `POST /api/environment/reset` restores the seed graph.
- Evidence and simulation history are not stored between runs.

For the hackathon demo this is acceptable. State it honestly if asked: "state is in memory; SQLite
persistence is planned, not built."

The earlier SQLite design (tables for environments, service nodes, edges, incident signals, evidence
records, simulation runs and mitigation actions) is a **proposal only**. Keep it as
`DATABASE_PROPOSED.md` and do not describe it as implemented.

## 2. In-memory data model

### Environment

| Field | Meaning | Default |
| :--- | :--- | :--- |
| `id` | Environment ID | `env-paynest-fintech` |
| `name` | Display name | `PayNest Fintech Stack` |
| `total_baseline_users` | Simulated user population | 10,000 |
| `nodes`, `edges` | Graph content | none |

### Node

| Field | Meaning | Default |
| :--- | :--- | :--- |
| `id` | Unique ID (required) | none |
| `name` | Display name | the ID |
| `category` | PAYMENT_GATEWAY, API_BACKEND, AUTH_PROVIDER, FRONTEND_CLIENT, and so on | API_BACKEND |
| `criticality` | MISSION_CRITICAL, HIGH, MEDIUM, LOW. Display only, not used in formulas | HIGH |
| `weight` | Business weight used in the weighted impact score | 1.0 |
| `baseline_users` | Simulated users attributed to this node | 0 |
| `fallback_node_id` | Backup node for failover | none |
| `provider_name` | Provider or owner | Internal |
| `status_url` | Public status page, if any | none |
| `status` | HEALTHY, DEGRADED, FAILED, UNKNOWN | HEALTHY |

### Edge

| Field | Meaning | Default |
| :--- | :--- | :--- |
| `source` | The dependent service (depends on `target`) | required |
| `target` | The dependency | required |
| `id` | Edge ID | `edge-<source>-<target>` |
| `is_hard_dependency` | Hard or soft dependency | true |
| `label` | Description | empty |

Validation: unknown endpoints, self-loops and cycles are rejected.

## 3. Seed data (PayNest stack)

Weights marked (inferred) were derived from API output. Confirm them in the seed file.

| Node ID | Category | Criticality | Weight | Baseline users |
| :--- | :--- | :--- | :--- | :--- |
| `stripe-primary` | PAYMENT_GATEWAY | MISSION_CRITICAL | 10.0 (inferred) | 0 (inferred) |
| `razorpay-backup` | PAYMENT_GATEWAY | HIGH | check seed | check seed |
| `payment-router` | API_BACKEND | HIGH | 6.0 (inferred) | 0 (inferred) |
| `checkout-api` | API_BACKEND | MISSION_CRITICAL | 5.5 (inferred) | 1,200 |
| `order-service` | API_BACKEND | HIGH | 2.4 (inferred) | 564 |
| `sub-billing` | API_BACKEND | MEDIUM | 0.2 (inferred) | 200 |
| `auth-service` | AUTH_PROVIDER | HIGH | check seed | check seed |
| `portal-web` | FRONTEND_CLIENT | MEDIUM | check seed | check seed |

Edges: `payment-router -> stripe-primary`, `checkout-api -> payment-router`,
`order-service -> checkout-api`, `sub-billing -> stripe-primary`, `portal-web -> auth-service`.

All weights and user counts are **SIMULATED** inputs.

## 4. If persistence is added later

Minimum viable step: store the environment (nodes and edges) and evidence records in SQLite, and
keep simulation results computed on demand. Do not add history tables unless the demo needs them.
