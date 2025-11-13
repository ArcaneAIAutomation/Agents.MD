/**
 * Sentiment Data Fetcher for ATGE
 * 
 * Fetches social sentiment from LunarCrush, Twitter/X, and Reddit
 * Calculates aggregate sentiment score
 * 
 * Requirements: 1.4
 */

interface SentimentData {
  lunarCrush: {
    socialScore: number;
    galaxyScore: number;
    altRank: number;
    sentiment: 'bullish' | 'bearish' | 'neutral';
  } | null;
  twitter: {
    mentionCount: number;
    sentiment: 'positive' | 'negative' | 'neutral';
    sentimentScore: number;
  } | null;
  reddit: {
    postCount: number;
    commentCount: number;
    sentiment: 'positive' | 'negative' | 'neutral';
    sentimentScore: number;
  } | null;
  aggregateSentiment: {
    score: number; // 0-100
    label: 'very_bullish' | 'bullish' | 'neutral' | 'bearish' | 'very_bearish';
  };
  timestamp: Date;
}

/**
 * Fetch LunarCrush social metrics
 */
async function fetchLunarCrushData(symbol: string): Promise<SentimentData['lunarCrush']> {
  const apiKey = process.env.LUNARCRUSH_API_KEY;
  
  if (!apiKey) {
    console.warn('[ATGE] LunarCrush API key not configured');
    return null;
  }

  try {
    const url = `https://lunarcrush.com/api4/public/coins/${symbol}/v1`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`LunarCrush API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract sentiment data
    const socialScore = data.social_score || 50;
    const galaxyScore = data.galaxy_score || 50;
    const altRank = data.alt_rank || 0;
    
    // Determine sentiment based on scores
    let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    if (socialScore > 60 && galaxyScore > 60) {
      sentiment = 'bullish';
    } else if (socialScore < 40 && galaxyScore < 40) {
      sentiment = 'bearish';
    }
    
    return {
      socialScore,
      galaxyScore,
      altRank,
      sentiment
    };
  } catch (error) {
    console.error('[ATGE] LunarCrush fetch failed:', error);
    return null;
  }
}

/**
 * Fetch Twitter/X sentiment
 */
async function fetchTwitterSentiment(symbol: string): Promise<SentimentData['twitter']> {
  const bearerToken = process.env.TWITTER_BEARER_TOKEN;
  
  if (!bearerToken) {
    console.warn('[ATGE] Twitter Bearer Token not configured');
    return null;
  }

  try {
    // Search for recent tweets about the cryptocurrency
    const searchQuery = symbol.toUpperCase() === 'BTC' ? 'bitcoin' : 'ethereum';
    const url = `https://api.twitter.com/2/tweets/search/recent?query=${searchQuery}&max_results=100&tweet.fields=created_at,public_metrics`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${bearerToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Twitter API error: ${response.status}`);
    }

    const data = await response.json();
    
    const mentionCount = data.meta?.result_count || 0;
    
    // Simple sentiment analysis based on engagement
    // Higher engagement typically indicates positive sentiment
    const avgLikes = data.data?.reduce((sum: number, tweet: any) => 
      sum + (tweet.public_metrics?.like_count || 0), 0) / (mentionCount || 1);
    
    const sentimentScore = Math.min(100, Math.round((avgLikes / 10) * 100));
    
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (sentimentScore > 60) {
      sentiment = 'positive';
    } else if (sentimentScore < 40) {
      sentiment = 'negative';
    }
    
    return {
      mentionCount,
      sentiment,
      sentimentScore
    };
  } catch (error) {
    console.error('[ATGE] Twitter fetch failed:', error);
    return null;
  }
}

/**
 * Fetch Reddit sentiment
 * 
 * NOTE: Reddit API frequently returns 403 errors due to rate limiting
 * This function gracefully handles failures and returns null
 * Trade generation continues without Reddit data
 */
