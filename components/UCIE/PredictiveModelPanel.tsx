/**
 * Predictive Model Panel Component
 * 
 * Displays AI-powered price predictions with confidence intervals,
 * historical pattern matches, scenario analysis, and model accuracy metrics
 */

import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Target, BarChart3, AlertCircle, CheckCircle } from 'lucide-react';
import type { PredictionResult } from '../../lib/ucie/pricePrediction';
import type { PatternMatchingResult } from '../../lib/ucie/patternMatching';
import type { ScenarioAnalysis } from '../../lib/ucie/scenarioAnalysis';
import type { ModelPerformance } from '../../lib/ucie/modelAccuracy';

interface PredictiveModelPanelProps {
  symbol: string;
  predictions: PredictionResult;
  patternMatching: PatternMatchingResult;
  scenarios: {
    '24h': ScenarioAnalysis;
    '7d': ScenarioAnalysis;
    '30d': ScenarioAnalysis;
  };
  modelPerformance: ModelPerformance;
  currentPrice: number;
}

export default function PredictiveModelPanel({
  symbol,
  predictions,
  patternMatching,
  scenarios,
  modelPerformance,
  currentPrice
}: PredictiveModelPanelProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'24h' | '7d' | '30d'>('7d');
  const [showDisclaimer, setShowDisclaimer] = useState(true);

  const selectedScenario = scenarios[selectedTimeframe];
  const selectedPrediction = predictions.predictions[`price${selectedTimeframe}` as keyof typeof predictions.predictions];

  return (
    <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6 space-y-6">
      {/* Header */}
      <div className="border-b-2 border-bitcoin-orange pb-4">
        <h2 className="text-2xl font-bold text-bitcoin-white flex items-center gap-2">
          <Target className="text-bitcoin-orange" size={28} />
          AI-Powered Predictions
        </h2>
        <p className="text-sm text-bitcoin-white-60 italic mt-1">
          Machine learning models trained on historical data
        </p>
      </div>

      {/* Disclaimer */}
      {showDisclaimer && (
        <div className="bg-bitcoin-orange-10 border border-bitcoin-orange-20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-bitcoin-orange flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="text-sm text-bitcoin-white-80">
                <strong className="text-bitcoin-orange">Important:</strong> Predictions are probabilistic estimates based on historical patterns and current market conditions. 
                They should not be considered financial advice. Past performance does not guarantee future results.
              </p>
            </div>
            <button
              onClick={() => setShowDisclaimer(false)}
              className="text-bitcoin-white-60 hover:text-bitcoin-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Timeframe Selector */}
      <div className="flex gap-2">
        {(['24h', '7d', '30d'] as const).map((tf) => (
          <button
            key={tf}
            onClick={() => setSelectedTimeframe(tf)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              selectedTimeframe === tf
                ? 'bg-bitcoin-orange text-bitcoin-black'
                : 'bg-transparent text-bitcoin-orange border border-bitcoin-orange hover:bg-bitcoin-orange hover:text-bitcoin-black'
            }`}
          >
            {tf.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Price Predictions */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-bitcoin-white">Price Predictions</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Low Estimate */}
          <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-bitcoin-white-60 mb-2">
              Low Estimate
            </p>
            <p className="font-mono text-2xl font-bold text-bitcoin-white">
              ${(selectedPrediction?.low ?? 0).toLocaleString()}
            </p>
            <p className="text-sm text-bitcoin-white-60 mt-1">
              {(((selectedPrediction?.low ?? currentPrice) / currentPrice - 1) * 100).toFixed(2)}% from current
            </p>
          </div>

          {/* Mid Estimate */}
          <div className="bg-bitcoin-orange-10 border-2 border-bitcoin-orange rounded-lg p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-bitcoin-orange mb-2">
              Expected Price
            </p>
            <p className="font-mono text-3xl font-bold text-bitcoin-orange [text-shadow:0_0_20px_rgba(247,147,26,0.3)]">
              ${(selectedPrediction?.mid ?? 0).toLocaleString()}
            </p>
            <p className="text-sm text-bitcoin-white-80 mt-1">
              {(((selectedPrediction?.mid ?? currentPrice) / currentPrice - 1) * 100).toFixed(2)}% from current
            </p>
          </div>

          {/* High Estimate */}
          <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-bitcoin-white-60 mb-2">
              High Estimate
            </p>
            <p className="font-mono text-2xl font-bold text-bitcoin-white">
              ${(selectedPrediction?.high ?? 0).toLocaleString()}
            </p>
            <p className="text-sm text-bitcoin-white-60 mt-1">
              {(((selectedPrediction?.high ?? currentPrice) / currentPrice - 1) * 100).toFixed(2)}% from current
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-bitcoin-white-60">Confidence:</span>
            <span className="font-bold text-bitcoin-orange">{selectedPrediction?.confidence ?? 0}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-bitcoin-white-60">Methodology:</span>
            <span className="text-bitcoin-white-80">{selectedPrediction?.methodology ?? 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Pattern Matching */}
      {patternMatching?.currentPattern && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-bitcoin-white">Identified Chart Pattern</h3>
          
          <div className="bg-bitcoin-orange-10 border border-bitcoin-orange rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="text-lg font-bold text-bitcoin-orange capitalize">
                  {(patternMatching.currentPattern?.type ?? 'unknown').replace(/_/g, ' ')}
                </h4>
                <p className="text-sm text-bitcoin-white-80 mt-1">
                  {patternMatching.currentPattern?.description ?? 'No description available'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-bitcoin-white-60">Confidence</p>
                <p className="text-2xl font-bold text-bitcoin-orange">
                  {patternMatching.currentPattern?.confidence ?? 0}%
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {patternMatching.currentPattern?.bullish ? (
                <TrendingUp className="text-bitcoin-orange" size={20} />
              ) : (
                <TrendingDown className="text-bitcoin-orange" size={20} />
              )}
              <span className="text-sm font-semibold text-bitcoin-white">
                {patternMatching.currentPattern?.bullish ? 'Bullish' : 'Bearish'} Pattern
              </span>
            </div>
          </div>

          {/* Historical Matches */}
          {patternMatching.historicalMatches.length > 0 && (
            <div>
              <h4 className="text-lg font-bold text-bitcoin-white mb-3">
                Historical Pattern Matches ({patternMatching.historicalMatches.length})
              </h4>
              
              <div className="space-y-2">
                {(patternMatching?.historicalMatches || []).slice(0, 3).map((match, index) => (
                  <div
                    key={index}
                    className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-bitcoin-white-60">{match.historicalDate}</span>
                      <span className="text-sm font-bold text-bitcoin-orange">
                        {match.similarity}% similar
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-bitcoin-white-60">1d</p>
                        <p className={`font-mono font-bold ${match.priceChange1d > 0 ? 'text-bitcoin-orange' : 'text-bitcoin-white'}`}>
                          {match.priceChange1d > 0 ? '+' : ''}{match.priceChange1d.toFixed(2)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-bitcoin-white-60">7d</p>
                        <p className={`font-mono font-bold ${match.priceChange7d > 0 ? 'text-bitcoin-orange' : 'text-bitcoin-white'}`}>
                          {match.priceChange7d > 0 ? '+' : ''}{match.priceChange7d.toFixed(2)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-bitcoin-white-60">30d</p>
                        <p className={`font-mono font-bold ${match.priceChange30d > 0 ? 'text-bitcoin-orange' : 'text-bitcoin-white'}`}>
                          {match.priceChange30d > 0 ? '+' : ''}{match.priceChange30d.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 p-3 bg-bitcoin-orange-10 border border-bitcoin-orange-20 rounded-lg">
                <p className="text-sm text-bitcoin-white-80">
                  <strong className="text-bitcoin-orange">Pattern Probability:</strong>{' '}
                  {patternMatching.probability.bullish}% Bullish, {patternMatching.probability.bearish}% Bearish, {patternMatching.probability.neutral}% Neutral
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Scenario Analysis */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-bitcoin-white">Scenario Analysis</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Bull Case */}
          <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-bold text-bitcoin-orange">Bull Case</h4>
              <TrendingUp className="text-bitcoin-orange" size={24} />
            </div>
            
            <p className="font-mono text-2xl font-bold text-bitcoin-white mb-2">
              ${selectedScenario.bullCase.target.toLocaleString()}
            </p>
            
            <p className="text-sm text-bitcoin-white-60 mb-3">
              Probability: <span className="font-bold text-bitcoin-orange">{selectedScenario.bullCase.probability}%</span>
            </p>
            
            <p className="text-xs text-bitcoin-white-80 mb-2">
              {selectedScenario.bullCase.reasoning}
            </p>
            
            <div className="space-y-1">
              {(selectedScenario?.bullCase?.keyFactors || []).map((factor, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle className="text-bitcoin-orange flex-shrink-0 mt-0.5" size={14} />
                  <span className="text-xs text-bitcoin-white-60">{factor}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Base Case */}
          <div className="bg-bitcoin-orange-10 border-2 border-bitcoin-orange rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-bold text-bitcoin-orange">Base Case</h4>
              <BarChart3 className="text-bitcoin-orange" size={24} />
            </div>
            
            <p className="font-mono text-2xl font-bold text-bitcoin-orange mb-2">
              ${selectedScenario.baseCase.target.toLocaleString()}
            </p>
            
            <p className="text-sm text-bitcoin-white-80 mb-3">
              Probability: <span className="font-bold text-bitcoin-orange">{selectedScenario.baseCase.probability}%</span>
            </p>
            
            <p className="text-xs text-bitcoin-white-80 mb-2">
              {selectedScenario.baseCase.reasoning}
            </p>
            
            <div className="space-y-1">
              {(selectedScenario?.baseCase?.keyFactors || []).map((factor, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle className="text-bitcoin-orange flex-shrink-0 mt-0.5" size={14} />
                  <span className="text-xs text-bitcoin-white-80">{factor}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bear Case */}
          <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-bold text-bitcoin-white">Bear Case</h4>
              <TrendingDown className="text-bitcoin-white" size={24} />
            </div>
            
            <p className="font-mono text-2xl font-bold text-bitcoin-white mb-2">
              ${selectedScenario.bearCase.target.toLocaleString()}
            </p>
            
            <p className="text-sm text-bitcoin-white-60 mb-3">
              Probability: <span className="font-bold text-bitcoin-white">{selectedScenario.bearCase.probability}%</span>
            </p>
            
            <p className="text-xs text-bitcoin-white-80 mb-2">
              {selectedScenario.bearCase.reasoning}
            </p>
            
            <div className="space-y-1">
              {(selectedScenario?.bearCase?.keyFactors || []).map((factor, index) => (
                <div key={index} className="flex items-start gap-2">
                  <AlertCircle className="text-bitcoin-white-60 flex-shrink-0 mt-0.5" size={14} />
                  <span className="text-xs text-bitcoin-white-60">{factor}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 p-4 bg-bitcoin-orange-10 border border-bitcoin-orange-20 rounded-lg">
          <div>
            <p className="text-sm text-bitcoin-white-60 mb-1">Expected Value</p>
            <p className="font-mono text-xl font-bold text-bitcoin-orange">
              ${selectedScenario.expectedValue.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-bitcoin-white-60 mb-1">Risk/Reward Ratio</p>
            <p className="font-mono text-xl font-bold text-bitcoin-orange">
              {selectedScenario.riskRewardRatio.toFixed(2)}:1
            </p>
          </div>
        </div>
      </div>

      {/* Model Accuracy */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-bitcoin-white">Model Accuracy Track Record</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-bitcoin-white-60 mb-2">
              Last 30 Days
            </p>
            <p className="font-mono text-3xl font-bold text-bitcoin-orange">
              {modelPerformance.last30Days}%
            </p>
          </div>

          <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-bitcoin-white-60 mb-2">
              Last 90 Days
            </p>
            <p className="font-mono text-3xl font-bold text-bitcoin-orange">
              {modelPerformance.last90Days}%
            </p>
          </div>

          <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-bitcoin-white-60 mb-2">
              All Time
            </p>
            <p className="font-mono text-3xl font-bold text-bitcoin-orange">
              {modelPerformance.allTime}%
            </p>
          </div>
        </div>

        <div className="p-4 bg-bitcoin-orange-10 border border-bitcoin-orange-20 rounded-lg">
          <p className="text-sm text-bitcoin-white-80">
            <strong className="text-bitcoin-orange">Note:</strong> Accuracy scores are calculated based on validated predictions. 
            Higher scores indicate better model performance. Scores above 70% are considered good, above 80% are excellent.
          </p>
        </div>
      </div>
    </div>
  );
}
