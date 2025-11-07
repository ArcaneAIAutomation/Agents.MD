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
  // Extended data (optional, CoinGecko specific)
  extended?: {
    // DEX data
    dexVolume24h?: number;
    topDEXes?: string[];
    // Community data
    communityData?: {
      twitterFollowers: number;
      redditSubscribers: number;
      telegramUsers: number;
      facebookLikes: number;
    };
    // Developer data
    developerData?: {
      githubStars: number;
      githubForks: number;
      githubSubscribers: number;
      commits4Weeks: number;
      pullRequests: number;
      contributors: number;
    };
    // Additional metrics
    athPrice?: number;
    athDate?: string | null;
    atlPrice?: number;
    atlDate?: string | null;
    marketCapRank?: number;
    fullyDilutedValuation?: number;
    // Categories
    categories?: string[];
    // Platform info
    platform?: Record<string, string>;
    contractAddress?: string | null;
  };
}

/**
 * CoinGecko API Client
 * Primary market data source with comprehensive coverage
 * 
 * STRENGTHS (Free Demo API):
 * - DEX tokens (Uniswap, PancakeSwap, SushiSwap, etc.)
 * - DeFi protocols and metrics
 * - Community data (social media, Reddit, Telegram)
 * - Developer activity (GitHub commits, stars, forks)
 * - Market data across 600+ exchanges
 * - Historical data (OHLC, market cap)
 * - Trending coins and categories
 * - Global DeFi data
 * - NFT data
 * - Exchange rates for 50+ fiat currencies
 * 
 * FREE API LIMITS:
 * - 30 calls/minute (Demo plan)
 * - 10,000 calls/month
 * - No API key required (but recommended for higher limits)
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

  /**
   * Get comprehensive market data including DEX tokens
   * Includes: price, volume, market cap, supply, community, developer data
   */
  async getMarketData(symbol: string): Promise<MarketData> {
    const coinId = await this.symbolToCoinId(symbol);
    const data = await this.fetch(`/coins/${coinId}?localization=false&tickers=true&market_data=true&community_data=true&developer_data=true&sparkline=false`);
    
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
      // Extended data (CoinGecko specific)
      extended: {
        // DEX data
        dexVolume24h: this.calculateDEXVolume(data.tickers),
        topDEXes: this.getTopDEXes(data.tickers),
        
        // Community data
        communityData: {
          twitterFollowers: data.community_data?.twitter_followers || 0,
          redditSubscribers: data.community_data?.reddit_subscribers || 0,
          telegramUsers: data.community_data?.telegram_channel_user_count || 0,
          facebookLikes: data.community_data?.facebook_likes || 0,
        },
        
        // Developer data
        developerData: {
          githubStars: data.developer_data?.stars || 0,
          githubForks: data.developer_data?.forks || 0,
          githubSubscribers: data.developer_data?.subscribers || 0,
          commits4Weeks: data.developer_data?.commit_count_4_weeks || 0,
          pullRequests: data.developer_data?.pull_requests_merged || 0,
          contributors: data.developer_data?.pull_request_contributors || 0,
        },
        
        // Additional metrics
        athPrice: data.market_data.ath?.usd || 0,
        athDate: data.market_data.ath_date?.usd || null,
        atlPrice: data.market_data.atl?.usd || 0,
        atlDate: data.market_data.atl_date?.usd || null,
        marketCapRank: data.market_cap_rank || 0,
        fullyDilutedValuation: data.market_data.fully_diluted_valuation?.usd || 0,
        
        // Categories (DeFi, DEX, etc.)
        categories: data.categories || [],
        
        // Platform info (for tokens)
        platform: data.platforms || {},
        contractAddress: data.contract_address || null,
      }
    };
  }

  /**
   * Get simple price data (faster, uses less API quota)
   */
  async getPrice(symbol: string): Promise<PriceData> {
    const coinId = await this.symbolToCoinId(symbol);
    const data = await this.fetch(`/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true&include_market_cap=true`);
    
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

  /**
   * Get DEX-specific data for a token
   * Returns trading pairs, volumes, and prices across DEXes
   */
  async getDEXData(symbol: string): Promise<any> {
    const coinId = await this.symbolToCoinId(symbol);
    const data = await this.fetch(`/coins/${coinId}/tickers?include_exchange_logo=false&depth=true`);
    
    const dexTickers = data.tickers.filter((ticker: any) => 
      this.isDEX(ticker.market?.name || ticker.market?.identifier)
    );
    
    return {
      symbol: symbol.toUpperCase(),
      dexes: dexTickers.map((ticker: any) => ({
        dex: ticker.market.name,
        pair: ticker.base + '/' + ticker.target,
        price: ticker.last,
        volume24h: ticker.volume,
        volumeUSD: ticker.converted_volume?.usd || 0,
        spread: ticker.bid_ask_spread_percentage,
        trustScore: ticker.trust_score,
        lastTraded: ticker.last_traded_at,
      })),
      totalDEXVolume: dexTickers.reduce((sum: number, t: any) => 
        sum + (t.converted_volume?.usd || 0), 0
      ),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get trending coins (includes many DEX tokens)
   */
  async getTrendingCoins(): Promise<any> {
    const data = await this.fetch('/search/trending');
    return {
      coins: data.coins.map((item: any) => ({
        id: item.item.id,
        symbol: item.item.symbol,
        name: item.item.name,
        marketCapRank: item.item.market_cap_rank,
        priceUSD: item.item.price_btc * 50000, // Approximate
        score: item.item.score,
      })),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get global DeFi data
   */
  async getGlobalDeFiData(): Promise<any> {
    const data = await this.fetch('/global/decentralized_finance_defi');
    return {
      defiMarketCap: data.data.defi_market_cap,
      ethMarketCap: data.data.eth_market_cap,
      defiToEthRatio: data.data.defi_to_eth_ratio,
      tradingVolume24h: data.data.trading_volume_24h,
      defiDominance: data.data.defi_dominance,
      topCoinDefiDominance: data.data.top_coin_defi_dominance,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Search for coins by name or symbol (great for finding DEX tokens)
   */
  async searchCoins(query: string): Promise<any> {
    const data = await this.fetch(`/search?query=${encodeURIComponent(query)}`);
    return {
      coins: data.coins.map((coin: any) => ({
        id: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        marketCapRank: coin.market_cap_rank,
        thumb: coin.thumb,
      })),
      exchanges: data.exchanges,
      categories: data.categories,
    };
  }

  /**
   * Calculate total DEX volume from tickers
   */
  private calculateDEXVolume(tickers: any[]): number {
    if (!tickers) return 0;
    
    return tickers
      .filter(ticker => this.isDEX(ticker.market?.name || ticker.market?.identifier))
      .reduce((sum, ticker) => sum + (ticker.converted_volume?.usd || 0), 0);
  }

  /**
   * Get top DEXes by volume
   */
  private getTopDEXes(tickers: any[]): string[] {
    if (!tickers) return [];
    
    const dexVolumes = new Map<string, number>();
    
    tickers
      .filter(ticker => this.isDEX(ticker.market?.name || ticker.market?.identifier))
      .forEach(ticker => {
        const dex = ticker.market.name;
        const volume = ticker.converted_volume?.usd || 0;
        dexVolumes.set(dex, (dexVolumes.get(dex) || 0) + volume);
      });
    
    return Array.from(dexVolumes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([dex]) => dex);
  }

  /**
   * Check if exchange is a DEX
   */
  private isDEX(exchangeName: string): boolean {
    const dexKeywords = [
      'uniswap', 'pancakeswap', 'sushiswap', 'curve', 'balancer',
      'dex', 'swap', '1inch', 'kyber', 'bancor', 'quickswap',
      'trader joe', 'spookyswap', 'spiritswap', 'raydium', 'orca',
      'serum', 'jupiter', 'osmosis', 'astroport', 'terraswap'
    ];
    
    const lowerName = exchangeName.toLowerCase();
    return dexKeywords.some(keyword => lowerName.includes(keyword));
  }

  /**
   * Convert symbol to CoinGecko coin ID
   * Uses search API for unknown symbols (great for DEX tokens)
   */
  private async symbolToCoinId(symbol: string): Promise<string> {
    // Common mappings for speed
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
      'MATIC': 'matic-network',
      'DOT': 'polkadot',
      'AVAX': 'avalanche-2',
      'LINK': 'chainlink',
      'UNI': 'uniswap',
      'AAVE': 'aave',
      'SUSHI': 'sushi',
      'CAKE': 'pancakeswap-token',
      'CRV': 'curve-dao-token',
    };
    
    const upperSymbol = symbol.toUpperCase();
    
    // Return if we have a mapping
    if (mapping[upperSymbol]) {
      return mapping[upperSymbol];
    }
    
    // For unknown symbols (likely DEX tokens), search CoinGecko
    try {
      const searchResults = await this.searchCoins(symbol);
      if (searchResults.coins.length > 0) {
        // Return the first match (usually most relevant)
        return searchResults.coins[0].id;
      }
    } catch (error) {
      console.warn(`Failed to search for ${symbol}, using lowercase as fallback`);
    }
    
    // Fallback to lowercase symbol
    return symbol.toLowerCase();
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
