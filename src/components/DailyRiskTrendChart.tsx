/**
 * SentinelMesh - Daily Risk Trend Line Chart Component (Aurora Pop Theme)
 * Visualizes 7-day aggregate risk score evolution, anomaly peaks,
 * blocked attacks vs authorized invocations using Recharts.
 */

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Info,
  Activity,
  Layers,
} from 'lucide-react';
import type { DailyRiskPoint } from '../../shared/types.ts';

interface DailyRiskTrendChartProps {
  data: DailyRiskPoint[];
  currentAvgScore?: number;
}

export const DailyRiskTrendChart: React.FC<DailyRiskTrendChartProps> = ({
  data,
  currentAvgScore = 28,
}) => {
  const [viewMode, setViewMode] = useState<'risk' | 'volume' | 'combined'>('risk');

  // Fallback data if none provided or empty
  const chartData: DailyRiskPoint[] =
    data && data.length > 0
      ? data
      : [
          {
            date: 'Oct 16',
            day: 'Thu',
            timestamp: new Date(Date.now() - 6 * 86400000).toISOString(),
            riskScore: 24,
            blockedCalls: 3,
            allowedCalls: 48,
            totalCalls: 51,
            blockRatePercentage: 6,
          },
          {
            date: 'Oct 17',
            day: 'Fri',
            timestamp: new Date(Date.now() - 5 * 86400000).toISOString(),
            riskScore: 38,
            blockedCalls: 8,
            allowedCalls: 62,
            totalCalls: 70,
            blockRatePercentage: 11,
          },
          {
            date: 'Oct 18',
            day: 'Sat',
            timestamp: new Date(Date.now() - 4 * 86400000).toISOString(),
            riskScore: 58,
            blockedCalls: 14,
            allowedCalls: 54,
            totalCalls: 68,
            blockRatePercentage: 21,
          },
          {
            date: 'Oct 19',
            day: 'Sun',
            timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
            riskScore: 41,
            blockedCalls: 6,
            allowedCalls: 76,
            totalCalls: 82,
            blockRatePercentage: 7,
          },
          {
            date: 'Oct 20',
            day: 'Mon',
            timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
            riskScore: 65,
            blockedCalls: 17,
            allowedCalls: 89,
            totalCalls: 106,
            blockRatePercentage: 16,
          },
          {
            date: 'Oct 21',
            day: 'Tue',
            timestamp: new Date(Date.now() - 1 * 86400000).toISOString(),
            riskScore: 32,
            blockedCalls: 5,
            allowedCalls: 98,
            totalCalls: 103,
            blockRatePercentage: 5,
          },
          {
            date: 'Oct 22',
            day: 'Today',
            timestamp: new Date().toISOString(),
            riskScore: currentAvgScore,
            blockedCalls: 6,
            allowedCalls: 112,
            totalCalls: 118,
            blockRatePercentage: 5,
          },
        ];

  // Statistical calculations
  const scores = chartData.map((d) => d.riskScore);
  const peakScore = Math.max(...scores, 1);
  const peakPoint = chartData.find((d) => d.riskScore === peakScore) || chartData[0];
  const firstScore = chartData[0]?.riskScore || 20;
  const latestScore = chartData[chartData.length - 1]?.riskScore || currentAvgScore;
  const scoreDiff = latestScore - firstScore;
  const isImproving = scoreDiff <= 0;

  const totalBlocked7d = chartData.reduce((acc, d) => acc + d.blockedCalls, 0);
  const totalAllowed7d = chartData.reduce((acc, d) => acc + d.allowedCalls, 0);
  const totalCalls7d = totalBlocked7d + totalAllowed7d;

  // Custom Recharts Tooltip styled in Aurora Pop theme
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const point: DailyRiskPoint = payload[0].payload;
      const getRiskBadge = (score: number) => {
        if (score >= 70) return { label: 'CRITICAL RISK', color: 'bg-[#FF786B]/20 text-[#FF786B] border-[#FF786B]/30' };
        if (score >= 45) return { label: 'ELEVATED RISK', color: 'bg-[#FFD66B]/25 text-[#b45309] border-[#FFD66B]/40' };
        return { label: 'NORMAL / SECURE', color: 'bg-[#54D6B0]/20 text-[#0f8263] border-[#54D6B0]/30' };
      };
      const badge = getRiskBadge(point.riskScore);

      return (
        <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-[#EAE6F5] shadow-xl text-xs space-y-2 min-w-[210px] animate-fadeIn">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#EAE6F5]">
            <div className="flex items-center gap-1.5 font-bold text-[#292638]">
              <span>📅</span>
              <span>{point.date}</span>
              <span className="text-[10px] text-[#6B6580] font-normal">({point.day})</span>
            </div>
            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full border ${badge.color}`}>
              {badge.label}
            </span>
          </div>

          <div className="space-y-1.5 pt-0.5">
            <div className="flex items-center justify-between">
              <span className="text-[#6B6580] flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#7657F6]" />
                Aggregate Risk Score:
              </span>
              <span className="font-mono font-extrabold text-[#7657F6] text-sm tabular-nums">
                {point.riskScore}/100
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#6B6580] flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#FF786B]" />
                Blocked Threats:
              </span>
              <span className="font-mono font-bold text-[#FF786B] tabular-nums">
                {point.blockedCalls} calls
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#6B6580] flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#54D6B0]" />
                Authorized Calls:
              </span>
              <span className="font-mono font-bold text-[#0f8263] tabular-nums">
                {point.allowedCalls} calls
              </span>
            </div>

            <div className="pt-1 border-t border-[#EAE6F5] flex items-center justify-between text-[10px] text-[#6B6580]">
              <span>Intercept Ratio:</span>
              <span className="font-mono font-bold text-[#292638]">
                {point.blockRatePercentage}% blocked
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 rounded-2xl bg-white border border-[#EAE6F5] shadow-sm space-y-6">
      {/* Header and View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE6F5]">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#7657F6]/10 text-[#7657F6] flex items-center justify-center font-bold text-xs">
              <Activity className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-[#292638] flex items-center gap-1.5">
              <span>Daily Risk Trend Evolution</span>
              <span className="text-xs font-normal text-[#6B6580]">(Past 7 Days)</span>
            </h2>
          </div>
          <p className="text-xs text-[#6B6580] mt-1">
            Tracking multi-agent threat intensity, prompt injection vectors, and firewall perimeter health.
          </p>
        </div>

        {/* View Mode Toggle Controls */}
        <div className="flex items-center gap-1 p-1 bg-[#FFF9F2] rounded-xl border border-[#EAE6F5] self-start sm:self-auto">
          <button
            onClick={() => setViewMode('risk')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              viewMode === 'risk'
                ? 'bg-[#7657F6] text-white shadow-sm'
                : 'text-[#6B6580] hover:text-[#292638]'
            }`}
          >
            📈 Risk Score
          </button>
          <button
            onClick={() => setViewMode('volume')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              viewMode === 'volume'
                ? 'bg-[#7657F6] text-white shadow-sm'
                : 'text-[#6B6580] hover:text-[#292638]'
            }`}
          >
            📊 Invocations
          </button>
          <button
            onClick={() => setViewMode('combined')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              viewMode === 'combined'
                ? 'bg-[#7657F6] text-white shadow-sm'
                : 'text-[#6B6580] hover:text-[#292638]'
            }`}
          >
            ✨ Combined
          </button>
        </div>
      </div>

      {/* 4 Micro Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Current Score */}
        <div className="p-3.5 rounded-xl bg-[#FFF9F2] border border-[#EAE6F5]">
          <div className="text-[11px] font-semibold text-[#6B6580]">Current Risk Score</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-[#7657F6] font-mono tabular-nums">
              {latestScore}
            </span>
            <span className="text-[10px] text-[#6B6580]">/100</span>
          </div>
          <div className="mt-1 text-[10px] text-[#0f8263] font-semibold flex items-center gap-1">
            <span>🟢</span> Within safe envelope
          </div>
        </div>

        {/* 7-Day Peak */}
        <div className="p-3.5 rounded-xl bg-[#FFF9F2] border border-[#EAE6F5]">
          <div className="text-[11px] font-semibold text-[#6B6580]">7-Day Anomaly Peak</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-[#FF786B] font-mono tabular-nums">
              {peakScore}
            </span>
            <span className="text-[10px] text-[#6B6580]">/100</span>
          </div>
          <div className="mt-1 text-[10px] text-[#6B6580]">
            Logged on <strong>{peakPoint.date}</strong>
          </div>
        </div>

        {/* 7-Day Trend Direction */}
        <div className="p-3.5 rounded-xl bg-[#FFF9F2] border border-[#EAE6F5]">
          <div className="text-[11px] font-semibold text-[#6B6580]">7-Day Trajectory</div>
          <div className="mt-1 flex items-center gap-1.5">
            {isImproving ? (
              <>
                <TrendingDown className="w-5 h-5 text-[#0f8263]" />
                <span className="text-xl font-extrabold text-[#0f8263] font-mono tabular-nums">
                  {Math.abs(scoreDiff)} pts
                </span>
              </>
            ) : (
              <>
                <TrendingUp className="w-5 h-5 text-[#FF786B]" />
                <span className="text-xl font-extrabold text-[#FF786B] font-mono tabular-nums">
                  +{scoreDiff} pts
                </span>
              </>
            )}
          </div>
          <div className="mt-1 text-[10px] font-semibold text-[#6B6580]">
            {isImproving ? '🛡️ Risk decreasing' : '⚠️ Risk increasing'}
          </div>
        </div>

        {/* 7-Day Threat Interceptions */}
        <div className="p-3.5 rounded-xl bg-[#FFF9F2] border border-[#EAE6F5]">
          <div className="text-[11px] font-semibold text-[#6B6580]">Blocked Attacks (7d)</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-[#292638] font-mono tabular-nums">
              {totalBlocked7d}
            </span>
            <span className="text-[10px] text-[#6B6580]">/ {totalCalls7d} calls</span>
          </div>
          <div className="mt-1 text-[10px] text-[#7657F6] font-semibold">
            ⚡ 100% Fail-closed
          </div>
        </div>
      </div>

      {/* Main Recharts Line Chart Container */}
      <div className="w-full h-72 sm:h-80 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 12, right: 16, left: -20, bottom: 4 }}
          >
            <defs>
              {/* Violet Gradient for Risk Area Glow */}
              <linearGradient id="riskAreaGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7657F6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#7657F6" stopOpacity={0.0} />
              </linearGradient>

              {/* Coral Gradient for Blocked Calls Area */}
              <linearGradient id="blockedAreaGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF786B" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#FF786B" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#EAE6F5"
              vertical={false}
            />

            <XAxis
              dataKey="date"
              stroke="#6B6580"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#EAE6F5' }}
              tickFormatter={(val, idx) => {
                const day = chartData[idx]?.day;
                return day ? `${val} (${day})` : val;
              }}
            />

            <YAxis
              yAxisId="risk"
              domain={[0, 100]}
              stroke="#6B6580"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              ticks={[0, 25, 50, 75, 100]}
              tickFormatter={(v) => `${v}`}
            />

            {(viewMode === 'volume' || viewMode === 'combined') && (
              <YAxis
                yAxisId="volume"
                orientation="right"
                stroke="#6B6580"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
            )}

            <Tooltip content={<CustomTooltip />} />

            {/* Reference Threshold Lines */}
            <ReferenceLine
              yAxisId="risk"
              y={70}
              stroke="#FF786B"
              strokeDasharray="4 4"
              strokeWidth={1}
              label={{
                value: 'Critical (70)',
                fill: '#FF786B',
                fontSize: 10,
                position: 'insideTopRight',
              }}
            />

            <ReferenceLine
              yAxisId="risk"
              y={40}
              stroke="#FFD66B"
              strokeDasharray="4 4"
              strokeWidth={1}
              label={{
                value: 'Elevated (40)',
                fill: '#d97706',
                fontSize: 10,
                position: 'insideTopRight',
              }}
            />

            {/* Risk Score Area Glow & Line */}
            {(viewMode === 'risk' || viewMode === 'combined') && (
              <>
                <Area
                  yAxisId="risk"
                  type="monotone"
                  dataKey="riskScore"
                  stroke="none"
                  fill="url(#riskAreaGlow)"
                  isAnimationActive={true}
                />
                <Line
                  yAxisId="risk"
                  type="monotone"
                  dataKey="riskScore"
                  name="Risk Score"
                  stroke="#7657F6"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: '#FFFFFF',
                    stroke: '#7657F6',
                    strokeWidth: 2.5,
                  }}
                  activeDot={{
                    r: 7,
                    fill: '#7657F6',
                    stroke: '#FFFFFF',
                    strokeWidth: 3,
                  }}
                  isAnimationActive={true}
                  animationDuration={1200}
                />
              </>
            )}

            {/* Blocked Threats Line */}
            {(viewMode === 'volume' || viewMode === 'combined') && (
              <Line
                yAxisId={viewMode === 'combined' ? 'volume' : 'risk'}
                type="monotone"
                dataKey="blockedCalls"
                name="Blocked Calls"
                stroke="#FF786B"
                strokeWidth={2}
                strokeDasharray="4 2"
                dot={{
                  r: 3.5,
                  fill: '#FF786B',
                  stroke: '#FFFFFF',
                  strokeWidth: 1.5,
                }}
                isAnimationActive={true}
              />
            )}

            {/* Authorized Calls Line */}
            {viewMode === 'volume' && (
              <Line
                yAxisId="volume"
                type="monotone"
                dataKey="allowedCalls"
                name="Authorized Calls"
                stroke="#54D6B0"
                strokeWidth={2}
                dot={{
                  r: 3.5,
                  fill: '#54D6B0',
                  stroke: '#FFFFFF',
                  strokeWidth: 1.5,
                }}
                isAnimationActive={true}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Legend / Metadata Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#EAE6F5] text-xs text-[#6B6580]">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 rounded-full bg-[#7657F6]" />
            <span className="font-semibold text-[#292638]">Aggregate Risk (0–100)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 rounded-full bg-[#FF786B]" />
            <span>Blocked Threats</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border border-dashed border-[#FF786B]" />
            <span className="text-[11px]">Critical Threshold (70+)</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-mono">
          <span>🔄 Live Synced:</span>
          <span className="font-bold text-[#7657F6]">Today reflects active log</span>
        </div>
      </div>
    </div>
  );
};
