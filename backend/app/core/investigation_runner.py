"""
investigation_runner.py
Manages async investigation runs and SSE event generation.

Each investigation run:
  1. Generates a unique run_id
  2. Searches TinyFish for provider signals
  3. Optionally fetches primary status page via TinyFetch
  4. Maps results to EvidenceItems
  5. Matches incident to a graph node
  6. Stores the incident in the in-memory store
  7. Yields SSE events throughout (log / evidence / incident_mapped / complete)
"""

import asyncio
import json
import uuid
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, AsyncGenerator, Optional

from backend.app.core.evidence_mapper import (
    map_search_results_to_evidence,
    map_fetch_result_to_evidence,
)

logger = logging.getLogger("sentineltwin.investigation")


# ─── In-memory run registry ──────────────────────────────────────────────────

_runs: Dict[str, Dict[str, Any]] = {}


def create_run(target_providers: List[str], mode: str = "LIVE_WEB") -> str:
    """Creates a new investigation run entry, returns run_id."""
    run_id = "inv-" + datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S") + "-" + uuid.uuid4().hex[:6]
    _runs[run_id] = {
        "run_id": run_id,
        "mode": mode,
        "target_providers": target_providers,
        "status": "PENDING",
        "events": [],          # buffered SSE events for late consumers
        "result": None,        # final result dict once complete
        "error": None,
        "tinyfish_provenance": {"search": "not_run", "fetch": "not_run"},
    }
    return run_id


def get_run(run_id: str) -> Optional[Dict[str, Any]]:
    return _runs.get(run_id)


def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _sse_event(event_type: str, data: Any) -> str:
    """Format a single SSE message."""
    return f"event: {event_type}\ndata: {json.dumps(data)}\n\n"


def _buf(run: Dict[str, Any], event_type: str, data: Any) -> str:
    """Buffer an SSE event in the run record and return the formatted string."""
    evt = _sse_event(event_type, data)
    run["events"].append(evt)
    return evt


# ─── Node matching ────────────────────────────────────────────────────────────

