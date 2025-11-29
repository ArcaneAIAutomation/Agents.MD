/**
 * UCIE Sentiment Analysis API Endpoint
 * 
 * GET /api/ucie/sentiment/BTC
 * GET /api/ucie/sentiment/ETH
 * 
 * Returns comprehensive social sentiment analysis with:
 * - Fear & Greed Index (primary - always available)
 * - LunarCrush metrics (social score, galaxy score, social dominance)
 * - Reddit sentiment
 * - Aggregated sentiment score
 * 
 * Uses database-backed caching (TTL: 5 minutes)
 * ✅ FIXED: Direct API calls with proper timeouts (mirrors working BTC analysis pattern)
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getCachedAnalysis, setCachedAnalysis } from '../../../../lib/ucie/cacheUtils';

/**
 * Fetch Fear & Greed Index (ALWAYS AVAILABLE - Public API)
 * This is the most reliable sentiment indicator
 */
async function fetchFearGreedIndex(): Promise<{ value: number; classification: string } | null> {
  try {
    const response = await fetch('https://api.alternative.me/fng/', {
      signal: AbortSignal.timeout(10000) // ✅ Increased from 5s to 10s
    });

    if (!response.ok) return null;

    const data = await response.json();
    return {
      value: parseInt(data.data[0].value),
      classification: data.data[0].value_classification
    };
  } catch (error) {
    console.error('Fear & Greed Index fetch error:', error);
    return null;
  }
}

/**
 * Fetch LunarCrush data (optional - may timeout)
 */
async function fetchLunarCrushData(symbol: string): Promise<any | null> {
  const apiKey = process.env.LUNARCRUSH_API_KEY;
  
  if (!apiKey) {
    console.warn('❌ LunarCrush API key not configured');
    return null;
  }

  try {
    console.log(`📊 Fetching LunarCrush data for ${symbol}...`);
    
    const response = await fetch(
      `https://lunarcrush.com/api4/public/coins/${symbol}/v1`,
      {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        signal: AbortSignal.timeout(10000), // ✅ Increased from 5s to 10s
      }
    );

    if (!response.ok) {
      console.warn(`❌ LunarCrush API returned ${response.status}`);
      // Try public endpoint as fallback
      const publicResponse = await fetch(
        `https://lunarcrush.com/api4/public/coins/${symbol}/v1`,
        {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(10000), // ✅ Increased from 5s to 10s
        }
      );
      
      if (!publicResponse.ok) {
        console.warn(`❌ LunarCrush public API also returned ${publicResponse.status}`);
        return null;
      }
      
      const publicData = await publicResponse.json();
      const data = publicData.data;
      
      // ✅ Log raw data for debugging
      if (data) {
        console.log(`✅ LunarCrush data (public):`, {
          galaxy_score: data.galaxy_score,
          social_volume: data.social_volume,
          social_dominance: data.social_dominance,
          social_contributors: data.social_contributors,
          num_posts: data.num_posts,
          interactions_24h: data.interactions_24h,
          sentiment: data.sentiment
        });
      }
      
      return data || null;
    }

    const json = await response.json();
    const data = json.data;
    
    if (!data) {
      console.warn('❌ LunarCrush response missing data field');
      return null;
    }

    // ✅ Log raw data for debugging
    console.log(`✅ LunarCrush data (authenticated):`, {
      galaxy_score: data.galaxy_score,
      social_volume: data.social_volume,
      social_dominance: data.social_dominance,
      social_contributors: data.social_contributors,
      num_posts: data.num_posts,
      interactions_24h: data.interactions_24h,
      sentiment: data.sentiment,
      alt_rank: data.alt_rank
    });
    
    // ✅ CRITICAL: Check if we're getting zeros and log warning
    const hasZeros = 
      data.social_volume === 0 &&
      data.social_dominance === 0 &&
      data.social_contributors === 0 &&
      data.num_posts === 0 &&
      data.interactions_24h === 0;
    
    if (hasZeros) {
      console.warn(`⚠️ LunarCrush returned all zeros for ${symbol}!`);
      console.warn(`   This might indicate:`);
      console.warn(`   1. API rate limit reached`);
      console.warn(`   2. Symbol not found in LunarCrush database`);
      console.warn(`   3. API key has insufficient permissions`);
      console.warn(`   4. API response structure changed`);
      console.warn(`   Full response:`, JSON.stringify(data, null, 2));
    }

    return data;
  } catch (error) {
    console.error('❌ LunarCrush fetch error:', error);
    return null;
  }
}

