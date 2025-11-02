/**
 * Market Data API Clients for UCIE
 * 
 * This module provides API clients for fetching cryptocurrency market data
 * from multiple exchanges and data providers with rate limiting and error handling.
 * 
 * Supported Sources:
 * - CoinGecko: Primary market data source
 * - CoinMarketCap: Secondary source with fallback
 * - Binance: Real-time prices and order book
 * - Kraken: Order book data and trading pairs
 * - Coinbase: Additional price coverage
 */

// Rate limiter utility
class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async checkLimit(): Promise<void> {
    const now = Date.now();
    // Remove requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.checkLimit();
    }
    
    this.requests.push(now);
  }
}

// Rate limiters for each API
const coinGeckoLimiter = new RateLimiter(50, 60000); // 50 calls per minute
const coinMarketCapLimiter = new RateLimiter(30, 60000); // 30 calls per minute (conservative)
const binanceLimiter = new RateLimiter(1200, 60000); // 1200 calls per minute
const krakenLimiter = new RateLimiter(15, 1000); // 15 calls per second
const coinbaseLimiter = new RateLimiter(10, 1000); // 10 calls per second

// Type definitions
export interface PriceData {
  symbol: string;
  price: number;
  volume24h: number;
  change24h: number;
  timestamp: string;
  source: string;
}

export interface OrderBookData {
  symbol: string;
  bids: [number, number][]; // [price, quantity]
  asks: [number, number][]; // [price, quantity]
  timestamp: string;
  source: string;
}

export interface MarketData {
  symbol: string;
  price: number;
  volume24h: number;
  marketCap: number;
  circulatingSupply: number;
  totalSupply: number;
  change24h: number;
  change7d: number;
  high24h: number;
  low24h: number;
  timestamp: string;
  source: string;
}

/**
 * CoinGecko API Client
 * Primary market data source with comprehensive coverage
 */
export class CoinGeckoClient {
  private baseUrl = 'https://api.coingecko.com/api/v3';
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  private async fetch(endpoint: string): Promise<any> {
    await coinGeckoLimiter.checkLimit();
    
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Accept': 'application/json',
    };
    
    if (this.apiKey) {
      headers['x-cg-pro-api-key'] = this.apiKey;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        headers,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('CoinGecko API timeout');
      }
      throw error;
    }
  }

  async getMarketData(symbol: string): Promise<MarketData> {
    const coinId = this.symbolToCoinId(symbol);
    const data = await this.fetch(`/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`);
    
    return {
      symbol: symbol.toUpperCase(),
      price: data.market_data.current_price.usd,
      volume24h: data.market_data.total_volume.usd,
      marketCap: data.market_data.market_cap.usd,
      circulatingSupply: data.market_data.circulating_supply,
      totalSupply: data.market_data.total_supply || 0,
      change24h: data.market_data.price_change_percentage_24h,
      change7d: data.market_data.price_change_percentage_7d,
      high24h: data.market_data.high_24h.usd,
      low24h: data.market_data.low_24h.usd,
      timestamp: new Date().toISOString(),
      source: 'coingecko',
    };
  }

  async getPrice(symbol: string): Promise<PriceData> {
    const coinId = this.symbolToCoinId(symbol);
    const data = await this.fetch(`/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true`);
    
    const coinData = data[coinId];
    return {
      symbol: symbol.toUpperCase(),
      price: coinData.usd,
      volume24h: coinData.usd_24h_vol,
      change24h: coinData.usd_24h_change,
      timestamp: new Date().toISOString(),
      source: 'coingecko',
    };
  }

  private symbolToCoinId(symbol: string): string {
    const mapping: Record<string, string> = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'USDT': 'tether',
      'BNB': 'binancecoin',
      'SOL': 'solana',
      'XRP': 'ripple',
      'USDC': 'usd-coin',
      'ADA': 'cardano',
      'DOGE': 'dogecoin',
      'TRX': 'tron',
    };
    return mapping[symbol.toUpperCase()] || symbol.toLowerCase();
  }
}

/**
 * CoinMarketCap API Client
 * Secondary market data source with fallback capability
 */
