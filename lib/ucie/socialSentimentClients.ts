/**
 * Social Sentiment API Clients for UCIE
 * 
 * Integrates with multiple social media platforms to aggregate sentiment data:
 * - LunarCrush: Social metrics and sentiment scores
 * - Twitter/X: Tweet analysis and engagement
 * - Reddit: Subreddit sentiment and discussions
 * 
 * Requirements: 5.1, 5.2
 */

// ============================================================================
// Type Definitions
// ============================================================================

export interface SocialPost {
  id: string;
  platform: 'twitter' | 'reddit' | 'discord';
  author: string;
  content: string;
  timestamp: string;
  engagement: {
    likes: number;
    shares: number;
    comments: number;
  };
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number; // -1 to 1
  url: string;
}

export interface Influencer {
  id: string;
  platform: 'twitter' | 'reddit' | 'discord';
  username: string;
  displayName: string;
  followers: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  sentimentScore: number; // -100 to 100
  recentPosts: SocialPost[];
  impactScore: number; // 0-100
  profileUrl: string;
}

export interface SocialMetrics {
  platform: 'twitter' | 'reddit' | 'discord' | 'lunarcrush';
  mentions: number;
  sentiment: number; // -100 to 100
  volume24h: number;
  volumeChange24h: number;
  engagementRate: number;
  dominance: number; // Percentage of total crypto social volume
}

export interface LunarCrushData {
  symbol: string;
  name: string;
  price: number;
  volume24h: number;
  marketCap: number;
  socialScore: number; // 0-100
  sentimentScore: number; // -100 to 100
  socialVolume: number;
  socialVolumeChange24h: number;
  socialDominance: number;
  galaxyScore: number; // 0-100
  altRank: number;
  mentions: number;
  interactions: number;
  contributors: number;
  trendingScore: number;
}

export interface TwitterMetrics {
  symbol: string;
  mentions24h: number;
  sentiment: number; // -100 to 100
  topTweets: SocialPost[];
  influencers: Influencer[];
  trendingHashtags: string[];
  engagementRate: number;
}

export interface RedditMetrics {
  symbol: string;
  mentions24h: number;
  sentiment: number; // -100 to 100
  topPosts: SocialPost[];
  activeSubreddits: string[];
  subscribers: number;
  postsPerDay: number;
  commentsPerDay: number;
}

// ============================================================================
// LunarCrush API Client
// ============================================================================

/**
 * Parse LunarCrush API v4 response
 */
function parseLunarCrushV4Response(data: any, symbol: string): LunarCrushData | null {
  if (!data || !data.data) {
    console.warn(`⚠️ No LunarCrush data found for ${symbol}`);
    return null;
  }

  const coin = data.data;

  return {
    symbol: coin.symbol || symbol,
    name: coin.name || '',
    price: coin.price || 0,
    volume24h: coin.volume_24h || 0,
    marketCap: coin.market_cap || 0,
    socialScore: coin.social_score || 0,
    sentimentScore: calculateSentimentScore(coin.sentiment || 3), // v4 uses 0-5 scale
    socialVolume: coin.social_volume || 0,
    socialVolumeChange24h: coin.social_volume_change_24h || 0,
    socialDominance: coin.social_dominance || 0,
    galaxyScore: coin.galaxy_score || 0,
    altRank: coin.alt_rank || 0,
    mentions: coin.social_mentions || 0,
    interactions: coin.social_interactions || 0,
    contributors: coin.social_contributors || 0,
    trendingScore: coin.trending_score || 0,
  };
}

/**
 * Fetch social metrics from LunarCrush API v4
 * LunarCrush provides comprehensive social data aggregated from multiple sources
 */
