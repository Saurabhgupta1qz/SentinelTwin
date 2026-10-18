import json
import os
import copy
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from backend.app.core.simulation import DigitalTwinEngine, GraphInvalidException

FIXTURE_PAYNEST = os.path.join(os.path.dirname(__file__), "..", "..", "fixtures", "paynest_graph.json")
FIXTURE_HISTORICAL = os.path.join(os.path.dirname(__file__), "..", "..", "fixtures", "stripe_outage_historical.json")

class InMemoryStore:
    def __init__(self):
        self.reset_to_default()

    def reset_to_default(self):
        with open(FIXTURE_PAYNEST, "r", encoding="utf-8") as f:
            self.environment = json.load(f)
        
        self.active_incident: Optional[Dict[str, Any]] = None
        self.active_simulation: Optional[Dict[str, Any]] = None
        self.active_mitigation: Optional[Dict[str, Any]] = None
        self.engine = DigitalTwinEngine(self.environment)

    def get_environment(self) -> Dict[str, Any]:
        return self.environment

    def add_or_update_node(self, node_data: Dict[str, Any]) -> Dict[str, Any]:
        nid = node_data["id"]
        updated = False
        for i, n in enumerate(self.environment["nodes"]):
            if n["id"] == nid:
                self.environment["nodes"][i] = {**n, **node_data}
                updated = True
                break
        if not updated:
            self.environment["nodes"].append(node_data)

        # Re-build engine and validate
        self.engine = DigitalTwinEngine(self.environment)
        return node_data

    def add_edge(self, edge_data: Dict[str, Any]) -> Dict[str, Any]:
        src = edge_data["source"]
        tgt = edge_data["target"]
        
        # Check dangling
        existing_node_ids = {n["id"] for n in self.environment["nodes"]}
        if src not in existing_node_ids:
            raise GraphInvalidException(f"Dangling edge: source '{src}' does not exist")
        if tgt not in existing_node_ids:
            raise GraphInvalidException(f"Dangling edge: target '{tgt}' does not exist")
        if src == tgt:
            raise GraphInvalidException(f"Self-loop edge on '{src}' is not allowed")

        # Test trial graph with new edge
        trial_env = copy.deepcopy(self.environment)
        # Check duplicate
        for e in trial_env["edges"]:
            if e["source"] == src and e["target"] == tgt:
                return e

        trial_env["edges"].append(edge_data)
        trial_engine = DigitalTwinEngine(trial_env) # Raises GraphInvalidException on cycles
        
        # Valid: commit
        self.environment = trial_env
        self.engine = trial_engine
        return edge_data

    def load_historical_replay(self) -> Dict[str, Any]:
        with open(FIXTURE_HISTORICAL, "r", encoding="utf-8") as f:
            self.active_incident = json.load(f)

        # Mark mapped node degraded or failed
        mapped_node = self.active_incident.get("mapped_node_id")
        if mapped_node:
            for n in self.environment["nodes"]:
                if n["id"] == mapped_node:
                    n["status"] = "FAILED"
            self.engine = DigitalTwinEngine(self.environment)

        return self.active_incident

    def get_evidence(self) -> List[Dict[str, Any]]:
        if not self.active_incident:
            return []
        return self.active_incident.get("evidence_items", [])

    def run_propagation(self, root_node_id: str, severity: float = 1.0) -> Dict[str, Any]:
        result = self.engine.propagate_failure(root_node_id, severity)
        self.active_simulation = result
        return result

    def run_mitigation(self, failed_node_id: str, fallback_node_id: Optional[str] = None, severity: float = 1.0) -> Dict[str, Any]:
        result = self.engine.simulate_mitigation(failed_node_id, fallback_node_id, severity)
        self.active_mitigation = result
        return result

    def generate_template_report(self) -> Dict[str, Any]:
        inc = self.active_incident or {
            "incident_id": "sim-outage-01",
            "provider_name": "Stripe, Inc.",
            "mapped_node_id": "stripe-primary",
            "summary": "Simulated primary gateway degradation",
            "severity": "CRITICAL",
            "evidence_items": []
        }
        sim = self.active_simulation or self.run_propagation(inc.get("mapped_node_id", "stripe-primary"))
        mit = self.active_mitigation or self.run_mitigation(inc.get("mapped_node_id", "stripe-primary"))

        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

        evidence_section = ""
        for evi in inc.get("evidence_items", []):
            evidence_section += f"- **[{evi.get('verification_grade', 'OFFICIAL')}]** [{evi.get('source_title', 'Source')}]({evi.get('source_url', '#')}): \"{evi.get('raw_snippet', '')}\"\n"
        if not evidence_section:
            evidence_section = "- *No live external evidence attached (Manual What-If simulation).*\n"

        md_content = f"""# SentinelTwin Incident Postmortem & Recovery Brief

**Generated At:** {now_str}  
**Incident ID:** `{inc.get('incident_id', 'UNKNOWN')}`  
**Target Provider:** {inc.get('provider_name', 'Unknown')}  
**Mapped Node:** `{inc.get('mapped_node_id', 'stripe-primary')}`  
**Operational Status:** FAILED / DEGRADED  
**Mode:** {"HISTORICAL REPLAY" if inc.get("is_historical_replay") else "SIMULATED / LIVE"}  

---

## 1. Verified Evidence & Root Cause Signals
{evidence_section}

---

## 2. Digital Twin Impact Simulation
- **Root Cause Node:** `{sim.get('root_cause_node_id')}` ({sim.get('root_cause_node_name')})
- **Weighted Impact Score ($W$):** `{sim.get('weighted_impact_score')}`
- **Active Users at Risk:** **{sim.get('users_at_risk'):,}** ({sim.get('users_at_risk_percentage')}%)
- **Projected Transaction Success Rate:** **{sim.get('transaction_success_rate')}%** (Failure Rate: {sim.get('transaction_failure_rate')}%)
- **Total Affected Services:** {sim.get('total_affected_services')}

---

## 3. Recovery Mitigation Evaluation
- **Recommended Action:** {mit['ranked_plan'][0]['action']} (`{mit['ranked_plan'][0]['target']}`)
- **Mitigated Impact Score ($W$):** `{mit['mitigated']['weighted_impact_score']}`
- **Remaining Users at Risk:** **{mit['mitigated']['users_at_risk']:,}** ({mit['mitigated']['users_at_risk_percentage']}%)
- **Restored Transaction Success Rate:** **{mit['mitigated']['transaction_success_rate']}%**
- **User Risk Reduction:** **{mit['deltas']['user_risk_reduction_percentage']}%**

---

## 4. Human-Approved Operational Runbook
```bash
{mit['ranked_plan'][0]['runbook_command']}
```

> ⚠️ *Decision-Support Advisory Only — Human approval required before modifying production routing.*
"""

        return {
            "report_id": f"rep-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}",
            "generated_at": now_str,
            "provenance": "COMPUTED",
            "report_mode": "template",
            "markdown": md_content.strip()
        }

# Global singleton in-memory store
store = InMemoryStore()
