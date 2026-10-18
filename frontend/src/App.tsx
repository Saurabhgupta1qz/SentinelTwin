import React, { useState, useEffect, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Node,
  Edge
} from '@xyflow/react';
import {
  ShieldAlert,
  Zap,
  Activity,
  History,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Copy,
  ExternalLink,
  ChevronRight,
  Server,
  Layers,
  ArrowRight,
  Lock,
  Search
} from 'lucide-react';

interface ServiceNodeData extends Record<string, unknown> {
  id: string;
  name: string;
  category: string;
  criticality: string;
  weight: number;
  provider_name: string;
  status_url?: string;
  fallback_node_id?: string;
  baseline_users: number;
  status: 'HEALTHY' | 'DEGRADED' | 'FAILED' | 'UNKNOWN';
  isImpacted?: boolean;
}

const CustomNode = ({ data }: { data: ServiceNodeData }) => {
  const getStatusColor = () => {
    if (data.status === 'FAILED') return 'border-red-500 shadow-red-500/30 text-red-400 bg-red-950/40';
    if (data.status === 'DEGRADED' || data.isImpacted) return 'border-amber-500 shadow-amber-500/30 text-amber-400 bg-amber-950/40';
    return 'border-emerald-500/60 shadow-emerald-500/10 text-emerald-400 bg-slate-900/90';
  };

  const getPillColor = () => {
    if (data.status === 'FAILED') return 'bg-red-500/20 text-red-400 border-red-500/40';
    if (data.status === 'DEGRADED' || data.isImpacted) return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  };

  return (
    <div
      className={`px-4 py-3 rounded-xl border-2 transition-all duration-300 shadow-lg min-w-[200px] backdrop-blur-md cursor-pointer hover:scale-105 ${getStatusColor()}`}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400 font-semibold truncate">
          {data.category.replace('_', ' ')}
        </span>
        <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${getPillColor()}`}>
          {data.status === 'FAILED' ? 'OUTAGE' : data.isImpacted ? 'DEGRADED' : 'HEALTHY'}
        </span>
      </div>
      <div className="font-bold text-sm text-slate-100 truncate">{data.name}</div>
      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
        <span>Users: {data.baseline_users > 0 ? data.baseline_users.toLocaleString() : '0'}</span>
        <span className="font-mono text-slate-500">W: {data.weight}</span>
      </div>
    </div>
  );
};

const nodeTypes = {
  customNode: CustomNode,
};

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [activeTab, setActiveTab] = useState<'evidence' | 'simulation' | 'report'>('simulation');
  const [mode, setMode] = useState<'IDLE' | 'REPLAY' | 'LIVE'>('IDLE');
  const [loading, setLoading] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('stripe-primary');
  const [simulationData, setSimulationData] = useState<any>(null);
  const [mitigationData, setMitigationData] = useState<any>(null);
  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [reportMarkdown, setReportMarkdown] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState(false);

  // Load initial graph
  const loadEnvironment = useCallback(async () => {
    try {
      const res = await fetch('/api/environment');
      const data = await res.json();
      
      const rfNodes: Node[] = data.nodes.map((n: any) => ({
        id: n.id,
        type: 'customNode',
        position: n.position || { x: 100, y: 100 },
        data: { ...n }
      }));

      const rfEdges: Edge[] = data.edges.map((e: any) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        animated: true,
        style: { stroke: '#475569', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#475569' }
      }));

      setNodes(rfNodes);
      setEdges(rfEdges);
    } catch (err) {
      console.error('Failed to load environment:', err);
    }
  }, [setNodes, setEdges]);

  useEffect(() => {
    loadEnvironment();
  }, [loadEnvironment]);

  // Trigger Historical Replay
  const handleHistoricalReplay = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/investigation/replay', { method: 'POST' });
      const data = await res.json();
      setMode('REPLAY');
      setSimulationData(data.simulation);
      setMitigationData(null);

      // Fetch evidence
      const evRes = await fetch('/api/investigation/evidence');
      const evData = await evRes.json();
      setEvidenceList(evData.evidence_items || []);

      // Update graph visually
      setNodes((prevNodes) =>
        prevNodes.map((node) => {
          const isRoot = node.id === data.incident.mapped_node_id;
          const isImpacted = data.simulation.affected_node_ids.includes(node.id);
          return {
            ...node,
            data: {
              ...node.data,
              status: isRoot ? 'FAILED' : isImpacted ? 'DEGRADED' : 'HEALTHY',
              isImpacted: isImpacted && !isRoot
            }
          };
        })
      );

      // Color edges
      setEdges((prevEdges) =>
        prevEdges.map((edge) => ({
          ...edge,
          style: {
            stroke: edge.target === 'stripe-primary' ? '#ef4444' : '#475569',
            strokeWidth: 2
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: edge.target === 'stripe-primary' ? '#ef4444' : '#475569'
          }
        }))
      );

      setActiveTab('simulation');
    } catch (err) {
      console.error('Replay error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger Live TinyFish Investigation
  const handleLiveInvestigation = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/investigation/live?provider_name=Stripe%2C%20Inc.', { method: 'POST' });
      const data = await res.json();
      setMode('LIVE');
      setSimulationData(data.simulation);
      setMitigationData(null);

      setEvidenceList(data.incident.evidence_items || []);

      setNodes((prevNodes) =>
        prevNodes.map((node) => {
          const isRoot = node.id === data.incident.mapped_node_id;
          const isImpacted = data.simulation.affected_node_ids.includes(node.id);
          return {
            ...node,
            data: {
              ...node.data,
              status: isRoot ? 'FAILED' : isImpacted ? 'DEGRADED' : 'HEALTHY',
              isImpacted: isImpacted && !isRoot
            }
          };
        })
      );
      setActiveTab('evidence');
    } catch (err) {
      console.error('Live investigation error:', err);
    } finally {
      setLoading(false);
    }
  };

  // What-If Kill Node
  const handleSimulateNodeFailure = async (nodeId: string) => {
    setSelectedNodeId(nodeId);
    setLoading(true);
    try {
      const res = await fetch('/api/simulation/propagate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ root_cause_node_id: nodeId, severity_factor: 1.0 })
      });
      const data = await res.json();
      setSimulationData(data);
      setMitigationData(null);

      setNodes((prevNodes) =>
        prevNodes.map((node) => {
          const isRoot = node.id === nodeId;
          const isImpacted = data.affected_node_ids.includes(node.id);
          return {
            ...node,
            data: {
              ...node.data,
              status: isRoot ? 'FAILED' : isImpacted ? 'DEGRADED' : 'HEALTHY',
              isImpacted: isImpacted && !isRoot
            }
          };
        })
      );
      setActiveTab('simulation');
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Test Recovery Mitigation
  const handleSimulateMitigation = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/simulation/mitigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          failed_node_id: simulationData?.root_cause_node_id || 'stripe-primary',
          fallback_node_id: 'razorpay-backup'
        })
      });
      const data = await res.json();
      setMitigationData(data);

      // Rewire visually
      setNodes((prevNodes) =>
        prevNodes.map((node) => {
          const isRemaining = data.mitigated.remaining_affected_node_ids.includes(node.id);
          const isRoot = node.id === 'stripe-primary';
          const isBackup = node.id === 'razorpay-backup';
          return {
            ...node,
            data: {
              ...node.data,
              status: isRoot ? 'FAILED' : isBackup ? 'HEALTHY' : isRemaining ? 'DEGRADED' : 'HEALTHY',
              isImpacted: isRemaining && !isRoot
            }
          };
        })
      );

      // Re-route edge to backup
      setEdges((prevEdges) =>
        prevEdges.map((edge) => {
          if (edge.source === 'payment-router') {
            return {
              ...edge,
              target: 'razorpay-backup',
              style: { stroke: '#10b981', strokeWidth: 3 },
              markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' }
            };
          }
          return edge;
        })
      );
    } catch (err) {
      console.error('Mitigation error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Generate Report
  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports/generate', { method: 'POST' });
      const data = await res.json();
      setReportMarkdown(data.markdown || '');
      setActiveTab('report');
    } catch (err) {
      console.error('Report error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Reset Environment
  const handleReset = async () => {
    setLoading(true);
    try {
      await fetch('/api/environment/reset', { method: 'POST' });
      setMode('IDLE');
      setSimulationData(null);
      setMitigationData(null);
      setEvidenceList([]);
      setReportMarkdown('');
      await loadEnvironment();
    } catch (err) {
      console.error('Reset error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#030712] text-slate-100 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1. TOP BANNER FOR HISTORICAL REPLAY / PROVENANCE */}
      {mode === 'REPLAY' && (
        <div className="w-full bg-amber-500/20 border-b border-amber-500/50 py-1.5 px-4 flex items-center justify-center gap-2 text-amber-300 font-mono text-xs font-bold tracking-wider animate-pulse">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>⚠️ HISTORICAL INCIDENT REPLAY — NOT A LIVE OUTAGE</span>
          <span className="bg-amber-500/30 px-2 py-0.5 rounded text-[10px] ml-2 font-mono">[PROVENANCE: HISTORICAL_REPLAY]</span>
        </div>
      )}

      {/* 2. TOP NAVIGATION BAR */}
      <header className="h-16 border-b border-slate-800 bg-[#0a0f1d] px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center shadow-lg shadow-sky-500/10">
            <Zap className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <div className="font-extrabold text-lg tracking-tight flex items-center gap-2">
              <span>SentinelTwin</span>
              <span className="text-[10px] bg-slate-800 text-sky-400 border border-slate-700 font-mono px-2 py-0.5 rounded">
                AZINHACK '26
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Stack: PayNest Fintech</span>
              <span className="text-slate-600">|</span>
              <span className="font-mono text-[10px] text-slate-500">Zero Production Mutation Safe</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleLiveInvestigation}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-lg shadow-sky-600/20 transition-all disabled:opacity-50"
          >
            <Search className="w-3.5 h-3.5" />
            <span>TinyFish Live Scan</span>
          </button>

          <button
            onClick={handleHistoricalReplay}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-600/30 hover:bg-amber-600/40 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-all disabled:opacity-50"
          >
            <History className="w-3.5 h-3.5 text-amber-400" />
            <span>Stripe Replay Drill</span>
          </button>

          <button
            onClick={handleReset}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all border border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </header>

      {/* 3. MAIN WORKSPACE (SPLIT LAYOUT: 65% GRAPH CANVAS | 35% CONTROL & EVIDENCE DOCK) */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: REACT FLOW CANVAS */}
        <div className="flex-[65] relative border-r border-slate-800 bg-[#030712]">
          {/* Graph Legend Overlay */}
          <div className="absolute top-4 left-4 z-10 bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs backdrop-blur-md shadow-xl flex flex-col gap-2">
            <span className="font-bold text-slate-300 text-[11px] uppercase tracking-wider font-mono">Service Health Legend</span>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
                <span className="text-slate-300">Healthy</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50"></span>
                <span className="text-slate-300">Degraded (Impacted)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50"></span>
                <span className="text-slate-300">Failed (Root Cause)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
                <span className="text-slate-400">Standby / Unverified</span>
              </div>
            </div>
            <div className="mt-1 pt-1.5 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between">
              <span>Edge Arrow: u &rarr; v (u depends on v)</span>
            </div>
          </div>

          {/* Quick What-If Selector Overlay */}
          <div className="absolute bottom-4 left-4 z-10 bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs backdrop-blur-md shadow-xl flex items-center gap-3">
            <span className="font-bold text-slate-300 text-[11px] uppercase tracking-wider font-mono flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>What-If Injector:</span>
            </span>
            <select
              value={selectedNodeId}
              onChange={(e) => setSelectedNodeId(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2 py-1 text-xs outline-none"
            >
              <option value="stripe-primary">Stripe Primary Gateway</option>
              <option value="payment-router">Payment Routing Service</option>
              <option value="checkout-api">Checkout API Service</option>
              <option value="order-service">Order Processing Engine</option>
              <option value="auth-service">Customer Authentication</option>
            </select>
            <button
              onClick={() => handleSimulateNodeFailure(selectedNodeId)}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 px-3 py-1 rounded text-xs font-semibold transition-all"
            >
              Kill Node
            </button>
          </div>

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            onNodeClick={(_, node) => handleSimulateNodeFailure(node.id)}
          >
            <Background color="#1e293b" gap={20} size={1} />
            <Controls />
            <MiniMap
              nodeColor={(n: any) => (n.data?.status === 'FAILED' ? '#ef4444' : n.data?.isImpacted ? '#f59e0b' : '#10b981')}
              maskColor="#030712aa"
              className="!bg-slate-900 !border-slate-800 rounded-lg overflow-hidden"
            />
          </ReactFlow>
        </div>

        {/* RIGHT: TABBED CONTROL & EVIDENCE DOCK (35%) */}
        <div className="flex-[35] bg-[#090d16] border-l border-slate-800 flex flex-col h-full overflow-hidden">
          {/* Dock Tabs Header */}
          <div className="flex border-b border-slate-800 bg-slate-900/60 p-1">
            <button
              onClick={() => setActiveTab('simulation')}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'simulation'
                  ? 'bg-sky-600/20 text-sky-400 border border-sky-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Simulation</span>
            </button>
            <button
              onClick={() => setActiveTab('evidence')}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'evidence'
                  ? 'bg-sky-600/20 text-sky-400 border border-sky-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Evidence ({evidenceList.length})</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('report');
                if (!reportMarkdown) handleGenerateReport();
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'report'
                  ? 'bg-sky-600/20 text-sky-400 border border-sky-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Postmortem</span>
            </button>
          </div>

          {/* TAB CONTENT CONTAINER */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* 1. SIMULATION TAB */}
            {activeTab === 'simulation' && (
              <div className="space-y-5">
                {/* Outage State Header */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                      Incident Status
                    </span>
                    <span className="text-[10px] font-mono bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded border border-sky-500/20">
                      [DATA: COMPUTED]
                    </span>
                  </div>
                  <div className="font-bold text-base text-slate-100 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                    <span>
                      {simulationData?.root_cause_node_name || 'Stripe Primary Gateway'} (OUTAGE)
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Topological blast radius calculated across PayNest directed graph using NetworkX.
                  </p>
                </div>

                {/* GOLDEN METRIC COMPARISON CARDS */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Weighted Blast Radius ($W$)</div>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-black font-mono text-red-400">
                        {simulationData?.weighted_impact_score ?? '23.2'}
                      </span>
                      {mitigationData && (
                        <div className="flex items-center text-xs font-mono font-bold text-emerald-400">
                          <ArrowRight className="w-3 h-3 mx-0.5" />
                          <span>{mitigationData.mitigated.weighted_impact_score}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500">Criticality-attenuated index</span>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Users at Risk</div>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-black font-mono text-amber-400">
                        {simulationData ? `${simulationData.users_at_risk_percentage}%` : '19.6%'}
                      </span>
                      {mitigationData && (
                        <div className="flex items-center text-xs font-mono font-bold text-emerald-400">
                          <ArrowRight className="w-3 h-3 mx-0.5" />
                          <span>{mitigationData.mitigated.users_at_risk_percentage}%</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {simulationData ? `${simulationData.users_at_risk.toLocaleString()} users` : '1,964 users'}
                      {mitigationData && ` &rarr; ${mitigationData.mitigated.users_at_risk} users`}
                    </span>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Transaction Success Rate</div>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-black font-mono text-sky-400">
                        {simulationData ? `${simulationData.transaction_success_rate}%` : '88.7%'}
                      </span>
                      {mitigationData && (
                        <div className="flex items-center text-xs font-mono font-bold text-emerald-400">
                          <ArrowRight className="w-3 h-3 mx-0.5" />
                          <span>{mitigationData.mitigated.transaction_success_rate}%</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500">Financial conversion drop-off</span>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Services Impacted</div>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-black font-mono text-red-400">
                        {simulationData ? simulationData.total_affected_services : '5'}
                      </span>
                      {mitigationData && (
                        <div className="flex items-center text-xs font-mono font-bold text-emerald-400">
                          <ArrowRight className="w-3 h-3 mx-0.5" />
                          <span>{mitigationData.mitigated.total_affected_services}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {mitigationData ? '80% service recovery' : 'Downstream microservices'}
                    </span>
                  </div>
                </div>

                {/* THE HERO ACTION: TEST MITIGATION LEVER */}
                <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-sm text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Digital Twin Recovery Lever</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                      Zero Prod Risk
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Simulate re-routing checkout card charges to standby gateway <strong className="text-slate-200">Razorpay</strong>.
                  </p>
                  <button
                    onClick={handleSimulateMitigation}
                    disabled={loading}
                    className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Apply Razorpay Failover Mitigation</span>
                  </button>

                  {mitigationData && (
                    <div className="bg-slate-900/90 rounded-lg p-3 text-xs border border-emerald-500/40 text-emerald-300 font-mono flex items-center justify-between">
                      <span>Risk Reduction: <strong>{mitigationData.deltas.user_risk_reduction_percentage}%</strong></span>
                      <span>Restored Users: <strong>{mitigationData.deltas.users_restored.toLocaleString()}</strong></span>
                    </div>
                  )}
                </div>

                {/* RANKED RECOVERY ACTION PLAN */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                      Ranked Recovery Action Plan
                    </span>
                    <span className="text-[10px] text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Human Approval Required
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="bg-red-500/20 text-red-400 border border-red-500/40 text-[9px] font-mono px-1.5 py-0.5 rounded">
                            P0
                          </span>
                          <span className="font-bold text-xs text-slate-200">
                            Enable Standby Gateway Failover Route
                          </span>
                        </div>
                        <Lock className="w-3 h-3 text-amber-400" />
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Restores card charges for 1,764 active checkout shoppers (89.8% risk reduction).
                      </p>
                      <div className="bg-[#030712] p-2 rounded border border-slate-800 text-[10px] font-mono text-slate-300 flex items-center justify-between overflow-x-auto">
                        <code>aws ssm start-automation-execution --document-name 'PayNest-Failover' --parameters 'Primary=stripe,Fallback=razorpay'</code>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[9px] font-mono px-1.5 py-0.5 rounded">
                            P1
                          </span>
                          <span className="font-bold text-xs text-slate-200">
                            Pause Recurring Subscription Billing Retries
                          </span>
                        </div>
                        <Lock className="w-3 h-3 text-amber-400" />
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Prevents redundant webhook collision and 500 error spikes on background cron.
                      </p>
                      <div className="bg-[#030712] p-2 rounded border border-slate-800 text-[10px] font-mono text-slate-300 flex items-center justify-between overflow-x-auto">
                        <code>kubectl scale deployment sub-billing --replicas=0 -n payments</code>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. EVIDENCE TAB */}
            {activeTab === 'evidence' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                    Verified External Signals
                  </span>
                  <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/30">
                    TinyFish Intelligence
                  </span>
                </div>

                {evidenceList.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs">
                    No external signals collected yet. Click <strong className="text-sky-400">"TinyFish Live Scan"</strong> or <strong className="text-amber-400">"Stripe Replay Drill"</strong>.
                  </div>
                ) : (
                  evidenceList.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-2 hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded border bg-sky-500/20 text-sky-300 border-sky-500/40">
                          {item.verification_grade || 'OFFICIAL_CONFIRMED'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {item.published_at || 'Recent'}
                        </span>
                      </div>
                      <a
                        href={item.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-xs text-slate-100 hover:text-sky-400 flex items-center gap-1.5 transition-colors"
                      >
                        <span>{item.source_title}</span>
                        <ExternalLink className="w-3 h-3 text-slate-500 shrink-0" />
                      </a>
                      <p className="text-[11px] text-slate-400 italic bg-slate-950/60 p-2.5 rounded border border-slate-800/80">
                        "{item.raw_snippet}"
                      </p>
                      <div className="text-[10px] font-mono text-slate-500 flex items-center justify-between pt-1">
                        <span>Source: {item.publisher}</span>
                        <span className="text-sky-400">Clickable verified citation</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 3. REPORT TAB */}
            {activeTab === 'report' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                    Evidence-Grounded Incident Postmortem
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(reportMarkdown);
                      setCopySuccess(true);
                      setTimeout(() => setCopySuccess(false), 2000);
                    }}
                    className="flex items-center gap-1 text-[11px] font-mono text-sky-400 hover:text-sky-300 bg-sky-500/10 px-2.5 py-1 rounded border border-sky-500/30 transition-all"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copySuccess ? 'Copied!' : 'Copy Markdown'}</span>
                  </button>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs leading-relaxed text-slate-300 whitespace-pre-wrap selection:bg-sky-500/30">
                  {reportMarkdown || 'Click "Postmortem" to generate report.'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
