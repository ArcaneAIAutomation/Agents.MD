/**
 * UCIE Market Data API - Flat Structure
 * 
 * Fetches comprehensive cryptocurrency market data from multiple sources
 * Pattern based on working crypto-herald-15-stories.ts
 * 
 * Endpoint: GET /api/ucie-market-data?symbol=BTC
 * 
 * Features:
 * - Multi-source data fetching (CoinMarketCap PRIMARY, Binance, Kraken, Coinbase)
 * - 30-second cache TTL
 * - Graceful fallback mechanisms
 * - Real-time price aggregation
 * - Comprehensive market metrics
 * - Rich context for Caesar AI analysis
 */

import { NextApiRequest, NextApiResponse } from 'next';

// API endpoints
const APIS = {
  binance: 'https://api.binance.com/api/v3',
  kraken: 'https://api.kraken.com/0/public',
  coinbase: 'https://api.exchange.coinbase.com',
  coinmarketcap: 'https://pro-api.coinmarketcap.com/v1'
};

// Symbol mapping for different exchanges
const SYMBOL_MAP: Record<string, { binance: string; kraken: string; coinbase: string; cmc: string; cmcId: number }> = {
  'BTC': { binance: 'BTCUSDT', kraken: 'XXBTZUSD', coinbase: 'BTC-USD', cmc: 'BTC', cmcId: 1 },
  'ETH': { binance: 'ETHUSDT', kraken: 'XETHZUSD', coinbase: 'ETH-USD', cmc: 'ETH', cmcId: 1027 },
  'XRP': { binance: 'XRPUSDT', kraken: 'XXRPZUSD', coinbase: 'XRP-USD', cmc: 'XRP', cmcId: 52 },
  'SOL': { binance: 'SOLUSDT', kraken: 'SOLUSD', coinbase: 'SOL-USD', cmc: 'SOL', cmcId: 5426 },
  'ADA': { binance: 'ADAUSDT', kraken: 'ADAUSD', coinbase: 'ADA-USD', cmc: 'ADA', cmcId: 2010 },
  'DOGE': { binance: 'DOGEUSDT', kraken: 'XDGUSD', coinbase: 'DOGE-USD', cmc: 'DOGE', cmcId: 74 },
  'DOT': { binance: 'DOTUSDT', kraken: 'DOTUSD', coinbase: 'DOT-USD', cmc: 'DOT', cmcId: 6636 },
  'MATIC': { binance: 'MATICUSDT', kraken: 'MATICUSD', coinbase: 'MATIC-USD', cmc: 'MATIC', cmcId: 3890 },
  'LINK': { binance: 'LINKUSDT', kraken: 'LINKUSD', coinbase: 'LINK-USD', cmc: 'LINK', cmcId: 1975 },
  'UNI': { binance: 'UNIUSDT', kraken: 'UNIUSD', coinbase: 'UNI-USD', cmc: 'UNI', cmcId: 7083 }
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
 * Fetch from CoinMarketCap (PRIMARY comprehensive market data)
 */
async function fetchCoinMarketCapData(symbol: string) {
  try {
    const symbols = SYMBOL_MAP[symbol];
    if (!symbols) throw new Error(`Unsupported symbol: ${symbol}`);

    if (!process.env.COINMARKETCAP_API_KEY) {
      throw new Error('CoinMarketCap API key not configured');
    }

    console.log(`🔍 Fetching CoinMarketCap data for ${symbols.cmc} (ID: ${symbols.cmcId})...`);
    
    // Fetch latest quotes
    const quotesResponse = await fetch(
      `${APIS.coinmarketcap}/cryptocurrency/quotes/latest?id=${symbols.cmcId}&convert=USD`,
      {
        signal: AbortSignal.timeout(8000),
        headers: {
          'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY,
          'Accept': 'application/json'
        }
      }
    );

    if (!quotesResponse.ok) throw new Error(`CoinMarketCap HTTP ${quotesResponse.status}`);

    const quotesData = await quotesResponse.json();
    const coinData = quotesData.data[symbols.cmcId];
    const quote = coinData.quote.USD;

    console.log(`✅ CoinMarketCap: ${quote.price}`);

    // Fetch metadata for additional context
    let metadata = null;
    try {
      const metadataResponse = await fetch(
        `${APIS.coinmarketcap}/cryptocurrency/info?id=${symbols.cmcId}`,
        {
          signal: AbortSignal.timeout(5000),
          headers: {
            'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY,
            'Accept': 'application/json'
          }
        }
      );
      
      if (metadataResponse.ok) {
        const metadataData = await metadataResponse.json();
        metadata = metadataData.data[symbols.cmcId];
      }
    } catch (metaError) {
      console.warn('⚠️ CoinMarketCap metadata fetch failed (non-critical)');
    }

    return {
      exchange: 'CoinMarketCap',
      price: quote.price,
      volume24h: quote.volume_24h,
      volumeChange24h: quote.volume_change_24h,
      change1h: quote.percent_change_1h,
      change24h: quote.percent_change_24h,
      change7d: quote.percent_change_7d,
      change30d: quote.percent_change_30d,
      change60d: quote.percent_change_60d,
      change90d: quote.percent_change_90d,
      marketCap: quote.market_cap,
      marketCapDominance: quote.market_cap_dominance,
      fullyDilutedMarketCap: quote.fully_diluted_market_cap,
      circulatingSupply: coinData.circulating_supply,
      totalSupply: coinData.total_supply,
      maxSupply: coinData.max_supply,
      rank: coinData.cmc_rank,
      // Metadata (if available)
      ...(metadata && {
        description: metadata.description,
        website: metadata.urls?.website?.[0],
        technicalDoc: metadata.urls?.technical_doc?.[0],
        twitter: metadata.urls?.twitter?.[0],
        reddit: metadata.urls?.reddit?.[0],
        tags: metadata.tags,
        category: metadata.category,
        platform: metadata.platform
      }),
      lastUpdated: quote.last_updated,
      success: true
    };
  } catch (error) {
    console.error(`❌ CoinMarketCap failed:`, error instanceof Error ? error.message : 'Unknown error');
    return { exchange: 'CoinMarketCap', success: false, error: error instanceof Error ? error.message : 'Unknown error' };
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

    // Fetch from all sources in parallel (CoinMarketCap is PRIMARY)
    const [cmcData, binanceData, krakenData, coinbaseData] = await Promise.all([
      fetchCoinMarketCapData(symbolUpper),
      fetchBinanceData(symbolUpper),
      fetchKrakenData(symbolUpper),
      fetchCoinbaseData(symbolUpper)
    ]);

    // Aggregate prices
    const priceAggregation = aggregatePrices([cmcData, binanceData, krakenData, coinbaseData]);

    if (!priceAggregation) {
      throw new Error('Failed to fetch price data from any source');
    }

    // Build comprehensive response with rich CoinMarketCap data
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
      // Rich market data from CoinMarketCap (PRIMARY)
      marketData: {
        // Price changes across multiple timeframes
        change1h: cmcData.success ? cmcData.change1h : null,
        change24h: cmcData.success ? cmcData.change24h : binanceData.success ? binanceData.change24h : null,
        change7d: cmcData.success ? cmcData.change7d : null,
        change30d: cmcData.success ? cmcData.change30d : null,
        change60d: cmcData.success ? cmcData.change60d : null,
        change90d: cmcData.success ? cmcData.change90d : null,
        // Volume data
        volume24h: cmcData.success ? cmcData.volume24h : binanceData.success ? binanceData.volume24h : null,
        volumeChange24h: cmcData.success ? cmcData.volumeChange24h : null,
        // Market cap data
        marketCap: cmcData.success ? cmcData.marketCap : null,
        marketCapDominance: cmcData.success ? cmcData.marketCapDominance : null,
        fullyDilutedMarketCap: cmcData.success ? cmcData.fullyDilutedMarketCap : null,
        // Supply data
        circulatingSupply: cmcData.success ? cmcData.circulatingSupply : null,
        totalSupply: cmcData.success ? cmcData.totalSupply : null,
        maxSupply: cmcData.success ? cmcData.maxSupply : null,
        // Ranking
        rank: cmcData.success ? cmcData.rank : null,
        // 24h high/low from exchanges
        high24h: binanceData.success ? binanceData.high24h : null,
        low24h: binanceData.success ? binanceData.low24h : null
      },
      // Project metadata (for Caesar AI context)
      metadata: cmcData.success ? {
        description: cmcData.description || null,
        website: cmcData.website || null,
        technicalDoc: cmcData.technicalDoc || null,
        twitter: cmcData.twitter || null,
        reddit: cmcData.reddit || null,
        tags: cmcData.tags || [],
        category: cmcData.category || null,
        platform: cmcData.platform || null
      } : null,
      // Raw source data
      sources: {
        coinmarketcap: cmcData,
        binance: binanceData,
        kraken: krakenData,
        coinbase: coinbaseData
      },
      dataQuality: {
        totalSources: 4,
        successfulSources: [cmcData, binanceData, krakenData, coinbaseData].filter(s => s.success).length,
        failedSources: [cmcData, binanceData, krakenData, coinbaseData].filter(s => !s.success).map(s => s.exchange),
        confidence: priceAggregation.confidence,
        spread: priceAggregation.spread,
        primarySource: 'CoinMarketCap',
        primarySourceStatus: cmcData.success ? 'OPERATIONAL' : 'FAILED'
      },
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
