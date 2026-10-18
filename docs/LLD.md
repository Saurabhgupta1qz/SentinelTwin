# SentinelTwin — Low-Level Design (LLD)

**Document ID:** LLD-001  
**Project:** SentinelTwin  
**Version:** 1.0.0  
**Target Window:** 24-Hour Implementation Window  

---

## 1. Backend Module Architecture

The backend code is organized into clean, single-responsibility modules under `/backend`:

```
backend/
├── app/
│   ├── main.py                     # FastAPI application entrypoint, CORS, exception handlers
│   ├── config.py                   # Pydantic BaseSettings (env vars, secrets, timeouts)
│   ├── api/
│   │   ├── routes_environment.py   # CRUD for infrastructure environments and nodes
│   │   ├── routes_investigation.py # Live & historical TinyFish investigation endpoints (SSE)
│   │   ├── routes_simulation.py    # Digital Twin failure injection & mitigation endpoints
│   │   └── routes_reports.py       # Claude 3.5 AI incident brief generation
│   ├── core/
│   │   ├── digital_twin.py         # NetworkX graph model & propagation algorithm
│   │   ├── recovery_planner.py     # Mitigation calculation & ranked action engine
│   │   ├── evidence_normalizer.py  # External signal parser & confidence evaluator
│   │   └── dependency_mapper.py    # Incident-to-node matching algorithm
│   ├── services/
│   │   ├── tinyfish_client.py      # HTTPX client for TinySearch, TinyFetch, TinyAgent
│   │   └── claude_client.py        # Anthropic SDK client & template fallback
│   ├── db/
│   │   ├── database.py             # SQLite connection pool (aiosqlite)
│   │   ├── models.py               # SQLAlchemy / SQL schema definitions
│   │   └── seed_data.py            # PayPulse 12-node reference architecture
│   └── schemas/
│       ├── environment_schema.py   # Pydantic models for nodes, edges, stacks
│       ├── incident_schema.py      # Normalized evidence schemas
│       ├── simulation_schema.py    # Blast radius & before/after mitigation schemas
│       └── report_schema.py        # Incident brief response models
├── fixtures/
│   ├── tinyfish_stripe_outage.json # Offline mock data for TinySearch + TinyFetch
│   └── historical_stripe_oct2024.json # Verified historical incident replay
├── tests/
│   ├── test_digital_twin.py        # Pytest graph traversal & propagation tests
│   ├── test_evidence_normalizer.py # Evidence verification logic tests
│   ├── test_tinyfish_client.py     # HTTP client & fallback tests
│   └── test_api_endpoints.py       # End-to-end FastAPI endpoint tests
└── requirements.txt
```

---

## 2. Core Domain Data Models & Pydantic Schemas

### 2.1 Node & Edge Schemas (`schemas/environment_schema.py`)

```python
from enum import Enum
from typing import Optional, List, Dict
from pydantic import BaseModel, Field

class ServiceCategory(str, Enum):
    PAYMENT_GATEWAY = "PAYMENT_GATEWAY"
    CLOUD_COMPUTE = "CLOUD_COMPUTE"
    DNS_ROUTER = "DNS_ROUTER"
    AUTH_PROVIDER = "AUTH_PROVIDER"
    DATABASE = "DATABASE"
    API_BACKEND = "API_BACKEND"
    FRONTEND_CLIENT = "FRONTEND_CLIENT"
    NOTIFICATION_SVC = "NOTIFICATION_SVC"

class NodeCriticality(str, Enum):
    MISSION_CRITICAL = "MISSION_CRITICAL" # Weight: 1.00
    HIGH = "HIGH"                         # Weight: 0.75
    MEDIUM = "MEDIUM"                     # Weight: 0.50
    LOW = "LOW"                           # Weight: 0.25

class NodeOperationalStatus(str, Enum):
    HEALTHY = "HEALTHY"
    DEGRADED = "DEGRADED"
    FAILED = "FAILED"
    UNKNOWN = "UNKNOWN"

class ServiceNode(BaseModel):
    id: str = Field(..., description="Unique node slug, e.g. srv-stripe-primary")
    name: str = Field(..., description="Display name, e.g. Stripe Payments Gateway")
    category: ServiceCategory
    criticality: NodeCriticality
    provider_name: str = Field(..., description="Provider entity, e.g. Stripe, Inc.")
    status_url: Optional[str] = Field(None, description="Public status page URL")
    fallback_node_id: Optional[str] = Field(None, description="Optional redundant failover node ID")
    simulated_users_baseline: int = Field(default=10000, description="Baseline concurrent active users")
    status: NodeOperationalStatus = Field(default=NodeOperationalStatus.HEALTHY)
    metadata: Dict[str, str] = Field(default_factory=dict)

class DependencyEdge(BaseModel):
    id: str = Field(..., description="Edge ID, e.g. edge-checkout-stripe")
    source: str = Field(..., description="Dependent node ID (e.g. srv-checkout-svc)")
    target: str = Field(..., description="Upstream provider node ID (e.g. srv-stripe-primary)")
    is_hard_dependency: bool = Field(default=True, description="If True, upstream failure cascades directly")
    label: Optional[str] = Field(None)

class InfrastructureStack(BaseModel):
    id: str
    name: str
    description: str
    nodes: List[ServiceNode]
    edges: List[DependencyEdge]
```

