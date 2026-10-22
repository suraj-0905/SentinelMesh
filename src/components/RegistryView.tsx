/**
 * SentinelMesh Agent & Tool Registry (Aurora Pop Theme)
 * Directory of verified AI agents, roles, assigned policies,
 * and authorized tool parameter schemas.
 */

import React, { useState } from 'react';
import {
  Users,
  Wrench,
  AlertTriangle,
} from 'lucide-react';
import type { Agent, Tool } from '../../shared/types.ts';

interface RegistryViewProps {
  agents: Agent[];
  tools: Tool[];
  loading: boolean;
  onToggleAgentStatus: (agentId: string, currentStatus: string) => Promise<void>;
}

export const RegistryView: React.FC<RegistryViewProps> = ({
  agents,
  tools,
  loading,
  onToggleAgentStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'agents' | 'tools'>('agents');
  const [updatingAgentId, setUpdatingAgentId] = useState<string | null>(null);

  const handleToggleStatus = async (agentId: string, currentStatus: string) => {
    setUpdatingAgentId(agentId);
    try {
      await onToggleAgentStatus(agentId, currentStatus);
    } finally {
      setUpdatingAgentId(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-[#6B6580]">Loading registry catalog...</div>;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE6F5]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7657F6]/10 text-[#7657F6] text-xs font-bold mb-2">
            <span>🤖</span>
            <span>Identity & Capability Directory</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#292638]">
            Agent & Tool Registry
          </h1>
          <p className="text-xs text-[#6B6580] mt-1">
            Verified identity directory for autonomous agents and authorized tool invocation schemas.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 p-1 bg-white border border-[#EAE6F5] rounded-xl text-xs shadow-sm">
          <button
            onClick={() => setActiveTab('agents')}
            className={`px-3.5 py-1.5 font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'agents'
                ? 'bg-[#7657F6] text-white shadow-sm'
                : 'text-[#6B6580] hover:text-[#292638] hover:bg-[#FFF9F2]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Registered Agents ({agents.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('tools')}
            className={`px-3.5 py-1.5 font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'tools'
                ? 'bg-[#7657F6] text-white shadow-sm'
                : 'text-[#6B6580] hover:text-[#292638] hover:bg-[#FFF9F2]'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Authorized Tools ({tools.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'agents' ? (
        /* Agent Directory Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agents.map((agent) => {
            const isActive = agent.status === 'active';
            const isUpdating = updatingAgentId === agent.id;

            return (
              <div
                key={agent.id}
                className="p-6 rounded-2xl bg-white border border-[#EAE6F5] shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-[#292638]">{agent.name}</h3>
                        <span
                          className={`font-mono text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-[#54D6B0]/20 text-[#0f8263] border border-[#54D6B0]/30'
                              : 'bg-[#FF786B]/20 text-[#FF786B] border border-[#FF786B]/30'
                          }`}
                        >
                          {agent.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-[#7657F6] font-semibold mt-0.5">{agent.id}</div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-mono text-[#6B6580] block uppercase font-bold">
                        Trust Score
                      </span>
                      <span
                        className={`text-base font-extrabold font-mono tabular-nums ${
                          agent.trustScore >= 85
                            ? 'text-[#0f8263]'
                            : agent.trustScore >= 70
                            ? 'text-[#d97706]'
                            : 'text-[#FF786B]'
                        }`}
                      >
                        {agent.trustScore}/100
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[#6B6580] mt-2.5 leading-relaxed font-medium">
                    {agent.description}
                  </p>

                  <div className="mt-4 pt-3.5 border-t border-[#EAE6F5] space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[#6B6580]">
                      <span className="font-semibold">Assigned Policy:</span>
                      <span className="font-mono text-[#292638] font-bold">
                        {agent.assignedPolicyId}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[#6B6580]">
                      <span className="font-semibold">Invocation Rate Limit:</span>
                      <span className="font-mono text-[#292638] font-bold tabular-nums">
                        {agent.rateLimitPerMin} calls/min
                      </span>
                    </div>

                    <div>
                      <span className="text-[#6B6580] block mb-1.5 text-[11px] font-semibold">
                        Permitted Tools:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {agent.allowedTools.length === 0 ? (
                          <span className="font-mono text-[11px] text-[#FF786B] font-bold">
                            Zero tools permitted (Total lockdown)
                          </span>
                        ) : (
                          agent.allowedTools.map((t) => (
                            <span
                              key={t}
                              className="font-mono text-[11px] px-2 py-0.5 rounded-lg bg-[#FFF9F2] border border-[#EAE6F5] text-[#292638] font-semibold"
                            >
                              {t}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Toggle Action */}
                <div className="mt-5 pt-3.5 border-t border-[#EAE6F5] flex items-center justify-between text-xs">
                  <span className="text-[#6B6580] font-mono text-[11px]">
                    Created {new Date(agent.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => handleToggleStatus(agent.id, agent.status)}
                    disabled={isUpdating}
                    className={`px-3.5 py-1.5 font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50 ${
                      isActive
                        ? 'bg-[#FF786B]/15 text-[#FF786B] hover:bg-[#FF786B]/25 border border-[#FF786B]/30'
                        : 'bg-[#54D6B0]/20 text-[#0f8263] hover:bg-[#54D6B0]/30 border border-[#54D6B0]/40'
                    }`}
                  >
                    {isUpdating
                      ? 'Updating...'
                      : isActive
                      ? 'Suspend Agent'
                      : 'Activate Agent'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Tool Catalog */
        <div className="space-y-4">
          {tools.map((tool) => (
            <div
              key={tool.id}
              className="p-6 rounded-2xl bg-white border border-[#EAE6F5] shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`p-2.5 rounded-xl ${
                      tool.dangerous
                        ? 'bg-[#FF786B]/15 text-[#FF786B] border border-[#FF786B]/30'
                        : 'bg-[#7657F6]/10 text-[#7657F6] border border-[#7657F6]/25'
                    }`}
                  >
                    {tool.dangerous ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : (
                      <Wrench className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-[#292638]">{tool.name}</span>
                      <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded-full bg-[#FFF9F2] text-[#6B6580] border border-[#EAE6F5] font-bold">
                        {tool.category}
                      </span>
                      {tool.dangerous && (
                        <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded-full bg-[#FF786B]/20 text-[#FF786B] font-bold border border-[#FF786B]/30">
                          HIGH RISK SENSITIVE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#6B6580] mt-1 font-medium">{tool.description}</p>
                  </div>
                </div>

                <span
                  className={`font-mono text-[11px] px-3 py-1 rounded-full font-bold self-start md:self-center ${
                    tool.enabled
                      ? 'bg-[#54D6B0]/20 text-[#0f8263] border border-[#54D6B0]/30'
                      : 'bg-[#EAE6F5] text-[#6B6580]'
                  }`}
                >
                  {tool.enabled ? 'ACTIVE IN FIREWALL' : 'DISABLED'}
                </span>
              </div>

              {/* Parameter Schema */}
              <div className="mt-4 pt-3.5 border-t border-[#EAE6F5] text-xs">
                <span className="text-[11px] font-mono text-[#6B6580] uppercase block mb-2 font-bold">
                  Parameters Schema
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {tool.parameters.map((param) => (
                    <div
                      key={param.name}
                      className="p-3 rounded-xl bg-[#FFF9F2] border border-[#EAE6F5] font-mono text-[11px]"
                    >
                      <div className="flex items-center justify-between text-[#7657F6] font-bold">
                        <span>{param.name}</span>
                        <span className="text-[10px] text-[#6B6580]">
                          {param.type}
                          {param.required ? ' (req)' : ''}
                        </span>
                      </div>
                      <p className="text-[#6B6580] text-[10px] mt-1 font-sans leading-tight">
                        {param.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
