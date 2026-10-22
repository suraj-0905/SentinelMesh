/**
 * SentinelMesh Security Alerts View (Aurora Pop Theme)
 * Incident triage, forensic evidence inspection, and automated remediation.
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { SecurityAlert, AlertStatus } from '../../shared/types.ts';

interface AlertsViewProps {
  alerts: SecurityAlert[];
  loading: boolean;
  onUpdateAlertStatus: (alertId: string, status: AlertStatus) => Promise<void>;
  onInspectEventId: (eventId?: string) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  alerts,
  loading,
  onUpdateAlertStatus,
  onInspectEventId,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filtered = alerts.filter((a) => (filterStatus === 'all' ? true : a.status === filterStatus));

  const handleStatusChange = async (alertId: string, newStatus: AlertStatus) => {
    setUpdatingId(alertId);
    try {
      await onUpdateAlertStatus(alertId, newStatus);
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedAlertId(expandedAlertId === id ? null : id);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE6F5]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF786B]/15 text-[#FF786B] text-xs font-bold mb-2">
            <span>🚨</span>
            <span>Automated Incident Triage</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#292638]">
            Security Alerts & Triage
          </h1>
          <p className="text-xs text-[#6B6580] mt-1">
            Real-time synthesized incident reports from intercepted traversal, credential leak, and rogue agent vectors.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-white border border-[#EAE6F5] rounded-xl text-xs shadow-sm">
          {['all', 'OPEN', 'INVESTIGATING', 'RESOLVED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 font-bold rounded-lg transition-all cursor-pointer ${
                filterStatus === st
                  ? 'bg-[#7657F6] text-white shadow-sm'
                  : 'text-[#6B6580] hover:text-[#292638] hover:bg-[#FFF9F2]'
              }`}
            >
              {st === 'all' ? 'All Alerts' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Stream */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-[#EAE6F5]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-[#EAE6F5] shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-[#54D6B0]/15 text-[#0f8263] flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#292638]">No Matching Security Alerts</h3>
          <p className="text-xs text-[#6B6580] mt-1 max-w-sm mx-auto">
            All agent activities are conforming strictly to assigned policies with zero unmitigated threats.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((alert) => {
            const isExpanded = expandedAlertId === alert.id;
            const isUpdating = updatingId === alert.id;

            return (
              <div
                key={alert.id}
                className="rounded-2xl bg-white border border-[#EAE6F5] shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                {/* Alert Primary Bar */}
                <div
                  onClick={() => toggleExpand(alert.id)}
                  className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                        alert.severity === 'CRITICAL'
                          ? 'bg-[#FF786B]/15 text-[#FF786B] border border-[#FF786B]/30'
                          : alert.severity === 'HIGH'
                          ? 'bg-[#FFD66B]/20 text-[#d97706] border border-[#FFD66B]/40'
                          : 'bg-[#7657F6]/10 text-[#7657F6] border border-[#7657F6]/25'
                      }`}
                    >
                      <AlertTriangle className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-[#292638]">{alert.title}</span>
                        <span
                          className={`font-mono text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                            alert.severity === 'CRITICAL'
                              ? 'bg-[#FF786B]/20 text-[#FF786B]'
                              : 'bg-[#FFD66B]/30 text-[#d97706]'
                          }`}
                        >
                          {alert.severity}
                        </span>
                        <span
                          className={`font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                            alert.status === 'OPEN'
                              ? 'bg-[#FF786B]/15 text-[#FF786B] border-[#FF786B]/30'
                              : alert.status === 'INVESTIGATING'
                              ? 'bg-[#FFD66B]/25 text-[#d97706] border-[#FFD66B]/40'
                              : 'bg-[#54D6B0]/20 text-[#0f8263] border-[#54D6B0]/40'
                          }`}
                        >
                          {alert.status}
                        </span>
                      </div>

                      <p className="text-xs text-[#292638] mt-1 font-medium">{alert.description}</p>

                      <div className="flex items-center gap-2 text-[11px] text-[#6B6580] font-mono mt-2">
                        <span>Agent: <strong className="text-[#292638]">{alert.affectedAgentId}</strong></span>
                        <span aria-hidden="true">·</span>
                        <span>Time: {new Date(alert.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Expand Toggle */}
                  <div
                    className="flex items-center gap-2.5 shrink-0 self-end md:self-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {alert.status === 'OPEN' && (
                      <button
                        onClick={() => handleStatusChange(alert.id, 'INVESTIGATING')}
                        disabled={isUpdating}
                        className="px-3 py-1.5 text-xs font-bold text-[#d97706] bg-[#FFD66B]/20 hover:bg-[#FFD66B]/30 border border-[#FFD66B]/40 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        Investigate
                      </button>
                    )}

                    {alert.status !== 'RESOLVED' ? (
                      <button
                        onClick={() => handleStatusChange(alert.id, 'RESOLVED')}
                        disabled={isUpdating}
                        className="px-3 py-1.5 text-xs font-bold text-[#0f8263] bg-[#54D6B0]/20 hover:bg-[#54D6B0]/30 border border-[#54D6B0]/40 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Resolve</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusChange(alert.id, 'OPEN')}
                        disabled={isUpdating}
                        className="px-3 py-1.5 text-xs font-bold text-[#6B6580] bg-[#FFF9F2] hover:bg-[#F3EDE6] border border-[#EAE6F5] rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        Reopen
                      </button>
                    )}

                    <button
                      onClick={() => toggleExpand(alert.id)}
                      className="p-1.5 text-[#6B6580] hover:text-[#292638] rounded-xl hover:bg-[#FFF9F2] transition-colors cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Forensic Evidence & Remediation */}
                {isExpanded && (
                  <div className="p-6 border-t border-[#EAE6F5] bg-[#FFF9F2]/60 space-y-4 text-xs">
                    <div>
                      <div className="flex items-center gap-1.5 text-[#7657F6] font-bold mb-1.5 text-[11px] uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5 text-[#FFD66B]" />
                        <span>Recommended Remediation</span>
                      </div>
                      <p className="text-[#292638] bg-white p-3.5 rounded-xl border border-[#EAE6F5] leading-relaxed shadow-sm font-medium">
                        {alert.remediation}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[#6B6580] font-mono text-[11px] uppercase tracking-wider mb-1.5">
                        <span>Forensic Evidence Details</span>
                        {alert.relatedEventId && (
                          <button
                            onClick={() => onInspectEventId(alert.relatedEventId)}
                            className="text-[#7657F6] hover:underline cursor-pointer lowercase font-mono text-[11px]"
                          >
                            open audit event {alert.relatedEventId} &rarr;
                          </button>
                        )}
                      </div>
                      {/* Dark code container for technical evidence */}
                      <pre className="p-3.5 rounded-xl bg-[#1d1b27] border border-[#2d2940] font-mono text-[11px] text-[#ffd66b] overflow-x-auto shadow-inner">
                        {JSON.stringify(alert.evidence, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
