/**
 * SentinelMesh Attack Simulator & Interactive Testing Lab (Aurora Pop Theme)
 * Predefined attack scenarios, batch verification runner, custom tool call payload injector,
 * and live server-side firewall evaluation inspection.
 */

import React, { useState } from 'react';
import {
  Play,
  PlaySquare,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Terminal,
  FileCode2,
  AlertCircle,
  Send,
  Sparkles,
} from 'lucide-react';
import type { SimulatorScenario, SecurityDecision } from '../../shared/types.ts';

interface SimulatorViewProps {
  scenarios: SimulatorScenario[];
  loading: boolean;
  onRunScenario: (
    scenarioId?: string,
    custom?: { agentId: string; toolName: string; arguments: Record<string, any> }
  ) => Promise<{
    submittedRequest: any;
    decision: SecurityDecision;
    matchExpected: boolean;
  }>;
  onRunAllScenarios: () => Promise<any>;
  onInspectEventId: (eventId: string) => void;
}

export const SimulatorView: React.FC<SimulatorViewProps> = ({
  scenarios,
  loading,
  onRunScenario,
  onRunAllScenarios,
  onInspectEventId,
}) => {
  const [activeScenarioId, setActiveScenarioId] = useState<string>(
    scenarios[0]?.id || 'scenario-1-authorized-read'
  );
  const [runningId, setRunningId] = useState<string | null>(null);
  const [batchRunning, setBatchRunning] = useState(false);
  const [latestRun, setLatestRun] = useState<{
    scenarioId: string;
    submittedRequest: any;
    decision: SecurityDecision;
    matchExpected: boolean;
  } | null>(null);

  const [batchResults, setBatchResults] = useState<{
    allPassed: boolean;
    passedCount: number;
    totalScenarios: number;
    results: any[];
  } | null>(null);

  // Custom scenario builder state
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customAgentId, setCustomAgentId] = useState('agent-analyst-01');
  const [customToolName, setCustomToolName] = useState('read_file');
  const [customArgsJson, setCustomArgsJson] = useState('{\n  "path": "reports/q3_summary.txt"\n}');
  const [customJsonError, setCustomJsonError] = useState<string | null>(null);

  const activeScenario =
    scenarios.find((s) => s.id === activeScenarioId) || scenarios[0];

  const handleExecuteSingle = async (scenario: SimulatorScenario) => {
    setRunningId(scenario.id);
    try {
      const res = await onRunScenario(scenario.id);
      if (res && res.decision) {
        setLatestRun({
          scenarioId: scenario.id,
          submittedRequest: res.submittedRequest || { agentId: scenario.agentId, toolName: scenario.toolName },
          decision: res.decision,
          matchExpected: typeof res.matchExpected === 'boolean' ? res.matchExpected : (res.decision.decision === scenario.expectedDecision),
        });
      }
    } catch (err: any) {
      console.error('Simulator scenario execution error:', err);
    } finally {
      setRunningId(null);
    }
  };

  const handleExecuteCustom = async () => {
    setCustomJsonError(null);
    let parsedArgs: Record<string, any> = {};
    try {
      parsedArgs = JSON.parse(customArgsJson);
    } catch (e: any) {
      setCustomJsonError(`Invalid JSON format: ${e.message}`);
      return;
    }

    setRunningId('custom');
    try {
      const res = await onRunScenario(undefined, {
        agentId: customAgentId,
        toolName: customToolName,
        arguments: parsedArgs,
      });
      if (res && res.decision) {
        setLatestRun({
          scenarioId: 'custom',
          submittedRequest: res.submittedRequest || { agentId: customAgentId, toolName: customToolName, arguments: parsedArgs },
          decision: res.decision,
          matchExpected: true,
        });
      }
    } catch (err: any) {
      console.error('Custom simulator execution error:', err);
    } finally {
      setRunningId(null);
    }
  };

  const handleBatchRun = async () => {
    setBatchRunning(true);
    try {
      const res = await onRunAllScenarios();
      setBatchResults(res);
    } finally {
      setBatchRunning(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Simulation Banner Notice */}
      <div className="p-5 rounded-2xl bg-white border border-[#EAE6F5] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#7657F6]/10 text-[#7657F6] flex items-center justify-center shrink-0">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#7657F6]">
                Controlled Demonstration Sandbox
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#54D6B0]/20 text-[#0f8263]">
                AUDITED & ISOLATED
              </span>
            </div>
            <p className="text-xs text-[#6B6580] mt-0.5 font-medium">
              These scenarios trigger real server-side firewall evaluation with immutable audit logging.
            </p>
          </div>
        </div>

        <button
          onClick={handleBatchRun}
          disabled={batchRunning}
          className="px-4 py-2.5 text-xs font-bold text-white bg-[#7657F6] hover:bg-[#6847EB] rounded-xl transition-all shadow-md shadow-[#7657F6]/20 flex items-center gap-2 whitespace-nowrap cursor-pointer disabled:opacity-50"
        >
          {batchRunning ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Verifying 6 Scenarios...</span>
            </>
          ) : (
            <>
              <PlaySquare className="w-4 h-4" />
              <span>Run All 6 Scenarios</span>
            </>
          )}
        </button>
      </div>

      {/* Batch Results Strip */}
      {batchResults && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-4 shadow-sm ${
            batchResults.allPassed
              ? 'bg-[#54D6B0]/15 border-[#54D6B0]/40 text-[#0f8263]'
              : 'bg-[#FF786B]/15 border-[#FF786B]/40 text-[#FF786B]'
          }`}
        >
          <div className="flex items-center gap-3">
            {batchResults.allPassed ? (
              <CheckCircle2 className="w-5 h-5 text-[#0f8263]" />
            ) : (
              <XCircle className="w-5 h-5 text-[#FF786B]" />
            )}
            <div>
              <span className="text-sm font-bold">
                Batch Verification Results:{' '}
                {batchResults.allPassed ? '100% Policy Conformance' : 'Discrepancy Detected'}
              </span>
              <p className="text-xs text-[#6B6580] mt-0.5">
                {batchResults.passedCount} of {batchResults.totalScenarios} scenarios matched their expected security decisions.
              </p>
            </div>
          </div>

          <div className="text-xs font-mono font-extrabold px-3 py-1 rounded-full bg-white border border-current shadow-sm">
            {batchResults.passedCount}/{batchResults.totalScenarios} PASSED
          </div>
        </div>
      )}

      {/* Mode Switcher */}
      <div className="flex items-center justify-between pb-2 border-b border-[#EAE6F5]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCustomMode(false)}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              !isCustomMode
                ? 'bg-[#7657F6] text-white shadow-sm'
                : 'text-[#6B6580] hover:text-[#292638] hover:bg-[#FFF9F2]'
            }`}
          >
            Predefined Attack Scenarios (6)
          </button>
          <button
            onClick={() => setIsCustomMode(true)}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              isCustomMode
                ? 'bg-[#7657F6] text-white shadow-sm'
                : 'text-[#6B6580] hover:text-[#292638] hover:bg-[#FFF9F2]'
            }`}
          >
            Custom Attack Console
          </button>
        </div>

        <span className="text-xs font-mono text-[#6B6580]">
          Endpoint: <strong className="text-[#292638]">/api/simulator/evaluate</strong>
        </span>
      </div>

      {!isCustomMode ? (
        /* Predefined Scenarios Grid */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scenario List (Left Column) */}
          <div className="space-y-3 lg:col-span-1">
            <span className="text-xs font-mono uppercase text-[#6B6580] font-bold block">
              Predefined Scenarios
            </span>
            <div className="space-y-2.5">
              {scenarios.map((sc) => {
                const isSelected = sc.id === activeScenarioId;
                const isAllow = sc.expectedDecision === 'ALLOW';
                const isExecuting = runningId === sc.id;

                return (
                  <div
                    key={sc.id}
                    onClick={() => setActiveScenarioId(sc.id)}
                    className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-white border-[#7657F6] shadow-md shadow-[#7657F6]/10 ring-2 ring-[#7657F6]/10'
                        : 'bg-white/80 border-[#EAE6F5] hover:border-[#7657F6]/40 hover:bg-white shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full ${
                          isAllow
                            ? 'bg-[#54D6B0]/20 text-[#0f8263] border border-[#54D6B0]/30'
                            : 'bg-[#FF786B]/20 text-[#FF786B] border border-[#FF786B]/30'
                        }`}
                      >
                        Target: {sc.expectedDecision}
                      </span>
                      <span className="text-[10px] font-mono text-[#6B6580] font-semibold">
                        {sc.toolName}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-[#292638] leading-snug">{sc.name}</h4>
                    <p className="text-[11px] text-[#6B6580] mt-1 line-clamp-2">{sc.description}</p>

                    <div className="mt-3 pt-2.5 border-t border-[#EAE6F5] flex items-center justify-between">
                      <span className="text-[10px] font-mono text-[#6B6580]">{sc.agentId}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExecuteSingle(sc);
                        }}
                        disabled={isExecuting}
                        className="px-3 py-1 text-[11px] font-bold text-white bg-[#7657F6] hover:bg-[#6847EB] rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        {isExecuting ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Play className="w-3 h-3 fill-white" />
                        )}
                        <span>{isExecuting ? 'Running...' : 'Execute'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Scenario Inspector & Live Result (Right Column) */}
          <div className="lg:col-span-2 space-y-5">
            <div className="p-6 rounded-2xl bg-white border border-[#EAE6F5] shadow-sm space-y-5">
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#EAE6F5]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-[#7657F6] uppercase tracking-wider font-bold">
                      Scenario Inspection
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-extrabold ${
                        activeScenario.expectedDecision === 'ALLOW'
                          ? 'bg-[#54D6B0]/20 text-[#0f8263]'
                          : 'bg-[#FF786B]/20 text-[#FF786B]'
                      }`}
                    >
                      Target Verdict: {activeScenario.expectedDecision}
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-[#292638] mt-1">{activeScenario.name}</h3>
                  <p className="text-xs text-[#6B6580] mt-1">{activeScenario.description}</p>
                </div>

                <button
                  onClick={() => handleExecuteSingle(activeScenario)}
                  disabled={runningId === activeScenario.id}
                  className="px-4 py-2.5 text-xs font-bold text-white bg-[#7657F6] hover:bg-[#6847EB] rounded-xl transition-all shadow-md shadow-[#7657F6]/25 flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {runningId === activeScenario.id ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Evaluating in Backend...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Run Scenario Now</span>
                    </>
                  )}
                </button>
              </div>

              {/* Rationale & Expected Defense */}
              <div className="p-4 rounded-xl bg-[#FFF9F2] border border-[#EAE6F5] text-xs space-y-1.5">
                <span className="font-bold text-[#292638] uppercase font-mono text-[10px] block">
                  Expected Firewall Defense Architecture:
                </span>
                <p className="text-[#6B6580] leading-relaxed font-medium">{activeScenario.explanation}</p>
                <div className="pt-1 text-[11px] font-mono text-[#7657F6]">
                  Target Rule Trigger: <strong>{activeScenario.expectedRule}</strong>
                </div>
              </div>

              {/* Submitted Payload Preview (Dark Code Surface) */}
              <div>
                <span className="text-xs font-mono text-[#6B6580] block mb-1.5 uppercase font-semibold">
                  Simulated Agent Payload:
                </span>
                <pre className="p-3.5 rounded-xl bg-[#1d1b27] border border-[#2d2940] font-mono text-xs text-[#54d6b0] overflow-x-auto shadow-inner">
                  {JSON.stringify(
                    {
                      agentId: activeScenario.agentId,
                      toolName: activeScenario.toolName,
                      arguments: activeScenario.arguments,
                    },
                    null,
                    2
                  )}
                </pre>
              </div>

              {/* Live Backend Response Display */}
              {latestRun && latestRun.scenarioId === activeScenario.id && (
                <div className="pt-4 border-t border-[#EAE6F5] space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#292638]">Live Firewall Decision:</span>
                      <span
                        className={`text-xs font-mono font-extrabold px-2.5 py-0.5 rounded-full ${
                          latestRun.decision.decision === 'ALLOW'
                            ? 'bg-[#54D6B0]/20 text-[#0f8263] border border-[#54D6B0]/30'
                            : 'bg-[#FF786B]/20 text-[#FF786B] border border-[#FF786B]/30'
                        }`}
                      >
                        {latestRun.decision.decision}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {latestRun.matchExpected ? (
                        <span className="text-xs font-bold text-[#0f8263] flex items-center gap-1 font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Matched Expected ({activeScenario.expectedDecision})</span>
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-[#FF786B] flex items-center gap-1 font-mono">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Discrepancy</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Verdict Details Box */}
                  <div
                    className={`p-4 rounded-xl border ${
                      latestRun.decision.decision === 'ALLOW'
                        ? 'bg-[#54D6B0]/10 border-[#54D6B0]/30 text-[#0f8263]'
                        : 'bg-[#FF786B]/10 border-[#FF786B]/30 text-[#FF786B]'
                    }`}
                  >
                    <div className="text-xs font-bold leading-relaxed">
                      {latestRun.decision.reason}
                    </div>

                    <div className="mt-3 pt-3 border-t border-current/20 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] font-mono">
                      <div>
                        <span className="text-[#6B6580] block text-[10px]">EXECUTION OCCURRED</span>
                        <strong className="text-[#292638]">
                          {latestRun.decision.executionOccurred ? 'YES (SAFE MOCK)' : 'BLOCKED AT FIREWALL'}
                        </strong>
                      </div>

                      <div>
                        <span className="text-[#6B6580] block text-[10px]">RISK SCORE</span>
                        <strong className="text-[#292638]">{latestRun.decision.riskLevel}</strong>
                      </div>

                      <div>
                        <span className="text-[#6B6580] block text-[10px]">LATENCY</span>
                        <strong className="text-[#292638]">
                          {latestRun.decision.executionDurationMs || 1.4} ms
                        </strong>
                      </div>

                      <div>
                        <span className="text-[#6B6580] block text-[10px]">AUDIT EVENT</span>
                        {latestRun.decision.auditEventId && (
                          <button
                            onClick={() => onInspectEventId(latestRun.decision.auditEventId!)}
                            className="text-[#7657F6] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <FileCode2 className="w-3 h-3" />
                            <span>Inspect</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Matched Rules */}
                  <div>
                    <span className="text-[11px] font-mono text-[#6B6580] uppercase block mb-1 font-bold">
                      Matched Rules Sequence
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {latestRun.decision.matchedRules.map((rule) => (
                        <span
                          key={rule}
                          className="font-mono text-[11px] px-2 py-0.5 rounded-lg bg-[#FFF9F2] border border-[#EAE6F5] text-[#7657F6] font-bold"
                        >
                          {rule}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Execution Result if allowed */}
                  {latestRun.decision.executionResult && (
                    <div>
                      <span className="text-[11px] font-mono text-[#0f8263] uppercase block mb-1 font-bold">
                        Isolated Safe Mock Output
                      </span>
                      <pre className="p-3 rounded-xl bg-[#1d1b27] border border-[#2d2940] font-mono text-xs text-[#54d6b0] overflow-x-auto shadow-inner">
                        {JSON.stringify(latestRun.decision.executionResult, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Custom Attack Builder */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-[#EAE6F5] shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#292638]">Craft Custom Tool Call Attack</h3>
              <p className="text-xs text-[#6B6580] mt-1">
                Inject arbitrary parameters, novel traversal sequences, or payloads to test the firewall live.
              </p>
            </div>

            <div>
              <label className="text-xs font-mono text-[#6B6580] block mb-1 font-semibold">Simulated Agent ID</label>
              <input
                type="text"
                value={customAgentId}
                onChange={(e) => setCustomAgentId(e.target.value)}
                placeholder="e.g. agent-analyst-01 or rogue-agent-007"
                className="w-full px-3.5 py-2.5 bg-[#FFF9F2] border border-[#EAE6F5] rounded-xl font-mono text-xs text-[#292638] focus:outline-none focus:border-[#7657F6]"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-[#6B6580] block mb-1 font-semibold">Target Tool Name</label>
              <input
                type="text"
                value={customToolName}
                onChange={(e) => setCustomToolName(e.target.value)}
                placeholder="e.g. read_file, execute_query, http_post, arbitrary_exec_bash"
                className="w-full px-3.5 py-2.5 bg-[#FFF9F2] border border-[#EAE6F5] rounded-xl font-mono text-xs text-[#292638] focus:outline-none focus:border-[#7657F6]"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-[#6B6580] block mb-1 font-semibold">
                Tool Arguments (JSON Object)
              </label>
              <textarea
                rows={7}
                value={customArgsJson}
                onChange={(e) => setCustomArgsJson(e.target.value)}
                className="w-full p-3.5 bg-[#1d1b27] border border-[#2d2940] rounded-xl font-mono text-xs text-[#54d6b0] focus:outline-none focus:border-[#7657F6]"
              />
              {customJsonError && (
                <div className="text-xs text-[#FF786B] flex items-center gap-1 mt-1 font-mono">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{customJsonError}</span>
                </div>
              )}
            </div>

            <button
              onClick={handleExecuteCustom}
              disabled={runningId === 'custom'}
              className="w-full py-3 px-4 text-xs font-bold text-white bg-[#7657F6] hover:bg-[#6847EB] rounded-xl transition-all shadow-md shadow-[#7657F6]/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {runningId === 'custom' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Evaluating Live...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Dispatch Custom Attack to Firewall</span>
                </>
              )}
            </button>
          </div>

          {/* Custom Evaluation Result */}
          <div className="p-6 rounded-2xl bg-white border border-[#EAE6F5] shadow-sm">
            <h3 className="text-base font-bold text-[#292638] mb-2">Live Firewall Evaluation Output</h3>

            {latestRun && latestRun.scenarioId === 'custom' ? (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between pb-3 border-b border-[#EAE6F5]">
                  <span className="text-xs text-[#6B6580] font-semibold">Verdict:</span>
                  <span
                    className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      latestRun.decision.decision === 'ALLOW'
                        ? 'bg-[#54D6B0]/20 text-[#0f8263] border border-[#54D6B0]/30'
                        : 'bg-[#FF786B]/20 text-[#FF786B] border border-[#FF786B]/30'
                    }`}
                  >
                    {latestRun.decision.decision}
                  </span>
                </div>

                <div
                  className={`p-3.5 rounded-xl border text-xs font-bold ${
                    latestRun.decision.decision === 'ALLOW'
                      ? 'bg-[#54D6B0]/15 border-[#54D6B0]/30 text-[#0f8263]'
                      : 'bg-[#FF786B]/15 border-[#FF786B]/30 text-[#FF786B]'
                  }`}
                >
                  {latestRun.decision.reason}
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-[#6B6580]">
                    <span>Risk Level:</span>
                    <span className="text-[#292638] font-bold">{latestRun.decision.riskLevel}</span>
                  </div>
                  <div className="flex justify-between text-[#6B6580]">
                    <span>Execution Aborted:</span>
                    <span className="text-[#292638] font-bold">
                      {!latestRun.decision.executionOccurred ? 'YES (BLOCKED)' : 'NO (ALLOWED)'}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#6B6580]">
                    <span>Audit Event ID:</span>
                    <span className="text-[#7657F6] font-bold">
                      {latestRun.decision.auditEventId}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-mono text-[#6B6580] uppercase block mb-1 font-bold">
                    Matched Rules:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {latestRun.decision.matchedRules.map((r) => (
                      <span
                        key={r}
                        className="font-mono text-[11px] px-2 py-0.5 rounded-lg bg-[#FFF9F2] border border-[#EAE6F5] text-[#7657F6] font-bold"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => onInspectEventId(latestRun.decision.auditEventId!)}
                  className="w-full py-2.5 text-xs font-bold text-[#7657F6] hover:bg-[#7657F6]/10 bg-[#FFF9F2] rounded-xl border border-[#7657F6]/20 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileCode2 className="w-3.5 h-3.5 text-[#7657F6]" />
                  <span>Inspect Audit Event in Ledger</span>
                </button>
              </div>
            ) : (
              <div className="py-20 text-center text-[#6B6580] text-xs">
                Run a custom tool call to observe server-side firewall interception in real time.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
