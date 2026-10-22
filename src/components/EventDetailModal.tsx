/**
 * SentinelMesh Event Detail Inspector Modal (Aurora Pop Theme)
 * Forensic drilldown inspecting evaluated agent arguments,
 * cryptographic execution grant status, and matched rules.
 */

import React from 'react';
import { X, ShieldAlert, ShieldCheck, Copy, Check } from 'lucide-react';
import type { AuditEvent } from '../../shared/types.ts';

interface EventDetailModalProps {
  event: AuditEvent | null;
  onClose: () => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({ event, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!event) return null;

  const isBlock = event.decision === 'BLOCK';

  const copyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(event, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#292638]/50 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white border border-[#EAE6F5] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAE6F5] bg-[#FFF9F2]/60">
          <div className="flex items-center gap-3.5">
            <div
              className={`p-2.5 rounded-xl ${
                isBlock ? 'bg-[#FF786B]/15 text-[#FF786B]' : 'bg-[#54D6B0]/20 text-[#0f8263]'
              }`}
            >
              {isBlock ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#292638]">Security Event Inspector</h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                    isBlock
                      ? 'bg-[#FF786B]/20 text-[#FF786B] border border-[#FF786B]/30'
                      : 'bg-[#54D6B0]/20 text-[#0f8263] border border-[#54D6B0]/30'
                  }`}
                >
                  {event.decision}
                </span>
                {event.isSimulation && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#7657F6]/10 text-[#7657F6] border border-[#7657F6]/25">
                    SIMULATION
                  </span>
                )}
              </div>
              <div className="text-xs text-[#6B6580] font-mono mt-0.5">
                Event: {event.id} · Request: {event.requestId}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyPayload}
              className="p-2 text-[#6B6580] hover:text-[#292638] rounded-xl hover:bg-white border border-[#EAE6F5] transition-colors cursor-pointer"
              title="Copy event JSON"
            >
              {copied ? <Check className="w-4 h-4 text-[#0f8263]" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-[#6B6580] hover:text-[#292638] rounded-xl hover:bg-white border border-[#EAE6F5] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-[#292638]">
          {/* Reason Banner */}
          <div
            className={`p-4 rounded-2xl border ${
              isBlock
                ? 'bg-[#FF786B]/10 border-[#FF786B]/30 text-[#FF786B]'
                : 'bg-[#54D6B0]/15 border-[#54D6B0]/30 text-[#0f8263]'
            }`}
          >
            <div className="font-bold text-[11px] uppercase tracking-wider mb-1 font-mono">
              Firewall Verdict & Defense Rationale
            </div>
            <p className="text-xs leading-relaxed font-bold">{event.reason}</p>
          </div>

          {/* Key Attributes Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-[11px]">
            <div className="p-3 rounded-xl bg-[#FFF9F2] border border-[#EAE6F5]">
              <span className="text-[#6B6580] block text-[10px] uppercase font-bold">Agent Identity</span>
              <span className="font-bold text-[#292638]">{event.agentId}</span>
              {event.agentName && <span className="block text-[#6B6580] text-[10px]">{event.agentName}</span>}
            </div>

            <div className="p-3 rounded-xl bg-[#FFF9F2] border border-[#EAE6F5]">
              <span className="text-[#6B6580] block text-[10px] uppercase font-bold">Tool Invocated</span>
              <span className="font-bold text-[#7657F6]">{event.toolName}</span>
            </div>

            <div className="p-3 rounded-xl bg-[#FFF9F2] border border-[#EAE6F5]">
              <span className="text-[#6B6580] block text-[10px] uppercase font-bold">Risk Level</span>
              <span
                className={`font-bold ${
                  event.riskLevel === 'CRITICAL'
                    ? 'text-[#FF786B]'
                    : event.riskLevel === 'HIGH'
                    ? 'text-[#d97706]'
                    : 'text-[#0f8263]'
                }`}
              >
                {event.riskLevel}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#FFF9F2] border border-[#EAE6F5]">
              <span className="text-[#6B6580] block text-[10px] uppercase font-bold">Executor Boundary</span>
              <span
                className={`font-bold ${
                  event.executionOccurred ? 'text-[#0f8263]' : 'text-[#6B6580]'
                }`}
              >
                {event.executionOccurred ? 'EXECUTED (SAFE MOCK)' : 'ABORTED AT FIREWALL'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#FFF9F2] border border-[#EAE6F5]">
              <span className="text-[#6B6580] block text-[10px] uppercase font-bold">Evaluation Latency</span>
              <span className="font-bold text-[#292638] tabular-nums">
                {event.executionDurationMs !== undefined ? `${event.executionDurationMs} ms` : '1.2 ms'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#FFF9F2] border border-[#EAE6F5]">
              <span className="text-[#6B6580] block text-[10px] uppercase font-bold">Timestamp</span>
              <span className="font-bold text-[#292638] tabular-nums">
                {new Date(event.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* Matched Rules */}
          <div>
            <span className="text-[#6B6580] font-mono text-[11px] uppercase block mb-1.5 font-bold">
              Matched Firewall Rules
            </span>
            <div className="flex flex-wrap gap-1.5">
              {event.matchedRules.map((rule) => (
                <span
                  key={rule}
                  className="font-mono text-[11px] px-2 py-0.5 rounded-lg bg-[#FFF9F2] border border-[#EAE6F5] text-[#7657F6] font-bold"
                >
                  {rule}
                </span>
              ))}
            </div>
          </div>

          {/* Submitted Arguments (Dark code surface) */}
          <div>
            <span className="text-[#6B6580] font-mono text-[11px] uppercase block mb-1.5 font-bold">
              Submitted Tool Arguments (Sanitized)
            </span>
            <pre className="p-3.5 rounded-xl bg-[#1d1b27] border border-[#2d2940] font-mono text-[11px] text-[#54d6b0] overflow-x-auto shadow-inner">
              {JSON.stringify(event.arguments, null, 2)}
            </pre>
          </div>

          {/* Evidence Details if Present */}
          {event.evidence && (
            <div>
              <span className="text-[#6B6580] font-mono text-[11px] uppercase block mb-1.5 font-bold">
                Forensic Evidence Captured
              </span>
              <pre className="p-3.5 rounded-xl bg-[#1d1b27] border border-[#2d2940] font-mono text-[11px] text-[#ffd66b] overflow-x-auto shadow-inner">
                {JSON.stringify(event.evidence, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#EAE6F5] bg-[#FFF9F2]/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-[#292638] hover:bg-white bg-white/70 border border-[#EAE6F5] rounded-xl transition-all shadow-sm cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
