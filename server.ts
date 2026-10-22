/**
 * SentinelMesh Full-Stack Express Server & Central Security Gateway
 * Serves server-side security firewall APIs, Central AI Agent Gateway,
 * Model Context Protocol (MCP) tool call proxy, and integrates Vite middleware.
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db } from './server/db.ts';
import { evaluateToolCall } from './server/firewall/engine.ts';
import { executeSafeTool } from './server/firewall/executor.ts';
import { PREDEFINED_SCENARIOS } from './server/firewall/scenarios.ts';
import { runAllFirewallTests } from './test/firewall.test.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const START_TIME = Date.now();

// Middleware
app.use(express.json({ limit: '2mb' }));

// Request logging for audit tracing
app.use((req: Request, _res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api')) {
    console.log(`[API ${req.method}] ${req.path}`);
  }
  next();
});

// Helper: Extract API key from Authorization header or body
function extractApiKey(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  const customHeader = req.headers['x-sentinelmesh-key'];
  if (customHeader && typeof customHeader === 'string') {
    return customHeader.trim();
  }
  if (req.body && typeof req.body.apiKey === 'string') {
    return req.body.apiKey.trim();
  }
  return undefined;
}

// -----------------------------------------------------------------------------
// CENTRAL SECURITY GATEWAY API ROUTES
// -----------------------------------------------------------------------------

/**
 * POST /api/gateway/v1/execute
 * Central Gateway Endpoint:
 * External AI agent clients invoke protected tools through this endpoint.
 * Authenticates client API key, enforces agent policy, executes tool ONLY IF ALLOWED,
 * and records immutable audit log.
 */
app.post('/api/gateway/v1/execute', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const apiKey = extractApiKey(req);
  const { agentId, toolName, arguments: args, requestId, clientVersion } = req.body;

  // 1. Enforce Gateway API Authentication
  if (!apiKey) {
    res.status(401).json({
      status: 'unauthorized',
      error: 'Missing SentinelMesh API Key. Pass via Bearer token or x-sentinelmesh-key header.',
      errorCode: 'UNAUTHORIZED_KEY',
      failClosed: true,
    });
    return;
  }

  const authResult = db.validateApiKey(apiKey);
  if (!authResult.valid) {
    const statusCode = authResult.errorCode === 'REVOKED_KEY' ? 403 : 401;
    res.status(statusCode).json({
      status: 'unauthorized',
      error: authResult.error,
      errorCode: authResult.errorCode,
      failClosed: true,
    });
    return;
  }

  // 2. Gateway Evaluation & Execution
  try {
    const decision = await evaluateToolCall({
      agentId,
      toolName,
      arguments: args,
      requestId,
      apiKey,
      isSimulation: false,
    });

    const isAllowed = decision.decision === 'ALLOW';
    const latencyMs = Date.now() - startTime;

    res.status(isAllowed ? 200 : 403).json({
      status: isAllowed ? 'allowed' : 'blocked',
      decision,
      execution: isAllowed ? decision.executionResult : null,
      gatewayMeta: {
        gatewayVersion: '1.2.0',
        authMethod: 'BearerToken',
        apiKeyId: authResult.apiKey!.id,
        keyName: authResult.apiKey!.name,
        latencyMs,
        auditEventId: decision.auditEventId || '',
        enforcementMode: 'FAIL_CLOSED',
        executionTokenVerified: isAllowed && decision.executionOccurred,
      },
    });
  } catch (err: any) {
    // Fail Closed
    res.status(500).json({
      status: 'error',
      error: `Gateway failure: ${err?.message || 'Internal evaluation exception'}. Failing closed.`,
      failClosed: true,
    });
  }
});

/**
 * POST /api/gateway/v1/evaluate
 * Evaluation-only gateway endpoint (for clients with local execution runtime)
 */
