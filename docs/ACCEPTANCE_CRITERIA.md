# SentinelTwin — Acceptance Criteria (ACCEPTANCE_CRITERIA)

**Project:** SentinelTwin (AZINHACK '26)
**Version:** 1.1.0 (aligned to the running backend)
**Reference stack:** PayNest fintech (8 nodes, 5 edges)

Each criterion has a **Status**:

- **Verified (test):** covered by an automated test that passes.
- **Verified (output):** confirmed from real API output, no automated test known.
- **Unverified:** not yet checked. Check it before the demo.
- **Not implemented / unknown:** no evidence it exists in the code.

Reference values come from `SIMULATION_MODEL.md`. They are computed from simulated inputs.

---

## 1. Graph and environment

| ID | Criterion | Status |
| :--- | :--- | :--- |
| AC-01 | `GET /api/environment` returns the PayNest stack with exactly 8 nodes and 5 edges. | Verified (output) |
| AC-02 | Node IDs are `stripe-primary`, `razorpay-backup`, `payment-router`, `checkout-api`, `order-service`, `sub-billing`, `auth-service`, `portal-web`. | Verified (output) |
| AC-03 | The engine rejects edges to unknown nodes, self-loops and cycles. | Verified (test): `test_reject_dangling_edge`, `test_reject_self_loop`, `test_reject_cycles_graph_invalid` |
| AC-04 | `POST /api/environment/edges` rejects an invalid edge with an error response. | Verified (test): `test_environment_and_edge_rejection` |
| AC-05 | An oversized request body returns HTTP 413. | Verified (test): `test_payload_too_large_413` |
| AC-06 | `POST /api/environment/reset` restores the seed graph. | Unverified |
| AC-07 | The canvas shows all 8 nodes, with colors for healthy, degraded, failed and unknown matching the tokens in `UI_UX.md`. | Unverified (manual) |

## 2. Propagation and metrics

Failed node `stripe-primary`, severity 1.0.

| ID | Criterion | Status |
| :--- | :--- | :--- |
| AC-10 | Affected nodes are exactly `stripe-primary`, `payment-router`, `checkout-api`, `order-service`, `sub-billing` (5 services). | Verified (test): `test_golden_values_reproduction` |
| AC-11 | `auth-service`, `portal-web` and `razorpay-backup` are not affected. | Verified (output) |
| AC-12 | Weighted impact score is 23.2. | Verified (test) |
| AC-13 | Users at risk is 1,964 (19.6% of 10,000 simulated users). | Verified (test) |
| AC-14 | Transaction failure rate is 11.3% and success rate is 88.7%. | Verified (test) |
| AC-15 | Rounding is half-up. | Verified (test): `test_round_half_up` |
| AC-16 | The affected node list has a stable order across runs. | **Fails today**: uses set order. Fix with `sorted()`. |
| AC-17 | A scenario with zero users at risk returns a response, not an error. | **Fails today**: division by zero. Fix and add a test. |

## 3. Recovery simulation

Failed node `stripe-primary`, fallback `razorpay-backup`.

| ID | Criterion | Status |
| :--- | :--- | :--- |
| AC-20 | Mitigated affected services are `stripe-primary` and `sub-billing` (2 services, 3 restored). | Verified (test) |
| AC-21 | Mitigated weighted impact score is 10.2 and users at risk is 200 (2.0%). | Verified (test): `test_simulation_endpoints_golden_values` |
| AC-22 | Mitigated failure rate is 1.2% and success rate is 98.8% (+10.1 percentage points). | Verified (test) |
| AC-23 | User risk reduction is 89.8% and users restored is 1,764. | Verified (test) |
| AC-24 | The UI states that `sub-billing` is assumed not to fail over (a simulated assumption). | Unverified (manual) |
| AC-25 | The ranked plan lists P0 (enable failover) before P1 (pause billing retries). Both require human approval. | Verified (output) |
| AC-26 | Runbook commands are labeled illustrative and are never executed by the app. | Unverified (check UI label) |

## 4. TinyFish intelligence

| ID | Criterion | Status |
| :--- | :--- | :--- |
| AC-30 | Without `TINYFISH_API_KEY`, an investigation completes using fixture data, shows a fixture badge, and raises no error. | Verified (test): `test_tinyfish_service_offline_fixture_fallback` |
| AC-31 | The live investigation endpoint returns evidence items. | Verified (test): `test_live_investigation_endpoint` (confirm whether it mocks the network) |
| AC-32 | With a real key, one live Search and one live Fetch return results, and the UI shows a live badge. | Unverified (manual, run once before the demo) |
| AC-33 | Response fields used by the code (`title`, `url`, `snippet`, `position`, `site_name`) match the current TinyFish documentation. | Unverified |
| AC-34 | An empty or failed TinyFish result is never treated as success. | Unverified |
| AC-35 | Each evidence item shows source URL, publisher, publish time (if available), retrieval time and verification grade. | Unverified (manual) |

## 5. Security

| ID | Criterion | Status |
| :--- | :--- | :--- |
| AC-40 | Valid public URLs pass the SSRF check. | Verified (test): `test_ssrf_validator_valid_urls` (DNS is mocked) |
| AC-41 | Non-http(s) schemes are blocked. | Verified (test) |
| AC-42 | Localhost and metadata addresses are blocked. | Verified (test): `test_ssrf_validator_blocks_localhost_and_metadata` |
| AC-43 | Redirects are re-validated, and IPv6-mapped private addresses are blocked. | Not implemented / unknown |
| AC-44 | The built frontend contains no API keys. | Unverified. Run `npm run build`, then `findstr /S /I "TINYFISH ANTHROPIC" frontend\dist\*`. |
| AC-45 | Web text is escaped before it enters a Claude prompt. | Not implemented / unknown (no test found) |
| AC-46 | The app contains no credentials for production systems and never executes remediation. | Unverified (code review) |

## 6. Report and replay

| ID | Criterion | Status |
| :--- | :--- | :--- |
| AC-50 | `POST /api/reports/generate` returns a report. | Verified (test): `test_generate_report` |
| AC-51 | Every number in the report equals the simulation output. | Unverified |
| AC-52 | Every source link in the report matches an evidence item. | Unverified |
| AC-53 | Without `ANTHROPIC_API_KEY`, a template report is returned and labeled as a template. | Unverified |
| AC-54 | `POST /api/investigation/replay` returns evidence labeled as replay or fixture. | Verified (test): `test_replay_and_evidence` |
| AC-55 | In replay mode, a banner "Historical incident replay — not a live outage" is visible on every screen. | Unverified (manual) |
| AC-56 | The replay incident has a verified official source URL and dates in `DEMO_PLAN.md`, or is labeled a fictional fixture. | Not done (see `DEMO_PLAN.md` section 3) |

## 7. Health

| ID | Criterion | Status |
| :--- | :--- | :--- |
| AC-60 | `GET /health` and `GET /api/v1/health` return a healthy response. | Verified (test): `test_health_endpoints` |

## 8. Non-functional

| ID | Criterion | Target | Status |
| :--- | :--- | :--- | :--- |
| AC-NFR-01 | Local simulation time | Under 50 ms for this 8-node graph | Unverified (add a timing test) |
| AC-NFR-02 | Demo works offline in replay mode | Full flow, no errors | Unverified (rehearse with the network off) |
| AC-NFR-03 | Text contrast | WCAG AA (4.5:1) in light and dark | Unverified (Lighthouse) |
| AC-NFR-04 | Full backend test suite | 16 of 16 pass | Verified (last run) |

---

## 9. Sign-off checklist before the demo

- [ ] All **Unverified** items for AC-07, AC-24, AC-26, AC-32, AC-44, AC-55 checked by hand.
- [ ] AC-16 and AC-17 fixed and covered by tests.
- [ ] AC-56 resolved.
- [ ] `python -m pytest backend/tests/ -v` passes.
