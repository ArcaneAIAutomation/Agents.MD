import React from 'react';
import HelpButton from './HelpButton';

interface SimplifiedMetric {
  label: string;
  value: string | number;
  helpKey: string;
  highlight?: boolean;
}

interface SimplifiedAnalysisViewProps {
  symbol: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
  sentimentScore: number;
  riskScore: number;
  recommendation: string;
  confidence: number;
  topFindings: string[];
  onSwitchToAdvanced: () => void;
}

export default function SimplifiedAnalysisView({
  symbol,
  price,
  change24h,
  marketCap,
  volume24h,
  sentimentScore,
  riskScore,
  recommendation,
  confidence,
  topFindings,
  onSwitchToAdvanced
}: SimplifiedAnalysisViewProps) {
  const formatPrice = (value: number) => {
    if (value >= 1) return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return `$${value.toFixed(6)}`;
  };

  const formatLargeNumber = (value: number) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const getRecommendationColor = (rec: string) => {
    if (rec.includes('Buy')) return 'text-bitcoin-orange';
    if (rec.includes('Sell')) return 'text-bitcoin-white-60';
    return 'text-bitcoin-white';
  };

  const getSentimentLabel = (score: number) => {
    if (score >= 60) return 'Very Bullish';
    if (score >= 20) return 'Bullish';
    if (score >= -20) return 'Neutral';
    if (score >= -60) return 'Bearish';
    return 'Very Bearish';
  };

  const getRiskLabel = (score: number) => {
    if (score >= 75) return 'Very High Risk';
    if (score >= 50) return 'High Risk';
    if (score >= 25) return 'Medium Risk';
    return 'Low Risk';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-bitcoin-white">
            {symbol} Analysis Summary
          </h2>
          <button
            onClick={onSwitchToAdvanced}
            className="text-sm text-bitcoin-orange hover:text-bitcoin-white transition-colors flex items-center gap-2"
          >
            Switch to Advanced
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Price */}
        <div className="mb-6">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-4xl font-bold text-bitcoin-orange [text-shadow:0_0_30px_rgba(247,147,26,0.5)]">
              {formatPrice(price)}
            </span>
            <span className={`text-xl font-semibold ${change24h >= 0 ? 'text-bitcoin-orange' : 'text-bitcoin-white-60'}`}>
              {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
            </span>
          </div>
          <p className="text-sm text-bitcoin-white-60 mt-1">24h Change</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs text-bitcoin-white-60 uppercase tracking-wider">Market Cap</p>
              <HelpButton metricKey="marketCap" size="sm" />
            </div>
            <p className="font-mono text-xl font-bold text-bitcoin-white">
              {formatLargeNumber(marketCap)}
            </p>
          </div>

          <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs text-bitcoin-white-60 uppercase tracking-wider">24h Volume</p>
              <HelpButton metricKey="volume24h" size="sm" />
            </div>
            <p className="font-mono text-xl font-bold text-bitcoin-white">
              {formatLargeNumber(volume24h)}
            </p>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div className="bg-bitcoin-orange text-bitcoin-black rounded-xl p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-bold">Our Recommendation</h3>
          <span className="text-sm font-semibold bg-bitcoin-black text-bitcoin-orange px-3 py-1 rounded-full">
            {confidence}% Confidence
          </span>
        </div>
        <p className={`text-3xl font-bold mb-2 ${getRecommendationColor(recommendation)}`}>
          {recommendation}
        </p>
        <p className="text-sm opacity-80">
          Based on comprehensive analysis of market data, technical indicators, sentiment, and on-chain metrics.
        </p>
      </div>

      {/* Sentiment & Risk */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-lg font-bold text-bitcoin-white">Market Sentiment</h3>
            <HelpButton metricKey="sentimentScore" size="sm" />
          </div>
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-3xl font-bold text-bitcoin-orange">
              {sentimentScore > 0 ? '+' : ''}{sentimentScore}
            </span>
            <span className="text-lg text-bitcoin-white-80">
              {getSentimentLabel(sentimentScore)}
            </span>
          </div>
          <div className="w-full bg-bitcoin-white-60 bg-opacity-20 rounded-full h-2 mt-3">
            <div
              className="bg-bitcoin-orange h-2 rounded-full transition-all"
              style={{ width: `${((sentimentScore + 100) / 200) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-lg font-bold text-bitcoin-white">Risk Level</h3>
            <HelpButton metricKey="riskScore" size="sm" />
          </div>
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-3xl font-bold text-bitcoin-white">
              {riskScore}/100
            </span>
            <span className="text-lg text-bitcoin-white-80">
              {getRiskLabel(riskScore)}
            </span>
          </div>
          <div className="w-full bg-bitcoin-white-60 bg-opacity-20 rounded-full h-2 mt-3">
            <div
              className="bg-bitcoin-white h-2 rounded-full transition-all"
              style={{ width: `${riskScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Top Findings */}
      <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6">
        <h3 className="text-xl font-bold text-bitcoin-white mb-4">
          Key Findings
        </h3>
        <ul className="space-y-3">
          {topFindings.map((finding, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-bitcoin-orange text-bitcoin-black flex items-center justify-center text-sm font-bold">
                {index + 1}
              </span>
              <p className="text-bitcoin-white-80 leading-relaxed">
                {finding}
              </p>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-xl p-6 text-center">
        <p className="text-bitcoin-white-80 mb-4">
          Want to see detailed technical analysis, on-chain metrics, and AI predictions?
        </p>
        <button
          onClick={onSwitchToAdvanced}
          className="bg-bitcoin-orange text-bitcoin-black px-6 py-3 rounded-lg font-bold hover:bg-bitcoin-black hover:text-bitcoin-orange hover:border-2 hover:border-bitcoin-orange transition-all"
        >
          Switch to Advanced Mode
        </button>
      </div>
    </div>
  );
}
