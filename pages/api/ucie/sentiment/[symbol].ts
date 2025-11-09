/**
 * Social Sentiment API Endpoint for UCIE
 * 
 * Fetches and aggregates social sentiment data from multiple sources:
 * - LunarCrush for social metrics
 * - Twitter for tweet analysis
 * - Reddit for subreddit sentiment
 * 
 * Returns comprehensive sentiment analysis with trends and influencers
 * 
 * Requirements: 5.1, 5.2, 5.3, 14.3
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import {
  fetchAggregatedSocialSentiment,
  type LunarCrushData,
  type TwitterMetrics,
  type RedditMetrics,
} from '../../../../lib/ucie/socialSentimentClients';
import {
  aggregateSentimentData,
  type AggregatedSentiment,
} from '../../../../lib/ucie/sentimentAnalysis';
import {
  trackInfluencers,
  type InfluencerMetrics,
} from '../../../../lib/ucie/influencerTracking';
import { getCachedAnalysis, setCachedAnalysis } from '../../../../lib/ucie/cacheUtils';

// ============================================================================
// Type Definitions
// ============================================================================

interface SentimentResponse {
  success: boolean;
  symbol: string;
  timestamp: string;
  sentiment: AggregatedSentiment;
  influencers: InfluencerMetrics;
  sources: {
    lunarCrush: boolean;
    twitter: boolean;
    reddit: boolean;
  };
  dataQuality: number; // 0-100
  cached: boolean;
  error?: string;
}

interface ErrorResponse {
  success: false;
  error: string;
  symbol?: string;
}

// Cache TTL: 15 minutes (for OpenAI/Caesar analysis)
const CACHE_TTL = 15 * 60; // 900 seconds

// ============================================================================
// Data Quality Calculation
// ============================================================================

/**
 * Calculate data quality score based on available sources
 * ✅ UPDATED: Twitter removed (unreliable), only LunarCrush + Reddit
 */
function calculateDataQuality(
  lunarCrush: LunarCrushData | null,
  twitter: TwitterMetrics | null,
  reddit: RedditMetrics | null
): number {
  let score = 0;
  let maxScore = 0;

  // LunarCrush (60 points) - Primary source, aggregates Twitter data
  maxScore += 60;
  if (lunarCrush) {
    score += 60;
    // Bonus for high social score
    if (lunarCrush.socialScore && lunarCrush.socialScore > 70) score += 10;
  }

  // Reddit (40 points) - Secondary source
  maxScore += 40;
  if (reddit) {
    score += 40;
    // Bonus for high mention count
    if (reddit.mentions24h > 50) score += 10;
  }

  // Twitter is disabled (causes timeouts)
  // LunarCrush already aggregates Twitter data, so no data loss

  return Math.min(100, Math.round((score / maxScore) * 100));
}

// ============================================================================
// Main API Handler
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SentimentResponse | ErrorResponse>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    // Extract and validate symbol
    const { symbol } = req.query;

    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Symbol parameter is required',
      });
    }

    const normalizedSymbol = symbol.toUpperCase();

    // Check database cache first
    const cachedData = await getCachedAnalysis(normalizedSymbol, 'sentiment');
    if (cachedData) {
      return res.status(200).json({
        ...cachedData,
        cached: true,
      });
    }

    // Fetch social sentiment data from all sources
    console.log(`Fetching social sentiment for ${normalizedSymbol}...`);
    
    const { lunarCrush, twitter, reddit } = await fetchAggregatedSocialSentiment(normalizedSymbol);

    // Check if we have any data
    if (!lunarCrush && !twitter && !reddit) {
      return res.status(404).json({
        success: false,
        error: `No social sentiment data found for ${normalizedSymbol}`,
        symbol: normalizedSymbol,
      });
    }

    // Aggregate sentiment data
    const sentiment = aggregateSentimentData(lunarCrush, twitter, reddit);

    // Track influencers
    const twitterInfluencers = twitter?.influencers || [];
    const redditInfluencers = []; // Reddit influencer tracking would be implemented here
    
    const influencerData = trackInfluencers(twitterInfluencers, redditInfluencers);

    // Calculate data quality
    const dataQuality = calculateDataQuality(lunarCrush, twitter, reddit);

    // Build response
    const response: SentimentResponse = {
      success: true,
      symbol: normalizedSymbol,
      timestamp: new Date().toISOString(),
      sentiment,
      influencers: influencerData.metrics,
      sources: {
        lunarCrush: !!lunarCrush,
        twitter: !!twitter,
        reddit: !!reddit,
      },
      dataQuality,
      cached: false,
    };

    // Cache the response in database
    await setCachedAnalysis(normalizedSymbol, 'sentiment', response, CACHE_TTL, dataQuality);

    // Return response
    return res.status(200).json(response);

  } catch (error) {
    console.error('Error in sentiment API:', error);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}

// ============================================================================
// Cache Cleanup
// ============================================================================

/**
 * Clean up expired cache entries periodically
 */
setInterval(() => {
  const now = Date.now();
  
  for (const [symbol, cached] of cache.entries()) {
    const age = now - cached.timestamp;
    
    if (age > CACHE_TTL) {
      cache.delete(symbol);
    }
  }
}, 60 * 1000); // Run every minute
