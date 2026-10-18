# SentinelTwin — UI/UX Design Specification & Component Inventory (UI_UX)

**Document ID:** UI-001  
**Project:** SentinelTwin  
**Design Aesthetic:** Light Premium Production-Grade UI (Swiss / Linear / Stripe-like Precision)  
**CSS Framework:** Tailwind CSS 3.4 + CSS Variables  
**Canvas Library:** `@xyflow/react` (React Flow v12)  
**Version:** 2.0.0 (Updated: Visual Refactor to Light Premium Default)  

---

## 1. Design Philosophy & Principles (SUPERSEDED TO LIGHT PREMIUM)

> **IMPORTANT OVERRIDE:**  
> The previous "dark cybernetic ops-console" direction in sections 1 and 5 is **SUPERSEDED**.  
> The application now opens in **LIGHT mode by default**, with full dark mode support via `prefers-color-scheme: dark`.

1. **Light Premium Aesthetic:** Built with clean white surfaces (`--paper: #FFFFFF`), a soft background wash (`--wash: #F6F7F9`), hairline borders (`--line: #E6E9EF`), and high-contrast typography (`--ink: #0E1726`).
2. **Typography Precision:** Driven by **Geist** (Google Fonts) with system-ui fallback. All numbers and stats use tabular numerals (`tabular-nums font-semibold`). Monospace (`font-mono`) is reserved strictly for actual code snippets, runbooks, and CLI commands. Sentence case is used universally across all labels, buttons, and headers (zero ALL-CAPS).
3. **Unified Surface Hierarchy:**
   - Background wash: `--wash (#F6F7F9)`
   - Graph canvas: White panel with 1px `--line` border, 14px border radius (`rounded-panel`), and dotted-grid background (`--dot: #D9DDE6`).
   - Right inspector: Unified white column (`bg-paper`) separated by a hairline 1px left border (`--line`), rather than a disconnected stack of floating cards.
   - Segmented control tabs: Rounded wash container (`--wash`) where the active tab is white (`--paper`) with a subtle hairline border and soft shadow.
4. **Data Provenance Badging:** Every card, chart, and metric bears a clean provenance badge (`[Provenance: computed model]`, `[Provenance: historical replay]`, `[TinyFish intelligence]`).
5. **Zero Production Mutation Guarantee:** Advisory-only decision support with clear, human-approval runbooks.

---

## 2. Color Palette & Design Tokens (CSS Variables on `:root`)

All components reference CSS variables via Tailwind classes. No hard-coded hex colors are used in component code.

### 2.1 Design Tokens Table

| Token Name | Light (Default) | Dark (`prefers-color-scheme: dark`) | Semantic Role |
| :--- | :--- | :--- | :--- |
| `--paper` | `#FFFFFF` | `#0F1420` | Card, panel, and navigation bar background |
| `--wash` | `#F6F7F9` | `#151B29` | Outer viewport background wash |
| `--ink` | `#0E1726` | `#E8ECF4` | Primary text and major headers |
| `--ink2` | `#5B667A` | `#98A3B8` | Secondary labels, descriptions, and timestamps |
| `--line` | `#E6E9EF` | `#263044` | Hairline borders and dividers |
| `--acc` | `#1F3FD8` | `#8EA4FF` | Primary action accent, links, and focus rings |
| `--accbg` | `#EEF1FD` | `#1B2340` | Accent badges and subtle highlights |
| `--ok` | `#0F7B55` | `#3DD598` | Healthy service status and recovery deltas |
| `--okbg` | `#E7F5EE` | `#10301F` | Healthy status pill background |
| `--warn` | `#A45A06` | `#F0B34A` | Degraded service status and warning alerts |
| `--warnbg` | `#FDF1DC` | `#3A2A0C` | Degraded status pill background |
| `--bad` | `#C2262E` | `#FF7A80` | Outage alarms and root-cause service failures |
| `--badbg` | `#FCEAEA` | `#3C1519` | Outage status pill background |
| `--unk` | `#6B7385` | `#8E98AD` | Standby or unmonitored node status |
| `--rep` | `#5B33C4` | `#B79CFF` | Historical incident replay banner and badges |
| `--repbg` | `#F1ECFC` | `#241B40` | Historical replay watermark banner background |
| `--dot` | `#D9DDE6` | `#26304A` | Dotted grid canvas background pattern |

