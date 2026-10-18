import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.state import store

client = TestClient(app)

@pytest.fixture(autouse=True)
def reset_store_before_each():
    store.reset_to_default()

def test_health_endpoints():
    r1 = client.get("/health")
    assert r1.status_code == 200
    assert r1.json()["status"] == "HEALTHY"

    r2 = client.get("/api/v1/health")
    assert r2.status_code == 200
    assert r2.json()["service"] == "SentinelTwin Backend"

def test_payload_too_large_413():
    # 1.1MB body
    large_body = "x" * (1024 * 1024 + 100)
    response = client.post(
        "/api/environment/nodes",
        content=large_body,
        headers={"Content-Length": str(len(large_body)), "Content-Type": "application/json"}
    )
    assert response.status_code == 413
    assert "Payload too large" in response.json()["detail"]

def test_environment_and_edge_rejection():
    # 1. Get environment
    res = client.get("/api/environment")
    assert res.status_code == 200
    assert res.json()["id"] == "env-paynest-fintech"

    # 2. Reject self-loop
    res_self = client.post("/api/environment/edges", json={
        "id": "e-self",
        "source": "payment-router",
        "target": "payment-router"
    })
    assert res_self.status_code == 409
    assert res_self.json()["error_code"] == "GRAPH_INVALID"

    # 3. Reject dangling edge
    res_dang = client.post("/api/environment/edges", json={
        "id": "e-dang",
        "source": "payment-router",
        "target": "missing-node"
    })
    assert res_dang.status_code == 409
    assert res_dang.json()["error_code"] == "GRAPH_INVALID"

    # 4. Reject cycles
    res_cycle = client.post("/api/environment/edges", json={
        "id": "e-cycle",
        "source": "checkout-api",
        "target": "order-service"
    })
    assert res_cycle.status_code == 409
    assert res_cycle.json()["error_code"] == "GRAPH_INVALID"
    assert "cycles" in res_cycle.json()["detail"]

def test_replay_and_evidence():
    # 1. Trigger replay
    res_rep = client.post("/api/investigation/replay")
    assert res_rep.status_code == 200
    data = res_rep.json()
    assert data["provenance"] == "HISTORICAL_REPLAY"
    assert data["incident"]["provider_name"] == "Stripe, Inc."

    # 2. Get evidence
    res_evi = client.get("/api/investigation/evidence")
    assert res_evi.status_code == 200
    assert res_evi.json()["total_evidence_items"] >= 2
    assert res_evi.json()["provenance"] == "HISTORICAL_REPLAY"

def test_simulation_endpoints_golden_values():
    # 1. Propagate failure on stripe-primary
    res_prop = client.post("/api/simulation/propagate", json={
        "root_cause_node_id": "stripe-primary",
        "severity_factor": 1.0
    })
    assert res_prop.status_code == 200
    d_prop = res_prop.json()
    assert d_prop["weighted_impact_score"] == 23.2
    assert d_prop["users_at_risk"] == 1964
    assert d_prop["users_at_risk_percentage"] == 19.6
    assert d_prop["transaction_success_rate"] == 88.7

    # 2. Mitigate with failover to razorpay-backup
    res_mit = client.post("/api/simulation/mitigate", json={
        "failed_node_id": "stripe-primary",
        "fallback_node_id": "razorpay-backup"
    })
    assert res_mit.status_code == 200
    d_mit = res_mit.json()
    assert d_mit["mitigated"]["weighted_impact_score"] == 10.2
    assert d_mit["mitigated"]["users_at_risk"] == 200
    assert d_mit["mitigated"]["users_at_risk_percentage"] == 2.0
    assert d_mit["deltas"]["user_risk_reduction_percentage"] == 89.8

def test_generate_report():
    # Replay + mitigate + report
    client.post("/api/investigation/replay")
    client.post("/api/simulation/mitigate", json={
        "failed_node_id": "stripe-primary",
        "fallback_node_id": "razorpay-backup"
    })
    res_rep = client.post("/api/reports/generate")
    assert res_rep.status_code == 200
    report = res_rep.json()
    assert "SentinelTwin Incident Postmortem" in report["markdown"]
    assert "1,964" in report["markdown"]
    assert "88.7%" in report["markdown"]
    assert report["provenance"] == "COMPUTED"
