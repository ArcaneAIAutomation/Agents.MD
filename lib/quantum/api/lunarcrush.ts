/**
 * LunarCrush API Client
 * Quantum BTC Super Spec - API Integration Layer
 * 
 * Social sentiment and influence data
 */

interface LunarCrushAssetResponse {
  data: {
    id: string;
    symbol: string;
    name: string;
    price: number;
    price_btc: number;
    volume_24h: number;
    market_cap: number;
    percent_change_24h: number;
    galaxy_score: number;
    alt_rank: number;
    social_score: number;
    social_volume: number;
    social_dominance: number;
    sentiment: number;
    sentiment_absolute: number;
    sentiment_relative: number;
    interactions_24h: number;
    social_contributors: number;
    social_volume_global: number;
    news: number;
    spam: number;
    categories: string[];
    timeSeries: Array<{
      time: number;
      close: number;
      galaxy_score: number;
      social_volume: number;
      sentiment: number;
    }>;
  };
  status: {
    code: number;
    message: string;
  };
}

interface LunarCrushInfluencerResponse {
  data: Array<{
    id: string;
    name: string;
    screen_name: string;
    followers: number;
    influencer_score: number;
    posts_24h: number;
    engagement_24h: number;
    sentiment: number;
  }>;
  status: {
    code: number;
    message: string;
  };
}

interface LunarCrushSentimentData {
  galaxyScore: number;
  altRank: number;
  socialScore: number;
  socialVolume: number;
  socialDominance: number;
  sentiment: number;
  sentimentAbsolute: number;
  sentimentRelative: number;
  interactions24h: number;
  contributors: number;
  news: number;
  spam: number;
  timestamp: string;
  source: 'lunarcrush';
}

interface InfluencerData {
  name: string;
  screenName: string;
  followers: number;
  influencerScore: number;
  posts24h: number;
  engagement24h: number;
  sentiment: number;
}

interface RateLimitState {
  requests: number[];
  limit: number;
  window: number;
}

class LunarCrushClient {
  private apiKey: string;
  private baseUrl = 'https://lunarcrush.com/api4/public';
  private rateLimit: RateLimitState = {
    requests: [],
    limit: 50, // 50 requests per minute for basic plan
    window: 60000, // 1 minute in milliseconds
  };

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.LUNARCRUSH_API_KEY || '';
    
    // Only throw error when actually making requests, not during initialization
    // This allows tests to import the module without API keys
  }

  /**
   * Check if we're within rate limits
   */
  private checkRateLimit(): boolean {
    const now = Date.now();
    
    // Remove requests outside the current window
    this.rateLimit.requests = this.rateLimit.requests.filter(
      timestamp => now - timestamp < this.rateLimit.window
    );
    
    return this.rateLimit.requests.length < this.rateLimit.limit;
  }

  /**
   * Wait until rate limit allows next request
   */
  private async waitForRateLimit(): Promise<void> {
    while (!this.checkRateLimit()) {
      const oldestRequest = this.rateLimit.requests[0];
      const waitTime = this.rateLimit.window - (Date.now() - oldestRequest);
      
      if (waitTime > 0) {
        console.log(`⏳ LunarCrush rate limit reached, waiting ${Math.ceil(waitTime / 1000)}s...`);
        await new Promise(resolve => setTimeout(resolve, waitTime + 100));
      }
    }
    
    // Record this request
    this.rateLimit.requests.push(Date.now());
  }

  /**
   * Make API request with retry logic and exponential backoff
   */
  private async makeRequest<T>(
    endpoint: string,
    retries = 3,
    timeout = 15000
  ): Promise<T> {
    // Check API key before making request
    if (!this.apiKey) {
      throw new Error('LunarCrush API key not configured');
    }
    
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        // Wait for rate limit
        await this.waitForRateLimit();
        
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Accept': 'application/json',
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `LunarCrush API error: ${response.status} - ${errorData.status?.message || response.statusText}`
          );
        }
        
        const data = await response.json();
        
        // Check for API-level errors
        if (data.status?.code !== 200) {
          throw new Error(`LunarCrush API error: ${data.status?.message || 'Unknown error'}`);
        }
        
        console.log(`✅ LunarCrush API request successful (attempt ${attempt}/${retries})`);
        return data as T;
        
      } catch (error: any) {
        lastError = error;
        
        // Don't retry on certain errors
        if (
          error.message.includes('401') || // Unauthorized
          error.message.includes('403') || // Forbidden
          error.message.includes('Invalid API key')
        ) {
          throw error;
        }
        
        // Log error and retry
        console.error(`❌ LunarCrush API error (attempt ${attempt}/${retries}):`, error.message);
        
        if (attempt < retries) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error('LunarCrush API request failed after retries');
  }

  /**
   * Get Bitcoin sentiment data
   */
  async getBitcoinSentiment(): Promise<LunarCrushSentimentData> {
    const response = await this.makeRequest<LunarCrushAssetResponse>(
      '/coins/btc/v1'
    );
    
    const data = response.data;
    
    return {
      galaxyScore: data.galaxy_score,
      altRank: data.alt_rank,
      socialScore: data.social_score,
      socialVolume: data.social_volume,
      socialDominance: data.social_dominance,
      sentiment: data.sentiment,
      sentimentAbsolute: data.sentiment_absolute,
      sentimentRelative: data.sentiment_relative,
      interactions24h: data.interactions_24h,
      contributors: data.social_contributors,
      news: data.news,
      spam: data.spam,
      timestamp: new Date().toISOString(),
      source: 'lunarcrush',
    };
  }

  /**
   * Get Bitcoin influencers
   */
  async getBitcoinInfluencers(limit: number = 10): Promise<InfluencerData[]> {
    const response = await this.makeRequest<LunarCrushInfluencerResponse>(
      `/coins/btc/influencers/v1?limit=${limit}`
    );
    
    return response.data.map(influencer => ({
      name: influencer.name,
      screenName: influencer.screen_name,
      followers: influencer.followers,
      influencerScore: influencer.influencer_score,
      posts24h: influencer.posts_24h,
      engagement24h: influencer.engagement_24h,
      sentiment: influencer.sentiment,
    }));
  }

  /**
   * Get comprehensive sentiment data with influencers
   */
  async getComprehensiveSentiment(): Promise<{
    sentiment: LunarCrushSentimentData;
    influencers: InfluencerData[];
  }> {
    const [sentiment, influencers] = await Promise.all([
      this.getBitcoinSentiment(),
      this.getBitcoinInfluencers(10),
    ]);
    
    return { sentiment, influencers };
  }

  /**
   * Get sentiment with fallback
   */
  async getBitcoinSentimentWithFallback(): Promise<LunarCrushSentimentData | null> {
    try {
      return await this.getBitcoinSentiment();
    } catch (error) {
      console.error('❌ LunarCrush API failed completely:', error);
      return null;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    latency: number | null;
    error: string | null;
  }> {
    const startTime = Date.now();
    
    try {
      await this.getBitcoinSentiment();
      return {
        healthy: true,
        latency: Date.now() - startTime,
        error: null,
      };
    } catch (error: any) {
      return {
        healthy: false,
        latency: Date.now() - startTime,
        error: error.message,
      };
    }
  }
}

// Export singleton instance
export const lunarCrushClient = new LunarCrushClient();

// Export types
export type {
  LunarCrushSentimentData,
  InfluencerData,
  LunarCrushAssetResponse,
  LunarCrushInfluencerResponse,
};
