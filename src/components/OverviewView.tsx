/**
 * SentinelMesh Overview View (Aurora Pop Theme)
 * Real-time operational security dashboard with KPI cards,
 * policy rule interception breakdown, quick attack simulator launcher,
 * recent audit trail, and contextual security insights.
 */

import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Play,
  ArrowRight,
  TrendingUp,
  FileCode2,
  Sparkles,
  Bot,
  Activity,
  Layers,
  Lock,
} from 'lucide-react';
import type { SystemOverview, AuditEvent } from '../../shared/types.ts';
import type { ActiveTab } from './Navigation.tsx';
import { DailyRiskTrendChart } from './DailyRiskTrendChart.tsx';

interface OverviewViewProps {
  overview: SystemOverview | null;
  loading: boolean;
  onNavigate: (tab: ActiveTab) => void;
  onSelectEvent: (event: AuditEvent) => void;
  onRunQuickScenario: (scenarioId: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  overview,
  loading,
  onNavigate,
  onSelectEvent,
  onRunQuickScenario,
}) => {
  if (loading && !overview) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-[#EAE6F5]" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-72 bg-white rounded-2xl border border-[#EAE6F5] lg:col-span-2" />
          <div className="h-72 bg-white rounded-2xl border border-[#EAE6F5]" />
        </div>
      </div>
    );
  }

  const data = overview || {
    totalCalls: 0,
    allowedCalls: 0,
    blockedCalls: 0,
    blockRatePercentage: 0,
    activeAlerts: 0,
    averageRiskScore: 0,
    ruleBreakdown: [],
    hourlyActivity: [],
    dailyRiskTrend: [],
    recentIncidents: [],
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Editorial Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#EAE6F5]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7657F6]/10 text-[#7657F6] text-xs font-bold mb-2">
            <span>🛡️</span>
            <span>SentinelMesh Active Firewall Core</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#292638]">
            Security Firewall Operations
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6580] mt-1">
            Real-time server-side perimeter defending autonomous AI agents against malicious tool abuse.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B6580]">
          <span className="px-2.5 py-1 rounded-lg bg-[#54D6B0]/15 text-[#0f8263] font-bold border border-[#54D6B0]/30">
            🟢 Zero-Bypass Enforcing
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-[#7657F6]/10 text-[#7657F6] font-bold border border-[#7657F6]/20">
            ⚡ Avg Latency: 1.8ms
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Calls */}
        <div className="p-5 rounded-2xl bg-white border border-[#EAE6F5] shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-[#6B6580]">
            <span>Total Evaluated Calls</span>
            <div className="w-8 h-8 rounded-xl bg-[#7657F6]/10 text-[#7657F6] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold tracking-tight text-[#292638] tabular-nums">
              {data.totalCalls.toLocaleString()}
            </div>
            <div className="text-[11px] text-[#6B6580] mt-1 flex items-center gap-1">
              <span>🤖</span> Server HMAC verified
            </div>
          </div>
        </div>

        {/* Blocked Threats */}
        <div className="p-5 rounded-2xl bg-white border border-[#FF786B]/30 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-[#6B6580]">
            <span>Blocked Threats</span>
            <div className="w-8 h-8 rounded-xl bg-[#FF786B]/15 text-[#FF786B] flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-[#FF786B] tabular-nums">
                {data.blockedCalls.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-[#FF786B] px-2 py-0.5 rounded-full bg-[#FF786B]/15 border border-[#FF786B]/25">
                {data.blockRatePercentage}% Blocked
              </span>
            </div>
            <div className="text-[11px] text-[#6B6580] mt-1 flex items-center gap-1">
              <span>⛔</span> Prevented before executor
            </div>
          </div>
        </div>

        {/* Allowed Calls */}
        <div className="p-5 rounded-2xl bg-white border border-[#54D6B0]/30 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-[#6B6580]">
            <span>Authorized Invocations</span>
            <div className="w-8 h-8 rounded-xl bg-[#54D6B0]/15 text-[#0f8263] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold tracking-tight text-[#0f8263] tabular-nums">
              {data.allowedCalls.toLocaleString()}
            </div>
            <div className="text-[11px] text-[#6B6580] mt-1 flex items-center gap-1">
              <span>🟢</span> Policy compliant actions
            </div>
          </div>
        </div>

        {/* Active Alerts */}
        <div className="p-5 rounded-2xl bg-white border border-[#FFD66B]/50 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-[#6B6580]">
            <span>Active Alerts</span>
            <div className="w-8 h-8 rounded-xl bg-[#FFD66B]/20 text-[#d97706] flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-[#d97706] tabular-nums">
                {data.activeAlerts}
              </span>
              <span className="text-xs text-[#6B6580] font-semibold">Triage Open</span>
            </div>
            <div className="text-[11px] text-[#6B6580] mt-1 flex items-center gap-1">
              <span>🚨</span> Risk Score: <strong className="text-[#292638]">{data.averageRiskScore}/100</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 7-Day Daily Risk Trend Evolution Chart Component */}
      <DailyRiskTrendChart
        data={data.dailyRiskTrend}
        currentAvgScore={data.averageRiskScore}
      />

      {/* Middle Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Blocked Security Rules */}
        <div className="p-6 rounded-2xl bg-white border border-[#EAE6F5] shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between pb-4 border-b border-[#EAE6F5]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base">📊</span>
                <h2 className="text-base font-bold text-[#292638]">Rule Interception Breakdown</h2>
              </div>
              <p className="text-xs text-[#6B6580] mt-0.5">
                Frequency of automated firewall rule triggers and threat vectors
              </p>
            </div>
            <button
              onClick={() => onNavigate('policies')}
              className="text-xs text-[#7657F6] hover:text-[#6847EB] font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Manage Policies</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-5 space-y-4">
            {data.ruleBreakdown.length === 0 ? (
              <p className="text-xs text-[#6B6580] py-6 text-center">No rule violations recorded yet.</p>
            ) : (
              data.ruleBreakdown.slice(0, 5).map((ruleItem) => {
                const maxCount = Math.max(...data.ruleBreakdown.map((r) => r.count), 1);
                const percent = Math.round((ruleItem.count / maxCount) * 100);

                return (
                  <div key={ruleItem.rule} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#292638]">{ruleItem.name}</span>
                        <span className="font-mono text-[10px] text-[#6B6580] bg-[#FFF9F2] px-1.5 py-0.5 rounded border border-[#EAE6F5]">
                          {ruleItem.rule}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-[#FF786B] tabular-nums">
                        {ruleItem.count} blocks
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#FFF9F2] border border-[#EAE6F5] overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#7657F6] via-[#FF786B] to-[#FF786B] rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Simulator Launch Strip */}
        <div className="p-6 rounded-2xl bg-white border border-[#EAE6F5] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE6F5]">
              <div className="flex items-center gap-2">
                <span className="text-base">🛡️</span>
                <h2 className="text-base font-bold text-[#292638]">Instant Threat Probes</h2>
              </div>
              <button
                onClick={() => onNavigate('simulator')}
                className="text-xs text-[#7657F6] hover:text-[#6847EB] font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Full Lab</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-[#6B6580] mt-2">
              Launch live agent attacks against the server firewall to test policy enforcement.
            </p>

            <div className="mt-4 space-y-2.5">
              <button
                onClick={() => onRunQuickScenario('scenario-1-authorized-read')}
                className="w-full text-left p-3 rounded-xl bg-[#FFF9F2] hover:bg-[#F3EDE6] border border-[#EAE6F5] hover:border-[#54D6B0] transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#54D6B0]/15 text-[#0f8263] flex items-center justify-center font-bold text-xs">
                    🟢
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#292638]">Whitelisted File Read</div>
                    <div className="text-[10px] text-[#6B6580]">Expected: ALLOW</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#6B6580] group-hover:text-[#0f8263]" />
              </button>

              <button
                onClick={() => onRunQuickScenario('scenario-2-secret-file-read')}
                className="w-full text-left p-3 rounded-xl bg-[#FFF9F2] hover:bg-[#F3EDE6] border border-[#EAE6F5] hover:border-[#FF786B] transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#FF786B]/15 text-[#FF786B] flex items-center justify-center font-bold text-xs">
                    ⛔
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#292638]">Secret File (.env) Probe</div>
                    <div className="text-[10px] text-[#6B6580]">Expected: BLOCK</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#6B6580] group-hover:text-[#FF786B]" />
              </button>

              <button
                onClick={() => onRunQuickScenario('scenario-3-directory-traversal')}
                className="w-full text-left p-3 rounded-xl bg-[#FFF9F2] hover:bg-[#F3EDE6] border border-[#EAE6F5] hover:border-[#FF786B] transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#FF786B]/15 text-[#FF786B] flex items-center justify-center font-bold text-xs">
                    🚨
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#292638]">Directory Traversal (../../passwd)</div>
                    <div className="text-[10px] text-[#6B6580]">Expected: BLOCK</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#6B6580] group-hover:text-[#FF786B]" />
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#EAE6F5] flex items-center justify-between text-xs text-[#6B6580]">
            <span>6 Scenarios & 20 Tests</span>
            <span className="font-mono text-[#7657F6] font-bold">100% Deterministic</span>
          </div>
        </div>
      </div>

      {/* Recent Incidents Table */}
      <div className="rounded-2xl bg-white border border-[#EAE6F5] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#EAE6F5] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base">🔍</span>
              <h2 className="text-base font-bold text-[#292638]">Recent Security Audit Trail</h2>
            </div>
            <p className="text-xs text-[#6B6580] mt-0.5">
              Latest tool evaluations evaluated by the SentinelMesh runtime policy engine
            </p>
          </div>
          <button
            onClick={() => onNavigate('events')}
            className="text-xs text-[#7657F6] hover:text-[#6847EB] font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>View All Events</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FFF9F2] text-[#6B6580] uppercase tracking-wider font-mono text-[10px] border-b border-[#EAE6F5]">
              <tr>
                <th className="px-6 py-3">Timestamp</th>
                <th className="px-4 py-3">Agent</th>
                <th className="px-4 py-3">Tool Invocated</th>
                <th className="px-4 py-3">Decision</th>
                <th className="px-4 py-3">Reason / Matched Rule</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE6F5]">
              {data.recentIncidents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-[#6B6580]">
                    No recent events logged yet.
                  </td>
                </tr>
              ) : (
                data.recentIncidents.map((evt) => {
                  const isBlock = evt.decision === 'BLOCK';
                  const dateStr = new Date(evt.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  return (
                    <tr
                      key={evt.id}
                      className="hover:bg-[#FFF9F2] transition-colors cursor-pointer group"
                      onClick={() => onSelectEvent(evt)}
                    >
                      <td className="px-6 py-3 font-mono text-[#6B6580] whitespace-nowrap tabular-nums">
                        {dateStr}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-bold text-[#292638]">{evt.agentName || evt.agentId}</div>
                        <div className="font-mono text-[10px] text-[#6B6580]">{evt.agentId}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[#7657F6] font-semibold whitespace-nowrap">
                        {evt.toolName}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            isBlock
                              ? 'bg-[#FF786B]/15 text-[#FF786B] border border-[#FF786B]/30'
                              : 'bg-[#54D6B0]/20 text-[#0f8263] border border-[#54D6B0]/30'
                          }`}
                        >
                          {evt.decision}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#292638] max-w-md truncate">
                        {evt.reason}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectEvent(evt);
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-[#7657F6] hover:bg-[#7657F6]/10 rounded-lg border border-[#7657F6]/20 transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <FileCode2 className="w-3 h-3 text-[#7657F6]" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Related Security Insights Section */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#7657F6]/5 via-white to-[#FF786B]/5 border border-[#EAE6F5] shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">✨</span>
          <h3 className="text-sm font-bold text-[#292638]">Related Security Insights & Defense Posture</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#6B6580]">
          <div className="p-3 rounded-xl bg-white/80 border border-[#EAE6F5]">
            <div className="font-bold text-[#292638] mb-1 flex items-center gap-1.5">
              <span>🔒</span> Least Privilege Active
            </div>
            Agents are restricted strictly to whitelisted paths and specified operations. Any unwhitelisted access is automatically blocked.
          </div>
          <div className="p-3 rounded-xl bg-white/80 border border-[#EAE6F5]">
            <div className="font-bold text-[#292638] mb-1 flex items-center gap-1.5">
              <span>📡</span> Egress Firewall Quarantine
            </div>
            Outbound transfers are inspected for credentials and sensitive tokens before any external HTTP request is permitted.
          </div>
          <div className="p-3 rounded-xl bg-white/80 border border-[#EAE6F5]">
            <div className="font-bold text-[#292638] mb-1 flex items-center gap-1.5">
              <span>🤖</span> Central Gateway MCP
            </div>
            Connect autonomous agent frameworks (Claude Desktop, LangChain, AutoGen) through the unified gateway API at `/api/gateway/v1/execute`.
          </div>
        </div>
      </div>
    </div>
  );
};
