/**
 * UCIE Market Data API - Flat Structure
 * 
 * Fetches comprehensive cryptocurrency market data from multiple sources
 * Pattern based on working crypto-herald-15-stories.ts
 * 
 * Endpoint: GET /api/ucie-market-data?symbol=BTC
 * 
 * Features:
 * - Multi-source data fetching (CoinGecko, CoinMarketCap, Binance, Kraken)
 * - 30-second cache TTL
 * - Graceful fallback mechanisms
 * - Real-time price aggregation
 * - Comprehensive market metrics
 */

import { NextApiRequest, NextApiResponse } from 'next';

// API endpoints
const APIS = {
  binance: 'https://api.binance.com/api/v3',
  kraken: 'https://api.kraken.com/0/public',
  coinbase: 'https://api.exchange.coinbase.com',
  coingecko: 'https://api.coingecko.com/api/v3'
};

// Symbol mapping for different exchanges
const SYMBOL_MAP: Record<string, { binance: string; kraken: string; coinbase: string; coingecko: string }> = {
  'BTC': { binance: 'BTCUSDT', kraken: 'XXBTZUSD', coinbase: 'BTC-USD', coingecko: 'bitcoin' },
  'ETH': { binance: 'ETHUSDT', kraken: 'XETHZUSD', coinbase: 'ETH-USD', coingecko: 'ethereum' },
  'XRP': { binance: 'XRPUSDT', kraken: 'XXRPZUSD', coinbase: 'XRP-USD', coingecko: 'ripple' },
  'SOL': { binance: 'SOLUSDT', kraken: 'SOLUSD', coinbase: 'SOL-USD', coingecko: 'solana' },
  'ADA': { binance: 'ADAUSDT', kraken: 'ADAUSD', coinbase: 'ADA-USD', coingecko: 'cardano' },
  'DOGE': { binance: 'DOGEUSDT', kraken: 'XDGUSD', coinbase: 'DOGE-USD', coingecko: 'dogecoin' },
  'DOT': { binance: 'DOTUSDT', kraken: 'DOTUSD', coinbase: 'DOT-USD', coingecko: 'polkadot' },
  'MATIC': { binance: 'MATICUSDT', kraken: 'MATICUSD', coinbase: 'MATIC-USD', coingecko: 'matic-network' },
  'LINK': { binance: 'LINKUSDT', kraken: 'LINKUSD', coinbase: 'LINK-USD', coingecko: 'chainlink' },
  'UNI': { binance: 'UNIUSDT', kraken: 'UNIUSD', coinbase: 'UNI-USD', coingecko: 'uniswap' }
};

// In-memory cache
interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 30000; // 30 seconds

/**
 * Get cached data if available and fresh
 */
function getCachedData(symbol: string): any | null {
  const cached = cache.get(symbol.toUpperCase());
  
  if (!cached) {
    return null;
  }

  const age = Date.now() - cached.timestamp;
  
  if (age > CACHE_TTL) {
    cache.delete(symbol.toUpperCase());
    return null;
  }

  console.log(`✅ Cache hit for ${symbol} (age: ${(age / 1000).toFixed(1)}s)`);
  return {
    ...cached.data,
    cached: true,
    cacheAge: age
  };
}

/**
 * Set cache data
 */
function setCacheData(symbol: string, data: any): void {
  cache.set(symbol.toUpperCase(), {
    data,
    timestamp: Date.now()
  });
}

/**
 * Fetch from Binance
 */
