/**
 * Kraken API Client
 * Quantum BTC Super Spec - API Integration Layer
 * 
 * Exchange-level data with orderbook and liquidity harmonics
 */

interface KrakenTickerResponse {
  error: string[];
  result: {
    XXBTZUSD: {
      a: [string, string, string]; // ask [price, whole lot volume, lot volume]
      b: [string, string, string]; // bid [price, whole lot volume, lot volume]
      c: [string, string]; // last trade closed [price, lot volume]
      v: [string, string]; // volume [today, last 24 hours]
      p: [string, string]; // volume weighted average price [today, last 24 hours]
      t: [number, number]; // number of trades [today, last 24 hours]
      l: [string, string]; // low [today, last 24 hours]
      h: [string, string]; // high [today, last 24 hours]
      o: string; // today's opening price
    };
  };
}

interface KrakenOrderBookResponse {
  error: string[];
  result: {
    XXBTZUSD: {
      asks: [string, string, number][]; // [price, volume, timestamp]
      bids: [string, string, number][]; // [price, volume, timestamp]
    };
  };
}

interface OrderBookLevel {
  price: number;
  volume: number;
  total: number;
  timestamp: number;
}

interface LiquidityHarmonics {
  bidLiquidity: number;
  askLiquidity: number;
  imbalance: number; // -1 to 1, negative = sell pressure, positive = buy pressure
  spread: number;
  spreadPercent: number;
  depth: {
    bid1Percent: number; // Liquidity within 1% of mid price
    ask1Percent: number;
    bid5Percent: number; // Liquidity within 5% of mid price
    ask5Percent: number;
  };
  strongestBid: OrderBookLevel;
  strongestAsk: OrderBookLevel;
}

interface KrakenMarketData {
  price: number;
  bid: number;
  ask: number;
  volume24h: number;
  vwap24h: number;
  trades24h: number;
  low24h: number;
  high24h: number;
  open: number;
  timestamp: string;
  source: 'kraken';
}

interface RateLimitState {
  requests: number[];
  limit: number;
  window: number;
}

class KrakenClient {
  private baseUrl = 'https://api.kraken.com/0/public';
  private rateLimit: RateLimitState = {
    requests: [],
    limit: 15, // 15 requests per second for public endpoints
    window: 1000, // 1 second in milliseconds
  };

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
        await new Promise(resolve => setTimeout(resolve, waitTime + 10));
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
        
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Kraken API error: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Check for API-level errors
        if (data.error && data.error.length > 0) {
          throw new Error(`Kraken API error: ${data.error.join(', ')}`);
        }
        
