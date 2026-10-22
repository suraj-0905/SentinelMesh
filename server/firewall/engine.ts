/**
 * SentinelMesh Core Firewall Policy Engine
 * Real, deterministic server-side security evaluation engine for AI agent tool invocations.
 * Enforces authentication, least privilege, argument schemas, path traversal detection,
 * secret access prevention, outbound data exfiltration blocking, and fail-closed safety.
 */

import crypto from 'crypto';
import { db } from '../db.ts';
import { executeSafeTool, generateExecutionGrant } from './executor.ts';
import type {
  ToolCallRequest,
  SecurityDecision,
  AuditEvent,
  SecurityAlert,
  RiskLevel,
  SecurityPolicy,
  Tool,
  Agent,
} from '../../shared/types.ts';

// Known dangerous secret keywords and credential patterns
const SENSITIVE_PATTERNS = [
  /\.env(\..+)?$/i,
  /credentials(\.json|\.xml|\.ini)?$/i,
  /id_rsa/i,
  /id_ed25519/i,
  /passwd$/i,
  /shadow$/i,
  /htpasswd/i,
  /\.aws\/(credentials|config)/i,
  /\.ssh\//i,
  /database_url/i,
  /api[_-]?key/i,
  /secret[_-]?key/i,
  /auth_token/i,
  /bearer\s+[a-zA-Z0-9_\-\.]{16,}/i,
  /ghp_[a-zA-Z0-9]{20,}/i,
  /sk-[a-zA-Z0-9]{20,}/i,
  /AKIA[0-9A-Z]{16}/i,
];

// Dangerous commands prohibited in all arguments
const SUSPICIOUS_PAYLOAD_KEYWORDS = [
  'rm -rf',
  '/bin/sh',
  '/bin/bash',
  'cmd.exe',
  'powershell',
  'curl ',
  'wget ',
  'nc ',
  'netcat',
  'reverse_shell',
  'eval(',
  'exec(',
];

/**
 * Normalizes and decodes a file path to defeat multi-encoding bypasses (%252e%252e%252f, %2e%2e, etc.)
 */
function normalizeResourcePath(rawPath: string): {
  normalized: string;
  hasNullByte: boolean;
  hasTraversal: boolean;
  isAbsolute: boolean;
} {
  let decoded = rawPath;
  let hasNullByte = false;

  // Check for null bytes
  if (rawPath.includes('\0') || rawPath.includes('%00') || rawPath.includes('\\x00')) {
    hasNullByte = true;
  }

  // Iteratively decode up to 3 times to unwrap nested URL encoding
  for (let i = 0; i < 3; i++) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch {
      // If decoding fails, continue with current string
      break;
    }
  }

  // Replace backslashes with forward slashes
  const uniformSlashes = decoded.replace(/\\/g, '/');

  // Check traversal indicators
  const hasTraversal =
    uniformSlashes.includes('..') ||
    uniformSlashes.includes('/../') ||
    uniformSlashes.startsWith('../') ||
    uniformSlashes.endsWith('/..') ||
    uniformSlashes.includes('/..');

  // Check absolute indicators (leading slash, Windows drive letter C:\, UNC \\)
  const isAbsolute =
    uniformSlashes.startsWith('/') ||
    /^[a-zA-Z]:[\\\/]/.test(decoded) ||
    uniformSlashes.startsWith('//');

  // Clean path
  const normalized = uniformSlashes.replace(/^\/+/, '');

  return {
    normalized,
    hasNullByte,
    hasTraversal,
    isAbsolute,
  };
}

/**
 * Recursively scans arbitrary JSON objects for sensitive credential tokens or leaks
 */
