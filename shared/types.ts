/**
 * SentinelMesh - AI Agent Security Firewall
 * Shared Type Definitions
 */

export type DecisionType = 'ALLOW' | 'BLOCK';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED';
export type AgentStatus = 'active' | 'suspended' | 'revoked';
export type KeyStatus = 'active' | 'revoked';
export type UserRole =
  | 'admin'
  | 'security_analyst'
  | 'developer'
  | 'auditor'
  | 'Security Admin'
  | 'SecOps Analyst'
  | 'AI Engineer'
  | 'Auditor';

export interface UserPreferences {
  themeAccent: 'violet' | 'coral' | 'mint' | 'yellow';
  reduceMotion?: boolean;
  reducedMotion?: boolean;
  soundAlerts?: boolean;
  enableAudioCues?: boolean;
  emailAlerts?: boolean;
  compactAuditLogs?: boolean;
  gatewayNotifications?: boolean;
}

export interface UserProfile {
  id: string;
  uid?: string;
  email: string;
  name: string;
  displayName?: string;
  photoURL?: string;
  avatarUrl: string;
  role: UserRole;
  department?: string;
  organization?: string;
  createdAt: string;
  lastLoginAt: string;
  connectedAgentsCount?: number;
  managedAgentCount?: number;
  preferences: UserPreferences;
}

export interface AuthSession {
  token: string;
  userId?: string;
  user?: UserProfile;
  createdAt?: string;
  expiresAt: string;
}

export interface ApiKey {
  id: string;
  name: string;
  keyMasked: string;
  keySecret?: string; // Only shown on creation
  keyHash: string;
  targetAgentId: string; // '*' or specific agent
  status: KeyStatus;
  rateLimitPerMin: number;
  createdAt: string;
  lastUsedAt?: string;
  createdBy: string;
}

export interface GatewayExecuteRequest {
  agentId: string;
  toolName: string;
  arguments: Record<string, any>;
  requestId?: string;
  clientVersion?: string;
  mcpCompatible?: boolean;
}

export interface GatewayExecuteResponse {
  status: 'allowed' | 'blocked' | 'unauthorized' | 'rate_limited' | 'error';
  decision: SecurityDecision;
  execution?: any;
  gatewayMeta: {
    gatewayVersion: string;
    authMethod: string;
    apiKeyId: string;
    latencyMs: number;
    auditEventId: string;
    enforcementMode: 'FAIL_CLOSED';
    executionTokenVerified: boolean;
  };
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  role: string;
  trustScore: number; // 0 to 100
  status: AgentStatus;
  allowedTools: string[];
  rateLimitPerMin: number;
  assignedPolicyId: string;
  createdAt: string;
  lastActiveAt?: string;
}

export interface ToolParameterSchema {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  maxLength?: number;
  description: string;
}

export interface Tool {
  id: string;
  name: string;
  category: 'filesystem' | 'network' | 'computation' | 'database' | 'system';
  description: string;
  dangerous: boolean;
  parameters: ToolParameterSchema[];
  enabled: boolean;
}

export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  targetAgentIds: string[]; // ['*'] for all, or specific agent IDs
  allowedTools: string[];
  allowedResourcePaths: string[]; // Whitelisted virtual paths
  allowOutboundTransfer: boolean;
  allowedOutboundHosts: string[];
  maxArgumentLength: number;
  blockedKeywords: string[];
  enforceLeastPrivilege: boolean;
  riskThreshold: RiskLevel;
  enabled: boolean;
  updatedAt: string;
}

export interface ToolCallRequest {
  agentId: string;
  toolName: string;
  arguments: Record<string, any>;
  requestId?: string;
  apiKey?: string;
  isSimulation?: boolean;
  scenarioId?: string;
}

export interface SecurityDecision {
  decision: DecisionType;
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
  evidence?: Record<string, any>;
  auditEventId?: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  requestId: string;
  agentId: string;
  agentName?: string;
  toolName: string;
  arguments: Record<string, any>;
  decision: DecisionType;
  reason: string;
  riskLevel: RiskLevel;
  matchedRules: string[];
  violationType?: string;
  executionOccurred: boolean;
  executionDurationMs?: number;
  isSimulation: boolean;
  scenarioId?: string;
  evidence?: Record<string, any>;
}

export interface SecurityAlert {
  id: string;
  timestamp: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  status: AlertStatus;
  remediation: string;
  affectedAgentId: string;
  relatedEventId?: string;
  evidence: Record<string, any>;
}

export interface SimulatorScenario {
  id: string;
  name: string;
  category: 'file_access' | 'privilege_escalation' | 'injection' | 'data_exfiltration' | 'unknown_tool';
  description: string;
  agentId: string;
  toolName: string;
  arguments: Record<string, any>;
  expectedDecision: DecisionType;
  expectedRule: string;
  explanation: string;
}

export interface DailyRiskPoint {
  date: string; // e.g. "Oct 16"
  day: string; // e.g. "Thu" or "Day 1"
  timestamp: string; // ISO string
  riskScore: number; // Aggregate risk score (0-100)
  blockedCalls: number;
  allowedCalls: number;
  totalCalls: number;
  blockRatePercentage: number;
}

export interface SystemOverview {
  totalCalls: number;
  allowedCalls: number;
  blockedCalls: number;
  blockRatePercentage: number;
  activeAlerts: number;
  averageRiskScore: number;
  ruleBreakdown: { rule: string; count: number; name: string }[];
  hourlyActivity: { hour: string; allowed: number; blocked: number }[];
  dailyRiskTrend: DailyRiskPoint[];
  recentIncidents: AuditEvent[];
}

export interface DatabaseHealth {
  connected: boolean;
  storageEngine: 'FileBackedPersistentStore' | 'Firestore';
  persistenceVerified: boolean;
  storagePath: string;
  totalRecords: {
    agents: number;
    tools: number;
    policies: number;
    events: number;
    alerts: number;
  };
  firestoreConfigured: boolean;
  firestoreNotes?: string;
}

export interface TestResultItem {
  id: string;
  name: string;
  category: string;
  expected: DecisionType;
  actual: DecisionType;
  expectedRule?: string;
  passed: boolean;
  details: string;
  durationMs: number;
}

export interface TestSuiteResult {
  total: number;
  passed: number;
  failed: number;
  allPassed: boolean;
  executedAt: string;
  results: TestResultItem[];
}


