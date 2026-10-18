import os
import json
import socket
import ipaddress
import logging
import asyncio
from typing import Dict, Any, List, Optional
from urllib.parse import urlparse
import httpx

logger = logging.getLogger("sentineltwin.tinyfish")

# Private and cloud metadata IP subnets to block (SSRF protection)
BLOCKED_NETWORKS = [
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("169.254.0.0/16"), # Link-local & AWS/GCP metadata (169.254.169.254)
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
    ipaddress.ip_network("fe80::/10")
]

class SSRFSecurityException(Exception):
    """Raised when a target URL violates SSRF security boundaries."""
    pass

def validate_url_for_ssrf(target_url: str) -> str:
    """
    Validates that a URL uses http/https and does not resolve to localhost,
    internal RFC 1918 subnets, or cloud instance metadata (169.254.169.254).
    """
    if not target_url:
        raise SSRFSecurityException("URL cannot be empty")

    parsed = urlparse(target_url)
    if parsed.scheme.lower() not in ["http", "https"]:
        raise SSRFSecurityException(f"Unsupported URL scheme '{parsed.scheme}'. Only http and https allowed.")

    hostname = parsed.hostname
    if not hostname:
        raise SSRFSecurityException(f"Invalid URL: missing hostname in '{target_url}'")

    # Block well-known loopback names directly
    if hostname.lower() in ["localhost", "127.0.0.1", "::1", "metadata.google.internal"]:
        raise SSRFSecurityException(f"SSRF violation: Hostname '{hostname}' is forbidden")

    # Resolve IP addresses
    try:
        ip_info = socket.getaddrinfo(hostname, None)
    except Exception as e:
        # If DNS resolution fails, allow or reject depending on policy
        raise SSRFSecurityException(f"SSRF validation error: Cannot resolve host '{hostname}': {e}")

    for item in ip_info:
        ip_str = item[4][0]
        ip_obj = ipaddress.ip_address(ip_str)
        for blocked_net in BLOCKED_NETWORKS:
            if ip_obj in blocked_net:
                raise SSRFSecurityException(
                    f"SSRF violation: '{hostname}' resolves to private/restricted IP '{ip_str}'"
                )

    return target_url


class TinyFishService:
    def __init__(self):
        self.api_key = os.getenv("TINYFISH_API_KEY", "").strip()
        self.search_url = os.getenv("TINYFISH_SEARCH_URL", "https://api.search.tinyfish.ai")
        self.fetch_url = os.getenv("TINYFISH_FETCH_URL", "https://api.fetch.tinyfish.ai")
        # Timeouts: 10s total, 5s connect
        self.timeout = httpx.Timeout(10.0, connect=5.0)
        self.max_retries = 2
        self.fixture_path = os.path.join(os.path.dirname(__file__), "..", "..", "fixtures", "tinyfish_stripe_outage.json")

    def _load_fixture(self) -> Dict[str, Any]:
        """Loads deterministic offline mock data."""
        with open(self.fixture_path, "r", encoding="utf-8") as f:
            return json.load(f)

    async def search_signals(self, query: str) -> Dict[str, Any]:
        """
        Queries TinySearch for recent incident news, advisories, and status reports.
        Never treats empty results or COMPLETED status without results as success.
        Falls back to fixtures with provenance='fixture'.
        """
        if not self.api_key:
            logger.info("No TINYFISH_API_KEY set. Operating in deterministic fixture mode.")
            fixture = self._load_fixture()
            return {
                "results": fixture.get("search_results", []),
                "provenance": "fixture",
                "source": "fixtures/tinyfish_stripe_outage.json",
                "query": query
            }

        headers = {
            "X-API-Key": self.api_key,
            "Accept": "application/json"
        }
        params = {
            "query": query,
            "location": "US",
            "language": "en"
        }

        # Up to 2 retries
        for attempt in range(self.max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    resp = await client.get(self.search_url, headers=headers, params=params)
                    if resp.status_code == 200:
                        data = resp.json()
                        results = data.get("results", [])
                        # Critical rule: never treat empty results as success
                        if results and len(results) > 0:
                            return {
                                "results": results,
                                "provenance": "live",
                                "source": "TinySearch API",
                                "query": query
                            }
                        else:
                            logger.warning("TinySearch returned 200 but 0 results. Falling back to fixture.")
                            break
                    elif resp.status_code in [429, 500, 502, 503, 504]:
                        if attempt < self.max_retries:
                            await asyncio.sleep(0.5 * (attempt + 1))
                            continue
                        else:
                            logger.error(f"TinySearch failed with HTTP {resp.status_code} after {self.max_retries} retries.")
                    else:
                        logger.error(f"TinySearch returned unexpected HTTP {resp.status_code}: {resp.text}")
                        break
            except Exception as e:
                logger.error(f"Exception contacting TinySearch (attempt {attempt + 1}): {e}")
                if attempt < self.max_retries:
                    await asyncio.sleep(0.5 * (attempt + 1))
                    continue

        # Fallback to fixture
        fixture = self._load_fixture()
        return {
            "results": fixture.get("search_results", []),
            "provenance": "fixture",
            "source": "fixtures/tinyfish_stripe_outage.json",
            "query": query,
            "note": "API query returned empty or failed. Fallback fixture activated."
        }

    async def fetch_status_content(self, target_url: str) -> Dict[str, Any]:
        """
        Renders target status page using TinyFetch headless Chromium fleet.
        Validates target URL against SSRF rules before dispatch.
        Never treats empty text as success.
        Falls back to fixtures with provenance='fixture'.
        """
        # 1. SSRF Check
        validate_url_for_ssrf(target_url)

        if not self.api_key:
            logger.info("No TINYFISH_API_KEY set. Using fetch fixture.")
            fixture = self._load_fixture()
            return {
                "fetch_result": fixture.get("fetch_result", {}),
                "provenance": "fixture",
                "url": target_url
            }

        headers = {
            "X-API-Key": self.api_key,
            "Content-Type": "application/json"
        }
        payload = {
            "urls": [target_url],
            "format": "markdown",
            "ttl": 0,           # Always fetch live (no cached copy)
        }

        for attempt in range(self.max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    resp = await client.post(self.fetch_url, headers=headers, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        results = data.get("results", [])
                        # Critical rule: never treat empty or missing text as success
                        if results and len(results) > 0 and results[0].get("text"):
                            return {
                                "fetch_result": results[0],
                                "provenance": "live",
                                "url": target_url
                            }
                        else:
                            logger.warning("TinyFetch returned 200 but empty text. Falling back.")
                            break
                    elif resp.status_code in [429, 500, 502, 503, 504]:
                        if attempt < self.max_retries:
                            await asyncio.sleep(0.5 * (attempt + 1))
                            continue
                    else:
                        break
            except Exception as e:
                logger.error(f"TinyFetch error on attempt {attempt + 1}: {e}")
                if attempt < self.max_retries:
                    await asyncio.sleep(0.5 * (attempt + 1))
                    continue

        fixture = self._load_fixture()
        return {
            "fetch_result": fixture.get("fetch_result", {}),
            "provenance": "fixture",
            "url": target_url,
            "note": "Live fetch unavailable or empty. Fallback fixture activated."
        }

    # TODO: Implement TinyAgent autonomous multi-step login workflow when required post-hackathon
    # TODO: Implement Server-Sent Events / Webhook streaming for long-running crawling sessions
