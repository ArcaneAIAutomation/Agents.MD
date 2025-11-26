import React, { useState } from 'react';
import { X, TrendingUp, Brain, Activity, Users, Shield, Database, AlertTriangle, CheckCircle } from 'lucide-react';

interface TradeSignal {
  id: string;
  symbol: string;
  positionType: 'LONG' | 'SHORT';
  entry: number;
  stopLoss: number;
  takeProfits: {
    tp1: { price: number; allocation: number };
    tp2: { price: number; allocation: number };
    tp3: { price: number; allocation: number };
  };
  confidence: {
    overall: number;
    technical: number;
    sentiment: number;
    onChain: number;
    risk: number;
  };
  riskReward: number;
  positionSize: number;
  maxLoss: number;
  timeframe: string;
  createdAt: string;
  dataQuality: number;
}

interface ComprehensiveAnalysis {
  technical: {
    indicators: any;
    signals: string[];
    trend: string;
    strength: number;
  };
  sentiment: {
    social: any;
    news: any;
    overall: string;
    score: number;
    trends?: {
      shortTerm?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
      mediumTerm?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
      longTerm?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
      score?: number;
    };
  };
  onChain: {
    whaleActivity: any;
    exchangeFlows: any;
    holderDistribution: any;
    netFlow: string;
  };
  risk: {
    volatility: number;
    liquidityRisk: string;
    marketConditions: string;
    recommendation: string;
  };
  reasoning: {
    technical: string;
    sentiment: string;
    onChain: string;
    risk: string;
    overall: string;
  };
  timeframeAlignment: {
    '15m': 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    '1h': 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    '4h': 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    '1d': 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    alignment: number;
  };
}

interface EinsteinAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  signal: TradeSignal | null;
  analysis: ComprehensiveAnalysis | null;
  onApprove?: () => void;
  onReject?: () => void;
  onModify?: () => void;
}

