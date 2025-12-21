/**
 * Derivatives Panel Component for UCIE
 * 
 * Displays derivatives market data including funding rates, open interest,
 * liquidations, and long/short ratios with Bitcoin Sovereign styling.
 * 
 * Features:
 * - Multi-exchange funding rates table
 * - Aggregated open interest with trends
 * - Liquidation heatmap
 * - Long/short ratio gauge
 * - Extreme condition alerts
 * - Mobile-first responsive design
 */

import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Activity,
  Zap,
  Target,
  BarChart3
} from 'lucide-react';

// Import types from our utilities
import type { FundingRateData, OpenInterestData, LiquidationData, LongShortRatio } from '../../lib/ucie/derivativesClients';
import type { FundingRateAnalysis } from '../../lib/ucie/fundingRateAnalysis';
import type { OpenInterestAnalysis } from '../../lib/ucie/openInterestTracking';
import type { LiquidationAnalysis } from '../../lib/ucie/liquidationDetection';
import type { LongShortAnalysis } from '../../lib/ucie/longShortAnalysis';

interface DerivativesPanelProps {
  symbol: string;
  fundingAnalysis: FundingRateAnalysis;
  openInterestAnalysis: OpenInterestAnalysis;
  liquidationAnalysis: LiquidationAnalysis;
  longShortAnalysis: LongShortAnalysis;
}

