# SentinelTwin — AI Coding Agent Operating Guide (AGENTS.md)

**Target Agents:** Google Antigravity, Claude Code, Cursor, GitHub Copilot  
**Project:** SentinelTwin (AZINHACK '26 — Open Innovation, TinyFish Integrated)  
**Status:** Implementation Complete & Verified  

---

## 1. Core System Rules & Invariants

1. **Zero Production Mutation:** NEVER add code, API endpoints, or scripts that execute live changes on customer cloud or payment providers. SentinelTwin is strictly an observational and simulated decision-support system.
2. **Never Treat COMPLETED or Empty as Success:** TinyFish results must contain non-empty data. If results are empty or the request fails, the adapter must fall back to local JSON fixtures and label provenance accordingly.
3. **SSRF Guard:** All URLs fetched or parsed must pass through `validate_url_for_ssrf()` in `backend/app/services/tinyfish_client.py` (blocking `127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.169.254`, `::1`).
4. **Graph Validity Rules:** Reject dangling edges and self-loops on write. Block cycles at validation or simulation with HTTP `409 Conflict` and error code `GRAPH_INVALID`.
5. **Payload Limits:** The backend enforces a strict 1MB payload limit (`413 Content Too Large`).
6. **Round Half-Up:** All metric percentages and scores must be serialized using arithmetic `round_half_up()`.

---

## 2. Directory Layout

```
sentineltwin/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── simulation.py      # NetworkX DAG digital twin & propagation logic
│   │   │   └── state.py           # In-memory environment & report generator
│   │   ├── services/
│   │   │   └── tinyfish_client.py # TinySearch & TinyFetch adapter + SSRF validator
│   │   ├── schemas/
│   │   │   └── models.py          # Pydantic request/response schemas
│   │   └── main.py                # FastAPI routes & middlewares
│   ├── fixtures/
│   │   ├── paynest_graph.json     # PayNest reference stack (10,000 baseline users)
│   │   ├── stripe_outage_historical.json # Verified Stripe Oct 2024 outage replay
│   │   └── tinyfish_stripe_outage.json # TinyFish fallback search & fetch results
│   └── tests/
│       ├── test_simulation.py     # Golden value reproduction & DAG cycle tests
│       ├── test_api.py            # Endpoints, 413 limit, 409 cycle rejection tests
│       └── test_tinyfish.py       # SSRF protection & fixture fallback tests
└── frontend/
    ├── src/
    │   ├── App.tsx                # Main operations dashboard (React Flow + Panels)
    │   ├── main.tsx
    │   └── index.css              # Custom styling & @xyflow/react imports
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.ts
```

---

## 3. How to Run & Test

```bash
# Backend Test Suite (16 tests)
python -m pytest backend/tests/ -v

# Start Backend Server
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload

# Build Frontend Bundle
cd frontend
npm run build

# Start Frontend Dev Server
npm run dev
```

---

## 4. Golden Simulation Benchmarks (PayNest Stack)

- **Pre-mitigation Blast Radius:** $W = 23.2$
- **Post-mitigation Blast Radius:** $W = 10.2$ ($10.x$)
- **Users at Risk:** $1,964 \rightarrow 200$ users ($19.6\% \rightarrow 2.0\%$)
- **Transaction Success Rate:** $88.7\% \rightarrow 98.8\%$ (failure rate $11.3\% \rightarrow 1.2\%$)
- **Risk Reduction Delta:** $89.8\%$ user risk reduction
