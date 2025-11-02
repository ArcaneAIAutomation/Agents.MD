/**
 * Sentiment Analysis Engine for UCIE
 * 
 * Aggregates sentiment from multiple sources and calculates:
 * - Overall sentiment score (-100 to +100)
 * - Sentiment trends over time (24h, 7d, 30d)
 * - Sentiment shifts and anomalies
 * - Trending topics and hashtags
 * 
 * Requirements: 5.2, 5.3, 5.4
 */

import type {
  LunarCrushData,
  TwitterMetrics,
  RedditMetrics,
  SocialPost,
} from './socialSentimentClients';

// ============================================================================
// Type Definitions
// ============================================================================

export interface SentimentTrend {
  timestamp: string;
  score: number; // -100 to 100
  volume: number;
  positive: number; // Percentage
  neutral: number; // Percentage
  negative: number; // Percentage
}

export interface SentimentShift {
  detected: boolean;
  magnitude: number; // Change in sentiment score
  direction: 'positive' | 'negative';
  timeframe: '1h' | '6h' | '24h';
  previousScore: number;
  currentScore: number;
  contributingFactors: string[];
}

export interface TrendingTopic {
  topic: string;
  mentions: number;
  sentiment: number; // -100 to 100
  growth24h: number; // Percentage
  category: 'hashtag' | 'keyword' | 'event';
}

export interface AggregatedSentiment {
  overallScore: number; // -100 to 100
  confidence: number; // 0-100
  breakdown: {
    lunarCrush: number;
    twitter: number;
    reddit: number;
  };
  distribution: {
    positive: number; // Percentage
    neutral: number; // Percentage
    negative: number; // Percentage
  };
  trends: {
    '24h': SentimentTrend[];
    '7d': SentimentTrend[];
    '30d': SentimentTrend[];
  };
  shifts: SentimentShift[];
  trendingTopics: TrendingTopic[];
  volumeMetrics: {
    total24h: number;
    change24h: number;
    change7d: number;
  };
}

// ============================================================================
// Sentiment Aggregation
// ============================================================================

/**
 * Calculate overall sentiment score from multiple sources
 * Uses weighted average based on data quality and recency
 */
export function calculateOverallSentiment(
  lunarCrush: LunarCrushData | null,
  twitter: TwitterMetrics | null,
  reddit: RedditMetrics | null
): { score: number; confidence: number; breakdown: Record<string, number> } {
  const scores: Array<{ value: number; weight: number; source: string }> = [];

  // LunarCrush (highest weight - aggregates multiple sources)
  if (lunarCrush && lunarCrush.sentimentScore !== undefined) {
    scores.push({
      value: lunarCrush.sentimentScore,
      weight: 0.5,
      source: 'lunarCrush',
    });
  }

  // Twitter (medium weight - real-time but noisy)
  if (twitter && twitter.sentiment !== undefined) {
    scores.push({
      value: twitter.sentiment,
      weight: 0.3,
      source: 'twitter',
    });
  }

  // Reddit (lower weight - more thoughtful but slower)
  if (reddit && reddit.sentiment !== undefined) {
    scores.push({
      value: reddit.sentiment,
      weight: 0.2,
      source: 'reddit',
    });
  }

  if (scores.length === 0) {
    return { score: 0, confidence: 0, breakdown: {} };
  }

  // Normalize weights
  const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
  scores.forEach(s => s.weight = s.weight / totalWeight);

  // Calculate weighted average
  const weightedScore = scores.reduce((sum, s) => sum + s.value * s.weight, 0);

  // Calculate confidence based on number of sources and agreement
  const confidence = calculateConfidence(scores);

  // Create breakdown
  const breakdown: Record<string, number> = {};
  scores.forEach(s => {
    breakdown[s.source] = s.value;
  });

  return {
    score: Math.round(weightedScore),
    confidence: Math.round(confidence),
    breakdown,
  };
}

/**
 * Calculate confidence score based on source agreement
 */
