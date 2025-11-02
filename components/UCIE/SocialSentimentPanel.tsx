/**
 * Social Sentiment Panel Component for UCIE
 * 
 * Displays comprehensive social sentiment analysis:
 * - Overall sentiment score with gauge visualization
 * - Sentiment trends chart (24h, 7d, 30d)
 * - Top social media posts with engagement metrics
 * - Key influencers and their sentiment
 * - Trending topics and hashtags
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import React, { useState } from 'react';
import type { AggregatedSentiment } from '../../lib/ucie/sentimentAnalysis';
import type { InfluencerMetrics } from '../../lib/ucie/influencerTracking';
import type { SocialPost, Influencer } from '../../lib/ucie/socialSentimentClients';

// ============================================================================
// Type Definitions
// ============================================================================

interface SocialSentimentPanelProps {
  symbol: string;
  sentiment: AggregatedSentiment;
  influencers: InfluencerMetrics;
  loading?: boolean;
  error?: string | null;
}

// ============================================================================
// Main Component
// ============================================================================

export default function SocialSentimentPanel({
  symbol,
  sentiment,
  influencers,
  loading = false,
  error = null,
}: SocialSentimentPanelProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'24h' | '7d' | '30d'>('24h');

  if (loading) {
    return (
      <div className="bitcoin-block">
        <h2 className="text-2xl font-bold text-bitcoin-white mb-4">
          Social Sentiment Analysis
        </h2>
        <div className="flex items-center justify-center py-12">
          <div className="text-bitcoin-white-60">Loading sentiment data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bitcoin-block">
        <h2 className="text-2xl font-bold text-bitcoin-white mb-4">
          Social Sentiment Analysis
        </h2>
        <div className="bg-bitcoin-orange-10 border border-bitcoin-orange-20 rounded-lg p-4">
          <p className="text-bitcoin-white-80">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bitcoin-block">
      {/* Header */}
      <div className="border-b-2 border-bitcoin-orange pb-4 mb-6">
        <h2 className="text-2xl font-bold text-bitcoin-white mb-2">
          Social Sentiment Analysis
        </h2>
        <p className="text-sm text-bitcoin-white-60 italic">
          Aggregated sentiment from Twitter, Reddit, and social platforms
        </p>
      </div>

      {/* Overall Sentiment Score */}
      <div className="mb-8">
        <SentimentGauge
          score={sentiment.overallScore}
          confidence={sentiment.confidence}
        />
      </div>

      {/* Sentiment Breakdown */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-bitcoin-white mb-4">
          Sentiment Breakdown
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SentimentSourceCard
            source="LunarCrush"
            score={sentiment.breakdown.lunarCrush}
            icon="🌙"
          />
          <SentimentSourceCard
            source="Twitter/X"
            score={sentiment.breakdown.twitter}
            icon="🐦"
          />
          <SentimentSourceCard
            source="Reddit"
            score={sentiment.breakdown.reddit}
            icon="🤖"
          />
        </div>
      </div>

      {/* Sentiment Distribution */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-bitcoin-white mb-4">
          Sentiment Distribution
        </h3>
        <SentimentDistributionBar distribution={sentiment.distribution} />
      </div>

      {/* Sentiment Trends */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-bitcoin-white">
            Sentiment Trends
          </h3>
          <div className="flex gap-2">
            <TimeframeButton
              label="24H"
              active={selectedTimeframe === '24h'}
              onClick={() => setSelectedTimeframe('24h')}
            />
            <TimeframeButton
              label="7D"
              active={selectedTimeframe === '7d'}
              onClick={() => setSelectedTimeframe('7d')}
            />
            <TimeframeButton
              label="30D"
              active={selectedTimeframe === '30d'}
              onClick={() => setSelectedTimeframe('30d')}
            />
          </div>
        </div>
        <SentimentTrendChart
          trends={sentiment.trends[selectedTimeframe]}
          timeframe={selectedTimeframe}
        />
      </div>

      {/* Sentiment Shifts */}
      {sentiment.shifts.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-bold text-bitcoin-white mb-4">
            Significant Sentiment Shifts
          </h3>
          <div className="space-y-3">
            {sentiment.shifts.map((shift, index) => (
              <SentimentShiftCard key={index} shift={shift} />
            ))}
          </div>
        </div>
      )}

      {/* Trending Topics */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-bitcoin-white mb-4">
          Trending Topics & Hashtags
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {sentiment.trendingTopics.map((topic, index) => (
            <TrendingTopicCard key={index} topic={topic} />
          ))}
        </div>
      </div>

      {/* Top Influencers */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-bitcoin-white mb-4">
          Key Influencers ({influencers.totalInfluencers})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {influencers.topInfluencers.slice(0, 6).map((influencer, index) => (
            <InfluencerCard key={index} influencer={influencer} />
          ))}
        </div>
      </div>

      {/* Volume Metrics */}
      <div>
        <h3 className="text-lg font-bold text-bitcoin-white mb-4">
          Social Volume Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <VolumeMetricCard
            label="24H Volume"
            value={sentiment.volumeMetrics.total24h}
            change={sentiment.volumeMetrics.change24h}
          />
          <VolumeMetricCard
            label="7D Change"
            value={sentiment.volumeMetrics.change7d}
            change={sentiment.volumeMetrics.change7d}
          />
          <VolumeMetricCard
            label="Avg Impact Score"
            value={influencers.averageImpactScore}
            suffix="/100"
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Sentiment Gauge Component
 */
function SentimentGauge({ score, confidence }: { score: number; confidence: number }) {
  const getSentimentLabel = (score: number): string => {
    if (score > 60) return 'Very Bullish';
    if (score > 20) return 'Bullish';
    if (score > -20) return 'Neutral';
    if (score > -60) return 'Bearish';
    return 'Very Bearish';
  };

  const getSentimentColor = (score: number): string => {
    if (score > 20) return 'text-bitcoin-orange';
    if (score < -20) return 'text-bitcoin-white-60';
    return 'text-bitcoin-white-80';
  };

  return (
    <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-6 text-center">
      <div className="mb-4">
        <div className={`text-6xl font-mono font-bold ${getSentimentColor(score)}`}>
          {score > 0 ? '+' : ''}{score}
        </div>
        <div className="text-sm text-bitcoin-white-60 mt-2">
          Sentiment Score (-100 to +100)
        </div>
      </div>
      <div className="text-xl font-bold text-bitcoin-white mb-2">
        {getSentimentLabel(score)}
      </div>
      <div className="text-sm text-bitcoin-white-60">
        Confidence: {confidence}%
      </div>
    </div>
  );
}

/**
 * Sentiment Source Card
 */
function SentimentSourceCard({ source, score, icon }: { source: string; score: number; icon: string }) {
  return (
    <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className={`text-xl font-mono font-bold ${score > 0 ? 'text-bitcoin-orange' : 'text-bitcoin-white-60'}`}>
          {score > 0 ? '+' : ''}{score}
        </span>
      </div>
      <div className="text-sm text-bitcoin-white-80 font-semibold">
        {source}
      </div>
    </div>
  );
}

/**
 * Sentiment Distribution Bar
 */
function SentimentDistributionBar({ distribution }: { distribution: { positive: number; neutral: number; negative: number } }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="w-24 text-sm text-bitcoin-white-60">Positive</div>
        <div className="flex-1 bg-bitcoin-black border border-bitcoin-orange-20 rounded-full h-8 overflow-hidden">
          <div
            className="bg-bitcoin-orange h-full flex items-center justify-end pr-3"
            style={{ width: `${distribution.positive}%` }}
          >
            <span className="text-xs font-bold text-bitcoin-black">
              {distribution.positive}%
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-24 text-sm text-bitcoin-white-60">Neutral</div>
        <div className="flex-1 bg-bitcoin-black border border-bitcoin-orange-20 rounded-full h-8 overflow-hidden">
          <div
            className="bg-bitcoin-white-60 h-full flex items-center justify-end pr-3"
            style={{ width: `${distribution.neutral}%` }}
          >
            <span className="text-xs font-bold text-bitcoin-black">
              {distribution.neutral}%
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-24 text-sm text-bitcoin-white-60">Negative</div>
        <div className="flex-1 bg-bitcoin-black border border-bitcoin-orange-20 rounded-full h-8 overflow-hidden">
          <div
            className="bg-bitcoin-white-80 h-full flex items-center justify-end pr-3"
            style={{ width: `${distribution.negative}%` }}
          >
            <span className="text-xs font-bold text-bitcoin-black">
              {distribution.negative}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Timeframe Button
 */
function TimeframeButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
        active
          ? 'bg-bitcoin-orange text-bitcoin-black'
          : 'bg-transparent text-bitcoin-orange border border-bitcoin-orange hover:bg-bitcoin-orange hover:text-bitcoin-black'
      }`}
    >
      {label}
    </button>
  );
}

/**
 * Sentiment Trend Chart (Simplified)
 */
function SentimentTrendChart({ trends, timeframe }: { trends: any[]; timeframe: string }) {
  if (trends.length === 0) {
    return (
      <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-8 text-center">
        <p className="text-bitcoin-white-60">No trend data available</p>
      </div>
    );
  }

  return (
    <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
      <div className="text-sm text-bitcoin-white-60 mb-4">
        Sentiment trend over {timeframe}
      </div>
      <div className="space-y-2">
        {trends.slice(-10).map((trend, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="w-32 text-xs text-bitcoin-white-60">
              {new Date(trend.timestamp).toLocaleDateString()}
            </div>
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 bg-bitcoin-black border border-bitcoin-orange-20 rounded-full h-6 overflow-hidden">
                <div
                  className={`h-full ${trend.score > 0 ? 'bg-bitcoin-orange' : 'bg-bitcoin-white-60'}`}
                  style={{ width: `${Math.abs(trend.score)}%` }}
                />
              </div>
              <div className="w-16 text-sm font-mono text-bitcoin-white text-right">
                {trend.score > 0 ? '+' : ''}{trend.score}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Sentiment Shift Card
 */
function SentimentShiftCard({ shift }: { shift: any }) {
  return (
    <div className="bg-bitcoin-orange-10 border border-bitcoin-orange-20 rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="text-sm font-bold text-bitcoin-orange uppercase">
            {shift.direction === 'positive' ? '↑ Positive' : '↓ Negative'} Shift
          </span>
          <span className="text-xs text-bitcoin-white-60 ml-2">
            ({shift.timeframe})
          </span>
        </div>
        <div className="text-xl font-mono font-bold text-bitcoin-orange">
          {shift.magnitude}
        </div>
      </div>
      <div className="text-sm text-bitcoin-white-80 mb-2">
        {shift.previousScore} → {shift.currentScore}
      </div>
      <div className="text-xs text-bitcoin-white-60">
        {shift.contributingFactors.join(' • ')}
      </div>
    </div>
  );
}

/**
 * Trending Topic Card
 */
function TrendingTopicCard({ topic }: { topic: any }) {
  return (
    <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-3 hover:border-bitcoin-orange transition-all">
      <div className="text-sm font-bold text-bitcoin-orange mb-1 truncate">
        {topic.topic}
      </div>
      <div className="text-xs text-bitcoin-white-60">
        {topic.mentions} mentions
      </div>
    </div>
  );
}

/**
 * Influencer Card
 */
function InfluencerCard({ influencer }: { influencer: Influencer }) {
  const getSentimentIcon = (sentiment: string) => {
    if (sentiment === 'bullish') return '🚀';
    if (sentiment === 'bearish') return '📉';
    return '➖';
  };

  return (
    <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4 hover:border-bitcoin-orange transition-all">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-bitcoin-white truncate">
            @{influencer.username}
          </div>
          <div className="text-xs text-bitcoin-white-60">
            {influencer.followers.toLocaleString()} followers
          </div>
        </div>
        <div className="text-2xl">
          {getSentimentIcon(influencer.sentiment)}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-xs text-bitcoin-white-60">
          Impact Score
        </div>
        <div className="text-sm font-mono font-bold text-bitcoin-orange">
          {influencer.impactScore}/100
        </div>
      </div>
    </div>
  );
}

/**
 * Volume Metric Card
 */
function VolumeMetricCard({ label, value, change, suffix = '' }: { label: string; value: number; change?: number; suffix?: string }) {
  return (
    <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
      <div className="text-xs text-bitcoin-white-60 mb-2">
        {label}
      </div>
      <div className="text-2xl font-mono font-bold text-bitcoin-white mb-1">
        {value.toLocaleString()}{suffix}
      </div>
      {change !== undefined && (
        <div className={`text-sm ${change > 0 ? 'text-bitcoin-orange' : 'text-bitcoin-white-60'}`}>
          {change > 0 ? '+' : ''}{change.toFixed(1)}%
        </div>
      )}
    </div>
  );
}
