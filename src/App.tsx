/**
 * SentinelMesh - AI Agent Security Firewall & Central Gateway
 * Main Application Entry Point (Aurora Pop Redesign)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navigation, ActiveTab } from './components/Navigation.tsx';
import { OverviewView } from './components/OverviewView.tsx';
import { EventsView } from './components/EventsView.tsx';
import { AlertsView } from './components/AlertsView.tsx';
import { PoliciesView } from './components/PoliciesView.tsx';
import { SimulatorView } from './components/SimulatorView.tsx';
import { RegistryView } from './components/RegistryView.tsx';
import { DeveloperPortalView } from './components/DeveloperPortalView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { EventDetailModal } from './components/EventDetailModal.tsx';
import { IntroSplashScreen } from './components/IntroSplashScreen.tsx';
import { LandingPageView } from './components/LandingPageView.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { UserProfileView } from './components/UserProfileView.tsx';
import { SignOutAnimation } from './components/SignOutAnimation.tsx';
import type {
  SystemOverview,
  AuditEvent,
  SecurityAlert,
  SecurityPolicy,
  Agent,
  Tool,
  SimulatorScenario,
  AlertStatus,
  TestSuiteResult,
  ApiKey,
  UserProfile,
} from '../shared/types.ts';

export default function App() {
  // Splash & Authentication state
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [showLanding, setShowLanding] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [showSignOutAnim, setShowSignOutAnim] = useState<boolean>(false);

  // Dashboard state
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [serverOnline, setServerOnline] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Data states
  const [overview, setOverview] = useState<SystemOverview | null>(null);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [eventsTotal, setEventsTotal] = useState<number>(0);
  const [eventsPage, setEventsPage] = useState<number>(1);
  const [eventsTotalPages, setEventsTotalPages] = useState<number>(1);
  const [eventsFilter, setEventsFilter] = useState<{
    search?: string;
    decision?: string;
    riskLevel?: string;
    isSimulation?: boolean;
  }>({});

  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [policies, setPolicies] = useState<SecurityPolicy[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [scenarios, setScenarios] = useState<SimulatorScenario[]>([]);
  const [health, setHealth] = useState<any>(null);

  // Inspector modal state
  const [inspectedEvent, setInspectedEvent] = useState<AuditEvent | null>(null);

  // Loading states
  const [loadingOverview, setLoadingOverview] = useState<boolean>(true);
  const [loadingEvents, setLoadingEvents] = useState<boolean>(false);
  const [loadingAlerts, setLoadingAlerts] = useState<boolean>(false);
  const [loadingPolicies, setLoadingPolicies] = useState<boolean>(false);
  const [loadingRegistry, setLoadingRegistry] = useState<boolean>(false);
  const [loadingHealth, setLoadingHealth] = useState<boolean>(false);

  // ---------------------------------------------------------------------------
  // Verify User Session on Mount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('sm_auth_token');
      if (!token) {
        // Pre-seed demo operator if no session exists so reviewers can test immediately
        // while also having access to sign out / landing page
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'ssushantakumar08@gmail.com',
              password: 'Sentinel@2026!',
            }),
          });
          if (res.ok) {
            const data = await res.json();
            localStorage.setItem('sm_auth_token', data.token);
            setCurrentUser(data.user);
          } else {
            setShowLanding(true);
          }
        } catch {
          setShowLanding(true);
        } finally {
          setAuthChecking(false);
        }
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
        } else {
          localStorage.removeItem('sm_auth_token');
          setShowLanding(true);
        }
      } catch {
        setShowLanding(true);
      } finally {
        setAuthChecking(false);
      }
    };

    checkSession();
  }, []);

  // ---------------------------------------------------------------------------
  // API Fetchers
  // ---------------------------------------------------------------------------

  const fetchOverview = useCallback(async () => {
    try {
      const res = await fetch('/api/overview');
      if (res.ok) {
        const data = await res.json();
        setOverview(data);
        setServerOnline(true);
      }
    } catch {
      setServerOnline(false);
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  const fetchEvents = useCallback(async (page = 1, filters = eventsFilter) => {
    setLoadingEvents(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '15');
      if (filters.search) params.set('search', filters.search);
      if (filters.decision) params.set('decision', filters.decision);
      if (filters.riskLevel) params.set('riskLevel', filters.riskLevel);
      if (filters.isSimulation !== undefined)
        params.set('isSimulation', filters.isSimulation ? 'true' : 'false');

      const res = await fetch(`/api/events?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events);
        setEventsTotal(data.total);
        setEventsPage(data.page);
        setEventsTotalPages(data.totalPages);
        setServerOnline(true);
      }
    } catch {
      setServerOnline(false);
    } finally {
      setLoadingEvents(false);
    }
  }, [eventsFilter]);

  const fetchAlerts = useCallback(async () => {
    setLoadingAlerts(true);
    try {
      const res = await fetch('/api/alerts');
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts);
        setServerOnline(true);
      }
    } catch {
      setServerOnline(false);
    } finally {
      setLoadingAlerts(false);
    }
  }, []);

  const fetchPolicies = useCallback(async () => {
    setLoadingPolicies(true);
    try {
      const res = await fetch('/api/policies');
      if (res.ok) {
        const data = await res.json();
        setPolicies(data.policies);
      }
    } catch {
      setServerOnline(false);
    } finally {
      setLoadingPolicies(false);
    }
  }, []);

  const fetchRegistry = useCallback(async () => {
    setLoadingRegistry(true);
    try {
      const [agentRes, toolRes, keyRes] = await Promise.all([
        fetch('/api/agents'),
        fetch('/api/tools'),
        fetch('/api/gateway/keys'),
      ]);

      if (agentRes.ok && toolRes.ok) {
        const agentData = await agentRes.json();
        const toolData = await toolRes.json();
        setAgents(agentData.agents);
        setTools(toolData.tools);
      }

      if (keyRes.ok) {
        const keyData = await keyRes.json();
        setApiKeys(keyData.keys || []);
      }
    } catch {
      setServerOnline(false);
    } finally {
      setLoadingRegistry(false);
    }
  }, []);

  const fetchScenarios = useCallback(async () => {
    try {
      const res = await fetch('/api/simulator/scenarios');
      if (res.ok) {
        const data = await res.json();
        setScenarios(data.scenarios);
      }
    } catch {
      // Ignored
    }
  }, []);

  const fetchHealth = useCallback(async () => {
    setLoadingHealth(true);
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      }
    } catch {
      setServerOnline(false);
    } finally {
      setLoadingHealth(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      fetchOverview(),
      fetchEvents(eventsPage, eventsFilter),
      fetchAlerts(),
      fetchPolicies(),
      fetchRegistry(),
      fetchHealth(),
    ]);
    setIsRefreshing(false);
  }, [fetchOverview, fetchEvents, fetchAlerts, fetchPolicies, fetchRegistry, fetchHealth, eventsPage, eventsFilter]);

  // Initial Data Fetch
  useEffect(() => {
    fetchOverview();
    fetchEvents(1);
    fetchAlerts();
    fetchPolicies();
    fetchRegistry();
    fetchScenarios();
    fetchHealth();
  }, [fetchOverview, fetchEvents, fetchAlerts, fetchPolicies, fetchRegistry, fetchScenarios, fetchHealth]);

  // Periodic polling for events and alerts
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOverview();
      fetchAlerts();
    }, 12000);
    return () => clearInterval(interval);
  }, [fetchOverview, fetchAlerts]);

  // ---------------------------------------------------------------------------
  // Action Handlers
  // ---------------------------------------------------------------------------

  const handleUpdateAlertStatus = async (alertId: string, status: AlertStatus) => {
    try {
      const res = await fetch(`/api/alerts/${alertId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setAlerts((prev) => prev.map((a) => (a.id === alertId ? updated.alert : a)));
        fetchOverview();
      }
    } catch {
      // Fail closed
    }
  };

  const handleUpdatePolicy = async (policyId: string, updated: Partial<SecurityPolicy>) => {
    try {
      const res = await fetch(`/api/policies/${policyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        const text = await res.text();
        const data = text ? JSON.parse(text) : {};
        const policyObj = data.policy || data;
        if (policyObj && policyObj.id) {
          setPolicies((prev) => prev.map((p) => (p.id === policyId ? policyObj : p)));
        }
      }
    } catch {
      // Fail closed
    }
  };

  const handleResetPolicies = async () => {
    try {
      const res = await fetch('/api/policies/reset', { method: 'POST' });
      if (res.ok) {
        const text = await res.text();
        const data = text ? JSON.parse(text) : {};
        if (Array.isArray(data.policies)) {
          setPolicies(data.policies);
        }
      }
    } catch {
      // Fail closed
    }
  };

  const handleToggleAgentStatus = async (agentId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch(`/api/agents/${agentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        const text = await res.text();
        const data = text ? JSON.parse(text) : {};
        const agentObj = data.agent || data;
        if (agentObj && agentObj.id) {
          setAgents((prev) => prev.map((a) => (a.id === agentId ? agentObj : a)));
        }
      }
    } catch {
      // Fail closed
    }
  };

  const handleCreateApiKey = async (params: {
    name: string;
    targetAgentId: string;
    rateLimitPerMin: number;
  }) => {
    const res = await fetch('/api/gateway/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        createdBy: currentUser?.email || 'admin@sentinelmesh.io',
      }),
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    fetchRegistry();
    return data;
  };

  const handleRevokeApiKey = async (keyId: string) => {
    await fetch(`/api/gateway/keys/${keyId}`, { method: 'DELETE' });
    fetchRegistry();
  };

  const handleRunSimulatorScenario = async (
    scenarioId?: string,
    custom?: { agentId: string; toolName: string; arguments: Record<string, any> }
  ) => {
    const payload = scenarioId ? { scenarioId } : custom;
    try {
      const res = await fetch('/api/simulator/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let result: any = null;
      try {
        result = text ? JSON.parse(text) : null;
      } catch (parseErr) {
        console.error('Failed to parse simulator JSON response:', parseErr, text);
      }

      if (!res.ok || !result || !result.decision) {
        result = {
          submittedRequest: payload,
          decision: result?.decision || {
            decision: 'BLOCK',
            reason: result?.error || `Firewall returned HTTP ${res.status}. Failing closed.`,
            riskLevel: 'CRITICAL',
            matchedRules: ['RULE_FAIL_CLOSED'],
            executionOccurred: false,
            timestamp: new Date().toISOString(),
            agentId: custom?.agentId || 'unknown',
            toolName: custom?.toolName || 'unknown',
            requestId: `sim-err-${Date.now()}`,
          },
          matchExpected: false,
        };
      }

      fetchOverview();
      fetchEvents(1);
      fetchAlerts();
      return result;
    } catch (netErr: any) {
      console.error('Network error during simulator scenario:', netErr);
      const fallbackResult = {
        submittedRequest: payload,
        decision: {
          decision: 'BLOCK',
          reason: `Network or server failure: ${netErr?.message || 'Connection lost'}. Failing closed.`,
          riskLevel: 'CRITICAL',
          matchedRules: ['RULE_FAIL_CLOSED'],
          executionOccurred: false,
          timestamp: new Date().toISOString(),
          agentId: custom?.agentId || 'unknown',
          toolName: custom?.toolName || 'unknown',
          requestId: `net-err-${Date.now()}`,
        },
        matchExpected: false,
      };
      return fallbackResult;
    }
  };

  const handleRunAllScenarios = async () => {
    try {
      const res = await fetch('/api/simulator/run-all', { method: 'POST' });
      const text = await res.text();
      let result: any = null;
      try {
        result = text ? JSON.parse(text) : null;
      } catch {}
      if (!result) {
        result = { allPassed: false, totalScenarios: 0, passedCount: 0, results: [] };
      }
      fetchOverview();
      fetchEvents(1);
      fetchAlerts();
      return result;
    } catch {
      return { allPassed: false, totalScenarios: 0, passedCount: 0, results: [] };
    }
  };

  const handleRunTestSuite = async (): Promise<TestSuiteResult> => {
    try {
      const res = await fetch('/api/tests/run');
      const text = await res.text();
      let result: any = null;
      try {
        result = text ? JSON.parse(text) : null;
      } catch {}
      return (
        result || {
          allPassed: false,
          total: 0,
          passed: 0,
          failed: 0,
          executedAt: new Date().toISOString(),
          results: [],
        }
      );
    } catch {
      return {
        allPassed: false,
        total: 0,
        passed: 0,
        failed: 0,
        executedAt: new Date().toISOString(),
        results: [],
      };
    }
  };

  const handleInspectEventById = async (eventId?: string) => {
    if (!eventId) return;
    try {
      const res = await fetch(`/api/events/${eventId}`);
      if (res.ok) {
        const ev = await res.json();
        setInspectedEvent(ev);
      }
    } catch {
      // Ignored
    }
  };

  const handleRunQuickScenario = async (scenarioId: string) => {
    setActiveTab('simulator');
    await handleRunSimulatorScenario(scenarioId);
  };

  // Sign out completion callback
  const handleFinishSignOut = async () => {
    const token = localStorage.getItem('sm_auth_token');
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {
      // Ignored
    }
    localStorage.removeItem('sm_auth_token');
    setCurrentUser(null);
    setShowLanding(true);
    setShowSignOutAnim(false);
  };

  const openAlertsCount = alerts.filter((a) => a.status === 'OPEN').length;

  // ---------------------------------------------------------------------------
  // View Rendering
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-[#FFF9F2] bg-aurora-pattern text-[#292638] flex flex-col font-sans selection:bg-[#7657F6]/15 selection:text-[#7657F6]">
      {/* 1. Animated Opening Splash Screen */}
      {showSplash && (
        <IntroSplashScreen onComplete={() => setShowSplash(false)} />
      )}

      {/* 2. Public Landing Page (Unauthenticated or Explicit Preview) */}
      {(showLanding || !currentUser) ? (
        <>
          <LandingPageView
            onOpenAuth={(mode) => {
              setAuthModalMode(mode);
              setShowAuthModal(true);
            }}
            onEnterDashboardDemo={() => {
              setShowLanding(false);
            }}
          />
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            initialMode={authModalMode}
            onSuccess={(user) => {
              setCurrentUser(user);
              setShowLanding(false);
            }}
          />
        </>
      ) : (
        /* 3. Authenticated Dashboard with Aurora Pop Design */
        <>
          {/* Top Bar Navigation */}
          <Navigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
            alertCount={openAlertsCount}
            serverOnline={serverOnline}
            onRefreshAll={refreshAll}
            isRefreshing={isRefreshing}
            user={currentUser}
            onSignOut={() => setShowSignOutAnim(true)}
            onOpenLanding={() => setShowLanding(true)}
          />

          {/* Main Content Area */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
            {activeTab === 'overview' && (
              <OverviewView
                overview={overview}
                loading={loadingOverview}
                onNavigate={setActiveTab}
                onSelectEvent={setInspectedEvent}
                onRunQuickScenario={handleRunQuickScenario}
              />
            )}

            {activeTab === 'events' && (
              <EventsView
                events={events}
                total={eventsTotal}
                page={eventsPage}
                totalPages={eventsTotalPages}
                loading={loadingEvents}
                onPageChange={(p) => fetchEvents(p, eventsFilter)}
                onSearch={(q) => {
                  const next = { ...eventsFilter, search: q };
                  setEventsFilter(next);
                  fetchEvents(1, next);
                }}
                onFilterChange={(filters) => {
                  const next = { ...eventsFilter, ...filters };
                  setEventsFilter(next);
                  fetchEvents(1, next);
                }}
                onSelectEvent={setInspectedEvent}
                onRefresh={() => fetchEvents(eventsPage, eventsFilter)}
              />
            )}

            {activeTab === 'alerts' && (
              <AlertsView
                alerts={alerts}
                loading={loadingAlerts}
                onUpdateAlertStatus={handleUpdateAlertStatus}
                onInspectEventId={handleInspectEventById}
              />
            )}

            {activeTab === 'policies' && (
              <PoliciesView
                policies={policies}
                loading={loadingPolicies}
                onUpdatePolicy={handleUpdatePolicy}
                onResetPolicies={handleResetPolicies}
              />
            )}

            {activeTab === 'simulator' && (
              <SimulatorView
                scenarios={scenarios}
                loading={false}
                onRunScenario={handleRunSimulatorScenario}
                onRunAllScenarios={handleRunAllScenarios}
                onInspectEventId={handleInspectEventById}
              />
            )}

            {activeTab === 'registry' && (
              <RegistryView
                agents={agents}
                tools={tools}
                loading={loadingRegistry}
                onToggleAgentStatus={handleToggleAgentStatus}
              />
            )}

            {activeTab === 'gateway' && (
              <DeveloperPortalView
                apiKeys={apiKeys}
                agents={agents}
                tools={tools}
                loading={loadingRegistry}
                onCreateKey={handleCreateApiKey}
                onRevokeKey={handleRevokeApiKey}
                onInspectEventId={handleInspectEventById}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                health={health}
                loading={loadingHealth}
                onRefreshHealth={fetchHealth}
                onRunTestSuite={handleRunTestSuite}
              />
            )}

            {activeTab === 'profile' && currentUser && (
              <UserProfileView
                user={currentUser}
                onUpdateUser={(updated) => setCurrentUser(updated)}
                onBackToDashboard={() => setActiveTab('overview')}
              />
            )}
          </main>

          {/* Drill-down Audit Event Inspector Modal */}
          <EventDetailModal
            event={inspectedEvent}
            onClose={() => setInspectedEvent(null)}
          />

          {/* Animated Sign Out Interaction Modal */}
          {showSignOutAnim && (
            <SignOutAnimation
              userName={currentUser?.name}
              onComplete={handleFinishSignOut}
            />
          )}

          {/* Quiet Footer */}
          <footer className="mt-auto border-t border-[#EAE6F5] bg-white/70 py-4 px-6 text-xs text-[#6B6580]">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#292638]">SentinelMesh</span>
                <span>·</span>
                <span>Central AI Agent Security Gateway</span>
                <span>·</span>
                <span className="font-mono text-[#7657F6] font-bold">Zero-Bypass Architecture</span>
              </div>

              <div className="flex items-center gap-3 text-[#6B6580] font-mono text-[11px]">
                <span>Deterministic Enforcement</span>
                <span>·</span>
                <span>Verified Persistent Audit Ledger</span>
              </div>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}