app.post('/api/gateway/v1/evaluate', async (req: Request, res: Response) => {
  const apiKey = extractApiKey(req);
  if (!apiKey) {
    res.status(401).json({ error: 'Missing API Key', failClosed: true });
    return;
  }

  const auth = db.validateApiKey(apiKey);
  if (!auth.valid) {
    res.status(401).json({ error: auth.error, failClosed: true });
    return;
  }

  const { agentId, toolName, arguments: args, requestId } = req.body;
  const decision = await evaluateToolCall({
    agentId,
    toolName,
    arguments: args,
    requestId,
    apiKey,
    isSimulation: false,
  });

  res.json({
    status: decision.decision.toLowerCase(),
    decision,
  });
});

/**
 * POST /api/gateway/v1/mcp
 * Model Context Protocol (MCP) JSON-RPC 2.0 Proxy Endpoint
 * Enables MCP-compliant LLM clients (Cursor, Claude Desktop, custom agents)
 * to route tool calls through SentinelMesh firewall before execution.
 */
app.post('/api/gateway/v1/mcp', async (req: Request, res: Response) => {
  const { jsonrpc, id, method, params } = req.body;

  if (jsonrpc !== '2.0' || !id) {
    res.status(400).json({
      jsonrpc: '2.0',
      id: id || null,
      error: { code: -32600, message: 'Invalid Request: Expected JSON-RPC 2.0 format' },
    });
    return;
  }

  if (method !== 'tools/call') {
    res.status(400).json({
      jsonrpc: '2.0',
      id,
      error: { code: -32601, message: `Method not found: ${method}. Supported: tools/call` },
    });
    return;
  }

  const apiKey = extractApiKey(req) || params?._meta?.apiKey;
  const agentId = params?._meta?.agentId || 'agent-analyst-01';
  const toolName = params?.name;
  const toolArgs = params?.arguments || {};

  if (!apiKey) {
    res.status(401).json({
      jsonrpc: '2.0',
      id,
      error: {
        code: -32001,
        message: 'Unauthorized: SentinelMesh API key required in header or params._meta.apiKey',
      },
    });
    return;
  }

  try {
    const decision = await evaluateToolCall({
      agentId,
      toolName,
      arguments: toolArgs,
      apiKey,
      isSimulation: false,
    });

    if (decision.decision === 'ALLOW') {
      res.json({
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text:
                typeof decision.executionResult === 'string'
                  ? decision.executionResult
                  : JSON.stringify(decision.executionResult, null, 2),
            },
          ],
          _sentinelMesh: {
            verdict: 'ALLOW',
            auditEventId: decision.auditEventId,
          },
        },
      });
    } else {
      res.status(403).json({
        jsonrpc: '2.0',
        id,
        error: {
          code: -32000,
          message: `SentinelMesh Firewall Blocked: ${decision.reason}`,
          data: {
            riskLevel: decision.riskLevel,
            matchedRules: decision.matchedRules,
            violationType: decision.violationType,
            auditEventId: decision.auditEventId,
          },
        },
      });
    }
  } catch (err: any) {
    res.status(500).json({
      jsonrpc: '2.0',
      id,
      error: {
        code: -32603,
        message: `Internal error: ${err?.message || 'Firewall exception'}. Fail closed.`,
      },
    });
  }
});

/**
 * Diagnostic Verification Endpoint: POST /api/gateway/direct-executor-probe
 * Demonstrates that direct unauthorized calls to the tool executor WITHOUT
 * an authentic execution grant from the firewall are strictly rejected!
 */
app.post('/api/gateway/direct-executor-probe', async (req: Request, res: Response) => {
  const { toolName, arguments: args } = req.body;

  try {
    // Intentionally attempt to call the executor directly without a firewall grant
    const result = await (executeSafeTool as any)(toolName || 'read_file', args || {});
    res.json({
      bypassed: true,
      error: 'CRITICAL SECURITY FAILURE: Direct execution was not rejected!',
      result,
    });
  } catch (err: any) {
    // Expected behavior: Direct execution must be rejected
    res.json({
      bypassed: false,
      rejected: true,
      reason: err?.message,
      ruleEnforced: 'RULE_DIRECT_BYPASS_REJECTED',
      details: 'Tool executor rejected unverified invocation. Only requests with cryptographic grants issued by evaluateToolCall can execute.',
    });
  }
});

