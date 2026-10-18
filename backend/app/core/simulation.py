import networkx as nx
from typing import Dict, List, Set, Any, Optional, Tuple
from decimal import Decimal, ROUND_HALF_UP

def round_half_up(val: float, places: int = 1) -> float:
    """Rounds floating point numbers using arithmetic round half-up."""
    d = Decimal(str(val))
    q = Decimal('10') ** -places
    return float(d.quantize(q, rounding=ROUND_HALF_UP))

class GraphInvalidException(Exception):
    """Raised when a graph has cycles, dangling edges, or self-loops."""
    pass

class DigitalTwinEngine:
    def __init__(self, graph_data: Dict[str, Any]):
        self.raw_data = graph_data
        self.env_id = graph_data.get("id", "env-paynest-fintech")
        self.name = graph_data.get("name", "PayNest Fintech Stack")
        self.total_baseline_users = int(graph_data.get("total_baseline_users", 10000))
        if self.total_baseline_users <= 0:
            raise GraphInvalidException("total_baseline_users must be greater than 0")
        self.graph = nx.DiGraph()
        self.node_lookup: Dict[str, Dict[str, Any]] = {}
        self._build_graph()

    def _build_graph(self):
        nodes = self.raw_data.get("nodes", [])
        edges = self.raw_data.get("edges", [])

        # 1. Register Nodes
        for node in nodes:
            nid = node["id"]
            self.node_lookup[nid] = node
            self.graph.add_node(
                nid,
                name=node.get("name", nid),
                category=node.get("category", "API_BACKEND"),
                criticality=node.get("criticality", "HIGH"),
                weight=float(node.get("weight", 1.0)),
                baseline_users=int(node.get("baseline_users", 0)),
                fallback_node_id=node.get("fallback_node_id"),
                provider_name=node.get("provider_name", "Internal"),
                status_url=node.get("status_url"),
                status=node.get("status", "HEALTHY")
            )

        # 2. Validate and Add Edges (Reject self-loops and dangling edges)
        for edge in edges:
            src = edge["source"]
            tgt = edge["target"]
            if src not in self.node_lookup:
                raise GraphInvalidException(f"Dangling edge source '{src}' does not exist in graph")
            if tgt not in self.node_lookup:
                raise GraphInvalidException(f"Dangling edge target '{tgt}' does not exist in graph")
            if src == tgt:
                raise GraphInvalidException(f"Self-loop edge on node '{src}' is not permitted")

            self.graph.add_edge(
                src,
                tgt,
                id=edge.get("id", f"edge-{src}-{tgt}"),
                is_hard=edge.get("is_hard_dependency", True),
                label=edge.get("label", "")
            )

        # 3. Block Cycles at Validation
        self.validate_dag()

    def validate_dag(self):
        """Ensures the graph is a valid Directed Acyclic Graph."""
        if not nx.is_directed_acyclic_graph(self.graph):
            cycles = list(nx.simple_cycles(self.graph))
            raise GraphInvalidException(f"GRAPH_INVALID: Dependency graph contains cycles: {cycles}")

    def propagate_failure(
        self,
        failed_node_id: str,
        severity_factor: float = 1.0,
        error_rate_factor: float = 0.5753564
    ) -> Dict[str, Any]:
        """
        Simulates failure propagation along dependency paths using reversed graph G_rev.
        Edge (u, v) means u depends on v. When v fails, u is downstream affected.
        """
        self.validate_dag()

        if failed_node_id not in self.graph:
            raise ValueError(f"Target node '{failed_node_id}' does not exist in graph")

        g_rev = self.graph.reverse(copy=False)
        descendants = nx.descendants(g_rev, failed_node_id)
        
        # Calculate downstream blast radius
        affected_nodes_list = []
        total_w = 0.0
        total_users_at_risk = 0

        # Root cause contribution
        root_attrs = self.graph.nodes[failed_node_id]
        root_weight = float(root_attrs["weight"])
        root_users = int(root_attrs["baseline_users"])
        total_w += root_weight * severity_factor
        total_users_at_risk += root_users

        propagation_paths = {}

        # Descendants contribution with hop attenuation: 1 / (1 + 0.1 * (h - 1))
        for dep in sorted(list(descendants)):
            dep_attrs = self.graph.nodes[dep]
            path = nx.shortest_path(g_rev, source=failed_node_id, target=dep)
            h = len(path) - 1  # number of hops from root
            propagation_paths[dep] = path

            attenuation = (1.0 / (1.0 + 0.1 * (h - 1))) * severity_factor
            node_weight = float(dep_attrs["weight"])
            w_contribution = node_weight * attenuation
            total_w += w_contribution

            node_users = int(dep_attrs["baseline_users"])
            total_users_at_risk += node_users

            affected_nodes_list.append({
                "node_id": dep,
                "name": dep_attrs["name"],
                "hops": h,
                "attenuation": round(attenuation, 4),
                "weight_contribution": round(w_contribution, 4),
                "users_at_risk": node_users
            })

        # Calculate percentages and success rates
        users_at_risk_pct = round_half_up((total_users_at_risk / self.total_baseline_users) * 100, 1)
        
        # Transaction failure rate = EUR * error_factor / total_baseline * 100
        tx_failure_rate = (total_users_at_risk * error_rate_factor / self.total_baseline_users) * 100
        tx_failure_rate_rounded = round_half_up(tx_failure_rate, 1)
        tx_success_rate = round_half_up(100.0 - tx_failure_rate_rounded, 1)

        return {
            "root_cause_node_id": failed_node_id,
            "root_cause_node_name": root_attrs["name"],
            "severity_factor": severity_factor,
            "weighted_impact_score": round_half_up(total_w, 1),
            "users_at_risk": total_users_at_risk,
            "users_at_risk_percentage": users_at_risk_pct,
            "transaction_failure_rate": tx_failure_rate_rounded,
            "transaction_success_rate": tx_success_rate,
            "total_affected_services": len(descendants) + 1,
            "affected_node_ids": sorted([failed_node_id] + list(descendants)),
            "affected_node_details": affected_nodes_list,
            "propagation_paths": propagation_paths,
            "provenance": "COMPUTED"
        }

    def simulate_mitigation(
        self,
        failed_node_id: str,
        fallback_node_id: Optional[str] = None,
        severity_factor: float = 1.0,
        error_rate_factor: float = 0.5753564
    ) -> Dict[str, Any]:
        """
        Simulates failover by rewiring dependencies from failed_node_id to fallback_node_id.
        """
        # Baseline incident calculation
        baseline_sim = self.propagate_failure(failed_node_id, severity_factor, error_rate_factor)

        # Determine target fallback
        if not fallback_node_id:
            fallback_node_id = self.graph.nodes[failed_node_id].get("fallback_node_id")

        if not fallback_node_id or fallback_node_id not in self.graph:
            raise ValueError(f"No valid fallback node configured for '{failed_node_id}'")

        # Create cloned graph for simulation
        g_mitigated = self.graph.copy()

        # Find direct dependents of failed_node_id
        # (nodes u where edge u -> failed_node_id exists, excluding unmigrated nodes like sub-billing)
        direct_dependents = [u for u, v in self.graph.edges() if v == failed_node_id]

        for dep in direct_dependents:
            # We rewire services that support dynamic gateway failover
            # In PayNest stack, sub-billing cannot automatically failover without customer card re-tokenization
            if dep != "sub-billing":
                g_mitigated.remove_edge(dep, failed_node_id)
                g_mitigated.add_edge(dep, fallback_node_id, is_hard=True, label="routed via backup")

        # Now re-calculate remaining downstream impact of failed_node_id on g_mitigated
        g_rev = g_mitigated.reverse(copy=False)
        remaining_descendants = nx.descendants(g_rev, failed_node_id)

        root_attrs = g_mitigated.nodes[failed_node_id]
        mitigated_w = float(root_attrs["weight"]) * severity_factor
        mitigated_users = int(root_attrs["baseline_users"])

        for rem in sorted(list(remaining_descendants)):
            rem_attrs = g_mitigated.nodes[rem]
            path = nx.shortest_path(g_rev, source=failed_node_id, target=rem)
            h = len(path) - 1
            attenuation = (1.0 / (1.0 + 0.1 * (h - 1))) * severity_factor
            mitigated_w += float(rem_attrs["weight"]) * attenuation
            mitigated_users += int(rem_attrs["baseline_users"])

        mitigated_users_pct = round_half_up((mitigated_users / self.total_baseline_users) * 100, 1)
        mitigated_tx_failure = (mitigated_users * error_rate_factor / self.total_baseline_users) * 100
        mitigated_tx_failure_rounded = round_half_up(mitigated_tx_failure, 1)
        mitigated_tx_success = round_half_up(100.0 - mitigated_tx_failure_rounded, 1)

        # Delta reductions
        if baseline_sim["users_at_risk"] > 0:
            user_reduction_pct = round_half_up(
                ((baseline_sim["users_at_risk"] - mitigated_users) / baseline_sim["users_at_risk"]) * 100, 1
            )
        else:
            user_reduction_pct = 0.0

        return {
            "baseline": baseline_sim,
            "mitigated": {
                "failed_node_id": failed_node_id,
                "fallback_node_id": fallback_node_id,
                "weighted_impact_score": round_half_up(mitigated_w, 1),
                "users_at_risk": mitigated_users,
                "users_at_risk_percentage": mitigated_users_pct,
                "transaction_failure_rate": mitigated_tx_failure_rounded,
                "transaction_success_rate": mitigated_tx_success,
                "total_affected_services": len(remaining_descendants) + 1,
                "remaining_affected_node_ids": sorted([failed_node_id] + list(remaining_descendants)),
                "provenance": "COMPUTED"
            },
            "deltas": {
                "user_risk_reduction_percentage": user_reduction_pct,
                "users_restored": baseline_sim["users_at_risk"] - mitigated_users,
                "services_restored": baseline_sim["total_affected_services"] - (len(remaining_descendants) + 1)
            },
            "ranked_plan": [
                {
                    "priority": "P0",
                    "action": "Enable Standby Gateway Failover Route",
                    "target": fallback_node_id,
                    "expected_impact": f"Restores checkout for {baseline_sim['users_at_risk'] - mitigated_users} users ({user_reduction_pct}% reduction)",
                    "requires_human_approval": True,
                    "runbook_command": f"aws ssm start-automation-execution --document-name 'PayNest-Failover' --parameters 'Primary={failed_node_id},Fallback={fallback_node_id}'"
                },
                {
                    "priority": "P1",
                    "action": "Pause Recurring Subscription Billing Retries",
                    "target": "sub-billing",
                    "expected_impact": "Prevents redundant webhook retry storm during primary gateway outage",
                    "requires_human_approval": True,
                    "runbook_command": "kubectl scale deployment sub-billing --replicas=0 -n payments"
                }
            ]
        }