export default function EinsteinAnalysisModal({
  isOpen,
  onClose,
  signal,
  analysis,
  onApprove,
  onReject,
  onModify
}: EinsteinAnalysisModalProps) {
  // Confirmation dialog state
  const [showConfirmation, setShowConfirmation] = useState<'approve' | 'reject' | 'modify' | null>(null);

  if (!isOpen || !signal || !analysis) return null;

  // Handle confirmation actions
  const handleConfirmApprove = () => {
    setShowConfirmation(null);
    if (onApprove) onApprove();
  };

  const handleConfirmReject = () => {
    setShowConfirmation(null);
    if (onReject) onReject();
  };

  const handleConfirmModify = () => {
    setShowConfirmation(null);
    if (onModify) onModify();
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(null);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)}`;
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  // Get position color
  const getPositionColor = (type: string) => {
    return type === 'LONG' ? 'text-bitcoin-orange' : 'text-red-500';
  };

  // Get confidence color
  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-bitcoin-orange';
    if (score >= 60) return 'text-bitcoin-white';
    return 'text-bitcoin-white-60';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 einstein-modal-overlay">
      <div className="einstein-card einstein-glow max-w-7xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header - Einstein Styled */}
        <div className="sticky top-0 bg-bitcoin-black border-b-2 border-bitcoin-orange p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="einstein-icon">
              <Brain size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold einstein-text-glow">
                Einstein Trade Analysis
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="einstein-badge" style={{ fontSize: '0.625rem', padding: '0.2rem 0.5rem' }}>
                  {signal.symbol}
                </span>
                <span className="einstein-badge" style={{ fontSize: '0.625rem', padding: '0.2rem 0.5rem' }}>
                  {signal.positionType}
                </span>
                <span className="einstein-badge" style={{ fontSize: '0.625rem', padding: '0.2rem 0.5rem' }}>
                  {signal.timeframe}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-bitcoin-white-60 hover:text-bitcoin-orange transition-colors"
            aria-label="Close modal"
          >
            <X size={32} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Trade Summary Card - Placeholder for now */}
          <div className="bg-bitcoin-orange bg-opacity-10 border-2 border-bitcoin-orange rounded-xl p-6">
            <h3 className="text-xl font-bold text-bitcoin-white mb-4 flex items-center gap-2">
              <TrendingUp size={24} className="text-bitcoin-orange" />
              Trade Summary
            </h3>
            <p className="text-bitcoin-white-80">Trade summary content here...</p>
          </div>

          {/* Multi-Panel Analysis Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Technical Analysis Panel - Placeholder */}
            <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-6">
              <h3 className="text-xl font-bold text-bitcoin-white mb-4 flex items-center gap-2">
                <Activity size={24} className="text-bitcoin-orange" />
                Technical Analysis
              </h3>
              <p className="text-bitcoin-white-80">Technical analysis content here...</p>
            </div>

            {/* Sentiment Analysis Panel - TASK 32 COMPLETE */}
            <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-6">
              <h3 className="text-xl font-bold text-bitcoin-white mb-4 flex items-center gap-2">
                <Users size={24} className="text-bitcoin-orange" />
                Sentiment Analysis
              </h3>
              
              {/* Confidence Score */}
              <div className="mb-4 bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-bitcoin-white-60 text-sm font-semibold">
                    Sentiment Confidence
                  </span>
                  <span className={`text-xl font-bold font-mono ${getConfidenceColor(signal.confidence.sentiment)}`}>
                    {signal.confidence.sentiment}%
                  </span>
                </div>
                <div className="w-full bg-bitcoin-black border border-bitcoin-orange-20 rounded-full h-2">
                  <div 
                    className="bg-bitcoin-orange h-full rounded-full transition-all"
                    style={{ width: `${signal.confidence.sentiment}%` }}
                  />
                </div>
              </div>

              {/* Overall Sentiment */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-3">
                  <p className="text-bitcoin-white-60 text-xs uppercase mb-1">Overall</p>
                  <p className="text-bitcoin-white font-bold">{analysis.sentiment.overall}</p>
                </div>
                <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-3">
                  <p className="text-bitcoin-white-60 text-xs uppercase mb-1">Score</p>
                  <p className="text-bitcoin-orange font-bold font-mono">
                    {analysis.sentiment.score}/100
                  </p>
                </div>
              </div>

              {/* Social Metrics - LunarCrush, Twitter, Reddit */}
              <div className="mb-4">
                <p className="text-bitcoin-white-60 text-sm font-semibold mb-3">Social Metrics</p>
                
                {/* LunarCrush Metrics - Enhanced with calculated social data */}
                {analysis.sentiment.social?.lunarCrush && (
                  <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-bitcoin-white-80 text-sm font-semibold">LunarCrush</span>
                      <span className="text-bitcoin-orange text-xs font-bold">
                        Galaxy Score: {analysis.sentiment.social.lunarCrush.galaxyScore}/100
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-bitcoin-white-60">Social Score:</span>
                        <span className="text-bitcoin-white-80 font-mono">
                          {analysis.sentiment.social.lunarCrush.socialScore}/100
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-bitcoin-white-60">Alt Rank:</span>
                        <span className="text-bitcoin-white-80 font-mono">
                          #{analysis.sentiment.social.lunarCrush.altRank}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-bitcoin-white-60">Social Volume:</span>
                        <span className="text-bitcoin-white-80 font-mono">
                          {analysis.sentiment.social.lunarCrush.socialVolume?.toLocaleString() || 
                           analysis.sentiment.social.lunarCrush.volume24h?.toLocaleString() || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-bitcoin-white-60">Dominance:</span>
                        <span className="text-bitcoin-white-80 font-mono">
                          {analysis.sentiment.social.lunarCrush.socialDominance?.toFixed(2) || '0.00'}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-bitcoin-white-60">Influencers:</span>
                        <span className="text-bitcoin-white-80 font-mono">
                          {analysis.sentiment.social.lunarCrush.influencers || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-bitcoin-white-60">Sentiment:</span>
                        <span className={`font-mono ${
                          (analysis.sentiment.social.lunarCrush.sentiment || 50) > 60
                            ? 'text-bitcoin-orange' 
                            : (analysis.sentiment.social.lunarCrush.sentiment || 50) < 40
                            ? 'text-bitcoin-white-60' 
                            : 'text-bitcoin-white-80'
                        }`}>
                          {analysis.sentiment.social.lunarCrush.sentiment || 50}/100
                        </span>
                      </div>
                    </div>
                    {analysis.sentiment.social.lunarCrush.trend && (
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        <span className="text-bitcoin-white-60">Trend:</span>
                        <span className={`font-semibold ${
                          analysis.sentiment.social.lunarCrush.trend === 'BULLISH' 
                            ? 'text-bitcoin-orange' 
                            : analysis.sentiment.social.lunarCrush.trend === 'BEARISH'
                            ? 'text-bitcoin-white-60'
                            : 'text-bitcoin-white-80'
                        }`}>
                          {analysis.sentiment.social.lunarCrush.trend === 'BULLISH' ? '↗️ Bullish' : 
                           analysis.sentiment.social.lunarCrush.trend === 'BEARISH' ? '↘️ Bearish' : 
                           '→ Neutral'}
                        </span>
                      </div>
                    )}
                    <div className="mt-2 pt-2 border-t border-bitcoin-orange-20">
                      <p className="text-bitcoin-white-60 text-xs italic">
                        📊 Enhanced metrics calculated from Galaxy Score & Alt Rank
                      </p>
                    </div>
                  </div>
                )}

                {/* Twitter/X Metrics */}
                {analysis.sentiment.social?.twitter && (
                  <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-bitcoin-white-80 text-sm font-semibold">Twitter/X</span>
                      <span className="text-bitcoin-orange text-xs font-bold">
                        {analysis.sentiment.social.twitter.totalTweets} tweets
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-bitcoin-white-60">Positive:</span>
                        <span className="text-bitcoin-orange font-mono">
                          {analysis.sentiment.social.twitter.positive}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-bitcoin-white-60">Negative:</span>
                        <span className="text-red-500 font-mono">
                          {analysis.sentiment.social.twitter.negative}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-bitcoin-white-60">Neutral:</span>
                        <span className="text-bitcoin-white-80 font-mono">
                          {analysis.sentiment.social.twitter.neutral}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-bitcoin-white-60">Engagement:</span>
                        <span className="text-bitcoin-white-80 font-mono">
                          {analysis.sentiment.social.twitter.engagement?.toLocaleString() || 'N/A'}
                        </span>
                      </div>
                    </div>
                    {analysis.sentiment.social.twitter.topInfluencers && analysis.sentiment.social.twitter.topInfluencers.length > 0 && (
                      <div className="mt-2 text-xs">
                        <span className="text-bitcoin-white-60">Top Influencers: </span>
                        <span className="text-bitcoin-white-80">
                          {analysis.sentiment.social.twitter.topInfluencers.slice(0, 3).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Reddit Metrics */}
                {analysis.sentiment.social?.reddit && (
                  <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-bitcoin-white-80 text-sm font-semibold">Reddit</span>
                      <span className="text-bitcoin-orange text-xs font-bold">
                        {analysis.sentiment.social.reddit.totalPosts} posts
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-bitcoin-white-60">Upvotes:</span>
                        <span className="text-bitcoin-orange font-mono">
                          {analysis.sentiment.social.reddit.upvotes?.toLocaleString() || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-bitcoin-white-60">Comments:</span>
                        <span className="text-bitcoin-white-80 font-mono">
                          {analysis.sentiment.social.reddit.comments?.toLocaleString() || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-bitcoin-white-60">Sentiment:</span>
                        <span className={`font-mono ${
                          analysis.sentiment.social.reddit.sentiment > 0.5 
                            ? 'text-bitcoin-orange' 
                            : analysis.sentiment.social.reddit.sentiment < -0.5 
                            ? 'text-red-500' 
                            : 'text-bitcoin-white-80'
                        }`}>
                          {((analysis.sentiment.social.reddit.sentiment || 0) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-bitcoin-white-60">Activity:</span>
                        <span className="text-bitcoin-white-80 font-mono">
                          {analysis.sentiment.social.reddit.activity || 'N/A'}
                        </span>
                      </div>
                    </div>
                    {analysis.sentiment.social.reddit.topSubreddits && analysis.sentiment.social.reddit.topSubreddits.length > 0 && (
                      <div className="mt-2 text-xs">
                        <span className="text-bitcoin-white-60">Top Subreddits: </span>
                        <span className="text-bitcoin-white-80">
                          {analysis.sentiment.social.reddit.topSubreddits.slice(0, 3).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* News Sentiment */}
              <div className="mb-4">
                <p className="text-bitcoin-white-60 text-sm font-semibold mb-3">News Sentiment</p>
                
                {analysis.sentiment.news && (
                  <div className="space-y-2">
                    {/* Overall News Sentiment */}
                    <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-bitcoin-white-80 text-sm font-semibold">Overall News Sentiment</span>
                        <span className={`text-lg font-bold font-mono ${
                          analysis.sentiment.news.overall > 0.3 
                            ? 'text-bitcoin-orange' 
                            : analysis.sentiment.news.overall < -0.3 
                            ? 'text-red-500' 
                            : 'text-bitcoin-white-80'
                        }`}>
                          {((analysis.sentiment.news.overall || 0) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-bitcoin-black border border-bitcoin-orange-20 rounded-full h-2">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            (analysis.sentiment.news.overall || 0) > 0 ? 'bg-bitcoin-orange' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.abs(analysis.sentiment.news.overall || 0) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* News Article Count */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-3">
                        <p className="text-bitcoin-white-60 text-xs uppercase mb-1">Articles (24h)</p>
                        <p className="text-bitcoin-orange font-bold font-mono text-lg">
                          {analysis.sentiment.news.articleCount || 0}
                        </p>
                      </div>
                      <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-3">
                        <p className="text-bitcoin-white-60 text-xs uppercase mb-1">Trend</p>
                        <p className={`font-bold text-lg ${
                          analysis.sentiment.news.trend === 'BULLISH' 
                            ? 'text-bitcoin-orange' 
                            : analysis.sentiment.news.trend === 'BEARISH'
                            ? 'text-red-500'
                            : 'text-bitcoin-white-80'
                        }`}>
                          {analysis.sentiment.news.trend === 'BULLISH' ? '↗️ Bullish' : 
                           analysis.sentiment.news.trend === 'BEARISH' ? '↘️ Bearish' : 
                           '→ Neutral'}
                        </p>
                      </div>
                    </div>

                    {/* Top News Topics */}
                    {analysis.sentiment.news.topTopics && analysis.sentiment.news.topTopics.length > 0 && (
                      <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-3">
                        <p className="text-bitcoin-white-60 text-xs uppercase mb-2">Top Topics</p>
                        <div className="flex flex-wrap gap-2">
                          {analysis.sentiment.news.topTopics.map((topic: string, index: number) => (
                            <span 
                              key={index}
                              className="bg-bitcoin-black border border-bitcoin-orange-20 text-bitcoin-white-80 text-xs px-2 py-1 rounded"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Trend Indicators */}
              <div className="mb-4">
                <p className="text-bitcoin-white-60 text-sm font-semibold mb-3">Trend Indicators</p>
                
                <div className="space-y-2">
                  {/* Short-term Trend */}
                  <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-bitcoin-white-80 text-sm">Short-term (24h)</span>
                      <span className={`font-bold ${
                        analysis.sentiment.trends?.shortTerm === 'BULLISH' 
                          ? 'text-bitcoin-orange' 
                          : analysis.sentiment.trends?.shortTerm === 'BEARISH'
                          ? 'text-red-500'
                          : 'text-bitcoin-white-80'
                      }`}>
                        {analysis.sentiment.trends?.shortTerm === 'BULLISH' ? '↗️ Bullish' : 
                         analysis.sentiment.trends?.shortTerm === 'BEARISH' ? '↘️ Bearish' : 
                         '→ Neutral'}
                      </span>
                    </div>
                  </div>

                  {/* Medium-term Trend */}
                  <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-bitcoin-white-80 text-sm">Medium-term (7d)</span>
                      <span className={`font-bold ${
                        analysis.sentiment.trends?.mediumTerm === 'BULLISH' 
                          ? 'text-bitcoin-orange' 
                          : analysis.sentiment.trends?.mediumTerm === 'BEARISH'
                          ? 'text-red-500'
                          : 'text-bitcoin-white-80'
                      }`}>
                        {analysis.sentiment.trends?.mediumTerm === 'BULLISH' ? '↗️ Bullish' : 
                         analysis.sentiment.trends?.mediumTerm === 'BEARISH' ? '↘️ Bearish' : 
                         '→ Neutral'}
                      </span>
                    </div>
                  </div>

                  {/* Long-term Trend */}
                  <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-bitcoin-white-80 text-sm">Long-term (30d)</span>
                      <span className={`font-bold ${
                        analysis.sentiment.trends?.longTerm === 'BULLISH' 
                          ? 'text-bitcoin-orange' 
                          : analysis.sentiment.trends?.longTerm === 'BEARISH'
                          ? 'text-red-500'
                          : 'text-bitcoin-white-80'
                      }`}>
                        {analysis.sentiment.trends?.longTerm === 'BULLISH' ? '↗️ Bullish' : 
                         analysis.sentiment.trends?.longTerm === 'BEARISH' ? '↘️ Bearish' : 
                         '→ Neutral'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sentiment Score Visualization */}
              <div className="mb-4">
                <p className="text-bitcoin-white-60 text-sm font-semibold mb-3">Sentiment Score Breakdown</p>
                
                <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-4">
                  {/* Overall Sentiment Score */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-bitcoin-white-80 text-sm font-semibold">Overall Sentiment</span>
                      <span className="text-2xl font-bold text-bitcoin-orange font-mono">
                        {analysis.sentiment.score}/100
                      </span>
                    </div>
                    <div className="w-full bg-bitcoin-black border border-bitcoin-orange-20 rounded-full h-3">
                      <div 
                        className="bg-bitcoin-orange h-full rounded-full transition-all"
                        style={{ width: `${analysis.sentiment.score}%` }}
                      />
                    </div>
                  </div>

                  {/* Component Scores */}
                  <div className="space-y-3">
                    {/* Social Score */}
                    {analysis.sentiment.social?.score !== undefined && (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-bitcoin-white-60 text-xs">Social Media</span>
                          <span className="text-bitcoin-white-80 text-sm font-mono">
                            {analysis.sentiment.social.score}/100
                          </span>
                        </div>
                        <div className="w-full bg-bitcoin-black border border-bitcoin-orange-20 rounded-full h-2">
                          <div 
                            className="bg-bitcoin-orange h-full rounded-full transition-all"
                            style={{ width: `${analysis.sentiment.social.score}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* News Score */}
                    {analysis.sentiment.news?.score !== undefined && (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-bitcoin-white-60 text-xs">News Sentiment</span>
                          <span className="text-bitcoin-white-80 text-sm font-mono">
                            {analysis.sentiment.news.score}/100
                          </span>
                        </div>
                        <div className="w-full bg-bitcoin-black border border-bitcoin-orange-20 rounded-full h-2">
                          <div 
                            className="bg-bitcoin-orange h-full rounded-full transition-all"
                            style={{ width: `${analysis.sentiment.news.score}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Trend Score */}
                    {analysis.sentiment.trends?.score !== undefined && (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-bitcoin-white-60 text-xs">Trend Strength</span>
                          <span className="text-bitcoin-white-80 text-sm font-mono">
                            {analysis.sentiment.trends.score}/100
                          </span>
                        </div>
                        <div className="w-full bg-bitcoin-black border border-bitcoin-orange-20 rounded-full h-2">
                          <div 
                            className="bg-bitcoin-orange h-full rounded-full transition-all"
                            style={{ width: `${analysis.sentiment.trends.score}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* AI Reasoning */}
              <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-4">
                <p className="text-bitcoin-white-60 text-xs font-semibold uppercase mb-2">
                  AI Reasoning
                </p>
                <p className="text-bitcoin-white-80 text-sm leading-relaxed">
                  {analysis.reasoning.sentiment}
                </p>
              </div>
            </div>
          </div>

          {/* On-Chain Analysis Panel - TASK 33 IMPLEMENTATION */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-6">
              <h3 className="text-xl font-bold text-bitcoin-white mb-4 flex items-center gap-2">
                <Database size={24} className="text-bitcoin-orange" />
                On-Chain Analysis
              </h3>
              
              {/* Confidence Score */}
              <div className="mb-4 bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-bitcoin-white-60 text-sm font-semibold">
                    On-Chain Confidence
                  </span>
                  <span className={`text-xl font-bold font-mono ${getConfidenceColor(signal.confidence.onChain)}`}>
                    {signal.confidence.onChain}%
                  </span>
                </div>
                <div className="w-full bg-bitcoin-black border border-bitcoin-orange-20 rounded-full h-2">
                  <div 
                    className="bg-bitcoin-orange h-full rounded-full transition-all"
                    style={{ width: `${signal.confidence.onChain}%` }}
                  />
                </div>
              </div>

              {/* Whale Activity Metrics */}
              <div className="mb-4">
                <p className="text-bitcoin-white-60 text-sm font-semibold mb-3">Whale Activity</p>
                
                {analysis.onChain.whaleActivity && (
                  <div className="space-y-3">
                    {/* Total Whale Transactions */}
                    <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-bitcoin-white-80 text-sm font-semibold">Whale Transactions (24h)</span>
                        <span className="text-bitcoin-orange text-lg font-bold font-mono">
                          {analysis.onChain.whaleActivity.totalTransactions || 0}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-bitcoin-white-60">Total Value:</span>
                          <span className="text-bitcoin-white-80 font-mono">
                            ${(analysis.onChain.whaleActivity.totalValue || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-bitcoin-white-60">Avg Size:</span>
                          <span className="text-bitcoin-white-80 font-mono">
                            ${(analysis.onChain.whaleActivity.averageSize || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Whale Activity Trend */}
                    {analysis.onChain.whaleActivity.trend && (
                      <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-bitcoin-white-80 text-sm">Activity Trend</span>
                          <span className={`font-bold ${
                            analysis.onChain.whaleActivity.trend === 'INCREASING' 
                              ? 'text-bitcoin-orange' 
                              : analysis.onChain.whaleActivity.trend === 'DECREASING'
                              ? 'text-red-500'
                              : 'text-bitcoin-white-80'
                          }`}>
                            {analysis.onChain.whaleActivity.trend === 'INCREASING' ? '↗️ Increasing' : 
                             analysis.onChain.whaleActivity.trend === 'DECREASING' ? '↘️ Decreasing' : 
                             '→ Stable'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Large Holders */}
                    {analysis.onChain.whaleActivity.largeHolders !== undefined && (
                      <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-bitcoin-white-80 text-sm">Large Holders (>1000 units)</span>
                          <span className="text-bitcoin-orange font-bold font-mono">
                            {analysis.onChain.whaleActivity.largeHolders}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Exchange Flows */}
              <div className="mb-4">
                <p className="text-bitcoin-white-60 text-sm font-semibold mb-3">Exchange Flows</p>
                
                {analysis.onChain.exchangeFlows && (
                  <div className="space-y-3">
                    {/* Deposits (Selling Pressure) */}
                    <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-bitcoin-white-80 text-sm font-semibold">
                          Exchange Deposits
                          <span className="text-bitcoin-white-60 text-xs ml-2">(Selling Pressure)</span>
                        </span>
                        <span className="text-red-500 text-lg font-bold font-mono">
                          {analysis.onChain.exchangeFlows.deposits || 0}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-bitcoin-white-60">Volume:</span>
                          <span className="text-bitcoin-white-80 font-mono">
                            ${(analysis.onChain.exchangeFlows.depositVolume || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-bitcoin-white-60">24h Change:</span>
                          <span className={`font-mono ${
                            (analysis.onChain.exchangeFlows.depositChange || 0) > 0 
                              ? 'text-red-500' 
                              : 'text-bitcoin-orange'
                          }`}>
                            {(analysis.onChain.exchangeFlows.depositChange || 0) > 0 ? '+' : ''}
                            {(analysis.onChain.exchangeFlows.depositChange || 0).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Withdrawals (Accumulation) */}
                    <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-bitcoin-white-80 text-sm font-semibold">
                          Exchange Withdrawals
                          <span className="text-bitcoin-white-60 text-xs ml-2">(Accumulation)</span>
                        </span>
                        <span className="text-bitcoin-orange text-lg font-bold font-mono">
                          {analysis.onChain.exchangeFlows.withdrawals || 0}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-bitcoin-white-60">Volume:</span>
                          <span className="text-bitcoin-white-80 font-mono">
                            ${(analysis.onChain.exchangeFlows.withdrawalVolume || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-bitcoin-white-60">24h Change:</span>
                          <span className={`font-mono ${
                            (analysis.onChain.exchangeFlows.withdrawalChange || 0) > 0 
                              ? 'text-bitcoin-orange' 
                              : 'text-red-500'
                          }`}>
                            {(analysis.onChain.exchangeFlows.withdrawalChange || 0) > 0 ? '+' : ''}
                            {(analysis.onChain.exchangeFlows.withdrawalChange || 0).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Net Flow Indicator */}
                    <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-bitcoin-white-80 text-sm font-semibold">Net Flow</span>
                        <span className={`text-lg font-bold ${
                          analysis.onChain.netFlow === 'BULLISH' 
                            ? 'text-bitcoin-orange' 
                            : analysis.onChain.netFlow === 'BEARISH'
                            ? 'text-red-500'
                            : 'text-bitcoin-white-80'
                        }`}>
                          {analysis.onChain.netFlow === 'BULLISH' ? '↗️ Bullish' : 
                           analysis.onChain.netFlow === 'BEARISH' ? '↘️ Bearish' : 
                           '→ Neutral'}
                        </span>
                      </div>
                      <div className="text-xs text-bitcoin-white-60">
                        {analysis.onChain.netFlow === 'BULLISH' 
                          ? 'More withdrawals than deposits - accumulation phase' 
                          : analysis.onChain.netFlow === 'BEARISH'
                          ? 'More deposits than withdrawals - distribution phase'
                          : 'Balanced flow - neutral market'}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Holder Distribution */}
              <div className="mb-4">
                <p className="text-bitcoin-white-60 text-sm font-semibold mb-3">Holder Distribution</p>
                
                {analysis.onChain.holderDistribution && (
                  <div className="space-y-3">
                    {/* Distribution Breakdown */}
                    <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-3">
                      <div className="space-y-2 text-xs">
                        {/* Whales */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-bitcoin-orange rounded-full"></div>
                            <span className="text-bitcoin-white-80">Whales (>10,000)</span>
                          </div>
                          <span className="text-bitcoin-orange font-bold font-mono">
                            {analysis.onChain.holderDistribution.whales || 0}%
                          </span>
                        </div>
                        <div className="w-full bg-bitcoin-black border border-bitcoin-orange-20 rounded-full h-2">
                          <div 
                            className="bg-bitcoin-orange h-full rounded-full transition-all"
                            style={{ width: `${analysis.onChain.holderDistribution.whales || 0}%` }}
                          />
                        </div>

                        {/* Large Holders */}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-bitcoin-white-80 rounded-full"></div>
                            <span className="text-bitcoin-white-80">Large (1,000-10,000)</span>
                          </div>
                          <span className="text-bitcoin-white-80 font-bold font-mono">
                            {analysis.onChain.holderDistribution.large || 0}%
                          </span>
                        </div>
                        <div className="w-full bg-bitcoin-black border border-bitcoin-orange-20 rounded-full h-2">
                          <div 
                            className="bg-bitcoin-white-80 h-full rounded-full transition-all"
                            style={{ width: `${analysis.onChain.holderDistribution.large || 0}%` }}
                          />
                        </div>

                        {/* Medium Holders */}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-bitcoin-white-60 rounded-full"></div>
                            <span className="text-bitcoin-white-80">Medium (100-1,000)</span>
                          </div>
                          <span className="text-bitcoin-white-60 font-bold font-mono">
                            {analysis.onChain.holderDistribution.medium || 0}%
                          </span>
                        </div>
                        <div className="w-full bg-bitcoin-black border border-bitcoin-orange-20 rounded-full h-2">
                          <div 
                            className="bg-bitcoin-white-60 h-full rounded-full transition-all"
                            style={{ width: `${analysis.onChain.holderDistribution.medium || 0}%` }}
                          />
                        </div>

                        {/* Small Holders */}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-bitcoin-orange-20 rounded-full"></div>
                            <span className="text-bitcoin-white-80">Small (<100)</span>
                          </div>
                          <span className="text-bitcoin-white-60 font-bold font-mono">
                            {analysis.onChain.holderDistribution.small || 0}%
                          </span>
                        </div>
                        <div className="w-full bg-bitcoin-black border border-bitcoin-orange-20 rounded-full h-2">
                          <div 
                            className="bg-bitcoin-orange-20 h-full rounded-full transition-all"
                            style={{ width: `${analysis.onChain.holderDistribution.small || 0}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Distribution Analysis */}
                    <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-bitcoin-white-80 text-sm font-semibold">Distribution Health</span>
                        <span className={`font-bold ${
                          analysis.onChain.holderDistribution.concentration === 'LOW' 
                            ? 'text-bitcoin-orange' 
                            : analysis.onChain.holderDistribution.concentration === 'HIGH'
                            ? 'text-red-500'
                            : 'text-bitcoin-white-80'
                        }`}>
                          {analysis.onChain.holderDistribution.concentration === 'LOW' ? '✓ Healthy' : 
                           analysis.onChain.holderDistribution.concentration === 'HIGH' ? '⚠ Concentrated' : 
                           '→ Moderate'}
                        </span>
                      </div>
                      <div className="text-xs text-bitcoin-white-60">
                        {analysis.onChain.holderDistribution.concentration === 'LOW' 
                          ? 'Well-distributed holdings reduce manipulation risk' 
                          : analysis.onChain.holderDistribution.concentration === 'HIGH'
                          ? 'High concentration increases volatility and manipulation risk'
                          : 'Moderate concentration - typical for most assets'}
                      </div>
                    </div>

                    {/* Total Holders */}
                    {analysis.onChain.holderDistribution.totalHolders !== undefined && (
                      <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-bitcoin-white-80 text-sm">Total Unique Holders</span>
                          <span className="text-bitcoin-orange font-bold font-mono text-lg">
                            {analysis.onChain.holderDistribution.totalHolders.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* AI Reasoning */}
              <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-4">
                <p className="text-bitcoin-white-60 text-xs font-semibold uppercase mb-2">
                  AI Reasoning
                </p>
                <p className="text-bitcoin-white-80 text-sm leading-relaxed">
                  {analysis.reasoning.onChain}
                </p>
              </div>
            </div>

            {/* Risk Analysis Panel - TASK 34 IMPLEMENTATION */}
            <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-6">
              <h3 className="text-xl font-bold text-bitcoin-white mb-4 flex items-center gap-2">
                <Shield size={24} className="text-bitcoin-orange" />
                Risk Analysis
              </h3>

              {/* Confidence Score */}
              <div className="mb-4 bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-bitcoin-white-60 text-sm font-semibold">
                    Risk Confidence
                  </span>
                  <span className={`text-xl font-bold font-mono ${getConfidenceColor(signal.confidence.risk)}`}>
                    {signal.confidence.risk}%
                  </span>
                </div>
                <div className="w-full bg-bitcoin-black border border-bitcoin-orange-20 rounded-full h-2">
                  <div 
                    className="bg-bitcoin-orange h-full rounded-full transition-all"
                    style={{ width: `${signal.confidence.risk}%` }}
                  />
                </div>
              </div>

              {/* Position Size and Allocation */}
              <div className="mb-4">
                <p className="text-bitcoin-white-60 text-sm font-semibold mb-3">Position Size & Allocation</p>
                
                <div className="space-y-3">
                  {/* Position Size */}
                  <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-bitcoin-white-80 text-sm font-semibold">Position Size</span>
                      <span className="text-bitcoin-orange text-lg font-bold font-mono">
                        {signal.positionSize.toFixed(4)} {signal.symbol}
                      </span>
                    </div>
                    <div className="text-xs text-bitcoin-white-60">
                      Optimal position size based on account balance and risk tolerance
                    </div>
                  </div>

                  {/* Entry Price */}
                  <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-bitcoin-white-80 text-sm">Entry Price</span>
                      <span className="text-bitcoin-white font-bold font-mono">
                        ${formatCurrency(signal.entry)}
                      </span>
                    </div>
                  </div>

                  {/* Position Value */}
                  <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-bitcoin-white-80 text-sm">Position Value</span>
                      <span className="text-bitcoin-white font-bold font-mono">
                        ${formatCurrency(signal.positionSize * signal.entry)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk-Reward Ratio */}
              <div className="mb-4">
                <p className="text-bitcoin-white-60 text-sm font-semibold mb-3">Risk-Reward Ratio</p>
                
                <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-bitcoin-white-80 text-sm font-semibold">Risk:Reward</span>
                    <span className={`text-2xl font-bold font-mono ${
                      signal.riskReward >= 2 ? 'text-bitcoin-orange' : 'text-red-500'
                    }`}>
                      1:{signal.riskReward.toFixed(2)}
                    </span>
                  </div>
                  
                  {/* Visual Representation */}
                  <div className="space-y-2">
                    {/* Risk Bar */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-bitcoin-white-60 text-xs">Risk (Loss)</span>
                        <span className="text-red-500 text-xs font-mono">
                          ${formatCurrency(signal.maxLoss)}
                        </span>
                      </div>
                      <div className="w-full bg-bitcoin-black border border-bitcoin-orange-20 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-full rounded-full transition-all"
                          style={{ width: '33.33%' }}
                        />
                      </div>
                    </div>

                    {/* Reward Bar */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-bitcoin-white-60 text-xs">Reward (Profit)</span>
                        <span className="text-bitcoin-orange text-xs font-mono">
                          ${formatCurrency(signal.maxLoss * signal.riskReward)}
                        </span>
                      </div>
                      <div className="w-full bg-bitcoin-black border border-bitcoin-orange-20 rounded-full h-2">
                        <div 
                          className="bg-bitcoin-orange h-full rounded-full transition-all"
                          style={{ width: `${Math.min((signal.riskReward / 3) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Risk-Reward Status */}
                  <div className="mt-3 text-xs">
                    {signal.riskReward >= 2 ? (
                      <div className="flex items-center gap-2 text-bitcoin-orange">
                        <span className="text-lg">✓</span>
                        <span>Meets minimum 2:1 risk-reward requirement</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-500">
                        <span className="text-lg">⚠</span>
                        <span>Below recommended 2:1 risk-reward ratio</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Maximum Loss Calculation */}
              <div className="mb-4">
                <p className="text-bitcoin-white-60 text-sm font-semibold mb-3">Maximum Loss</p>
                
                <div className="space-y-3">
                  {/* Max Loss Amount */}
                  <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-bitcoin-white-80 text-sm font-semibold">Maximum Loss</span>
                      <span className="text-red-500 text-lg font-bold font-mono">
                        ${formatCurrency(signal.maxLoss)}
                      </span>
                    </div>
                    <div className="text-xs text-bitcoin-white-60">
                      Maximum 2% of account balance per trade
                    </div>
                  </div>

                  {/* Loss Percentage */}
                  <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-bitcoin-white-80 text-sm">% of Account at Risk</span>
                      <span className="text-bitcoin-white font-bold font-mono">
                        {((signal.maxLoss / (signal.positionSize * signal.entry)) * 100).toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  {/* Distance to Stop Loss */}
                  <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-bitcoin-white-80 text-sm">Distance to Stop Loss</span>
                      <span className="text-bitcoin-white font-bold font-mono">
                        {Math.abs(((signal.stopLoss - signal.entry) / signal.entry) * 100).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stop-Loss and Take-Profit Levels */}
              <div className="mb-4">
                <p className="text-bitcoin-white-60 text-sm font-semibold mb-3">Stop-Loss & Take-Profit Levels</p>
                
                <div className="space-y-3">
                  {/* Stop Loss */}
                  <div className="bg-red-500 bg-opacity-10 border-2 border-red-500 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-bitcoin-white-80 text-sm font-semibold">Stop Loss</span>
                      <span className="text-red-500 text-lg font-bold font-mono">
                        ${formatCurrency(signal.stopLoss)}
                      </span>
                    </div>
                    <div className="text-xs text-bitcoin-white-60">
                      ATR-based dynamic stop adapting to volatility
                    </div>
                  </div>

                  {/* Take Profit 1 */}
                  <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-bitcoin-white-80 text-sm font-semibold">Take Profit 1</span>
                        <span className="text-bitcoin-white-60 text-xs">(50% allocation)</span>
                      </div>
                      <span className="text-bitcoin-orange text-lg font-bold font-mono">
                        ${formatCurrency(signal.takeProfits.tp1.price)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-bitcoin-white-60">Profit per unit:</span>
                      <span className="text-bitcoin-orange font-mono">
                        ${formatCurrency(Math.abs(signal.takeProfits.tp1.price - signal.entry))}
                      </span>
                    </div>
                  </div>

                  {/* Take Profit 2 */}
                  <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-bitcoin-white-80 text-sm font-semibold">Take Profit 2</span>
                        <span className="text-bitcoin-white-60 text-xs">(30% allocation)</span>
                      </div>
                      <span className="text-bitcoin-orange text-lg font-bold font-mono">
                        ${formatCurrency(signal.takeProfits.tp2.price)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-bitcoin-white-60">Profit per unit:</span>
                      <span className="text-bitcoin-orange font-mono">
                        ${formatCurrency(Math.abs(signal.takeProfits.tp2.price - signal.entry))}
                      </span>
                    </div>
                  </div>

                  {/* Take Profit 3 */}
                  <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-bitcoin-white-80 text-sm font-semibold">Take Profit 3</span>
                        <span className="text-bitcoin-white-60 text-xs">(20% allocation)</span>
                      </div>
                      <span className="text-bitcoin-orange text-lg font-bold font-mono">
                        ${formatCurrency(signal.takeProfits.tp3.price)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-bitcoin-white-60">Profit per unit:</span>
                      <span className="text-bitcoin-orange font-mono">
                        ${formatCurrency(Math.abs(signal.takeProfits.tp3.price - signal.entry))}
                      </span>
                    </div>
                  </div>

                  {/* Price Ladder Visualization */}
                  <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-3">
                    <p className="text-bitcoin-white-60 text-xs font-semibold uppercase mb-3">Price Ladder</p>
                    <div className="space-y-2">
                      {signal.positionType === 'LONG' ? (
                        <>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-bitcoin-orange">TP3 (20%)</span>
                            <span className="text-bitcoin-orange font-mono">${formatCurrency(signal.takeProfits.tp3.price)}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-bitcoin-orange">TP2 (30%)</span>
                            <span className="text-bitcoin-orange font-mono">${formatCurrency(signal.takeProfits.tp2.price)}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-bitcoin-orange">TP1 (50%)</span>
                            <span className="text-bitcoin-orange font-mono">${formatCurrency(signal.takeProfits.tp1.price)}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs border-t border-bitcoin-orange-20 pt-2">
                            <span className="text-bitcoin-white font-semibold">ENTRY</span>
                            <span className="text-bitcoin-white font-mono font-bold">${formatCurrency(signal.entry)}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs border-t border-bitcoin-orange-20 pt-2">
                            <span className="text-red-500">STOP LOSS</span>
                            <span className="text-red-500 font-mono">${formatCurrency(signal.stopLoss)}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-red-500">STOP LOSS</span>
                            <span className="text-red-500 font-mono">${formatCurrency(signal.stopLoss)}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs border-t border-bitcoin-orange-20 pt-2">
                            <span className="text-bitcoin-white font-semibold">ENTRY</span>
                            <span className="text-bitcoin-white font-mono font-bold">${formatCurrency(signal.entry)}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs border-t border-bitcoin-orange-20 pt-2">
                            <span className="text-bitcoin-orange">TP1 (50%)</span>
                            <span className="text-bitcoin-orange font-mono">${formatCurrency(signal.takeProfits.tp1.price)}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-bitcoin-orange">TP2 (30%)</span>
                            <span className="text-bitcoin-orange font-mono">${formatCurrency(signal.takeProfits.tp2.price)}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-bitcoin-orange">TP3 (20%)</span>
                            <span className="text-bitcoin-orange font-mono">${formatCurrency(signal.takeProfits.tp3.price)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk Metrics Summary */}
              <div className="mb-4">
                <p className="text-bitcoin-white-60 text-sm font-semibold mb-3">Risk Metrics</p>
                
                <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-3">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-bitcoin-white-60">Volatility:</span>
                      <span className="text-bitcoin-white-80 font-mono">
                        {formatPercentage(analysis.risk.volatility)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-bitcoin-white-60">Liquidity Risk:</span>
                      <span className={`font-mono ${
                        analysis.risk.liquidityRisk === 'LOW' 
                          ? 'text-bitcoin-orange' 
                          : analysis.risk.liquidityRisk === 'HIGH'
                          ? 'text-red-500'
                          : 'text-bitcoin-white-80'
                      }`}>
                        {analysis.risk.liquidityRisk}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-bitcoin-white-60">Market Conditions:</span>
                      <span className="text-bitcoin-white-80 font-mono">
                        {analysis.risk.marketConditions}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-bitcoin-white-60">Recommendation:</span>
                      <span className={`font-mono ${
                        analysis.risk.recommendation === 'FAVORABLE' 
                          ? 'text-bitcoin-orange' 
                          : analysis.risk.recommendation === 'UNFAVORABLE'
                          ? 'text-red-500'
                          : 'text-bitcoin-white-80'
                      }`}>
                        {analysis.risk.recommendation}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Reasoning */}
              <div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-4">
                <p className="text-bitcoin-white-60 text-xs font-semibold uppercase mb-2">
                  AI Reasoning
                </p>
                <p className="text-bitcoin-white-80 text-sm leading-relaxed">
                  {analysis.reasoning.risk}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="sticky bottom-0 bg-bitcoin-black border-t-2 border-bitcoin-orange pt-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              {onReject && (
                <button
                  onClick={() => setShowConfirmation('reject')}
                  className="bg-transparent text-bitcoin-orange border-2 border-bitcoin-orange font-bold uppercase tracking-wider px-8 py-3 rounded-lg transition-all hover:bg-bitcoin-orange hover:text-bitcoin-black hover:shadow-[0_0_20px_rgba(247,147,26,0.3)] min-h-[48px]"
                >
                  Reject
                </button>
              )}

              {onModify && (
                <button
                  onClick={() => setShowConfirmation('modify')}
                  className="bg-transparent text-bitcoin-orange border-2 border-bitcoin-orange font-bold uppercase tracking-wider px-8 py-3 rounded-lg transition-all hover:bg-bitcoin-orange hover:text-bitcoin-black hover:shadow-[0_0_20px_rgba(247,147,26,0.3)] min-h-[48px]"
                >
                  Modify
                </button>
              )}

              {onApprove && (
                <button
                  onClick={() => setShowConfirmation('approve')}
                  className="bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange font-bold uppercase tracking-wider px-8 py-3 rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange hover:shadow-[0_0_30px_rgba(247,147,26,0.5)] hover:scale-105 active:scale-95 min-h-[48px]"
                >
                  Approve Trade
                </button>
              )}
            </div>
          </div>

          {/* Confirmation Dialog */}
          {showConfirmation && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bitcoin-black bg-opacity-90">
              <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl max-w-md w-full p-6 shadow-[0_0_40px_rgba(247,147,26,0.5)]">
                {/* Confirmation Header */}
                <div className="flex items-center gap-3 mb-4">
                  {showConfirmation === 'approve' ? (
                    <CheckCircle size={32} className="text-bitcoin-orange" />
                  ) : (
                    <AlertTriangle size={32} className="text-bitcoin-orange" />
                  )}
                  <h3 className="text-xl font-bold text-bitcoin-white">
                    {showConfirmation === 'approve' && 'Approve Trade Signal?'}
                    {showConfirmation === 'reject' && 'Reject Trade Signal?'}
                    {showConfirmation === 'modify' && 'Modify Trade Signal?'}
                  </h3>
                </div>

                {/* Confirmation Message */}
                <div className="mb-6">
                  {showConfirmation === 'approve' && (
                    <div className="space-y-3">
                      <p className="text-bitcoin-white-80 text-sm">
                        You are about to approve this trade signal and save it to the database.
                      </p>
                      <div className="bg-bitcoin-orange bg-opacity-10 border border-bitcoin-orange-20 rounded-lg p-3">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-bitcoin-white-60">Symbol:</span>
                            <span className="text-bitcoin-white font-bold">{signal.symbol}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-bitcoin-white-60">Type:</span>
                            <span className={getPositionColor(signal.positionType)}>
                              {signal.positionType}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-bitcoin-white-60">Entry:</span>
                            <span className="text-bitcoin-white font-mono">
                              ${formatCurrency(signal.entry)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-bitcoin-white-60">Confidence:</span>
                            <span className="text-bitcoin-orange font-mono">
                              {signal.confidence.overall}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-bitcoin-white-60 text-xs">
                        This action cannot be undone. The trade signal will be saved with status "APPROVED".
                      </p>
                    </div>
                  )}

                  {showConfirmation === 'reject' && (
                    <div className="space-y-3">
                      <p className="text-bitcoin-white-80 text-sm">
                        You are about to reject this trade signal. The signal will be discarded and not saved to the database.
                      </p>
                      <div className="bg-red-500 bg-opacity-10 border border-red-500 rounded-lg p-3">
                        <p className="text-bitcoin-white-80 text-xs">
                          <span className="text-red-500 font-bold">Warning:</span> This action cannot be undone. You will need to regenerate the analysis if you change your mind.
                        </p>
                      </div>
                    </div>
                  )}

                  {showConfirmation === 'modify' && (
                    <div className="space-y-3">
                      <p className="text-bitcoin-white-80 text-sm">
                        You are about to modify this trade signal. You will be able to adjust entry, stop-loss, and take-profit levels before saving.
                      </p>
                      <div className="bg-bitcoin-orange bg-opacity-10 border border-bitcoin-orange-20 rounded-lg p-3">
                        <p className="text-bitcoin-white-80 text-xs">
                          <span className="text-bitcoin-orange font-bold">Note:</span> Modified signals will be marked as "MODIFIED" in the database for tracking purposes.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirmation Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={handleCancelConfirmation}
                    className="flex-1 bg-transparent text-bitcoin-white-80 border-2 border-bitcoin-white-60 font-bold uppercase tracking-wider px-6 py-3 rounded-lg transition-all hover:bg-bitcoin-white-60 hover:text-bitcoin-black min-h-[48px]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={
                      showConfirmation === 'approve'
                        ? handleConfirmApprove
                        : showConfirmation === 'reject'
                        ? handleConfirmReject
                        : handleConfirmModify
                    }
                    className={`flex-1 font-bold uppercase tracking-wider px-6 py-3 rounded-lg transition-all min-h-[48px] ${
                      showConfirmation === 'approve'
                        ? 'bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange hover:bg-bitcoin-black hover:text-bitcoin-orange hover:shadow-[0_0_30px_rgba(247,147,26,0.5)]'
                        : 'bg-transparent text-bitcoin-orange border-2 border-bitcoin-orange hover:bg-bitcoin-orange hover:text-bitcoin-black hover:shadow-[0_0_20px_rgba(247,147,26,0.3)]'
                    }`}
                  >
                    {showConfirmation === 'approve' && 'Confirm Approval'}
                    {showConfirmation === 'reject' && 'Confirm Rejection'}
                    {showConfirmation === 'modify' && 'Proceed to Modify'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
