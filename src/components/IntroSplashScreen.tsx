/**
 * SentinelMesh Intro Splash Screen
 * 2-second animated opening screen with orbiting security elements,
 * floating particle nodes, and tagline "Your AI. Your Rules. Your Security."
 */

import React, { useEffect, useState } from 'react';
import { Shield, Lock, Cpu, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';

interface IntroSplashScreenProps {
  onComplete: () => void;
}

export function IntroSplashScreen({ onComplete }: IntroSplashScreenProps) {
  const [fadingOut, setFadingOut] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Progress bar animation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 90);

    // Auto-dismiss after 2.1s
    const timer = setTimeout(() => {
      setFadingOut(true);
      setTimeout(() => {
        onComplete();
      }, 450);
    }, 2200);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FFF9F2] bg-aurora-pattern transition-opacity duration-500 ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background ambient aurora blurs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#7657F6]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[#FF786B]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#54D6B0]/8 rounded-full blur-3xl pointer-events-none" />

      {/* Main central container */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-md">
        {/* Animated Orbiting Security Emblem */}
        <div className="relative w-36 h-36 mb-8 flex items-center justify-center">
          {/* Outer Orbiting Ring 1 */}
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#7657F6]/30 animate-spin-slow">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#7657F6] text-white flex items-center justify-center shadow-md shadow-[#7657F6]/40">
              <Shield className="w-2.5 h-2.5" />
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#54D6B0] text-white flex items-center justify-center shadow-md shadow-[#54D6B0]/40">
              <CheckCircle2 className="w-2.5 h-2.5" />
            </div>
          </div>

          {/* Inner Orbiting Ring 2 */}
          <div className="absolute inset-3 rounded-full border border-dotted border-[#FF786B]/40 animate-spin-reverse-slow">
            <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[#FF786B] text-white flex items-center justify-center shadow-md shadow-[#FF786B]/40">
              <Lock className="w-2 h-2" />
            </div>
          </div>

          {/* Central glowing shield badge */}
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#7657F6] via-[#9176FC] to-[#FF786B] p-0.5 shadow-xl shadow-[#7657F6]/25 flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
            <div className="w-full h-full bg-[#FFF9F2] rounded-[14px] flex items-center justify-center">
              <div className="relative">
                <Shield className="w-10 h-10 text-[#7657F6]" />
                <Cpu className="w-4 h-4 text-[#FF786B] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          {/* Floating particle sparkle badges */}
          <div className="absolute -top-3 -right-3 text-[#FFD66B] animate-bounce">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        {/* Brand Name */}
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#292638]">
            Sentinel<span className="text-[#7657F6]">Mesh</span>
          </h1>
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-[#54D6B0]/20 text-[#0f8263] border border-[#54D6B0]/30">
            v1.2 Active
          </span>
        </div>

        {/* Tagline */}
        <p className="text-base font-medium text-[#6B6580] mb-8">
          Your AI. Your Rules. Your Security.
        </p>

        {/* Animated Loading Bar */}
        <div className="w-56 h-1.5 bg-[#EAE6F5] rounded-full overflow-hidden mb-6 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-[#7657F6] via-[#54D6B0] to-[#FF786B] rounded-full transition-all duration-150 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Skip button for impatient users */}
        <button
          onClick={() => {
            setFadingOut(true);
            setTimeout(onComplete, 200);
          }}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B6580] hover:text-[#7657F6] transition-colors py-1 px-3 rounded-full hover:bg-white border border-transparent hover:border-[#EAE6F5]"
        >
          Enter Gateway <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
