/**
 * SentinelMesh Animated Sign Out Modal
 * Features a friendly waving ghost/guardian (👋 🛡️ ✨),
 * smooth particle dispersal, and safe session revocation.
 */

import React, { useEffect, useState } from 'react';
import { Shield, Sparkles, CheckCircle2 } from 'lucide-react';

interface SignOutAnimationProps {
  onComplete: () => void;
  userName?: string;
}

export function SignOutAnimation({ onComplete, userName }: SignOutAnimationProps) {
  const [stage, setStage] = useState<'clearing' | 'goodbye'>('clearing');

  useEffect(() => {
    const t1 = setTimeout(() => {
      setStage('goodbye');
    }, 700);

    const t2 = setTimeout(() => {
      onComplete();
    }, 1800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#292638]/50 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-sm bg-white rounded-3xl p-8 text-center shadow-2xl border border-[#EAE6F5] overflow-hidden">
        {/* Background glow */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-[#7657F6]/15 rounded-full blur-2xl" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-[#FF786B]/15 rounded-full blur-2xl" />

        {/* Waving Ghost / Security Guardian Animation */}
        <div className="relative mx-auto w-24 h-24 mb-6 flex items-center justify-center">
          {/* Orbiting particles */}
          <div className="absolute inset-0 rounded-full border border-dashed border-[#7657F6]/30 animate-spin-slow" />
          
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#7657F6] to-[#FF786B] p-1 shadow-lg shadow-[#7657F6]/20">
            <div className="w-full h-full bg-[#FFF9F2] rounded-[14px] flex items-center justify-center text-3xl select-none">
              <span className="inline-block transform animate-bounce">
                👋
              </span>
            </div>
          </div>

          <div className="absolute -top-1 -right-1 text-[#FFD66B] animate-pulse">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        {/* Text and status */}
        <h3 className="text-xl font-extrabold text-[#292638] mb-1">
          {stage === 'clearing' ? 'Securing Session...' : `See you soon, ${userName || 'Operator'}!`}
        </h3>
        <p className="text-xs text-[#6B6580] mb-6">
          {stage === 'clearing'
            ? 'Destroying cryptographic bearer token and memory cache...'
            : 'Your agent firewall policies remain active 24/7.'}
        </p>

        {/* Mini progress pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#54D6B0]/15 text-[#0f8263] text-xs font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Session safely terminated</span>
        </div>
      </div>
    </div>
  );
}
