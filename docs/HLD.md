# SentinelTwin — High-Level Design (HLD)

**Document ID:** HLD-001  
**Project:** SentinelTwin  
**Version:** 1.0.0  
**Target Window:** 24-Hour Implementation Window  

---

## 1. System Context Diagram (C4 Level 1)

SentinelTwin operates as an external intelligence, simulation, and decision-support workstation for incident response and infrastructure teams. It interfaces exclusively outwards to web intelligence and AI providers, without inbound or outbound mutation vectors into the customer's production cloud infrastructure.

```mermaid
C4Context
    title SentinelTwin - System Context Diagram (C4 Level 1)

    Person(operator, "Incident Commander / SRE", "Monitors external dependencies, tests failure scenarios, and evaluates mitigation plans.")

    System(sentinel, "SentinelTwin Platform", "Collects external incident evidence, maps it to internal dependency graph, simulates failure blast radius, and evaluates recovery mitigations.")

    System_Ext(tinyfish, "TinyFish AI Platform", "Provides live web search (TinySearch), headless Chromium content extraction (TinyFetch), and autonomous web workflows.")

    System_Ext(anthropic, "Anthropic Claude API", "Synthesizes structured evidence, blast radius, and mitigation metrics into an executive-ready incident postmortem.")

    System_Ext(providers, "Public Web & Status Pages", "Public status dashboards (e.g. status.stripe.com), news portals, and developer advisories.")

    System_Ext(prod, "Production Infrastructure", "Live customer workloads (AWS, Stripe, Cloudflare). ZERO MUTATION BY DESIGN.")

    Rel(operator, sentinel, "Configures graph, triggers investigations, evaluates recovery levers", "HTTPS / Web UI")
    Rel(sentinel, tinyfish, "Dispatches live web search and status page fetch requests", "HTTPS / REST (X-API-Key)")
    Rel(tinyfish, providers, "Crawls public status pages, Google search index, and news outlets", "HTTPS")
    Rel(sentinel, anthropic, "Requests grounded incident brief generation with structured facts", "HTTPS / REST")
    Rel_Back(operator, prod, "Executes approved manual production remediation out-of-band", "Production SSH / Cloud Console")
```

---

## 2. Container Architecture Diagram (C4 Level 2)

SentinelTwin is structured as a decoupled client-server architecture designed for rapid local deployment or containerized single-host execution.

```mermaid
graph TD
    subgraph BrowserClient ["Frontend Client (React 18 + Vite + TypeScript)"]
        UI_Nav["Top Navigation & Control Bar"]
        UI_Canvas["React Flow Graph Canvas (DAG Visualizer)"]
        UI_Evidence["Live Evidence Stream & Verification Panel"]
        UI_Sim["Blast Radius & Recovery Simulator"]
        UI_Brief["AI Incident Brief & Markdown Viewer"]
        UI_Console["Real-Time Execution Logs Drawer (SSE)"]
    end

    subgraph BackendApp ["SentinelTwin Backend Service (FastAPI + Python 3.11)"]
        API_Gateway["FastAPI App Router & Middleware (CORS, SSRF Guards)"]
        
        subgraph CoreEngines ["Core Domain Engines"]
            TF_Service["TinyFish Service Adapter (TinySearch + TinyFetch)"]
            Norm_Engine["Evidence Normalizer & Verification Classifier"]
            Map_Engine["Incident-to-Dependency Graph Mapper"]
            Twin_Engine["NetworkX Digital Twin Simulation Engine"]
            Plan_Engine["Ranked Recovery Action Planner"]
            AI_Engine["Claude 3.5 Brief Generator / Template Fallback"]
        end
        
        DB_Layer["Async SQLite Data Access Layer (aiosqlite)"]
        Fixtures["Offline Static JSON Fixtures (Stripe, Cloudflare)"]
    end

    subgraph ExternalServices ["External Cloud Services"]
        Ext_TinyFish["TinyFish REST API (api.search / api.fetch)"]
        Ext_Claude["Anthropic API (Claude 3.5 Sonnet)"]
    end

    %% Wiring
    BrowserClient -->|HTTP REST / OpenAPI| API_Gateway
    BrowserClient -->|Server-Sent Events / SSE| API_Gateway

    API_Gateway --> CoreEngines
    TF_Service --> Ext_TinyFish
    TF_Service -.->|Fallback if Offline| Fixtures
    AI_Engine --> Ext_Claude
    AI_Engine -.->|Fallback if Offline| Fixtures
    CoreEngines --> DB_Layer
    Twin_Engine --> CoreEngines
```

