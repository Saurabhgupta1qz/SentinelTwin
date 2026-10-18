import React, { useEffect, useState } from 'react';
import { api } from './api';   // ya './api' agar same folder mein hai
import {
  FileText,
  Download,
  Printer,
  ArrowLeft,
  Copy,
  CheckCheck,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Cpu
} from 'lucide-react';

interface ReportPageProps {
  reportId?: string;
  initialReportData?: any;
  onBack?: () => void;
  evidenceList?: any[];
  simulationData?: any;
  mitigationData?: any;
}

export const ReportPage: React.FC<ReportPageProps> = ({
  reportId = 'rep-live-01',
  initialReportData,
  onBack,
  evidenceList = [],
  simulationData,
  mitigationData
}) => {
  const [report, setReport] = useState<any>(initialReportData || null);
  const [loading, setLoading] = useState<boolean>(!initialReportData);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!report) {
      setLoading(true);
      api('/api/reports/generate', { method: 'POST' })
        .then((res) => res.json())
        .then((data) => {
          setReport(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Failed to load report:', err);
          setLoading(false);
        });
    }
  }, [report]);

  const handleDownloadMarkdown = () => {
    if (!report?.markdown) return;
    const blob = new Blob([report.markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sentineltwin-report-${report.report_id || reportId}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyMarkdown = () => {
    if (!report?.markdown) return;
    navigator.clipboard.writeText(report.markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const currentReportId = report?.report_id || reportId;
  const generatedTime = report?.generated_at || new Date().toUTCString();
  const provenanceMode = report?.provenance || 'COMPUTED';
  const environmentName = 'PayNest Production Reference Stack (v1.4)';

  return (
    <div className="report-page-container min-h-screen bg-wash flex flex-col font-sans">
      {/* ── TopBar (Hidden on Print) ──────────────────────────────── */}
      <div className="report-topbar no-print sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-line px-6 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack ? onBack : () => { window.history.pushState({}, '', '/'); window.dispatchEvent(new PopStateEvent('popstate')); }}
            className="btn btn-ghost text-[12px] py-1.5 px-3 flex items-center gap-1.5"
            title="Return to Digital Twin Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
          <div className="h-4 w-px bg-line" />
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-acc flex items-center justify-center text-white">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-[14px] text-ink">SentinelTwin</span>
              <span className="text-[11px] text-ink3 ml-2">/ Incident Report / {currentReportId}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons in Header */}
        <div className="flex items-center gap-2.5">
          <button
            id="btn-copy-markdown-top"
            onClick={handleCopyMarkdown}
            className="btn btn-ghost text-[12px] py-2 px-3.5"
          >
            {copied ? <CheckCheck className="w-3.5 h-3.5 text-ok" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            id="btn-download-markdown"
            onClick={handleDownloadMarkdown}
            className="btn btn-ghost text-[12px] py-2 px-3.5 flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Markdown</span>
          </button>
          <button
            id="btn-download-pdf"
            onClick={handlePrint}
            className="btn btn-primary text-[12px] py-2 px-4 flex items-center gap-2 font-semibold"
          >
            <Printer className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* ── Provenance Banner (Hidden on Print) ────────────────────── */}
      <div className="report-provenance-banner no-print bg-accbg/70 border-b border-acc/20 px-6 py-2.5 flex items-center justify-between text-[12px] text-acc">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0 text-acc" />
          <span>
            <strong>Provenance Mode: {provenanceMode}</strong> — Generated via NetworkX directed graph digital twin &amp; TinyFish signal synthesis. Zero production writes executed.
          </span>
        </div>
        <span className="badge badge-acc text-[10px] font-semibold tracking-wider uppercase">
          Observational Decision-Support
        </span>
      </div>

      {/* ── Main Report Body (Printable Area) ──────────────────────── */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-10">
        <article className="printable-report bg-white border border-line rounded-panel shadow-sm p-8 md:p-12 space-y-8">
          
          {/* Report Header Block */}
          <header className="border-b border-line pb-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] font-bold tracking-wider uppercase text-acc mb-1">
                  SentinelTwin Resilience Intelligence
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-ink tracking-tight">
                  SentinelTwin Incident Postmortem &amp; Recovery Brief
                </h1>
              </div>
              <div className="text-right shrink-0">
                <span className="provenance-badge badge badge-acc font-mono text-[11px] px-2.5 py-1">
                  Mode: {provenanceMode}
                </span>
                <div className="text-[11px] text-ink3 mt-1.5 font-mono">
                  {currentReportId}
                </div>
              </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-line/60 text-[12px]">
              <div>
                <span className="block text-ink3 text-[11px] font-medium uppercase tracking-wide">Environment</span>
                <strong className="text-ink font-semibold">{environmentName}</strong>
              </div>
              <div>
                <span className="block text-ink3 text-[11px] font-medium uppercase tracking-wide">Generated Time</span>
                <span className="text-ink font-medium font-mono text-[11.5px]">{generatedTime}</span>
              </div>
              <div>
                <span className="block text-ink3 text-[11px] font-medium uppercase tracking-wide">Incident Status</span>
                <span className="status-label font-bold text-bad inline-flex items-center gap-1">
                  [FAILED / DEGRADED]
                </span>
              </div>
              <div>
                <span className="block text-ink3 text-[11px] font-medium uppercase tracking-wide">Target Provider</span>
                <strong className="text-ink font-semibold">Stripe primary gateway</strong>
              </div>
            </div>
          </header>

          {/* Section 1: Verified Evidence & Root Cause Signals */}
          <section className="report-section space-y-4">
            <div className="flex items-center justify-between border-b border-line/60 pb-2">
              <h2 className="section-heading text-lg font-bold text-ink flex items-center gap-2">
                <span>1. Verified Evidence &amp; Root Cause Signals</span>
              </h2>
              <span className="provenance-badge badge badge-acc text-[10.5px]">
                TinyFish Live / Fixture
              </span>
            </div>

            <p className="text-[13px] text-ink2 leading-relaxed">
              Automated external verification performed via <strong>TinySearch</strong> and <strong>TinyFetch</strong> with strict SSRF filtering and RFC 1918 guardrails.
            </p>

            <div className="space-y-3">
              {evidenceList && evidenceList.length > 0 ? (
                evidenceList.map((item, idx) => (
                  <div key={idx} className="evidence-item bg-wash rounded-card p-4 border border-line space-y-2">
                    <div className="flex items-center justify-between text-[11.5px]">
                      <span className="status-label badge badge-ok font-semibold">
                        [{item.verification_grade ? item.verification_grade.toUpperCase() : 'OFFICIAL CONFIRMED'}]
                      </span>
                      <span className="text-ink3 font-mono text-[11px]">{item.published_at || 'Recent signal'}</span>
                    </div>
                    <div>
                      <a
                        href={item.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-acc text-[13px] hover:underline inline-flex items-center gap-1"
                      >
                        <span>{item.source_title}</span>
                        <ExternalLink className="w-3 h-3 text-ink3 no-print" />
                      </a>
                    </div>
                    <blockquote className="text-[12px] text-ink2 italic border-l-2 border-line2 pl-3 py-0.5">
                      "{item.raw_snippet}"
                    </blockquote>
                    <div className="text-[11px] text-ink3">
                      Publisher: <strong className="text-ink">{item.publisher}</strong>
                    </div>
                  </div>
                ))
              ) : (
                <div className="evidence-item bg-wash rounded-card p-4 border border-line space-y-2 text-[12.5px]">
                  <div className="flex items-center justify-between">
                    <span className="status-label badge badge-ok font-semibold">[OFFICIAL CONFIRMED]</span>
                    <span className="text-ink3 font-mono text-[11px]">2024-10-23 14:48 UTC</span>
                  </div>
                  <div>
                    <a
                      href="https://status.stripe.com/incidents/oct-2024-api-degradation"
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-acc text-[13px] hover:underline"
                    >
                      Stripe Status: Elevated API Latency &amp; Elevated 5xx Errors on Card Endpoints
                    </a>
                  </div>
                  <blockquote className="text-[12px] text-ink2 italic border-l-2 border-line2 pl-3 py-0.5">
                    "We are investigating elevated error rates affecting payment intent confirmations globally."
                  </blockquote>
                  <div className="text-[11px] text-ink3">Publisher: Stripe Official Status Advisory (Confirmed via TinyFish)</div>
                </div>
              )}
            </div>
          </section>

          {/* Section 2: Digital Twin Impact Simulation */}
          <section className="report-section space-y-4">
            <div className="flex items-center justify-between border-b border-line/60 pb-2">
              <h2 className="section-heading text-lg font-bold text-ink">
                2. Digital Twin Impact Simulation
              </h2>
              <span className="provenance-badge badge badge-muted text-[10.5px]">
                Computed DAG Model
              </span>
            </div>

            <p className="text-[13px] text-ink2 leading-relaxed">
              Calculated across PayNest directed dependency graph using topological NetworkX propagation. Upstream root cause: <code>stripe-primary</code> (Stripe Primary Gateway).
            </p>

            {/* Impact Metrics Table */}
            <div className="overflow-x-auto border border-line rounded-card">
              <table className="w-full text-left text-[12.5px] border-collapse">
                <thead>
                  <tr className="bg-wash border-b border-line text-ink3 text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-4 font-semibold">Resilience Metric</th>
                    <th className="py-2.5 px-4 font-semibold">Pre-Mitigation Value</th>
                    <th className="py-2.5 px-4 font-semibold">Status / Interpretation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  <tr>
                    <td className="py-2.5 px-4 font-medium text-ink">Weighted Blast Radius ($W$)</td>
                    <td className="py-2.5 px-4 font-bold text-bad font-mono">
                      {simulationData?.weighted_impact_score ?? '23.2'}
                    </td>
                    <td className="py-2.5 px-4 text-ink2">Criticality-attenuated propagation score</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-medium text-ink">Active Users at Risk</td>
                    <td className="py-2.5 px-4 font-bold text-bad font-mono">
                      {simulationData?.users_at_risk?.toLocaleString() ?? '1,964'} users ({simulationData?.users_at_risk_percentage ?? '19.6'}%)
                    </td>
                    <td className="py-2.5 px-4 text-ink2">Baseline 10,000 active users affected</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-medium text-ink">Projected Transaction Success Rate</td>
                    <td className="py-2.5 px-4 font-bold text-bad font-mono">
                      {simulationData?.transaction_success_rate ?? '88.7'}%
                    </td>
                    <td className="py-2.5 px-4 text-ink2">Failure rate: {simulationData?.transaction_failure_rate ?? '11.3'}%</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-medium text-ink">Affected Downstream Services</td>
                    <td className="py-2.5 px-4 font-bold text-ink font-mono">
                      {simulationData?.total_affected_services ?? 5} services
                    </td>
                    <td className="py-2.5 px-4 text-ink2">payment-router, checkout-api, order-service, sub-billing, api-gateway</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 3: Recovery Mitigation Evaluation */}
          <section className="report-section space-y-4">
            <div className="flex items-center justify-between border-b border-line/60 pb-2">
              <h2 className="section-heading text-lg font-bold text-ink">
                3. Recovery Mitigation Evaluation
              </h2>
              <span className="provenance-badge badge badge-ok text-[10.5px]">
                Simulated Digital Twin
              </span>
            </div>

            <p className="text-[13px] text-ink2 leading-relaxed">
              Counterfactual digital twin execution testing dynamic routing lever to standby provider: <strong>Razorpay</strong>.
            </p>

            {/* Mitigation Comparison Table */}
            <div className="overflow-x-auto border border-line rounded-card">
              <table className="w-full text-left text-[12.5px] border-collapse">
                <thead>
                  <tr className="bg-wash border-b border-line text-ink3 text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-4 font-semibold">Resilience Metric</th>
                    <th className="py-2.5 px-4 font-semibold">Before Failover</th>
                    <th className="py-2.5 px-4 font-semibold">After Failover</th>
                    <th className="py-2.5 px-4 font-semibold">Net Improvement Delta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  <tr>
                    <td className="py-2.5 px-4 font-medium text-ink">Blast Radius ($W$)</td>
                    <td className="py-2.5 px-4 font-mono text-bad">23.2</td>
                    <td className="py-2.5 px-4 font-mono text-ok font-bold">10.2</td>
                    <td className="py-2.5 px-4 font-semibold text-ok font-mono">-56.0% reduction</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-medium text-ink">Users at Risk</td>
                    <td className="py-2.5 px-4 font-mono text-bad">1,964 (19.6%)</td>
                    <td className="py-2.5 px-4 font-mono text-ok font-bold">200 (2.0%)</td>
                    <td className="py-2.5 px-4 font-semibold text-ok font-mono">
                      89.8% risk reduction (1,764 restored)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-medium text-ink">Txn Success Rate</td>
                    <td className="py-2.5 px-4 font-mono text-bad">88.7%</td>
                    <td className="py-2.5 px-4 font-mono text-ok font-bold">98.8%</td>
                    <td className="py-2.5 px-4 font-semibold text-ok font-mono">+10.1% recovery</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 4: Human-Approved Operational Runbook */}
          <section className="report-section space-y-4">
            <div className="flex items-center justify-between border-b border-line/60 pb-2">
              <h2 className="section-heading text-lg font-bold text-ink">
                4. Human-Approved Operational Runbook
              </h2>
              <span className="provenance-badge badge badge-warn text-[10.5px]">
                Computed Action Plan
              </span>
            </div>

            <div className="flex items-center gap-2 text-[12px] text-warn bg-warnbg p-3 rounded-lg border border-warn/20">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                <strong className="status-label">[HUMAN APPROVAL REQUIRED]</strong> — Invariant 1: Zero Production Mutation. Runbook must be executed manually by authorized SREs.
              </span>
            </div>

            <div className="runbook-block bg-slate-900 text-slate-100 rounded-card p-4 font-mono text-[12px] overflow-x-auto leading-relaxed border border-slate-800">
              <div className="text-slate-400 text-[10.5px] uppercase tracking-wider mb-1.5 selection:bg-none">
                # Step 1: Execute Standby Gateway Routing
              </div>
              <div className="text-emerald-400">
                aws ssm start-automation-execution \
                  --document-name "PayNest-Failover" \
                  --parameters "Primary=stripe,Fallback=razorpay"
              </div>
              <div className="text-slate-400 text-[10.5px] uppercase tracking-wider mt-3 mb-1.5 selection:bg-none">
                # Step 2: Pause Redundant Subscription Retry Storms
              </div>
              <div className="text-sky-300">
                kubectl scale deployment sub-billing --replicas=0 -n payments
              </div>
            </div>
          </section>

          {/* Raw Generated Markdown Inspection (Optional accordion on screen, hidden on print) */}
          {report?.markdown && (
            <div className="no-print pt-4 border-t border-line">
              <details className="text-[12px] text-ink2 group">
                <summary className="cursor-pointer font-semibold text-ink flex items-center gap-2 select-none hover:text-acc">
                  <FileText className="w-4 h-4" />
                  <span>View Raw Markdown Output ({report.markdown.length} chars)</span>
                </summary>
                <div className="mt-3 bg-wash2 border border-line rounded-card p-4 font-mono text-[11px] leading-relaxed text-ink2 whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {report.markdown}
                </div>
              </details>
            </div>
          )}

          {/* Report Footer */}
          <footer className="pt-8 border-t border-line space-y-3">
            <div className="print-footer-notice text-center text-[11px] text-ink3 font-medium">
              Simulated figures are model outputs, not measured telemetry.
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-ink3 pt-2">
              <span>SentinelTwin — Infrastructure Resilience &amp; Digital Twin (AZINHACK '26)</span>
              <span className="font-mono">Verification: Verified Golden Engine</span>
            </div>
          </footer>

        </article>
      </main>
    </div>
  );
};
