# SentinelTwin — Test Cases (TEST_CASES)

**Project:** SentinelTwin (AZINHACK '26)
**Version:** 1.1.0 (mapped to the real test suite)
**Run:** `python -m pytest backend/tests/ -v`
**Last known result:** 16 passed.

Test purposes below are taken from the test names. Confirm against the test bodies.

---

## 1. Existing automated tests (16)

| # | Test | File | Checks | Criteria |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `test_health_endpoints` | `test_api.py` | `/health` and `/api/v1/health` respond | AC-60 |
| 2 | `test_payload_too_large_413` | `test_api.py` | Oversized body returns 413 | AC-05 |
| 3 | `test_environment_and_edge_rejection` | `test_api.py` | Environment loads; invalid edge rejected | AC-01, AC-04 |
| 4 | `test_replay_and_evidence` | `test_api.py` | Replay endpoint and evidence listing | AC-54 |
| 5 | `test_simulation_endpoints_golden_values` | `test_api.py` | Propagate and mitigate return the reference numbers | AC-12 to AC-14, AC-20 to AC-23 |
| 6 | `test_generate_report` | `test_api.py` | Report endpoint returns a report | AC-50 |
| 7 | `test_golden_values_reproduction` | `test_simulation.py` | Engine reproduces the reference numbers | AC-10 to AC-14 |
| 8 | `test_reject_dangling_edge` | `test_simulation.py` | Edge to unknown node rejected | AC-03 |
| 9 | `test_reject_self_loop` | `test_simulation.py` | Self-loop rejected | AC-03 |
| 10 | `test_reject_cycles_graph_invalid` | `test_simulation.py` | Cycle rejected | AC-03 |
| 11 | `test_round_half_up` | `test_simulation.py` | Half-up rounding | AC-15 |
| 12 | `test_ssrf_validator_valid_urls` | `test_tinyfish.py` | Public URLs pass (DNS mocked) | AC-40 |
| 13 | `test_ssrf_validator_blocks_forbidden_schemes` | `test_tinyfish.py` | Non-http(s) schemes blocked | AC-41 |
| 14 | `test_ssrf_validator_blocks_localhost_and_metadata` | `test_tinyfish.py` | Loopback and metadata blocked | AC-42 |
| 15 | `test_tinyfish_service_offline_fixture_fallback` | `test_tinyfish.py` | No key leads to fixture data | AC-30 |
| 16 | `test_live_investigation_endpoint` | `test_tinyfish.py` | Live investigation endpoint returns evidence | AC-31 |

---

## 2. Gaps: tests to add

Priority order. Items G1 and G2 currently **fail** because of known engine issues (see
`SIMULATION_MODEL.md` section 7). Fix the engine, then keep the tests.

| ID | Test to add | Why | Criteria |
| :--- | :--- | :--- | :--- |
| G1 | Zero users at risk does not crash `simulate_mitigation` | Division by zero today | AC-17 |
| G2 | `affected_node_ids` order is stable and sorted | Set order today | AC-16 |
| G3 | Mitigation with no fallback raises `ValueError` | Error path untested | AC-20 |
| G4 | Evidence grading: official domain with an incident text vs news vs social | No test found | AC-35 |
| G5 | Incident-to-node mapping returns node plus reason | No test found | AC-35 |
| G6 | Prompt text with `</untrusted_web_evidence>` is escaped | No test found | AC-45 |
| G7 | Redirect to a private IP is blocked | Not implemented | AC-43 |
| G8 | Simulation completes in under 50 ms | No benchmark | AC-NFR-01 |
| G9 | Report numbers equal simulation numbers | No test found | AC-51 |
| G10 | Empty TinyFish response falls back and is not treated as success | No test found | AC-34 |

### Starter code for G1 to G3

The engine takes a dict with `nodes` and `edges`. Put this in `backend/tests/test_simulation_edges.py`
(adjust the import to match your existing tests).

```python
import pytest
from backend.app.core.simulation import DigitalTwinEngine  # adjust path to your engine module

def make_graph(root_users=0, dep_users=0, with_fallback=True):
    nodes = [
        {"id": "root", "name": "Root", "weight": 10.0, "baseline_users": root_users,
         "fallback_node_id": "backup" if with_fallback else None},
        {"id": "dep", "name": "Dep", "weight": 2.0, "baseline_users": dep_users},
        {"id": "backup", "name": "Backup", "weight": 1.0, "baseline_users": 0},
    ]
    edges = [{"source": "dep", "target": "root"}]
    return {"nodes": nodes, "edges": edges, "total_baseline_users": 1000}

def test_g1_zero_users_does_not_crash():
    engine = DigitalTwinEngine(make_graph(root_users=0, dep_users=0))
    result = engine.simulate_mitigation("root", "backup")
    assert result["deltas"]["user_risk_reduction_percentage"] == 0.0

def test_g2_affected_nodes_sorted():
    engine = DigitalTwinEngine(make_graph(dep_users=100))
    ids = engine.propagate_failure("root")["affected_node_ids"]
    assert ids == sorted(ids)

def test_g3_missing_fallback_raises():
    engine = DigitalTwinEngine(make_graph(with_fallback=False))
    with pytest.raises(ValueError):
        engine.simulate_mitigation("root")
```

If your engine module lives elsewhere, find it with `findstr /S /I "class DigitalTwinEngine" backend\app\*.py`.

---

## 3. Manual test checklist (frontend and demo)

There is no frontend test suite in the repository. Check these by hand and record the date.

| ID | Steps | Expected |
| :--- | :--- | :--- |
| M1 | Open the app | 8 nodes and 5 edges render, no console errors |
| M2 | Click **Live scan** with no key | Fixture badge, log lines appear, no error popup |
| M3 | Click **Live scan** with a key | Live badge, evidence with URL and timestamps |
| M4 | Click **Historical replay** | Replay banner visible on every tab |
| M5 | Fail `stripe-primary` in the simulation | Five services marked affected; `auth-service` and `portal-web` unaffected |
| M6 | Click **Apply Razorpay failover mitigation** | 23.2 to 10.2, 1,964 to 200 users, 88.7% to 98.8% success |
| M7 | Open the report tab | Report shows; numbers match M6; links open |
| M8 | Turn the network off, repeat M4 to M7 | Everything still works |
| M9 | Run the 3-minute script from `DEMO_PLAN.md` | Finishes in under 180 seconds |
