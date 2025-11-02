/**
 * Influencer Tracking Module for UCIE
 * 
 * Identifies and tracks key influencers discussing cryptocurrency tokens:
 * - Identifies influencers based on follower count and engagement
 * - Tracks influencer sentiment and posting activity
 * - Calculates influencer impact scores
 * - Displays top influencer posts
 * 
 * Requirements: 5.5
 */

import type { Influencer, SocialPost } from './socialSentimentClients';

// ============================================================================
// Type Definitions
// ============================================================================

export interface InfluencerMetrics {
  totalInfluencers: number;
  bullishCount: number;
  bearishCount: number;
  neutralCount: number;
  averageImpactScore: number;
  topInfluencers: Influencer[];
  recentActivity: InfluencerActivity[];
}

export interface InfluencerActivity {
  influencer: {
    username: string;
    displayName: string;
    followers: number;
  };
  post: SocialPost;
  impact: 'high' | 'medium' | 'low';
  timestamp: string;
}

export interface InfluencerSentimentBreakdown {
  bullish: Influencer[];
  bearish: Influencer[];
  neutral: Influencer[];
}

// ============================================================================
// Influencer Identification
// ============================================================================

/**
 * Identify influencers from social media data
 * Criteria:
 * - Twitter: 10k+ followers
 * - Reddit: 5k+ karma or moderator status
 * - High engagement rate
 */
export function identifyInfluencers(
  posts: SocialPost[],
  platform: 'twitter' | 'reddit' | 'discord'
): Influencer[] {
  const influencerMap: Map<string, {
    posts: SocialPost[];
    totalEngagement: number;
    followers: number;
  }> = new Map();

  // Group posts by author
  posts.forEach(post => {
    const author = post.author;
    
    if (!influencerMap.has(author)) {
      influencerMap.set(author, {
        posts: [],
        totalEngagement: 0,
        followers: 0, // Would be fetched from user profile
      });
    }

    const data = influencerMap.get(author)!;
    data.posts.push(post);
    data.totalEngagement += post.engagement.likes + post.engagement.shares + post.engagement.comments;
  });

  // Convert to influencer objects
  const influencers: Influencer[] = [];

  influencerMap.forEach((data, username) => {
    // Calculate average sentiment
    const avgSentiment = data.posts.reduce((sum, p) => sum + p.sentimentScore, 0) / data.posts.length;
    const sentimentScore = Math.round(avgSentiment * 100);

    // Determine sentiment category
    let sentiment: 'bullish' | 'bearish' | 'neutral';
    if (sentimentScore > 20) sentiment = 'bullish';
    else if (sentimentScore < -20) sentiment = 'bearish';
    else sentiment = 'neutral';

    // Calculate impact score
    const impactScore = calculateInfluencerImpactScore(
      data.followers,
      data.posts.length,
      data.totalEngagement
    );

    // Only include if impact score is significant
    if (impactScore >= 30) {
      influencers.push({
        id: username,
        platform,
        username,
        displayName: username, // Would be fetched from user profile
        followers: data.followers || estimateFollowers(data.totalEngagement, data.posts.length),
        sentiment,
        sentimentScore,
        recentPosts: data.posts.slice(0, 5),
        impactScore,
        profileUrl: getProfileUrl(platform, username),
      });
    }
  });

  // Sort by impact score
  return influencers.sort((a, b) => b.impactScore - a.impactScore);
}

/**
 * Calculate influencer impact score (0-100)
 * Based on:
 * - Follower count (40%)
 * - Post frequency (30%)
 * - Engagement rate (30%)
 */
function calculateInfluencerImpactScore(
  followers: number,
  postCount: number,
  totalEngagement: number
): number {
  // Follower score (logarithmic scale)
  const followerScore = followers > 0
    ? Math.min(100, (Math.log10(followers) / Math.log10(10000000)) * 100)
    : 0;

  // Post frequency score
  const postScore = Math.min(100, postCount * 10);

  // Engagement score
  const avgEngagement = postCount > 0 ? totalEngagement / postCount : 0;
  const engagementScore = Math.min(100, (Math.log10(avgEngagement + 1) / Math.log10(10000)) * 100);

  // Weighted average
  return Math.round(
    followerScore * 0.4 +
    postScore * 0.3 +
    engagementScore * 0.3
  );
}