/**
 * API Key Management Routes
 */
app.get('/api/gateway/keys', (_req: Request, res: Response) => {
  res.json({ keys: db.getApiKeys() });
});

app.post('/api/gateway/keys', (req: Request, res: Response) => {
  const { name, targetAgentId, rateLimitPerMin, createdBy } = req.body;
  if (!name || typeof name !== 'string') {
    res.status(400).json({ error: 'Key name is required' });
    return;
  }
  const result = db.createApiKey({
    name,
    targetAgentId: targetAgentId || '*',
    rateLimitPerMin: parseInt(rateLimitPerMin, 10) || 60,
    createdBy,
  });
  res.status(201).json(result);
});

app.delete('/api/gateway/keys/:id', (req: Request, res: Response) => {
  const revoked = db.revokeApiKey(req.params.id);
  if (!revoked) {
    res.status(404).json({ error: 'Key not found' });
    return;
  }
  res.json({ message: 'API key revoked successfully', key: revoked });
});

// -----------------------------------------------------------------------------
// USER AUTHENTICATION & PROFILE ROUTES
// -----------------------------------------------------------------------------

function extractUserToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  return undefined;
}

app.post('/api/auth/signup', (req: Request, res: Response) => {
  try {
    const { email, password, name, role, department, organization, avatarUrl } = req.body;
    if (!email || !password || !name) {
      res.status(400).json({ error: 'Email, password, and name are required' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long' });
      return;
    }
    const result = db.createUser({ email, password, name, role, department, organization, avatarUrl });
    res.status(201).json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create user account' });
  }
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }
    const result = db.authenticateUser(email, password);
    if (!result) {
      res.status(401).json({ error: 'Invalid credentials. Please verify your email and password.' });
      return;
    }
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: 'Login failure', details: err?.message });
  }
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  const token = extractUserToken(req) || req.body?.token;
  if (token) {
    db.destroySession(token);
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const token = extractUserToken(req);
  if (!token) {
    res.status(401).json({ error: 'No active session token provided' });
    return;
  }
  const user = db.verifySessionToken(token);
  if (!user) {
    res.status(401).json({ error: 'Session expired or invalid' });
    return;
  }
  res.json({ user });
});

app.put('/api/auth/profile', (req: Request, res: Response) => {
  const token = extractUserToken(req);
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  const user = db.verifySessionToken(token);
  if (!user) {
    res.status(401).json({ error: 'Invalid or expired session' });
    return;
  }
  const updated = db.updateUserProfile(user.id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ success: true, user: updated });
});

app.post('/api/auth/reset-password', (req: Request, res: Response) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    res.status(400).json({ error: 'Email and new password are required' });
    return;
  }
  const success = db.resetPassword(email, newPassword);
  if (!success) {
    res.status(404).json({ error: 'Account with specified email not found' });
    return;
  }
  res.json({ success: true, message: 'Password has been reset successfully' });
});

app.get('/api/auth/users', (_req: Request, res: Response) => {
  res.json({ users: db.getAllUsers() });
});

// -----------------------------------------------------------------------------
// OPERATIONAL API ENDPOINTS
// -----------------------------------------------------------------------------


/**
 * Health check & runtime diagnostics
 */