async function fetchBinanceData(symbol: string) {
  try {
    const symbols = SYMBOL_MAP[symbol];
    if (!symbols) throw new Error(`Unsupported symbol: ${symbol}`);

    console.log(`🔍 Fetching Binance data for ${symbols.binance}...`);
    const response = await fetch(`${APIS.binance}/ticker/24hr?symbol=${symbols.binance}`, {
      signal: AbortSignal.timeout(5000),
      headers: { 'User-Agent': 'UCIE/1.0' }
    });

    if (!response.ok) throw new Error(`Binance HTTP ${response.status}`);

    const data = await response.json();
    console.log(`✅ Binance: ${data.lastPrice}`);

    return {
      exchange: 'Binance',
      price: parseFloat(data.lastPrice),
      volume24h: parseFloat(data.volume),
      change24h: parseFloat(data.priceChangePercent),
      high24h: parseFloat(data.highPrice),
      low24h: parseFloat(data.lowPrice),
      success: true
    };
  } catch (error) {
    console.error(`❌ Binance failed:`, error instanceof Error ? error.message : 'Unknown error');
    return { exchange: 'Binance', success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Fetch from Kraken
 */
async function fetchKrakenData(symbol: string) {
  try {
    const symbols = SYMBOL_MAP[symbol];
    if (!symbols) throw new Error(`Unsupported symbol: ${symbol}`);

    console.log(`🔍 Fetching Kraken data for ${symbols.kraken}...`);
    const response = await fetch(`${APIS.kraken}/Ticker?pair=${symbols.kraken}`, {
      signal: AbortSignal.timeout(5000),
      headers: { 'User-Agent': 'UCIE/1.0' }
    });

    if (!response.ok) throw new Error(`Kraken HTTP ${response.status}`);

    const data = await response.json();
    const ticker = data.result[Object.keys(data.result)[0]];
    console.log(`✅ Kraken: ${ticker.c[0]}`);

    return {
      exchange: 'Kraken',
      price: parseFloat(ticker.c[0]),
      volume24h: parseFloat(ticker.v[1]),
      change24h: ((parseFloat(ticker.c[0]) - parseFloat(ticker.o)) / parseFloat(ticker.o)) * 100,
      high24h: parseFloat(ticker.h[1]),
      low24h: parseFloat(ticker.l[1]),
      success: true
    };
  } catch (error) {
    console.error(`❌ Kraken failed:`, error instanceof Error ? error.message : 'Unknown error');
    return { exchange: 'Kraken', success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Fetch from Coinbase
 */
async function fetchCoinbaseData(symbol: string) {
  try {
    const symbols = SYMBOL_MAP[symbol];
    if (!symbols) throw new Error(`Unsupported symbol: ${symbol}`);

    console.log(`🔍 Fetching Coinbase data for ${symbols.coinbase}...`);
    const response = await fetch(`${APIS.coinbase}/products/${symbols.coinbase}/ticker`, {
      signal: AbortSignal.timeout(5000),
      headers: { 'User-Agent': 'UCIE/1.0' }
    });

    if (!response.ok) throw new Error(`Coinbase HTTP ${response.status}`);

    const data = await response.json();
    console.log(`✅ Coinbase: ${data.price}`);

    return {
      exchange: 'Coinbase',
      price: parseFloat(data.price),
      volume24h: parseFloat(data.volume),
      success: true
    };
  } catch (error) {
    console.error(`❌ Coinbase failed:`, error instanceof Error ? error.message : 'Unknown error');
    return { exchange: 'Coinbase', success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Fetch from CoinGecko (comprehensive market data)
 */
async function fetchCoinGeckoData(symbol: string) {
  try {
    const symbols = SYMBOL_MAP[symbol];
    if (!symbols) throw new Error(`Unsupported symbol: ${symbol}`);

    console.log(`🔍 Fetching CoinGecko data for ${symbols.coingecko}...`);
    const response = await fetch(
      `${APIS.coingecko}/coins/${symbols.coingecko}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=true`,
      {
        signal: AbortSignal.timeout(8000),
        headers: {
          'User-Agent': 'UCIE/1.0',
          ...(process.env.COINGECKO_API_KEY ? { 'x-cg-pro-api-key': process.env.COINGECKO_API_KEY } : {})
        }
      }
    );

    if (!response.ok) throw new Error(`CoinGecko HTTP ${response.status}`);

    const data = await response.json();
    console.log(`✅ CoinGecko: ${data.market_data.current_price.usd}`);

    return {
      exchange: 'CoinGecko',
      price: data.market_data.current_price.usd,
      volume24h: data.market_data.total_volume.usd,
      change24h: data.market_data.price_change_percentage_24h,
      change7d: data.market_data.price_change_percentage_7d,
      high24h: data.market_data.high_24h.usd,
      low24h: data.market_data.low_24h.usd,
      marketCap: data.market_data.market_cap.usd,
      circulatingSupply: data.market_data.circulating_supply,
      totalSupply: data.market_data.total_supply,
      sparkline: data.market_data.sparkline_7d?.price || [],
      success: true
    };
  } catch (error) {
    console.error(`❌ CoinGecko failed:`, error instanceof Error ? error.message : 'Unknown error');
    return { exchange: 'CoinGecko', success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Aggregate prices from multiple exchanges
 */
function aggregatePrices(sources: any[]) {
  const successfulSources = sources.filter(s => s.success && s.price);
  
  if (successfulSources.length === 0) {
    return null;
  }

  const prices = successfulSources.map(s => s.price);
  const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);
  const spread = ((maxPrice - minPrice) / avgPrice) * 100;

  return {
    average: avgPrice,
    median: prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)],
    min: minPrice,
    max: maxPrice,
    spread: spread,
    sources: successfulSources.length,
    confidence: successfulSources.length >= 3 ? 'HIGH' : successfulSources.length === 2 ? 'MEDIUM' : 'LOW'
  };
}

/**
 * Main API handler
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      timestamp: new Date().toISOString()
    });
  }

  try {
    const { symbol } = req.query;

    // Validate symbol
    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid symbol parameter',
        timestamp: new Date().toISOString()
      });
    }

    const symbolUpper = symbol.toUpperCase();

    // Check if symbol is supported
    if (!SYMBOL_MAP[symbolUpper]) {
      return res.status(400).json({
        success: false,
        error: `Unsupported symbol: ${symbolUpper}. Supported: ${Object.keys(SYMBOL_MAP).join(', ')}`,
        timestamp: new Date().toISOString()
      });
    }

    // Check cache first
    const cachedData = getCachedData(symbolUpper);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    console.log(`🚀 Fetching market data for ${symbolUpper} from multiple sources...`);

    // Fetch from all sources in parallel
    const [binanceData, krakenData, coinbaseData, coingeckoData] = await Promise.all([
      fetchBinanceData(symbolUpper),
      fetchKrakenData(symbolUpper),
      fetchCoinbaseData(symbolUpper),
      fetchCoinGeckoData(symbolUpper)
    ]);

    // Aggregate prices
    const priceAggregation = aggregatePrices([binanceData, krakenData, coinbaseData, coingeckoData]);

    if (!priceAggregation) {
      throw new Error('Failed to fetch price data from any source');
    }

    // Build comprehensive response
    const response = {
      success: true,
      symbol: symbolUpper,
      price: priceAggregation.average,
      priceAggregation: {
        average: priceAggregation.average,
        median: priceAggregation.median,
        min: priceAggregation.min,
        max: priceAggregation.max,
        spread: priceAggregation.spread,
        confidence: priceAggregation.confidence
      },
      marketData: {
        volume24h: coingeckoData.success ? coingeckoData.volume24h : binanceData.success ? binanceData.volume24h : null,
        change24h: coingeckoData.success ? coingeckoData.change24h : binanceData.success ? binanceData.change24h : null,
        change7d: coingeckoData.success ? coingeckoData.change7d : null,
        high24h: coingeckoData.success ? coingeckoData.high24h : binanceData.success ? binanceData.high24h : null,
        low24h: coingeckoData.success ? coingeckoData.low24h : binanceData.success ? binanceData.low24h : null,
        marketCap: coingeckoData.success ? coingeckoData.marketCap : null,
        circulatingSupply: coingeckoData.success ? coingeckoData.circulatingSupply : null,
        totalSupply: coingeckoData.success ? coingeckoData.totalSupply : null
      },
      sources: {
        binance: binanceData,
        kraken: krakenData,
        coinbase: coinbaseData,
        coingecko: coingeckoData
      },
      dataQuality: {
        totalSources: 4,
        successfulSources: [binanceData, krakenData, coinbaseData, coingeckoData].filter(s => s.success).length,
        failedSources: [binanceData, krakenData, coinbaseData, coingeckoData].filter(s => !s.success).map(s => s.exchange),
        confidence: priceAggregation.confidence,
        spread: priceAggregation.spread
      },
      sparkline: coingeckoData.success ? coingeckoData.sparkline : [],
      cached: false,
      timestamp: new Date().toISOString()
    };

    // Cache the response
    setCacheData(symbolUpper, response);

    console.log(`✅ Market data for ${symbolUpper} fetched successfully`);
    console.log(`📊 Price: ${response.price.toLocaleString()}, Sources: ${response.dataQuality.successfulSources}/4, Spread: ${response.priceAggregation.spread.toFixed(3)}%`);

    return res.status(200).json(response);

  } catch (error) {
    console.error('❌ UCIE Market Data API Error:', error);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
}