### 2.2 Evidence & Incident Schemas (`schemas/incident_schema.py`)

```python
from enum import Enum
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, HttpUrl

class VerificationGrade(str, Enum):
    OFFICIAL_CONFIRMED = "OFFICIAL_CONFIRMED"
    NEWS_CORROBORATED = "NEWS_CORROBORATED"
    UNVERIFIED_EARLY_WARNING = "UNVERIFIED_EARLY_WARNING"
    REPLAY_HISTORICAL = "REPLAY_HISTORICAL"
    FIXTURE_FALLBACK = "FIXTURE_FALLBACK"

class EvidenceItem(BaseModel):
    id: str
    source_title: str
    source_url: str
    publisher: str
    published_at: Optional[str] = None
    retrieved_at: str
    raw_snippet: str
    signal_type: str # NEWS, STATUS_PAGE, ADVISORY
    verification_grade: VerificationGrade
    is_real_data: bool = True # False if fixture or simulation

class NormalizedIncident(BaseModel):
    incident_id: str
    provider_name: str
    mapped_node_id: Optional[str] = None
    mapping_confidence: float = 0.0
    mapping_rationale: str = ""
    summary: str
    severity: str # MINOR, MAJOR, CRITICAL
    status: str   # INVESTIGATING, IDENTIFIED, MONITORING, RESOLVED
    evidence_items: List[EvidenceItem]
    is_historical_replay: bool = False
```

---

## 3. Digital Twin Engine Implementation (`core/digital_twin.py`)

The Digital Twin engine uses `networkx.DiGraph` to represent directed infrastructure dependencies. 

> **Important Graph Direction Convention:**  
> An edge `(u, v)` represents that **$u$ depends on $v$** (`source=u`, `target=v`).  
> Therefore, if provider $v$ fails, the failure propagates **backwards** along the dependency arrow to all nodes that depend on $v$ (i.e. predecessors in the directed graph, or successors in the reversed graph $G_{rev}$).

```python
import networkx as nx
from typing import Dict, List, Set, Any
from app.schemas.environment_schema import (
    InfrastructureStack, ServiceNode, DependencyEdge, NodeCriticality, NodeOperationalStatus
)
from app.schemas.simulation_schema import BlastRadiusResult, SimulationMetrics

CRITICALITY_WEIGHTS: Dict[NodeCriticality, float] = {
    NodeCriticality.MISSION_CRITICAL: 1.00,
    NodeCriticality.HIGH: 0.75,
    NodeCriticality.MEDIUM: 0.50,
    NodeCriticality.LOW: 0.25,
}

class DigitalTwinEngine:
    def __init__(self, stack: InfrastructureStack):
        self.stack = stack
        self.graph = nx.DiGraph()
        self.node_lookup: Dict[str, ServiceNode] = {}
        self._build_graph()

    def _build_graph(self):
        for node in self.stack.nodes:
            self.node_lookup[node.id] = node
            self.graph.add_node(
                node.id,
                name=node.name,
                category=node.category.value,
                criticality=node.criticality,
                simulated_users=node.simulated_users_baseline,
                status=node.status.value,
                fallback_id=node.fallback_node_id
            )
        for edge in self.stack.edges:
            self.graph.add_edge(
                edge.source,
                edge.target,
                id=edge.id,
                is_hard=edge.is_hard_dependency
            )

    def propagate_failure(self, failed_node_id: str, severity_factor: float = 1.0) -> BlastRadiusResult:
        """
        Traverses downstream dependent nodes when target upstream provider fails.
        Uses reversed graph G_rev so that traversal follows dependency direction.
        """
        if failed_node_id not in self.graph:
            raise ValueError(f"Node {failed_node_id} does not exist in graph")

        g_rev = self.graph.reverse(copy=False)
        
        # BFS traversal to discover all dependent descendants
        affected_nodes_ids: Set[str] = set()
        propagation_paths: List[List[str]] = []
        
        for dependent in nx.descendants(g_rev, failed_node_id):
            affected_nodes_ids.add(dependent)
            # Find shortest dependency path from provider to dependent
            try:
                path = nx.shortest_path(g_rev, source=failed_node_id, target=dependent)
                propagation_paths.append(path)
            except nx.NetworkXNoPath:
                continue

        # Compute deterministic metrics
        total_cascade_score = 0.0
        total_users_at_risk = 0
        impacted_node_details = []

        for nid in affected_nodes_ids:
            node = self.node_lookup[nid]
            crit_weight = CRITICALITY_WEIGHTS.get(node.criticality, 0.5)
            score_contribution = crit_weight * severity_factor
            total_cascade_score += score_contribution
            total_users_at_risk += node.simulated_users_baseline
            
            impacted_node_details.append({
                "node_id": nid,
                "name": node.name,
                "criticality": node.criticality.value,
                "cascade_score": round(score_contribution, 2),
                "simulated_users_at_risk": node.simulated_users_baseline
            })

        # Base node itself
        base_node = self.node_lookup[failed_node_id]
        total_cascade_score += CRITICALITY_WEIGHTS[base_node.criticality] * severity_factor
        total_users_at_risk += base_node.simulated_users_baseline

        return BlastRadiusResult(
            root_cause_node_id=failed_node_id,
            root_cause_node_name=base_node.name,
            total_affected_services=len(affected_nodes_ids) + 1,
            cascade_impact_score=round(total_cascade_score, 2),
            estimated_users_at_risk=total_users_at_risk,
            affected_node_ids=list(affected_nodes_ids),
            impacted_nodes=impacted_node_details,
            propagation_paths=propagation_paths,
            provenance="COMPUTED_GRAPH_MODEL"
        )

    def simulate_mitigation(self, failed_node_id: str, fallback_node_id: str) -> Dict[str, Any]:
        """
        Simulates dynamic edge re-routing from primary failed node to secondary fallback.
        """
        # Create a deep copy of graph to keep baseline intact
        mitigated_graph = self.graph.copy()

        # Find all nodes that depend directly on the failed node
        direct_dependents = [u for u, v in self.graph.edges() if v == failed_node_id]

        # Re-route edges to fallback node
        for dep in direct_dependents:
            mitigated_graph.remove_edge(dep, failed_node_id)
            mitigated_graph.add_edge(dep, fallback_node_id, id=f"rerouted-{dep}-{fallback_node_id}", is_hard=True)

        # Create temporary engine on mitigated graph
        g_rev = mitigated_graph.reverse(copy=False)
        remaining_affected: Set[str] = set()

        if failed_node_id in mitigated_graph:
            for desc in nx.descendants(g_rev, failed_node_id):
                remaining_affected.add(desc)

        # Recalculate remaining impact
        mitigated_users = sum(self.node_lookup[nid].simulated_users_baseline for nid in remaining_affected)
        mitigated_score = sum(CRITICALITY_WEIGHTS[self.node_lookup[nid].criticality] for nid in remaining_affected)

        return {
            "mitigated_affected_count": len(remaining_affected) + 1, # failed provider remains failed
            "mitigated_cascade_score": round(mitigated_score + CRITICALITY_WEIGHTS[self.node_lookup[failed_node_id].criticality], 2),
            "mitigated_users_at_risk": mitigated_users,
            "remaining_affected_node_ids": list(remaining_affected),
            "status": "MITIGATION_EVALUATED"
        }
```