---

## 3. High-Level Component Interactions

### 3.1 Investigation & Failure Mapping Flow
```mermaid
sequenceDiagram
    autonumber
    actor SRE as Incident Commander
    participant UI as React Frontend
    participant API as FastAPI Backend
    participant TF as TinyFish Service
    participant ExtTF as TinyFish Cloud API
    participant Graph as NetworkX Digital Twin
    participant Claude as Anthropic API

    SRE->>UI: Click "Start Live Investigation"
    UI->>API: POST /api/investigation/start
    API-->>UI: 202 Accepted (Stream SSE logs)
    
    API->>TF: query_external_signals(providers)
    TF->>ExtTF: GET https://api.search.tinyfish.ai (Search Outage)
    ExtTF-->>TF: Return structured search hits (title, url, snippet)
    
    TF->>ExtTF: POST https://api.fetch.tinyfish.ai (Fetch status markdown)
    ExtTF-->>TF: Return clean status page markdown
    
    TF->>API: Raw Evidence Records
    API->>API: Normalize & Verify Evidence (Assign Grade)
    API->>Graph: Map Incident to Node ("srv-stripe-primary")
    
    API->>Graph: Inject Node Degradation (Severity 1.0)
    Graph->>Graph: Traverse DAG & Compute Blast Radius
    Graph-->>API: Blast Radius Metrics (5 nodes affected, 18.4k users)
    
    API-->>UI: SSE Push: Investigation Complete + Impacted Nodes
    UI->>UI: Update Canvas (Red/Amber Nodes + Impact Badges)
```

### 3.2 Recovery Simulation & Before-and-After Mitigation Flow
```mermaid
sequenceDiagram
    autonumber
    actor SRE as Incident Commander
    participant UI as React Frontend
    participant API as FastAPI Backend
    participant Graph as NetworkX Digital Twin
    participant Claude as Anthropic API

    SRE->>UI: Select "Activate Razorpay Secondary Failover"
    UI->>API: POST /api/simulation/mitigate {failed: "srv-stripe-primary", target: "srv-razorpay-backup"}
    
    API->>Graph: Rewire dynamic dependency edges in memory
    Graph->>Graph: Recompute downstream paths & metrics
    Graph-->>API: Mitigated metrics (1 node affected, 1.2k users at risk)
    
    API->>API: Calculate Delta (80% node recovery, 93.5% user risk reduction)
    API-->>UI: Return Comparative Metrics (Before vs After)
    UI->>UI: Render Green Recovery Banners & Edge Re-routing
    
    SRE->>UI: Click "Generate AI Incident Brief"
    UI->>API: POST /api/reports/generate
    API->>Claude: Submit verified evidence + metrics + recovery data
    Claude-->>API: Return Structured Markdown Postmortem
    API-->>UI: Display Executive Incident Brief with Source Citations
```

---

## 4. Architectural Design Decisions & Trade-Offs

| Decision | Choice | Alternatives Considered | Justification for 24-Hour Hackathon |
| :--- | :--- | :--- | :--- |
| **Backend Framework** | **FastAPI (Python 3.11)** | Node.js Express, Go Gin | First-class integration with `NetworkX` for graph algorithms and Pydantic for strict schema contracts. |
| **Graph Visualization** | **React Flow (`@xyflow/react`)** | Cytoscape.js, D3.js | Modern, customizable, declarative React node/edge rendering with built-in dragging, zooming, and animations. |
| **Graph Simulation Engine** | **NetworkX** | Neo4j, Custom Adjacency List | In-memory, zero-infrastructure overhead, mathematically rigorous graph traversal and shortest-path algorithms. |
| **Persistence Strategy** | **SQLite (`aiosqlite`)** | PostgreSQL, MongoDB | Zero external container requirements; single-file storage with asynchronous query performance sufficient for prototype. |
| **Real-Time Updates** | **Server-Sent Events (SSE)** | WebSockets, Polling | Lightweight unidirectional streaming for live execution logs without WebSocket handshake complexity. |
| **Fallback Architecture** | **Dual-Mode (Live + Fixtures)** | Live Only | Guarantees 100% demo success rate even during venue WiFi disruptions or third-party API rate limits. |
