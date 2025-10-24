/**
 * Deep Dive UI Components for Whale Watch
 * 
 * Components for displaying comprehensive blockchain analysis
 * with Gemini 2.5 Pro Deep Dive feature
 */

import React, { useState } from 'react';
import { Search, Loader, CheckCircle, Circle, TrendingUp, TrendingDown, AlertTriangle, Brain, ChevronDown, ChevronUp } from 'lucide-react';
import type { BlockchainAddressData, TransactionPatterns } from '../../utils/blockchainData';

interface WhaleTransaction {
  txHash: string;
  blockchain: 'BTC';
  amount: number;
  amountUSD: number;
  fromAddress: string;
  toAddress: string;
  timestamp: string;
  type: string;
  description: string;
}

interface DeepDiveAnalysis {
  transaction_type: string;
  market_impact: string;
  confidence: number;
  address_behavior: {
    source_classification: string;
    destination_classification: string;
    source_strategy: string;
    destination_strategy: string;
  };
  fund_flow_analysis: {
    origin_hypothesis: string;
    destination_hypothesis: string;
    mixing_detected: boolean;
    cluster_analysis: string;
  };
  historical_patterns: {
    similar_transactions: string;
    pattern_match: string;
    success_rate: number;
  };
  market_prediction: {
    short_term_24h: string;
    medium_term_7d: string;
    key_price_levels: {
      support: number[];
      resistance: number[];
    };
    probability_further_movement: number;
  };
  strategic_intelligence: {
    intent: string;
    sentiment_indicator: string;
    trader_positioning: string;
    risk_reward_ratio: string;
  };
  reasoning: string;
  key_findings: string[];
  trader_action: string;
}

interface DeepDiveButtonProps {
  whale: WhaleTransaction;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  disabled?: boolean;
}

/**
 * Deep Dive Button Component
 * Shows for transactions >= 100 BTC
 */
export const DeepDiveButton: React.FC<DeepDiveButtonProps> = ({ 
  whale, 
  onAnalyze, 
  isAnalyzing,
  disabled = false
}) => {
  const shouldShowDeepDive = whale.amount >= 100;
  
  if (!shouldShowDeepDive) return null;
  
  return (
    <button
      onClick={onAnalyze}
      disabled={isAnalyzing || disabled}
      className="flex items-center gap-2 px-4 py-2 bg-bitcoin-orange text-bitcoin-black 
                 font-bold rounded-lg hover:bg-bitcoin-black hover:text-bitcoin-orange 
                 border-2 border-bitcoin-orange transition-all disabled:opacity-50
                 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(247,147,26,0.5)]
                 hover:shadow-[0_0_30px_rgba(247,147,26,0.7)] min-h-[44px]"
    >
      <Search className="w-5 h-5" />
      <span>Deep Dive Analysis</span>
      {isAnalyzing && <Loader className="w-4 h-4 animate-spin" />}
    </button>
  );
};

interface DeepDiveProgressProps {
  stage: string;
  onCancel?: () => void;
}

/**
 * Deep Dive Progress Indicator
 * Shows multi-stage progress during analysis with cancel option
 */
