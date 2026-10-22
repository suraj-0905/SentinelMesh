/**
 * SentinelMesh User Profile & Preferences View
 * Manage operator identity, roles, department, preset avatars,
 * and security monitoring preferences under Aurora Pop styling.
 */

import React, { useState } from 'react';
import {
  User,
  Shield,
  Building,
  Mail,
  Palette,
  Volume2,
  Bell,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  Activity,
  Layers,
  Key,
} from 'lucide-react';
import type { UserProfile, UserPreferences } from '../../shared/types.ts';

interface UserProfileViewProps {
  user: UserProfile;
  onUpdateUser: (updated: UserProfile) => void;
  onBackToDashboard: () => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  'https://api.dicebear.com/7.x/bottts/svg?seed=SentinelHero&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/bottts/svg?seed=CyberGuardian&backgroundColor=ffd5dc',
];

export function UserProfileView({ user, onUpdateUser, onBackToDashboard }: UserProfileViewProps) {
  const [name, setName] = useState(user.name);
  const [department, setDepartment] = useState(user.department);
  const [organization, setOrganization] = useState(user.organization);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [preferences, setPreferences] = useState<UserPreferences>({ ...user.preferences });

  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveStatus('idle');

    try {
      const token = localStorage.getItem('sm_auth_token');
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          department,
          organization,
          avatarUrl,
          preferences,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      onUpdateUser(data.user);
      setSaveStatus('success');
      setStatusMessage('Profile and preferences updated successfully.');
      setTimeout(() => setSaveStatus('idle'), 3500);
    } catch (err: any) {
      setSaveStatus('error');
      setStatusMessage(err?.message || 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const updatePref = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-[#EAE6F5] shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={avatarUrl}
              alt={name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-[#7657F6]/30 shadow-md shadow-[#7657F6]/10"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  'https://api.dicebear.com/7.x/bottts/svg?seed=Fallback';
              }}
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#54D6B0] border-2 border-white flex items-center justify-center text-[10px] text-white">
              ✓
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-[#292638]">{name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#7657F6]/15 text-[#7657F6] border border-[#7657F6]/25">
                {user.role}
              </span>
            </div>
            <p className="text-xs text-[#6B6580] mt-0.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> {user.email} • {department} • {organization}
            </p>
          </div>
        </div>

        <button
          onClick={onBackToDashboard}
          className="self-start sm:self-auto px-4 py-2 rounded-xl text-xs font-bold text-[#7657F6] hover:bg-[#7657F6]/10 border border-[#7657F6]/20 transition-all cursor-pointer"
        >
          ← Return to Dashboard
        </button>
      </div>

      {/* Quick Security Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#EAE6F5] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#7657F6]/10 flex items-center justify-center text-[#7657F6]">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#6B6580]">Clearance Tier</div>
            <div className="text-lg font-bold text-[#292638]">Tier-1 SecOps Operator</div>
            <div className="text-[11px] text-[#54D6B0] font-semibold">Active Zero-Trust Enforcer</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#EAE6F5] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#54D6B0]/15 flex items-center justify-center text-[#0f8263]">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#6B6580]">Supervised Agents</div>
            <div className="text-lg font-bold text-[#292638]">
              {user.managedAgentCount || 4} Registered AI Agents
            </div>
            <div className="text-[11px] text-[#7657F6] font-semibold">100% Policy Interception</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#EAE6F5] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#FFD66B]/20 flex items-center justify-center text-[#d97706]">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#6B6580]">Security Standing</div>
            <div className="text-lg font-bold text-[#292638]">99.8% Healthy</div>
            <div className="text-[11px] text-[#0f8263] font-semibold">Zero Uncontained Breaches</div>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {saveStatus === 'success' && (
          <div className="p-4 rounded-xl bg-[#54D6B0]/15 border border-[#54D6B0]/30 text-[#0f8263] text-sm flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {saveStatus === 'error' && (
          <div className="p-4 rounded-xl bg-[#FF786B]/15 border border-[#FF786B]/30 text-[#FF786B] text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Section 1: Identity & Profile Details */}
        <div className="p-6 rounded-2xl bg-white border border-[#EAE6F5] shadow-sm space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-[#EAE6F5]">
            <User className="w-5 h-5 text-[#7657F6]" />
            <h2 className="text-base font-bold text-[#292638]">Operator Profile & Identity</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#292638] mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FFF9F2] border border-[#EAE6F5] focus:border-[#7657F6] focus:outline-none rounded-xl text-sm text-[#292638]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#292638] mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full px-3.5 py-2.5 bg-[#EAE6F5]/40 border border-[#EAE6F5] rounded-xl text-sm text-[#6B6580] cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#292638] mb-1">Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FFF9F2] border border-[#EAE6F5] focus:border-[#7657F6] focus:outline-none rounded-xl text-sm text-[#292638]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#292638] mb-1">Organization</label>
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FFF9F2] border border-[#EAE6F5] focus:border-[#7657F6] focus:outline-none rounded-xl text-sm text-[#292638]"
              />
            </div>
          </div>

          {/* Avatar Presets Selection */}
          <div>
            <label className="block text-xs font-semibold text-[#292638] mb-2">
              Choose Avatar Preset or Custom Image
            </label>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              {AVATAR_PRESETS.map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setAvatarUrl(preset)}
                  className={`relative p-0.5 rounded-xl border-2 transition-all ${
                    avatarUrl === preset
                      ? 'border-[#7657F6] scale-105 shadow-md shadow-[#7657F6]/25'
                      : 'border-transparent hover:border-[#EAE6F5]'
                  }`}
                >
                  <img
                    src={preset}
                    alt={`Preset ${idx}`}
                    className="w-12 h-12 rounded-[10px] object-cover"
                  />
                  {avatarUrl === preset && (
                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#7657F6] text-white flex items-center justify-center text-[9px] font-bold">
                      ✓
                    </div>
                  )}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="Or paste an image URL..."
              className="w-full px-3.5 py-2 bg-[#FFF9F2] border border-[#EAE6F5] focus:border-[#7657F6] focus:outline-none rounded-xl text-xs text-[#292638]"
            />
          </div>
        </div>

        {/* Section 2: Aurora Pop Theme & Experience Preferences */}
        <div className="p-6 rounded-2xl bg-white border border-[#EAE6F5] shadow-sm space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-[#EAE6F5]">
            <Palette className="w-5 h-5 text-[#7657F6]" />
            <h2 className="text-base font-bold text-[#292638]">
              Theme & Interface Customization
            </h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#292638] mb-2">
              Primary Accent Tone
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'violet', label: 'Vivid Violet', hex: '#7657F6' },
                { id: 'coral', label: 'Sunset Coral', hex: '#FF786B' },
                { id: 'mint', label: 'Electric Mint', hex: '#54D6B0' },
                { id: 'yellow', label: 'Sunny Yellow', hex: '#FFD66B' },
              ].map((accent) => (
                <button
                  type="button"
                  key={accent.id}
                  onClick={() => updatePref('themeAccent', accent.id as any)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    preferences.themeAccent === accent.id
                      ? 'border-[#7657F6] bg-[#7657F6]/5 shadow-sm'
                      : 'border-[#EAE6F5] hover:border-[#D1C8E9]'
                  }`}
                >
                  <div
                    className="w-5 h-5 rounded-full shadow-inner"
                    style={{ backgroundColor: accent.hex }}
                  />
                  <span className="text-xs font-bold text-[#292638]">{accent.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <label className="flex items-center justify-between p-3.5 rounded-xl bg-[#FFF9F2] border border-[#EAE6F5] cursor-pointer hover:border-[#7657F6]/30">
              <div className="flex items-center gap-3">
                <Volume2 className="w-4 h-4 text-[#7657F6]" />
                <div>
                  <div className="text-xs font-bold text-[#292638]">Security Audio Cues</div>
                  <div className="text-[11px] text-[#6B6580]">Chimes on firewall blocks and alerts</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.enableAudioCues}
                onChange={(e) => updatePref('enableAudioCues', e.target.checked)}
                className="w-4 h-4 rounded text-[#7657F6] focus:ring-0 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl bg-[#FFF9F2] border border-[#EAE6F5] cursor-pointer hover:border-[#7657F6]/30">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-[#FF786B]" />
                <div>
                  <div className="text-xs font-bold text-[#292638]">Real-time Email Alerts</div>
                  <div className="text-[11px] text-[#6B6580]">Immediate notification on CRITICAL threats</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.emailAlerts}
                onChange={(e) => updatePref('emailAlerts', e.target.checked)}
                className="w-4 h-4 rounded text-[#7657F6] focus:ring-0 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl bg-[#FFF9F2] border border-[#EAE6F5] cursor-pointer hover:border-[#7657F6]/30">
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-[#54D6B0]" />
                <div>
                  <div className="text-xs font-bold text-[#292638]">Reduced Motion Mode</div>
                  <div className="text-[11px] text-[#6B6580]">Minimize orbital animations</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.reducedMotion}
                onChange={(e) => updatePref('reducedMotion', e.target.checked)}
                className="w-4 h-4 rounded text-[#7657F6] focus:ring-0 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl bg-[#FFF9F2] border border-[#EAE6F5] cursor-pointer hover:border-[#7657F6]/30">
              <div className="flex items-center gap-3">
                <Layers className="w-4 h-4 text-[#7657F6]" />
                <div>
                  <div className="text-xs font-bold text-[#292638]">Compact Audit Table</div>
                  <div className="text-[11px] text-[#6B6580]">Dense rows for high-throughput reviews</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.compactAuditLogs}
                onChange={(e) => updatePref('compactAuditLogs', e.target.checked)}
                className="w-4 h-4 rounded text-[#7657F6] focus:ring-0 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-[#6B6580] hover:text-[#292638] hover:bg-[#F3EDE6] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-[#7657F6] hover:bg-[#6847EB] text-white font-bold text-xs shadow-md shadow-[#7657F6]/25 hover:shadow-lg flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Profile Preferences
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
