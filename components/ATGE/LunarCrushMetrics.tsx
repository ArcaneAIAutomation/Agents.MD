/**
 * LunarCrush Metrics Component
 * Bitcoin Sovereign Technology - AI Trade Generation Engine
 * 
 * Displays comprehensive LunarCrush social intelligence metrics
 * BITCOIN ONLY - This component is designed exclusively for Bitcoin analytics
 */

import React from 'react';

interface LunarCrushMetricsProps {
  data: {
    galaxyScore: number;
    altRank: number;
    socialDominance: number;
    sentimentPositive: number;
    sentimentNegative: number;
    sentimentNeutral: number;
    socialVolume24h: number;
    socialPosts24h: number;
    socialInteractions24h: number;
    socialContributors24h: number;
    correlationScore: number;
  };
  className?: string;
}

export default function LunarCrushMetrics({ data, className = '' }: LunarCrushMetricsProps) {
  const getGalaxyScoreColor = (score: number) => {
    if (score >= 70) return 'text-bitcoin-orange';
    if (score >= 50) return 'text-bitcoin-white';
    return 'text-bitcoin-white-60';
  };

  return (
    <div className={`bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6 ${className}`}>
      <h3 className="text-2xl font-bold text-bitcoin-white mb-6">
        Bitcoin Social Intelligence (LunarCrush)
      </h3>

      {/* Galaxy Score */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-lg font-bold text-bitcoin-white">Galaxy Score</h4>
          <span className={`text-3xl font-mono font-bold ${getGalaxyScoreColor(data.galaxyScore)}`}>
            {data.galaxyScore}/100
          </span>
        </div>
        <div className="w-full bg-bitcoin-black border border-bitcoin-orange-20 rounded-full h-4">
          <div 
            className="bg-bitcoin-orange h-full rounded-full transition-all duration-500"
            style={{ width: `${data.galaxyScore}%` }}
          ></div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-bitcoin-white-60 mb-1">
            AltRank
          </p>
          <p className="font-mono text-2xl font-bold text-bitcoin-white">
            #{data.altRank}
          </p>
        </div>

        <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-bitcoin-white-60 mb-1">
            Social Dominance
          </p>
          <p className="font-mono text-2xl font-bold text-bitcoin-orange">
            {data.socialDominance.toFixed(2)}%
          </p>
        </div>

        <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-bitcoin-white-60 mb-1">
            Correlation Score
          </p>
          <p className="font-mono text-2xl font-bold text-bitcoin-white">
            {data.correlationScore.toFixed(2)}
          </p>
        </div>

        <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-bitcoin-white-60 mb-1">
            24h Social Volume
          </p>
          <p className="font-mono text-2xl font-bold text-bitcoin-white">
            {data.socialVolume24h.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Sentiment Distribution */}
      <div className="mb-6">
        <h4 className="text-lg font-bold text-bitcoin-white mb-4">Sentiment Distribution</h4>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm text-bitcoin-white-60">Positive</span>
              <span className="text-sm font-mono text-bitcoin-orange">{data.sentimentPositive.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-bitcoin-black border border-bitcoin-orange-20 rounded-full h-2">
              <div 
                className="bg-bitcoin-orange h-full rounded-full"
                style={{ width: `${data.sentimentPositive}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm text-bitcoin-white-60">Negative</span>
              <span className="text-sm font-mono text-bitcoin-white">{data.sentimentNegative.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-bitcoin-black border border-bitcoin-orange-20 rounded-full h-2">
              <div 
                className="bg-bitcoin-white-60 h-full rounded-full"
                style={{ width: `${data.sentimentNegative}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm text-bitcoin-white-60">Neutral</span>
              <span className="text-sm font-mono text-bitcoin-white-60">{data.sentimentNeutral.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-bitcoin-black border border-bitcoin-orange-20 rounded-full h-2">
              <div 
                className="bg-bitcoin-white-20 h-full rounded-full"
                style={{ width: `${data.sentimentNeutral}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Social Activity */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-xs text-bitcoin-white-60 mb-1">Posts</p>
          <p className="font-mono text-lg font-bold text-bitcoin-white">
            {data.socialPosts24h.toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-bitcoin-white-60 mb-1">Interactions</p>
          <p className="font-mono text-lg font-bold text-bitcoin-white">
            {data.socialInteractions24h.toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-bitcoin-white-60 mb-1">Contributors</p>
          <p className="font-mono text-lg font-bold text-bitcoin-white">
            {data.socialContributors24h.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
