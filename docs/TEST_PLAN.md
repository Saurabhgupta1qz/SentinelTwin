# SentinelTwin — Master Quality Assurance & Test Plan (TEST_PLAN)

**Document ID:** QA-001  
**Project:** SentinelTwin  
**Test Frameworks:** `pytest` (Backend), `Vitest` / React Testing Library (Frontend), `Playwright` (End-to-End)  
**Version:** 1.0.0  
**Target Coverage:** > 80% Core Backend Logic (Digital Twin & Normalizer)  

---

## 1. Test Strategy & Scope

The testing strategy for SentinelTwin focuses on verifying deterministic computational correctness, graceful external API failure degradation, and strict defensive isolation.

```
+-------------------------------------------------------------+
|                      TEST PYRAMID                           |
|                                                             |
|                   /  E2E Replay Demo  \   (Playwright)      |
|                  /---------------------\                    |
|                 /  API Integration Tests\  (FastAPI Client) |
|                /-------------------------\                  |
|               / Core Graph & Normalizer   \ (Pytest Unit)   |
|              /-----------------------------\                |
|             /  Schema & Boundary Validation \               |
+-------------------------------------------------------------+
```

---

## 2. Testing Levels & Tooling

### 2.1 Level 1: Unit & Algorithmic Tests (`pytest`)
- **Target:** `core/digital_twin.py`, `core/evidence_normalizer.py`, `core/recovery_planner.py`.
- **Focus:**
  - Mathematical correctness of NetworkX BFS blast-radius traversal.
  - Formula validation for Cascade Impact Score ($CIS$) and Users at Risk ($EUR$).
  - Dynamic graph edge rewiring logic during mitigation failover.
  - Evidence confidence scoring and provider matching heuristics.

### 2.2 Level 2: Service & Integration Tests (`pytest-asyncio` + `httpx`)
- **Target:** `services/tinyfish_client.py`, `api/routes_*.py`.
- **Focus:**
  - Mocked and live requests to TinySearch (`api.search.tinyfish.ai`) and TinyFetch (`api.fetch.tinyfish.ai`).
  - Automatic fallback to `fixtures/tinyfish_stripe_outage.json` when `TINYFISH_API_KEY` is absent or times out.
  - Server-Sent Events (SSE) investigation stream protocol compliance.

### 2.3 Level 3: Security & Safety Verification
- **Target:** SSRF prevention middleware and LLM prompt isolation.
- **Focus:**
  - Rejection of private IPv4/IPv6 ranges (`127.0.0.1`, `169.254.169.254`, `10.0.0.1`).
  - Verification that untrusted web text cannot escape XML tags or inject instructions into Claude prompts.
  - Codebase audit verifying zero live production credentials or modification endpoints.

### 2.4 Level 4: End-to-End 3-Minute Demo Walkthrough
- **Target:** Complete UI flow in dark console.
- **Focus:**
  - Load reference stack $\rightarrow$ trigger investigation $\rightarrow$ view live logs $\rightarrow$ highlight blast radius $\rightarrow$ toggle failover $\rightarrow$ inspect before/after delta $\rightarrow$ generate postmortem.
  - Verification of zero UI crashes, zero unhandled promise rejections, and correct Data Provenance badges.

---

## 3. Test Execution Commands

```bash
# Run all backend unit and integration tests
cd backend
pytest -v --tb=short

# Run specifically the digital twin mathematical simulation tests
pytest tests/test_digital_twin.py -v

# Run with coverage report
pytest --cov=app tests/

# Run frontend unit tests
cd ../frontend
npm run test:run
```