/**
 * Fetch Reddit sentiment (optional - may timeout)
 */
async function fetchRedditSentiment(symbol: string): Promise<any | null> {
  try {
    const subreddits = ['cryptocurrency', 'CryptoMarkets', 'Bitcoin'];
    const searchQuery = symbol.toLowerCase();
    let totalPosts = 0;
    let totalSentiment = 0;

    for (const subreddit of subreddits) {
      try {
        const response = await fetch(
          `https://www.reddit.com/r/${subreddit}/search.json?q=${searchQuery}&restrict_sr=1&sort=hot&limit=10&t=day`,
          {
            headers: {
              'User-Agent': 'UCIE/1.0',
              'Accept': 'application/json',
            },
            signal: AbortSignal.timeout(3000), // Reduced from 5s
          }
        );

        if (!response.ok) continue;

        const data = await response.json();
        
        if (data.data?.children) {
          totalPosts += data.data.children.length;
          // Simple sentiment: count upvotes vs downvotes
          data.data.children.forEach((child: any) => {
            const post = child.data;
            const score = post.ups || 0;
            totalSentiment += score > 0 ? 1 : score < 0 ? -1 : 0;
          });
        }
      } catch (error) {
        // Skip failed subreddit
        continue;
      }
    }

    if (totalPosts === 0) return null;

    return {
      mentions24h: totalPosts,
      sentiment: Math.round((totalSentiment / totalPosts) * 50 + 50), // Convert to 0-100 scale
      activeSubreddits: subreddits
    };
  } catch (error) {
    console.error('Reddit fetch error:', error);
    return null;
  }
}

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
    // ✅ Check if refresh parameter is set to force fresh data
    const forceRefresh = req.query.refresh === 'true';
    console.log(`📊 UCIE Sentiment API called for ${symbolUpper}${forceRefresh ? ' (FORCING FRESH DATA)' : ''}`);

    // 1. Check cache first (5 minute TTL) - SKIP if refresh=true
    if (!forceRefresh) {
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
    } else {
      console.log(`🔄 Refresh requested - bypassing cache for ${symbolUpper}/sentiment`);
    }

    console.log(`❌ Cache miss for ${symbolUpper}/sentiment - fetching fresh data`);

    // 2. Fetch sentiment data from all sources IN PARALLEL (faster)
    const [fearGreed, lunarCrush, reddit] = await Promise.allSettled([
      fetchFearGreedIndex(),
      fetchLunarCrushData(symbolUpper),
      fetchRedditSentiment(symbolUpper)
    ]);

    // Extract results
    const fearGreedData = fearGreed.status === 'fulfilled' ? fearGreed.value : null;
    const lunarCrushData = lunarCrush.status === 'fulfilled' ? lunarCrush.value : null;
    const redditData = reddit.status === 'fulfilled' ? reddit.value : null;

    // 3. Calculate aggregated sentiment score
    const scores: number[] = [];
    let totalWeight = 0;

    // Fear & Greed Index (weight: 40%) - PRIMARY SOURCE
    if (fearGreedData) {
      scores.push(fearGreedData.value * 0.4);
      totalWeight += 0.4;
    }

    // LunarCrush (weight: 35%)
    if (lunarCrushData) {
      const lcSentiment = calculateLunarCrushSentiment(lunarCrushData);
      scores.push(lcSentiment * 0.35);
      totalWeight += 0.35;
    }

    // Reddit (weight: 25%)
    if (redditData) {
      scores.push(redditData.sentiment * 0.25);
      totalWeight += 0.25;
    }

    // 4. Calculate data quality
    let dataQuality = 0;
    if (fearGreedData) dataQuality += 40; // Fear & Greed is most reliable
    if (lunarCrushData) dataQuality += 35; // LunarCrush is secondary
    if (redditData) dataQuality += 25; // Reddit is tertiary

    // ✅ CRITICAL FIX: NO FALLBACK DATA - Fail if insufficient quality
    // Require at least Fear & Greed Index (40% minimum) for reliable sentiment
    if (dataQuality < 40) {
      console.log(`❌ Insufficient data quality: ${dataQuality}% (minimum 40% required)`);
      return res.status(503).json({
        success: false,
        error: 'Unable to fetch reliable sentiment data',
        dataQuality: dataQuality,
        availableSources: {
          fearGreed: !!fearGreedData,
          lunarCrush: !!lunarCrushData,
          reddit: !!redditData
        },
        message: 'Sentiment analysis requires at least the Fear & Greed Index. Please try again later.'
      });
    }

    // ✅ Calculate overall score (only if we have sufficient data)
    const overallScore = Math.round(
      scores.reduce((sum, score) => sum + score, 0) / totalWeight
    );

    // 4. Format response
    const response = {
      symbol: symbolUpper,
      overallScore,
      sentiment: overallScore > 60 ? 'bullish' : overallScore < 40 ? 'bearish' : 'neutral',
      
      // Fear & Greed Index (PRIMARY)
      fearGreedIndex: fearGreedData ? {
        value: fearGreedData.value,
        classification: fearGreedData.classification
      } : null,
      
      // LunarCrush data (✅ FIXED: Correct API v4 field names)
      lunarCrush: lunarCrushData ? {
        // Core Scores
        galaxyScore: lunarCrushData.galaxy_score || 0,
        altRank: lunarCrushData.alt_rank || 0,
        altRank30d: lunarCrushData.alt_rank_30d || 0,
        
        // Social Volume & Dominance (✅ FIXED: Correct field names)
        socialVolume: lunarCrushData.social_volume || 0,
        socialVolume24hChange: lunarCrushData.social_volume_24h_change || 0,
        socialDominance: lunarCrushData.social_dominance || 0,
        socialDominance24hChange: lunarCrushData.social_dominance_24h_change || 0,
        
        // Engagement Metrics (✅ FIXED: Correct field names)
        socialContributors: lunarCrushData.social_contributors || 0,
        socialContributors24hChange: lunarCrushData.social_contributors_24h_change || 0,
        numPosts: lunarCrushData.num_posts || 0, // ✅ FIXED: Was social_mentions
        numPosts24hChange: lunarCrushData.num_posts_24h_change || 0,
        interactions24h: lunarCrushData.interactions_24h || 0, // ✅ FIXED: Was social_interactions
        interactions24hChange: lunarCrushData.interactions_24h_change || 0,
        
        // Sentiment Metrics
        sentiment: lunarCrushData.sentiment || 3, // 0-5 scale, 3 is neutral
        sentimentAbsolute: lunarCrushData.sentiment_absolute || 3,
        sentimentRelative: lunarCrushData.sentiment_relative || 3,
        sentimentScore: calculateLunarCrushSentiment(lunarCrushData), // Convert to 0-100
        
        // Market Metrics
        marketDominance: lunarCrushData.market_dominance || 0,
        marketDominance24hChange: lunarCrushData.market_dominance_24h_change || 0,
        
        // Additional Metrics
        correlationRank: lunarCrushData.correlation_rank || 0,
        volatility: lunarCrushData.volatility || 0,
        
        // Categories & Tags
        categories: lunarCrushData.categories || [],
        tags: lunarCrushData.tags || [],
        
        // Timestamps
        updated: lunarCrushData.updated || Math.floor(Date.now() / 1000)
      } : null,
      
      // Reddit data
      reddit: redditData ? {
        mentions24h: redditData.mentions24h,
        sentiment: redditData.sentiment,
        activeSubreddits: redditData.activeSubreddits
      } : null,
      
      // Data quality
      dataQuality,
      
      timestamp: new Date().toISOString()
    };

    // 5. Cache the result (3 minutes = 180 seconds)
    // ✅ FIX: Store unwrapped data (no API wrappers)
    const unwrappedData = {
      symbol: response.symbol,
      overallScore: response.overallScore,
      sentiment: response.sentiment,
      fearGreedIndex: response.fearGreedIndex,
      lunarCrush: response.lunarCrush,
      reddit: response.reddit,
      dataQuality: response.dataQuality,
      timestamp: response.timestamp
    };
    
    await setCachedAnalysis(
      symbolUpper,
      'sentiment',
      unwrappedData,
      180, // 3 minutes
      response.dataQuality
    );

    console.log(`✅ Sentiment data fetched and cached for ${symbolUpper} (quality: ${response.dataQuality}%, unwrapped format)`);
    console.log(`   Fear & Greed: ${fearGreedData ? fearGreedData.value : 'N/A'}, LunarCrush: ${lunarCrushData ? 'OK' : 'N/A'}, Reddit: ${redditData ? 'OK' : 'N/A'}`);

    // 6. Return response (with API wrappers for client)
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
 * Convert LunarCrush sentiment (0-5 scale) to 0-100 scale
 */
function calculateLunarCrushSentiment(data: any): number {
  const sentiment = data.sentiment || 3; // 3 is neutral
  // Convert 0-5 scale to 0-100 scale
  return Math.round((sentiment / 5) * 100);
}
