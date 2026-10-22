/**
 * SentinelMesh Authentication Modal
 * Sign In, Sign Up, and Password Reset with Aurora Pop styling,
 * demo fast-fill accounts, and real PBKDF2 server-backed authentication.
 */

import React, { useState } from 'react';
import {
  Shield,
  X,
  Lock,
  Mail,
  User,
  Building,
  KeyRound,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import type { UserProfile, UserRole } from '../../shared/types.ts';
import { signInWithGoogle, isFirebaseConfigured } from '../lib/firebase.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile, token: string) => void;
  initialMode?: 'signin' | 'signup';
}

export function AuthModal({ isOpen, onClose, onSuccess, initialMode = 'signin' }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('SecOps Analyst');
  const [department, setDepartment] = useState('AI Security Operations');
  const [newPassword, setNewPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to authenticate');
        }
        localStorage.setItem('sm_auth_token', data.token);
        onSuccess(data.user, data.token);
        onClose();
      } else if (mode === 'signup') {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            name,
            role,
            department,
            organization: 'SentinelMesh Enterprise',
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to register account');
        }
        localStorage.setItem('sm_auth_token', data.token);
        onSuccess(data.user, data.token);
        onClose();
      } else if (mode === 'forgot') {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, newPassword }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to reset password');
        }
        setSuccessMessage('Password updated successfully! Please sign in with your new credentials.');
        setMode('signin');
        setPassword(newPassword);
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoName: string) => {
    setEmail(demoEmail);
    setPassword('Sentinel@2026!');
    setMode('signin');
    setError(null);
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const { user, firebaseUser } = await signInWithGoogle();
      const token = `sm_fb_${firebaseUser.uid}`;
      localStorage.setItem('sm_auth_token', token);
      onSuccess(user, token);
      onClose();
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      setError(err?.message || 'Google authentication was not completed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#292638]/40 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#EAE6F5] overflow-hidden">
        {/* Decorative Top Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#7657F6] via-[#FF786B] to-[#54D6B0]" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#7657F6]/10 flex items-center justify-center text-[#7657F6]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#292638]">
                {mode === 'signin' && 'Sign in to SentinelMesh'}
                {mode === 'signup' && 'Create Operator Account'}
                {mode === 'forgot' && 'Reset Operator Credentials'}
              </h2>
              <p className="text-xs text-[#6B6580]">
                Central AI Agent Security & Policy Gateway
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#6B6580] hover:text-[#292638] rounded-lg hover:bg-[#F3EDE6] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-[#EAE6F5] px-6">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setError(null);
            }}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all mr-6 ${
              mode === 'signin'
                ? 'border-[#7657F6] text-[#7657F6]'
                : 'border-transparent text-[#6B6580] hover:text-[#292638]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all mr-6 ${
              mode === 'signup'
                ? 'border-[#7657F6] text-[#7657F6]'
                : 'border-transparent text-[#6B6580] hover:text-[#292638]'
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('forgot');
              setError(null);
            }}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
              mode === 'forgot'
                ? 'border-[#7657F6] text-[#7657F6]'
                : 'border-transparent text-[#6B6580] hover:text-[#292638]'
            }`}
          >
            Reset Key
          </button>
        </div>

        {/* Google Authentication via Firebase */}
        {mode !== 'forgot' && isFirebaseConfigured && (
          <div className="px-6 pt-4 pb-1">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl border border-[#EAE6F5] hover:border-[#7657F6]/50 bg-white hover:bg-[#FFF9F2] text-[#292638] font-bold text-xs shadow-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google (Firebase Auth)</span>
            </button>

            <div className="flex items-center gap-3 my-3">
              <div className="flex-1 h-px bg-[#EAE6F5]" />
              <span className="text-[10px] font-bold text-[#6B6580] uppercase tracking-wider">or SecOps credentials</span>
              <div className="flex-1 h-px bg-[#EAE6F5]" />
            </div>
          </div>
        )}

        {/* Demo Fast Login Pills */}
        {mode === 'signin' && (
          <div className="px-6 pt-1 pb-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6580] mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#FFD66B]" /> Quick Demo Accounts
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('alex.chen@sentinelmesh.io', 'Alex Chen')}
                className="text-left px-3 py-2 rounded-xl bg-[#FFF9F2] hover:bg-[#F4EFFB] border border-[#EAE6F5] hover:border-[#7657F6]/40 transition-all text-xs"
              >
                <div className="font-bold text-[#292638]">Alex Chen</div>
                <div className="text-[10px] text-[#6B6580]">SecOps Analyst</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('ssushantakumar08@gmail.com', 'Sushanta Kumar')}
                className="text-left px-3 py-2 rounded-xl bg-[#FFF9F2] hover:bg-[#F4EFFB] border border-[#EAE6F5] hover:border-[#7657F6]/40 transition-all text-xs"
              >
                <div className="font-bold text-[#292638]">Sushanta Kumar</div>
                <div className="text-[10px] text-[#6B6580]">Security Admin</div>
              </button>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-[#FF786B]/10 border border-[#FF786B]/30 text-[#FF786B] text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-[#54D6B0]/15 border border-[#54D6B0]/30 text-[#0f8263] text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-[#292638] mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6580]" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sarah Connor"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#FFF9F2] border border-[#EAE6F5] focus:border-[#7657F6] focus:outline-none focus:ring-2 focus:ring-[#7657F6]/10 rounded-xl text-sm text-[#292638] transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#292638] mb-1">
                    Security Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2.5 bg-[#FFF9F2] border border-[#EAE6F5] focus:border-[#7657F6] focus:outline-none rounded-xl text-xs text-[#292638]"
                  >
                    <option value="SecOps Analyst">SecOps Analyst</option>
                    <option value="Security Admin">Security Admin</option>
                    <option value="AI Engineer">AI Engineer</option>
                    <option value="Auditor">Auditor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#292638] mb-1">
                    Department
                  </label>
                  <div className="relative">
                    <Building className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6580]" />
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. SecOps"
                      className="w-full pl-8 pr-3 py-2.5 bg-[#FFF9F2] border border-[#EAE6F5] focus:border-[#7657F6] focus:outline-none rounded-xl text-xs text-[#292638]"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#292638] mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6580]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@organization.com"
                className="w-full pl-10 pr-3.5 py-2.5 bg-[#FFF9F2] border border-[#EAE6F5] focus:border-[#7657F6] focus:outline-none focus:ring-2 focus:ring-[#7657F6]/10 rounded-xl text-sm text-[#292638] transition-all"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#292638]">
                  Password
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[11px] text-[#7657F6] hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6580]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#FFF9F2] border border-[#EAE6F5] focus:border-[#7657F6] focus:outline-none focus:ring-2 focus:ring-[#7657F6]/10 rounded-xl text-sm text-[#292638] transition-all"
                />
              </div>
            </div>
          )}

          {mode === 'forgot' && (
            <div>
              <label className="block text-xs font-semibold text-[#292638] mb-1">
                New Secure Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6580]" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#FFF9F2] border border-[#EAE6F5] focus:border-[#7657F6] focus:outline-none rounded-xl text-sm text-[#292638]"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-[#7657F6] hover:bg-[#6847EB] text-white font-bold text-sm shadow-md shadow-[#7657F6]/25 hover:shadow-lg hover:shadow-[#7657F6]/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer mt-2"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {mode === 'signin' && 'Sign In to Gateway'}
                {mode === 'signup' && 'Create Security Account'}
                {mode === 'forgot' && 'Reset My Password'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-[11px] text-center text-[#6B6580] pt-1">
            Protected by SentinelMesh zero-trust firewall policy engine.
          </p>
        </form>
      </div>
    </div>
  );
}