async function fetchRedditSentiment(symbol: string): Promise<SentimentData['reddit']> {
  try {
    // Use Reddit's public JSON API (no auth required)
    const subreddit = symbol.toUpperCase() === 'BTC' ? 'Bitcoin' : 'ethereum';
    const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=100`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ATGE/1.0; +https://news.arcane.group)'
      },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });

    if (!response.ok) {
      // Reddit often returns 403 - this is expected, not an error
      if (response.status === 403) {
        console.log('[ATGE] Reddit API returned 403 (rate limited) - continuing without Reddit data');
      } else {
        console.warn(`[ATGE] Reddit API returned ${response.status} - continuing without Reddit data`);
      }
      return null;
    }

    const data = await response.json();
    
    // Validate response structure
    if (!data?.data?.children || !Array.isArray(data.data.children)) {
      console.warn('[ATGE] Reddit API returned invalid data structure - continuing without Reddit data');
      return null;
    }
    
    const posts = data.data.children;
    
    if (posts.length === 0) {
      console.log('[ATGE] Reddit API returned no posts - continuing without Reddit data');
      return null;
    }
    
    const postCount = posts.length;
    const commentCount = posts.reduce((sum: number, post: any) => 
      sum + (post.data?.num_comments || 0), 0);
    
    // Calculate sentiment based on upvote ratio
    const avgUpvoteRatio = posts.reduce((sum: number, post: any) => 
      sum + (post.data?.upvote_ratio || 0.5), 0) / postCount;
    
    const sentimentScore = Math.round(avgUpvoteRatio * 100);
    
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (sentimentScore > 60) {
      sentiment = 'positive';
    } else if (sentimentScore < 40) {
      sentiment = 'negative';
    }
    
    console.log(`[ATGE] Reddit sentiment fetched successfully: ${sentiment} (${sentimentScore})`);
    
    return {
      postCount,
      commentCount,
      sentiment,
      sentimentScore
    };
  } catch (error) {
    // Gracefully handle all errors - Reddit is optional
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.log('[ATGE] Reddit API timeout (5s) - continuing without Reddit data');
      } else {
        console.log(`[ATGE] Reddit fetch failed: ${error.message} - continuing without Reddit data`);
      }
    } else {
      console.log('[ATGE] Reddit fetch failed with unknown error - continuing without Reddit data');
    }
    return null;
  }
}

/**
 * Calculate aggregate sentiment score from all sources
 */
function calculateAggregateSentiment(
  lunarCrush: SentimentData['lunarCrush'],
  twitter: SentimentData['twitter'],
  reddit: SentimentData['reddit']
): SentimentData['aggregateSentiment'] {
  const scores: number[] = [];
  
  // Add LunarCrush score (weighted average of social and galaxy scores)
  if (lunarCrush) {
    const lcScore = (lunarCrush.socialScore + lunarCrush.galaxyScore) / 2;
    scores.push(lcScore);
  }
  
  // Add Twitter score
  if (twitter) {
    scores.push(twitter.sentimentScore);
  }
  
  // Add Reddit score
  if (reddit) {
    scores.push(reddit.sentimentScore);
  }
  
  // Calculate average (default to 50 if no data)
  const avgScore = scores.length > 0 
    ? scores.reduce((sum, score) => sum + score, 0) / scores.length
    : 50;
  
  // Determine label
  let label: SentimentData['aggregateSentiment']['label'];
  if (avgScore >= 75) {
    label = 'very_bullish';
  } else if (avgScore >= 55) {
    label = 'bullish';
  } else if (avgScore >= 45) {
    label = 'neutral';
  } else if (avgScore >= 25) {
    label = 'bearish';
  } else {
    label = 'very_bearish';
  }
  
  return {
    score: Math.round(avgScore),
    label
  };
}

/**
 * Get sentiment data from all sources
 * 
 * @param symbol - Cryptocurrency symbol (BTC or ETH)
 * @returns Aggregated sentiment data
 * 
 * NOTE: This function is designed to NEVER throw errors
 * If all sources fail, it returns neutral sentiment (score: 50)
 * Trade generation continues regardless of sentiment data availability
 */
export async function getSentimentData(symbol: string): Promise<SentimentData> {
  console.log(`[ATGE] Fetching sentiment data for ${symbol}`);
  
  try {
    // Fetch from all sources in parallel
    // Each function handles its own errors and returns null on failure
    const [lunarCrush, twitter, reddit] = await Promise.all([
      fetchLunarCrushData(symbol).catch(err => {
        console.log(`[ATGE] LunarCrush error caught in Promise.all: ${err.message}`);
        return null;
      }),
      fetchTwitterSentiment(symbol).catch(err => {
        console.log(`[ATGE] Twitter error caught in Promise.all: ${err.message}`);
        return null;
      }),
      fetchRedditSentiment(symbol).catch(err => {
        console.log(`[ATGE] Reddit error caught in Promise.all: ${err.message}`);
        return null;
      })
    ]);
    
    // Log which sources succeeded
    const successfulSources = [
      lunarCrush && 'LunarCrush',
      twitter && 'Twitter',
      reddit && 'Reddit'
    ].filter(Boolean);
    
    if (successfulSources.length > 0) {
      console.log(`[ATGE] Sentiment data fetched from: ${successfulSources.join(', ')}`);
    } else {
      console.log('[ATGE] No sentiment data available - using neutral sentiment (50)');
    }
    
    // Calculate aggregate sentiment
    const aggregateSentiment = calculateAggregateSentiment(lunarCrush, twitter, reddit);
    
    return {
      lunarCrush,
      twitter,
      reddit,
      aggregateSentiment,
      timestamp: new Date()
    };
  } catch (error) {
    // Ultimate fallback - should never happen, but ensures function never throws
    console.error('[ATGE] Unexpected error in getSentimentData:', error);
    
    return {
      lunarCrush: null,
      twitter: null,
      reddit: null,
      aggregateSentiment: {
        score: 50,
        label: 'neutral'
      },
      timestamp: new Date()
    };
  }
}

export type { SentimentData };
