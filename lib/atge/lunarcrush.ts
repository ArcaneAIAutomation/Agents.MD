/**
 * LunarCrush MCP Integration for ATGE
 * Bitcoin Sovereign Technology - AI Trade Generation Engine
 * 
 * This module provides wrapper functions for LunarCrush MCP tools
 * to fetch comprehensive social intelligence data for BITCOIN ONLY.
 * 
 * FOCUS: Bitcoin (BTC) analytics exclusively
 */

// Import MCP tools (these will be available through Kiro's MCP integration)
declare function mcp_LunarCrush_Topic(params: { topic: string }): Promise<any>;
declare function mcp_LunarCrush_Topic_Time_Series(params: {
  topic: string;
  interval?: string;
  metrics?: string[];
}): Promise<any>;
declare function mcp_LunarCrush_Topic_Posts(params: {
  topic: string;
  interval?: string;
  from_date?: string;
  to_date?: string;
}): Promise<any>;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface LunarCrushTopicData {
  // Core Metrics
  galaxyScore: number; // 0-100, overall health metric
  altRank: number; // 1-4000+, market position ranking
  socialDominance: number; // 0-100%, percentage of total crypto social volume
  
  // Sentiment
  sentiment: {
    score: number; // -100 to 100
    positive: number; // 0-100%
    negative: number; // 0-100%
    neutral: number; // 0-100%
  };
  
  // Social Volume (24h)
  socialVolume: {
    total: number;
    posts: number;
    interactions: number;
    contributors: number;
  };
  
  // Correlation
  correlationScore: number; // -1 to 1, social vs price correlation
  
  // Price Data
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  
  // Metadata
  symbol: string;
  name: string;
  lastUpdated: Date;
}

export interface LunarCrushTimeSeriesData {
  timestamps: Date[];
  galaxyScores: number[];
  altRanks: number[];
  sentimentScores: number[];
  socialVolumes: number[];
  prices: number[];
}

export interface LunarCrushPost {
  id: string;
  text: string;
  author: string;
  authorFollowers: number;
  engagement: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  timestamp: Date;
  url: string;
}

export interface LunarCrushAnalysis {
  // Current State
  currentMetrics: LunarCrushTopicData;
  
  // Trends (7-day)
  trends: {
    galaxyScoreTrend: 'increasing' | 'decreasing' | 'stable';
    sentimentTrend: 'bullish' | 'bearish' | 'neutral';
    socialVolumeTrend: 'increasing' | 'decreasing' | 'stable';
    momentumScore: number; // 0-100
  };
  
  // Signals
  signals: {
    socialDivergence: boolean; // Social up + price down = bullish
    sentimentShift: boolean; // >20% sentiment change
    volumeSpike: boolean; // >50% volume increase
    correlationBreakdown: boolean; // Correlation drops significantly
  };
  
  // Top Posts
  topPosts: LunarCrushPost[];
  
