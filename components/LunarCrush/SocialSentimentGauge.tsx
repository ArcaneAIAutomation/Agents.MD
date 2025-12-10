/**
 * Social Sentiment Gauge Component
 * Displays Galaxy Score and sentiment indicators
 */

import React from "react";
import { useLunarCrushSentiment } from "../../hooks/useLunarCrush";

interface SocialSentimentGaugeProps {
  symbol: string;
}

export default function SocialSentimentGauge({ symbol }: SocialSentimentGaugeProps) {
  const { data, loading, error, refresh } = useLunarCrushSentiment(symbol);

  if (loading) {
    return (
      <div className="bitcoin-block">
        <div className="animate-pulse">
          <div className="h-6 bg-bitcoin-orange-20 rounded w-1/2 mb-4"></div>
          <div className="h-24 bg-bitcoin-orange-10 rounded mb-4"></div>
          <div className="h-4 bg-bitcoin-orange-20 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bitcoin-block border-2 border-bitcoin-white-60">
        <h3 className="text-bitcoin-white font-bold mb-2">Social Sentiment</h3>
        <p className="text-bitcoin-white-60 text-sm mb-3">
          {error}
        </p>
        <button
          onClick={refresh}
          className="bg-bitcoin-orange text-bitcoin-black px-4 py-2 rounded font-semibold hover:bg-bitcoin-black hover:text-bitcoin-orange border-2 border-bitcoin-orange transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bitcoin-block">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-bitcoin-white font-bold text-lg">Social Sentiment</h3>
        <button
          onClick={refresh}
          className="text-bitcoin-orange hover:text-bitcoin-white transition-colors text-sm"
          title="Refresh data"
        >
          🔄
        </button>
      </div>

      {/* Galaxy Score Gauge */}
      <div className="mb-6">
        <label className="text-bitcoin-white-60 text-xs uppercase tracking-wider mb-2 block">
          Galaxy Score™
        </label>
        <div className="relative h-6 bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-full overflow-hidden mb-2">
          <div
            className="absolute h-full bg-bitcoin-orange transition-all duration-1000 ease-out"
            style={{ width: `${data.galaxyScore}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-bitcoin-white text-xs font-bold mix-blend-difference">
              {data.galaxyScore.toFixed(1)}/100
            </span>
          </div>
        </div>
        <p className="text-bitcoin-orange font-mono text-3xl font-bold">
          {data.galaxyScore.toFixed(1)}
          <span className="text-bitcoin-white-60 text-lg ml-2">/100</span>
        </p>
      </div>

      {/* Sentiment Indicator */}
      <div className="mb-6">
        <label className="text-bitcoin-white-60 text-xs uppercase tracking-wider mb-2 block">
          Sentiment
        </label>
        <div className={`text-xl font-bold ${data.color} mb-1`}>
          {data.label}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-bitcoin-black border border-bitcoin-orange-20 rounded-full overflow-hidden">
            <div
              className={`h-full ${data.sentiment >= 50 ? 'bg-bitcoin-orange' : 'bg-bitcoin-white-60'} transition-all duration-1000`}
              style={{ width: `${data.sentiment}%` }}
            />
          </div>
          <span className="text-bitcoin-white font-mono text-sm">
            {data.sentiment}/100
          </span>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-bitcoin-white-60 text-xs uppercase tracking-wider block mb-1">
            Social Dominance
          </label>
          <p className="text-bitcoin-white font-mono text-lg font-bold">
            {data.socialDominance.toFixed(2)}%
          </p>
        </div>
        <div>
          <label className="text-bitcoin-white-60 text-xs uppercase tracking-wider block mb-1">
            AltRank
          </label>
          <p className="text-bitcoin-white font-mono text-lg font-bold">
            #{data.altRank}
          </p>
        </div>
      </div>

      {/* Interactions */}
      <div className="mt-4 pt-4 border-t border-bitcoin-orange-20">
        <label className="text-bitcoin-white-60 text-xs uppercase tracking-wider block mb-1">
          24h Interactions
        </label>
        <p className="text-bitcoin-orange font-mono text-xl font-bold">
          {(data.interactions24h / 1000000).toFixed(1)}M
        </p>
      </div>

      {/* Data Source */}
      <div className="mt-4 pt-4 border-t border-bitcoin-orange-20">
        <p className="text-bitcoin-white-60 text-xs">
          Data from{" "}
          <a
            href="https://lunarcrush.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-bitcoin-orange hover:text-bitcoin-white transition-colors underline"
          >
            LunarCrush
          </a>
          {" "}• Updated {new Date(data.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
