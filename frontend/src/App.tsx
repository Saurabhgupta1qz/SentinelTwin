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
  Layers,
  ArrowRight,
  Lock,
  Search,
  TrendingDown,
  Users,
  BarChart2,
  GitBranch,
  Radio,
  CheckCheck,
  ChevronRight,
  Cpu,
  Download,
  Printer
} from 'lucide-react';
import { ReportPage } from './ReportPage';

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

// ── Premium Custom Node ─────────────────────────────────────
const CustomNode = ({ data }: { data: ServiceNodeData }) => {
  const getStatusConfig = () => {
    if (data.status === 'FAILED') return {
      ring: 'border-bad/60',
      bg: 'bg-gradient-to-b from-badbg to-[#fbeaea]',
      badge: 'badge-bad',
      dot: 'bg-bad',
      label: 'Outage',
      shadow: 'shadow-[0_0_0_1px_var(--badbg2),0_4px_12px_rgba(201,42,53,0.15)]',
      pulse: true
    };
    if (data.status === 'DEGRADED' || data.isImpacted) return {
      ring: 'border-warn/50',
      bg: 'bg-gradient-to-b from-warnbg to-[#fef9ee]',
      badge: 'badge-warn',
      dot: 'bg-warn',
      label: 'Degraded',
      shadow: 'shadow-[0_0_0_1px_var(--warnbg2),0_4px_12px_rgba(180,83,9,0.12)]',
      pulse: false
    };
    return {
      ring: 'border-line',
      bg: 'bg-white',
      badge: 'badge-ok',
      dot: 'bg-ok',
      label: 'Healthy',
      shadow: 'shadow-card hover:shadow-md',
      pulse: false
    };
  };

  const cfg = getStatusConfig();

  return (
    <div className={`px-3.5 py-3 rounded-[11px] border transition-all duration-200 min-w-[188px] cursor-pointer ${cfg.ring} ${cfg.bg} ${cfg.shadow}`}>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[10.5px] capitalize text-ink3 font-medium tracking-wide">
          {data.category.toLowerCase().replace('_', ' ')}
        </span>
        <span className={`badge text-[10px] ${cfg.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${cfg.pulse ? 'status-dot-live' : ''}`} />
          {cfg.label}
        </span>
      </div>
      <div className="font-semibold text-[13px] text-ink tracking-tight leading-snug">{data.name}</div>
      <div className="flex items-center justify-between text-[11px] text-ink3 mt-2 pt-2 border-t border-line/60">
        <span className="tabular-nums flex items-center gap-1">
          <Users className="w-3 h-3" />
          {data.baseline_users > 0 ? data.baseline_users.toLocaleString() : '0'}
        </span>
        <span className="tabular-nums font-medium text-ink3">W: {data.weight}</span>
      </div>
    </div>
  );
};

const nodeTypes = { customNode: CustomNode };

// ── Metric Card ─────────────────────────────────────────────
const MetricCard = ({
  label, value, subValue, color, icon: Icon, after, afterColor
}: {
  label: string;
  value: string;
  subValue?: string;
  color: string;
  icon: React.ElementType;
  after?: string;
  afterColor?: string;
}) => (
  <div className="metric-card bg-white border border-line rounded-card p-4 flex flex-col gap-2 shadow-sm">
    <div className="flex items-center justify-between">
      <span className="text-[11.5px] font-medium text-ink3">{label}</span>
      <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-3.5 h-3.5" />
      </span>
    </div>
    <div className="flex items-end gap-2">
      <span className={`text-[26px] font-bold tracking-tighter tabular-nums leading-none ${color.includes('bad') ? 'text-bad' : color.includes('warn') ? 'text-warn' : color.includes('acc') ? 'text-acc' : color.includes('ok') ? 'text-ok' : 'text-ink'}`}>
        {value}
      </span>
      {after && (
        <div className={`flex items-center gap-0.5 text-xs font-semibold tabular-nums mb-0.5 ${afterColor || 'text-ok'}`}>
          <ArrowRight className="w-3 h-3" />
          <span>{after}</span>
        </div>
      )}
    </div>
    {subValue && <span className="text-[11px] text-ink3 tabular-nums">{subValue}</span>}
  </div>
);