export async function fetchLunarCrushData(symbol: string): Promise<LunarCrushData | null> {
  const apiKey = process.env.LUNARCRUSH_API_KEY;
  
  if (!apiKey) {
    console.warn('❌ LunarCrush API key not configured');
    return null;
  }

  try {
    console.log(`🌙 Fetching LunarCrush v4 data for ${symbol}...`);
    
    // Try authenticated endpoint first (v4)
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
      console.warn(`⚠️ LunarCrush authenticated API error: ${response.status}, trying public endpoint...`);
      
      // Try public endpoint as fallback (no auth)
      const publicResponse = await fetch(
        `https://lunarcrush.com/api4/public/coins/${symbol}/v1`,
        {
          headers: {
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(10000),
        }
      );
      
      if (!publicResponse.ok) {
        console.error(`❌ LunarCrush public API also failed: ${publicResponse.status}`);
        return null;
      }
      
      const publicData = await publicResponse.json();
      console.log(`✅ LunarCrush public data fetched successfully for ${symbol}`);
      return parseLunarCrushV4Response(publicData, symbol);
    }

    const data = await response.json();
    console.log(`✅ LunarCrush authenticated data fetched successfully for ${symbol}`);
    
    return parseLunarCrushV4Response(data, symbol);
  } catch (error) {
    console.error('❌ Error fetching LunarCrush data:', error);
    if (error instanceof Error) {
      console.error(`❌ LunarCrush error details: ${error.message}`);
    }
    return null;
  }
}

/**
 * Convert LunarCrush sentiment (0-5 scale) to -100 to 100 scale
 */
function calculateSentimentScore(lunarCrushSentiment: number): number {
  // LunarCrush uses 0-5 scale where 3 is neutral
  // Convert to -100 to 100 scale
  return ((lunarCrushSentiment - 3) / 2) * 100;
}

// ============================================================================
// Twitter/X API Client
// ============================================================================

/**
 * Fetch Twitter metrics and sentiment for a cryptocurrency
 * Uses Twitter API v2 for tweet search and analysis
 */
export async function fetchTwitterMetrics(symbol: string): Promise<TwitterMetrics | null> {
  const bearerToken = process.env.TWITTER_BEARER_TOKEN;
  
  if (!bearerToken) {
    console.warn('Twitter API bearer token not configured');
    return null;
  }

  try {
    // Search for recent tweets mentioning the symbol
    const searchQuery = `${symbol} OR $${symbol} OR #${symbol} -is:retweet lang:en`;
    const response = await fetch(
      `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(searchQuery)}&max_results=100&tweet.fields=created_at,public_metrics,author_id&expansions=author_id&user.fields=username,name,public_metrics`,
      {
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) {
      console.error(`Twitter API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    console.log(`✅ Twitter API success: ${data.data?.length || 0} tweets found for ${symbol}`);
    
    if (!data.data || data.data.length === 0) {
      console.warn(`⚠️ No Twitter data found for ${symbol}`);
      return {
        symbol,
        mentions24h: 0,
        sentiment: 0,
        topTweets: [],
        influencers: [],
        trendingHashtags: [],
        engagementRate: 0,
      };
    }

    // Process tweets and calculate sentiment
    const tweets = data.data.map((tweet: any) => {
      const author = data.includes?.users?.find((u: any) => u.id === tweet.author_id);
      return {
        id: tweet.id,
        platform: 'twitter' as const,
        author: author?.username || 'unknown',
        content: tweet.text,
        timestamp: tweet.created_at,
        engagement: {
          likes: tweet.public_metrics?.like_count || 0,
          shares: tweet.public_metrics?.retweet_count || 0,
          comments: tweet.public_metrics?.reply_count || 0,
        },
        sentiment: analyzeSentiment(tweet.text),
        sentimentScore: calculateTextSentiment(tweet.text),
        url: `https://twitter.com/${author?.username}/status/${tweet.id}`,
      };
    });

    // Calculate overall sentiment
    const avgSentiment = tweets.reduce((sum: number, t: SocialPost) => sum + t.sentimentScore, 0) / tweets.length;
    const sentimentScore = Math.round(avgSentiment * 100);

    // Extract trending hashtags
    const hashtags = extractHashtags(tweets.map(t => t.content).join(' '));

    // Identify influencers (users with high follower count)
    const influencers = identifyInfluencers(tweets, data.includes?.users || []);

    // Calculate engagement rate
    const totalEngagement = tweets.reduce((sum: number, t: SocialPost) => 
      sum + t.engagement.likes + t.engagement.shares + t.engagement.comments, 0
    );
    const engagementRate = tweets.length > 0 ? totalEngagement / tweets.length : 0;

    const result = {
      symbol,
      mentions24h: tweets.length,
      sentiment: sentimentScore,
      topTweets: tweets.slice(0, 10),
      influencers,
      trendingHashtags: hashtags.slice(0, 10),
      engagementRate,
    };
    
    console.log(`✅ Twitter metrics complete: ${tweets.length} mentions, sentiment: ${sentimentScore}, ${influencers.length} influencers`);
    
    return result;
  } catch (error) {
    console.error('❌ Error fetching Twitter metrics:', error);
    if (error instanceof Error) {
      console.error(`❌ Twitter error details: ${error.message}`);
    }
    return null;
  }
}