export class CoinMarketCapClient {
  private baseUrl = 'https://pro-api.coinmarketcap.com/v1';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async fetch(endpoint: string): Promise<any> {
    await coinMarketCapLimiter.checkLimit();
    
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        headers: {
          'X-CMC_PRO_API_KEY': this.apiKey,
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`CoinMarketCap API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('CoinMarketCap API timeout');
      }
      throw error;
    }
  }

  async getMarketData(symbol: string): Promise<MarketData> {
    const data = await this.fetch(`/cryptocurrency/quotes/latest?symbol=${symbol.toUpperCase()}`);
    const coinData = data[symbol.toUpperCase()];
    const quote = coinData.quote.USD;
    
    return {
      symbol: symbol.toUpperCase(),
      price: quote.price,
      volume24h: quote.volume_24h,
      marketCap: quote.market_cap,
      circulatingSupply: coinData.circulating_supply,
      totalSupply: coinData.total_supply || 0,
      change24h: quote.percent_change_24h,
      change7d: quote.percent_change_7d,
      high24h: 0, // Not provided by CMC
      low24h: 0, // Not provided by CMC
      timestamp: new Date().toISOString(),
      source: 'coinmarketcap',
    };
  }

  async getPrice(symbol: string): Promise<PriceData> {
    const data = await this.fetch(`/cryptocurrency/quotes/latest?symbol=${symbol.toUpperCase()}`);
    const coinData = data[symbol.toUpperCase()];
    const quote = coinData.quote.USD;
    
    return {
      symbol: symbol.toUpperCase(),
      price: quote.price,
      volume24h: quote.volume_24h,
      change24h: quote.percent_change_24h,
      timestamp: new Date().toISOString(),
      source: 'coinmarketcap',
    };
  }
}

/**
 * Binance API Client
 * Real-time prices and order book data
 */
export class BinanceClient {
  private baseUrl = 'https://api.binance.com/api/v3';

  private async fetch(endpoint: string): Promise<any> {
    await binanceLimiter.checkLimit();
    
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Binance API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Binance API timeout');
      }
      throw error;
    }
  }

  async getPrice(symbol: string): Promise<PriceData> {
    const pair = `${symbol.toUpperCase()}USDT`;
    const ticker = await this.fetch(`/ticker/24hr?symbol=${pair}`);
    
    return {
      symbol: symbol.toUpperCase(),
      price: parseFloat(ticker.lastPrice),
      volume24h: parseFloat(ticker.quoteVolume),
      change24h: parseFloat(ticker.priceChangePercent),
      timestamp: new Date().toISOString(),
      source: 'binance',
    };
  }

  async getOrderBook(symbol: string, limit: number = 100): Promise<OrderBookData> {
    const pair = `${symbol.toUpperCase()}USDT`;
    const data = await this.fetch(`/depth?symbol=${pair}&limit=${limit}`);
    
    return {
      symbol: symbol.toUpperCase(),
      bids: data.bids.map((b: string[]) => [parseFloat(b[0]), parseFloat(b[1])]),
      asks: data.asks.map((a: string[]) => [parseFloat(a[0]), parseFloat(a[1])]),
      timestamp: new Date().toISOString(),
      source: 'binance',
    };
  }
}

/**
 * Kraken API Client
 * Order book data and trading pairs
 */
export class KrakenClient {
  private baseUrl = 'https://api.kraken.com/0/public';

  private async fetch(endpoint: string): Promise<any> {
    await krakenLimiter.checkLimit();
    
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Kraken API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error && data.error.length > 0) {
        throw new Error(`Kraken API error: ${data.error.join(', ')}`);
      }

      return data.result;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Kraken API timeout');
      }
      throw error;
    }
  }

  async getPrice(symbol: string): Promise<PriceData> {
    const pair = this.symbolToPair(symbol);
    const data = await this.fetch(`/Ticker?pair=${pair}`);
    const ticker = data[Object.keys(data)[0]];
    
    return {
      symbol: symbol.toUpperCase(),
      price: parseFloat(ticker.c[0]),
      volume24h: parseFloat(ticker.v[1]) * parseFloat(ticker.c[0]),
      change24h: ((parseFloat(ticker.c[0]) - parseFloat(ticker.o)) / parseFloat(ticker.o)) * 100,
      timestamp: new Date().toISOString(),
      source: 'kraken',
    };
  }

  async getOrderBook(symbol: string, count: number = 100): Promise<OrderBookData> {
    const pair = this.symbolToPair(symbol);
    const data = await this.fetch(`/Depth?pair=${pair}&count=${count}`);
    const book = data[Object.keys(data)[0]];
    
    return {
      symbol: symbol.toUpperCase(),
      bids: book.bids.map((b: string[]) => [parseFloat(b[0]), parseFloat(b[1])]),
      asks: book.asks.map((a: string[]) => [parseFloat(a[0]), parseFloat(a[1])]),
      timestamp: new Date().toISOString(),
      source: 'kraken',
    };
  }

  private symbolToPair(symbol: string): string {
    const mapping: Record<string, string> = {
      'BTC': 'XXBTZUSD',
      'ETH': 'XETHZUSD',
      'SOL': 'SOLUSD',
      'XRP': 'XXRPZUSD',
      'ADA': 'ADAUSD',
      'DOGE': 'XDGUSD',
    };
    return mapping[symbol.toUpperCase()] || `${symbol.toUpperCase()}USD`;
  }
}

/**
 * Coinbase API Client
 * Additional price coverage
 */
export class CoinbaseClient {
  private baseUrl = 'https://api.coinbase.com/v2';

  private async fetch(endpoint: string): Promise<any> {
    await coinbaseLimiter.checkLimit();
    
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Coinbase API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Coinbase API timeout');
      }
      throw error;
    }
  }

  async getPrice(symbol: string): Promise<PriceData> {
    const pair = `${symbol.toUpperCase()}-USD`;
    const spotData = await this.fetch(`/prices/${pair}/spot`);
    
    // Coinbase doesn't provide volume and change in spot price endpoint
    // We'll need to make additional calls or use default values
    return {
      symbol: symbol.toUpperCase(),
      price: parseFloat(spotData.amount),
      volume24h: 0, // Not available in this endpoint
      change24h: 0, // Not available in this endpoint
      timestamp: new Date().toISOString(),
      source: 'coinbase',
    };
  }
}

// Export singleton instances
export const coinGeckoClient = new CoinGeckoClient(process.env.COINGECKO_API_KEY);
export const coinMarketCapClient = new CoinMarketCapClient(process.env.COINMARKETCAP_API_KEY || '');
export const binanceClient = new BinanceClient();
export const krakenClient = new KrakenClient();
export const coinbaseClient = new CoinbaseClient();
