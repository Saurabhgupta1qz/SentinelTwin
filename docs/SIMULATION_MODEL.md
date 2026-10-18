# SentinelTwin — Digital Twin Mathematical Simulation Model (SIMULATION_MODEL)

**Document ID:** SIM-001  
**Project:** SentinelTwin  
**Engine:** NetworkX Directed Acyclic Graph (DAG) Traversal  
**Version:** 1.0.0  

---

## 1. Graph Semantics & Formal Definitions

### 1.1 The Infrastructure Graph $G$
We model an organization's infrastructure as a directed finite graph:
$$G = (V, E)$$
Where:
- $V = \{v_1, v_2, \dots, v_n\}$ is the set of service nodes (internal services and external dependencies).
- $E \subseteq V \times V$ is the set of directed dependency edges.

### 1.2 Edge Direction Convention
An edge $e = (u, v) \in E$ denotes that **Service $u$ depends on Service $v$**.
- $u = \text{source}(e)$ (Dependent service)
- $v = \text{target}(e)$ (Upstream provider or infrastructure dependency)

> **Failure Propagation Invariant:**  
> If an upstream provider $v$ fails or degrades, the failure propagates **against** the directed edge into $u$, and from $u$ into all services that depend on $u$.  
> Formally, the propagation direction is identical to forward path traversal in the **reversed graph** $G_{rev} = (V, E_{rev})$ where $E_{rev} = \{(v, u) \mid (u, v) \in E\}$.

---

## 2. Node Attributes & Parameter Weights

Each node $v \in V$ is characterized by the tuple:
$$\mathcal{N}(v) = \langle \text{Name}_v, \text{Category}_v, \text{Crit}_v, U_v, S_v, F_v \rangle$$

Where:
- $\text{Crit}_v \in \{\text{MISSION\_CRITICAL}, \text{HIGH}, \text{MEDIUM}, \text{LOW}\}$ is the service criticality.
- $W(\text{Crit}_v) \in [0.25, 1.00]$ is the numeric criticality weight:
  $$W(\text{Crit}_v) = \begin{cases} 
  1.00 & \text{if } \text{MISSION\_CRITICAL} \\
  0.75 & \text{if } \text{HIGH} \\
  0.50 & \text{if } \text{MEDIUM} \\
  0.25 & \text{if } \text{LOW}
  \end{cases}$$
- $U_v \in \mathbb{N}$ is the baseline concurrent active user count utilizing service $v$.
- $S_v \in [0.0, 1.0]$ is the current operational failure factor ($0.0 = \text{Healthy}$, $0.5 = \text{Degraded}$, $1.0 = \text{Failed}$).
- $F_v \in V \cup \{\emptyset\}$ is the optional redundant fallback node ID.

---

## 3. Failure Propagation Algorithm

### 3.1 Downstream Blast Radius Discovery
Given a root-cause failing node $v_{\text{root}} \in V$ with failure factor $S_{v_{\text{root}}} \in (0, 1]$:

```python
def compute_downstream_blast_radius(G: nx.DiGraph, root_node: str, severity: float):
    # 1. Reverse graph to traverse downstream along dependency path
    G_rev = G.reverse(copy=False)
    
    # 2. Discover all reachable downstream descendants via BFS
    descendants = nx.descendants(G_rev, root_node)
    
    # 3. Construct blast radius set
    blast_radius = {root_node}.union(descendants)
    
    # 4. Compute shortest propagation paths for explainability
    propagation_paths = {}
    for target in descendants:
        propagation_paths[target] = nx.shortest_path(G_rev, source=root_node, target=target)
        
    return blast_radius, propagation_paths
```

---

## 4. Derived Metric Formulas

### 4.1 Cascade Impact Score ($CIS$)
The Cascade Impact Score quantifies organizational blast radius severity into a single normalized index:
$$CIS = W(\text{Crit}_{v_{\text{root}}}) \times S_{v_{\text{root}}} + \sum_{d \in \text{descendants}(G_{rev}, v_{\text{root}})} W(\text{Crit}_d) \times \text{Attenuation}(d)$$

Where $\text{Attenuation}(d)$ accounts for distance hops $h(v_{\text{root}}, d)$ in the DAG:
$$\text{Attenuation}(d) = \left( \frac{1}{1 + 0.1 \times (h - 1)} \right) \times S_{v_{\text{root}}}$$

### 4.2 Estimated Users at Risk ($EUR$)
The estimated total concurrent users impacted by the upstream outage:
$$EUR = \sum_{d \in \text{descendants}(G_{rev}, v_{\text{root}})} U_d$$
*(Deduplication ensures users active on shared microservices are counted accurately without double-inflating totals).*

### 4.3 Simulated Transaction Failure Rate ($TFR$)
For financial services pipelines, $TFR$ estimates checkout drop-off:
$$TFR = \min\left(100\%, \quad \left( \frac{EUR}{\sum_{v \in V_{\text{consumer}}} U_v} \right) \times S_{v_{\text{root}}} \times 100 \right)$$

---

## 5. Recovery Mitigation Simulation & Rewiring Logic

When an operator evaluates a mitigation lever (e.g. failing over from `srv-stripe-primary` to `srv-razorpay-backup`):

### 5.1 Dynamic Graph Rewiring Algorithm
1. Clone graph $G \rightarrow G_{\text{mitigated}}$.
2. For each node $u$ such that $(u, v_{\text{root}}) \in E(G)$:
   - Remove edge $(u, v_{\text{root}})$.
   - Add redirected edge $(u, F_{v_{\text{root}}})$ where $F_{v_{\text{root}}}$ is the active fallback node.
3. Mark $F_{v_{\text{root}}}$ as active and healthy ($S_{F} = 0.0$).
4. Re-run propagation on $G_{\text{mitigated}}$ from $v_{\text{root}}$.
5. Compute **Mitigated Cascade Score ($CIS_{\text{mitigated}}$)** and **Mitigated Users at Risk ($EUR_{\text{mitigated}}$)**.

### 5.2 Comparative Delta Metrics
$$\Delta \text{Service Recovery (\%)} = \left( 1 - \frac{|\text{BlastRadius}_{\text{mitigated}}|}{|\text{BlastRadius}_{\text{baseline}}|} \right) \times 100$$
$$\Delta \text{User Risk Reduction (\%)} = \left( 1 - \frac{EUR_{\text{mitigated}}}{EUR_{\text{baseline}}} \right) \times 100$$

### 5.3 Concrete Reference Case (PayPulse Stack)

| Metric | Pre-Mitigation Outage (Stripe Failed) | Post-Mitigation (Razorpay Failover) | Delta / Recovery |
| :--- | :--- | :--- | :--- |
| **Impacted Nodes** | 5 nodes (`Checkout`, `Order`, `Sub`, `Portal`, `Stripe`) | 1 node (`Stripe` remains down; all internal recover) | **80% Recovery** |
| **Cascade Score ($CIS$)** | 4.85 | 1.00 | **79.4% Reduction** |
| **Users at Risk ($EUR$)** | 18,400 concurrent users | 1,200 users (unmigrated webhook cron) | **93.5% Reduction** |
| **Est. Failure Rate ($TFR$)** | 34.2% | 1.8% | **94.7% Improvement** |