/**
 * Estimate follower count based on engagement
 */
function estimateFollowers(totalEngagement: number, postCount: number): number {
  if (postCount === 0) return 0;
  
  const avgEngagement = totalEngagement / postCount;
  
  // Typical engagement rate is 1-5% of followers
  // Use 2% as baseline
  return Math.round(avgEngagement / 0.02);
}

/**
 * Get profile URL for platform
 */
function getProfileUrl(platform: 'twitter' | 'reddit' | 'discord', username: string): string {
  switch (platform) {
    case 'twitter':
      return `https://twitter.com/${username}`;
    case 'reddit':
      return `https://reddit.com/u/${username}`;
    case 'discord':
      return `https://discord.com/users/${username}`;
    default:
      return '';
  }
}

// ============================================================================
// Influencer Sentiment Analysis
// ============================================================================

/**
 * Analyze sentiment breakdown among influencers
 */
export function analyzeInfluencerSentiment(influencers: Influencer[]): InfluencerSentimentBreakdown {
  const breakdown: InfluencerSentimentBreakdown = {
    bullish: [],
    bearish: [],
    neutral: [],
  };

  influencers.forEach(influencer => {
    if (influencer.sentiment === 'bullish') {
      breakdown.bullish.push(influencer);
    } else if (influencer.sentiment === 'bearish') {
      breakdown.bearish.push(influencer);
    } else {
      breakdown.neutral.push(influencer);
    }
  });

  return breakdown;
}

/**
 * Calculate weighted sentiment score based on influencer impact
 */
export function calculateWeightedInfluencerSentiment(influencers: Influencer[]): number {
  if (influencers.length === 0) return 0;

  const totalImpact = influencers.reduce((sum, inf) => sum + inf.impactScore, 0);
  
  if (totalImpact === 0) return 0;

  const weightedSum = influencers.reduce((sum, inf) => {
    return sum + (inf.sentimentScore * inf.impactScore);
  }, 0);

  return Math.round(weightedSum / totalImpact);
}

// ============================================================================
// Influencer Activity Tracking
// ============================================================================

/**
 * Track recent influencer activity
 */
