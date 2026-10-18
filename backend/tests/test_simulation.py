import pytest
import json
import os
from backend.app.core.simulation import DigitalTwinEngine, GraphInvalidException, round_half_up

FIXTURE_PATH = os.path.join(os.path.dirname(__file__), "..", "fixtures", "paynest_graph.json")

def load_paynest_fixture():
    with open(FIXTURE_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def test_golden_values_reproduction():
    """
    Verifies that DigitalTwinEngine with the PayNest graph reproduces the golden values:
    - W: 23.2 -> 10.x (pre-mitigation 23.2, post-mitigation 10.2)
    - users at risk: 19.6% -> 2.0%
    - users: 1,964 -> 200
    - success: 88.7%
    """
    graph_data = load_paynest_fixture()
    engine = DigitalTwinEngine(graph_data)

    # 1. Simulate Outage on stripe-primary
    baseline_result = engine.propagate_failure("stripe-primary", severity_factor=1.0)

    # Pre-mitigation Golden Checks
    assert baseline_result["weighted_impact_score"] == 23.2, f"Expected W=23.2, got {baseline_result['weighted_impact_score']}"
    assert baseline_result["users_at_risk"] == 1964, f"Expected 1964 users, got {baseline_result['users_at_risk']}"
    assert baseline_result["users_at_risk_percentage"] == 19.6, f"Expected 19.6%, got {baseline_result['users_at_risk_percentage']}%"
    assert baseline_result["transaction_success_rate"] == 88.7, f"Expected 88.7% success, got {baseline_result['transaction_success_rate']}%"
    assert baseline_result["total_affected_services"] == 5

    # 2. Simulate Mitigation (Failover to razorpay-backup)
    mitigation_result = engine.simulate_mitigation("stripe-primary", "razorpay-backup")
    mitigated = mitigation_result["mitigated"]

    # Post-mitigation Golden Checks
    assert str(mitigated["weighted_impact_score"]).startswith("10."), f"Expected W=10.x, got {mitigated['weighted_impact_score']}"
    assert mitigated["weighted_impact_score"] == 10.2
    assert mitigated["users_at_risk"] == 200, f"Expected 200 users, got {mitigated['users_at_risk']}"
    assert mitigated["users_at_risk_percentage"] == 2.0, f"Expected 2.0%, got {mitigated['users_at_risk_percentage']}%"
    assert mitigated["transaction_success_rate"] == 98.8
    assert mitigation_result["deltas"]["user_risk_reduction_percentage"] == 89.8

def test_reject_dangling_edge():
    graph_data = load_paynest_fixture()
    graph_data["edges"].append({
        "id": "edge-dangling",
        "source": "payment-router",
        "target": "non-existent-node"
    })
    with pytest.raises(GraphInvalidException, match="Dangling edge"):
        DigitalTwinEngine(graph_data)

def test_reject_self_loop():
    graph_data = load_paynest_fixture()
    graph_data["edges"].append({
        "id": "edge-self-loop",
        "source": "payment-router",
        "target": "payment-router"
    })
    with pytest.raises(GraphInvalidException, match="Self-loop edge"):
        DigitalTwinEngine(graph_data)

def test_reject_cycles_graph_invalid():
    graph_data = load_paynest_fixture()
    # Add cycle: checkout-api -> order-service (existing order-service -> checkout-api)
    graph_data["edges"].append({
        "id": "edge-cycle",
        "source": "checkout-api",
        "target": "order-service"
    })
    with pytest.raises(GraphInvalidException, match="GRAPH_INVALID"):
        DigitalTwinEngine(graph_data)

def test_round_half_up():
    assert round_half_up(19.64, 1) == 19.6
    assert round_half_up(19.65, 1) == 19.7
    assert round_half_up(2.00, 1) == 2.0
    assert round_half_up(88.70, 1) == 88.7


# ---------------------------------------------------------------------------
# Edge-case tests (G1 to G3). G1 and G2 fail until the engine is fixed:
#   G1 -> guard the division in simulate_mitigation when baseline users at risk is 0
#   G2 -> return sorted() node lists instead of [root] + list(set)
# ---------------------------------------------------------------------------

def _edge_graph(root_users=0, dep_users=0, with_fallback=True):
    nodes = [
        {"id": "root", "name": "Root", "weight": 10.0, "baseline_users": root_users,
         "fallback_node_id": "backup" if with_fallback else None},
        {"id": "dep", "name": "Dep", "weight": 2.0, "baseline_users": dep_users},
        {"id": "backup", "name": "Backup", "weight": 1.0, "baseline_users": 0},
    ]
    edges = [{"source": "dep", "target": "root"}]
    return {"nodes": nodes, "edges": edges, "total_baseline_users": 1000}


def test_g1_zero_users_does_not_crash():
    engine = DigitalTwinEngine(_edge_graph(root_users=0, dep_users=0))
    result = engine.simulate_mitigation("root", "backup")
    assert result["deltas"]["user_risk_reduction_percentage"] == 0.0


def test_g2_affected_nodes_sorted():
    engine = DigitalTwinEngine(_edge_graph(dep_users=100))
    ids = engine.propagate_failure("root")["affected_node_ids"]
    assert ids == sorted(ids)


def test_g3_missing_fallback_raises():
    engine = DigitalTwinEngine(_edge_graph(with_fallback=False))
    with pytest.raises(ValueError):
        engine.simulate_mitigation("root")