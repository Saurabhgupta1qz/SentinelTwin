"""
evidence_mapper.py
Maps raw TinyFish Search and Fetch API results → normalised EvidenceItem dicts.

Live TinyFish Search result fields (verified against docs.tinyfish.ai 2026-10-18):
  position, site_name, title, snippet, url, date (optional, news/web), publisher (news only)

Fixture search results follow the same shape.
"""

import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional


def _make_evidence_id(url: str) -> str:
    """Stable, short, collision-resistant ID from URL."""
    return "evi-" + hashlib.sha1(url.encode()).hexdigest()[:10]


def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _classify_signal_type(url: str, site_name: str) -> str:
    """Heuristic: classify result as STATUS_PAGE, NEWS, or ADVISORY."""
    lower_url = url.lower()
    lower_site = (site_name or "").lower()
    if "status." in lower_url or "statuspage" in lower_url:
        return "STATUS_PAGE"
    if any(kw in lower_url or kw in lower_site for kw in [
        "techcrunch", "theregister", "theverge", "wired", "reuters",
        "bloomberg", "bbc", "cnbc", "zdnet", "venturebeat", "arstechnica"
    ]):
        return "NEWS"
    if any(kw in lower_url or kw in lower_site for kw in [
        "advisory", "cve", "cert", "nvd.nist", "security", "downdetector"
    ]):
        return "ADVISORY"
    return "NEWS"


def _verification_grade(signal_type: str, provenance: str) -> str:
    if provenance == "fixture":
        return "FIXTURE_FALLBACK"
    if signal_type == "STATUS_PAGE":
        return "OFFICIAL_CONFIRMED"
    if signal_type == "NEWS":
        return "NEWS_CORROBORATED"
    return "UNVERIFIED_EARLY_WARNING"


def map_search_results_to_evidence(
    results: List[Dict[str, Any]],
    provenance: str = "fixture",
    retrieved_at: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Convert TinyFish Search API results[] → list of EvidenceItem dicts.

    Args:
        results: raw results[] list from TinyFish Search response
        provenance: 'live' or 'fixture'
        retrieved_at: ISO8601 timestamp when data was pulled (defaults to now)

    Returns:
        List of normalised EvidenceItem dicts ready to store in active_incident.
    """
    if retrieved_at is None:
        retrieved_at = _now_iso()

    evidence_items = []
    for item in results:
        url = item.get("url", "")
        if not url:
            continue

        site_name = item.get("site_name", "")
        signal_type = _classify_signal_type(url, site_name)
        grade = _verification_grade(signal_type, provenance)

        # Live TinyFish uses 'date' field; fixture used to use 'published_date'
        # Support both to be safe.
        published_at = item.get("date") or item.get("published_date") or None

        evidence_items.append({
            "id": _make_evidence_id(url),
            "source_title": item.get("title") or "Incident Signal",
            "source_url": url,
            "publisher": item.get("publisher") or site_name or "web",
            "published_at": published_at,
            "retrieved_at": retrieved_at,
            "raw_snippet": item.get("snippet") or "",
            "signal_type": signal_type,
            "verification_grade": grade,
            "is_real_data": provenance == "live"
        })

    return evidence_items


def map_fetch_result_to_evidence(
    fetch_result: Dict[str, Any],
    provenance: str = "fixture",
    retrieved_at: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """
    Convert a single TinyFish Fetch API result → EvidenceItem dict.
    Returns None if no usable text found.
    """
    if retrieved_at is None:
        retrieved_at = _now_iso()

    url = fetch_result.get("url") or fetch_result.get("final_url", "")
    text = fetch_result.get("text") or ""
    if not url or not text:
        return None

    snippet = text[:300].replace("\n", " ").strip()
    signal_type = _classify_signal_type(url, fetch_result.get("title", ""))
    grade = _verification_grade(signal_type, provenance)

    return {
        "id": _make_evidence_id(url + ":fetch"),
        "source_title": fetch_result.get("title") or "Status Page Content",
        "source_url": fetch_result.get("final_url") or url,
        "publisher": fetch_result.get("site_name") or "status page",
        "published_at": fetch_result.get("published_date") or None,
        "retrieved_at": retrieved_at,
        "raw_snippet": snippet,
        "signal_type": signal_type,
        "verification_grade": grade,
        "is_real_data": provenance == "live",
        "full_text": text   # stored for Claude report grounding; not sent to frontend
    }
