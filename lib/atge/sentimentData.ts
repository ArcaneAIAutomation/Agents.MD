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
 */
async function fetchRedditSentiment(symbol: string): Promise<SentimentData['reddit']> {
  try {
    // Use Reddit's public JSON API (no auth required)
    const subreddit = symbol.toUpperCase() === 'BTC' ? 'Bitcoin' : 'ethereum';
    const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=100`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ATGE/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status}`);
    }

    const data = await response.json();
    const posts = data.data.children;
    
    const postCount = posts.length;
    const commentCount = posts.reduce((sum: number, post: any) => 
      sum + (post.data.num_comments || 0), 0);
    
    // Calculate sentiment based on upvote ratio
    const avgUpvoteRatio = posts.reduce((sum: number, post: any) => 
      sum + (post.data.upvote_ratio || 0.5), 0) / postCount;
    
    const sentimentScore = Math.round(avgUpvoteRatio * 100);
    
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (sentimentScore > 60) {
      sentiment = 'positive';
    } else if (sentimentScore < 40) {
      sentiment = 'negative';
    }
    
    return {
      postCount,
      commentCount,
      sentiment,
      sentimentScore
    };
  } catch (error) {
    console.error('[ATGE] Reddit fetch failed:', error);
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
 */
export async function getSentimentData(symbol: string): Promise<SentimentData> {
  console.log(`[ATGE] Fetching sentiment data for ${symbol}`);
  
  // Fetch from all sources in parallel
  const [lunarCrush, twitter, reddit] = await Promise.all([
    fetchLunarCrushData(symbol),
    fetchTwitterSentiment(symbol),
    fetchRedditSentiment(symbol)
  ]);
  
  // Calculate aggregate sentiment
  const aggregateSentiment = calculateAggregateSentiment(lunarCrush, twitter, reddit);
  
  return {
    lunarCrush,
    twitter,
    reddit,
    aggregateSentiment,
    timestamp: new Date()
  };
}

export type { SentimentData };