        console.log(`✅ Kraken API request successful (attempt ${attempt}/${retries})`);
        return data as T;
        
      } catch (error: any) {
        lastError = error;
        
        // Log error and retry
        console.error(`❌ Kraken API error (attempt ${attempt}/${retries}):`, error.message);
        
        if (attempt < retries) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error('Kraken API request failed after retries');
  }

  /**
   * Get Bitcoin ticker data
   */
  async getBitcoinTicker(): Promise<KrakenMarketData> {
    const response = await this.makeRequest<KrakenTickerResponse>(
      '/Ticker?pair=XBTUSD'
    );
    
    const ticker = response.result.XXBTZUSD;
    
    return {
      price: parseFloat(ticker.c[0]),
      bid: parseFloat(ticker.b[0]),
      ask: parseFloat(ticker.a[0]),
      volume24h: parseFloat(ticker.v[1]),
      vwap24h: parseFloat(ticker.p[1]),
      trades24h: ticker.t[1],
      low24h: parseFloat(ticker.l[1]),
      high24h: parseFloat(ticker.h[1]),
      open: parseFloat(ticker.o),
      timestamp: new Date().toISOString(),
      source: 'kraken',
    };
  }

  /**
   * Get Bitcoin orderbook data
   */
  async getBitcoinOrderBook(depth: number = 100): Promise<{
    bids: OrderBookLevel[];
    asks: OrderBookLevel[];
    timestamp: string;
  }> {
    const response = await this.makeRequest<KrakenOrderBookResponse>(
      `/Depth?pair=XBTUSD&count=${depth}`
    );
    
    const orderBook = response.result.XXBTZUSD;
    
    const bids = orderBook.bids.map(([price, volume, timestamp]) => ({
      price: parseFloat(price),
      volume: parseFloat(volume),
      total: parseFloat(price) * parseFloat(volume),
      timestamp,
    }));
    
    const asks = orderBook.asks.map(([price, volume, timestamp]) => ({
      price: parseFloat(price),
      volume: parseFloat(volume),
      total: parseFloat(price) * parseFloat(volume),
      timestamp,
    }));
    
    return {
      bids,
      asks,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Calculate liquidity harmonics from orderbook
   */
  async calculateLiquidityHarmonics(): Promise<LiquidityHarmonics> {
    const orderBook = await this.getBitcoinOrderBook(100);
    
    // Calculate mid price
    const bestBid = orderBook.bids[0].price;
    const bestAsk = orderBook.asks[0].price;
    const midPrice = (bestBid + bestAsk) / 2;
    
    // Calculate spread
    const spread = bestAsk - bestBid;
    const spreadPercent = (spread / midPrice) * 100;
    
    // Calculate total liquidity
    const bidLiquidity = orderBook.bids.reduce((sum, level) => sum + level.total, 0);
    const askLiquidity = orderBook.asks.reduce((sum, level) => sum + level.total, 0);
    
    // Calculate imbalance (-1 to 1)
    const totalLiquidity = bidLiquidity + askLiquidity;
    const imbalance = (bidLiquidity - askLiquidity) / totalLiquidity;
    
    // Calculate depth at different price levels
    const price1PercentUp = midPrice * 1.01;
    const price1PercentDown = midPrice * 0.99;
    const price5PercentUp = midPrice * 1.05;
    const price5PercentDown = midPrice * 0.95;
    
    const bid1Percent = orderBook.bids
      .filter(level => level.price >= price1PercentDown)
      .reduce((sum, level) => sum + level.total, 0);
    
    const ask1Percent = orderBook.asks
      .filter(level => level.price <= price1PercentUp)
      .reduce((sum, level) => sum + level.total, 0);
    
    const bid5Percent = orderBook.bids
      .filter(level => level.price >= price5PercentDown)
      .reduce((sum, level) => sum + level.total, 0);
    
    const ask5Percent = orderBook.asks
      .filter(level => level.price <= price5PercentUp)
      .reduce((sum, level) => sum + level.total, 0);
    
    // Find strongest levels
    const strongestBid = orderBook.bids.reduce((max, level) => 
      level.volume > max.volume ? level : max
    );
    
    const strongestAsk = orderBook.asks.reduce((max, level) => 
      level.volume > max.volume ? level : max
    );
    
    return {
      bidLiquidity,
      askLiquidity,
      imbalance,
      spread,
      spreadPercent,
      depth: {
        bid1Percent,
        ask1Percent,
        bid5Percent,
        ask5Percent,
      },
      strongestBid,
      strongestAsk,
    };
  }

  /**
   * Get comprehensive Bitcoin data with liquidity analysis
   */
  async getComprehensiveBitcoinData(): Promise<{
    ticker: KrakenMarketData;
    liquidity: LiquidityHarmonics;
  }> {
    const [ticker, liquidity] = await Promise.all([
      this.getBitcoinTicker(),
      this.calculateLiquidityHarmonics(),
    ]);
    
    return { ticker, liquidity };
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
      await this.getBitcoinTicker();
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
export const krakenClient = new KrakenClient();

// Export types
export type {
  KrakenMarketData,
  OrderBookLevel,
  LiquidityHarmonics,
  KrakenTickerResponse,
  KrakenOrderBookResponse,
};
