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
 * ✅ NEW: Fetch CoinMarketCap sentiment data
 * Provides market cap dominance, volume trends, and price momentum
 */
async function fetchCoinMarketCapSentiment(symbol: string): Promise<any | null> {
  const apiKey = process.env.COINMARKETCAP_API_KEY;
  
  if (!apiKey) {
    console.warn('❌ CoinMarketCap API key not configured');
    return null;
  }

  try {
    console.log(`📊 Fetching CoinMarketCap sentiment for ${symbol}...`);
    
    const response = await fetch(
      `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${symbol}&convert=USD`,
      {
        headers: {
          'X-CMC_PRO_API_KEY': apiKey,
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      }
    );

    if (!response.ok) {
      console.warn(`❌ CoinMarketCap API returned ${response.status}`);
      return null;
    }

    const data = await response.json();
    const coinData = data.data?.[symbol];
    
    if (!coinData) {
      console.warn(`❌ No CoinMarketCap data for ${symbol}`);
      return null;
    }

    const quote = coinData.quote?.USD;
    
    // Calculate sentiment from price momentum and volume
    const priceChange24h = quote?.percent_change_24h || 0;
    const priceChange7d = quote?.percent_change_7d || 0;
    const volumeChange24h = quote?.volume_change_24h || 0;
    const marketCapDominance = quote?.market_cap_dominance || 0;
    
    // Sentiment score based on price momentum (0-100 scale)
    // Positive changes = bullish, negative = bearish
    let sentimentScore = 50; // Neutral baseline
    
    // Price change impact (±30 points max)
    sentimentScore += Math.min(Math.max(priceChange24h * 2, -30), 30);
    
    // Volume change impact (±10 points max)
    sentimentScore += Math.min(Math.max(volumeChange24h / 10, -10), 10);
    
    // 7-day trend impact (±10 points max)
    sentimentScore += Math.min(Math.max(priceChange7d, -10), 10);
    
    // Clamp to 0-100
    sentimentScore = Math.max(0, Math.min(100, sentimentScore));
    
    console.log(`✅ CoinMarketCap sentiment: ${sentimentScore.toFixed(0)}/100`);
    
    return {
      sentimentScore: Math.round(sentimentScore),
      priceChange24h,
      priceChange7d,
      volumeChange24h,
      marketCapDominance,
      volume24h: quote?.volume_24h || 0,
      marketCap: quote?.market_cap || 0,
      circulatingSupply: coinData.circulating_supply || 0,
      totalSupply: coinData.total_supply || 0,
      rank: coinData.cmc_rank || 0
    };
  } catch (error) {
    console.error('❌ CoinMarketCap sentiment fetch error:', error);
    return null;
  }
}

/**
 * ✅ NEW: Fetch CoinGecko sentiment data
 * Provides community scores, developer activity, and public interest
 */
async function fetchCoinGeckoSentiment(symbol: string): Promise<any | null> {
  try {
    console.log(`📊 Fetching CoinGecko sentiment for ${symbol}...`);
    
    // Map symbol to CoinGecko ID
    const coinId = symbol.toLowerCase() === 'btc' ? 'bitcoin' : 
                   symbol.toLowerCase() === 'eth' ? 'ethereum' : 
                   symbol.toLowerCase();
    
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=true&developer_data=true&sparkline=false`,
      {
        headers: {
          'Accept': 'application/json',
          ...(process.env.COINGECKO_API_KEY && {
            'x-cg-pro-api-key': process.env.COINGECKO_API_KEY
          })
        },
        signal: AbortSignal.timeout(10000)
      }
    );

    if (!response.ok) {
      console.warn(`❌ CoinGecko API returned ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    // Extract sentiment indicators
    const communityScore = data.community_score || 0;
    const developerScore = data.developer_score || 0;
    const publicInterestScore = data.public_interest_score || 0;
    const sentimentVotesUpPercentage = data.sentiment_votes_up_percentage || 50;
    
    // Community data
    const twitterFollowers = data.community_data?.twitter_followers || 0;
    const redditSubscribers = data.community_data?.reddit_subscribers || 0;
    const redditActiveAccounts = data.community_data?.reddit_accounts_active_48h || 0;
    
    // Market data for sentiment
    const priceChange24h = data.market_data?.price_change_percentage_24h || 0;
    const priceChange7d = data.market_data?.price_change_percentage_7d || 0;
    const priceChange30d = data.market_data?.price_change_percentage_30d || 0;
    
    // Calculate overall sentiment (0-100 scale)
    let sentimentScore = 0;
    
    // Community score (0-100) - 30% weight
    sentimentScore += communityScore * 0.3;
    
    // Developer score (0-100) - 20% weight
    sentimentScore += developerScore * 0.2;
    
    // Public interest (0-100) - 20% weight
    sentimentScore += publicInterestScore * 20 * 0.2; // Scale to 100
    
    // Sentiment votes - 30% weight
    sentimentScore += sentimentVotesUpPercentage * 0.3;
    
    console.log(`✅ CoinGecko sentiment: ${sentimentScore.toFixed(0)}/100`);
    
    return {
      sentimentScore: Math.round(sentimentScore),
      communityScore,
      developerScore,
      publicInterestScore,
      sentimentVotesUpPercentage,
      sentimentVotesDownPercentage: 100 - sentimentVotesUpPercentage,
      twitterFollowers,
      redditSubscribers,
      redditActiveAccounts,
      priceChange24h,
      priceChange7d,
      priceChange30d,
      marketCapRank: data.market_cap_rank || 0,
      coingeckoRank: data.coingecko_rank || 0
    };
  } catch (error) {
    console.error('❌ CoinGecko sentiment fetch error:', error);
    return null;
  }
}

/**
 * Fetch LunarCrush data (optional - may timeout)
 * 
 * ✅ FIXED (January 27, 2025): Implements all 3 critical fixes from test analysis
 * 
 * FIX #1: Added ?data=all parameter to force inclusion of social metrics
 * FIX #2: Corrected social feed endpoint path (global resource)
 * FIX #3: Corrected influencer endpoint path (global resource)
 * 
 * - Endpoint: /coins/{symbol}/v1?data=all (Forces all social metrics)
 * - Response structure: { data: { topic: {...} } } or { data: {...} }
 * - Field names: v4 naming (interactions_24h, creators_active_24h, social_volume, etc.)
 */
async function fetchLunarCrushData(symbol: string): Promise<any | null> {
  const apiKey = process.env.LUNARCRUSH_API_KEY;
  
  if (!apiKey) {
    console.warn('❌ LunarCrush API key not configured');
    return null;
  }

  try {
    console.log(`📊 Fetching LunarCrush data for ${symbol}...`);
    console.log(`   ✅ FIX #1: Using ?data=all parameter to force social metrics`);
    
    // ✅ FIX #1: Add ?data=all parameter to force inclusion of social metrics
    const response = await fetch(
      `https://lunarcrush.com/api4/public/coins/${symbol}/v1?data=all`,
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
      
      // Try public endpoint as fallback (also with ?data=all)
      console.log(`   Trying public endpoint fallback with ?data=all...`);
      const publicResponse = await fetch(
        `https://lunarcrush.com/api4/public/coins/${symbol}/v1?data=all`,
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
      
      // ✅ Log available data (including new social metrics)
      console.log(`✅ LunarCrush data (public):`, {
        galaxy_score: data.galaxy_score,
        alt_rank: data.alt_rank,
        volatility: data.volatility,
        social_volume: data.social_volume,
        interactions_24h: data.interactions_24h,
        social_contributors: data.social_contributors
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

    // ✅ Log available data (including new social metrics from ?data=all)
    console.log(`✅ LunarCrush data with social metrics:`, {
      galaxy_score: data.galaxy_score,
      alt_rank: data.alt_rank,
      volatility: data.volatility,
      social_volume: data.social_volume,
      interactions_24h: data.interactions_24h,
      social_contributors: data.social_contributors,
      creators_active_24h: data.creators_active_24h
    });

    return data;
  } catch (error) {
    console.error('❌ LunarCrush fetch error:', error);
    return null;
  }
}

/**
 * ✅ NEW: Fetch LunarCrush social feed (FIX #2)
 * Corrected endpoint: /feeds/v1 (global resource, not /coins/{symbol}/posts/v1)
 */
async function fetchLunarCrushSocialFeed(symbol: string, limit: number = 10): Promise<any | null> {
  const apiKey = process.env.LUNARCRUSH_API_KEY;
  
  if (!apiKey) {
    console.warn('❌ LunarCrush API key not configured');
    return null;
  }

  try {
    console.log(`📊 Fetching LunarCrush social feed for ${symbol}...`);
    console.log(`   ✅ FIX #2: Using correct endpoint /feeds/v1?symbol=${symbol}`);
    
    // ✅ FIX #2: Correct endpoint path (global resource filtered by symbol)
    const response = await fetch(
      `https://lunarcrush.com/api4/public/feeds/v1?symbol=${symbol}&limit=${limit}`,
      {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) {
      console.warn(`❌ LunarCrush social feed API returned ${response.status}: ${response.statusText}`);
      return null;
    }

    const json = await response.json();
    const feeds = json.data || [];
    
    console.log(`✅ LunarCrush social feed: ${feeds.length} posts retrieved`);
    
    return feeds;
  } catch (error) {
    console.error('❌ LunarCrush social feed fetch error:', error);
    return null;
  }
}

/**
 * ✅ NEW: Fetch LunarCrush influencer metrics (FIX #3)
 * Corrected endpoint: /influencers/v1 (global resource, not /coins/{symbol}/influencers/v1)
 */
async function fetchLunarCrushInfluencers(symbol: string, limit: number = 5): Promise<any | null> {
  const apiKey = process.env.LUNARCRUSH_API_KEY;
  
  if (!apiKey) {
    console.warn('❌ LunarCrush API key not configured');
    return null;
  }

  try {
    console.log(`📊 Fetching LunarCrush influencers for ${symbol}...`);
    console.log(`   ✅ FIX #3: Using correct endpoint /influencers/v1?symbol=${symbol}`);
    
    // ✅ FIX #3: Correct endpoint path (global resource filtered by symbol)
    const response = await fetch(
      `https://lunarcrush.com/api4/public/influencers/v1?symbol=${symbol}&limit=${limit}`,
      {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) {
      console.warn(`❌ LunarCrush influencers API returned ${response.status}: ${response.statusText}`);
      return null;
    }

    const json = await response.json();
    const influencers = json.data || [];
    
    console.log(`✅ LunarCrush influencers: ${influencers.length} influencers retrieved`);
    
    return influencers;
  } catch (error) {
    console.error('❌ LunarCrush influencers fetch error:', error);
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

    // 2. Fetch sentiment data from ALL sources IN PARALLEL (faster)
    // ✅ UPDATED: Now includes social feed and influencers (FIX #2 and #3)
    const [fearGreed, coinMarketCap, coinGecko, lunarCrush, lunarCrushFeed, lunarCrushInfluencers, reddit] = await Promise.allSettled([
      fetchFearGreedIndex(),
      fetchCoinMarketCapSentiment(symbolUpper),
      fetchCoinGeckoSentiment(symbolUpper),
      fetchLunarCrushData(symbolUpper),
      fetchLunarCrushSocialFeed(symbolUpper, 10), // ✅ FIX #2
      fetchLunarCrushInfluencers(symbolUpper, 5), // ✅ FIX #3
      fetchRedditSentiment(symbolUpper)
    ]);

    // Extract results
    const fearGreedData = fearGreed.status === 'fulfilled' ? fearGreed.value : null;
    const coinMarketCapData = coinMarketCap.status === 'fulfilled' ? coinMarketCap.value : null;
    const coinGeckoData = coinGecko.status === 'fulfilled' ? coinGecko.value : null;
    const lunarCrushData = lunarCrush.status === 'fulfilled' ? lunarCrush.value : null;
    const lunarCrushFeedData = lunarCrushFeed.status === 'fulfilled' ? lunarCrushFeed.value : null;
    const lunarCrushInfluencersData = lunarCrushInfluencers.status === 'fulfilled' ? lunarCrushInfluencers.value : null;
    const redditData = reddit.status === 'fulfilled' ? reddit.value : null;

    // 3. Calculate aggregated sentiment score with NEW sources
    const scores: number[] = [];
    let totalWeight = 0;

    // Fear & Greed Index (weight: 25%) - Market-wide sentiment
    if (fearGreedData) {
      scores.push(fearGreedData.value * 0.25);
      totalWeight += 0.25;
    }

    // ✅ NEW: CoinMarketCap (weight: 20%) - Price momentum & volume
    if (coinMarketCapData) {
      scores.push(coinMarketCapData.sentimentScore * 0.20);
      totalWeight += 0.20;
    }

    // ✅ NEW: CoinGecko (weight: 20%) - Community & developer activity
    if (coinGeckoData) {
      scores.push(coinGeckoData.sentimentScore * 0.20);
      totalWeight += 0.20;
    }

    // LunarCrush (weight: 20%) - Social media metrics
    if (lunarCrushData) {
      const lcSentiment = calculateLunarCrushSentiment(lunarCrushData);
      scores.push(lcSentiment * 0.20);
      totalWeight += 0.20;
    }

    // Reddit (weight: 15%) - Community discussions
    if (redditData) {
      scores.push(redditData.sentiment * 0.15);
      totalWeight += 0.15;
    }

    // 4. Calculate data quality (now with 5 sources)
    let dataQuality = 0;
    if (fearGreedData) dataQuality += 25; // Fear & Greed
    if (coinMarketCapData) dataQuality += 20; // CoinMarketCap
    if (coinGeckoData) dataQuality += 20; // CoinGecko
    if (lunarCrushData) dataQuality += 20; // LunarCrush
    if (redditData) dataQuality += 15; // Reddit

    // ✅ CRITICAL FIX: NO FALLBACK DATA - Fail if insufficient quality
    // Require at least 2 sources (40% minimum) for reliable sentiment
    if (dataQuality < 40) {
      console.log(`❌ Insufficient data quality: ${dataQuality}% (minimum 40% required)`);
      return res.status(503).json({
        success: false,
        error: 'Unable to fetch reliable sentiment data',
        dataQuality: dataQuality,
        availableSources: {
          fearGreed: !!fearGreedData,
          coinMarketCap: !!coinMarketCapData,
          coinGecko: !!coinGeckoData,
          lunarCrush: !!lunarCrushData,
          reddit: !!redditData
        },
        message: 'Sentiment analysis requires at least 2 data sources. Please try again later.'
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
      sentimentDescription: `Overall market sentiment is ${overallScore > 60 ? 'BULLISH' : overallScore < 40 ? 'BEARISH' : 'NEUTRAL'} based on ${Math.round(totalWeight * 100)}% of available data sources.`,
      
      // Fear & Greed Index
      fearGreedIndex: fearGreedData ? {
        value: fearGreedData.value,
        classification: fearGreedData.classification,
        weight: '25%',
        description: 'Market-wide sentiment indicator. 0-25 = Extreme Fear (good buying opportunity), 25-45 = Fear, 45-55 = Neutral, 55-75 = Greed, 75-100 = Extreme Greed (caution advised)'
      } : null,
      
      // ✅ NEW: CoinMarketCap sentiment
      coinMarketCap: coinMarketCapData ? {
        sentimentScore: coinMarketCapData.sentimentScore,
        weight: '20%',
        priceChange24h: coinMarketCapData.priceChange24h,
        priceChange7d: coinMarketCapData.priceChange7d,
        volumeChange24h: coinMarketCapData.volumeChange24h,
        marketCapDominance: coinMarketCapData.marketCapDominance,
        volume24h: coinMarketCapData.volume24h,
        marketCap: coinMarketCapData.marketCap,
        rank: coinMarketCapData.rank,
        description: 'Price momentum and volume analysis. Sentiment derived from 24h/7d price changes, volume trends, and market dominance. Higher scores indicate bullish momentum.'
      } : null,
      
      // ✅ NEW: CoinGecko sentiment
      coinGecko: coinGeckoData ? {
        sentimentScore: coinGeckoData.sentimentScore,
        weight: '20%',
        communityScore: coinGeckoData.communityScore,
        developerScore: coinGeckoData.developerScore,
        publicInterestScore: coinGeckoData.publicInterestScore,
        sentimentVotesUpPercentage: coinGeckoData.sentimentVotesUpPercentage,
        sentimentVotesDownPercentage: coinGeckoData.sentimentVotesDownPercentage,
        twitterFollowers: coinGeckoData.twitterFollowers,
        redditSubscribers: coinGeckoData.redditSubscribers,
        redditActiveAccounts: coinGeckoData.redditActiveAccounts,
        priceChange24h: coinGeckoData.priceChange24h,
        priceChange7d: coinGeckoData.priceChange7d,
        priceChange30d: coinGeckoData.priceChange30d,
        marketCapRank: coinGeckoData.marketCapRank,
        description: 'Community engagement and developer activity. Combines community score, developer activity, public interest, and user sentiment votes. Higher scores indicate strong community support.'
      } : null,
      
      // LunarCrush social metrics (✅ ENHANCED with FIX #1 data)
      lunarCrush: lunarCrushData ? {
        galaxyScore: lunarCrushData.galaxy_score || 0,
        weight: '20%',
        galaxyScoreDescription: 'Social media popularity score (0-100). Higher scores mean more social buzz and community engagement.',
        altRank: lunarCrushData.alt_rank || 0,
        altRankDescription: 'Social ranking among all cryptocurrencies. Lower numbers = higher social activity (Rank 1 is most popular).',
        volatility: lunarCrushData.volatility || 0,
        volatilityDescription: 'Price volatility indicator. Higher values mean bigger price swings.',
        
        // ✅ NEW: Social metrics from ?data=all parameter (FIX #1)
        socialVolume: lunarCrushData.social_volume || 0,
        socialVolumeDescription: 'Total social media mentions across all platforms in the last 24 hours.',
        interactions24h: lunarCrushData.interactions_24h || 0,
        interactions24hDescription: 'Total likes, shares, comments, and retweets in the last 24 hours.',
        socialContributors: lunarCrushData.social_contributors || 0,
        socialContributorsDescription: 'Number of unique users discussing this cryptocurrency.',
        creatorsActive24h: lunarCrushData.creators_active_24h || 0,
        creatorsActive24hDescription: 'Number of content creators posting about this cryptocurrency in the last 24 hours.',
        
        description: 'Social media metrics from Twitter, Reddit, and other platforms. Galaxy Score measures overall social engagement and influence.'
      } : null,
      
      // ✅ NEW: LunarCrush social feed (FIX #2)
      lunarCrushFeed: lunarCrushFeedData && Array.isArray(lunarCrushFeedData) ? {
        posts: lunarCrushFeedData.slice(0, 5).map((post: any) => ({
          title: post.title || 'Untitled',
          url: post.url || '',
          source: post.source || 'Unknown',
          sentiment: post.sentiment || 'neutral',
          timestamp: post.created_at || post.time || ''
        })),
        totalPosts: lunarCrushFeedData.length,
        description: 'Recent social media posts and news articles mentioning this cryptocurrency. Provides real-time community sentiment and trending topics.'
      } : null,
      
      // ✅ NEW: LunarCrush influencers (FIX #3)
      lunarCrushInfluencers: lunarCrushInfluencersData && Array.isArray(lunarCrushInfluencersData) ? {
        influencers: lunarCrushInfluencersData.slice(0, 5).map((influencer: any) => ({
          name: influencer.name || 'Unknown',
          handle: influencer.handle || '',
          followers: influencer.followers || 0,
          influencerScore: influencer.influencer_score || 0,
          platform: influencer.platform || 'twitter'
        })),
        totalInfluencers: lunarCrushInfluencersData.length,
        description: 'Top crypto influencers discussing this cryptocurrency. Influencer score measures their impact and reach in the crypto community.'
      } : null,
      
      // Reddit community data
      reddit: redditData ? {
        mentions24h: redditData.mentions24h,
        weight: '15%',
        mentionsDescription: 'Number of Reddit posts mentioning Bitcoin in the last 24 hours across crypto subreddits.',
        sentiment: redditData.sentiment,
        sentimentDescription: 'Reddit community sentiment (0-100). Above 50 = positive, below 50 = negative.',
        activeSubreddits: redditData.activeSubreddits,
        description: 'Community discussions from r/cryptocurrency, r/CryptoMarkets, and r/Bitcoin. Sentiment based on post upvotes and engagement.'
      } : null,
      
      // Data quality and sources
      dataQuality,
      dataQualityDescription: `Successfully retrieved ${dataQuality}% of sentiment data from 5 sources (Fear & Greed, CoinMarketCap, CoinGecko, LunarCrush, Reddit).`,
      sourcesUsed: [
        fearGreedData && 'Fear & Greed Index (25%)',
        coinMarketCapData && 'CoinMarketCap (20%)',
        coinGeckoData && 'CoinGecko (20%)',
        lunarCrushData && 'LunarCrush (20%)',
        redditData && 'Reddit (15%)'
      ].filter(Boolean),
      
      timestamp: new Date().toISOString()
    };

    // 5. Cache the result (6.5 minutes = 390 seconds)
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
      390, // 6.5 minutes
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
