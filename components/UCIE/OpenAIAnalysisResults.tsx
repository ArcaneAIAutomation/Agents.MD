/**
 * OpenAI Analysis Results Component
 * 
 * Displays completed GPT-5.1 analysis results
 * Bitcoin Sovereign styling with orange accents
 */

import React from 'react';
import { Brain, TrendingUp, AlertCircle, Target, Shield, Lightbulb } from 'lucide-react';

interface OpenAISummaryResult {
  summary: string;
  confidence: number;
  key_insights?: string[];
  market_outlook?: string;
  risk_factors?: string[];
  opportunities?: string[];
  [key: string]: any;
}

interface OpenAIAnalysisResultsProps {
  result: OpenAISummaryResult;
  symbol: string;
  onReset: () => void;
}

export const OpenAIAnalysisResults: React.FC<OpenAIAnalysisResultsProps> = ({
  result,
  symbol,
  onReset,
}) => {
  // Confidence badge styling based on level
  const getConfidenceStyle = (confidence: number) => {
    if (confidence > 80) {
      return 'bg-bitcoin-orange text-bitcoin-black shadow-[0_0_20px_rgba(247,147,26,0.6)]';
    } else if (confidence >= 60) {
      return 'bg-bitcoin-orange text-bitcoin-black shadow-[0_0_15px_rgba(247,147,26,0.4)]';
    } else {
      return 'border-2 border-bitcoin-orange text-bitcoin-orange shadow-[0_0_10px_rgba(247,147,26,0.3)]';
    }
  };

  // ✅ FIX: Apply null safety to confidence
  const confidenceValue = result?.confidence ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Brain className="w-6 h-6 text-bitcoin-orange" />
          <h3 className="text-2xl font-bold text-bitcoin-white">
            ChatGPT 5.1 Analysis: {symbol}
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-4 py-2 rounded-lg font-bold text-sm uppercase font-mono ${getConfidenceStyle(confidenceValue)}`}>
            {confidenceValue}% Confidence
          </span>
          <button
            onClick={onReset}
            className="px-4 py-2 bg-transparent text-bitcoin-orange border-2 border-bitcoin-orange 
                     font-bold rounded-lg hover:bg-bitcoin-orange hover:text-bitcoin-black 
                     transition-all shadow-[0_0_15px_rgba(247,147,26,0.3)] 
                     hover:shadow-[0_0_25px_rgba(247,147,26,0.5)] hover:scale-105 active:scale-95 
                     min-h-[44px] uppercase text-sm"
          >
            New Analysis
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="p-6 bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl shadow-[0_0_20px_rgba(247,147,26,0.3)]">
        <h4 className="text-bitcoin-white font-bold text-lg mb-3 flex items-center gap-2">
          <Brain className="w-5 h-5 text-bitcoin-orange" />
          Executive Summary
        </h4>
        <p className="text-bitcoin-white-80 text-base leading-relaxed">
          {result.summary}
        </p>
      </div>

      {/* Key Insights */}
      {result.key_insights && result.key_insights.length > 0 && (
        <div className="p-6 bg-bitcoin-black border border-bitcoin-orange-20 rounded-xl">
          <h4 className="text-bitcoin-white font-bold text-lg mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-bitcoin-orange" />
            Key Insights
          </h4>
          <ul className="space-y-3">
            {result.key_insights.map((insight, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="text-bitcoin-orange font-bold flex-shrink-0 mt-1">•</span>
                <span className="text-bitcoin-white-80 text-sm leading-relaxed">{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Market Outlook */}
      {result.market_outlook && (
        <div className="p-6 bg-bitcoin-black border border-bitcoin-orange-20 rounded-xl">
          <h4 className="text-bitcoin-white font-bold text-lg mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-bitcoin-orange" />
            Market Outlook
          </h4>
          <p className="text-bitcoin-white-80 text-sm leading-relaxed">
            {result.market_outlook}
          </p>
        </div>
      )}

      {/* Two-Column Layout: Opportunities & Risk Factors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Opportunities */}
        {result.opportunities && result.opportunities.length > 0 && (
          <div className="p-6 bg-bitcoin-black border border-bitcoin-orange-20 rounded-xl">
            <h4 className="text-bitcoin-white font-bold text-lg mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-bitcoin-orange" />
              Opportunities
            </h4>
            <ul className="space-y-2">
              {result.opportunities.map((opportunity, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-bitcoin-orange font-bold flex-shrink-0">+</span>
                  <span className="text-bitcoin-white-80 text-sm">{opportunity}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Risk Factors */}
        {result.risk_factors && result.risk_factors.length > 0 && (
          <div className="p-6 bg-bitcoin-black border border-bitcoin-orange-20 rounded-xl">
            <h4 className="text-bitcoin-white font-bold text-lg mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-bitcoin-orange" />
              Risk Factors
            </h4>
            <ul className="space-y-2">
              {result.risk_factors.map((risk, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-bitcoin-orange font-bold flex-shrink-0">⚠</span>
                  <span className="text-bitcoin-white-80 text-sm">{risk}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Additional Fields (Dynamic) */}
      {Object.entries(result).map(([key, value]) => {
        // Skip already displayed fields
        if (['summary', 'confidence', 'key_insights', 'market_outlook', 'risk_factors', 'opportunities'].includes(key)) {
          return null;
        }

        // Display other fields
        if (typeof value === 'string' && value.length > 0) {
          return (
            <div key={key} className="p-6 bg-bitcoin-black border border-bitcoin-orange-20 rounded-xl">
              <h4 className="text-bitcoin-white font-bold text-lg mb-3 capitalize">
                {key.replace(/_/g, ' ')}
              </h4>
              <p className="text-bitcoin-white-80 text-sm leading-relaxed">{value}</p>
            </div>
          );
        }

        if (Array.isArray(value) && value.length > 0) {
          return (
            <div key={key} className="p-6 bg-bitcoin-black border border-bitcoin-orange-20 rounded-xl">
              <h4 className="text-bitcoin-white font-bold text-lg mb-4 capitalize">
                {key.replace(/_/g, ' ')}
              </h4>
              <ul className="space-y-2">
                {value.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-bitcoin-orange font-bold flex-shrink-0">•</span>
                    <span className="text-bitcoin-white-80 text-sm">{String(item)}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        }

        return null;
      })}

      {/* Footer Note */}
      <div className="p-4 bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg">
        <p className="text-bitcoin-white-60 text-xs text-center">
          Analysis powered by ChatGPT 5.1 (Latest) • Enhanced reasoning mode • Real-time market data
        </p>
      </div>
    </div>
  );
};