def _match_provider_to_node(provider_name: str, nodes: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """
    Simple heuristic: find the first node whose provider_name contains a keyword
    from the search provider name. Returns the matched node dict or None.
    """
    pname_lower = provider_name.lower()
    # Try direct substring match on provider_name field
    for node in nodes:
        node_provider = (node.get("provider_name") or "").lower()
        # Check if any word in pname_lower appears in node_provider or vice-versa
        for word in pname_lower.replace(",", "").split():
            if len(word) > 3 and word in node_provider:
                return node
    # Try matching against node name or id
    for node in nodes:
        node_name = (node.get("name") or "").lower()
        node_id = (node.get("id") or "").lower()
        for word in pname_lower.replace(",", "").split():
            if len(word) > 3 and (word in node_name or word in node_id):
                return node
    return None


# ─── Core investigation coroutine ─────────────────────────────────────────────

async def run_investigation(
    run_id: str,
    tinyfish_service,
    store,
) -> None:
    """
    Background coroutine that executes a full investigation and buffers SSE events.
    Designed to run as asyncio.create_task(...) so it doesn't block the HTTP response.
    """
    run = _runs.get(run_id)
    if not run:
        logger.error(f"run_investigation called with unknown run_id={run_id}")
        return

    run["status"] = "RUNNING"
    target_providers = run["target_providers"]
    all_evidence: List[Dict[str, Any]] = []
    retrieved_at = _now_iso()

    _buf(run, "log", {
        "timestamp": retrieved_at,
        "level": "INFO",
        "message": f"Investigation started. Querying TinyFish for {len(target_providers)} provider(s)."
    })

    # ── Step 1: Search signals for each provider ──────────────────────────────
    for provider in target_providers:
        _buf(run, "log", {
            "timestamp": _now_iso(),
            "level": "INFO",
            "message": f"TinySearch: querying signals for '{provider}'..."
        })

        query = f"{provider} status outage incident degradation"
        search_resp = await tinyfish_service.search_signals(query)
        raw_results = search_resp.get("results", [])
        provenance = search_resp.get("provenance", "fixture")
        current_search_provenance = run["tinyfish_provenance"]["search"]
        if current_search_provenance == "not_run":
            run["tinyfish_provenance"]["search"] = provenance
        elif current_search_provenance != provenance:
            run["tinyfish_provenance"]["search"] = "mixed"

        _buf(run, "log", {
            "timestamp": _now_iso(),
            "level": "INFO",
            "message": f"TinySearch: {len(raw_results)} result(s) for '{provider}' (provenance={provenance})"
        })

        evidence_batch = map_search_results_to_evidence(
            raw_results, provenance=provenance, retrieved_at=retrieved_at
        )
        all_evidence.extend(evidence_batch)

        # Emit each evidence item as SSE
        for evi in evidence_batch:
            _buf(run, "evidence", {k: v for k, v in evi.items() if k != "full_text"})

    # ── Step 2: Fetch primary status page for first provider ──────────────────
    primary_provider = target_providers[0] if target_providers else None
    status_page_url: Optional[str] = None

    # Find node to get status_url
    nodes = store.environment.get("nodes", [])
    matched_node = _match_provider_to_node(primary_provider or "", nodes) if primary_provider else None

    if matched_node:
        status_page_url = matched_node.get("status_url")

    if status_page_url:
        _buf(run, "log", {
            "timestamp": _now_iso(),
            "level": "INFO",
            "message": f"TinyFetch: fetching status page '{status_page_url}'..."
        })

        try:
            fetch_resp = await tinyfish_service.fetch_status_content(status_page_url)
            fetch_result = fetch_resp.get("fetch_result", {})
            fetch_prov = fetch_resp.get("provenance", "fixture")
            run["tinyfish_provenance"]["fetch"] = fetch_prov

            fetch_evi = map_fetch_result_to_evidence(
                fetch_result, provenance=fetch_prov, retrieved_at=retrieved_at
            )
            if fetch_evi:
                all_evidence.append(fetch_evi)
                _buf(run, "evidence", {k: v for k, v in fetch_evi.items() if k != "full_text"})
                _buf(run, "log", {
                    "timestamp": _now_iso(),
                    "level": "INFO",
                    "message": f"TinyFetch: status page extracted ({len(fetch_result.get('text', ''))} chars, provenance={fetch_prov})"
                })
        except Exception as e:
            run["tinyfish_provenance"]["fetch"] = "error"
            logger.error(f"TinyFetch failed for {status_page_url}: {e}")
            _buf(run, "log", {
                "timestamp": _now_iso(),
                "level": "WARNING",
                "message": f"TinyFetch: skipped '{status_page_url}' ({e})"
            })

    # ── Step 3: Map incident to graph node ────────────────────────────────────
    import hashlib
    incident_id = "inc-" + hashlib.sha1(
        (primary_provider or "unknown").encode()
    ).hexdigest()[:10]

    confidence = 0.0
    rationale = "No node matched"
    mapped_node_id: Optional[str] = None

    if matched_node:
        mapped_node_id = matched_node["id"]
        confidence = 0.95
        rationale = f"Provider '{primary_provider}' matched to node '{mapped_node_id}' via provider_name field"
        _buf(run, "incident_mapped", {
            "node_id": mapped_node_id,
            "status": "DEGRADED",
            "confidence": confidence,
            "rationale": rationale
        })
        _buf(run, "log", {
            "timestamp": _now_iso(),
            "level": "INFO",
            "message": f"Incident mapped → node '{mapped_node_id}' (confidence={confidence})"
        })

        # Mark node as FAILED in the graph
        for n in store.environment["nodes"]:
            if n["id"] == mapped_node_id:
                n["status"] = "FAILED"
        from backend.app.core.simulation import DigitalTwinEngine
        store.engine = DigitalTwinEngine(store.environment)

    # ── Step 4: Persist active incident ───────────────────────────────────────
    store.active_incident = {
        "incident_id": incident_id,
        "provider_name": primary_provider or "Unknown",
        "mapped_node_id": mapped_node_id,
        "match_confidence": confidence,
        "match_rationale": rationale,
        "summary": f"Detected degradation signals for {primary_provider}",
        "severity": "CRITICAL",
        "incident_status": "IDENTIFIED",
        "is_historical_replay": False,
        "first_observed_at": retrieved_at,
        "evidence_items": all_evidence,
    }

    # ── Step 5: Run propagation simulation ────────────────────────────────────
    sim_result = None
    if mapped_node_id:
        try:
            sim_result = store.run_propagation(mapped_node_id, severity=1.0)
        except Exception as e:
            logger.error(f"Propagation failed: {e}")

    # ── Step 6: Emit complete event ────────────────────────────────────────────
    run["status"] = "COMPLETE"
    run["result"] = {
        "incident_id": incident_id,
        "mapped_node_id": mapped_node_id,
        "total_evidence": len(all_evidence),
        "simulation": sim_result,
        "tinyfish_provenance": run["tinyfish_provenance"],
    }

    _buf(run, "complete", {
        "status": "FINISHED",
        "total_evidence": len(all_evidence),
        "mapped_node_id": mapped_node_id,
        "affected_nodes_count": (sim_result.get("total_affected_services", 0) if sim_result else 0),
        "tinyfish_provenance": run["tinyfish_provenance"],
    })

    _buf(run, "log", {
        "timestamp": _now_iso(),
        "level": "INFO",
        "message": f"Investigation complete. {len(all_evidence)} evidence item(s) collected."
    })


# ─── SSE stream generator ─────────────────────────────────────────────────────

async def stream_run_events(run_id: str) -> AsyncGenerator[str, None]:
    """
    Async generator that yields buffered + live SSE events for a given run_id.
    Polls the event buffer until the run is COMPLETE (or errors out).
    """
    run = _runs.get(run_id)
    if not run:
        yield _sse_event("error", {"message": f"Unknown run_id: {run_id}"})
        return

    emitted_count = 0
    max_wait_seconds = 60
    elapsed = 0

    while True:
        # Emit any newly buffered events
        events = run["events"]
        while emitted_count < len(events):
            yield events[emitted_count]
            emitted_count += 1

        if run["status"] in ("COMPLETE", "ERROR"):
            break

        if elapsed >= max_wait_seconds:
            yield _sse_event("error", {"message": "Investigation timed out"})
            break

        await asyncio.sleep(0.3)
        elapsed += 0.3

    # Drain any remaining events after completion
    events = run["events"]
    while emitted_count < len(events):
        yield events[emitted_count]
        emitted_count += 1