function scanPayloadForLeaks(obj: any): { hasLeak: boolean; reason?: string; match?: string } {
  if (obj === null || obj === undefined) return { hasLeak: false };

  if (typeof obj === 'string') {
    for (const pattern of SENSITIVE_PATTERNS) {
      if (pattern.test(obj)) {
        return {
          hasLeak: true,
          reason: `Suspicious credential or secret pattern detected in payload`,
          match: pattern.source,
        };
      }
    }
    for (const kw of ['secret_token', 'private_key', 'bearer_token', 'aws_access_key']) {
      if (obj.toLowerCase().includes(kw)) {
        return {
          hasLeak: true,
          reason: `Disallowed sensitive keyword [${kw}] in payload`,
          match: kw,
        };
      }
    }
    return { hasLeak: false };
  }

  if (Array.isArray(obj)) {
    for (const item of obj) {
      const res = scanPayloadForLeaks(item);
      if (res.hasLeak) return res;
    }
    return { hasLeak: false };
  }

  if (typeof obj === 'object') {
    for (const [key, val] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes('secret') ||
        lowerKey.includes('token') ||
        lowerKey.includes('credential') ||
        lowerKey.includes('private_key') ||
        lowerKey.includes('api_key')
      ) {
        return {
          hasLeak: true,
          reason: `Sensitive parameter field name detected: [${key}]`,
          match: key,
        };
      }
      const valRes = scanPayloadForLeaks(val);
      if (valRes.hasLeak) return valRes;
    }
  }

  return { hasLeak: false };
}

/**
 * Evaluates an incoming tool call against the server-side firewall security policies.
 * Fail-closed: Any unexpected fault will guarantee an immediate BLOCK.
 */
