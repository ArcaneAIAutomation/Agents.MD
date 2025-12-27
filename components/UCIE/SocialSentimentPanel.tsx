/**
 * Social Sentiment Panel Component for UCIE
 * 
 * Displays comprehensive social sentiment analysis:
 * - Overall sentiment score with gauge visualization
 * - LunarCrush Galaxy Score and social metrics
 * - CoinMarketCap price momentum analysis
 * - CoinGecko community engagement
 * - Fear & Greed Index
 * - Reddit community sentiment
 * - Post type breakdown and interaction metrics
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 * Updated: December 5, 2025 - LunarCrush Integration
 */

import React, { useState } from 'react';

// ============================================================================
// Type Definitions
// ============================================================================

interface SocialSentimentPanelProps {
  symbol: string;
  data: any; // API response from /api/ucie/sentiment/[symbol]
  loading?: boolean;
  error?: string | null;
}

// ============================================================================
// Main Component
// ============================================================================

export default function SocialSentimentPanel({
  symbol,
  data,
  loading = false,
  error = null,
}: SocialSentimentPanelProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'24h' | '7d' | '30d'>('24h');

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-12">
          <div className="text-bitcoin-white-60">Loading sentiment data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-bitcoin-orange-10 border border-bitcoin-orange-20 rounded-lg p-4">
          <p className="text-bitcoin-white-80">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <div className="bg-bitcoin-orange-10 border border-bitcoin-orange-20 rounded-lg p-4">
          <p className="text-bitcoin-white-80">No sentiment data available</p>
        </div>
      </div>
    );
  }

  // Extract data from API response
  const overallScore = data.overallScore || 50;
  const sentiment = data.sentiment || 'neutral';
  const fearGreed = data.fearGreedIndex;
  const lunarCrush = data.lunarCrush;
  const coinMarketCap = data.coinMarketCap;
  const coinGecko = data.coinGecko;
  const reddit = data.reddit;
  const dataQuality = data.dataQuality || 0;

  return (
    <div className="space-y-6">
      {/* Overall Sentiment Score */}
      <div>
        <SentimentGauge
          score={overallScore}
          sentiment={sentiment}
          dataQuality={dataQuality}
        />
      </div>

      {/* Data Quality Indicator */}
      <div className="bg-bitcoin-orange-5 border border-bitcoin-orange-20 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-bitcoin-white mb-1">
              Data Quality: {dataQuality}%
            </p>
            <p className="text-xs text-bitcoin-white-60">
              {data.dataQualityDescription || `Successfully retrieved ${dataQuality}% of sentiment data from multiple sources.`}
            </p>
          </div>
          <div className={`text-3xl font-mono font-bold ${dataQuality >= 70 ? 'text-bitcoin-orange' : 'text-bitcoin-white-60'}`}>
            {dataQuality}%
          </div>
        </div>
      </div>

      {/* Fear & Greed Index */}
      {fearGreed && (
        <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-bitcoin-white">
              Fear & Greed Index
            </h3>
            <span className="text-xs text-bitcoin-white-60 uppercase">
              Weight: {fearGreed.weight}
            </span>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-5xl font-mono font-bold text-bitcoin-orange">
                {fearGreed.value}
              </div>
              <div className="text-sm text-bitcoin-white-60 mt-1">
                0-100 Scale
              </div>
            </div>
            <div className="flex-1">
              <div className="text-xl font-bold text-bitcoin-white mb-2">
                {fearGreed.classification}
              </div>
              <p className="text-sm text-bitcoin-white-80">
                {fearGreed.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* LunarCrush Social Metrics */}
      {lunarCrush && (
        <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-bitcoin-white flex items-center gap-2">
              <span className="text-2xl">🌙</span>
              LunarCrush Social Metrics
            </h3>
            <span className="text-xs text-bitcoin-white-60 uppercase">
              Weight: {lunarCrush.weight}
            </span>
          </div>

          {/* Galaxy Score */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-bitcoin-white-80">Galaxy Score</span>
              <span className="text-2xl font-mono font-bold text-bitcoin-orange">
                {lunarCrush.galaxyScore}/100
              </span>
            </div>
            <div className="w-full h-3 bg-bitcoin-black border border-bitcoin-orange-20 rounded-full overflow-hidden">
              <div
                className="h-full bg-bitcoin-orange transition-all duration-500"
                style={{ width: `${lunarCrush.galaxyScore}%` }}
              />
            </div>
            <p className="text-xs text-bitcoin-white-60 mt-2">
              {lunarCrush.galaxyScoreDescription}
            </p>
          </div>

          {/* Sentiment Scale (1-5) */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-bitcoin-white-80">Average Sentiment</span>
              <span className="text-2xl font-mono font-bold text-bitcoin-orange">
                {lunarCrush.averageSentiment.toFixed(2)}/5
              </span>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className={`flex-1 h-3 rounded ${
                    level <= Math.round(lunarCrush.averageSentiment)
                      ? 'bg-bitcoin-orange'
                      : 'bg-bitcoin-black border border-bitcoin-orange-20'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-bitcoin-white-60 mt-2">
              {lunarCrush.averageSentimentDescription}
            </p>
          </div>

          {/* Social Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <MetricCard
              label="Total Posts"
              value={lunarCrush.totalPosts.toLocaleString()}
              description={lunarCrush.totalPostsDescription}
            />
            <MetricCard
              label="Total Interactions"
              value={(lunarCrush.totalInteractions / 1000000).toFixed(1) + 'M'}
              description={lunarCrush.totalInteractionsDescription}
            />
            <MetricCard
              label="Price"
              value={`$${lunarCrush.price.toLocaleString()}`}
              description={lunarCrush.priceDescription}
            />
          </div>

          {/* Post Type Breakdown */}
          {lunarCrush?.postTypes && Object.keys(lunarCrush.postTypes).length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-bitcoin-white mb-3">
                Post Type Breakdown
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(lunarCrush?.postTypes || {}).map(([type, count]: [string, any]) => (
                  <div key={type} className="bg-bitcoin-orange-5 border border-bitcoin-orange-20 rounded-lg p-3">
                    <div className="text-xs text-bitcoin-white-60 mb-1 capitalize">
                      {type.replace('-', ' ')}
                    </div>
                    <div className="text-xl font-mono font-bold text-bitcoin-orange">
                      {count}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-bitcoin-white-60 mt-3">
                {lunarCrush.postTypesDescription}
              </p>
            </div>
          )}
        </div>
      )}

      {/* CoinMarketCap Price Momentum */}
      {coinMarketCap && (
        <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-bitcoin-white">
              CoinMarketCap Price Momentum
            </h3>
            <span className="text-xs text-bitcoin-white-60 uppercase">
              Weight: {coinMarketCap.weight}
            </span>
          </div>

          {/* Sentiment Score */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-bitcoin-white-80">Momentum Score</span>
              <span className="text-2xl font-mono font-bold text-bitcoin-orange">
                {coinMarketCap.sentimentScore}/100
              </span>
            </div>
            <div className="w-full h-3 bg-bitcoin-black border border-bitcoin-orange-20 rounded-full overflow-hidden">
              <div
                className="h-full bg-bitcoin-orange transition-all duration-500"
                style={{ width: `${coinMarketCap.sentimentScore}%` }}
              />
            </div>
            <p className="text-xs text-bitcoin-white-60 mt-2">
              {coinMarketCap.description}
            </p>
          </div>

          {/* Price Changes */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <MetricCard
              label="24h Change"
              value={`${coinMarketCap.priceChange24h > 0 ? '+' : ''}${coinMarketCap.priceChange24h.toFixed(2)}%`}
              valueColor={coinMarketCap.priceChange24h > 0 ? 'text-bitcoin-orange' : 'text-bitcoin-white-60'}
            />
            <MetricCard
              label="7d Change"
              value={`${coinMarketCap.priceChange7d > 0 ? '+' : ''}${coinMarketCap.priceChange7d.toFixed(2)}%`}
              valueColor={coinMarketCap.priceChange7d > 0 ? 'text-bitcoin-orange' : 'text-bitcoin-white-60'}
            />
            <MetricCard
              label="Volume Change"
              value={`${coinMarketCap.volumeChange24h > 0 ? '+' : ''}${coinMarketCap.volumeChange24h.toFixed(2)}%`}
              valueColor={coinMarketCap.volumeChange24h > 0 ? 'text-bitcoin-orange' : 'text-bitcoin-white-60'}
            />
          </div>
        </div>
      )}

      {/* CoinGecko Community Engagement */}
      {coinGecko && (
        <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-bitcoin-white">
              CoinGecko Community Engagement
            </h3>
            <span className="text-xs text-bitcoin-white-60 uppercase">
              Weight: {coinGecko.weight}
            </span>
          </div>

          {/* Sentiment Score */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-bitcoin-white-80">Community Score</span>
              <span className="text-2xl font-mono font-bold text-bitcoin-orange">
                {coinGecko.sentimentScore}/100
              </span>
            </div>
            <div className="w-full h-3 bg-bitcoin-black border border-bitcoin-orange-20 rounded-full overflow-hidden">
              <div
                className="h-full bg-bitcoin-orange transition-all duration-500"
                style={{ width: `${coinGecko.sentimentScore}%` }}
              />
            </div>
            <p className="text-xs text-bitcoin-white-60 mt-2">
              {coinGecko.description}
            </p>
          </div>

          {/* Community Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              label="Community Score"
              value={coinGecko.communityScore.toFixed(1)}
            />
            <MetricCard
              label="Developer Score"
              value={coinGecko.developerScore.toFixed(1)}
            />
            <MetricCard
              label="Sentiment Votes Up"
              value={`${coinGecko.sentimentVotesUpPercentage.toFixed(1)}%`}
            />
            <MetricCard
              label="Twitter Followers"
              value={(coinGecko.twitterFollowers / 1000000).toFixed(1) + 'M'}
            />
          </div>
        </div>
      )}

      {/* Reddit Community Sentiment */}
      {reddit && (
        <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-bitcoin-white flex items-center gap-2">
              <span className="text-2xl">🤖</span>
              Reddit Community Sentiment
            </h3>
            <span className="text-xs text-bitcoin-white-60 uppercase">
              Weight: {reddit.weight}
            </span>
          </div>

          {/* Sentiment Score */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-bitcoin-white-80">Reddit Sentiment</span>
              <span className="text-2xl font-mono font-bold text-bitcoin-orange">
                {reddit.sentiment}/100
              </span>
            </div>
            <div className="w-full h-3 bg-bitcoin-black border border-bitcoin-orange-20 rounded-full overflow-hidden">
              <div
                className="h-full bg-bitcoin-orange transition-all duration-500"
                style={{ width: `${reddit.sentiment}%` }}
              />
            </div>
            <p className="text-xs text-bitcoin-white-60 mt-2">
              {reddit.description}
            </p>
          </div>

          {/* Reddit Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <MetricCard
              label="24h Mentions"
              value={reddit.mentions24h.toString()}
              description={reddit.mentionsDescription}
            />
            <MetricCard
              label="Active Subreddits"
              value={reddit.activeSubreddits.length.toString()}
              description="r/cryptocurrency, r/CryptoMarkets, r/Bitcoin"
            />
          </div>
        </div>
      )}

      {/* Data Sources Summary */}
      <div className="bg-bitcoin-orange-5 border border-bitcoin-orange-20 rounded-lg p-4">
        <h4 className="text-sm font-bold text-bitcoin-white mb-3">
          Data Sources Used
        </h4>
        <div className="flex flex-wrap gap-2">
          {(data?.sourcesUsed || []).map((source: string, index: number) => (
            <span
              key={index}
              className="px-3 py-1 bg-bitcoin-black border border-bitcoin-orange-20 rounded-full text-xs text-bitcoin-white-80"
            >
              {source}
            </span>
          ))}
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
function SentimentGauge({ 
  score, 
  sentiment, 
  dataQuality 
}: { 
  score: number; 
  sentiment: string; 
  dataQuality: number;
}) {
  const getSentimentLabel = (sentiment: string): string => {
    return sentiment.charAt(0).toUpperCase() + sentiment.slice(1);
  };

  const getSentimentColor = (score: number): string => {
    if (score >= 60) return 'text-bitcoin-orange';
    if (score <= 40) return 'text-bitcoin-white-60';
    return 'text-bitcoin-white-80';
  };

  return (
    <div className="bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-6 text-center">
      <div className="mb-4">
        <div className={`text-6xl font-mono font-bold ${getSentimentColor(score)}`}>
          {score}
        </div>
        <div className="text-sm text-bitcoin-white-60 mt-2">
          Overall Sentiment Score (0-100)
        </div>
      </div>
      <div className="text-xl font-bold text-bitcoin-white mb-2 uppercase">
        {getSentimentLabel(sentiment)}
      </div>
      <div className="text-sm text-bitcoin-white-60">
        Data Quality: {dataQuality}%
      </div>
    </div>
  );
}

/**
 * Metric Card Component
 */
function MetricCard({ 
  label, 
  value, 
  description, 
  valueColor = 'text-bitcoin-white' 
}: { 
  label: string; 
  value: string; 
  description?: string;
  valueColor?: string;
}) {
  return (
    <div className="bg-bitcoin-orange-5 border border-bitcoin-orange-20 rounded-lg p-3">
      <div className="text-xs text-bitcoin-white-60 mb-1">
        {label}
      </div>
      <div className={`text-xl font-mono font-bold ${valueColor}`}>
        {value}
      </div>
      {description && (
        <div className="text-xs text-bitcoin-white-60 mt-1">
          {description}
        </div>
      )}
    </div>
  );
}