---

## 4. TinyFish Service Client & Fallback Engine (`services/tinyfish_client.py`)

```python
import httpx
import json
import logging
from typing import List, Dict, Any, Optional
from app.config import settings

logger = logging.getLogger("sentineltwin.tinyfish")

class TinyFishService:
    def __init__(self):
        self.api_key = settings.TINYFISH_API_KEY
        self.search_url = "https://api.search.tinyfish.ai"
        self.fetch_url = "https://api.fetch.tinyfish.ai"
        self.timeout = httpx.Timeout(10.0, connect=5.0)

    async def search_provider_signals(self, provider_name: str) -> List[Dict[str, Any]]:
        """
        Queries TinySearch for live incident/status signals.
        Falls back to local fixtures if API key is missing or request fails.
        """
        if not self.api_key:
            logger.warning("No TINYFISH_API_KEY configured. Loading offline fixtures.")
            return self._load_fixture_search(provider_name)

        headers = {
            "X-API-Key": self.api_key,
            "Accept": "application/json"
        }
        params = {
            "query": f"{provider_name} status outage incident degradation",
            "location": "US",
            "language": "en"
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(self.search_url, headers=headers, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    return data.get("results", [])
                else:
                    logger.error(f"TinySearch returned HTTP {resp.status_code}: {resp.text}")
                    return self._load_fixture_search(provider_name)
        except Exception as e:
            logger.error(f"Exception contacting TinySearch: {e}. Using fallback.")
            return self._load_fixture_search(provider_name)

    async def fetch_status_page(self, url: str) -> Dict[str, Any]:
        """
        Fetches status page content rendered via TinyFetch headless Chromium.
        """
        if not self.api_key:
            return self._load_fixture_fetch(url)

        headers = {
            "X-API-Key": self.api_key,
            "Content-Type": "application/json"
        }
        payload = {"urls": [url]}

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(self.fetch_url, headers=headers, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    results = data.get("results", [])
                    return results[0] if results else {}
                else:
                    return self._load_fixture_fetch(url)
        except Exception as e:
            logger.error(f"TinyFetch error: {e}")
            return self._load_fixture_fetch(url)

    def _load_fixture_search(self, provider_name: str) -> List[Dict[str, Any]]:
        with open("fixtures/tinyfish_stripe_outage.json", "r", encoding="utf-8") as f:
            fixture = json.load(f)
            return fixture.get("search_results", [])

    def _load_fixture_fetch(self, url: str) -> Dict[str, Any]:
        with open("fixtures/tinyfish_stripe_outage.json", "r", encoding="utf-8") as f:
            fixture = json.load(f)
            return fixture.get("fetch_result", {})
```