  // AI Context
  aiContext: string; // Formatted text for AI prompt
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  
  const age = Date.now() - entry.timestamp;
  if (age > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  
  return entry.data;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Get comprehensive LunarCrush data for Bitcoin only
 * @param symbol - Must be 'BTC' (Bitcoin only)
 */
export async function getLunarCrushData(symbol: string): Promise<LunarCrushTopicData> {
  // BITCOIN ONLY - Reject other symbols
  if (symbol.toUpperCase() !== 'BTC') {
    throw new Error('LunarCrush integration is Bitcoin-only. Use symbol "BTC".');
  }
  
  const cacheKey = `topic:${symbol}`;
  const cached = getCached<LunarCrushTopicData>(cacheKey);
  if (cached) return cached;
  
  try {
    // Fetch Bitcoin data from LunarCrush MCP
    const data = await mcp_LunarCrush_Topic({ topic: 'bitcoin' });
    
    // Format response
    const formatted: LunarCrushTopicData = {
      galaxyScore: data.galaxy_score || 0,
      altRank: data.alt_rank || 0,
      socialDominance: data.social_dominance || 0,
      sentiment: {
        score: data.sentiment?.score || 0,
        positive: data.sentiment?.positive || 0,
        negative: data.sentiment?.negative || 0,
        neutral: data.sentiment?.neutral || 0
      },
      socialVolume: {
        total: data.social_volume?.total || 0,
        posts: data.social_volume?.posts || 0,
        interactions: data.social_volume?.interactions || 0,
        contributors: data.social_volume?.contributors || 0
      },
      correlationScore: data.correlation_score || 0,
      price: data.price || 0,
      priceChange24h: data.price_change_24h || 0,
      volume24h: data.volume_24h || 0,
      marketCap: data.market_cap || 0,
      symbol: data.symbol || symbol,
      name: data.name || topic,
      lastUpdated: new Date()
    };
    
    setCache(cacheKey, formatted);
    return formatted;
  } catch (error) {
    console.error('[LunarCrush] Error fetching topic data:', error);
    throw new Error(`Failed to fetch LunarCrush data for ${symbol}`);
  }
}

/**
 * Get time series data for Bitcoin trend analysis
 * @param symbol - Must be 'BTC' (Bitcoin only)
 */
export async function getLunarCrushTimeSeries(
  symbol: string,
  interval: '1w' | '1m' | '3m' = '1w'
): Promise<LunarCrushTimeSeriesData> {
  // BITCOIN ONLY - Reject other symbols
  if (symbol.toUpperCase() !== 'BTC') {
    throw new Error('LunarCrush integration is Bitcoin-only. Use symbol "BTC".');
  }
  
  const cacheKey = `timeseries:${symbol}:${interval}`;
  const cached = getCached<LunarCrushTimeSeriesData>(cacheKey);
  if (cached) return cached;
  
  try {
    // Fetch Bitcoin time series from LunarCrush MCP
    const data = await mcp_LunarCrush_Topic_Time_Series({
      topic: 'bitcoin',
      interval,
      metrics: ['galaxy_score', 'alt_rank', 'sentiment', 'social_volume', 'close']
    });
    
    // Format response
    const formatted: LunarCrushTimeSeriesData = {
      timestamps: data.timestamps?.map((t: string) => new Date(t)) || [],
      galaxyScores: data.galaxy_scores || [],
      altRanks: data.alt_ranks || [],
      sentimentScores: data.sentiment_scores || [],
      socialVolumes: data.social_volumes || [],
      prices: data.prices || []
    };
    
    setCache(cacheKey, formatted);
    return formatted;
  } catch (error) {
    console.error('[LunarCrush] Error fetching time series:', error);
    throw new Error(`Failed to fetch LunarCrush time series for ${symbol}`);
  }
}

/**
 * Get top influential Bitcoin posts
 * @param symbol - Must be 'BTC' (Bitcoin only)
 */
export async function getLunarCrushPosts(
  symbol: string,
  interval: '1d' | '1w' = '1d'
): Promise<LunarCrushPost[]> {
  // BITCOIN ONLY - Reject other symbols
  if (symbol.toUpperCase() !== 'BTC') {
    throw new Error('LunarCrush integration is Bitcoin-only. Use symbol "BTC".');
  }
  
  const cacheKey = `posts:${symbol}:${interval}`;
  const cached = getCached<LunarCrushPost[]>(cacheKey);
  if (cached) return cached;
  
  try {
    // Fetch Bitcoin posts from LunarCrush MCP
    const data = await mcp_LunarCrush_Topic_Posts({
      topic: 'bitcoin',
      interval
    });
    
    // Format response
    const formatted: LunarCrushPost[] = (data.posts || []).slice(0, 5).map((post: any) => ({
      id: post.id || '',
      text: post.text || '',
      author: post.author || '',
      authorFollowers: post.author_followers || 0,
      engagement: post.engagement || 0,
      sentiment: post.sentiment || 'neutral',
      timestamp: new Date(post.timestamp),
      url: post.url || ''
    }));
    
    setCache(cacheKey, formatted);
    return formatted;
  } catch (error) {
    console.error('[LunarCrush] Error fetching posts:', error);
    return []; // Return empty array on error
  }
}

/**
 * Get comprehensive Bitcoin analysis with trends and signals
 * @param symbol - Must be 'BTC' (Bitcoin only)
 */
export async function getLunarCrushAnalysis(symbol: string): Promise<LunarCrushAnalysis> {
  // BITCOIN ONLY - Reject other symbols
  if (symbol.toUpperCase() !== 'BTC') {
    throw new Error('LunarCrush integration is Bitcoin-only. Use symbol "BTC".');
  }
  
  try {
    // Fetch all Bitcoin data in parallel
    const [currentMetrics, timeSeries, topPosts] = await Promise.all([
      getLunarCrushData(symbol),
      getLunarCrushTimeSeries(symbol, '1w'),
      getLunarCrushPosts(symbol, '1d')
    ]);
    
    // Analyze trends
    const trends = analyzeTrends(timeSeries);
    
    // Detect signals
    const signals = detectSignals(currentMetrics, timeSeries);
    
    // Generate AI context
    const aiContext = formatAIContext(currentMetrics, trends, signals, topPosts);
    
    return {
      currentMetrics,
      trends,
      signals,
      topPosts,
      aiContext
    };
  } catch (error) {
    console.error('[LunarCrush] Error in comprehensive analysis:', error);
    throw error;
  }
}

// ============================================================================
// ANALYSIS FUNCTIONS
// ============================================================================

function analyzeTrends(timeSeries: LunarCrushTimeSeriesData) {
  const recentData = timeSeries.galaxyScores.slice(-7); // Last 7 data points
  
  // Calculate trends
  const galaxyScoreTrend = calculateTrend(recentData);
  const sentimentTrend = calculateSentimentTrend(timeSeries.sentimentScores.slice(-7));
  const socialVolumeTrend = calculateTrend(timeSeries.socialVolumes.slice(-7));
  
  // Calculate momentum score (0-100)
  const momentumScore = calculateMomentumScore(timeSeries);
  
  return {
    galaxyScoreTrend,
    sentimentTrend,
    socialVolumeTrend,
    momentumScore
  };
}

function detectSignals(
  current: LunarCrushTopicData,
  timeSeries: LunarCrushTimeSeriesData
) {
  const recentPrices = timeSeries.prices.slice(-7);
  const recentSocial = timeSeries.socialVolumes.slice(-7);
  
  // Social divergence: Social up + price down = bullish
  const socialTrend = calculateTrend(recentSocial);
  const priceTrend = calculateTrend(recentPrices);
  const socialDivergence = socialTrend === 'increasing' && priceTrend === 'decreasing';
  
  // Sentiment shift: >20% change in sentiment
  const sentimentShift = Math.abs(current.sentiment.positive - 50) > 20;
  
  // Volume spike: >50% increase
  const avgVolume = recentSocial.reduce((a, b) => a + b, 0) / recentSocial.length;
  const volumeSpike = current.socialVolume.total > avgVolume * 1.5;
  
  // Correlation breakdown
  const correlationBreakdown = Math.abs(current.correlationScore) < 0.3;
  
  return {
    socialDivergence,
    sentimentShift,
    volumeSpike,
    correlationBreakdown
  };
}

function formatAIContext(
  metrics: LunarCrushTopicData,
  trends: any,
  signals: any,
  posts: LunarCrushPost[]
): string {
  const topPost = posts[0];
  
  return `
**Social Intelligence (LunarCrush)**:
- Galaxy Score: ${metrics.galaxyScore}/100 (Overall health) - ${trends.galaxyScoreTrend}
- AltRank: #${metrics.altRank} (Market position)
- Social Dominance: ${metrics.socialDominance.toFixed(2)}% (Market attention)
- Sentiment: ${metrics.sentiment.positive.toFixed(1)}% positive, ${metrics.sentiment.negative.toFixed(1)}% negative
- 24h Social Volume: ${metrics.socialVolume.posts} posts, ${metrics.socialVolume.interactions} interactions
- Correlation Score: ${metrics.correlationScore.toFixed(2)} (Social-price correlation)
${topPost ? `- Top Post: "${topPost.text.substring(0, 100)}..." (${topPost.engagement} engagement)` : ''}

**Social Analysis**:
- Social momentum: ${trends.momentumScore}/100 (${trends.socialVolumeTrend})
- Sentiment trend: ${trends.sentimentTrend}
- Community engagement: ${metrics.socialVolume.contributors} active contributors
${signals.socialDivergence ? '- ⚠️ SOCIAL DIVERGENCE DETECTED: Social up + price down = potential bullish reversal' : ''}
${signals.sentimentShift ? '- ⚠️ SENTIMENT SHIFT: Significant sentiment change detected' : ''}
${signals.volumeSpike ? '- ⚠️ VOLUME SPIKE: Social activity increased >50%' : ''}

**Weight social signals at 30-40% of your trade decision.**
`.trim();
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateTrend(data: number[]): 'increasing' | 'decreasing' | 'stable' {
  if (data.length < 2) return 'stable';
  
  const first = data.slice(0, Math.floor(data.length / 2));
  const second = data.slice(Math.floor(data.length / 2));
  
  const firstAvg = first.reduce((a, b) => a + b, 0) / first.length;
  const secondAvg = second.reduce((a, b) => a + b, 0) / second.length;
  
  const change = ((secondAvg - firstAvg) / firstAvg) * 100;
  
  if (change > 5) return 'increasing';
  if (change < -5) return 'decreasing';
  return 'stable';
}

function calculateSentimentTrend(data: number[]): 'bullish' | 'bearish' | 'neutral' {
  const trend = calculateTrend(data);
  if (trend === 'increasing') return 'bullish';
  if (trend === 'decreasing') return 'bearish';
  return 'neutral';
}

function calculateMomentumScore(timeSeries: LunarCrushTimeSeriesData): number {
  // Combine multiple factors into momentum score (0-100)
  const galaxyTrend = calculateTrend(timeSeries.galaxyScores.slice(-7));
  const volumeTrend = calculateTrend(timeSeries.socialVolumes.slice(-7));
  const sentimentTrend = calculateSentimentTrend(timeSeries.sentimentScores.slice(-7));
  
  let score = 50; // Base score
  
  if (galaxyTrend === 'increasing') score += 15;
  if (galaxyTrend === 'decreasing') score -= 15;
  
  if (volumeTrend === 'increasing') score += 15;
  if (volumeTrend === 'decreasing') score -= 15;
  
  if (sentimentTrend === 'bullish') score += 20;
  if (sentimentTrend === 'bearish') score -= 20;
  
  return Math.max(0, Math.min(100, score));
}

// ============================================================================
// EXPORT
// ============================================================================

export default {
  getLunarCrushData,
  getLunarCrushTimeSeries,
  getLunarCrushPosts,
  getLunarCrushAnalysis
};