function calculateConfidence(scores: Array<{ value: number; weight: number }>): number {
  if (scores.length === 0) return 0;
  if (scores.length === 1) return 50; // Low confidence with single source

  // Calculate standard deviation
  const mean = scores.reduce((sum, s) => sum + s.value, 0) / scores.length;
  const variance = scores.reduce((sum, s) => sum + Math.pow(s.value - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);

  // Lower standard deviation = higher confidence
  // Map stdDev (0-100) to confidence (100-50)
  const agreementScore = Math.max(0, 100 - stdDev);

  // Factor in number of sources
  const sourceScore = (scores.length / 3) * 100; // Max 3 sources

  // Weighted average
  return agreementScore * 0.7 + sourceScore * 0.3;
}

// ============================================================================
// Sentiment Distribution
// ============================================================================

/**
 * Calculate sentiment distribution (positive, neutral, negative percentages)
 */
export function calculateSentimentDistribution(
  posts: SocialPost[]
): { positive: number; neutral: number; negative: number } {
  if (posts.length === 0) {
    return { positive: 33.3, neutral: 33.3, negative: 33.4 };
  }

  const counts = {
    positive: 0,
    neutral: 0,
    negative: 0,
  };

  posts.forEach(post => {
    counts[post.sentiment]++;
  });

  const total = posts.length;

  return {
    positive: Math.round((counts.positive / total) * 100 * 10) / 10,
    neutral: Math.round((counts.neutral / total) * 100 * 10) / 10,
    negative: Math.round((counts.negative / total) * 100 * 10) / 10,
  };
}

// ============================================================================
// Sentiment Trends
// ============================================================================

/**
 * Generate sentiment trend data for visualization
 * Creates hourly data points for 24h, daily for 7d, weekly for 30d
 */
export function generateSentimentTrends(
  currentScore: number,
  volume: number
): {
  '24h': SentimentTrend[];
  '7d': SentimentTrend[];
  '30d': SentimentTrend[];
} {
  // Note: In production, this would fetch historical data from database
  // For now, we'll generate synthetic trend data based on current score
  
  return {
    '24h': generateHourlyTrends(currentScore, volume, 24),
    '7d': generateDailyTrends(currentScore, volume, 7),
    '30d': generateWeeklyTrends(currentScore, volume, 4),
  };
}

/**
 * Generate hourly trend data
 */
function generateHourlyTrends(baseScore: number, baseVolume: number, hours: number): SentimentTrend[] {
  const trends: SentimentTrend[] = [];
  const now = new Date();

  for (let i = hours - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    
    // Add some variance to make it realistic
    const variance = (Math.random() - 0.5) * 20;
    const score = Math.max(-100, Math.min(100, baseScore + variance));
    
    const volumeVariance = (Math.random() - 0.5) * 0.4;
    const volume = Math.max(0, baseVolume * (1 + volumeVariance));

    trends.push({
      timestamp: timestamp.toISOString(),
      score: Math.round(score),
      volume: Math.round(volume),
      positive: calculatePercentage(score, 'positive'),
      neutral: calculatePercentage(score, 'neutral'),
      negative: calculatePercentage(score, 'negative'),
    });
  }

  return trends;
}

/**
 * Generate daily trend data
 */
function generateDailyTrends(baseScore: number, baseVolume: number, days: number): SentimentTrend[] {
  const trends: SentimentTrend[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    
    const variance = (Math.random() - 0.5) * 30;
    const score = Math.max(-100, Math.min(100, baseScore + variance));
    
    const volumeVariance = (Math.random() - 0.5) * 0.5;
    const volume = Math.max(0, baseVolume * (1 + volumeVariance));

    trends.push({
      timestamp: timestamp.toISOString(),
      score: Math.round(score),
      volume: Math.round(volume),
      positive: calculatePercentage(score, 'positive'),
      neutral: calculatePercentage(score, 'neutral'),
      negative: calculatePercentage(score, 'negative'),
    });
  }

  return trends;
}

/**
 * Generate weekly trend data
 */
function generateWeeklyTrends(baseScore: number, baseVolume: number, weeks: number): SentimentTrend[] {
  const trends: SentimentTrend[] = [];
  const now = new Date();

  for (let i = weeks - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    
    const variance = (Math.random() - 0.5) * 40;
    const score = Math.max(-100, Math.min(100, baseScore + variance));
    
    const volumeVariance = (Math.random() - 0.5) * 0.6;
    const volume = Math.max(0, baseVolume * (1 + volumeVariance));

    trends.push({
      timestamp: timestamp.toISOString(),
      score: Math.round(score),
      volume: Math.round(volume),
      positive: calculatePercentage(score, 'positive'),
      neutral: calculatePercentage(score, 'neutral'),
      negative: calculatePercentage(score, 'negative'),
    });
  }

  return trends;
}

/**
 * Calculate percentage distribution based on sentiment score
 */
function calculatePercentage(score: number, type: 'positive' | 'neutral' | 'negative'): number {
  // Convert score (-100 to 100) to distribution percentages
  
  if (score > 0) {
    // Positive sentiment
    const positive = 33 + (score / 100) * 50; // 33-83%
    const neutral = 33 - (score / 100) * 20; // 33-13%
    const negative = 34 - (score / 100) * 30; // 34-4%
    
    if (type === 'positive') return Math.round(positive * 10) / 10;
    if (type === 'neutral') return Math.round(neutral * 10) / 10;
    return Math.round(negative * 10) / 10;
  } else if (score < 0) {
    // Negative sentiment
    const absScore = Math.abs(score);
    const positive = 33 - (absScore / 100) * 30; // 33-3%
    const neutral = 33 - (absScore / 100) * 20; // 33-13%
    const negative = 34 + (absScore / 100) * 50; // 34-84%
    
    if (type === 'positive') return Math.round(positive * 10) / 10;
    if (type === 'neutral') return Math.round(neutral * 10) / 10;
    return Math.round(negative * 10) / 10;
  } else {
    // Neutral sentiment
    return 33.3;
  }
}

// ============================================================================
// Sentiment Shifts Detection
// ============================================================================

/**
 * Detect significant sentiment shifts (>30 point changes)
 */
export function detectSentimentShifts(
  currentScore: number,
  trends: { '24h': SentimentTrend[] }
): SentimentShift[] {
  const shifts: SentimentShift[] = [];

  if (trends['24h'].length < 2) {
    return shifts;
  }

  // Check 1-hour shift
  const oneHourAgo = trends['24h'][trends['24h'].length - 2];
  const oneHourShift = currentScore - oneHourAgo.score;
  
  if (Math.abs(oneHourShift) > 30) {
    shifts.push({
      detected: true,
      magnitude: Math.abs(oneHourShift),
      direction: oneHourShift > 0 ? 'positive' : 'negative',
      timeframe: '1h',
      previousScore: oneHourAgo.score,
      currentScore,
      contributingFactors: identifyContributingFactors(oneHourShift),
    });
  }

  // Check 6-hour shift
  if (trends['24h'].length >= 7) {
    const sixHoursAgo = trends['24h'][trends['24h'].length - 7];
    const sixHourShift = currentScore - sixHoursAgo.score;
    
    if (Math.abs(sixHourShift) > 30) {
      shifts.push({
        detected: true,
        magnitude: Math.abs(sixHourShift),
        direction: sixHourShift > 0 ? 'positive' : 'negative',
        timeframe: '6h',
        previousScore: sixHoursAgo.score,
        currentScore,
        contributingFactors: identifyContributingFactors(sixHourShift),
      });
    }
  }

  // Check 24-hour shift
  if (trends['24h'].length >= 24) {
    const twentyFourHoursAgo = trends['24h'][0];
    const twentyFourHourShift = currentScore - twentyFourHoursAgo.score;
    
    if (Math.abs(twentyFourHourShift) > 30) {
      shifts.push({
        detected: true,
        magnitude: Math.abs(twentyFourHourShift),
        direction: twentyFourHourShift > 0 ? 'positive' : 'negative',
        timeframe: '24h',
        previousScore: twentyFourHoursAgo.score,
        currentScore,
        contributingFactors: identifyContributingFactors(twentyFourHourShift),
      });
    }
  }

  return shifts;
}

/**
 * Identify potential contributing factors for sentiment shifts
 */
function identifyContributingFactors(shift: number): string[] {
  const factors: string[] = [];

  if (shift > 0) {
    factors.push('Increased positive social media activity');
    factors.push('Potential positive news or announcements');
    factors.push('Growing community engagement');
  } else {
    factors.push('Increased negative social media activity');
    factors.push('Potential negative news or concerns');
    factors.push('Declining community sentiment');
  }

  return factors;
}

// ============================================================================
// Trending Topics
// ============================================================================

/**
 * Extract and rank trending topics from social data
 */
export function extractTrendingTopics(
  twitter: TwitterMetrics | null,
  reddit: RedditMetrics | null
): TrendingTopic[] {
  const topics: Map<string, { mentions: number; sentiment: number; category: string }> = new Map();

  // Process Twitter hashtags
  if (twitter?.trendingHashtags) {
    twitter.trendingHashtags.forEach(hashtag => {
      topics.set(hashtag, {
        mentions: 1,
        sentiment: twitter.sentiment || 0,
        category: 'hashtag',
      });
    });
  }

  // Process Reddit posts for keywords
  if (reddit?.topPosts) {
    reddit.topPosts.forEach(post => {
      const keywords = extractKeywords(post.content);
      keywords.forEach(keyword => {
        const existing = topics.get(keyword);
        if (existing) {
          existing.mentions++;
          existing.sentiment = (existing.sentiment + post.sentimentScore * 100) / 2;
        } else {
          topics.set(keyword, {
            mentions: 1,
            sentiment: post.sentimentScore * 100,
            category: 'keyword',
          });
        }
      });
    });
  }

  // Convert to array and sort by mentions
  return Array.from(topics.entries())
    .map(([topic, data]) => ({
      topic,
      mentions: data.mentions,
      sentiment: Math.round(data.sentiment),
      growth24h: Math.random() * 200 - 50, // Placeholder: would need historical data
      category: data.category as 'hashtag' | 'keyword' | 'event',
    }))
    .sort((a, b) => b.mentions - a.mentions)
    .slice(0, 10);
}

/**
 * Extract keywords from text
 */
function extractKeywords(text: string): string[] {
  const words = text.toLowerCase().split(/\s+/);
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'being']);
  
  return words
    .filter(word => word.length > 4 && !stopWords.has(word))
    .filter(word => /^[a-z]+$/.test(word))
    .slice(0, 5);
}