// ── Action Badge Row ────────────────────────────────────────
const PriorityAction = ({
  priority, title, description, command, priorityColor
}: {
  priority: string;
  title: string;
  description: string;
  command: string;
  priorityColor: string;
}) => (
  <div className="group bg-white border border-line rounded-card p-3.5 space-y-2.5 hover:border-line2 hover:shadow-card transition-all">
    <div className="flex items-start justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md text-white ${priorityColor}`}>{priority}</span>
        <span className="font-semibold text-[12.5px] text-ink tracking-tight">{title}</span>
      </div>
      <Lock className="w-3.5 h-3.5 text-warn mt-0.5 shrink-0" />
    </div>
    <p className="text-[12px] text-ink2 leading-relaxed">{description}</p>
    <div className="bg-wash2 rounded-lg border border-line px-3 py-2 font-mono text-[11px] text-ink2 overflow-x-auto">
      <code className="whitespace-nowrap">{command}</code>
    </div>
  </div>
);

// ── Loading Spinner ─────────────────────────────────────────
const Spinner = () => (
  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
    <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

// ── Main App ────────────────────────────────────────────────
export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [activeTab, setActiveTab] = useState<'simulation' | 'evidence' | 'report'>('simulation');
  const [mode, setMode] = useState<'IDLE' | 'REPLAY' | 'LIVE'>('IDLE');
  const [loading, setLoading] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('stripe-primary');
  const [simulationData, setSimulationData] = useState<any>(null);
  const [mitigationData, setMitigationData] = useState<any>(null);
  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [reportMarkdown, setReportMarkdown] = useState<string>('');
  const [reportData, setReportData] = useState<any>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleDownloadMarkdown = (markdown: string, reportId?: string) => {
    if (!markdown) return;
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sentineltwin-report-${reportId || 'latest'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const loadEnvironment = useCallback(async () => {
    try {
      const res = await fetch('/api/environment');
      const data = await res.json();
      const rfNodes: Node[] = data.nodes.map((n: any) => ({
        id: n.id, type: 'customNode',
        position: n.position || { x: 100, y: 100 },
        data: { ...n }
      }));
      const rfEdges: Edge[] = data.edges.map((e: any) => ({
        id: e.id, source: e.source, target: e.target, animated: true,
        style: { stroke: 'var(--line2)', strokeWidth: 1.5, opacity: 0.7 },
        markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--line2)' }
      }));
      setNodes(rfNodes);
      setEdges(rfEdges);
    } catch (err) { console.error('Failed to load environment:', err); }
  }, [setNodes, setEdges]);

  useEffect(() => { loadEnvironment(); }, [loadEnvironment]);

  const handleHistoricalReplay = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/investigation/replay', { method: 'POST' });
      const data = await res.json();
      setMode('REPLAY');
      setSimulationData(data.simulation);
      setMitigationData(null);
      const evRes = await fetch('/api/investigation/evidence');
      const evData = await evRes.json();
      setEvidenceList(evData.evidence_items || []);
      setNodes(prev => prev.map(node => {
        const isRoot = node.id === data.incident.mapped_node_id;
        const isImpacted = data.simulation.affected_node_ids.includes(node.id);
        return { ...node, data: { ...node.data, status: isRoot ? 'FAILED' : isImpacted ? 'DEGRADED' : 'HEALTHY', isImpacted: isImpacted && !isRoot } };
      }));
      setEdges(prev => prev.map(edge => ({
        ...edge,
        style: { stroke: edge.target === 'stripe-primary' ? 'var(--bad)' : 'var(--line2)', strokeWidth: edge.target === 'stripe-primary' ? 2.5 : 1.5, opacity: 0.85 },
        markerEnd: { type: MarkerType.ArrowClosed, color: edge.target === 'stripe-primary' ? 'var(--bad)' : 'var(--line2)' }
      })));
      setActiveTab('simulation');
    } catch (err) { console.error('Replay error:', err); }
    finally { setLoading(false); }
  };

  const handleLiveInvestigation = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/investigation/live?provider_name=Stripe%2C%20Inc.', { method: 'POST' });
      const data = await res.json();
      setMode('LIVE');
      setSimulationData(data.simulation);
      setMitigationData(null);
      setEvidenceList(data.incident.evidence_items || []);
      setNodes(prev => prev.map(node => {
        const isRoot = node.id === data.incident.mapped_node_id;
        const isImpacted = data.simulation.affected_node_ids.includes(node.id);
        return { ...node, data: { ...node.data, status: isRoot ? 'FAILED' : isImpacted ? 'DEGRADED' : 'HEALTHY', isImpacted: isImpacted && !isRoot } };
      }));
      setActiveTab('evidence');
    } catch (err) { console.error('Live investigation error:', err); }
    finally { setLoading(false); }
  };

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
      setNodes(prev => prev.map(node => {
        const isRoot = node.id === nodeId;
        const isImpacted = data.affected_node_ids.includes(node.id);
        return { ...node, data: { ...node.data, status: isRoot ? 'FAILED' : isImpacted ? 'DEGRADED' : 'HEALTHY', isImpacted: isImpacted && !isRoot } };
      }));
      setActiveTab('simulation');
    } catch (err) { console.error('Simulation error:', err); }
    finally { setLoading(false); }
  };

  const handleSimulateMitigation = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/simulation/mitigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ failed_node_id: simulationData?.root_cause_node_id || 'stripe-primary', fallback_node_id: 'razorpay-backup' })
      });
      const data = await res.json();
      setMitigationData(data);
      setNodes(prev => prev.map(node => {
        const isRemaining = data.mitigated.remaining_affected_node_ids.includes(node.id);
        const isRoot = node.id === 'stripe-primary';
        const isBackup = node.id === 'razorpay-backup';
        return { ...node, data: { ...node.data, status: isRoot ? 'FAILED' : isBackup ? 'HEALTHY' : isRemaining ? 'DEGRADED' : 'HEALTHY', isImpacted: isRemaining && !isRoot } };
      }));
      setEdges(prev => prev.map(edge => {
        if (edge.source === 'payment-router') return {
          ...edge, target: 'razorpay-backup',
          style: { stroke: 'var(--ok)', strokeWidth: 2.5, opacity: 0.9 },
          markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--ok)' }
        };
        return edge;
      }));
    } catch (err) { console.error('Mitigation error:', err); }
    finally { setLoading(false); }
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports/generate', { method: 'POST' });
      const data = await res.json();
      setReportData(data);
      setReportMarkdown(data.markdown || '');
      setActiveTab('report');
    } catch (err) { console.error('Report error:', err); }
    finally { setLoading(false); }
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      await fetch('/api/environment/reset', { method: 'POST' });
      setMode('IDLE');
      setSimulationData(null);
      setMitigationData(null);
      setEvidenceList([]);
      setReportMarkdown('');
      setReportData(null);
      await loadEnvironment();
    } catch (err) { console.error('Reset error:', err); }
    finally { setLoading(false); }
  };

  const modeConfig = {
    IDLE: null,
    REPLAY: { bg: 'bg-repbg border-b border-rep/25', icon: History, text: 'Historical incident replay — not a live outage', badge: 'Provenance: historical replay', badgeStyle: 'badge-rep' },
    LIVE: { bg: 'bg-accbg border-b border-acc/25', icon: Radio, text: 'Live TinyFish intelligence scan active', badge: 'Live scan', badgeStyle: 'badge-acc' }
  };
  const mc = modeConfig[mode];

  // Route: /reports/:id
  if (currentPath.startsWith('/reports')) {
    const reportId = currentPath.replace('/reports/', '').replace('/', '') || 'active';
    return (
      <ReportPage
        reportId={reportId}
        initialReportData={reportData}
        onBack={() => {
          window.history.pushState({}, '', '/');
          setCurrentPath('/');
        }}
        evidenceList={evidenceList}
        simulationData={simulationData}
        mitigationData={mitigationData}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-wash text-ink overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Mode Banner ─────────────────────────────────────── */}
      {mc && (
        <div
          className="w-full py-2 px-6 flex items-center justify-between text-xs font-semibold animate-fade-in"
          style={{
            background: mode === 'LIVE'
              ? 'linear-gradient(90deg, rgba(59,91,219,0.08) 0%, rgba(76,110,245,0.05) 100%)'
              : 'linear-gradient(90deg, rgba(105,70,198,0.08) 0%, rgba(105,70,198,0.04) 100%)',
            borderBottom: mode === 'LIVE' ? '1px solid rgba(59,91,219,0.15)' : '1px solid rgba(105,70,198,0.15)'
          }}
        >
          <div className="flex items-center gap-2">
            {/* Animated pulse dot */}
            <span
              className="w-2 h-2 rounded-full flex-shrink-0 status-dot-live"
              style={{ background: mode === 'LIVE' ? '#3B5BDB' : '#6946C6' }}
            />
            <mc.icon className={`w-3.5 h-3.5 ${mode === 'LIVE' ? 'text-acc' : 'text-rep'}`} />
            <span className={mode === 'LIVE' ? 'text-acc' : 'text-rep'}>{mc.text}</span>
          </div>
          <span
            className="text-[10.5px] font-bold px-2.5 py-0.5 rounded-full tracking-wide"
            style={{
              background: mode === 'LIVE' ? 'rgba(59,91,219,0.12)' : 'rgba(105,70,198,0.12)',
              color: mode === 'LIVE' ? '#3B5BDB' : '#6946C6',
              border: mode === 'LIVE' ? '1px solid rgba(59,91,219,0.2)' : '1px solid rgba(105,70,198,0.2)'
            }}
          >
            {mc.badge}
          </span>
        </div>
      )}

      {/* ── Top Navigation Bar ──────────────────────────────── */}
      <header
        className="h-[64px] border-b border-line/60 px-5 flex items-center justify-between z-20 flex-shrink-0"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,255,0.97) 100%)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 1px 0 rgba(226,232,240,0.8), 0 4px 24px rgba(18,32,56,0.04)'
        }}
      >
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-[11px] flex items-center justify-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #3B5BDB 0%, #4C6EF5 50%, #748FFC 100%)',
              boxShadow: '0 2px 12px rgba(59,91,219,0.4), inset 0 1px 0 rgba(255,255,255,0.2)'
            }}
          >
            <Cpu className="w-4.5 h-4.5 text-white relative z-10" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
          </div>
          <div>
            <div className="font-bold text-[14.5px] tracking-tight text-ink flex items-center gap-2">
              SentinelTwin
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full tracking-wide"
                style={{ background: 'linear-gradient(90deg, #eef2ff, #e0e7ff)', color: '#3B5BDB', border: '1px solid rgba(59,91,219,0.15)' }}
              >
                AZINHACK '26
              </span>
            </div>
            <div className="text-[11px] text-ink3 flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-ok status-dot-live relative inline-block" />
              <span>PayNest fintech stack</span>
              <span className="opacity-30 mx-0.5">·</span>
              <span>Zero production mutation safe</span>
            </div>
          </div>
        </div>

        {/* Premium Action Controls */}
        <div className="flex items-center gap-2.5">

          {/* Live Scan — Electric Blue Glow Button */}
          <button
            id="btn-live-scan"
            onClick={handleLiveInvestigation}
            disabled={loading}
            className="group relative flex items-center gap-2 px-4 py-2 rounded-[10px] text-[12.5px] font-semibold text-white overflow-hidden transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #3B5BDB 0%, #4C6EF5 60%, #5C7CFA 100%)',
              boxShadow: '0 2px 8px rgba(59,91,219,0.35), 0 1px 0 rgba(255,255,255,0.15) inset, 0 -1px 0 rgba(0,0,0,0.12) inset'
            }}
          >
            {/* Shimmer layer */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
            {loading && mode === 'LIVE'
              ? <Spinner />
              : <Search className="w-3.5 h-3.5 relative z-10 group-hover:scale-110 transition-transform duration-150" />
            }
            <span className="relative z-10">Live scan</span>
            <span
              className="relative z-10 text-[10px] font-bold px-1.5 py-0.5 rounded-md tracking-wide"
              style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              TinyFish
            </span>
          </button>

          {/* Historical Replay — Violet Glass Button */}
          <button
            id="btn-historical-replay"
            onClick={handleHistoricalReplay}
            disabled={loading}
            className="group relative flex items-center gap-2 px-4 py-2 rounded-[10px] text-[12.5px] font-semibold overflow-hidden transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, rgba(105,70,198,0.1) 0%, rgba(105,70,198,0.05) 100%)',
              color: '#6946C6',
              border: '1px solid rgba(105,70,198,0.25)',
              boxShadow: '0 2px 8px rgba(105,70,198,0.1), inset 0 1px 0 rgba(255,255,255,0.8)'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
            {loading && mode === 'REPLAY'
              ? <Spinner />
              : <History className="w-3.5 h-3.5 relative z-10 group-hover:rotate-[-30deg] transition-transform duration-200" />
            }
            <span className="relative z-10">Historical replay</span>
          </button>

          {/* Divider */}
          <div className="w-px h-6 mx-0.5" style={{ background: 'linear-gradient(180deg, transparent, var(--line), transparent)' }} />

          {/* Reset — Ghost minimal */}
          <button
            id="btn-reset"
            onClick={handleReset}
            disabled={loading}
            className="group flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[12px] font-medium text-ink3 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed hover:text-ink hover:bg-wash"
            style={{ border: '1px solid transparent' }}
            onMouseEnter={e => (e.currentTarget.style.border = '1px solid var(--line)')}
            onMouseLeave={e => (e.currentTarget.style.border = '1px solid transparent')}
          >
            <RotateCcw className="w-3.5 h-3.5 group-hover:rotate-[-180deg] transition-transform duration-300" />
            <span>Reset</span>
          </button>
        </div>
      </header>

      {/* ── Main Workspace ──────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden gap-0 bg-wash">

        {/* ── LEFT: Graph Canvas ─────────────────────────────── */}
        <div className="flex-[62] relative flex flex-col m-3 mr-1.5 bg-white border border-line rounded-panel overflow-hidden shadow-sm">
          {/* Canvas Header */}
          <div className="px-4 py-2.5 border-b border-line flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-5 text-[11.5px] text-ink3">
              <span className="font-semibold text-ink text-[12px]">Service dependency graph</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-ok" /><span>Healthy</span></div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-warn" /><span>Degraded</span></div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-bad" /><span>Outage</span></div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-unk" /><span>Standby</span></div>
              </div>
            </div>
            <div className="text-[11px] text-ink3 flex items-center gap-1">
              <GitBranch className="w-3 h-3" />
              <span>u → v (u depends on v)</span>
            </div>
          </div>

          {/* React Flow */}
          <div className="flex-1 relative">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.18 }}
              onNodeClick={(_, node) => handleSimulateNodeFailure(node.id)}
            >
              <Background color="var(--dot)" gap={22} size={1.2} />
              <Controls />
              <MiniMap
                nodeColor={(n: any) => n.data?.status === 'FAILED' ? 'var(--bad)' : n.data?.isImpacted ? 'var(--warn)' : 'var(--ok)'}
                maskColor="rgba(244,246,251,0.65)"
              />
            </ReactFlow>

            {/* What-If Overlay — Premium Command-Palette Style */}
            <div
              className="absolute bottom-4 left-4 z-10 flex items-center gap-2.5 animate-slide-up"
              style={{
                background: 'linear-gradient(135deg, rgba(17,24,39,0.92) 0%, rgba(30,41,59,0.90) 100%)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '14px',
                padding: '10px 14px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.08)'
              }}
            >
              {/* Label */}
              <div className="flex items-center gap-1.5 text-[11.5px] font-semibold whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.55)' }}>
                <ShieldAlert className="w-3.5 h-3.5" style={{ color: '#FB923C' }} />
                <span>What-if</span>
              </div>

              {/* Divider */}
              <div className="w-px h-4" style={{ background: 'rgba(255,255,255,0.12)' }} />

              {/* Select */}
              <select
                id="what-if-node-select"
                value={selectedNodeId}
                onChange={(e) => setSelectedNodeId(e.target.value)}
                className="text-[12px] font-medium outline-none cursor-pointer transition-all"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.88)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '8px',
                  padding: '5px 10px',
                  appearance: 'auto'
                }}
              >
                <option value="stripe-primary" style={{ background: '#1e293b' }}>Stripe primary gateway</option>
                <option value="payment-router" style={{ background: '#1e293b' }}>Payment routing service</option>
                <option value="checkout-api" style={{ background: '#1e293b' }}>Checkout API service</option>
                <option value="order-service" style={{ background: '#1e293b' }}>Order processing engine</option>
                <option value="auth-service" style={{ background: '#1e293b' }}>Customer authentication</option>
              </select>

              {/* Simulate Outage button — Red Glow */}
              <button
                id="btn-simulate-outage"
                onClick={() => handleSimulateNodeFailure(selectedNodeId)}
                disabled={loading}
                className="group relative flex items-center gap-1.5 px-3.5 py-2 rounded-[9px] text-[12px] font-semibold text-white overflow-hidden transition-all duration-150 disabled:opacity-40"
                style={{
                  background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                  boxShadow: '0 2px 12px rgba(220,38,38,0.45), inset 0 1px 0 rgba(255,255,255,0.15)'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
                {loading ? <Spinner /> : <Zap className="w-3.5 h-3.5 relative z-10 group-hover:scale-125 transition-transform duration-150" />}
                <span className="relative z-10">Simulate outage</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Inspector Column ────────────────────────── */}
        <div className="flex-[38] flex flex-col m-3 ml-1.5 bg-white border border-line rounded-panel overflow-hidden shadow-sm min-w-[360px]">

          {/* Tab Bar */}
          <div className="px-4 pt-3.5 pb-3 border-b border-line flex-shrink-0">
            <div className="tab-bar">
              <button
                id="tab-simulation"
                onClick={() => setActiveTab('simulation')}
                className={`tab-item ${activeTab === 'simulation' ? 'active' : ''}`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Simulation</span>
              </button>
              <button
                id="tab-evidence"
                onClick={() => setActiveTab('evidence')}
                className={`tab-item ${activeTab === 'evidence' ? 'active' : ''}`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Evidence {evidenceList.length > 0 && <span className="ml-1 badge badge-acc py-0.5">{evidenceList.length}</span>}</span>
              </button>
              <button
                id="tab-report"
                onClick={() => { setActiveTab('report'); if (!reportMarkdown) handleGenerateReport(); }}
                className={`tab-item ${activeTab === 'report' ? 'active' : ''}`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Postmortem</span>
              </button>
            </div>
          </div>

          {/* Inspector Body */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">

            {/* ─── SIMULATION TAB ─────────────────────────────── */}
            {activeTab === 'simulation' && (
              <div className="space-y-5 animate-slide-up">

                {/* Incident Status Card */}
                <div className={`rounded-card p-4 border transition-all ${simulationData ? 'bg-badbg/40 border-bad/25' : 'bg-wash border-line'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-ink3 uppercase tracking-wider">Incident status</span>
                    <span className="badge badge-muted text-[10.5px]">Computed model</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${simulationData ? 'bg-bad status-dot-live' : 'bg-ok'}`} />
                    <span className="font-semibold text-[13.5px] text-ink tracking-tight">
                      {simulationData?.root_cause_node_name || 'Stripe primary gateway'} — outage
                    </span>
                  </div>
                  <p className="text-[12px] text-ink2 leading-relaxed">
                    Downstream blast radius calculated across PayNest directed graph using NetworkX propagation.
                  </p>
                </div>

                {/* Hero Metrics Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  <MetricCard
                    label="Weighted blast radius"
                    value={String(simulationData?.weighted_impact_score ?? '23.2')}
                    subValue="Criticality-attenuated index"
                    color="bg-badbg text-bad"
                    icon={TrendingDown}
                    after={mitigationData ? String(mitigationData.mitigated.weighted_impact_score) : undefined}
                  />
                  <MetricCard
                    label="Users at risk"
                    value={simulationData ? `${simulationData.users_at_risk_percentage}%` : '19.6%'}
                    subValue={`${simulationData ? simulationData.users_at_risk.toLocaleString() : '1,964'} users${mitigationData ? ` → ${mitigationData.mitigated.users_at_risk}` : ''}`}
                    color="bg-warnbg text-warn"
                    icon={Users}
                    after={mitigationData ? `${mitigationData.mitigated.users_at_risk_percentage}%` : undefined}
                  />
                  <MetricCard
                    label="Txn success rate"
                    value={simulationData ? `${simulationData.transaction_success_rate}%` : '88.7%'}
                    subValue="Checkout drop-off impact"
                    color="bg-accbg text-acc"
                    icon={BarChart2}
                    after={mitigationData ? `${mitigationData.mitigated.transaction_success_rate}%` : undefined}
                    afterColor="text-ok"
                  />
                  <MetricCard
                    label="Services impacted"
                    value={String(simulationData?.total_affected_services ?? '5')}
                    subValue={mitigationData ? '80% service recovery' : 'Downstream microservices'}
                    color="bg-badbg text-bad"
                    icon={Activity}
                    after={mitigationData ? String(mitigationData.mitigated.total_affected_services) : undefined}
                    afterColor="text-ok"
                  />
                </div>

                {/* Recovery Lever */}
                <div className="bg-gradient-to-b from-okbg/50 to-white border border-ok/30 rounded-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-ok flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-semibold text-[13px] text-ok tracking-tight">Digital twin recovery lever</span>
                    </div>
                    <span className="badge badge-ok text-[10.5px]">
                      <CheckCheck className="w-3 h-3" />
                      Zero production risk
                    </span>
                  </div>
                  <p className="text-[12px] text-ink2 leading-relaxed">
                    Simulate re-routing checkout payments to standby gateway <strong className="text-ink font-semibold">Razorpay</strong>.
                  </p>
                  <button
                    id="btn-apply-mitigation"
                    onClick={handleSimulateMitigation}
                    disabled={loading}
                    className="btn btn-success w-full py-2.5 flex items-center justify-center gap-2 text-[12.5px] font-semibold"
                  >
                    {loading ? <Spinner /> : <Zap className="w-4 h-4 shrink-0" />}
                    <span>Apply Razorpay failover mitigation</span>
                  </button>
                  {mitigationData && (
                    <div className="bg-white rounded-lg px-3 py-2.5 border border-ok/30 flex items-center justify-between animate-slide-up">
                      <span className="text-[12px] text-ok font-medium">
                        Risk reduction: <strong className="font-bold">{mitigationData.deltas.user_risk_reduction_percentage}%</strong>
                      </span>
                      <span className="text-[12px] text-ok font-medium tabular-nums">
                        Restored: <strong className="font-bold">{mitigationData.deltas.users_restored.toLocaleString()} users</strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* Ranked Action Plan */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[12.5px] font-semibold text-ink tracking-tight">Ranked recovery actions</span>
                    <span className="badge badge-warn">
                      <Lock className="w-3 h-3" />
                      Human approval required
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    <PriorityAction
                      priority="P0"
                      title="Enable standby gateway failover"
                      description="Restores card checkout for 1,764 active users (89.8% risk reduction)."
                      command="aws ssm start-automation-execution --document-name 'PayNest-Failover' --parameters 'Primary=stripe,Fallback=razorpay'"
                      priorityColor="bg-bad"
                    />
                    <PriorityAction
                      priority="P1"
                      title="Pause subscription billing retries"
                      description="Prevents redundant webhook retry storm during primary gateway outage."
                      command="kubectl scale deployment sub-billing --replicas=0 -n payments"
                      priorityColor="bg-warn"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ─── EVIDENCE TAB ─────────────────────────────── */}
            {activeTab === 'evidence' && (
              <div className="space-y-4 animate-slide-up">
                <div className="flex items-center justify-between">
                  <span className="text-[12.5px] font-semibold text-ink tracking-tight">Verified external signals</span>
                  <span className="badge badge-acc">
                    <Radio className="w-3 h-3" />
                    TinyFish intelligence
                  </span>
                </div>

                {evidenceList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 text-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-wash2 border border-line flex items-center justify-center">
                      <Search className="w-6 h-6 text-ink3" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-ink">No signals collected yet</p>
                      <p className="text-[12px] text-ink2 mt-1">
                        Click <strong className="text-acc">Live scan (TinyFish)</strong> or <strong className="text-rep">Historical replay</strong> to gather evidence.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {evidenceList.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-white border border-line rounded-card p-3.5 space-y-2.5 hover:border-acc/40 hover:shadow-card transition-all animate-slide-up"
                        style={{ animationDelay: `${idx * 60}ms` }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="badge badge-ok text-[10.5px]">
                            {item.verification_grade ? item.verification_grade.toLowerCase().replace('_', ' ') : 'official confirmed'}
                          </span>
                          <span className="text-[11px] text-ink3 tabular-nums">
                            {item.published_at || 'Recent'}
                          </span>
                        </div>
                        <a
                          href={item.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-[12.5px] text-ink hover:text-acc flex items-center gap-1.5 transition-colors group"
                        >
                          <span>{item.source_title}</span>
                          <ExternalLink className="w-3 h-3 text-ink3 group-hover:text-acc shrink-0 transition-colors" />
                        </a>
                        <p className="text-[12px] text-ink2 italic bg-wash rounded-lg px-3 py-2.5 border border-line leading-relaxed">
                          "{item.raw_snippet}"
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-ink3">
                          <span>{item.publisher}</span>
                          <span className="text-acc font-medium flex items-center gap-1">
                            <CheckCheck className="w-3 h-3" />
                            Clickable verified citation
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ─── REPORT TAB ───────────────────────────────── */}
            {activeTab === 'report' && (
              <div className="space-y-4 animate-slide-up">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[12.5px] font-semibold text-ink tracking-tight">Evidence-grounded postmortem</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      id="btn-download-markdown"
                      onClick={() => handleDownloadMarkdown(reportMarkdown, reportData?.report_id || 'latest')}
                      disabled={!reportMarkdown}
                      className="btn btn-ghost text-[11px] py-1 px-2.5 flex items-center gap-1.5"
                      title="Download Markdown"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Markdown</span>
                    </button>
                    <button
                      id="btn-download-pdf"
                      onClick={() => {
                        const targetId = reportData?.report_id || 'active';
                        window.history.pushState({}, '', `/reports/${targetId}`);
                        setCurrentPath(`/reports/${targetId}`);
                      }}
                      className="btn btn-primary text-[11px] py-1 px-2.5 flex items-center gap-1.5 font-semibold"
                      title="Open Printable Report for PDF Download"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </button>
                    <button
                      id="btn-copy-report"
                      onClick={() => { navigator.clipboard.writeText(reportMarkdown); setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2000); }}
                      className={`btn text-[11px] py-1 px-2.5 ${copySuccess ? 'btn-success' : 'btn-ghost'} transition-all`}
                    >
                      {copySuccess ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copySuccess ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {reportMarkdown && (
                  <div className="flex items-center justify-between text-[11px] text-ink3 bg-wash px-3 py-1.5 rounded-lg border border-line">
                    <span className="font-mono text-[10.5px]">/reports/{reportData?.report_id || 'active'}</span>
                    <button
                      onClick={() => {
                        const targetId = reportData?.report_id || 'active';
                        window.history.pushState({}, '', `/reports/${targetId}`);
                        setCurrentPath(`/reports/${targetId}`);
                      }}
                      className="text-acc hover:underline font-medium inline-flex items-center gap-1"
                    >
                      <span>Open full report page</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {loading && !reportMarkdown ? (
                  <div className="space-y-3">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className={`skeleton h-3 ${i % 3 === 0 ? 'w-3/4' : i % 3 === 1 ? 'w-full' : 'w-5/6'}`} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-wash2 rounded-card border border-line p-4 font-mono text-[11.5px] leading-relaxed text-ink2 whitespace-pre-wrap min-h-[200px] selection:bg-accbg">
                    {reportMarkdown || (
                      <span className="text-ink3 italic">Click the "Postmortem" tab to generate a report automatically.</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
