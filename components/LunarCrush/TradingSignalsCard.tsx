/**
 * Trading Signals Card Component
 * Displays sentiment-based trading signals
 */

import React from "react";
import { useLunarCrushSignals } from "../../hooks/useLunarCrush";

interface TradingSignalsCardProps {
  symbol: string;
}

// Get signal color based on type
function getSignalColor(type: string): string {
  switch (type) {
    case "BULLISH":
      return "text-bitcoin-orange";
    case "BEARISH":
      return "text-bitcoin-white-60";
    case "NEUTRAL":
      return "text-bitcoin-white";
    default:
      return "text-bitcoin-white";
  }
}

// Get signal icon
function getSignalIcon(type: string): string {
  switch (type) {
    case "BULLISH":
      return "📈";
    case "BEARISH":
      return "📉";
    case "NEUTRAL":
      return "➡️";
    default:
      return "❓";
  }
}

// Get confidence badge color
function getConfidenceBadge(confidence: string): { bg: string; text: string } {
  switch (confidence) {
    case "HIGH":
      return { bg: "bg-bitcoin-orange", text: "text-bitcoin-black" };
    case "MEDIUM":
      return { bg: "bg-bitcoin-orange-50", text: "text-bitcoin-white" };
    case "LOW":
      return { bg: "bg-bitcoin-orange-20", text: "text-bitcoin-white-60" };
    default:
      return { bg: "bg-bitcoin-orange-20", text: "text-bitcoin-white-60" };
  }
}

export default function TradingSignalsCard({ symbol }: TradingSignalsCardProps) {
  const { data, loading, error, refresh } = useLunarCrushSignals(symbol);

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
        <h3 className="text-bitcoin-white font-bold mb-2">Trading Signals</h3>
        <p className="text-bitcoin-white-60 text-sm mb-3">{error}</p>
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

  const confidenceBadge = getConfidenceBadge(data.confidence);

  return (
    <div className="bitcoin-block">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-bitcoin-white font-bold text-lg">Trading Signals</h3>
        <button
          onClick={refresh}
          className="text-bitcoin-orange hover:text-bitcoin-white transition-colors text-sm"
          title="Refresh signals"
        >
          🔄
        </button>
      </div>

      {/* Main Signal */}
      <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{getSignalIcon(data.type)}</span>
            <div>
              <div className={`text-2xl font-bold ${getSignalColor(data.type)}`}>
                {data.type}
              </div>
              <div className="text-bitcoin-white-60 text-sm">
                Based on social sentiment
              </div>
            </div>
          </div>
          <div className={`px-3 py-1 rounded font-semibold text-sm ${confidenceBadge.bg} ${confidenceBadge.text}`}>
            {data.confidence} CONFIDENCE
          </div>
        </div>

        {/* Signal Reason */}
        <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded p-3">
          <p className="text-bitcoin-white text-sm leading-relaxed">
            {data.reason}
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-3">
          <label className="text-bitcoin-white-60 text-xs uppercase tracking-wider block mb-1">
            Sentiment Score
          </label>
          <p className="text-bitcoin-orange font-mono text-2xl font-bold">
            {data.sentiment}/100
          </p>
        </div>
        <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-3">
          <label className="text-bitcoin-white-60 text-xs uppercase tracking-wider block mb-1">
            24h Price Change
          </label>
          <p className={`font-mono text-2xl font-bold ${data.priceChange24h >= 0 ? 'text-bitcoin-orange' : 'text-bitcoin-white-60'}`}>
            {data.priceChange24h >= 0 ? '+' : ''}{data.priceChange24h.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Galaxy Score */}
      <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-3 mb-4">
        <label className="text-bitcoin-white-60 text-xs uppercase tracking-wider block mb-2">
          Galaxy Score™
        </label>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-3 bg-bitcoin-black border border-bitcoin-orange-20 rounded-full overflow-hidden">
            <div
              className="h-full bg-bitcoin-orange transition-all duration-1000"
              style={{ width: `${data.galaxyScore}%` }}
            />
          </div>
          <span className="text-bitcoin-orange font-mono text-lg font-bold">
            {data.galaxyScore.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Signal Indicators */}
      <div className="space-y-2 mb-4">
        <h4 className="text-bitcoin-white font-semibold text-sm mb-2">
          Signal Indicators
        </h4>
        
        <div className="flex items-center justify-between bg-bitcoin-black border border-bitcoin-orange-20 rounded p-2">
          <span className="text-bitcoin-white-80 text-sm">Sentiment Divergence</span>
          <span className={`font-semibold text-sm ${data.indicators.sentimentDivergence ? 'text-bitcoin-orange' : 'text-bitcoin-white-60'}`}>
            {data.indicators.sentimentDivergence ? '✓ Active' : '✗ Inactive'}
          </span>
        </div>

        <div className="flex items-center justify-between bg-bitcoin-black border border-bitcoin-orange-20 rounded p-2">
          <span className="text-bitcoin-white-80 text-sm">Galaxy Score Breakout</span>
          <span className={`font-semibold text-sm ${data.indicators.galaxyScoreBreakout ? 'text-bitcoin-orange' : 'text-bitcoin-white-60'}`}>
            {data.indicators.galaxyScoreBreakout ? '✓ Active' : '✗ Inactive'}
          </span>
        </div>

        <div className="flex items-center justify-between bg-bitcoin-black border border-bitcoin-orange-20 rounded p-2">
          <span className="text-bitcoin-white-80 text-sm">Social Volume Spike</span>
          <span className={`font-semibold text-sm ${data.indicators.socialVolumeSpike ? 'text-bitcoin-orange' : 'text-bitcoin-white-60'}`}>
            {data.indicators.socialVolumeSpike ? '✓ Active' : '✗ Inactive'}
          </span>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-bitcoin-orange-10 border border-bitcoin-orange-20 rounded p-3 mb-4">
        <p className="text-bitcoin-white-60 text-xs leading-relaxed">
          ⚠️ <strong>Disclaimer:</strong> These signals are based on social sentiment analysis and should not be considered financial advice. Always conduct your own research and consult with financial professionals before making investment decisions.
        </p>
      </div>

      {/* Data Source */}
      <div className="pt-4 border-t border-bitcoin-orange-20">
        <p className="text-bitcoin-white-60 text-xs">
          Signals generated from{" "}
          <a
            href="https://lunarcrush.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-bitcoin-orange hover:text-bitcoin-white transition-colors underline"
          >
            LunarCrush
          </a>
          {" "}social data • Updated {new Date(data.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
