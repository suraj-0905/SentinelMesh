/**
 * SentinelMesh Navigation Header (Aurora Pop Theme)
 * Responsive top navigation bar with brand emblem, active tab pills,
 * operator profile avatar dropdown, real-time status, and sign-out action.
 */

import React, { useState } from 'react';
import { Shield, RefreshCw, LogOut, User as UserIcon, ExternalLink, ChevronDown } from 'lucide-react';
import type { UserProfile } from '../../shared/types.ts';

export type ActiveTab =
  | 'overview'
  | 'events'
  | 'alerts'
  | 'policies'
  | 'simulator'
  | 'registry'
  | 'gateway'
  | 'settings'
  | 'profile';

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  alertCount: number;
  serverOnline: boolean;
  onRefreshAll: () => void;
  isRefreshing: boolean;
  user: UserProfile | null;
  onSignOut: () => void;
  onOpenLanding: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  alertCount,
  serverOnline,
  onRefreshAll,
  isRefreshing,
  user,
  onSignOut,
  onOpenLanding,
}) => {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const navItems: { id: ActiveTab; label: string; count?: number; emoji?: string }[] = [
    { id: 'overview', label: 'Overview', emoji: '📊' },
    { id: 'events', label: 'Security Events', emoji: '🔍' },
    { id: 'alerts', label: 'Alerts', count: alertCount > 0 ? alertCount : undefined, emoji: '🚨' },
    { id: 'policies', label: 'Policy Center', emoji: '🔒' },
    { id: 'simulator', label: 'Attack Simulator', emoji: '🛡️' },
    { id: 'registry', label: 'Agents & Tools', emoji: '🤖' },
    { id: 'gateway', label: 'Developer Gateway', emoji: '📡' },
    { id: 'settings', label: 'System Health', emoji: '✨' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#EAE6F5] px-4 sm:px-6 py-2.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Emblem */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div
            onClick={() => onTabChange('overview')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#7657F6] to-[#FF786B] p-0.5 shadow-sm shadow-[#7657F6]/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#FFF9F2] rounded-[10px] flex items-center justify-center">
                <Shield className="w-4 h-4 text-[#7657F6]" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-extrabold tracking-tight text-[#292638]">
                Sentinel<span className="text-[#7657F6]">Mesh</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-[#54D6B0]/20 text-[#0f8263] font-bold">
                CORE
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden xl:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`group px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-[#7657F6]/10 text-[#7657F6] shadow-sm border border-[#7657F6]/25'
                    : 'text-[#6B6580] hover:text-[#292638] hover:bg-[#FFF9F2]'
                }`}
              >
                <span
                  className={`text-sm select-none transition-transform duration-300 inline-block ${
                    isActive
                      ? 'scale-115 drop-shadow-sm'
                      : 'group-hover:scale-115 opacity-85 group-hover:opacity-100'
                  } ${item.id === 'alerts' && item.count ? 'animate-bounce' : ''}`}
                  role="img"
                  aria-label={item.label}
                >
                  {item.emoji}
                </span>
                <span>{item.label}</span>
                {item.count !== undefined && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#FF786B]/20 text-[#FF786B] font-bold border border-[#FF786B]/30 animate-pulse">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Section: Refresh, Status, User Avatar Dropdown */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Real-time Status Badge */}
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-[#FFF9F2] border border-[#EAE6F5]">
            <span
              className={`w-2 h-2 rounded-full ${
                serverOnline ? 'bg-[#54D6B0] animate-pulse' : 'bg-[#FF786B]'
              }`}
            />
            <span className={serverOnline ? 'text-[#0f8263]' : 'text-[#FF786B]'}>
              {serverOnline ? 'Active Defense' : 'Offline'}
            </span>
          </div>

          {/* Sync Button */}
          <button
            onClick={onRefreshAll}
            disabled={isRefreshing}
            title="Sync live firewall metrics"
            className="p-2 text-[#6B6580] hover:text-[#292638] rounded-xl hover:bg-[#FFF9F2] border border-[#EAE6F5] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#7657F6]' : ''}`} />
          </button>

          {/* User Profile Avatar Pill & Dropdown */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-[#FFF9F2] hover:bg-[#F3EDE6] border border-[#EAE6F5] transition-all cursor-pointer"
              >
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-6 h-6 rounded-lg object-cover border border-[#7657F6]/30"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      'https://api.dicebear.com/7.x/bottts/svg?seed=Fallback';
                  }}
                />
                <span className="text-xs font-bold text-[#292638] max-w-[100px] truncate hidden md:inline">
                  {user.name.split(' ')[0]}
                </span>
                <ChevronDown className="w-3 h-3 text-[#6B6580]" />
              </button>

              {profileMenuOpen && (
                <div
                  onMouseLeave={() => setProfileMenuOpen(false)}
                  className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-[#EAE6F5] shadow-xl p-2 z-50 animate-fadeIn"
                >
                  <div className="px-3 py-2 border-b border-[#EAE6F5] mb-1">
                    <div className="text-xs font-bold text-[#292638] truncate">{user.name}</div>
                    <div className="text-[10px] text-[#6B6580] truncate">{user.email}</div>
                    <span className="inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#7657F6]/10 text-[#7657F6]">
                      {user.role}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      onTabChange('profile');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#292638] hover:bg-[#FFF9F2] rounded-xl transition-colors cursor-pointer text-left"
                  >
                    <UserIcon className="w-4 h-4 text-[#7657F6]" />
                    <span>Profile & Preferences</span>
                  </button>

                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      onOpenLanding();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#292638] hover:bg-[#FFF9F2] rounded-xl transition-colors cursor-pointer text-left"
                  >
                    <ExternalLink className="w-4 h-4 text-[#54D6B0]" />
                    <span>Public Landing Page</span>
                  </button>

                  <div className="border-t border-[#EAE6F5] my-1" />

                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      onSignOut();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#FF786B] hover:bg-[#FF786B]/10 rounded-xl transition-colors cursor-pointer text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenLanding}
              className="px-3 py-1.5 rounded-xl bg-[#7657F6] text-white text-xs font-bold shadow-sm hover:bg-[#6847EB] transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Mobile / Narrow Tab Bar */}
      <div className="flex xl:hidden overflow-x-auto gap-1 pt-2 pb-1 -mx-2 px-2 border-t border-[#EAE6F5] mt-2 scrollbar-none">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`px-2.5 py-1 text-xs font-semibold whitespace-nowrap rounded-lg cursor-pointer flex items-center gap-1.5 ${
              activeTab === item.id
                ? 'bg-[#7657F6] text-white shadow-sm'
                : 'text-[#6B6580] hover:text-[#292638] hover:bg-[#FFF9F2]'
            }`}
          >
            <span className="text-xs select-none">{item.emoji}</span>
            <span>{item.label}</span>
            {item.count !== undefined && (
              <span className="ml-0.5 px-1.5 text-[9px] rounded-full bg-white/30 text-white font-bold">
                {item.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </header>
  );
};
