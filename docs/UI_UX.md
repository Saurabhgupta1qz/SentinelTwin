# SentinelTwin — UI/UX Design Specification & Component Inventory (UI_UX)

**Document ID:** UI-001  
**Project:** SentinelTwin  
**Design Aesthetic:** Dark Cybernetic Operations Console (SRE Mission Control)  
**CSS Framework:** Tailwind CSS 3.4  
**Canvas Library:** `@xyflow/react` (React Flow v12)  
**Version:** 1.0.0  

---

## 1. Design Philosophy & Principles

1. **Mission Control Aesthetic:** Built for high-stress incident situations—sleek dark background (`bg-slate-950`), high-contrast typography, crisp borders, and zero gaudy novelty effects.
2. **Visual Hierarchy:** The interactive dependency graph is the visual hero (65% width on desktop). Supporting evidence, simulation controls, and AI briefs sit in a synchronized side dock (35% width).
3. **Data Provenance Badging:** Every card, chart, and metric bears a visible origin badge:
   - `[REAL WEB SIGNAL]` (Cyan badge `#06B6D4`)
   - `[COMPUTED MODEL]` (Emerald badge `#10B981`)
   - `[SIMULATED ASSUMPTION]` (Purple badge `#8B5CF6`)
   - `[HISTORICAL REPLAY]` (Amber badge `#F59E0B`)
4. **Zero Broken or Decorative UI:** Every button executes a real backend action. No inert dummy controls.

---

## 2. Color Palette & Design Tokens

### 2.1 Color Tokens

| Token Name | Hex Code | Semantic Role |
| :--- | :--- | :--- |
| `bg-primary` | `#020617` (Slate 950) | Main viewport canvas background |
| `bg-surface` | `#0F172A` (Slate 900) | Card, panel, and navigation bar background |
| `bg-surface-hover`| `#1E293B` (Slate 800) | Interactive hover state |
| `border-subtle` | `#334155` (Slate 700) | Default divider and panel borders |
| `text-primary` | `#F8FAFC` (Slate 50) | Main headers and primary values |
| `text-secondary`| `#94A3B8` (Slate 400) | Labels, timestamps, and subtitles |
| `status-healthy`| `#10B981` (Emerald 500)| Healthy node status and successful recovery deltas |
| `status-degraded`| `#F59E0B` (Amber 500) | Degraded node status and warning alerts |
| `status-failed` | `#EF4444` (Red 500) | Hard node failure and root-cause outage alarms |
| `status-unknown`| `#64748B` (Slate 500) | Unverified or unmonitored node status |
| `accent-glow` | `#38BDF8` (Sky 400) | Focus states, active DAG edges, and search pulses |

---

## 3. Screen Layout & Wireframe Architecture

The application operates as a unified, single-page operations workstation:

```
+----------------------------------------------------------------------------------------------------------+
| [SENTINELTWIN LOGO]  Env: PayPulse Fintech v | Mode: [● Live Web] [Replay] | [Start Investigation] [Reset] |
+----------------------------------------------------------------------+-----------------------------------+
|                                                                      | [TABS: Evidence | Sim | AI Brief] |
|                                                                      +-----------------------------------+
|                                                                      | EVIDENCE STREAM (Verified Sources)|
|                    REACT FLOW DAG CANVAS                             | - [OFFICIAL] Stripe API Errors    |
|                                                                      |   https://status.stripe.com       |
|   (DNS) Cloudflare ---> (Compute) AWS EKS ---> (API) Checkout        |   "Elevated 500 error rates..."   |
|                                                     |                | - [NEWS] TechCrunch Alert         |
|                                                     v                |   "Payment glitch reported..."    |
|                                            (Gateway) Stripe [FAILED] +-----------------------------------+
|                                                     :                | DIGITAL TWIN SIMULATION           |
|                                                     : (Standby)      | Blast Radius: 5 Services (4.85)   |
|                                                     v                | Users at Risk: 18,400 (34.2% fail)|
|                                            (Gateway) Razorpay        +-----------------------------------+
|                                                                      | RECOVERY MITIGATION               |
|                                                                      | [Toggle: Switch to Razorpay]      |
|                                                                      | Delta: 18.4k -> 1.2k (93.5% Recov)|
+----------------------------------------------------------------------+-----------------------------------+
| [EXECUTION CONSOLE DRAWER] > TinySearch queried: 4 providers | Evidence normalized: 3 items | Twin ready |
+----------------------------------------------------------------------------------------------------------+
```

---

## 4. Frontend Component Inventory

```
frontend/src/
├── components/
│   ├── layout/
│   │   ├── TopNavBar.tsx              # Logo, environment dropdown, mode switcher, primary CTA
│   │   ├── ConsoleDrawer.tsx          # Collapsible bottom SSE execution log streamer
│   │   └── ProvenanceBadge.tsx        # Real / Computed / Simulated / Replay indicator
│   ├── graph/
│   │   ├── DependencyCanvas.tsx       # React Flow container with controls and background grid
│   │   ├── CustomServiceNode.tsx      # Custom node card with status rings and user counts
│   │   ├── CustomDependencyEdge.tsx   # Animated bezier edges indicating dependency flow
│   │   └── NodeDetailDrawer.tsx       # Flyout drawer for inspecting clicked node metadata
│   ├── panels/
│   │   ├── TabContainer.tsx           # Tab selector (Evidence, Simulation, AI Brief)
│   │   ├── EvidenceStreamPanel.tsx    # Scrollable feed of verified external signals
│   │   ├── SimulationControlPanel.tsx # What-if failure triggers and blast radius metrics
│   │   ├── MitigationComparison.tsx   # Before-and-after recovery metric comparison card
│   │   └── AIReportViewer.tsx         # Markdown incident postmortem with copy/export
│   └── common/
│       ├── MetricCard.tsx             # Stat display with diff indicators
│       ├── StatusPill.tsx             # Emerald/Amber/Red status indicator
│       └── RunbookCodeBlock.tsx       # Shell syntax highlighted mitigation commands
├── hooks/
│   ├── useInvestigationStream.ts      # SSE connection hook for real-time crawler logs
│   ├── useGraphSimulation.ts          # State management for failure injection and mitigation
│   └── useEnvironmentData.ts          # REST fetching and caching for nodes and edges
└── services/
    └── apiService.ts                  # Axios / Fetch client for FastAPI backend
```

---

## 5. Interaction States & Transitions

### 5.1 Graph Node Hover & Selection
- **Default:** Slate-900 fill, 1px border colored by operational health.
- **Hover:** Slight scale ($1.02\times$), subtle box-shadow glow matching status color.
- **Selected:** 2px bright sky-blue highlight border; opens `NodeDetailDrawer`.
- **Mitigated:** Pulsing emerald halo around the standby node when failover is activated.

### 5.2 Live Investigation Execution
1. User clicks **"Start Live Investigation"**.
2. Button enters loading state with spinning radar icon and label `"Scanning Web Signals..."`.
3. Bottom `ConsoleDrawer` automatically expands to height `140px`, streaming colored log lines.
4. When incident is detected on Stripe, the node on the canvas triggers an amber pulse animation, transitioning to red when verified.
