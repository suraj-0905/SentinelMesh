/**
 * SentinelMesh Developer Gateway & SDK Portal (Aurora Pop Theme)
 * Connect external AI agents via Central Gateway API, manage API keys,
 * view curl / Node / Python / MCP snippets, and run direct zero-bypass diagnostics.
 */

import React, { useState } from 'react';
import {
  Key,
  Shield,
  Send,
  Copy,
  Check,
  Plus,
  AlertTriangle,
  FileCode2,
  Terminal,
  Layers,
  RefreshCw,
  Lock,
} from 'lucide-react';
import type { ApiKey, Agent, Tool } from '../../shared/types.ts';

interface DeveloperPortalViewProps {
  apiKeys: ApiKey[];
  agents: Agent[];
  tools: Tool[];
  loading: boolean;
  onCreateKey: (params: {
    name: string;
    targetAgentId: string;
    rateLimitPerMin: number;
  }) => Promise<{ apiKey: ApiKey; rawSecretKey: string }>;
  onRevokeKey: (keyId: string) => Promise<void>;
  onInspectEventId: (eventId: string) => void;
}

export const DeveloperPortalView: React.FC<DeveloperPortalViewProps> = ({
  apiKeys,
  agents,
  tools,
  loading,
  onCreateKey,
  onRevokeKey,
  onInspectEventId,
}) => {
  const [docTab, setDocTab] = useState<'curl' | 'node' | 'python' | 'mcp'>('curl');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // New key modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyAgent, setNewKeyAgent] = useState('*');
  const [newKeyRateLimit, setNewKeyRateLimit] = useState(60);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [isCreatingKey, setIsCreatingKey] = useState(false);

  // Simulated Client Bench
  const [selectedApiKey, setSelectedApiKey] = useState<string>(
    apiKeys.find((k) => k.status === 'active')?.keyMasked || ''
  );
  const [simAgentId, setSimAgentId] = useState<string>('agent-analyst-01');
  const [simToolName, setSimToolName] = useState<string>('read_file');
  const [simArgsJson, setSimArgsJson] = useState<string>(
    JSON.stringify({ path: 'reports/q3_summary.txt' }, null, 2)
  );
  const [simResult, setSimResult] = useState<any | null>(null);
  const [isSimSending, setIsSimSending] = useState(false);

  // Direct bypass test bench
  const [bypassResult, setBypassResult] = useState<any | null>(null);
  const [isTestingBypass, setIsTestingBypass] = useState(false);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCreateKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setIsCreatingKey(true);
    try {
      const res = await onCreateKey({
        name: newKeyName,
        targetAgentId: newKeyAgent,
        rateLimitPerMin: newKeyRateLimit,
      });
      setCreatedSecret(res.rawSecretKey);
      setNewKeyName('');
    } finally {
      setIsCreatingKey(false);
    }
  };

  const handleRunClientTest = async () => {
    setIsSimSending(true);
    setSimResult(null);

    let parsedArgs = {};
    try {
      parsedArgs = JSON.parse(simArgsJson);
    } catch (e: any) {
      setSimResult({
        status: 'error',
        error: `Invalid JSON arguments: ${e.message}`,
      });
      setIsSimSending(false);
      return;
    }

    try {
      let keyToUse = selectedApiKey;
      if (selectedApiKey.includes('c8f9') || selectedApiKey.includes('analyst')) {
        keyToUse = 'sm_live_analyst_c8f921a4e10b';
      } else if (selectedApiKey.includes('7e11') || selectedApiKey.includes('finance')) {
        keyToUse = 'sm_live_finance_7e11b4a9f032';
      } else if (selectedApiKey.includes('0000') || selectedApiKey.includes('revoked')) {
        keyToUse = 'sm_live_revoked_key_00000000';
      }

      const res = await fetch('/api/gateway/v1/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${keyToUse}`,
        },
        body: JSON.stringify({
          agentId: simAgentId,
          toolName: simToolName,
          arguments: parsedArgs,
          clientVersion: 'sentinelmesh-sdk-js/1.2.0',
        }),
      });

      const data = await res.json();
      setSimResult({
        httpStatus: res.status,
        ...data,
      });
    } catch (err: any) {
      setSimResult({
        status: 'network_failure',
        error: `Could not reach SentinelMesh Gateway: ${err.message}. Fail-closed protocol engaged.`,
      });
    } finally {
      setIsSimSending(false);
    }
  };

  const handleTestDirectBypass = async () => {
    setIsTestingBypass(true);
    try {
      const res = await fetch('/api/gateway/direct-executor-probe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolName: 'read_file',
          arguments: { path: 'reports/q3_summary.txt' },
        }),
      });
      const data = await res.json();
      setBypassResult(data);
    } catch (err: any) {
      setBypassResult({ error: err.message });
    } finally {
      setIsTestingBypass(false);
    }
  };

  const codeSnippets = {
    curl: `curl -X POST https://your-domain.com/api/gateway/v1/execute \\
  -H "Authorization: Bearer sm_live_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agentId": "agent-analyst-01",
    "toolName": "read_file",
    "arguments": {
      "path": "reports/q3_summary.txt"
    }
  }'`,

    node: `import { SentinelMeshGateway } from '@sentinelmesh/sdk';

// Initialize gateway with automatic fail-closed security
const sentinel = new SentinelMeshGateway({
  apiKey: process.env.SENTINELMESH_API_KEY,
  endpoint: 'https://your-domain.com/api/gateway/v1',
  failClosed: true // Blocks tool execution if firewall is unreachable
});

// Protect tool calls inside your agent loop
async function runAgentTool(agentId, toolName, args) {
  const result = await sentinel.execute({
    agentId,
    toolName,
    arguments: args
  });

  if (result.status === 'blocked') {
    console.error('Firewall Blocked:', result.decision.reason);
    throw new SecurityException(result.decision.reason);
  }

  return result.execution;
}`,

    python: `import os
import requests

SENTINEL_ENDPOINT = "https://your-domain.com/api/gateway/v1/execute"
API_KEY = os.environ.get("SENTINELMESH_API_KEY")

def execute_protected_tool(agent_id: str, tool_name: str, arguments: dict):
    """Invokes tools strictly through SentinelMesh Central Security Gateway."""
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "agentId": agent_id,
        "toolName": tool_name,
        "arguments": arguments
    }
    
    try:
        response = requests.post(SENTINEL_ENDPOINT, json=payload, headers=headers, timeout=5)
        data = response.json()
        
        if response.status_code == 200 and data.get("status") == "allowed":
            return data.get("execution")
        else:
            reason = data.get("decision", {}).get("reason", "Action blocked by security policy")
            raise PermissionError(f"SentinelMesh Blocked: {reason}")
            
    except requests.exceptions.RequestException as e:
        # FAIL-CLOSED: Deny execution if gateway is unreachable
        raise RuntimeError("SentinelMesh firewall unreachable. Failing closed.") from e`,

    mcp: `{
  "mcpServers": {
    "sentinelmesh-proxy": {
      "endpoint": "https://your-domain.com/api/gateway/v1/mcp",
      "headers": {
        "Authorization": "Bearer sm_live_YOUR_API_KEY"
      },
      "agentId": "agent-analyst-01",
      "mode": "firewall-gatekeeper"
    }
  }
}`,
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE6F5]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7657F6]/10 text-[#7657F6] text-xs font-bold mb-2">
            <span>📡</span>
            <span>Central Agent Security Gateway</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#292638]">
            Developer Gateway & SDK
          </h1>
          <p className="text-xs text-[#6B6580] mt-1">
            Connect autonomous AI agents, LangChain apps, and MCP clients to SentinelMesh for automated, background runtime security.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 text-xs font-bold text-white bg-[#7657F6] hover:bg-[#6847EB] rounded-xl shadow-md shadow-[#7657F6]/25 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Generate Gateway API Key</span>
        </button>
      </div>

      {/* Gateway Architecture Flowchart */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#EAE6F5] shadow-sm space-y-5">
        <h2 className="text-sm font-bold text-[#292638] flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#7657F6]" />
          <span>Central Gateway Execution Flow</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 text-xs font-mono">
          <div className="p-4 rounded-xl bg-[#FFF9F2] border border-[#EAE6F5] space-y-1">
            <span className="text-[#7657F6] font-bold block text-[10px]">STEP 01</span>
            <div className="font-bold text-[#292638] font-sans text-xs">AI Agent Application</div>
            <p className="text-[#6B6580] text-[11px] font-sans font-medium">
              Agent decides on a tool call and sends request to <code className="text-[#7657F6]">/api/gateway/v1/execute</code>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#FFF9F2] border border-[#EAE6F5] space-y-1">
            <span className="text-[#7657F6] font-bold block text-[10px]">STEP 02</span>
            <div className="font-bold text-[#292638] font-sans text-xs">Perimeter Authentication</div>
            <p className="text-[#6B6580] text-[11px] font-sans font-medium">
              Gateway authenticates API key, checks agent scope, and verifies sliding rate limits.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#FFF9F2] border border-[#EAE6F5] space-y-1">
            <span className="text-[#7657F6] font-bold block text-[10px]">STEP 03</span>
            <div className="font-bold text-[#292638] font-sans text-xs">Firewall Policy Check</div>
            <p className="text-[#6B6580] text-[11px] font-sans font-medium">
              Server inspects traversal, secrets, and whitelists. Issues cryptographic execution grant.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#FFF9F2] border border-[#EAE6F5] space-y-1">
            <span className="text-[#7657F6] font-bold block text-[10px]">STEP 04</span>
            <div className="font-bold text-[#292638] font-sans text-xs">Execution & Audit</div>
            <p className="text-[#6B6580] text-[11px] font-sans font-medium">
              If ALLOW: Executes safe tool sandbox. If BLOCK: Aborts before executor. Records audit log.
            </p>
          </div>
        </div>

        <div className="text-[11px] text-[#6B6580] pt-1 flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-[#7657F6]" />
          <span>
            <strong>Zero-Bypass Enforcement:</strong> The tool executor strictly denies unverified direct calls. Every execution requires an authentic cryptographic grant.
          </span>
        </div>
      </div>

      {/* API Key Management Table */}
      <div className="rounded-2xl bg-white border border-[#EAE6F5] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#EAE6F5] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#292638]">Gateway API Keys</h2>
            <p className="text-xs text-[#6B6580] mt-0.5">
              Credentials used by autonomous agents to authenticate against the SentinelMesh Gateway.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-[#7657F6]">{apiKeys.length} Registered Keys</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#FFF9F2] text-[#6B6580] uppercase text-[10px] border-b border-[#EAE6F5]">
              <tr>
                <th className="px-6 py-3.5">Key Name & ID</th>
                <th className="px-4 py-3.5">Masked Secret</th>
                <th className="px-4 py-3.5">Scoped Agent</th>
                <th className="px-4 py-3.5">Quota</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE6F5] font-sans">
              {apiKeys.map((key) => {
                const isActive = key.status === 'active';
                return (
                  <tr key={key.id} className="hover:bg-[#FFF9F2] transition-colors">
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <div className="font-bold text-[#292638]">{key.name}</div>
                      <div className="font-mono text-[10px] text-[#6B6580]">{key.id}</div>
                    </td>

                    <td className="px-4 py-3.5 font-mono text-[#7657F6] font-semibold whitespace-nowrap text-xs">
                      {key.keyMasked}
                    </td>

                    <td className="px-4 py-3.5 font-mono text-[#292638] whitespace-nowrap">
                      {key.targetAgentId}
                    </td>

                    <td className="px-4 py-3.5 font-mono text-[#6B6580] whitespace-nowrap tabular-nums">
                      {key.rateLimitPerMin} req/min
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-[#54D6B0]/20 text-[#0f8263] border border-[#54D6B0]/30'
                            : 'bg-[#FF786B]/20 text-[#FF786B] border border-[#FF786B]/30'
                        }`}
                      >
                        {key.status.toUpperCase()}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      {isActive ? (
                        <button
                          onClick={() => onRevokeKey(key.id)}
                          className="px-2.5 py-1 text-xs font-bold text-[#FF786B] hover:bg-[#FF786B]/15 border border-[#FF786B]/30 rounded-lg transition-colors cursor-pointer"
                        >
                          Revoke Key
                        </button>
                      ) : (
                        <span className="text-[#6B6580] text-[11px] font-mono">Revoked</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Integration Documentation & SDK Snippets */}
      <div className="rounded-2xl bg-white border border-[#EAE6F5] p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EAE6F5]">
          <div>
            <h2 className="text-base font-bold text-[#292638]">SDK & Gateway Documentation</h2>
            <p className="text-xs text-[#6B6580] mt-0.5">
              Code examples for integrating SentinelMesh into agent runtimes.
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-[#FFF9F2] border border-[#EAE6F5] rounded-xl text-xs font-mono">
            {(['curl', 'node', 'python', 'mcp'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setDocTab(tab)}
                className={`px-3 py-1.5 rounded-lg transition-all uppercase cursor-pointer ${
                  docTab === tab
                    ? 'bg-[#7657F6] text-white font-bold shadow-sm'
                    : 'text-[#6B6580] hover:text-[#292638]'
                }`}
              >
                {tab === 'mcp' ? 'Model Context Protocol (MCP)' : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Dark Code Surface specifically for syntax code blocks */}
        <div className="relative">
          <pre className="p-4 rounded-2xl bg-[#1d1b27] border border-[#2d2940] text-xs font-mono text-[#54d6b0] overflow-x-auto leading-relaxed shadow-inner">
            {codeSnippets[docTab]}
          </pre>
          <button
            onClick={() => copyToClipboard(codeSnippets[docTab], docTab)}
            className="absolute top-3 right-3 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Copy code snippet"
          >
            {copiedCode === docTab ? (
              <Check className="w-4 h-4 text-[#54D6B0]" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>

        {docTab === 'mcp' && (
          <div className="p-4 rounded-xl bg-[#7657F6]/10 border border-[#7657F6]/25 text-xs space-y-1 text-[#292638]">
            <div className="flex items-center gap-2 text-[#7657F6] font-bold font-mono text-[11px]">
              <span className="px-2 py-0.5 rounded-full bg-[#54D6B0]/20 text-[#0f8263]">IMPLEMENTED</span>
              <span>Model Context Protocol Proxy Active: POST /api/gateway/v1/mcp</span>
            </div>
            <p className="text-[#6B6580] text-xs">
              The SentinelMesh server provides native JSON-RPC 2.0 <code className="text-[#7657F6] font-bold">tools/call</code> evaluation and execution proxying. LLM agents configured with this endpoint automatically pass all tool invocations through the firewall before reaching tool backends.
            </p>
          </div>
        )}
      </div>

      {/* Two Column Section: Live Simulated External AI App Client & Direct Bypass Probe */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Simulated External AI App Client */}
        <div className="p-6 rounded-2xl bg-white border border-[#EAE6F5] shadow-sm space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#7657F6]" />
              <h2 className="text-base font-bold text-[#292638]">Simulated External AI App Client</h2>
            </div>
            <p className="text-xs text-[#6B6580] mt-1">
              Simulates a remote AI agent communicating with SentinelMesh over HTTP using an API key.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-mono text-[#6B6580] block mb-1 font-semibold">
                Client API Key:
              </label>
              <select
                value={selectedApiKey}
                onChange={(e) => setSelectedApiKey(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FFF9F2] border border-[#EAE6F5] rounded-xl font-mono text-xs text-[#292638] focus:outline-none focus:border-[#7657F6] cursor-pointer"
              >
                {apiKeys.map((k) => (
                  <option key={k.id} value={k.keyMasked}>
                    {k.name} ({k.keyMasked}) - {k.status.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-mono text-[#6B6580] block mb-1 font-semibold">Agent ID:</label>
                <select
                  value={simAgentId}
                  onChange={(e) => setSimAgentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FFF9F2] border border-[#EAE6F5] rounded-xl font-mono text-xs text-[#292638] focus:outline-none focus:border-[#7657F6] cursor-pointer"
                >
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.id})
                    </option>
                  ))}
                  <option value="rogue-agent-x">rogue-agent-x (Unregistered)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono text-[#6B6580] block mb-1 font-semibold">Tool:</label>
                <select
                  value={simToolName}
                  onChange={(e) => setSimToolName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FFF9F2] border border-[#EAE6F5] rounded-xl font-mono text-xs text-[#292638] focus:outline-none focus:border-[#7657F6] cursor-pointer"
                >
                  {tools.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-mono text-[#6B6580] font-semibold">Arguments (JSON):</label>
                <div className="flex gap-2 text-[10px] font-mono font-bold">
                  <button
                    onClick={() =>
                      setSimArgsJson(JSON.stringify({ path: 'reports/q3_summary.txt' }, null, 2))
                    }
                    className="text-[#7657F6] hover:underline cursor-pointer"
                  >
                    Load Safe
                  </button>
                  <span>·</span>
                  <button
                    onClick={() =>
                      setSimArgsJson(JSON.stringify({ path: '../../etc/passwd' }, null, 2))
                    }
                    className="hover:underline text-[#FF786B] cursor-pointer"
                  >
                    Load Traversal
                  </button>
                  <span>·</span>
                  <button
                    onClick={() =>
                      setSimArgsJson(JSON.stringify({ path: 'secrets/.env' }, null, 2))
                    }
                    className="hover:underline text-[#FF786B] cursor-pointer"
                  >
                    Load Secret
                  </button>
                </div>
              </div>
              <textarea
                rows={4}
                value={simArgsJson}
                onChange={(e) => setSimArgsJson(e.target.value)}
                className="w-full p-3 bg-[#1d1b27] border border-[#2d2940] rounded-xl font-mono text-xs text-[#54d6b0] focus:outline-none focus:border-[#7657F6]"
              />
            </div>

            <button
              onClick={handleRunClientTest}
              disabled={isSimSending}
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-[#7657F6] hover:bg-[#6847EB] rounded-xl transition-all shadow-md shadow-[#7657F6]/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSimSending ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Dispatching to Gateway...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Dispatch via Central Gateway</span>
                </>
              )}
            </button>
          </div>

          {/* Response Inspector */}
          {simResult && (
            <div className="pt-3 border-t border-[#EAE6F5] space-y-2 animate-fadeIn text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-[#6B6580]">Gateway Status:</span>
                <span
                  className={`font-bold px-2.5 py-0.5 rounded-full text-[11px] ${
                    simResult.status === 'allowed'
                      ? 'bg-[#54D6B0]/20 text-[#0f8263] border border-[#54D6B0]/30'
                      : 'bg-[#FF786B]/20 text-[#FF786B] border border-[#FF786B]/30'
                  }`}
                >
                  {simResult.status?.toUpperCase()} (HTTP {simResult.httpStatus || 200})
                </span>
              </div>

              {simResult.decision && (
                <div className="p-3.5 rounded-xl bg-[#FFF9F2] border border-[#EAE6F5] text-[#292638] font-sans leading-relaxed text-[11px] font-semibold">
                  <strong>Firewall Verdict:</strong> {simResult.decision.reason}
                </div>
              )}

              {simResult.decision?.auditEventId && (
                <button
                  onClick={() => onInspectEventId(simResult.decision.auditEventId)}
                  className="text-[#7657F6] font-bold hover:underline flex items-center gap-1 text-[11px] cursor-pointer"
                >
                  <FileCode2 className="w-3 h-3" />
                  <span>View Recorded Audit Event in Ledger</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Direct Tool Bypass Diagnostic Bench */}
        <div className="p-6 rounded-2xl bg-white border border-[#EAE6F5] shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#7657F6]" />
              <h2 className="text-base font-bold text-[#292638]">Direct Bypass Rejection Diagnostic</h2>
            </div>
            <p className="text-xs text-[#6B6580]">
              Verifies that the backend tool executor rejects direct unauthorized invocations that attempt to bypass the SentinelMesh policy firewall.
            </p>

            <div className="p-4 rounded-xl bg-[#FFF9F2] border border-[#EAE6F5] space-y-3 text-xs">
              <div className="flex items-center gap-2 text-[#7657F6] font-mono text-[11px] font-bold">
                <Lock className="w-3.5 h-3.5" />
                <span>Zero-Bypass Cryptographic Grant Protocol</span>
              </div>
              <p className="text-[#6B6580] text-[11px] leading-relaxed">
                SentinelMesh generates a one-time cryptographic Execution Grant signed with an internal server secret only when a tool call is evaluated and determined to be <code className="text-[#0f8263] font-bold">ALLOW</code>.
                Any attempt by an external party to call the tool executor directly is immediately rejected.
              </p>

              <button
                onClick={handleTestDirectBypass}
                disabled={isTestingBypass}
                className="w-full py-2.5 px-3 text-xs font-bold text-[#292638] bg-white hover:bg-[#FFF9F2] border border-[#EAE6F5] rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isTestingBypass ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#7657F6]" />
                    <span>Testing Direct Bypass...</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-[#d97706]" />
                    <span>Probe Direct Tool Executor Bypass</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {bypassResult && (
            <div className="p-4 rounded-xl border bg-[#FFF9F2] text-xs font-mono space-y-2 border-[#EAE6F5] animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-[#6B6580]">Bypass Attempt Result:</span>
                <span
                  className={`font-bold px-2.5 py-0.5 rounded-full text-[11px] ${
                    bypassResult.rejected
                      ? 'bg-[#54D6B0]/20 text-[#0f8263] border border-[#54D6B0]/30'
                      : 'bg-[#FF786B]/20 text-[#FF786B] border border-[#FF786B]/30'
                  }`}
                >
                  {bypassResult.rejected ? 'BYPASS REJECTED (SECURE)' : 'CRITICAL FAILURE'}
                </span>
              </div>

              <div className="text-[11px] text-[#292638] font-sans font-bold">
                {bypassResult.details}
              </div>

              <div className="text-[10px] text-[#6B6580] break-all">
                Reason: {bypassResult.reason}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Generate API Key */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#292638]/50 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white border border-[#EAE6F5] rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#EAE6F5]">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-[#7657F6]" />
                <h3 className="text-base font-bold text-[#292638]">Generate Gateway API Key</h3>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreatedSecret(null);
                }}
                className="text-[#6B6580] hover:text-[#292638] text-xs font-bold"
              >
                Close
              </button>
            </div>

            {!createdSecret ? (
              <form onSubmit={handleCreateKeySubmit} className="space-y-4 text-xs">
                <div>
                  <label className="text-[#292638] font-bold block mb-1">Key Name / Description</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Production LangChain Copilot"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FFF9F2] border border-[#EAE6F5] rounded-xl text-[#292638] text-xs focus:outline-none focus:border-[#7657F6]"
                  />
                </div>

                <div>
                  <label className="text-[#292638] font-bold block mb-1">
                    Scoped Agent Identity (Least Privilege)
                  </label>
                  <select
                    value={newKeyAgent}
                    onChange={(e) => setNewKeyAgent(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FFF9F2] border border-[#EAE6F5] rounded-xl text-[#292638] text-xs focus:outline-none focus:border-[#7657F6] cursor-pointer"
                  >
                    <option value="*">* (All Registered Agents)</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[#292638] font-bold block mb-1">
                    Rate Limit (requests per minute)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={newKeyRateLimit}
                    onChange={(e) => setNewKeyRateLimit(parseInt(e.target.value) || 60)}
                    className="w-full px-3.5 py-2.5 bg-[#FFF9F2] border border-[#EAE6F5] rounded-xl text-[#292638] text-xs focus:outline-none focus:border-[#7657F6]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-3.5 py-2 text-xs font-bold text-[#6B6580] hover:text-[#292638] rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingKey}
                    className="px-4 py-2 text-xs font-bold text-white bg-[#7657F6] hover:bg-[#6847EB] rounded-xl transition-all shadow-md disabled:opacity-50"
                  >
                    {isCreatingKey ? 'Generating...' : 'Create Key'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-xs animate-fadeIn">
                <div className="p-4 rounded-xl bg-[#54D6B0]/15 border border-[#54D6B0]/30 text-[#0f8263]">
                  <span className="font-bold block mb-1">API Key Generated Successfully!</span>
                  <p className="text-[11px] text-[#6B6580]">
                    Copy this key now. It will not be shown again in plain text.
                  </p>
                </div>

                <div className="relative">
                  <pre className="p-3.5 rounded-xl bg-[#1d1b27] border border-[#2d2940] font-mono text-xs text-[#54d6b0] break-all">
                    {createdSecret}
                  </pre>
                  <button
                    onClick={() => copyToClipboard(createdSecret, 'secret')}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  >
                    {copiedCode === 'secret' ? (
                      <Check className="w-4 h-4 text-[#54D6B0]" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setCreatedSecret(null);
                    }}
                    className="px-4 py-2 text-xs font-bold text-white bg-[#7657F6] hover:bg-[#6847EB] rounded-xl transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
