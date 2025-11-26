/**
 * Social Metrics Panel - LunarCrush Bitcoin Social Intelligence
 * 
 * Displays enhanced social metrics including:
 * - Galaxy Score (social health)
 * - Alt Rank (market position)
 * - Social Dominance (% of crypto social volume)
 * - Social Volume (mentions/posts)
 * - Social Score (engagement quality)
 * - Influencers (influential accounts)
 * 
 * Bitcoin Sovereign Technology Design
 */

import React from 'react';
import { TrendingUp, Users, MessageCircle, Star, Award, Activity } from 'lucide-react';

interface SocialMetricsPanelProps {
  sentiment: {
    score: number;
    socialDominance: number;
    galaxyScore: number;
    altRank: number;
    socialVolume: number;
    socialScore: number;
    influencers: number;
  };
  className?: string;
}

export default function SocialMetricsPanel({ sentiment, className = '' }: SocialMetricsPanelProps) {
  // Determine galaxy score color and status
  const getGalaxyScoreStatus = (score: number) => {
    if (score >= 70) return { color: 'text-bitcoin-orange', status: 'Excellent', glow: true };
    if (score >= 50) return { color: 'text-bitcoin-white', status: 'Good', glow: false };
    if (score >= 30) return { color: 'text-bitcoin-white-80', status: 'Fair', glow: false };
    return { color: 'text-bitcoin-white-60', status: 'Poor', glow: false };
  };

  // Determine alt rank status
  const getAltRankStatus = (rank: number) => {
    if (rank <= 50) return { color: 'text-bitcoin-orange', status: 'Top 50', badge: '🏆' };
    if (rank <= 100) return { color: 'text-bitcoin-orange', status: 'Top 100', badge: '⭐' };
    if (rank <= 500) return { color: 'text-bitcoin-white', status: 'Top 500', badge: '✨' };
    return { color: 'text-bitcoin-white-80', status: `#${rank}`, badge: '📊' };
  };

  // Determine social dominance status
  const getSocialDominanceStatus = (dominance: number) => {
    if (dominance >= 5) return { color: 'text-bitcoin-orange', status: 'Dominant' };
    if (dominance >= 2) return { color: 'text-bitcoin-white', status: 'Strong' };
    if (dominance >= 1) return { color: 'text-bitcoin-white-80', status: 'Moderate' };
    return { color: 'text-bitcoin-white-60', status: 'Low' };
  };

  const galaxyStatus = getGalaxyScoreStatus(sentiment.galaxyScore);
  const altRankStatus = getAltRankStatus(sentiment.altRank);
  const dominanceStatus = getSocialDominanceStatus(sentiment.socialDominance);

  return (
    <div className={`bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-bitcoin-orange bg-opacity-10 p-2 rounded-lg">
            <Activity className="w-6 h-6 text-bitcoin-orange" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-bitcoin-white">
              Bitcoin Social Intelligence
            </h3>
            <p className="text-bitcoin-white-60 text-xs italic">
              LunarCrush Enhanced Metrics
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-bitcoin-white-60 text-xs">Sentiment</p>
          <p className="text-bitcoin-white font-mono text-lg font-bold">
            {sentiment.score}/100
          </p>
        </div>
      </div>

      {/* Galaxy Score - Primary Metric */}
      <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-bitcoin-orange" />
            <h4 className="text-sm font-bold text-bitcoin-white">Galaxy Score</h4>
          </div>
          <div className="text-right">
            <p className={`text-3xl font-mono font-bold ${galaxyStatus.color} ${galaxyStatus.glow ? '[text-shadow:0_0_20px_rgba(247,147,26,0.5)]' : ''}`}>
              {sentiment.galaxyScore}
            </p>
            <p className="text-bitcoin-white-60 text-xs">{galaxyStatus.status}</p>
          </div>
        </div>
        <div className="w-full bg-bitcoin-black border border-bitcoin-orange-20 rounded-full h-2">
          <div 
            className="bg-bitcoin-orange h-full rounded-full transition-all duration-500"
            style={{ width: `${sentiment.galaxyScore}%` }}
          ></div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Alt Rank */}
        <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-bitcoin-orange" />
            <p className="text-bitcoin-white-60 text-xs font-semibold">Alt Rank</p>
          </div>
          <div className="flex items-baseline gap-2">
            <p className={`text-2xl font-mono font-bold ${altRankStatus.color}`}>
              #{sentiment.altRank}
            </p>
            <span className="text-lg">{altRankStatus.badge}</span>
          </div>
          <p className="text-bitcoin-white-60 text-xs mt-1">{altRankStatus.status}</p>
        </div>

        {/* Social Dominance */}
        <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-bitcoin-orange" />
            <p className="text-bitcoin-white-60 text-xs font-semibold">Social Dominance</p>
          </div>
          <p className={`text-2xl font-mono font-bold ${dominanceStatus.color}`}>
            {sentiment.socialDominance.toFixed(2)}%
          </p>
          <p className="text-bitcoin-white-60 text-xs mt-1">{dominanceStatus.status}</p>
        </div>

        {/* Social Volume */}
        <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="w-4 h-4 text-bitcoin-orange" />
            <p className="text-bitcoin-white-60 text-xs font-semibold">Social Volume</p>
          </div>
          <p className="text-2xl font-mono font-bold text-bitcoin-white">
            {sentiment.socialVolume.toLocaleString()}
          </p>
          <p className="text-bitcoin-white-60 text-xs mt-1">24h Mentions</p>
        </div>

        {/* Influencers */}
        <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-bitcoin-orange" />
            <p className="text-bitcoin-white-60 text-xs font-semibold">Influencers</p>
          </div>
          <p className="text-2xl font-mono font-bold text-bitcoin-white">
            {sentiment.influencers}
          </p>
          <p className="text-bitcoin-white-60 text-xs mt-1">Active Accounts</p>
        </div>
      </div>

      {/* Social Score */}
      <div className="mt-3 bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-bitcoin-white-60 text-xs font-semibold mb-1">Social Score</p>
            <p className="text-bitcoin-white-80 text-sm">
              Overall engagement quality
            </p>
          </div>
          <p className="text-2xl font-mono font-bold text-bitcoin-orange">
            {sentiment.socialScore}
          </p>
        </div>
      </div>

      {/* Data Source Footer */}
      <div className="mt-4 pt-3 border-t border-bitcoin-orange-20">
        <p className="text-bitcoin-white-60 text-xs text-center">
          📊 Enhanced metrics calculated from LunarCrush Galaxy Score & Alt Rank
        </p>
      </div>
    </div>
  );
}
