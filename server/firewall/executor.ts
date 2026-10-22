/**
 * SentinelMesh Safe Tool Executor
 * Enforces strict isolation: Blocked requests NEVER reach this executor.
 * Direct bypass is strictly prohibited: Any invocation without a cryptographically
 * verified Execution Grant from the Firewall Policy Engine is rejected.
 */

import crypto from 'crypto';

// Internal execution secret held exclusively in server memory
const INTERNAL_EXECUTION_SECRET = crypto.randomBytes(32).toString('hex');

// Virtual safe sandbox filesystem (never touches the host OS)
const VIRTUAL_SANDBOX_FILES: Record<string, string> = {
  'reports/q3_summary.txt': `=== SENTINEL ENTERPRISE Q3 EXECUTIVE SUMMARY ===
Quarter: Q3 FY2026
Platform Availability: 99.98%
Total Agent Tool Invocations: 4,892,100
Threat Interceptions: 14,290 (100% blocked at firewall boundary)
Audited Compliance: SOC2 Type II, ISO 27001
Status: ALL PRODUCTION AGENT WORKLOADS NOMINAL`,

  'data/analytics_public.json': JSON.stringify(
    {
      metrics: [
        { month: 'Jul', tool_evaluations: 120500, clean_allowed: 119800, blocked_threats: 700 },
        { month: 'Aug', tool_evaluations: 145000, clean_allowed: 144120, blocked_threats: 880 },
        { month: 'Sep', tool_evaluations: 189000, clean_allowed: 187890, blocked_threats: 1110 },
      ],
      average_latency_ms: 1.84,
      firewall_fail_closed_rate: 0.0,
    },
    null,
    2
  ),

  'docs/agent_handbook.md': `# SentinelMesh Autonomous Agent Operating Handbook
1. Every tool request must supply verified agent credentials and request headers.
2. Direct access to host files, environment variables, or private keys is strictly prohibited.
3. Outbound network data egress requires explicit policy authorization and destination white-listing.
4. All tool invocations are logged to an immutable security audit event ledger.`,
};

// Safe virtual datasets for execute_query
const VIRTUAL_QUERY_TABLES: Record<string, any[]> = {
  products: [
    { id: 'prod-01', name: 'SentinelMesh Core Firewall', tier: 'Enterprise', status: 'active' },
    { id: 'prod-02', name: 'Agent Perimeter Guard', tier: 'Professional', status: 'active' },
    { id: 'prod-03', name: 'Audit Vault Storage', tier: 'Standard', status: 'active' },
  ],
  system_health: [
    { service: 'policy_evaluator', status: 'HEALTHY', latency_ms: 1.2 },
    { service: 'audit_recorder', status: 'HEALTHY', latency_ms: 2.1 },
    { service: 'path_sanitizer', status: 'HEALTHY', latency_ms: 0.4 },
  ],
};

export interface ExecutionResult {
  success: boolean;
  toolName: string;
  output: any;
  durationMs: number;
}

export interface ExecutionGrant {
  grantToken: string;
  agentId: string;
  requestId: string;
}

/**
 * Generates a signed cryptographic execution grant.
 * Only callable by the firewall policy engine upon an ALLOW decision.
 */
export function generateExecutionGrant(
  toolName: string,
  args: Record<string, any>,
  agentId: string,
  requestId: string
): ExecutionGrant {
  const window = Math.floor(Date.now() / 5000);
  const payload = `${toolName}:${agentId}:${requestId}:${JSON.stringify(args)}:${window}`;
  const grantToken = crypto
    .createHmac('sha256', INTERNAL_EXECUTION_SECRET)
    .update(payload)
    .digest('hex');

  return {
    grantToken,
    agentId,
    requestId,
  };
}

/**
 * Verifies that a tool invocation possesses an authentic execution grant
 */
export function verifyExecutionGrant(
  grant: ExecutionGrant,
  toolName: string,
  args: Record<string, any>
): boolean {
  if (!grant || !grant.grantToken) return false;
  const currentWindow = Math.floor(Date.now() / 5000);

  // Check current and previous 5s window to tolerate clock drift
  for (const w of [currentWindow, currentWindow - 1]) {
    const payload = `${toolName}:${grant.agentId}:${grant.requestId}:${JSON.stringify(args)}:${w}`;
    const expected = crypto
      .createHmac('sha256', INTERNAL_EXECUTION_SECRET)
      .update(payload)
      .digest('hex');
    if (crypto.timingSafeEqual(Buffer.from(grant.grantToken), Buffer.from(expected))) {
      return true;
    }
  }

  return false;
}

/**
 * Executes a tool ONLY IF a valid ExecutionGrant was issued by evaluateToolCall.
 * Direct execution without a grant will be strictly rejected.
 */
export async function executeSafeTool(
  toolName: string,
  args: Record<string, any>,
  grant?: ExecutionGrant
): Promise<ExecutionResult> {
  const startTime = Date.now();

  // Enforce zero-bypass verification
  if (!grant || !verifyExecutionGrant(grant, toolName, args)) {
    throw new Error(
      `DIRECT_BYPASS_REJECTED: Tool executor cannot be invoked directly. Request lacked an authentic execution grant from the SentinelMesh Firewall Policy Engine.`
    );
  }

  switch (toolName) {
    case 'read_file': {
      const requestedPath = String(args.path || '').trim();
      const content = VIRTUAL_SANDBOX_FILES[requestedPath];

      if (content === undefined) {
        throw new Error(`File not found in virtual sandbox: ${requestedPath}`);
      }

      return {
        success: true,
        toolName,
        output: {
          path: requestedPath,
          bytes: content.length,
          content,
        },
        durationMs: Date.now() - startTime,
      };
    }

    case 'calculate_metrics': {
      const metric = String(args.metric || 'metric');
      const rawValues = Array.isArray(args.values) ? args.values : [];
      const numericValues = rawValues
        .map((v: any) => Number(v))
        .filter((n: number) => !isNaN(n));

      if (numericValues.length === 0) {
        throw new Error('calculate_metrics requires at least one valid numeric value in values array');
      }

      const sum = numericValues.reduce((a: number, b: number) => a + b, 0);
      const mean = sum / numericValues.length;
      const min = Math.min(...numericValues);
      const max = Math.max(...numericValues);
      const variance =
        numericValues.reduce((acc: number, val: number) => acc + Math.pow(val - mean, 2), 0) /
        numericValues.length;
      const stdDev = Math.sqrt(variance);

      return {
        success: true,
        toolName,
        output: {
          metric,
          count: numericValues.length,
          sum,
          mean: Number(mean.toFixed(2)),
          min,
          max,
          stdDev: Number(stdDev.toFixed(2)),
        },
        durationMs: Date.now() - startTime,
      };
    }

    case 'execute_query': {
      const table = String(args.table || '').toLowerCase();
      const dataset = VIRTUAL_QUERY_TABLES[table];

      if (!dataset) {
        throw new Error(
          `Table [${table}] does not exist in safe demo database. Available tables: [products, system_health]`
        );
      }

      let results = [...dataset];
      if (args.filter && typeof args.filter === 'object') {
        const filterKeys = Object.keys(args.filter);
        results = results.filter((row) =>
          filterKeys.every((k) => String(row[k]) === String(args.filter[k]))
        );
      }

      return {
        success: true,
        toolName,
        output: {
          table,
          rowCount: results.length,
          rows: results,
        },
        durationMs: Date.now() - startTime,
      };
    }

    default:
      throw new Error(`Execution denied: tool [${toolName}] has no safe execution provider.`);
  }
}
