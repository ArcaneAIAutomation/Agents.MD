/**
 * UCIE Sentiment Analysis API Endpoint
 * 
 * GET /api/ucie/sentiment/BTC
 * GET /api/ucie/sentiment/ETH
 * 
 * Returns comprehensive social sentiment analysis with:
 * - LunarCrush metrics (social score, galaxy score, social dominance)
 * - Twitter/X sentiment (disabled due to rate limits)
 * - Reddit sentiment
 * - Aggregated sentiment score
 * 
 * Uses database-backed caching (TTL: 5 minutes)
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getCachedAnalysis, setCachedAnalysis } from '../../../../lib/ucie/cacheUtils';
import { fetchAggregatedSocialSentiment } from '../../../../lib/ucie/socialSentimentClients';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { symbol } = req.query;

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'Symbol parameter is required' });
  }

  const symbolUpper = symbol.toUpperCase();

  try {
    console.log(`📊 UCIE Sentiment API called for ${symbolUpper}`);

    // 1. Check cache first (5 minute TTL)
    const cached = await getCachedAnalysis(symbolUpper, 'sentiment');
    if (cached) {
      console.log(`✅ Cache hit for ${symbolUpper}/sentiment`);
      return res.status(200).json({
        success: true,
        data: cached,
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`❌ Cache miss for ${symbolUpper}/sentiment - fetching fresh data`);

    // 2. Fetch fresh sentiment data from all sources
    const sentimentData = await fetchAggregatedSocialSentiment(symbolUpper);

    // 3. Calculate aggregated sentiment score
    const scores: number[] = [];
    let totalWeight = 0;

    // LunarCrush (weight: 50%)
    if (sentimentData.lunarCrush) {
      scores.push(sentimentData.lunarCrush.sentimentScore * 0.5);
      totalWeight += 0.5;
    }

    // Reddit (weight: 30%)
    if (sentimentData.reddit) {
      scores.push((sentimentData.reddit.sentiment / 100) * 0.3);
      totalWeight += 0.3;
    }

    // Twitter disabled (weight: 20%) - causes timeouts
    // if (sentimentData.twitter) {
    //   scores.push((sentimentData.twitter.sentiment / 100) * 0.2);
    //   totalWeight += 0.2;
    // }

    const overallScore = totalWeight > 0
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / totalWeight * 100)
      : 50; // Neutral if no data

    // 4. Format response
    const response = {
      symbol: symbolUpper,
      overallScore,
      sentiment: overallScore > 60 ? 'bullish' : overallScore < 40 ? 'bearish' : 'neutral',
      
      // LunarCrush data
      lunarCrush: sentimentData.lunarCrush ? {
        socialScore: sentimentData.lunarCrush.socialScore,
        galaxyScore: sentimentData.lunarCrush.galaxyScore,
        sentimentScore: sentimentData.lunarCrush.sentimentScore,
        socialVolume: sentimentData.lunarCrush.socialVolume,
        socialVolumeChange24h: sentimentData.lunarCrush.socialVolumeChange24h,
        socialDominance: sentimentData.lunarCrush.socialDominance,
        altRank: sentimentData.lunarCrush.altRank,
        mentions: sentimentData.lunarCrush.mentions,
        interactions: sentimentData.lunarCrush.interactions,
        contributors: sentimentData.lunarCrush.contributors,
        trendingScore: sentimentData.lunarCrush.trendingScore
      } : null,
      
      // Reddit data
      reddit: sentimentData.reddit ? {
        mentions24h: sentimentData.reddit.mentions24h,
        sentiment: sentimentData.reddit.sentiment,
        topPosts: sentimentData.reddit.topPosts.slice(0, 5),
        activeSubreddits: sentimentData.reddit.activeSubreddits,
        postsPerDay: sentimentData.reddit.postsPerDay,
        commentsPerDay: sentimentData.reddit.commentsPerDay
      } : null,
      
      // Twitter disabled
      twitter: null,
      
      // Data quality
      dataQuality: calculateDataQuality(sentimentData),
      
      timestamp: new Date().toISOString()
    };

    // 5. Cache the result (5 minutes = 300 seconds)
    await setCachedAnalysis(
      symbolUpper,
      'sentiment',
      response,
      300, // 5 minutes
      response.dataQuality
    );

    console.log(`✅ Sentiment data fetched and cached for ${symbolUpper} (quality: ${response.dataQuality}%)`);

    // 6. Return response
    return res.status(200).json({
      success: true,
      data: response,
      cached: false,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ UCIE Sentiment API Error for ${symbolUpper}:`, error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch sentiment data',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Calculate data quality score based on available sources
 */
function calculateDataQuality(data: any): number {
  let quality = 0;
  
  if (data.lunarCrush) quality += 50; // LunarCrush is primary source
  if (data.reddit) quality += 30; // Reddit is secondary
  if (data.twitter) quality += 20; // Twitter is tertiary (disabled)
  
  return quality;
}