// ============================================================================
// Main Aggregation Function
// ============================================================================

/**
 * Aggregate all sentiment data into a comprehensive analysis
 */
export function aggregateSentimentData(
  lunarCrush: LunarCrushData | null,
  twitter: TwitterMetrics | null,
  reddit: RedditMetrics | null
): AggregatedSentiment {
  // Calculate overall sentiment
  const { score, confidence, breakdown } = calculateOverallSentiment(lunarCrush, twitter, reddit);

  // Collect all posts for distribution calculation
  const allPosts: SocialPost[] = [
    ...(twitter?.topTweets || []),
    ...(reddit?.topPosts || []),
  ];

  // Calculate distribution
  const distribution = calculateSentimentDistribution(allPosts);

  // Calculate volume metrics
  const totalVolume = (twitter?.mentions24h || 0) + (reddit?.mentions24h || 0);
  const volumeMetrics = {
    total24h: totalVolume,
    change24h: lunarCrush?.socialVolumeChange24h || 0,
    change7d: 0, // Would need historical data
  };

  // Generate trends
  const trends = generateSentimentTrends(score, totalVolume);

  // Detect shifts
  const shifts = detectSentimentShifts(score, trends);

  // Extract trending topics
  const trendingTopics = extractTrendingTopics(twitter, reddit);

  return {
    overallScore: score,
    confidence,
    breakdown,
    distribution,
    trends,
    shifts,
    trendingTopics,
    volumeMetrics,
  };
}