---

## 3. Screen Layout Architecture

```
+---------------------------------------------------------------------------------------------------------------+
| [LOGO] SentinelTwin  [Azinhack '26]  Stack: PayNest fintech  |  [Live scan]  [Historical replay]  [Reset]     |
+---------------------------------------------------------------------------------------------------------------+
| ⚠️ Historical incident replay — not a live outage               [Provenance: historical replay]               |
+-----------------------------------------------------------------------+---------------------------------------+
| GRAPH CANVAS PANEL (flex-[60], bg-paper, rounded-[14px])              | INSPECTOR COLUMN (flex-[40], bg-paper)|
|                                                                       |                                       |
| Service health: ● Healthy  ● Degraded  ● Outage  ● Standby            | [ Simulation | Evidence | Postmortem ]|
|                                                                       +---------------------------------------+
|  (Portal) Checkout UI ---> (Router) Payment ---> (Gateway) Stripe     | Incident status: Stripe outage        |
|                                         :         [FAILED]            |                                       |
|                                         v                             | Hero Metrics:                         |
|                                (Gateway) Razorpay                     | - Blast radius (W): 23.2 -> 10.2      |
|                                                                       | - Users at risk: 19.6% -> 2.0%        |
|                                                                       | - Success rate: 88.7% -> 98.8%        |
| What-if failure injection: [Select Node v] [Simulate outage]          |                                       |
|                                                                       | Recovery Mitigation Lever:            |
|                                                                       | [Apply Razorpay failover mitigation]  |
|                                                                       |                                       |
|                                                                       | Ranked Action Plan:                   |
|                                                                       | P0: Enable standby gateway failover   |
|                                                                       | P1: Pause subscription retry cron     |
+-----------------------------------------------------------------------+---------------------------------------+
```

---

## 4. Component Inventory

```
frontend/src/
├── App.tsx                    # Complete unified light operations console
├── main.tsx                   # React root mount
└── index.css                  # CSS variable design tokens and React Flow styling
```

---

## 5. Interaction States & Transitions (SUPERSEDED TO LIGHT PREMIUM)

### 5.1 Service Node Cards
- **Default:** White background (`bg-paper`), 1px hairline border (`border-line`), soft shadow (`shadow-sm`), rounded 12px (`rounded-card`).
- **Hover:** Border transitions to subtle accent or health hue, slight shadow elevation (`hover:shadow-md`).
- **Healthy Status:** Clean emerald pill (`bg-okbg text-ok border-ok/20`).
- **Degraded Status:** Warning amber card background tint (`bg-warnbg/30 border-warn text-ink`).
- **Failed / Outage Status:** High-visibility outage styling (`bg-badbg/40 border-bad text-ink`).
- **Typography:** Sentence case labels, tabular numbers on users and weights (`tabular-nums font-semibold`).

### 5.2 Segmented Control Tabs
- Container styled with `--wash` and hairline `--line` border.
- Active tab features `--paper` fill with subtle card shadow and high-contrast `--ink` text.
- Inactive tabs maintain clean `--ink2` with soft hover state.

### 5.3 Live and Replay Transitions
- Clicking **"Live scan (TinyFish)"** initiates real search/fetch and activates the Evidence tab.
- Clicking **"Historical replay drill"** renders the prominent top watermark banner:
  `⚠️ Historical incident replay — not a live outage`.
- Clicking **"Apply Razorpay failover mitigation"** dynamically redirects checkout graph edges to Razorpay in green (`--ok`), updates metrics ($19.6\% \rightarrow 2.0\%$), and displays the human-approved runbook.
