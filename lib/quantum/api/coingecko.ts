/**
 * CoinGecko API Client
 * Quantum BTC Super Spec - API Integration Layer
 * 
 * Fallback market data source with rate limiting
 */

interface CoinGeckoResponse {
  bitcoin: {
    usd: number;
    usd_market_cap: number;
    usd_24h_vol: number;
    usd_24h_change: number;
    last_updated_at: number;
  };
}

interface CoinGeckoMarketData {
  price: number;
  volume24h: number;
  marketCap: number;
  change24h: number;
  timestamp: string;
  source: 'coingecko';
}

interface RateLimitState {
  requests: number[];
  limit: number;
  window: number;
}

class CoinGeckoClient {
  private apiKey: string | null;
  private baseUrl = 'https://api.coingecko.com/api/v3';
  private proBaseUrl = 'https://pro-api.coingecko.com/api/v3';
  private rateLimit: RateLimitState = {
    requests: [],
    limit: 50, // 50 requests per minute for free tier
    window: 60000, // 1 minute in milliseconds
  };

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.COINGECKO_API_KEY || null;
    
    // If API key is provided, use pro endpoint with higher rate limits
    if (this.apiKey) {
      this.rateLimit.limit = 500; // 500 requests per minute for pro
    }
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
        console.log(`⏳ CoinGecko rate limit reached, waiting ${Math.ceil(waitTime / 1000)}s...`);
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
    timeout = 10000
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        // Wait for rate limit
        await this.waitForRateLimit();
        
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        // Use pro endpoint if API key is available
        const baseUrl = this.apiKey ? this.proBaseUrl : this.baseUrl;
        
        const headers: HeadersInit = {
          'Accept': 'application/json',
        };
        
        // Add API key header if available
        if (this.apiKey) {
          headers['x-cg-pro-api-key'] = this.apiKey;
        }
        
        const response = await fetch(`${baseUrl}${endpoint}`, {
          method: 'GET',
          headers,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `CoinGecko API error: ${response.status} - ${errorData.error || response.statusText}`
          );
        }
        
        const data = await response.json();
        
        console.log(`✅ CoinGecko API request successful (attempt ${attempt}/${retries})`);
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
        console.error(`❌ CoinGecko API error (attempt ${attempt}/${retries}):`, error.message);
        
        if (attempt < retries) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error('CoinGecko API request failed after retries');
  }

  /**
   * Get Bitcoin market data
   */
  async getBitcoinData(): Promise<CoinGeckoMarketData> {
    const response = await this.makeRequest<CoinGeckoResponse>(
      '/simple/price?ids=bitcoin&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true'
    );
    
    const btcData = response.bitcoin;
    
    return {
      price: btcData.usd,
      volume24h: btcData.usd_24h_vol,
      marketCap: btcData.usd_market_cap,
      change24h: btcData.usd_24h_change,
      timestamp: new Date(btcData.last_updated_at * 1000).toISOString(),
      source: 'coingecko',
    };
  }

  /**
   * Get Bitcoin data with fallback
   */
  async getBitcoinDataWithFallback(): Promise<CoinGeckoMarketData | null> {
    try {
      return await this.getBitcoinData();
    } catch (error) {
      console.error('❌ CoinGecko API failed completely:', error);
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
      await this.getBitcoinData();
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
export const coinGeckoClient = new CoinGeckoClient();

// Export types
export type { CoinGeckoMarketData, CoinGeckoResponse };
