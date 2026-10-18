import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from unittest.mock import patch
from backend.app.services.tinyfish_client import (
    TinyFishService, SSRFSecurityException, validate_url_for_ssrf
)

client = TestClient(app)

def test_ssrf_validator_valid_urls():
    fake_public_ip = [(2, 1, 6, "", ("93.184.216.34", 0))]
    with patch("backend.app.services.tinyfish_client.socket.getaddrinfo", return_value=fake_public_ip):
        assert validate_url_for_ssrf("https://status.stripe.com") == "https://status.stripe.com"
        assert validate_url_for_ssrf("http://example.com") == "http://example.com"

def test_ssrf_validator_blocks_forbidden_schemes():
    with pytest.raises(SSRFSecurityException, match="Unsupported URL scheme"):
        validate_url_for_ssrf("ftp://example.com")
    with pytest.raises(SSRFSecurityException, match="Unsupported URL scheme"):
        validate_url_for_ssrf("file:///etc/passwd")

def test_ssrf_validator_blocks_localhost_and_metadata():
    with pytest.raises(SSRFSecurityException, match="SSRF violation"):
        validate_url_for_ssrf("http://localhost:8000")
    with pytest.raises(SSRFSecurityException, match="SSRF violation"):
        validate_url_for_ssrf("http://127.0.0.1:8000")
    with pytest.raises(SSRFSecurityException, match="SSRF violation"):
        validate_url_for_ssrf("http://169.254.169.254/latest/meta-data")

import asyncio

def test_tinyfish_service_offline_fixture_fallback():
    service = TinyFishService()
    # Force empty API key to test deterministic fallback
    service.api_key = ""
    
    # 1. Search
    res_search = asyncio.run(service.search_signals("Stripe outage"))
    assert res_search["provenance"] == "fixture"
    assert len(res_search["results"]) >= 2
    assert "stripe" in res_search["results"][0]["title"].lower()

    # 2. Fetch
    res_fetch = asyncio.run(service.fetch_status_content("https://status.stripe.com"))
    assert res_fetch["provenance"] == "fixture"
    assert "Stripe System Status" in res_fetch["fetch_result"]["text"]

def test_live_investigation_endpoint():
    res = client.post("/api/investigation/live?provider_name=Stripe%2C%20Inc.")
    assert res.status_code == 200
    data = res.json()
    assert data["provenance"] in ["live", "fixture"]
    assert data["incident"]["mapped_node_id"] == "stripe-primary"
    assert len(data["incident"]["evidence_items"]) >= 1
    assert data["simulation"]["weighted_impact_score"] == 23.2
