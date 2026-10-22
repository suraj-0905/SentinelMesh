/**
 * SentinelMesh Policy Center & Access Control (Aurora Pop Theme)
 * Configure least-privilege tool permissions, path whitelists,
 * egress quarantines, and payload risk thresholds.
 */

import React, { useState } from 'react';
import {
  Shield,
  Save,
  RotateCcw,
  Check,
  AlertTriangle,
  Lock,
  Globe,
  FileText,
  Sliders,
} from 'lucide-react';
import type { SecurityPolicy, RiskLevel } from '../../shared/types.ts';

interface PoliciesViewProps {
  policies: SecurityPolicy[];
  loading: boolean;
  onUpdatePolicy: (policyId: string, updated: Partial<SecurityPolicy>) => Promise<void>;
  onResetPolicies: () => Promise<void>;
}

export const PoliciesView: React.FC<PoliciesViewProps> = ({
  policies,
  loading,
  onUpdatePolicy,
  onResetPolicies,
}) => {
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>(
    policies[0]?.id || 'policy-analyst'
  );
  const [formData, setFormData] = useState<SecurityPolicy | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const activePolicy =
    policies.find((p) => p.id === selectedPolicyId) || policies[0];

  React.useEffect(() => {
    if (activePolicy) {
      setFormData({ ...activePolicy });
    }
  }, [selectedPolicyId, policies]);

  const handleToolToggle = (toolName: string) => {
    if (!formData) return;
    const current = formData.allowedTools;
    const next = current.includes(toolName)
      ? current.filter((t) => t !== toolName)
      : [...current, toolName];
    setFormData({ ...formData, allowedTools: next });
  };

  const handleResourcePathsChange = (val: string) => {
    if (!formData) return;
    const paths = val
      .split('\n')
      .map((p) => p.trim())
      .filter(Boolean);
    setFormData({ ...formData, allowedResourcePaths: paths });
  };

  const handleBlockedKeywordsChange = (val: string) => {
    if (!formData) return;
    const kws = val
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
    setFormData({ ...formData, blockedKeywords: kws });
  };

  const handleConfirmSave = async () => {
    if (!formData) return;
    setIsSaving(true);
    try {
      await onUpdatePolicy(formData.id, {
        allowedTools: formData.allowedTools,
        allowedResourcePaths: formData.allowedResourcePaths,
        allowOutboundTransfer: formData.allowOutboundTransfer,
        allowedOutboundHosts: formData.allowedOutboundHosts,
        maxArgumentLength: formData.maxArgumentLength,
        blockedKeywords: formData.blockedKeywords,
        riskThreshold: formData.riskThreshold,
      });
      setShowConfirmModal(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmReset = async () => {
    setIsSaving(true);
    try {
      await onResetPolicies();
      setShowResetModal(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const allAvailableTools = [
    'read_file',
    'calculate_metrics',
    'execute_query',
    'http_post',
    'send_email',
  ];

  if (loading || !formData) {
    return (
      <div className="p-8 text-center text-[#6B6580]">Loading security policies...</div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE6F5]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7657F6]/10 text-[#7657F6] text-xs font-bold mb-2">
            <span>🔒</span>
            <span>Policy Governance Engine</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#292638]">
            Policy Center & Access Control
          </h1>
          <p className="text-xs text-[#6B6580] mt-1">
            Configure server-enforced whitelists, allowed virtual paths, egress quarantines, and risk thresholds.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowResetModal(true)}
            className="px-3.5 py-2 text-xs font-bold text-[#6B6580] hover:text-[#292638] bg-white hover:bg-[#FFF9F2] border border-[#EAE6F5] rounded-xl shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#6B6580]" />
            <span>Reset Defaults</span>
          </button>
          <button
            onClick={() => setShowConfirmModal(true)}
            className="px-4 py-2 text-xs font-bold text-white bg-[#7657F6] hover:bg-[#6847EB] rounded-xl shadow-md shadow-[#7657F6]/25 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Policy Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Policy Rules</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Policy Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {policies.map((p) => {
          const isSelected = p.id === selectedPolicyId;
          return (
            <button
              key={p.id}
              onClick={() => setSelectedPolicyId(p.id)}
              className={`p-4 rounded-2xl text-left border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-white border-[#7657F6] shadow-md shadow-[#7657F6]/10 ring-2 ring-[#7657F6]/15'
                  : 'bg-white/80 border-[#EAE6F5] hover:border-[#7657F6]/40 hover:bg-white shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-[#7657F6] font-bold">{p.id}</span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                    p.enabled
                      ? 'bg-[#54D6B0]/20 text-[#0f8263]'
                      : 'bg-[#FF786B]/20 text-[#FF786B]'
                  }`}
                >
                  {p.enabled ? 'ACTIVE' : 'DISABLED'}
                </span>
              </div>
              <h3 className="text-xs font-bold text-[#292638] mt-2 truncate">{p.name}</h3>
              <p className="text-[11px] text-[#6B6580] mt-1 line-clamp-2">{p.description}</p>
            </button>
          );
        })}
      </div>

      {/* Active Policy Configuration Panel */}
      <div className="rounded-2xl bg-white border border-[#EAE6F5] p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-[#EAE6F5]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#7657F6]/10 text-[#7657F6] flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#292638]">{formData.name}</h2>
              <span className="text-xs font-mono text-[#6B6580]">
                Target Agents: {formData.targetAgentIds.join(', ')}
              </span>
            </div>
          </div>

          <div className="text-xs text-[#6B6580] font-mono">
            Updated: {new Date(formData.updatedAt).toLocaleDateString()}
          </div>
        </div>

        {/* Form Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Allowed Tools Whitelist */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#292638]">
              <Sliders className="w-4 h-4 text-[#7657F6]" />
              <span>Whitelisted Tools (Least-Privilege Enforcement)</span>
            </div>
            <p className="text-xs text-[#6B6580]">
              Only checked tools can be invoked by agents governed by this policy. Unchecked tools trigger an immediate BLOCK.
            </p>

            <div className="space-y-2 pt-1">
              {allAvailableTools.map((tool) => {
                const isChecked = formData.allowedTools.includes(tool);
                return (
                  <label
                    key={tool}
                    className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-[#7657F6]/5 border-[#7657F6]/30 text-[#292638]'
                        : 'bg-[#FFF9F2] border-[#EAE6F5] text-[#6B6580] hover:border-[#7657F6]/20'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToolToggle(tool)}
                        className="rounded text-[#7657F6] focus:ring-0 cursor-pointer"
                      />
                      <span className="font-mono text-xs font-bold">{tool}</span>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        isChecked
                          ? 'bg-[#54D6B0]/20 text-[#0f8263]'
                          : 'bg-[#FF786B]/15 text-[#FF786B]'
                      }`}
                    >
                      {isChecked ? 'PERMITTED' : 'DENIED'}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Whitelisted Resource Paths */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#292638]">
              <FileText className="w-4 h-4 text-[#7657F6]" />
              <span>Approved Resource Paths (Exact Match Whitelist)</span>
            </div>
            <p className="text-xs text-[#6B6580]">
              Relative sandbox paths permitted for file access. Any other path, including traversal attempts or secrets, is blocked.
            </p>

            <textarea
              rows={5}
              value={formData.allowedResourcePaths.join('\n')}
              onChange={(e) => handleResourcePathsChange(e.target.value)}
              placeholder="reports/q3_summary.txt&#10;data/analytics_public.json"
              className="w-full p-3.5 bg-[#FFF9F2] border border-[#EAE6F5] rounded-xl font-mono text-xs text-[#292638] focus:outline-none focus:border-[#7657F6] leading-relaxed"
            />
            <div className="text-[11px] text-[#6B6580]">
              Enter one path per line. Traversal sequences (..) and absolute paths (/) will be rejected.
            </div>
          </div>

          {/* Outbound Transfer Controls */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#292638]">
              <Globe className="w-4 h-4 text-[#7657F6]" />
              <span>Outbound Egress & Data Transfer Quarantine</span>
            </div>
            <p className="text-xs text-[#6B6580]">
              Block outbound HTTP requests by default to prevent data exfiltration.
            </p>

            <div className="p-4 rounded-xl bg-[#FFF9F2] border border-[#EAE6F5] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#292638]">Allow Outbound Network Egress</div>
                  <div className="text-[11px] text-[#6B6580]">Default recommended setting is OFF (Quarantine)</div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      allowOutboundTransfer: !formData.allowOutboundTransfer,
                    })
                  }
                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    formData.allowOutboundTransfer ? 'bg-[#FF786B]' : 'bg-[#EAE6F5]'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      formData.allowOutboundTransfer ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {formData.allowOutboundTransfer && (
                <div className="p-3 rounded-xl bg-[#FF786B]/15 border border-[#FF786B]/30 text-[#FF786B] text-xs font-semibold">
                  Warning: Enabling outbound transfer permits agent network egress. Outbound payload secret scans will remain enforced.
                </div>
              )}
            </div>
          </div>

          {/* Blocked Keywords & Risk Controls */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#292638]">
              <Lock className="w-4 h-4 text-[#7657F6]" />
              <span>Sensitive Keywords & Payload Thresholds</span>
            </div>
            <p className="text-xs text-[#6B6580]">
              Keywords automatically triggering credential and secret access violation rules.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-[#6B6580] block mb-1 font-semibold">
                  Blocked Keywords (comma-separated):
                </label>
                <input
                  type="text"
                  value={formData.blockedKeywords.join(', ')}
                  onChange={(e) => handleBlockedKeywordsChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FFF9F2] border border-[#EAE6F5] rounded-xl font-mono text-xs text-[#292638] focus:outline-none focus:border-[#7657F6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-[#6B6580] block mb-1 font-semibold">
                    Max Payload Length (bytes):
                  </label>
                  <input
                    type="number"
                    value={formData.maxArgumentLength}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxArgumentLength: parseInt(e.target.value) || 2048,
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-[#FFF9F2] border border-[#EAE6F5] rounded-xl font-mono text-xs text-[#292638] focus:outline-none focus:border-[#7657F6]"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[#6B6580] block mb-1 font-semibold">Risk Threshold:</label>
                  <select
                    value={formData.riskThreshold}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        riskThreshold: e.target.value as RiskLevel,
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-[#FFF9F2] border border-[#EAE6F5] rounded-xl font-mono text-xs text-[#292638] focus:outline-none focus:border-[#7657F6] cursor-pointer"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for Policy Save */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#292638]/50 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white border border-[#EAE6F5] rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#7657F6]/10 text-[#7657F6]">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#292638]">Confirm Policy Update</h3>
                <p className="text-xs text-[#6B6580]">Enforcing runtime policy modification</p>
              </div>
            </div>

            <p className="text-xs text-[#6B6580] leading-relaxed">
              You are about to update <strong>{formData.name}</strong> ({formData.id}).
              New tool calls by assigned agents will immediately be evaluated against these updated rules.
            </p>

            <div className="p-3.5 rounded-xl bg-[#FFF9F2] border border-[#EAE6F5] text-[11px] font-mono space-y-1 text-[#292638]">
              <div>Whitelisted Tools: {formData.allowedTools.join(', ') || 'None (Total Lockdown)'}</div>
              <div>Resource Whitelist: {formData.allowedResourcePaths.length} paths</div>
              <div>Outbound Egress: {formData.allowOutboundTransfer ? 'ENABLED' : 'BLOCKED'}</div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-3.5 py-2 text-xs font-bold text-[#6B6580] hover:text-[#292638] rounded-xl hover:bg-[#FFF9F2]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSave}
                disabled={isSaving}
                className="px-4 py-2 text-xs font-bold text-white bg-[#7657F6] hover:bg-[#6847EB] rounded-xl shadow-md transition-all disabled:opacity-50"
              >
                {isSaving ? 'Applying Rules...' : 'Confirm & Apply'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Defaults Confirmation Dialog */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#292638]/50 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white border border-[#EAE6F5] rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#FF786B]/15 text-[#FF786B]">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#292638]">Restore Default Policies</h3>
                <p className="text-xs text-[#6B6580]">Zero-trust baseline reset</p>
              </div>
            </div>

            <p className="text-xs text-[#6B6580] leading-relaxed">
              This will restore all security policies to their baseline zero-trust configurations.
            </p>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-3.5 py-2 text-xs font-bold text-[#6B6580] hover:text-[#292638] rounded-xl hover:bg-[#FFF9F2]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReset}
                disabled={isSaving}
                className="px-4 py-2 text-xs font-bold text-white bg-[#FF786B] hover:bg-[#e06558] rounded-xl shadow-md transition-all"
              >
                {isSaving ? 'Resetting...' : 'Restore Defaults'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