export default function DerivativesPanel({
  symbol,
  fundingAnalysis,
  openInterestAnalysis,
  liquidationAnalysis,
  longShortAnalysis
}: DerivativesPanelProps) {
  const [activeTab, setActiveTab] = useState<'funding' | 'oi' | 'liquidations' | 'longshort'>('funding');

  // Formatting helpers
  const formatFundingRate = (rate: number): string => {
    return `${(rate * 100).toFixed(4)}%`;
  };

  const formatOI = (value: number): string => {
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const formatPercent = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };

  const getRiskColor = (level: string): string => {
    switch (level) {
      case 'extreme': return 'text-bitcoin-orange';
      case 'high': return 'text-bitcoin-orange';
      case 'medium': return 'text-bitcoin-white';
      case 'low': return 'text-bitcoin-white-60';
      default: return 'text-bitcoin-white-60';
    }
  };

  const getSentimentColor = (sentiment: string): string => {
    if (sentiment.includes('bullish')) return 'text-bitcoin-orange';
    if (sentiment.includes('bearish')) return 'text-bitcoin-white-80';
    return 'text-bitcoin-white-60';
  };

  return (
    <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-bitcoin-white mb-1">
          Derivatives Market Data
        </h2>
        <p className="text-sm text-bitcoin-white-60">
          Funding rates, open interest, liquidations, and positioning for {symbol}
        </p>
      </div>

      {/* Overall Risk Alert */}
      {(fundingAnalysis?.riskLevel === 'extreme' || 
        (openInterestAnalysis?.confidence ?? 0) > 80 ||
        liquidationAnalysis?.riskLevel === 'extreme' ||
        (longShortAnalysis?.contrarianSignal?.confidence ?? 0) > 80) && (
        <div className="bg-bitcoin-orange bg-opacity-10 border border-bitcoin-orange rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-bitcoin-orange flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-bitcoin-orange mb-1">
              High Risk Conditions Detected
            </p>
            <p className="text-sm text-bitcoin-white-80">
              {fundingAnalysis.riskLevel === 'extreme' && 'Extreme funding rates detected. '}
              {liquidationAnalysis.riskLevel === 'extreme' && 'High liquidation risk present. '}
              {longShortAnalysis.contrarianSignal.confidence > 80 && 'Strong contrarian signal identified. '}
              Exercise caution with leveraged positions.
            </p>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-bitcoin-orange-20 pb-4">
        <button
          onClick={() => setActiveTab('funding')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            activeTab === 'funding'
              ? 'bg-bitcoin-orange text-bitcoin-black'
              : 'bg-transparent text-bitcoin-orange border border-bitcoin-orange hover:bg-bitcoin-orange hover:text-bitcoin-black'
          }`}
        >
          <Activity className="w-4 h-4 inline-block mr-2" />
          Funding Rates
        </button>
        <button
          onClick={() => setActiveTab('oi')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            activeTab === 'oi'
              ? 'bg-bitcoin-orange text-bitcoin-black'
              : 'bg-transparent text-bitcoin-orange border border-bitcoin-orange hover:bg-bitcoin-orange hover:text-bitcoin-black'
          }`}
        >
          <BarChart3 className="w-4 h-4 inline-block mr-2" />
          Open Interest
        </button>
        <button
          onClick={() => setActiveTab('liquidations')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            activeTab === 'liquidations'
              ? 'bg-bitcoin-orange text-bitcoin-black'
              : 'bg-transparent text-bitcoin-orange border border-bitcoin-orange hover:bg-bitcoin-orange hover:text-bitcoin-black'
          }`}
        >
          <Zap className="w-4 h-4 inline-block mr-2" />
          Liquidations
        </button>
        <button
          onClick={() => setActiveTab('longshort')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            activeTab === 'longshort'
              ? 'bg-bitcoin-orange text-bitcoin-black'
              : 'bg-transparent text-bitcoin-orange border border-bitcoin-orange hover:bg-bitcoin-orange hover:text-bitcoin-black'
          }`}
        >
          <Target className="w-4 h-4 inline-block mr-2" />
          Long/Short
        </button>
      </div>

      {/* Funding Rates Tab */}
      {activeTab === 'funding' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-lg p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-bitcoin-white-60 mb-1">
                Aggregated Rate
              </p>
              <p className="font-mono text-2xl font-bold text-bitcoin-orange">
                {formatFundingRate(fundingAnalysis.aggregatedRate)}
              </p>
            </div>
            <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-lg p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-bitcoin-white-60 mb-1">
                Market Sentiment
              </p>
              <p className={`text-xl font-bold ${getSentimentColor(fundingAnalysis.marketSentiment)}`}>
                {fundingAnalysis.marketSentiment.toUpperCase()}
              </p>
            </div>
            <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-lg p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-bitcoin-white-60 mb-1">
                Risk Level
              </p>
              <p className={`text-xl font-bold ${getRiskColor(fundingAnalysis.riskLevel)}`}>
                {fundingAnalysis.riskLevel.toUpperCase()}
              </p>
            </div>
          </div>

          {/* Extreme Rates Alert */}
          {fundingAnalysis.extremeRates.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-bitcoin-white">Extreme Funding Rates</h3>
              {fundingAnalysis.extremeRates.map((extreme, index) => (
                <div key={index} className="bg-bitcoin-orange bg-opacity-10 border border-bitcoin-orange rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-bitcoin-orange">{extreme.exchange}</span>
                    <span className="font-mono text-bitcoin-orange">{formatFundingRate(extreme.fundingRate)}</span>
                  </div>
                  <p className="text-sm text-bitcoin-white-80">{extreme.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* Mean Reversion Opportunities */}
          {fundingAnalysis.meanReversionOpportunities.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-bitcoin-white">Mean Reversion Opportunities</h3>
              {fundingAnalysis.meanReversionOpportunities.map((opp, index) => (
                <div key={index} className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-bitcoin-white">{opp.exchange}</span>
                    <span className="text-sm text-bitcoin-orange">{opp?.confidence ?? 0}% Confidence</span>
                  </div>
                  <p className="text-sm text-bitcoin-white-80 mb-2">{opp.reasoning}</p>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      opp.signal === 'long' ? 'bg-bitcoin-orange text-bitcoin-black' :
                      opp.signal === 'short' ? 'bg-bitcoin-white text-bitcoin-black' :
                      'bg-bitcoin-white-60 text-bitcoin-black'
                    }`}>
                      {opp.signal.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Funding Rates Table */}
          <div>
            <h3 className="text-lg font-bold text-bitcoin-white mb-3">Exchange Funding Rates</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-bitcoin-orange-20">
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-widest text-bitcoin-white-60">
                      Exchange
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-widest text-bitcoin-white-60">
                      Funding Rate
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-widest text-bitcoin-white-60">
                      Next Funding
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {fundingAnalysis.currentRates.map((rate, index) => (
                    <tr key={index} className="border-b border-bitcoin-orange-20 hover:bg-bitcoin-orange hover:bg-opacity-5 transition-colors">
                      <td className="py-3 px-4 font-semibold text-bitcoin-white">
                        {rate.exchange}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-bitcoin-orange">
                        {formatFundingRate(rate.fundingRate)}
                      </td>
                      <td className="py-3 px-4 text-right text-bitcoin-white-60 text-sm">
                        {new Date(rate.nextFundingTime).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Open Interest Tab */}
      {activeTab === 'oi' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-lg p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-bitcoin-white-60 mb-1">
                Total OI
              </p>
              <p className="font-mono text-2xl font-bold text-bitcoin-orange">
                {formatOI(openInterestAnalysis.totalOpenInterestValue)}
              </p>
            </div>
            <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-lg p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-bitcoin-white-60 mb-1">
                24h Change
              </p>
              {openInterestAnalysis.changes.find(c => c.period === '24h') && (
                <div className="flex items-center gap-2">
                  {openInterestAnalysis.changes.find(c => c.period === '24h')!.trend === 'increasing' ? (
                    <TrendingUp className="w-5 h-5 text-bitcoin-orange" />
                  ) : openInterestAnalysis.changes.find(c => c.period === '24h')!.trend === 'decreasing' ? (
                    <TrendingDown className="w-5 h-5 text-bitcoin-white-80" />
                  ) : null}
                  <p className="font-mono text-2xl font-bold text-bitcoin-white">
                    {formatPercent(openInterestAnalysis.changes.find(c => c.period === '24h')!.percentage)}
                  </p>
                </div>
              )}
            </div>
            <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-lg p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-bitcoin-white-60 mb-1">
                Market Signal
              </p>
              <p className={`text-xl font-bold ${getSentimentColor(openInterestAnalysis.marketSignal)}`}>
                {openInterestAnalysis.marketSignal.toUpperCase()}
              </p>
            </div>
          </div>

          {/* OI Spikes */}
          {openInterestAnalysis.spikes.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-bitcoin-white">Unusual OI Spikes</h3>
              {openInterestAnalysis.spikes.map((spike, index) => (
                <div key={index} className="bg-bitcoin-orange bg-opacity-10 border border-bitcoin-orange rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-bitcoin-orange">{spike.exchange}</span>
                    <span className="font-mono text-bitcoin-orange">{formatPercent(spike.changePercent)}</span>
                  </div>
                  <p className="text-sm text-bitcoin-white-80">{spike.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* OI by Exchange */}
          <div>
            <h3 className="text-lg font-bold text-bitcoin-white mb-3">Open Interest by Exchange</h3>
            <div className="space-y-3">
              {openInterestAnalysis.byExchange.map((ex, index) => (
                <div key={index} className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-bitcoin-white">{ex.exchange}</span>
                    <span className="font-mono text-bitcoin-orange">{formatOI(ex.openInterestValue)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-bitcoin-white-60">{formatPercent(ex.percentageOfTotal)} of total</span>
                    <span className={ex.change24hPercent > 0 ? 'text-bitcoin-orange' : 'text-bitcoin-white-80'}>
                      {ex.change24hPercent > 0 ? '+' : ''}{formatPercent(ex.change24hPercent)} (24h)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Liquidations Tab */}
      {activeTab === 'liquidations' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-lg p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-bitcoin-white-60 mb-1">
                24h Liquidations
              </p>
              <p className="font-mono text-2xl font-bold text-bitcoin-orange">
                {formatOI(liquidationAnalysis.totalValue24h)}
              </p>
            </div>
            <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-lg p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-bitcoin-white-60 mb-1">
                Long/Short Ratio
              </p>
              <p className="font-mono text-2xl font-bold text-bitcoin-white">
                {formatPercent(liquidationAnalysis.longLiquidationRatio * 100)} / {formatPercent(liquidationAnalysis.shortLiquidationRatio * 100)}
              </p>
            </div>
            <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-lg p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-bitcoin-white-60 mb-1">
                Risk Level
              </p>
              <p className={`text-xl font-bold ${getRiskColor(liquidationAnalysis.riskLevel)}`}>
                {liquidationAnalysis.riskLevel.toUpperCase()}
              </p>
            </div>
          </div>

          {/* Cascade Potentials */}
          {liquidationAnalysis.heatmap.cascadePotentials.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-bitcoin-white">Cascade Liquidation Risk</h3>
              {liquidationAnalysis.heatmap.cascadePotentials.map((cascade, index) => (
                <div key={index} className="bg-bitcoin-orange bg-opacity-10 border border-bitcoin-orange rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-bitcoin-orange">
                      ${cascade.triggerPrice.toFixed(2)} ({cascade.direction.toUpperCase()})
                    </span>
                    <span className="text-sm text-bitcoin-orange">{cascade.probability}% Probability</span>
                  </div>
                  <p className="text-sm text-bitcoin-white-80 mb-2">{cascade.description}</p>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      cascade.impactLevel === 'extreme' ? 'bg-bitcoin-orange text-bitcoin-black' :
                      cascade.impactLevel === 'high' ? 'bg-bitcoin-white text-bitcoin-black' :
                      'bg-bitcoin-white-60 text-bitcoin-black'
                    }`}>
                      {cascade.impactLevel.toUpperCase()} IMPACT
                    </span>
                    {cascade.chainReaction && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-bitcoin-orange text-bitcoin-black">
                        CHAIN REACTION
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recommendation */}
          {liquidationAnalysis.recommendation && (
            <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
              <h3 className="text-lg font-bold text-bitcoin-white mb-2">Recommendation</h3>
              <p className="text-sm text-bitcoin-white-80">{liquidationAnalysis.recommendation}</p>
            </div>
          )}
        </div>
      )}

      {/* Long/Short Tab */}
      {activeTab === 'longshort' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-lg p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-bitcoin-white-60 mb-1">
                Long Ratio
              </p>
              <p className="font-mono text-2xl font-bold text-bitcoin-orange">
                {formatPercent(longShortAnalysis.aggregated.longRatio * 100)}
              </p>
            </div>
            <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-lg p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-bitcoin-white-60 mb-1">
                Market Sentiment
              </p>
              <p className={`text-xl font-bold ${getSentimentColor(longShortAnalysis.marketSentiment)}`}>
                {longShortAnalysis.marketSentiment.replace('_', ' ').toUpperCase()}
              </p>
            </div>
            <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-lg p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-bitcoin-white-60 mb-1">
                Crowdedness
              </p>
              <p className="text-xl font-bold text-bitcoin-white">
                {longShortAnalysis.crowdedness.replace('_', ' ').toUpperCase()}
              </p>
            </div>
          </div>

          {/* Contrarian Signal */}
          {longShortAnalysis?.contrarianSignal?.signal !== 'neutral' && (
            <div className="bg-bitcoin-orange bg-opacity-10 border border-bitcoin-orange rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-bitcoin-orange">
                  {longShortAnalysis?.contrarianSignal?.signal?.replace('_', ' ').toUpperCase()}
                </span>
                <span className="text-sm text-bitcoin-orange">
                  {longShortAnalysis?.contrarianSignal?.confidence ?? 0}% Confidence
                </span>
              </div>
              <p className="text-sm text-bitcoin-white-80 mb-3">{longShortAnalysis.contrarianSignal.reasoning}</p>
              {longShortAnalysis.contrarianSignal.targetEntry && (
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-bitcoin-white-60 mb-1">Entry</p>
                    <p className="font-mono text-bitcoin-white">${longShortAnalysis.contrarianSignal.targetEntry.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-bitcoin-white-60 mb-1">Stop Loss</p>
                    <p className="font-mono text-bitcoin-white">${longShortAnalysis.contrarianSignal.stopLoss?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-bitcoin-white-60 mb-1">Take Profit</p>
                    <p className="font-mono text-bitcoin-white">${longShortAnalysis.contrarianSignal.takeProfit?.toFixed(2)}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Extreme Positioning */}
          {longShortAnalysis.extremePositioning.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-bitcoin-white">Extreme Positioning</h3>
              {longShortAnalysis.extremePositioning.map((extreme, index) => (
                <div key={index} className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-bitcoin-white">{extreme.exchange}</span>
                    <span className="font-mono text-bitcoin-orange">
                      {formatPercent(extreme.longRatio * 100)} Long
                    </span>
                  </div>
                  <p className="text-sm text-bitcoin-white-80">{extreme.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* Recommendation */}
          {longShortAnalysis.recommendation && (
            <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
              <h3 className="text-lg font-bold text-bitcoin-white mb-2">Recommendation</h3>
              <p className="text-sm text-bitcoin-white-80">{longShortAnalysis.recommendation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
