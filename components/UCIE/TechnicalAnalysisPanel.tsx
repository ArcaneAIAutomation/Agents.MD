/**
 * Technical Analysis Panel Component
 * Displays comprehensive technical indicators, multi-timeframe analysis,
 * support/resistance levels, and chart patterns
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TechnicalIndicator {
  name: string;
  value: string;
  signal: 'bullish' | 'bearish' | 'neutral';
  interpretation: string;
}

interface TimeframeSignal {
  timeframe: string;
  signal: 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';
  confidence: number;
}

interface PriceLevel {
  price: number;
  type: 'support' | 'resistance';
  strength: 'strong' | 'moderate' | 'weak';
  confidence: number;
}

interface ChartPattern {
  name: string;
  signal: 'bullish' | 'bearish';
  confidence: number;
  targetPrice: number | null;
  description: string;
}

interface TechnicalAnalysisPanelProps {
  symbol: string;
  data: {
    indicators: TechnicalIndicator[];
    multiTimeframe: {
      timeframes: TimeframeSignal[];
      overall: {
        signal: string;
        confidence: number;
        agreement: number;
      };
    };
    supportResistance: {
      levels: PriceLevel[];
      nearestSupport: PriceLevel | null;
      nearestResistance: PriceLevel | null;
    };
    patterns: ChartPattern[];
    aiInterpretation: {
      summary: string;
      explanation: string;
      tradingImplication: string;
      confidence: number;
    };
  };
  loading?: boolean;
}

export default function TechnicalAnalysisPanel({ symbol, data, loading }: TechnicalAnalysisPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    indicators: true,
    multiTimeframe: true,
    supportResistance: true,
    patterns: true,
    aiInterpretation: true
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (loading) {
    return (
      <div className="bitcoin-block">
        <div className="animate-pulse">
          <div className="h-8 bg-bitcoin-orange-20 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-bitcoin-orange-10 rounded"></div>
            <div className="h-4 bg-bitcoin-orange-10 rounded w-5/6"></div>
            <div className="h-4 bg-bitcoin-orange-10 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  const getSignalColor = (signal: string) => {
    if (signal.includes('buy') || signal === 'bullish') return 'text-bitcoin-orange';
    if (signal.includes('sell') || signal === 'bearish') return 'text-bitcoin-white-60';
    return 'text-bitcoin-white-80';
  };

  const getSignalIcon = (signal: string) => {
    if (signal.includes('buy') || signal === 'bullish') return <TrendingUp className="w-4 h-4" />;
    if (signal.includes('sell') || signal === 'bearish') return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  return (
    <div className="space-y-4">
      {/* AI Interpretation Summary */}
      <div className="bitcoin-block">
        <button
          onClick={() => toggleSection('aiInterpretation')}
          className="w-full flex items-center justify-between mb-4"
        >
          <h3 className="text-xl font-bold text-bitcoin-white">AI Technical Analysis</h3>
          {expandedSections.aiInterpretation ? (
            <ChevronUp className="w-5 h-5 text-bitcoin-orange" />
          ) : (
            <ChevronDown className="w-5 h-5 text-bitcoin-orange" />
          )}
        </button>

        {expandedSections.aiInterpretation && (
          <div className="space-y-4">
            <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-bitcoin-white-60 uppercase tracking-wider">
                  Summary
                </span>
                <span className="text-sm text-bitcoin-orange">
                  {data.aiInterpretation.confidence}% Confidence
                </span>
              </div>
              <p className="text-bitcoin-white-80 mb-3">{data.aiInterpretation.summary}</p>
              
              <div className="border-t border-bitcoin-orange-20 pt-3 mt-3">
                <p className="text-sm text-bitcoin-white-60 mb-2">Detailed Analysis:</p>
                <p className="text-bitcoin-white-80 text-sm">{data.aiInterpretation.explanation}</p>
              </div>

              <div className="border-t border-bitcoin-orange-20 pt-3 mt-3">
                <p className="text-sm text-bitcoin-white-60 mb-2">Trading Implication:</p>
                <p className="text-bitcoin-orange text-sm font-semibold">
                  {data.aiInterpretation.tradingImplication}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Technical Indicators */}
      <div className="bitcoin-block">
        <button
          onClick={() => toggleSection('indicators')}
          className="w-full flex items-center justify-between mb-4"
        >
          <h3 className="text-xl font-bold text-bitcoin-white">Technical Indicators</h3>
          {expandedSections.indicators ? (
            <ChevronUp className="w-5 h-5 text-bitcoin-orange" />
          ) : (
            <ChevronDown className="w-5 h-5 text-bitcoin-orange" />
          )}
        </button>

        {expandedSections.indicators && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.indicators.map((indicator, index) => (
              <div
                key={index}
                className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-3 hover:border-bitcoin-orange transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-bitcoin-white-60 uppercase tracking-wider">
                    {indicator.name}
                  </span>
                  <span className={`flex items-center gap-1 ${getSignalColor(indicator.signal)}`}>
                    {getSignalIcon(indicator.signal)}
                  </span>
                </div>
                <p className="font-mono text-lg font-bold text-bitcoin-white mb-2">
                  {indicator.value}
                </p>
                <p className="text-xs text-bitcoin-white-60">{indicator.interpretation}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Multi-Timeframe Analysis */}
      <div className="bitcoin-block">
        <button
          onClick={() => toggleSection('multiTimeframe')}
          className="w-full flex items-center justify-between mb-4"
        >
          <h3 className="text-xl font-bold text-bitcoin-white">Multi-Timeframe Consensus</h3>
          {expandedSections.multiTimeframe ? (
            <ChevronUp className="w-5 h-5 text-bitcoin-orange" />
          ) : (
            <ChevronDown className="w-5 h-5 text-bitcoin-orange" />
          )}
        </button>

        {expandedSections.multiTimeframe && (
          <div className="space-y-4">
            {/* Overall Consensus */}
            <div className="bg-bitcoin-orange text-bitcoin-black rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold uppercase tracking-wider">
                  Overall Signal
                </span>
                <span className="text-sm font-semibold">
                  {data.multiTimeframe.overall.agreement}% Agreement
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold uppercase">
                  {data.multiTimeframe.overall.signal.replace('_', ' ')}
                </span>
                <span className="text-sm">
                  ({data.multiTimeframe.overall.confidence}% confidence)
                </span>
              </div>
            </div>

            {/* Timeframe Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {data.multiTimeframe.timeframes.map((tf, index) => (
                <div
                  key={index}
                  className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-3 text-center"
                >
                  <div className="text-xs font-semibold text-bitcoin-white-60 uppercase mb-1">
                    {tf.timeframe}
                  </div>
                  <div className={`text-sm font-bold ${getSignalColor(tf.signal)} mb-1`}>
                    {tf.signal.replace('_', ' ').toUpperCase()}
                  </div>
                  <div className="text-xs text-bitcoin-white-60">
                    {tf.confidence}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Support & Resistance Levels */}
      <div className="bitcoin-block">
        <button
          onClick={() => toggleSection('supportResistance')}
          className="w-full flex items-center justify-between mb-4"
        >
          <h3 className="text-xl font-bold text-bitcoin-white">Support & Resistance</h3>
          {expandedSections.supportResistance ? (
            <ChevronUp className="w-5 h-5 text-bitcoin-orange" />
          ) : (
            <ChevronDown className="w-5 h-5 text-bitcoin-orange" />
          )}
        </button>

        {expandedSections.supportResistance && (
          <div className="space-y-4">
            {/* Nearest Levels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.supportResistance.nearestSupport && (
                <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-lg p-4">
                  <div className="text-sm font-semibold text-bitcoin-white-60 uppercase mb-2">
                    Nearest Support
                  </div>
                  <div className="font-mono text-2xl font-bold text-bitcoin-orange mb-1">
                    ${data.supportResistance.nearestSupport.price.toFixed(2)}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-bitcoin-white-60">
                      {data.supportResistance.nearestSupport.strength} strength
                    </span>
                    <span className="text-bitcoin-orange">
                      {data.supportResistance.nearestSupport.confidence}%
                    </span>
                  </div>
                </div>
              )}

              {data.supportResistance.nearestResistance && (
                <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-lg p-4">
                  <div className="text-sm font-semibold text-bitcoin-white-60 uppercase mb-2">
                    Nearest Resistance
                  </div>
                  <div className="font-mono text-2xl font-bold text-bitcoin-white mb-1">
                    ${data.supportResistance.nearestResistance.price.toFixed(2)}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-bitcoin-white-60">
                      {data.supportResistance.nearestResistance.strength} strength
                    </span>
                    <span className="text-bitcoin-orange">
                      {data.supportResistance.nearestResistance.confidence}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* All Levels */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-bitcoin-white-60 uppercase">All Levels</h4>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {data.supportResistance.levels.slice(0, 10).map((level, index) => (
                  <div
                    key={index}
                    className="bg-bitcoin-black border border-bitcoin-orange-20 rounded p-2 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-semibold uppercase ${
                        level.type === 'support' ? 'text-bitcoin-orange' : 'text-bitcoin-white-60'
                      }`}>
                        {level.type}
                      </span>
                      <span className="font-mono text-sm font-bold text-bitcoin-white">
                        ${level.price.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-bitcoin-white-60">{level.strength}</span>
                      <span className="text-xs text-bitcoin-orange">{level.confidence}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chart Patterns */}
      <div className="bitcoin-block">
        <button
          onClick={() => toggleSection('patterns')}
          className="w-full flex items-center justify-between mb-4"
        >
          <h3 className="text-xl font-bold text-bitcoin-white">Chart Patterns</h3>
          {expandedSections.patterns ? (
            <ChevronUp className="w-5 h-5 text-bitcoin-orange" />
          ) : (
            <ChevronDown className="w-5 h-5 text-bitcoin-orange" />
          )}
        </button>

        {expandedSections.patterns && (
          <div className="space-y-3">
            {data.patterns.length === 0 ? (
              <p className="text-bitcoin-white-60 text-center py-4">
                No chart patterns detected in current price action.
              </p>
            ) : (
              data.patterns.map((pattern, index) => (
                <div
                  key={index}
                  className={`bg-bitcoin-black border-2 rounded-lg p-4 ${
                    pattern.confidence >= 70
                      ? 'border-bitcoin-orange'
                      : 'border-bitcoin-orange-20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-bitcoin-white">
                        {pattern.name}
                      </span>
                      <span className={`flex items-center gap-1 ${getSignalColor(pattern.signal)}`}>
                        {getSignalIcon(pattern.signal)}
                      </span>
                    </div>
                    <span className="text-sm text-bitcoin-orange font-semibold">
                      {pattern.confidence}% confidence
                    </span>
                  </div>

                  <p className="text-sm text-bitcoin-white-80 mb-3">{pattern.description}</p>

                  {pattern.targetPrice && (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-bitcoin-white-60">Target: </span>
                        <span className="font-mono font-bold text-bitcoin-orange">
                          ${pattern.targetPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
