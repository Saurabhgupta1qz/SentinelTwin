from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class ServiceNodeSchema(BaseModel):
    id: str
    name: str
    category: str = "API_BACKEND"
    criticality: str = "HIGH"
    weight: float = 1.0
    provider_name: str = "PayNest Internal"
    status_url: Optional[str] = None
    fallback_node_id: Optional[str] = None
    baseline_users: int = 0
    status: str = "HEALTHY"
    position: Optional[Dict[str, float]] = None

class DependencyEdgeSchema(BaseModel):
    id: str
    source: str
    target: str
    is_hard_dependency: bool = True
    label: Optional[str] = None

class EnvironmentSchema(BaseModel):
    id: str
    name: str
    description: str
    total_baseline_users: int = 10000
    nodes: List[ServiceNodeSchema]
    edges: List[DependencyEdgeSchema]

class PropagateRequest(BaseModel):
    root_cause_node_id: str
    severity_factor: float = 1.0

class MitigateRequest(BaseModel):
    failed_node_id: str
    fallback_node_id: Optional[str] = None
    severity_factor: float = 1.0

class ReportRequest(BaseModel):
    incident_id: Optional[str] = None
    mode: Optional[str] = "template"


class InvestigationStartRequest(BaseModel):
    mode: Optional[str] = "LIVE_WEB"
    target_providers: Optional[List[str]] = None
