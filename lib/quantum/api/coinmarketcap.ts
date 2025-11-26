/**
 * CoinMarketCap API Client
 * Quantum BTC Super Spec - API Integration Layer
 * 
 * Primary market data source with rate limiting and retry logic
 */

interface CMCQuote {
  price: number;
  volume_24h: number;
  volume_change_24h: number;
  percent_change_1h: number;
  percent_change_24h: number;
  percent_change_7d: number;
  market_cap: number;
  market_cap_dominance: number;
  last_updated: string;
}

interface CMCResponse {
  data: {
    BTC: {
      id: number;
      name: string;
      symbol: string;
      quote: {
        USD: CMCQuote;
      };
    };
  };
  status: {
    timestamp: string;
    error_code: number;
    error_message: string | null;
  };
}

interface CMCMarketData {
  price: number;
  volume24h: number;
  marketCap: number;
  change1h: number;
  change24h: number;
  change7d: number;
  dominance: number;
  timestamp: string;
  source: 'coinmarketcap';
}

interface RateLimitState {
  requests: number[];
  limit: number;
  window: number;
}

class CoinMarketCapClient {
  private apiKey: string;
  private baseUrl = 'https://pro-api.coinmarketcap.com/v1';
  private rateLimit: RateLimitState = {
    requests: [],
    limit: 30, // 30 requests per minute for basic plan
    window: 60000, // 1 minute in milliseconds
  };

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.COINMARKETCAP_API_KEY || '';
    
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
        console.log(`⏳ Rate limit reached, waiting ${Math.ceil(waitTime / 1000)}s...`);
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
    // Check API key before making request
    if (!this.apiKey) {
      throw new Error('CoinMarketCap API key not configured');
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
            'X-CMC_PRO_API_KEY': this.apiKey,
            'Accept': 'application/json',
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `CMC API error: ${response.status} - ${errorData.status?.error_message || response.statusText}`
          );
        }
        
        const data = await response.json();
        
        // Check for API-level errors
        if (data.status?.error_code !== 0) {
          throw new Error(`CMC API error: ${data.status?.error_message || 'Unknown error'}`);
        }
        
        console.log(`✅ CMC API request successful (attempt ${attempt}/${retries})`);
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
        console.error(`❌ CMC API error (attempt ${attempt}/${retries}):`, error.message);
        
        if (attempt < retries) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error('CMC API request failed after retries');
  }

  /**
   * Get Bitcoin market data
   */
  async getBitcoinData(): Promise<CMCMarketData> {
    const response = await this.makeRequest<CMCResponse>(
      '/cryptocurrency/quotes/latest?symbol=BTC&convert=USD'
    );
    
    const btcData = response.data.BTC;
    const quote = btcData.quote.USD;
    
    return {
      price: quote.price,
      volume24h: quote.volume_24h,
      marketCap: quote.market_cap,
      change1h: quote.percent_change_1h,
      change24h: quote.percent_change_24h,
      change7d: quote.percent_change_7d,
      dominance: quote.market_cap_dominance,
      timestamp: quote.last_updated,
      source: 'coinmarketcap',
    };
  }

  /**
   * Get multiple attempts with fallback
   */
  async getBitcoinDataWithFallback(): Promise<CMCMarketData | null> {
    try {
      return await this.getBitcoinData();
    } catch (error) {
      console.error('❌ CMC API failed completely:', error);
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
export const coinMarketCapClient = new CoinMarketCapClient();

// Export types
export type { CMCMarketData, CMCQuote, CMCResponse };
