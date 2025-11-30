/**
 * Enhanced Social Sentiment Panel Component for UCIE
 * 
 * Displays comprehensive social sentiment analysis with:
 * - LunarCrush Galaxy Score, Social Dominance, Trending Score
 * - Overall sentiment with visual gauge
 * - Reddit community sentiment
 * - Social volume and engagement metrics
 * 
 * Updated: November 27, 2025 - Enhanced LunarCrush integration
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus, Users, MessageCircle, Star, Activity } from 'lucide-react';

interface EnhancedSocialSentimentPanelProps {
  data: any;
  loading?: boolean;
  error?: string | null;
}

export default function EnhancedSocialSentimentPanel({
  data,
  loading = false,
  error = null,
}: EnhancedSocialSentimentPanelProps) {
  if (loading) {
    return (
      <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6">
        <h2 className="text-2xl font-bold text-bitcoin-white mb-4">
          Social Sentiment Analysis
        </h2>
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse text-bitcoin-white-60">Loading sentiment data...</div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6">
        <h2 className="text-2xl font-bold text-bitcoin-white mb-4">
          Social Sentiment Analysis
        </h2>
        <div className="bg-bitcoin-orange-10 border border-bitcoin-orange-20 rounded-lg p-4">
          <p className="text-bitcoin-white-80">{error || 'No sentiment data available'}</p>
        </div>
      </div>
    );
  }

  const { overallScore, sentiment, lunarCrush, reddit } = data;

  // Determine sentiment color and icon
  const getSentimentDisplay = (score: number) => {
    if (score > 60) {
      return {
        color: 'text-bitcoin-orange',
        icon: <TrendingUp className="w-5 h-5" />,
        label: 'Bullish'
      };
    } else if (score < 40) {
      return {
        color: 'text-bitcoin-white-60',
        icon: <TrendingDown className="w-5 h-5" />,
        label: 'Bearish'
      };
    } else {
      return {
        color: 'text-bitcoin-white-80',
        icon: <Minus className="w-5 h-5" />,
        label: 'Neutral'
      };
    }
  };

  const sentimentDisplay = getSentimentDisplay(overallScore);

  return (
    <div className="bg-bitcoin-black border border-bitcoin-orange rounded-xl p-6">
      {/* Header */}
      <div className="border-b-2 border-bitcoin-orange pb-4 mb-6">
        <h2 className="text-2xl font-bold text-bitcoin-white mb-2">
          Social Sentiment Analysis
        </h2>
        <p className="text-sm text-bitcoin-white-60 italic">
          Powered by LunarCrush, Reddit, and social platforms
        </p>
      </div>

      {/* Overall Sentiment Score */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-bitcoin-white-60 uppercase tracking-wider mb-1">
              Overall Sentiment
            </p>
            <div className="flex items-center gap-3">
              <span className={`text-4xl font-mono font-bold ${sentimentDisplay.color}`}>
                {overallScore}
              </span>
              <span className="text-bitcoin-white-60">/100</span>
              <div className={sentimentDisplay.color}>
                {sentimentDisplay.icon}
              </div>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-lg border-2 ${sentimentDisplay.color} border-current`}>
            <span className={`font-bold uppercase ${sentimentDisplay.color}`}>
              {sentimentDisplay.label}
            </span>
          </div>
        </div>

        {/* Sentiment Bar */}
        <div className="relative h-3 bg-bitcoin-black border border-bitcoin-orange-20 rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-bitcoin-orange transition-all duration-500"
            style={{ width: `${overallScore}%` }}
          />
        </div>
      </div>

      {/* LunarCrush Metrics */}
      {lunarCrush && (
        <div className="mb-8">
          <h3 className="text-lg font-bold text-bitcoin-white mb-4 flex items-center gap-2">
            <span className="text-2xl">🌙</span>
            LunarCrush Intelligence
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* Galaxy Score */}
            <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4 hover:border-bitcoin-orange transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-bitcoin-orange" />
                <p className="text-xs text-bitcoin-white-60 uppercase tracking-wider">
                  Galaxy Score
                </p>
              </div>
              <p className="text-2xl font-mono font-bold text-bitcoin-orange">
                {lunarCrush.galaxyScore || 0}
              </p>
              <p className="text-xs text-bitcoin-white-60 mt-1">
                Overall market strength
              </p>
            </div>

            {/* Social Score */}
            <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4 hover:border-bitcoin-orange transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-bitcoin-orange" />
                <p className="text-xs text-bitcoin-white-60 uppercase tracking-wider">
                  Social Score
                </p>
              </div>
              <p className="text-2xl font-mono font-bold text-bitcoin-white">
                {lunarCrush.socialScore || 0}
              </p>
              <p className="text-xs text-bitcoin-white-60 mt-1">
                Social engagement level
              </p>
            </div>

            {/* Trending Score */}
            <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4 hover:border-bitcoin-orange transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-bitcoin-orange" />
                <p className="text-xs text-bitcoin-white-60 uppercase tracking-wider">
                  Trending Score
                </p>
              </div>
              <p className="text-2xl font-mono font-bold text-bitcoin-white">
                {lunarCrush.trendingScore || 0}
              </p>
              <p className="text-xs text-bitcoin-white-60 mt-1">
                Current trend momentum
              </p>
            </div>
          </div>

          {/* Additional LunarCrush Metrics - Only Available Data */}
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              label="AltRank"
              value={`#${lunarCrush.altRank || 'N/A'}`}
              subtext="Social ranking"
            />
            {lunarCrush.volatility !== undefined && (
              <MetricCard
                label="Volatility"
                value={`${(lunarCrush.volatility || 0).toFixed(2)}`}
                subtext="Price volatility"
              />
            )}
          </div>

          {/* API Limitation Notice */}
          <div className="mt-4 p-3 bg-bitcoin-orange-5 border border-bitcoin-orange-20 rounded-lg">
            <p className="text-xs text-bitcoin-white-60 italic">
              ℹ️ LunarCrush v4 API provides Galaxy Score, AltRank, and Volatility. 
              Additional social metrics require API tier upgrade.
            </p>
          </div>
        </div>
      )}

      {/* Reddit Metrics */}
      {reddit && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-bitcoin-white mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-bitcoin-orange" />
            Reddit Community
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <MetricCard
              label="Mentions (24h)"
              value={reddit.mentions24h || 0}
              subtext="Total posts"
            />
            <MetricCard
              label="Sentiment"
              value={`${reddit.sentiment || 0}/100`}
              subtext="Community mood"
            />
            <MetricCard
              label="Posts/Day"
              value={reddit.postsPerDay || 0}
              subtext="Activity level"
            />
          </div>

          {/* Active Subreddits */}
          {reddit.activeSubreddits && reddit.activeSubreddits.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-bitcoin-white-60 mb-2">Active Subreddits:</p>
              <div className="flex flex-wrap gap-2">
                {reddit.activeSubreddits.map((sub: string) => (
                  <span
                    key={sub}
                    className="px-3 py-1 bg-bitcoin-orange-10 border border-bitcoin-orange-20 rounded-full text-sm text-bitcoin-white-80"
                  >
                    r/{sub}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Data Quality Indicator */}
      <div className="mt-6 pt-4 border-t border-bitcoin-orange-20">
        <div className="flex items-center justify-between text-sm">
          <span className="text-bitcoin-white-60">Data Quality</span>
          <span className="text-bitcoin-orange font-mono font-bold">
            {data.dataQuality || 0}%
          </span>
        </div>
      </div>
    </div>
  );
}

// Helper Components

function MetricCard({ label, value, subtext }: { label: string; value: string | number; subtext: string }) {
  return (
    <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-3 hover:border-bitcoin-orange transition-all">
      <p className="text-xs text-bitcoin-white-60 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-lg font-mono font-bold text-bitcoin-white">
        {value}
      </p>
      <p className="text-xs text-bitcoin-white-60 mt-1">
        {subtext}
      </p>
    </div>
  );
}

// Helper Functions

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}