export async function evaluateToolCall(request: ToolCallRequest): Promise<SecurityDecision> {
  const requestId = request.requestId || `req-${crypto.randomUUID().slice(0, 8)}`;
  const timestamp = new Date().toISOString();
  const startTime = Date.now();

  try {
    const { agentId, toolName, arguments: rawArgs } = request;
    const args = rawArgs || {};

    // ----------------------------------------------------
    // Rule 0: Gateway API Key Verification & Rate Limiting (if provided)
    // ----------------------------------------------------
    if (request.apiKey) {
      const authCheck = db.validateApiKey(request.apiKey);
      if (!authCheck.valid) {
        return recordDecision({
          decision: 'BLOCK',
          reason: `Gateway authentication failure: ${authCheck.error || 'Invalid API key'}. Access to protected tools denied.`,
          riskLevel: 'CRITICAL',
          matchedRules: ['RULE_GATEWAY_AUTH_FAILED'],
          violationType: authCheck.errorCode || 'GATEWAY_AUTH_DENIED',
          agentId: agentId || 'anonymous',
          toolName: toolName || 'unknown',
          requestId,
          timestamp,
          executionOccurred: false,
          isSimulation: !!request.isSimulation,
          evidence: { authError: authCheck.error },
          rawArgs: args,
        });
      }

      if (authCheck.apiKey?.targetAgentId !== '*' && authCheck.apiKey?.targetAgentId !== agentId) {
        return recordDecision({
          decision: 'BLOCK',
          reason: `Gateway token scope mismatch: API key [${authCheck.apiKey?.name}] is scoped exclusively to agent [${authCheck.apiKey?.targetAgentId}], cannot be used by [${agentId}].`,
          riskLevel: 'HIGH',
          matchedRules: ['RULE_GATEWAY_AUTH_FAILED', 'RULE_AGENT_TOOL_UNAUTHORIZED'],
          violationType: 'API_KEY_SCOPE_MISMATCH',
          agentId: agentId || 'anonymous',
          toolName: toolName || 'unknown',
          requestId,
          timestamp,
          executionOccurred: false,
          isSimulation: !!request.isSimulation,
          evidence: { keyTargetAgent: authCheck.apiKey?.targetAgentId, requestingAgent: agentId },
          rawArgs: args,
        });
      }

      const rateLimitCheck = db.checkRateLimit(authCheck.apiKey!.id, authCheck.apiKey!.rateLimitPerMin);
      if (!rateLimitCheck.allowed) {
        return recordDecision({
          decision: 'BLOCK',
          reason: `Gateway rate limit exceeded: API key [${authCheck.apiKey!.name}] exceeded quota of ${authCheck.apiKey!.rateLimitPerMin} req/min. Throttling active for ${rateLimitCheck.resetInSec}s.`,
          riskLevel: 'MEDIUM',
          matchedRules: ['RULE_GATEWAY_RATE_LIMIT_EXCEEDED'],
          violationType: 'RATE_LIMIT_EXCEEDED',
          agentId: agentId || 'anonymous',
          toolName: toolName || 'unknown',
          requestId,
          timestamp,
          executionOccurred: false,
          isSimulation: !!request.isSimulation,
          evidence: { resetInSec: rateLimitCheck.resetInSec, limit: authCheck.apiKey!.rateLimitPerMin },
          rawArgs: args,
        });
      }
    }

    // ----------------------------------------------------
    // Rule 1: Agent Authentication & Identity Verification
    // ----------------------------------------------------
    if (!agentId || typeof agentId !== 'string') {
      return recordDecision({
        decision: 'BLOCK',
        reason: 'Missing or malformed agentId in request.',
        riskLevel: 'HIGH',
        matchedRules: ['RULE_AGENT_UNREGISTERED'],
        violationType: 'UNKNOWN_AGENT',
        agentId: 'anonymous',
        toolName: toolName || 'unknown',
        requestId,
        timestamp,
        executionOccurred: false,
        isSimulation: !!request.isSimulation,
        rawArgs: args,
      });
    }

    const agent = db.getAgent(agentId);
    if (!agent) {
      return recordDecision({
        decision: 'BLOCK',
        reason: `Agent identity [${agentId}] is unknown and not registered in SentinelMesh registry.`,
        riskLevel: 'HIGH',
        matchedRules: ['RULE_AGENT_UNREGISTERED'],
        violationType: 'UNAUTHORIZED_AGENT',
        agentId,
        toolName,
        requestId,
        timestamp,
        executionOccurred: false,
        isSimulation: !!request.isSimulation,
        evidence: { providedAgentId: agentId },
        rawArgs: args,
      });
    }

    if (agent.status !== 'active') {
      return recordDecision({
        decision: 'BLOCK',
        reason: `Agent [${agent.name} (${agent.id})] status is ${agent.status.toUpperCase()}. Tool invocations are suspended.`,
        riskLevel: 'HIGH',
        matchedRules: ['RULE_AGENT_REVOKED'],
        violationType: 'SUSPENDED_AGENT',
        agentId,
        toolName,
        requestId,
        timestamp,
        executionOccurred: false,
        isSimulation: !!request.isSimulation,
        evidence: { agentStatus: agent.status },
        rawArgs: args,
      });
    }

    // ----------------------------------------------------
    // Rule 2: Tool Registry Verification
    // ----------------------------------------------------
    if (!toolName || typeof toolName !== 'string') {
      return recordDecision({
        decision: 'BLOCK',
        reason: 'Missing or malformed toolName parameter.',
        riskLevel: 'HIGH',
        matchedRules: ['RULE_TOOL_UNREGISTERED'],
        violationType: 'MALFORMED_TOOL_REQUEST',
        agentId,
        toolName: 'unknown',
        requestId,
        timestamp,
        executionOccurred: false,
        isSimulation: !!request.isSimulation,
        rawArgs: args,
      });
    }

    const tool = db.getTool(toolName);
    if (!tool) {
      return recordDecision({
        decision: 'BLOCK',
        reason: `Tool [${toolName}] is not registered in the SentinelMesh authorized tools registry.`,
        riskLevel: 'HIGH',
        matchedRules: ['RULE_TOOL_UNREGISTERED'],
        violationType: 'UNKNOWN_TOOL',
        agentId,
        toolName,
        requestId,
        timestamp,
        executionOccurred: false,
        isSimulation: !!request.isSimulation,
        evidence: { requestedTool: toolName },
        rawArgs: args,
      });
    }

    if (!tool.enabled) {
      return recordDecision({
        decision: 'BLOCK',
        reason: `Tool [${toolName}] is globally disabled by security administration.`,
        riskLevel: 'CRITICAL',
        matchedRules: ['RULE_TOOL_DISABLED'],
        violationType: 'DISABLED_TOOL_INVOCATION',
        agentId,
        toolName,
        requestId,
        timestamp,
        executionOccurred: false,
        isSimulation: !!request.isSimulation,
        evidence: { toolId: tool.id },
        rawArgs: args,
      });
    }

    // ----------------------------------------------------
    // Rule 3: Least Privilege & Agent Tool Authorization
    // ----------------------------------------------------
    const policy = db.getPolicyForAgent(agentId);
    if (!policy || !policy.enabled) {
      return recordDecision({
        decision: 'BLOCK',
        reason: `No active security policy assigned to agent [${agentId}]. Failing closed.`,
        riskLevel: 'CRITICAL',
        matchedRules: ['RULE_FAIL_CLOSED'],
        violationType: 'MISSING_POLICY',
        agentId,
        toolName,
        requestId,
        timestamp,
        executionOccurred: false,
        isSimulation: !!request.isSimulation,
        rawArgs: args,
      });
    }

    const isToolPermittedByAgent = agent.allowedTools.includes(toolName);
    const isToolPermittedByPolicy =
      policy.allowedTools.includes('*') || policy.allowedTools.includes(toolName);

    if (!isToolPermittedByAgent || !isToolPermittedByPolicy) {
      return recordDecision({
        decision: 'BLOCK',
        reason: `Least privilege violation: Agent [${agent.name}] does not possess authorization to invoke [${toolName}].`,
        riskLevel: 'HIGH',
        matchedRules: ['RULE_AGENT_TOOL_UNAUTHORIZED'],
        violationType: 'PRIVILEGE_VIOLATION',
        agentId,
        toolName,
        requestId,
        timestamp,
        executionOccurred: false,
        isSimulation: !!request.isSimulation,
        evidence: {
          agentAllowed: agent.allowedTools,
          policyAllowed: policy.allowedTools,
        },
        rawArgs: args,
      });
    }

    // ----------------------------------------------------
    // Rule 4: Argument Validation & Schema Enforcement
    // ----------------------------------------------------
    const argsJsonString = JSON.stringify(args);
    if (argsJsonString.length > policy.maxArgumentLength) {
      return recordDecision({
        decision: 'BLOCK',
        reason: `Argument payload size (${argsJsonString.length} bytes) exceeds policy maximum limit (${policy.maxArgumentLength} bytes).`,
        riskLevel: 'HIGH',
        matchedRules: ['RULE_INVALID_ARGUMENTS'],
        violationType: 'PAYLOAD_OVERFLOW',
        agentId,
        toolName,
        requestId,
        timestamp,
        executionOccurred: false,
        isSimulation: !!request.isSimulation,
        evidence: { payloadBytes: argsJsonString.length, maxAllowed: policy.maxArgumentLength },
        rawArgs: args,
      });
    }

    // Validate parameters against tool schema
    for (const param of tool.parameters) {
      const val = args[param.name];
      if (param.required && (val === undefined || val === null || val === '')) {
        return recordDecision({
          decision: 'BLOCK',
          reason: `Missing required argument [${param.name}] for tool [${toolName}].`,
          riskLevel: 'MEDIUM',
          matchedRules: ['RULE_INVALID_ARGUMENTS'],
          violationType: 'SCHEMA_VALIDATION_ERROR',
          agentId,
          toolName,
          requestId,
          timestamp,
          executionOccurred: false,
          isSimulation: !!request.isSimulation,
          evidence: { missingParam: param.name },
          rawArgs: args,
        });
      }

      if (val !== undefined && val !== null) {
        if (param.type === 'string' && typeof val !== 'string') {
          return recordDecision({
            decision: 'BLOCK',
            reason: `Argument [${param.name}] must be a string, received ${typeof val}.`,
            riskLevel: 'MEDIUM',
            matchedRules: ['RULE_INVALID_ARGUMENTS'],
            violationType: 'TYPE_MISMATCH',
            agentId,
            toolName,
            requestId,
            timestamp,
            executionOccurred: false,
            isSimulation: !!request.isSimulation,
            rawArgs: args,
          });
        }
        if (param.type === 'array' && !Array.isArray(val)) {
          return recordDecision({
            decision: 'BLOCK',
            reason: `Argument [${param.name}] must be an array, received ${typeof val}.`,
            riskLevel: 'MEDIUM',
            matchedRules: ['RULE_INVALID_ARGUMENTS'],
            violationType: 'TYPE_MISMATCH',
            agentId,
            toolName,
            requestId,
            timestamp,
            executionOccurred: false,
            isSimulation: !!request.isSimulation,
            rawArgs: args,
          });
        }
        if (param.maxLength && typeof val === 'string' && val.length > param.maxLength) {
          return recordDecision({
            decision: 'BLOCK',
            reason: `Argument [${param.name}] length (${val.length}) exceeds maximum limit (${param.maxLength}).`,
            riskLevel: 'MEDIUM',
            matchedRules: ['RULE_INVALID_ARGUMENTS'],
            violationType: 'PARAM_OVERFLOW',
            agentId,
            toolName,
            requestId,
            timestamp,
            executionOccurred: false,
            isSimulation: !!request.isSimulation,
            rawArgs: args,
          });
        }
      }
    }

    // Check for suspicious shell injection keywords in all string values
    for (const [k, v] of Object.entries(args)) {
      if (typeof v === 'string') {
        for (const kw of SUSPICIOUS_PAYLOAD_KEYWORDS) {
          if (v.toLowerCase().includes(kw)) {
            return recordDecision({
              decision: 'BLOCK',
              reason: `Dangerous command execution sequence detected in argument [${k}]: contains [${kw}].`,
              riskLevel: 'CRITICAL',
              matchedRules: ['RULE_INVALID_ARGUMENTS', 'RULE_INJECTION_DETECTED'],
              violationType: 'COMMAND_INJECTION_ATTEMPT',
              agentId,
              toolName,
              requestId,
              timestamp,
              executionOccurred: false,
              isSimulation: !!request.isSimulation,
              evidence: { field: k, detectedSequence: kw },
              rawArgs: args,
            });
          }
        }
      }
    }

    // ----------------------------------------------------
    // Rule 5: File System & Resource Path Inspection
    // ----------------------------------------------------
    const potentialPathFields = ['path', 'file_path', 'filename', 'source', 'target', 'dest'];
    for (const field of potentialPathFields) {
      if (args[field] && typeof args[field] === 'string') {
        const rawPath = args[field];
        const pathAnalysis = normalizeResourcePath(rawPath);

        // Null byte injection
        if (pathAnalysis.hasNullByte) {
          return recordDecision({
            decision: 'BLOCK',
            reason: `Null byte injection attempt detected in path argument [${field}].`,
            riskLevel: 'CRITICAL',
            matchedRules: ['RULE_PATH_NULL_BYTE_INJECTION'],
            violationType: 'PATH_NULL_BYTE',
            agentId,
            toolName,
            requestId,
            timestamp,
            executionOccurred: false,
            isSimulation: !!request.isSimulation,
            evidence: { raw: rawPath },
            rawArgs: args,
          });
        }

        // Directory traversal
        if (pathAnalysis.hasTraversal) {
          return recordDecision({
            decision: 'BLOCK',
            reason: `Directory traversal sequence detected in [${field}]. Path climbing (../) is strictly prohibited.`,
            riskLevel: 'CRITICAL',
            matchedRules: ['RULE_PATH_TRAVERSAL_DETECTED'],
            violationType: 'DIRECTORY_TRAVERSAL',
            agentId,
            toolName,
            requestId,
            timestamp,
            executionOccurred: false,
            isSimulation: !!request.isSimulation,
            evidence: { raw: rawPath, normalized: pathAnalysis.normalized },
            rawArgs: args,
          });
        }

        // Absolute path restriction
        if (pathAnalysis.isAbsolute) {
          return recordDecision({
            decision: 'BLOCK',
            reason: `Absolute paths are disallowed in [${field}]. All resource access must be relative to authorized sandbox.`,
            riskLevel: 'HIGH',
            matchedRules: ['RULE_PATH_ABSOLUTE_DISALLOWED'],
            violationType: 'ABSOLUTE_PATH_DISALLOWED',
            agentId,
            toolName,
            requestId,
            timestamp,
            executionOccurred: false,
            isSimulation: !!request.isSimulation,
            evidence: { raw: rawPath },
            rawArgs: args,
          });
        }

        // Sensitive resource / secret pattern detection
        for (const pattern of SENSITIVE_PATTERNS) {
          if (pattern.test(rawPath) || pattern.test(pathAnalysis.normalized)) {
            return recordDecision({
              decision: 'BLOCK',
              reason: `Access to protected secret or sensitive system resource [${rawPath}] is strictly blocked.`,
              riskLevel: 'CRITICAL',
              matchedRules: ['RULE_SENSITIVE_RESOURCE_BLOCKED'],
              violationType: 'SECRET_RESOURCE_ACCESS',
              agentId,
              toolName,
              requestId,
              timestamp,
              executionOccurred: false,
              isSimulation: !!request.isSimulation,
              evidence: { targetResource: rawPath, pattern: pattern.source },
              rawArgs: args,
            });
          }
        }

        // Check against policy blocked keywords
        for (const blockedKw of policy.blockedKeywords) {
          if (
            rawPath.toLowerCase().includes(blockedKw.toLowerCase()) ||
            pathAnalysis.normalized.toLowerCase().includes(blockedKw.toLowerCase())
          ) {
            return recordDecision({
              decision: 'BLOCK',
              reason: `Resource [${rawPath}] contains keyword [${blockedKw}] blocked by security policy [${policy.id}].`,
              riskLevel: 'CRITICAL',
              matchedRules: ['RULE_SENSITIVE_RESOURCE_BLOCKED'],
              violationType: 'BLOCKED_KEYWORD_MATCH',
              agentId,
              toolName,
              requestId,
              timestamp,
              executionOccurred: false,
              isSimulation: !!request.isSimulation,
              evidence: { keyword: blockedKw },
              rawArgs: args,
            });
          }
        }

        // Strict Resource Whitelist Validation
        // Only files explicitly approved in policy.allowedResourcePaths are permitted
        const normalized = pathAnalysis.normalized;
        const isWhitelisted = policy.allowedResourcePaths.some((approved) => {
          return approved === normalized || approved === rawPath;
        });

        if (!isWhitelisted) {
          return recordDecision({
            decision: 'BLOCK',
            reason: `Resource path [${rawPath}] is not present in policy approved whitelist [${policy.allowedResourcePaths.join(
              ', '
            )}].`,
            riskLevel: 'HIGH',
            matchedRules: ['RULE_RESOURCE_NOT_WHITELISTED'],
            violationType: 'UNAUTHORIZED_RESOURCE_PATH',
            agentId,
            toolName,
            requestId,
            timestamp,
            executionOccurred: false,
            isSimulation: !!request.isSimulation,
            evidence: {
              requested: rawPath,
              allowed: policy.allowedResourcePaths,
            },
            rawArgs: args,
          });
        }
      }
    }

    // ----------------------------------------------------
    // Rule 6: Outbound Data Transfer & Exfiltration Inspection
    // ----------------------------------------------------
    const isOutboundTool =
      tool.category === 'network' ||
      toolName.includes('http') ||
      toolName.includes('webhook') ||
      toolName.includes('email');

    if (isOutboundTool) {
      if (!policy.allowOutboundTransfer) {
        return recordDecision({
          decision: 'BLOCK',
          reason: `Outbound data transfer is disabled by default under policy [${policy.id}] for agent [${agent.name}].`,
          riskLevel: 'CRITICAL',
          matchedRules: ['RULE_OUTBOUND_TRANSFER_BLOCKED'],
          violationType: 'OUTBOUND_EGRESS_DENIED',
          agentId,
          toolName,
          requestId,
          timestamp,
          executionOccurred: false,
          isSimulation: !!request.isSimulation,
          evidence: { policyId: policy.id, toolCategory: tool.category },
          rawArgs: args,
        });
      }

      // Check destination host whitelist
      if (args.url && typeof args.url === 'string') {
        try {
          const parsedUrl = new URL(args.url);
          const isHostAllowed = policy.allowedOutboundHosts.some((h) =>
            parsedUrl.hostname.endsWith(h)
          );
          if (!isHostAllowed) {
            return recordDecision({
              decision: 'BLOCK',
              reason: `Destination host [${parsedUrl.hostname}] is not in policy allowed outbound hosts [${policy.allowedOutboundHosts.join(
                ', '
              )}].`,
              riskLevel: 'HIGH',
              matchedRules: ['RULE_OUTBOUND_TRANSFER_BLOCKED'],
              violationType: 'UNAPPROVED_OUTBOUND_HOST',
              agentId,
              toolName,
              requestId,
              timestamp,
              executionOccurred: false,
              isSimulation: !!request.isSimulation,
              evidence: { host: parsedUrl.hostname },
              rawArgs: args,
            });
          }
        } catch {
          return recordDecision({
            decision: 'BLOCK',
            reason: `Invalid outbound destination URL syntax: ${args.url}`,
            riskLevel: 'MEDIUM',
            matchedRules: ['RULE_INVALID_ARGUMENTS'],
            violationType: 'MALFORMED_URL',
            agentId,
            toolName,
            requestId,
            timestamp,
            executionOccurred: false,
            isSimulation: !!request.isSimulation,
            rawArgs: args,
          });
        }
      }

      // Deep payload leak scan for exfiltration of secrets
      const leakScan = scanPayloadForLeaks(args);
      if (leakScan.hasLeak) {
        return recordDecision({
          decision: 'BLOCK',
          reason: `Outbound data exfiltration prevention: ${leakScan.reason} (${leakScan.match}).`,
          riskLevel: 'CRITICAL',
          matchedRules: ['RULE_DATA_EXFILTRATION_PREVENTED', 'RULE_OUTBOUND_TRANSFER_BLOCKED'],
          violationType: 'DATA_EXFILTRATION',
          agentId,
          toolName,
          requestId,
          timestamp,
          executionOccurred: false,
          isSimulation: !!request.isSimulation,
          evidence: { leakMatch: leakScan.match },
          rawArgs: args,
        });
      }
    }

    // ----------------------------------------------------
    // ALL FIREWALL CHECKS PASSED -> ALLOW & SAFE EXECUTION
    // ----------------------------------------------------
    const grant = generateExecutionGrant(toolName, args, agentId, requestId);
    const executionResult = await executeSafeTool(toolName, args, grant);
    const durationMs = Date.now() - startTime;

    return recordDecision({
      decision: 'ALLOW',
      reason: `Tool call verified against policy [${policy.name}]. Identity authentic, least privilege satisfied, arguments and resources conform to whitelist.`,
      riskLevel: 'LOW',
      matchedRules: [
        'RULE_AGENT_AUTHENTICATED',
        'RULE_LEAST_PRIVILEGE_PASSED',
        'RULE_SCHEMA_VALIDATED',
        tool.category === 'filesystem' ? 'RULE_RESOURCE_WHITELISTED' : 'RULE_COMPUTATION_PERMITTED',
      ],
      agentId,
      toolName,
      requestId,
      timestamp,
      executionOccurred: true,
      executionResult: executionResult.output,
      executionDurationMs: durationMs,
      isSimulation: !!request.isSimulation,
      rawArgs: args,
    });
  } catch (err: any) {
    // ----------------------------------------------------
    // Rule 7: Fail Closed Architecture
    // ----------------------------------------------------
    console.error('[SentinelMesh Firewall] Exception during evaluation - FAILING CLOSED:', err);
    return recordDecision({
      decision: 'BLOCK',
      reason: `Internal policy engine evaluation failure: ${err?.message || 'Unknown error'}. Security firewall automatically fails closed.`,
      riskLevel: 'CRITICAL',
      matchedRules: ['RULE_FAIL_CLOSED'],
      violationType: 'INTERNAL_EVALUATION_ERROR',
      agentId: request.agentId || 'unknown',
      toolName: request.toolName || 'unknown',
      requestId,
      timestamp,
      executionOccurred: false,
      isSimulation: !!request.isSimulation,
      rawArgs: request.arguments || {},
      evidence: { error: String(err?.message || err) },
    });
  }
}