// ============================================================================
// Reddit API Client
// ============================================================================

/**
 * Fetch Reddit metrics and sentiment for a cryptocurrency
 * Uses Reddit API to search posts and comments
 */
export async function fetchRedditMetrics(symbol: string): Promise<RedditMetrics | null> {
  try {
    // Reddit allows unauthenticated requests to public data
    const subreddits = ['cryptocurrency', 'CryptoMarkets', 'Bitcoin', 'ethereum', 'altcoin'];
    const searchQuery = symbol.toLowerCase();
    
    const allPosts: SocialPost[] = [];
    
    // Search each subreddit
    for (const subreddit of subreddits) {
      try {
        const response = await fetch(
          `https://www.reddit.com/r/${subreddit}/search.json?q=${searchQuery}&restrict_sr=1&sort=hot&limit=20&t=day`,
          {
            headers: {
              'User-Agent': 'UCIE/1.0',
              'Accept': 'application/json',
            },
            signal: AbortSignal.timeout(5000),
          }
        );

        if (!response.ok) continue;

        const data = await response.json();
        
        if (data.data?.children) {
          const posts = data.data.children.map((child: any) => {
            const post = child.data;
            return {
              id: post.id,
              platform: 'reddit' as const,
              author: post.author,
              content: post.title + ' ' + (post.selftext || ''),
              timestamp: new Date(post.created_utc * 1000).toISOString(),
              engagement: {
                likes: post.ups || 0,
                shares: 0,
                comments: post.num_comments || 0,
              },
              sentiment: analyzeSentiment(post.title + ' ' + (post.selftext || '')),
              sentimentScore: calculateTextSentiment(post.title + ' ' + (post.selftext || '')),
              url: `https://reddit.com${post.permalink}`,
            };
          });
          
          allPosts.push(...posts);
        }
      } catch (error) {
        console.warn(`Error fetching from r/${subreddit}:`, error);
      }
    }

    if (allPosts.length === 0) {
      return {
        symbol,
        mentions24h: 0,
        sentiment: 0,
        topPosts: [],
        activeSubreddits: [],
        subscribers: 0,
        postsPerDay: 0,
        commentsPerDay: 0,
      };
    }

    // Calculate overall sentiment
    const avgSentiment = allPosts.reduce((sum, p) => sum + p.sentimentScore, 0) / allPosts.length;
    const sentimentScore = Math.round(avgSentiment * 100);

    // Sort by engagement
    allPosts.sort((a, b) => 
      (b.engagement.likes + b.engagement.comments) - (a.engagement.likes + a.engagement.comments)
    );

    return {
      symbol,
      mentions24h: allPosts.length,
      sentiment: sentimentScore,
      topPosts: allPosts.slice(0, 10),
      activeSubreddits: subreddits,
      subscribers: 0, // Would need separate API call
      postsPerDay: allPosts.length,
      commentsPerDay: allPosts.reduce((sum, p) => sum + p.engagement.comments, 0),
    };
  } catch (error) {
    console.error('Error fetching Reddit metrics:', error);
    return null;
  }
}

// ============================================================================
// Sentiment Analysis Utilities
// ============================================================================

/**
 * Simple sentiment analysis based on keyword matching
 * Returns 'positive', 'neutral', or 'negative'
 */
function analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
  const lowerText = text.toLowerCase();
  
  const positiveKeywords = [
    'bullish', 'moon', 'pump', 'buy', 'long', 'hodl', 'gem', 'rocket',
    'breakout', 'rally', 'surge', 'gain', 'profit', 'win', 'success',
    'great', 'amazing', 'excellent', 'good', 'positive', 'up', 'rise'
  ];
  
  const negativeKeywords = [
    'bearish', 'dump', 'sell', 'short', 'crash', 'scam', 'rug',
    'loss', 'down', 'fall', 'drop', 'decline', 'bad', 'terrible',
    'awful', 'negative', 'warning', 'risk', 'danger', 'avoid'
  ];
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  positiveKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) positiveCount++;
  });
  
  negativeKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) negativeCount++;
  });
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

/**
 * Calculate sentiment score from -1 to 1
 */
function calculateTextSentiment(text: string): number {
  const sentiment = analyzeSentiment(text);
  
  if (sentiment === 'positive') return 0.7;
  if (sentiment === 'negative') return -0.7;
  return 0;
}

/**
 * Extract hashtags from text
 */
function extractHashtags(text: string): string[] {
  const hashtagRegex = /#(\w+)/g;
  const matches = text.match(hashtagRegex) || [];
  
  // Count frequency
  const hashtagCounts: Record<string, number> = {};
  matches.forEach(tag => {
    hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
  });
  
  // Sort by frequency
  return Object.entries(hashtagCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag);
}

/**
 * Identify influencers from tweet data
 */
function identifyInfluencers(tweets: SocialPost[], users: any[]): Influencer[] {
  const influencerMap: Record<string, any> = {};
  
  tweets.forEach(tweet => {
    const user = users.find(u => u.username === tweet.author);
    if (!user) return;
    
    const followers = user.public_metrics?.followers_count || 0;
    
    // Only consider users with 10k+ followers as influencers
    if (followers < 10000) return;
    
    if (!influencerMap[user.username]) {
      influencerMap[user.username] = {
        user,
        posts: [],
        totalSentiment: 0,
      };
    }
    
    influencerMap[user.username].posts.push(tweet);
    influencerMap[user.username].totalSentiment += tweet.sentimentScore;
  });
  
  return Object.entries(influencerMap)
    .map(([username, data]) => {
      const avgSentiment = data.totalSentiment / data.posts.length;
      const sentimentScore = Math.round(avgSentiment * 100);
      
      return {
        id: data.user.id,
        platform: 'twitter' as const,
        username: data.user.username,
        displayName: data.user.name,
        followers: data.user.public_metrics?.followers_count || 0,
        sentiment: sentimentScore > 20 ? 'bullish' : sentimentScore < -20 ? 'bearish' : 'neutral',
        sentimentScore,
        recentPosts: data.posts.slice(0, 5),
        impactScore: calculateImpactScore(data.user.public_metrics?.followers_count || 0, data.posts.length),
        profileUrl: `https://twitter.com/${data.user.username}`,
      };
    })
    .sort((a, b) => b.impactScore - a.impactScore)
    .slice(0, 10);
}

/**
 * Calculate influencer impact score (0-100)
 */
function calculateImpactScore(followers: number, postCount: number): number {
  // Normalize followers (log scale)
  const followerScore = Math.min(100, (Math.log10(followers) / Math.log10(10000000)) * 100);
  
  // Post frequency score
  const postScore = Math.min(100, postCount * 10);
  
  // Weighted average
  return Math.round(followerScore * 0.7 + postScore * 0.3);
}

// ============================================================================
// Aggregated Social Sentiment
// ============================================================================

/**
 * Fetch and aggregate social sentiment from all sources
 */
export async function fetchAggregatedSocialSentiment(symbol: string): Promise<{
  lunarCrush: LunarCrushData | null;
  twitter: TwitterMetrics | null;
  reddit: RedditMetrics | null;
}> {
  // ✅ REMOVED TWITTER: Twitter API is unreliable and causes timeouts
  // Only use LunarCrush (which aggregates Twitter data anyway) and Reddit
  const [lunarCrush, reddit] = await Promise.all([
    fetchLunarCrushData(symbol),
    fetchRedditMetrics(symbol),
  ]);
  
  const twitter = null; // Twitter disabled to prevent timeouts

  return {
    lunarCrush,
    twitter,
    reddit,
  };
}
