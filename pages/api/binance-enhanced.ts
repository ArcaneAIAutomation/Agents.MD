import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

// Enhanced Binance API integration with authenticated endpoints
class BinanceEnhancedAPI {
  private apiKey: string;
  private secretKey: string;
  private baseUrl = 'https://api.binance.com';

  constructor() {
    this.apiKey = process.env.BINANCE_API_KEY || '';
    this.secretKey = process.env.BINANCE_SECRET_KEY || '';
  }

  // Create signature for authenticated requests
  private createSignature(queryString: string): string {
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(queryString)
      .digest('hex');
  }

  // Make authenticated request to Binance API
  private async makeAuthenticatedRequest(endpoint: string, params: Record<string, any> = {}) {
    const timestamp = Date.now();
    const queryParams = new URLSearchParams({
      ...params,
      timestamp: timestamp.toString()
    });

    const signature = this.createSignature(queryParams.toString());
    queryParams.append('signature', signature);

    const url = `${this.baseUrl}${endpoint}?${queryParams.toString()}`;
    
    const response = await fetch(url, {
      headers: {
        'X-MBX-APIKEY': this.apiKey,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Get account information (balances, permissions)
  async getAccountInfo() {
    return this.makeAuthenticatedRequest('/api/v3/account');
  }

  // Get trading fees for symbols
  async getTradingFees(symbols?: string[]) {
    const params = symbols ? { symbols: JSON.stringify(symbols) } : {};
    return this.makeAuthenticatedRequest('/api/v3/tradeFee', params);
  }

  // Get order book depth with enhanced analysis
  async getEnhancedOrderBook(symbol: string, limit = 1000) {
    const response = await fetch(`${this.baseUrl}/api/v3/depth?symbol=${symbol}&limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch order book');
    
    const data = await response.json();
    
    // Enhanced order book analysis
    const analysis = this.analyzeOrderBook(data);
    
    return {
      ...data,
      analysis
    };
  }

  // Advanced order book analysis
  private analyzeOrderBook(orderBook: any) {
    const bids = orderBook.bids.map((bid: string[]) => ({
      price: parseFloat(bid[0]),
      quantity: parseFloat(bid[1]),
      total: parseFloat(bid[0]) * parseFloat(bid[1])
    }));

    const asks = orderBook.asks.map((ask: string[]) => ({
      price: parseFloat(ask[0]),
      quantity: parseFloat(ask[1]),
      total: parseFloat(ask[0]) * parseFloat(ask[1])
    }));

    // Calculate key metrics
    const bidVolume = bids.reduce((sum, bid) => sum + bid.total, 0);
    const askVolume = asks.reduce((sum, ask) => sum + ask.total, 0);
    const spread = asks[0].price - bids[0].price;
    const spreadPercent = (spread / bids[0].price) * 100;

    // Find significant walls (large orders)
    const significantThreshold = Math.max(bidVolume, askVolume) * 0.05; // 5% of total volume
    const bidWalls = bids.filter(bid => bid.total > significantThreshold);
    const askWalls = asks.filter(ask => ask.total > significantThreshold);

    // Calculate order book imbalance
    const imbalance = (bidVolume - askVolume) / (bidVolume + askVolume);

    return {
      spread: {
        absolute: spread,
        percentage: spreadPercent
      },
      volume: {
        bids: bidVolume,
        asks: askVolume,
        total: bidVolume + askVolume,
        imbalance: imbalance
      },
      walls: {
        bidWalls: bidWalls.slice(0, 5), // Top 5 bid walls
        askWalls: askWalls.slice(0, 5), // Top 5 ask walls
        bidWallCount: bidWalls.length,
        askWallCount: askWalls.length
      },
      liquidity: {
        depth1Percent: this.calculateDepthAtPercent(bids, asks, 0.01), // 1% depth
        depth5Percent: this.calculateDepthAtPercent(bids, asks, 0.05)  // 5% depth
      }
    };
  }

  // Calculate market depth at specific percentage from mid price
  private calculateDepthAtPercent(bids: any[], asks: any[], percent: number) {
    const midPrice = (bids[0].price + asks[0].price) / 2;
    const lowerBound = midPrice * (1 - percent);
    const upperBound = midPrice * (1 + percent);

    const bidDepth = bids
      .filter(bid => bid.price >= lowerBound)
      .reduce((sum, bid) => sum + bid.total, 0);

    const askDepth = asks
      .filter(ask => ask.price <= upperBound)
      .reduce((sum, ask) => sum + ask.total, 0);

    return {
      bidDepth,
      askDepth,
      totalDepth: bidDepth + askDepth
    };
  }

  // Get comprehensive market data for a symbol
  async getComprehensiveMarketData(symbol: string) {
    try {
      const [ticker24hr, orderBook, klines] = await Promise.all([
        fetch(`${this.baseUrl}/api/v3/ticker/24hr?symbol=${symbol}`).then(r => r.json()),
        this.getEnhancedOrderBook(symbol, 500),
        fetch(`${this.baseUrl}/api/v3/klines?symbol=${symbol}&interval=1h&limit=24`).then(r => r.json())
      ]);

      // Calculate additional metrics
      const priceHistory = klines.map((k: any[]) => parseFloat(k[4])); // Close prices
      const volumes = klines.map((k: any[]) => parseFloat(k[5])); // Volumes
      
      const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
      const volatility = this.calculateVolatility(priceHistory);

      return {
        symbol,
        price: {
          current: parseFloat(ticker24hr.lastPrice),
          change24h: parseFloat(ticker24hr.priceChangePercent),
          high24h: parseFloat(ticker24hr.highPrice),
          low24h: parseFloat(ticker24hr.lowPrice),
          volume24h: parseFloat(ticker24hr.volume),
          quoteVolume24h: parseFloat(ticker24hr.quoteVolume)
        },
        orderBook: orderBook.analysis,
        technicals: {
          volatility: volatility,
          avgVolume24h: avgVolume,
          volumeRatio: parseFloat(ticker24hr.volume) / avgVolume, // Current vs average volume
          pricePosition: this.calculatePricePosition(
            parseFloat(ticker24hr.lastPrice),
            parseFloat(ticker24hr.highPrice),
            parseFloat(ticker24hr.lowPrice)
          )
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to get comprehensive market data: ${error}`);
    }
  }

  // Calculate price volatility
  private calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i-1]) / prices[i-1]);
    }
    
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    
    return Math.sqrt(variance) * Math.sqrt(24); // Annualized volatility
  }

  // Calculate where current price sits in 24h range
  private calculatePricePosition(current: number, high: number, low: number): number {
    if (high === low) return 0.5;
    return (current - low) / (high - low);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { symbol = 'BTCUSDT', action = 'comprehensive' } = req.query;
    
    if (!process.env.BINANCE_API_KEY || !process.env.BINANCE_SECRET_KEY) {
      return res.status(400).json({
        error: 'Binance API credentials not configured'
      });
    }

    const binanceAPI = new BinanceEnhancedAPI();

    switch (action) {
      case 'account':
        const accountInfo = await binanceAPI.getAccountInfo();
        res.status(200).json({
          success: true,
          data: accountInfo,
          timestamp: new Date().toISOString()
        });
        break;

      case 'fees':
        const fees = await binanceAPI.getTradingFees([symbol as string]);
        res.status(200).json({
          success: true,
          data: fees,
          timestamp: new Date().toISOString()
        });
        break;

      case 'orderbook':
        const orderBook = await binanceAPI.getEnhancedOrderBook(symbol as string);
        res.status(200).json({
          success: true,
          data: orderBook,
          timestamp: new Date().toISOString()
        });
        break;

      case 'comprehensive':
      default:
        const marketData = await binanceAPI.getComprehensiveMarketData(symbol as string);
        res.status(200).json({
          success: true,
          data: marketData,
          timestamp: new Date().toISOString()
        });
        break;
    }

  } catch (error) {
    console.error('Binance Enhanced API Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}