app.get('/api/health', (_req: Request, res: Response) => {
  const dbHealth = db.getHealth();
  const uptimeSeconds = Math.floor((Date.now() - START_TIME) / 1000);

  res.json({
    status: 'healthy',
    app: 'SentinelMesh AI Agent Security Firewall',
    version: '1.2.0',
    gatewayEnabled: true,
    uptimeSeconds,
    nodeVersion: process.version,
    memoryUsage: process.memoryUsage(),
    database: dbHealth,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Overview metrics for dashboard
 */
app.get('/api/overview', (_req: Request, res: Response) => {
  try {
    const overview = db.getOverview();
    res.json(overview);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to compute overview metrics', details: err?.message });
  }
});

/**
 * Audit events with pagination, search, and filters
 */
app.get('/api/events', (req: Request, res: Response) => {
  try {
    const search = req.query.search as string | undefined;
    const agentId = req.query.agentId as string | undefined;
    const decision = req.query.decision as string | undefined;
    const riskLevel = req.query.riskLevel as string | undefined;
    const isSimulation =
      req.query.isSimulation !== undefined
        ? req.query.isSimulation === 'true'
        : undefined;
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);

    const result = db.getAuditEvents({
      search,
      agentId,
      decision,
      riskLevel,
      isSimulation,
      page,
      limit,
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve audit events', details: err?.message });
  }
});

/**
 * Single audit event details
 */
app.get('/api/events/:id', (req: Request, res: Response) => {
  const event = db.getAuditEvent(req.params.id);
  if (!event) {
    res.status(404).json({ error: 'Audit event not found' });
    return;
  }
  res.json(event);
});

/**
 * Export audit events as downloadable JSON
 */
app.get('/api/events/export/json', (_req: Request, res: Response) => {
  const allEvents = db.getAuditEvents({ limit: 1000 }).events;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="sentinelmesh-audit-${Date.now()}.json"`);
  res.json(allEvents);
});

/**
 * Security alerts
 */
app.get('/api/alerts', (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const severity = req.query.severity as string | undefined;
    const alerts = db.getAlerts({ status, severity });
    res.json({ alerts, total: alerts.length });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch alerts', details: err?.message });
  }
});

/**
 * Update alert status
 */
app.patch(['/api/alerts/:id', '/api/alerts/:id/status'], (req: Request, res: Response) => {
  const { status } = req.body;
  if (!status || !['OPEN', 'INVESTIGATING', 'RESOLVED'].includes(status)) {
    res.status(400).json({ error: 'Invalid status. Must be OPEN, INVESTIGATING, or RESOLVED' });
    return;
  }
  const updated = db.updateAlert(req.params.id, { status });
  if (!updated) {
    res.status(404).json({ error: 'Alert not found' });
    return;
  }
  res.json({ alert: updated, ...updated });
});

/**
 * Registered agents
 */
app.get('/api/agents', (_req: Request, res: Response) => {
  res.json({ agents: db.getAgents() });
});

/**
 * Update agent status
 */
app.patch(['/api/agents/:id', '/api/agents/:id/status'], (req: Request, res: Response) => {
  const { status, trustScore } = req.body;
  const patch: any = {};
  if (status) patch.status = status;
  if (typeof trustScore === 'number') patch.trustScore = trustScore;

  const updated = db.updateAgent(req.params.id, patch);
  if (!updated) {
    res.status(404).json({ error: 'Agent not found' });
    return;
  }
  res.json({ agent: updated, ...updated });
});

/**
 * Registered tools
 */
app.get('/api/tools', (_req: Request, res: Response) => {
  res.json({ tools: db.getTools() });
});

/**
 * Security policies
 */
app.get('/api/policies', (_req: Request, res: Response) => {
  res.json({ policies: db.getPolicies() });
});

/**
 * Update policy
 */
app.put('/api/policies/:id', (req: Request, res: Response) => {
  const patch = req.body;
  if (!patch || typeof patch !== 'object') {
    res.status(400).json({ error: 'Invalid policy payload' });
    return;
  }

  if (patch.allowedResourcePaths && !Array.isArray(patch.allowedResourcePaths)) {
    res.status(400).json({ error: 'allowedResourcePaths must be an array of string paths' });
    return;
  }

  const updated = db.updatePolicy(req.params.id, patch);
  if (!updated) {
    res.status(404).json({ error: 'Policy not found' });
    return;
  }
  res.json({ policy: updated, ...updated });
});

/**
 * Reset policies to defaults
 */
app.post('/api/policies/reset', (_req: Request, res: Response) => {
  const restored = db.resetPolicies();
  res.json({ message: 'Security policies restored to default configuration', policies: restored });
});

/**
 * Direct evaluation endpoint (used by simulator)
 */
app.post('/api/tool-calls/evaluate', async (req: Request, res: Response) => {
  try {
    const { agentId, toolName, arguments: args, requestId, isSimulation, scenarioId, apiKey } = req.body;

    const decision = await evaluateToolCall({
      agentId,
      toolName,
      arguments: args,
      requestId,
      apiKey,
      isSimulation: isSimulation ?? false,
      scenarioId,
    });

    res.json(decision);
  } catch (err: any) {
    res.status(500).json({
      decision: 'BLOCK',
      reason: `Server-side evaluation crashed: ${err?.message || 'Unknown error'}. Failing closed.`,
      riskLevel: 'CRITICAL',
      matchedRules: ['RULE_FAIL_CLOSED'],
      executionOccurred: false,
    });
  }
});

/**
 * Simulator: Predefined Scenarios list
 */
app.get('/api/simulator/scenarios', (_req: Request, res: Response) => {
  res.json({ scenarios: PREDEFINED_SCENARIOS });
});

/**
 * Simulator: Run a specific scenario or custom attack
 */
app.post(['/api/simulator/run', '/api/simulator/evaluate'], async (req: Request, res: Response) => {
  try {
    const { scenarioId, agentId, toolName, arguments: args } = req.body;

    let targetAgentId = agentId;
    let targetTool = toolName;
    let targetArgs = args;
    let scenarioMeta: any = null;

    if (scenarioId) {
      const found = PREDEFINED_SCENARIOS.find((s) => s.id === scenarioId);
      if (found) {
        scenarioMeta = found;
        targetAgentId = found.agentId;
        targetTool = found.toolName;
        targetArgs = found.arguments;
      }
    }

    const decision = await evaluateToolCall({
      agentId: targetAgentId,
      toolName: targetTool,
      arguments: targetArgs,
      isSimulation: true,
      scenarioId,
    });

    const isMatchExpected = scenarioMeta
      ? decision.decision === scenarioMeta.expectedDecision
      : true;

    res.json({
      scenario: scenarioMeta,
      submittedRequest: {
        agentId: targetAgentId,
        toolName: targetTool,
        arguments: targetArgs,
      },
      decision,
      matchExpected: isMatchExpected,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Simulator run failed', details: err?.message });
  }
});

/**
 * Simulator: Run all 6 predefined scenarios in batch
 */
app.post('/api/simulator/run-all', async (_req: Request, res: Response) => {
  try {
    const results = [];
    for (const scenario of PREDEFINED_SCENARIOS) {
      const decision = await evaluateToolCall({
        agentId: scenario.agentId,
        toolName: scenario.toolName,
        arguments: scenario.arguments,
        isSimulation: true,
        scenarioId: scenario.id,
      });

      const matchedExpected = decision.decision === scenario.expectedDecision;
      results.push({
        scenario,
        decision,
        matchedExpected,
      });
    }

    const allPassed = results.every((r) => r.matchedExpected);
    res.json({
      allPassed,
      totalScenarios: PREDEFINED_SCENARIOS.length,
      passedCount: results.filter((r) => r.matchedExpected).length,
      results,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Batch simulation failed', details: err?.message });
  }
});

/**
 * Automated Test Suite Execution Endpoint
 */
app.get('/api/tests/run', async (_req: Request, res: Response) => {
  try {
    const testSuiteResult = await runAllFirewallTests();
    res.json(testSuiteResult);
  } catch (err: any) {
    res.status(500).json({ error: 'Test execution failed', details: err?.message });
  }
});

// -----------------------------------------------------------------------------
// Vite Frontend Middleware / Static Serving
// -----------------------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🛡️  SentinelMesh AI Firewall & Gateway running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[SentinelMesh Server] Failed to start server:', err);
  process.exit(1);
});
