/**
 * LunarCrush Trading Signals
 * Generate sentiment-based trading signals
 */

import type { TradingSignal, SentimentData } from "./types";

/**
 * Generate trading signal based on sentiment divergence
 */
export function generateTradingSignal(
  sentiment: SentimentData,
  priceChange24h: number
): TradingSignal {
  const indicators = {
    sentimentDivergence: false,
    galaxyScoreBreakout: false,
    socialVolumeSpike: false,
  };

  // Check for sentiment divergence
  const sentimentBullish = sentiment.sentiment >= 70;
  const sentimentBearish = sentiment.sentiment <= 30;
  const priceFalling = priceChange24h < -5;
  const priceRising = priceChange24h > 5;

  // Bullish Signal: Positive sentiment + falling price
  if (sentimentBullish && priceFalling) {
    indicators.sentimentDivergence = true;
    return {
      type: "BULLISH",
      confidence: "HIGH",
      reason: "Strong positive sentiment despite price drop - potential reversal opportunity",
      sentiment: sentiment.sentiment,
      priceChange24h,
      galaxyScore: sentiment.galaxyScore,
      timestamp: Date.now(),
      indicators,
    };
  }

  // Bearish Signal: Negative sentiment + rising price
  if (sentimentBearish && priceRising) {
    indicators.sentimentDivergence = true;
    return {
      type: "BEARISH",
      confidence: "HIGH",
      reason: "Negative sentiment despite price rise - potential correction ahead",
      sentiment: sentiment.sentiment,
      priceChange24h,
      galaxyScore: sentiment.galaxyScore,
      timestamp: Date.now(),
      indicators,
    };
  }

  // Galaxy Score breakout (bullish)
  if (sentiment.galaxyScore > 75) {
    indicators.galaxyScoreBreakout = true;
    return {
      type: "BULLISH",
      confidence: "MEDIUM",
      reason: "Galaxy Score breakout above 75 - strong social momentum building",
      sentiment: sentiment.sentiment,
      priceChange24h,
      galaxyScore: sentiment.galaxyScore,
      timestamp: Date.now(),
      indicators,
    };
  }

  // Galaxy Score breakdown (bearish)
  if (sentiment.galaxyScore < 25) {
    indicators.galaxyScoreBreakout = true;
    return {
      type: "BEARISH",
      confidence: "MEDIUM",
      reason: "Galaxy Score below 25 - weak social momentum, caution advised",
      sentiment: sentiment.sentiment,
      priceChange24h,
      galaxyScore: sentiment.galaxyScore,
      timestamp: Date.now(),
      indicators,
    };
  }

  // Moderate bullish sentiment
  if (sentiment.sentiment >= 60 && priceChange24h >= 0) {
    return {
      type: "BULLISH",
      confidence: "LOW",
      reason: "Positive sentiment aligns with price action - continuation likely",
      sentiment: sentiment.sentiment,
      priceChange24h,
      galaxyScore: sentiment.galaxyScore,
      timestamp: Date.now(),
      indicators,
    };
  }

  // Moderate bearish sentiment
  if (sentiment.sentiment <= 40 && priceChange24h <= 0) {
    return {
      type: "BEARISH",
      confidence: "LOW",
      reason: "Negative sentiment aligns with price action - downtrend may continue",
      sentiment: sentiment.sentiment,
      priceChange24h,
      galaxyScore: sentiment.galaxyScore,
      timestamp: Date.now(),
      indicators,
    };
  }

  // No clear signal
  return {
    type: "NEUTRAL",
    confidence: "LOW",
    reason: "No significant sentiment divergence detected - market in equilibrium",
    sentiment: sentiment.sentiment,
    priceChange24h,
    galaxyScore: sentiment.galaxyScore,
    timestamp: Date.now(),
    indicators,
  };
}

/**
 * Get sentiment label and color
 */
export function getSentimentLabel(sentiment: number): string {
  if (sentiment >= 80) return "🚀 Extremely Bullish";
  if (sentiment >= 70) return "📈 Very Bullish";
  if (sentiment >= 55) return "↗️ Bullish";
  if (sentiment >= 45) return "➡️ Neutral";
  if (sentiment >= 30) return "↘️ Bearish";
  if (sentiment >= 20) return "📉 Very Bearish";
  return "🔻 Extremely Bearish";
}

export function getSentimentColor(sentiment: number): string {
  if (sentiment >= 70) return "text-bitcoin-orange";
  if (sentiment >= 55) return "text-bitcoin-white";
  if (sentiment >= 45) return "text-bitcoin-white-80";
  if (sentiment >= 30) return "text-bitcoin-white-60";
  return "text-bitcoin-white-60";
}

/**
 * Format large numbers for display
 */
export function formatInteractions(num: number): string {
  if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

/**
 * Format followers count
 */
export function formatFollowers(followers: string | number): string {
  const num = typeof followers === "string" ? parseInt(followers) : followers;
  return formatInteractions(num);
}