/**
 * Persists the decision to the immutable audit event log and generates alerts for severe threats
 */
function recordDecision(params: {
  decision: 'ALLOW' | 'BLOCK';
  reason: string;
  riskLevel: RiskLevel;
  matchedRules: string[];
  violationType?: string;
  agentId: string;
  toolName: string;
  requestId: string;
  timestamp: string;
  executionOccurred: boolean;
  executionResult?: any;
  executionDurationMs?: number;
  isSimulation: boolean;
  evidence?: Record<string, any>;
  rawArgs: Record<string, any>;
}): SecurityDecision {
  const eventId = `evt-${crypto.randomUUID().slice(0, 10)}`;
  const agent = db.getAgent(params.agentId);

  // Redact any ultra-long strings or accidental sensitive terms in stored audit event
  const safeArgs: Record<string, any> = {};
  for (const [k, v] of Object.entries(params.rawArgs)) {
    if (typeof v === 'string' && v.length > 512) {
      safeArgs[k] = `${v.slice(0, 512)}... [TRUNCATED]`;
    } else {
      safeArgs[k] = v;
    }
  }

  const auditEvent: AuditEvent = {
    id: eventId,
    timestamp: params.timestamp,
    requestId: params.requestId,
    agentId: params.agentId,
    agentName: agent ? agent.name : 'Unregistered Agent',
    toolName: params.toolName,
    arguments: safeArgs,
    decision: params.decision,
    reason: params.reason,
    riskLevel: params.riskLevel,
    matchedRules: params.matchedRules,
    violationType: params.violationType,
    executionOccurred: params.executionOccurred,
    executionDurationMs: params.executionDurationMs,
    isSimulation: params.isSimulation,
    evidence: params.evidence,
  };

  db.addAuditEvent(auditEvent);

  // Generate security alert for high & critical severity violations
  if (params.decision === 'BLOCK' && (params.riskLevel === 'CRITICAL' || params.riskLevel === 'HIGH')) {
    const alertId = `alt-${crypto.randomUUID().slice(0, 8)}`;
    const alert: SecurityAlert = {
      id: alertId,
      timestamp: params.timestamp,
      severity: params.riskLevel,
      title: `${params.violationType ? params.violationType.replace(/_/g, ' ') : 'Security Violation'}: [${params.toolName}]`,
      description: `Agent [${params.agentId}] attempted unauthorized action on [${params.toolName}]. ${params.reason}`,
      status: 'OPEN',
      remediation: getRemediationAdvice(params.violationType),
      affectedAgentId: params.agentId,
      relatedEventId: eventId,
      evidence: params.evidence || { matchedRules: params.matchedRules },
    };
    db.addAlert(alert);
  }

  return {
    decision: params.decision,
    reason: params.reason,
    riskLevel: params.riskLevel,
    matchedRules: params.matchedRules,
    violationType: params.violationType,
    agentId: params.agentId,
    toolName: params.toolName,
    requestId: params.requestId,
    timestamp: params.timestamp,
    executionOccurred: params.executionOccurred,
    executionResult: params.executionResult,
    executionDurationMs: params.executionDurationMs,
    evidence: params.evidence,
    auditEventId: eventId,
  };
}

function getRemediationAdvice(violationType?: string): string {
  switch (violationType) {
    case 'DIRECTORY_TRAVERSAL':
    case 'PATH_NULL_BYTE':
    case 'ABSOLUTE_PATH_DISALLOWED':
      return 'Inspect agent execution context for prompt injection. Verify caller sanitization and restrict allowedResourcePaths.';
    case 'SECRET_RESOURCE_ACCESS':
      return 'Rotate sensitive secrets or tokens immediately. Audit prompting pipeline for jailbreak vulnerabilities.';
    case 'DATA_EXFILTRATION':
    case 'OUTBOUND_EGRESS_DENIED':
      return 'Keep outbound data transfers disabled. Enforce strict destination whitelist and investigate source of credentials.';
    case 'UNAUTHORIZED_AGENT':
    case 'SUSPENDED_AGENT':
      return 'Validate API gateway token authentication. Reject rogue agent requests before they reach policy firewall.';
    case 'PRIVILEGE_VIOLATION':
      return 'Verify role requirements in Policy Center. Do not grant elevated tool capabilities without security review.';
    default:
      return 'Review matched policy rules in Policy Center. Verify inputs comply with schema constraints.';
  }
}