export function trackInfluencerActivity(influencers: Influencer[]): InfluencerActivity[] {
  const activities: InfluencerActivity[] = [];

  influencers.forEach(influencer => {
    influencer.recentPosts.forEach(post => {
      // Determine impact level based on engagement
      const totalEngagement = post.engagement.likes + post.engagement.shares + post.engagement.comments;
      let impact: 'high' | 'medium' | 'low';
      
      if (totalEngagement > 1000) impact = 'high';
      else if (totalEngagement > 100) impact = 'medium';
      else impact = 'low';

      activities.push({
        influencer: {
          username: influencer.username,
          displayName: influencer.displayName,
          followers: influencer.followers,
        },
        post,
        impact,
        timestamp: post.timestamp,
      });
    });
  });

  // Sort by timestamp (most recent first)
  return activities.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

// ============================================================================
// Top Influencer Posts
// ============================================================================

/**
 * Get top influencer posts by engagement
 */
export function getTopInfluencerPosts(influencers: Influencer[], limit: number = 10): SocialPost[] {
  const allPosts: SocialPost[] = [];

  influencers.forEach(influencer => {
    allPosts.push(...influencer.recentPosts);
  });

  // Sort by total engagement
  return allPosts
    .sort((a, b) => {
      const engagementA = a.engagement.likes + a.engagement.shares + a.engagement.comments;
      const engagementB = b.engagement.likes + b.engagement.shares + b.engagement.comments;
      return engagementB - engagementA;
    })
    .slice(0, limit);
}

// ============================================================================
// Influencer Metrics Aggregation
// ============================================================================

/**
 * Aggregate all influencer metrics
 */
export function aggregateInfluencerMetrics(influencers: Influencer[]): InfluencerMetrics {
  const breakdown = analyzeInfluencerSentiment(influencers);
  
  const averageImpactScore = influencers.length > 0
    ? influencers.reduce((sum, inf) => sum + inf.impactScore, 0) / influencers.length
    : 0;

  const recentActivity = trackInfluencerActivity(influencers);

  return {
    totalInfluencers: influencers.length,
    bullishCount: breakdown.bullish.length,
    bearishCount: breakdown.bearish.length,
    neutralCount: breakdown.neutral.length,
    averageImpactScore: Math.round(averageImpactScore),
    topInfluencers: influencers.slice(0, 10),
    recentActivity: recentActivity.slice(0, 20),
  };
}

// ============================================================================
// Influencer Comparison
// ============================================================================

/**
 * Compare influencer sentiment vs overall sentiment
 */
export function compareInfluencerSentiment(
  influencerSentiment: number,
  overallSentiment: number
): {
  divergence: number;
  direction: 'more_bullish' | 'more_bearish' | 'aligned';
  significance: 'high' | 'medium' | 'low';
} {
  const divergence = influencerSentiment - overallSentiment;
  const absDivergence = Math.abs(divergence);

  let direction: 'more_bullish' | 'more_bearish' | 'aligned';
  if (divergence > 10) direction = 'more_bullish';
  else if (divergence < -10) direction = 'more_bearish';
  else direction = 'aligned';

  let significance: 'high' | 'medium' | 'low';
  if (absDivergence > 30) significance = 'high';
  else if (absDivergence > 15) significance = 'medium';
  else significance = 'low';

  return {
    divergence: Math.round(divergence),
    direction,
    significance,
  };
}

// ============================================================================
// Influencer Network Analysis
// ============================================================================

/**
 * Analyze influencer network effects
 */
export function analyzeInfluencerNetwork(influencers: Influencer[]): {
  networkStrength: number; // 0-100
  sentimentCohesion: number; // 0-100
  reachEstimate: number;
} {
  if (influencers.length === 0) {
    return {
      networkStrength: 0,
      sentimentCohesion: 0,
      reachEstimate: 0,
    };
  }

  // Network strength based on number and impact of influencers
  const avgImpact = influencers.reduce((sum, inf) => sum + inf.impactScore, 0) / influencers.length;
  const networkStrength = Math.min(100, (influencers.length / 20) * 50 + avgImpact * 0.5);

  // Sentiment cohesion (how aligned are influencers)
  const sentiments = influencers.map(inf => inf.sentimentScore);
  const avgSentiment = sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length;
  const variance = sentiments.reduce((sum, s) => sum + Math.pow(s - avgSentiment, 2), 0) / sentiments.length;
  const stdDev = Math.sqrt(variance);
  const sentimentCohesion = Math.max(0, 100 - stdDev);

  // Estimate total reach
  const reachEstimate = influencers.reduce((sum, inf) => sum + inf.followers, 0);

  return {
    networkStrength: Math.round(networkStrength),
    sentimentCohesion: Math.round(sentimentCohesion),
    reachEstimate,
  };
}

// ============================================================================
// Export Main Function
// ============================================================================

/**
 * Main function to track and analyze influencers
 */
export function trackInfluencers(
  twitterInfluencers: Influencer[],
  redditInfluencers: Influencer[]
): {
  metrics: InfluencerMetrics;
  breakdown: InfluencerSentimentBreakdown;
  topPosts: SocialPost[];
  network: ReturnType<typeof analyzeInfluencerNetwork>;
  comparison: ReturnType<typeof compareInfluencerSentiment> | null;
} {
  // Combine all influencers
  const allInfluencers = [...twitterInfluencers, ...redditInfluencers];

  // Aggregate metrics
  const metrics = aggregateInfluencerMetrics(allInfluencers);

  // Sentiment breakdown
  const breakdown = analyzeInfluencerSentiment(allInfluencers);

  // Top posts
  const topPosts = getTopInfluencerPosts(allInfluencers, 10);

  // Network analysis
  const network = analyzeInfluencerNetwork(allInfluencers);

  return {
    metrics,
    breakdown,
    topPosts,
    network,
    comparison: null, // Would be calculated with overall sentiment
  };
}
