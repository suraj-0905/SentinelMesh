/**
 * SentinelMesh Security Events Ledger (Aurora Pop Theme)
 * Searchable, filterable, paginated audit ledger of agent tool calls,
 * verdicts, and policy evaluations.
 */

import React, { useState } from 'react';
import {
  Search,
  Download,
  Filter,
  FileCode2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import type { AuditEvent } from '../../shared/types.ts';

interface EventsViewProps {
  events: AuditEvent[];
  total: number;
  page: number;
  totalPages: number;
  loading: boolean;
  onPageChange: (newPage: number) => void;
  onSearch: (q: string) => void;
  onFilterChange: (filters: {
    decision?: string;
    riskLevel?: string;
    isSimulation?: boolean;
  }) => void;
  onSelectEvent: (event: AuditEvent) => void;
  onRefresh: () => void;
}

export const EventsView: React.FC<EventsViewProps> = ({
  events,
  total,
  page,
  totalPages,
  loading,
  onPageChange,
  onSearch,
  onFilterChange,
  onSelectEvent,
  onRefresh,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [decisionFilter, setDecisionFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchInput);
  };

  const handleDecisionChange = (val: string) => {
    setDecisionFilter(val);
    onFilterChange({
      decision: val === 'all' ? undefined : val,
      riskLevel: riskFilter === 'all' ? undefined : riskFilter,
      isSimulation:
        sourceFilter === 'sim' ? true : sourceFilter === 'prod' ? false : undefined,
    });
  };

  const handleRiskChange = (val: string) => {
    setRiskFilter(val);
    onFilterChange({
      decision: decisionFilter === 'all' ? undefined : decisionFilter,
      riskLevel: val === 'all' ? undefined : val,
      isSimulation:
        sourceFilter === 'sim' ? true : sourceFilter === 'prod' ? false : undefined,
    });
  };

  const handleSourceChange = (val: string) => {
    setSourceFilter(val);
    onFilterChange({
      decision: decisionFilter === 'all' ? undefined : decisionFilter,
      riskLevel: riskFilter === 'all' ? undefined : riskFilter,
      isSimulation: val === 'sim' ? true : val === 'prod' ? false : undefined,
    });
  };

  const downloadJson = () => {
    window.location.href = '/api/events/export/json';
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE6F5]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7657F6]/10 text-[#7657F6] text-xs font-bold mb-2">
            <span>🔍</span>
            <span>Immutable Audit Trail</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#292638]">
            Security Events Ledger
          </h1>
          <p className="text-xs text-[#6B6580] mt-1">
            Cryptographically recorded ledger of agent tool invocations, evaluated policies, and firewall verdicts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={downloadJson}
            className="px-3.5 py-2 text-xs font-bold text-[#292638] bg-white hover:bg-[#FFF9F2] rounded-xl border border-[#EAE6F5] shadow-sm hover:border-[#7657F6]/30 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#7657F6]" />
            <span>Export Ledger (JSON)</span>
          </button>
          <button
            onClick={onRefresh}
            className="p-2 text-[#6B6580] hover:text-[#292638] rounded-xl bg-white border border-[#EAE6F5] shadow-sm hover:bg-[#FFF9F2] transition-colors cursor-pointer"
            title="Refresh events"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#7657F6]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-5 rounded-2xl bg-white border border-[#EAE6F5] shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#6B6580] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by agent ID, tool name, violation keyword, or rationale..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#FFF9F2] border border-[#EAE6F5] rounded-xl text-xs text-[#292638] placeholder-[#6B6580] focus:outline-none focus:border-[#7657F6] focus:ring-2 focus:ring-[#7657F6]/10"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 text-xs font-bold text-white bg-[#7657F6] hover:bg-[#6847EB] rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* Filter Segmented Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#EAE6F5] text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-[#6B6580] font-semibold">
              <Filter className="w-3.5 h-3.5 text-[#7657F6]" />
              <span>Verdict:</span>
              <select
                value={decisionFilter}
                onChange={(e) => handleDecisionChange(e.target.value)}
                className="bg-[#FFF9F2] border border-[#EAE6F5] rounded-lg px-2.5 py-1 text-xs text-[#292638] focus:outline-none focus:border-[#7657F6] cursor-pointer"
              >
                <option value="all">All Decisions</option>
                <option value="ALLOW">ALLOW only</option>
                <option value="BLOCK">BLOCK only</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-[#6B6580] font-semibold">
              <span>Risk:</span>
              <select
                value={riskFilter}
                onChange={(e) => handleRiskChange(e.target.value)}
                className="bg-[#FFF9F2] border border-[#EAE6F5] rounded-lg px-2.5 py-1 text-xs text-[#292638] focus:outline-none focus:border-[#7657F6] cursor-pointer"
              >
                <option value="all">All Risks</option>
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-[#6B6580] font-semibold">
              <span>Source:</span>
              <select
                value={sourceFilter}
                onChange={(e) => handleSourceChange(e.target.value)}
                className="bg-[#FFF9F2] border border-[#EAE6F5] rounded-lg px-2.5 py-1 text-xs text-[#292638] focus:outline-none focus:border-[#7657F6] cursor-pointer"
              >
                <option value="all">All Traffic</option>
                <option value="prod">Real Gateway Calls</option>
                <option value="sim">Simulator Probes</option>
              </select>
            </div>
          </div>

          <div className="text-[#6B6580] font-mono text-[11px] tabular-nums">
            Showing <strong className="text-[#292638]">{events.length}</strong> of{' '}
            <strong className="text-[#292638]">{total}</strong> events
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="rounded-2xl bg-white border border-[#EAE6F5] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FFF9F2] text-[#6B6580] uppercase tracking-wider font-mono text-[10px] border-b border-[#EAE6F5]">
              <tr>
                <th className="px-6 py-3.5">Timestamp</th>
                <th className="px-4 py-3.5">Agent</th>
                <th className="px-4 py-3.5">Tool</th>
                <th className="px-4 py-3.5">Verdict</th>
                <th className="px-4 py-3.5">Risk</th>
                <th className="px-4 py-3.5">Reason & Matched Rules</th>
                <th className="px-4 py-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE6F5]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#6B6580]">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#7657F6]" />
                      <span>Loading audit ledger...</span>
                    </div>
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#6B6580]">
                    No security events match the current filter criteria.
                  </td>
                </tr>
              ) : (
                events.map((evt) => {
                  const isBlock = evt.decision === 'BLOCK';
                  const dateObj = new Date(evt.timestamp);
                  const dateStr = dateObj.toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                  });
                  const timeStr = dateObj.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  return (
                    <tr
                      key={evt.id}
                      onClick={() => onSelectEvent(evt)}
                      className="hover:bg-[#FFF9F2] transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-3 font-mono text-[#6B6580] whitespace-nowrap tabular-nums">
                        <div>{timeStr}</div>
                        <div className="text-[10px] text-[#6B6580]/70">{dateStr}</div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-bold text-[#292638]">
                          {evt.agentName || evt.agentId}
                        </div>
                        <div className="font-mono text-[10px] text-[#6B6580]">{evt.agentId}</div>
                      </td>

                      <td className="px-4 py-3 font-mono text-[#7657F6] whitespace-nowrap font-semibold">
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

                      <td className="px-4 py-3 whitespace-nowrap font-mono text-[11px]">
                        <span
                          className={
                            evt.riskLevel === 'CRITICAL'
                              ? 'text-[#FF786B] font-extrabold'
                              : evt.riskLevel === 'HIGH'
                              ? 'text-[#d97706] font-bold'
                              : evt.riskLevel === 'MEDIUM'
                              ? 'text-[#7657F6] font-semibold'
                              : 'text-[#0f8263]'
                          }
                        >
                          {evt.riskLevel}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-[#292638] max-w-lg">
                        <div className="truncate font-semibold">{evt.reason}</div>
                        <div className="font-mono text-[10px] text-[#6B6580] truncate mt-0.5">
                          {evt.matchedRules.join(' · ')}
                        </div>
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

        {/* Pagination Footer */}
        <div className="px-6 py-3.5 border-t border-[#EAE6F5] bg-[#FFF9F2]/50 flex items-center justify-between text-xs text-[#6B6580]">
          <div>
            Page <span className="font-mono font-bold text-[#292638] tabular-nums">{page}</span> of{' '}
            <span className="font-mono font-bold text-[#292638] tabular-nums">{totalPages || 1}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-xl bg-white border border-[#EAE6F5] hover:bg-[#FFF9F2] text-[#292638] font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-xl bg-white border border-[#EAE6F5] hover:bg-[#FFF9F2] text-[#292638] font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