export const DeepDiveProgress: React.FC<DeepDiveProgressProps> = ({ stage, onCancel }) => {
  const stages = [
    'Fetching blockchain data...',
    'Analyzing transaction history...',
    'Tracing fund flows...',
    'Identifying patterns...',
    'Generating comprehensive analysis...',
  ];
  
  const currentIndex = stages.indexOf(stage);
  const progress = currentIndex >= 0 ? ((currentIndex + 1) / stages.length) * 100 : 0;
  
  return (
    <div className="p-6 bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl">
      <div className="flex items-center gap-3 mb-4">
        <Loader className="w-6 h-6 text-bitcoin-orange animate-spin" />
        <span className="text-bitcoin-white font-bold text-lg">Deep Dive in Progress</span>
      </div>
      
      {/* Progress bar */}
      <div className="w-full h-2 bg-bitcoin-black border border-bitcoin-orange-20 rounded-full mb-4 overflow-hidden">
        <div 
          className="h-full bg-bitcoin-orange transition-all duration-500 shadow-[0_0_10px_rgba(247,147,26,0.6)]"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Stage list */}
      <div className="space-y-3">
        {stages.map((s, i) => (
          <div key={i} className="flex items-center gap-3">
            {i < currentIndex && <CheckCircle className="w-5 h-5 text-bitcoin-orange flex-shrink-0" />}
            {i === currentIndex && <Loader className="w-5 h-5 text-bitcoin-orange animate-spin flex-shrink-0" />}
            {i > currentIndex && <Circle className="w-5 h-5 text-bitcoin-white-60 flex-shrink-0" />}
            <span className={`${i <= currentIndex ? 'text-bitcoin-white' : 'text-bitcoin-white-60'} text-sm`}>
              {s}
            </span>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-bitcoin-orange-20 flex items-center justify-between">
        <p className="text-sm text-bitcoin-white-60 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Estimated time: 10-15 seconds
        </p>
        
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-transparent border-2 border-bitcoin-orange text-bitcoin-orange
                       rounded-lg hover:bg-bitcoin-orange hover:text-bitcoin-black
                       transition-all font-semibold text-sm"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

interface DeepDiveResultsProps {
  analysis: DeepDiveAnalysis;
  blockchainData?: {
    sourceAddress: BlockchainAddressData;
    destinationAddress: BlockchainAddressData;
    patterns: TransactionPatterns;
  };
  metadata?: {
    model: string;
    processingTime: number;
  };
}

/**
 * Deep Dive Results Display
 * Shows comprehensive analysis with blockchain data
 */
export const DeepDiveResults: React.FC<DeepDiveResultsProps> = ({ 
  analysis, 
  blockchainData,
  metadata 
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    addressBehavior: true,
    fundFlow: true,
    marketPrediction: true,
    strategicIntel: true,
    reasoning: false,
  });
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };
  
  return (
    <div className="space-y-4">
      {/* Model Badge */}
      {metadata && (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="px-4 py-2 bg-bitcoin-orange text-bitcoin-black rounded-lg font-bold
                         shadow-[0_0_30px_rgba(247,147,26,0.6)] text-sm uppercase">
            🔍 Gemini 2.5 Pro - Deep Dive
          </span>
          <span className="text-bitcoin-white-60 text-sm font-mono">
            {metadata.processingTime}ms
          </span>
          <span className="px-3 py-1.5 bg-bitcoin-black border-2 border-bitcoin-orange text-bitcoin-orange 
                         rounded font-bold text-xs uppercase">
            {analysis.confidence}% Confidence
          </span>
        </div>
      )}
      
      {/* Address Behavior Section */}
      <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-xl overflow-hidden">
        <button
          onClick={() => toggleSection('addressBehavior')}
          className="w-full p-4 flex items-center justify-between bg-bitcoin-black 
                     hover:bg-bitcoin-orange-5 transition-colors border-b border-bitcoin-orange-20"
        >
          <h4 className="text-bitcoin-white font-bold flex items-center gap-2">
            <Brain className="w-5 h-5 text-bitcoin-orange" />
            Address Behavior Analysis
          </h4>
          {expandedSections.addressBehavior ? 
            <ChevronUp className="w-5 h-5 text-bitcoin-orange" /> : 
            <ChevronDown className="w-5 h-5 text-bitcoin-orange" />
          }
        </button>
        
        {expandedSections.addressBehavior && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg">
              <p className="text-bitcoin-white-60 text-sm mb-2">Source Address</p>
              <p className="text-bitcoin-orange font-bold mb-3 text-lg">
                {analysis.address_behavior.source_classification}
              </p>
              <p className="text-bitcoin-white-80 text-sm leading-relaxed">
                {analysis.address_behavior.source_strategy}
              </p>
            </div>
            <div className="p-3 bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg">
              <p className="text-bitcoin-white-60 text-sm mb-2">Destination Address</p>
              <p className="text-bitcoin-orange font-bold mb-3 text-lg">
                {analysis.address_behavior.destination_classification}
              </p>
              <p className="text-bitcoin-white-80 text-sm leading-relaxed">
                {analysis.address_behavior.destination_strategy}
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Fund Flow Analysis */}
      <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-xl overflow-hidden">
        <button
          onClick={() => toggleSection('fundFlow')}
          className="w-full p-4 flex items-center justify-between bg-bitcoin-black 
                     hover:bg-bitcoin-orange-5 transition-colors border-b border-bitcoin-orange-20"
        >
          <h4 className="text-bitcoin-white font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-bitcoin-orange" />
            Fund Flow Tracing
          </h4>
          {expandedSections.fundFlow ? 
            <ChevronUp className="w-5 h-5 text-bitcoin-orange" /> : 
            <ChevronDown className="w-5 h-5 text-bitcoin-orange" />
          }
        </button>
        
        {expandedSections.fundFlow && (
          <div className="p-4 space-y-4">
            <div>
              <p className="text-bitcoin-white-60 text-sm mb-2">Origin Hypothesis</p>
              <p className="text-bitcoin-white-80 leading-relaxed">
                {analysis.fund_flow_analysis.origin_hypothesis}
              </p>
            </div>
            <div>
              <p className="text-bitcoin-white-60 text-sm mb-2">Destination Hypothesis</p>
              <p className="text-bitcoin-white-80 leading-relaxed">
                {analysis.fund_flow_analysis.destination_hypothesis}
              </p>
            </div>
            {analysis.fund_flow_analysis.mixing_detected && (
              <div className="p-3 bg-bitcoin-orange-10 border-2 border-bitcoin-orange rounded-lg">
                <p className="text-bitcoin-orange font-bold flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Mixing Behavior Detected
                </p>
              </div>
            )}
            <div>
              <p className="text-bitcoin-white-60 text-sm mb-2">Cluster Analysis</p>
              <p className="text-bitcoin-white-80 leading-relaxed">
                {analysis.fund_flow_analysis.cluster_analysis}
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Market Prediction */}
      <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-xl overflow-hidden">
        <button
          onClick={() => toggleSection('marketPrediction')}
          className="w-full p-4 flex items-center justify-between bg-bitcoin-black 
                     hover:bg-bitcoin-orange-5 transition-colors border-b border-bitcoin-orange-20"
        >
          <h4 className="text-bitcoin-white font-bold flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-bitcoin-orange" />
            Market Prediction
          </h4>
          {expandedSections.marketPrediction ? 
            <ChevronUp className="w-5 h-5 text-bitcoin-orange" /> : 
            <ChevronDown className="w-5 h-5 text-bitcoin-orange" />
          }
        </button>
        
        {expandedSections.marketPrediction && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-bitcoin-white-60 text-sm mb-2">24-Hour Outlook</p>
                <p className="text-bitcoin-white-80 leading-relaxed">
                  {analysis.market_prediction.short_term_24h}
                </p>
              </div>
              <div>
                <p className="text-bitcoin-white-60 text-sm mb-2">7-Day Outlook</p>
                <p className="text-bitcoin-white-80 leading-relaxed">
                  {analysis.market_prediction.medium_term_7d}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg">
                <p className="text-bitcoin-white-60 text-sm mb-3">Support Levels</p>
                <div className="space-y-2">
                  {analysis.market_prediction.key_price_levels.support.map((level, i) => (
                    <p key={i} className="text-bitcoin-orange font-mono font-bold text-lg">
                      ${level.toLocaleString()}
                    </p>
                  ))}
                </div>
              </div>
              <div className="p-3 bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg">
                <p className="text-bitcoin-white-60 text-sm mb-3">Resistance Levels</p>
                <div className="space-y-2">
                  {analysis.market_prediction.key_price_levels.resistance.map((level, i) => (
                    <p key={i} className="text-bitcoin-orange font-mono font-bold text-lg">
                      ${level.toLocaleString()}
                    </p>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-bitcoin-orange-10 border border-bitcoin-orange-20 rounded-lg">
              <p className="text-bitcoin-white-60 text-sm mb-1">Probability of Further Movement</p>
              <p className="text-bitcoin-orange font-bold text-2xl font-mono">
                {analysis.market_prediction.probability_further_movement}%
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Strategic Intelligence */}
      <div className="bg-bitcoin-orange text-bitcoin-black rounded-xl p-4">
        <button
          onClick={() => toggleSection('strategicIntel')}
          className="w-full flex items-center justify-between mb-3"
        >
          <h4 className="font-bold text-lg">Strategic Intelligence</h4>
          {expandedSections.strategicIntel ? 
            <ChevronUp className="w-5 h-5" /> : 
            <ChevronDown className="w-5 h-5" />
          }
        </button>
        
        {expandedSections.strategicIntel && (
          <div className="space-y-3 text-sm">
            <div>
              <strong>Intent:</strong> {analysis.strategic_intelligence.intent}
            </div>
            <div>
              <strong>Sentiment:</strong> {analysis.strategic_intelligence.sentiment_indicator}
            </div>
            <div>
              <strong>Positioning:</strong> {analysis.strategic_intelligence.trader_positioning}
            </div>
            <div>
              <strong>Risk/Reward:</strong> {analysis.strategic_intelligence.risk_reward_ratio}
            </div>
          </div>
        )}
      </div>
      
      {/* Reasoning */}
      <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-xl overflow-hidden">
        <button
          onClick={() => toggleSection('reasoning')}
          className="w-full p-4 flex items-center justify-between bg-bitcoin-black 
                     hover:bg-bitcoin-orange-5 transition-colors"
        >
          <h4 className="text-bitcoin-white font-bold">Detailed Reasoning</h4>
          {expandedSections.reasoning ? 
            <ChevronUp className="w-5 h-5 text-bitcoin-orange" /> : 
            <ChevronDown className="w-5 h-5 text-bitcoin-orange" />
          }
        </button>
        
        {expandedSections.reasoning && (
          <div className="p-4 border-t border-bitcoin-orange-20">
            <p className="text-bitcoin-white-80 leading-relaxed whitespace-pre-wrap">
              {analysis.reasoning}
            </p>
          </div>
        )}
      </div>
      
      {/* Key Findings */}
      <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-4">
        <h4 className="text-bitcoin-white font-bold mb-3">Key Findings</h4>
        <ul className="space-y-2">
          {analysis.key_findings.map((finding, i) => (
            <li key={i} className="flex items-start gap-2 text-bitcoin-white-80">
              <span className="text-bitcoin-orange font-bold flex-shrink-0">•</span>
              <span>{finding}</span>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Trader Action */}
      <div className="bg-bitcoin-orange text-bitcoin-black rounded-xl p-4">
        <h4 className="font-bold mb-2">Recommended Action</h4>
        <p className="leading-relaxed">{analysis.trader_action}</p>
      </div>
    </div>
  );
};
