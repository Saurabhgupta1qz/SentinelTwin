from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from typing import Dict, Any, Optional, List
import asyncio
import os

from backend.app.core.state import store
from backend.app.core.simulation import GraphInvalidException
from backend.app.services.tinyfish_client import TinyFishService, SSRFSecurityException, validate_url_for_ssrf
from backend.app.core.investigation_runner import (
    create_run, get_run, run_investigation, stream_run_events
)
from backend.app.schemas.models import (
    ServiceNodeSchema, DependencyEdgeSchema, PropagateRequest, MitigateRequest,
    ReportRequest, InvestigationStartRequest
)

app = FastAPI(
    title="SentinelTwin API",
    description="Incident Intelligence & Digital Twin Simulation Platform for AZINHACK '26",
    version="1.0.0"
)

tinyfish = TinyFishService()

# 1. CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. 413 Payload Too Large Middleware (> 1MB)
@app.middleware("http")
async def check_payload_size_limit(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > 1048576: # 1MB limit
        return JSONResponse(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            content={"detail": "Payload too large. Maximum allowed size is 1MB."}
        )
    return await call_next(request)

# 3. Exception Handlers (409 for GRAPH_INVALID, 400 for SSRF)
@app.exception_handler(GraphInvalidException)
async def graph_invalid_exception_handler(request: Request, exc: GraphInvalidException):
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={"detail": str(exc), "error_code": "GRAPH_INVALID"}
    )

@app.exception_handler(SSRFSecurityException)
async def ssrf_exception_handler(request: Request, exc: SSRFSecurityException):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": str(exc), "error_code": "SSRF_VIOLATION"}
    )

# 4. Health Endpoints (Both /health and /api/v1/health per requirements)
@app.get("/health")
@app.get("/api/v1/health")
async def get_health():
    tf_configured = bool(os.getenv("TINYFISH_API_KEY", "").strip())
    return {
        "status": "HEALTHY",
        "service": "SentinelTwin Backend",
        "version": "1.0.0",
        "active_environment": store.environment["id"],
        "node_count": len(store.environment["nodes"]),
        "edge_count": len(store.environment["edges"]),
        "external_integrations": {
            "tinyfish": {
                "configured": tf_configured,
                "mode": "LIVE_API" if tf_configured else "FIXTURE_FALLBACK"
            }
        }
    }

# 5. Environment Endpoints
@app.get("/api/environment")
async def get_environment():
    return store.get_environment()

@app.post("/api/environment/reset")
async def reset_environment():
    store.reset_to_default()
    return {"message": "Environment reset to default PayNest reference stack", "environment": store.get_environment()}

@app.post("/api/environment/nodes")
async def create_or_update_node(node: ServiceNodeSchema):
    result = store.add_or_update_node(node.model_dump())
    return {"message": "Node saved", "node": result}

@app.post("/api/environment/edges")
async def create_edge(edge: DependencyEdgeSchema):
    result = store.add_edge(edge.model_dump())
    return {"message": "Edge created", "edge": result}

# 6. Investigation & Replay Endpoints

@app.post("/api/investigation/start", status_code=202)
async def start_investigation(req: InvestigationStartRequest):
    """Kick off an async investigation. Returns run_id immediately."""
    providers = req.target_providers or ["Stripe, Inc."]
    run_id = create_run(providers, mode=req.mode or "LIVE_WEB")
    # Fire-and-forget the investigation coroutine
    asyncio.create_task(run_investigation(run_id, tinyfish, store))
    return {
        "run_id": run_id,
        "status": "STARTED",
        "stream_url": f"/api/investigation/stream/{run_id}",
        "message": "Investigation dispatched to TinyFish intelligence layer."
    }


@app.get("/api/investigation/stream/{run_id}")
async def stream_investigation(run_id: str):
    """SSE stream of investigation progress events."""
    run = get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail=f"Unknown run_id: {run_id}")

    async def event_generator():
        async for chunk in stream_run_events(run_id):
            yield chunk

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        }
    )


@app.post("/api/investigation/replay")
async def trigger_historical_replay():
    incident = store.load_historical_replay()
    # Run initial propagation for the mapped node
    mapped_node = incident.get("mapped_node_id", "stripe-primary")
    sim = store.run_propagation(mapped_node, severity=1.0)
    return {
        "message": "Historical replay loaded and mapped to graph",
        "incident": incident,
        "simulation": sim,
        "provenance": "HISTORICAL_REPLAY"
    }

@app.post("/api/investigation/live")
async def trigger_live_investigation(provider_name: str = "Stripe, Inc."):
    query = f"{provider_name} status outage incident degradation"
    search_res = await tinyfish.search_signals(query)
    
    # Extract evidence items from results
    evidence_items = []
    for item in search_res.get("results", []):
        evidence_items.append({
            "id": f"evi-{abs(hash(item.get('url', '')))}",
            "source_title": item.get("title", "Incident Advisory"),
            "source_url": item.get("url", "https://status.stripe.com"),
            "publisher": item.get("publisher", "web"),
            "published_at": item.get("published_date", "2026-10-18T08:30:00Z"),
            "retrieved_at": "2026-10-18T08:35:00Z",
            "raw_snippet": item.get("snippet", ""),
            "signal_type": "LIVE_SIGNAL",
            "verification_grade": "NEWS_CORROBORATED" if search_res.get("provenance") == "live" else "FIXTURE_FALLBACK",
            "is_real_data": search_res.get("provenance") == "live"
        })

    # Store active incident in memory
    store.active_incident = {
        "incident_id": f"inc-{abs(hash(query))}",
        "provider_name": provider_name,
        "mapped_node_id": "stripe-primary",
        "match_confidence": 0.95,
        "match_rationale": f"Matched provider '{provider_name}' to node 'stripe-primary'",
        "summary": f"Detected degradation signals for {provider_name}",
        "severity": "CRITICAL",
        "incident_status": "IDENTIFIED",
        "is_historical_replay": False,
        "first_observed_at": "2026-10-18T08:30:00Z",
        "evidence_items": evidence_items
    }

    # Mark node degraded in graph
    for n in store.environment["nodes"]:
        if n["id"] == "stripe-primary":
            n["status"] = "FAILED"
    store.engine = store.engine.__class__(store.environment)

    sim = store.run_propagation("stripe-primary", severity=1.0)

    return {
        "message": "Live investigation completed",
        "provenance": search_res.get("provenance", "fixture"),
        "incident": store.active_incident,
        "simulation": sim
    }

@app.get("/api/investigation/evidence")
async def get_investigation_evidence():
    evidence = store.get_evidence()
    prov = "HISTORICAL_REPLAY"
    if store.active_incident:
        prov = "HISTORICAL_REPLAY" if store.active_incident.get("is_historical_replay") else "LIVE"
    return {
        "total_evidence_items": len(evidence),
        "evidence_items": evidence,
        "provenance": prov
    }

# 7. Simulation Endpoints
@app.post("/api/simulation/propagate")
async def simulate_failure(req: PropagateRequest):
    try:
        result = store.run_propagation(req.root_cause_node_id, req.severity_factor)
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@app.post("/api/simulation/mitigate")
async def simulate_mitigation(req: MitigateRequest):
    try:
        result = store.run_mitigation(req.failed_node_id, req.fallback_node_id, req.severity_factor)
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

# 8. Report Generation
@app.post("/api/reports/generate")
async def generate_report(req: Optional[ReportRequest] = None):
    report = store.generate_template_report()
    return report
