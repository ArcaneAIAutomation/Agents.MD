/**
 * UCIE Sentiment Analysis API Endpoint
 * 
 * GET /api/ucie/sentiment/BTC
 * 
 * Returns social sentiment analysis to gauge market mood and community activity.
 * 
 * What you'll see:
 * - Overall Sentiment Score (0-100): Combined sentiment from all sources
 * - Fear & Greed Index: Market-wide fear/greed indicator (0=Extreme Fear, 100=Extreme Greed)
 * - LunarCrush Galaxy Score: Social media popularity ranking (0-100, higher = more popular)
 * - Reddit Activity: Community mentions and sentiment from crypto subreddits
 * 
 * Why it matters: Helps you understand if the market is optimistic (bullish) or pessimistic (bearish)
 * about Bitcoin based on social media, news, and community discussions.
 * 
 * Uses database-backed caching (TTL: 5 minutes)
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
 * 
 * ✅ FIXED: Uses correct v4 API endpoint and field mapping
 * - Endpoint: /coins/{symbol}/v1 (Details endpoint, not List endpoint)
 * - Response structure: { data: { topic: {...} } } or { data: {...} }
 * - Field names: v4 naming (interactions_24h, creators_active_24h, etc.)
 */
async function fetchLunarCrushData(symbol: string): Promise<any | null> {
  const apiKey = process.env.LUNARCRUSH_API_KEY;
  
  if (!apiKey) {
    console.warn('❌ LunarCrush API key not configured');
    return null;
  }

  try {
    console.log(`📊 Fetching LunarCrush data for ${symbol}...`);
    console.log(`   Using Details endpoint: /coins/${symbol}/v1`);
    
    const response = await fetch(
      `https://lunarcrush.com/api4/public/coins/${symbol}/v1`,
      {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) {
      console.warn(`❌ LunarCrush API returned ${response.status}: ${response.statusText}`);
      
      // Try public endpoint as fallback
      console.log(`   Trying public endpoint fallback...`);
      const publicResponse = await fetch(
        `https://lunarcrush.com/api4/public/coins/${symbol}/v1`,
        {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(10000),
        }
      );
      
      if (!publicResponse.ok) {
        console.warn(`❌ LunarCrush public API also returned ${publicResponse.status}`);
        return null;
      }
      
      const publicData = await publicResponse.json();
      
      // ✅ CRITICAL FIX: Check for topic object first, then data
      const data = publicData.data?.topic || publicData.data || publicData.topic;
      
      if (!data) {
        console.warn('❌ LunarCrush response missing data/topic field');
        console.warn('   Response structure:', JSON.stringify(publicData, null, 2));
        return null;
      }
      
      // ✅ Log available data
      console.log(`✅ LunarCrush data (public):`, {
        galaxy_score: data.galaxy_score,
        alt_rank: data.alt_rank,
        volatility: data.volatility
      });
      
      return data;
    }

    const json = await response.json();
    
    // ✅ CRITICAL FIX: Check for topic object first, then data
    // LunarCrush v4 API returns: { data: { topic: {...} } } or { data: {...} }
    const data = json.data?.topic || json.data || json.topic;
    
    if (!data) {
      console.warn('❌ LunarCrush response missing data/topic field');
      console.warn('   Response structure:', JSON.stringify(json, null, 2));
      return null;
    }

    // ✅ Log available data
    console.log(`✅ LunarCrush data:`, {
      galaxy_score: data.galaxy_score,
      alt_rank: data.alt_rank,
      volatility: data.volatility
    });

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

    // 4. Format response with user-friendly descriptions
    const response = {
      symbol: symbolUpper,
      overallScore,
      sentiment: overallScore > 60 ? 'bullish' : overallScore < 40 ? 'bearish' : 'neutral',
      
      // Fear & Greed Index (PRIMARY)
      fearGreedIndex: fearGreedData ? {
        value: fearGreedData.value,
        classification: fearGreedData.classification,
        description: 'Market-wide sentiment indicator. 0-25 = Extreme Fear (good buying opportunity), 25-45 = Fear, 45-55 = Neutral, 55-75 = Greed, 75-100 = Extreme Greed (caution advised)'
      } : null,
      
      // LunarCrush data (galaxy_score and alt_rank only)
      lunarCrush: lunarCrushData ? {
        galaxyScore: lunarCrushData.galaxy_score || 0,
        galaxyScoreDescription: 'Social media popularity score (0-100). Higher scores mean more social buzz and community engagement.',
        altRank: lunarCrushData.alt_rank || 0,
        altRankDescription: 'Social ranking among all cryptocurrencies. Lower numbers = higher social activity (Rank 1 is most popular).',
        volatility: lunarCrushData.volatility || 0,
        volatilityDescription: 'Price volatility indicator. Higher values mean bigger price swings.'
      } : null,
      
      // Reddit data
      reddit: redditData ? {
        mentions24h: redditData.mentions24h,
        mentionsDescription: 'Number of Reddit posts mentioning Bitcoin in the last 24 hours across crypto subreddits.',
        sentiment: redditData.sentiment,
        sentimentDescription: 'Reddit community sentiment (0-100). Above 50 = positive, below 50 = negative.',
        activeSubreddits: redditData.activeSubreddits
      } : null,
      
      // Data quality
      dataQuality,
      dataQualityDescription: 'Percentage of data sources successfully retrieved. 100% = all sources working.',
      
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
