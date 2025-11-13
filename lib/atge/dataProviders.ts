/**
 * Multi-Provider OHLC Data Fetcher for ATGE
 * 
 * Fetches real-time OHLC data from multiple sources with fallbacks:
 * 1. Binance (primary - free, accurate, real-time)
 * 2. Kraken (secondary - already configured)
 * 3. CoinGecko (tertiary - fallback for daily data)
 * 
 * Requirements: 1.3, 6.1-6.5
 */

export interface OHLCVCandle {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface DataProviderResponse {
  candles: OHLCVCandle[];
  source: string;
  quality: number;
  timeframe: string;
  fetchedAt: Date;
}

/**
 * Fetch OHLC data from Binance (free, real-time, accurate)
 * 
 * Binance provides accurate OHLC data for multiple timeframes
 * No API key required for public market data
 */
async function fetchFromBinance(
  symbol: string,
  timeframe: '15m' | '1h' | '4h' | '1d',
  limit: number = 500
): Promise<DataProviderResponse> {
  const symbolMap: Record<string, string> = {
    'BTC': 'BTCUSDT',
    'ETH': 'ETHUSDT'
  };
  
  const binanceSymbol = symbolMap[symbol];
  if (!binanceSymbol) {
    throw new Error(`Unsupported symbol: ${symbol}`);
  }
  
  const intervalMap = {
    '15m': '15m',
    '1h': '1h',
    '4h': '4h',
    '1d': '1d'
  };
  
  const url = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${intervalMap[timeframe]}&limit=${limit}`;
  
  console.log(`[DataProvider] Fetching from Binance: ${symbol} ${timeframe} (${limit} candles)`);
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Binance API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Binance returned invalid data');
  }
  
  const candles: OHLCVCandle[] = data.map((candle: any[]) => ({
    timestamp: new Date(candle[0]),
    open: parseFloat(candle[1]),
    high: parseFloat(candle[2]),
    low: parseFloat(candle[3]),
    close: parseFloat(candle[4]),
    volume: parseFloat(candle[5])
  }));
  
  console.log(`[DataProvider] Binance returned ${candles.length} candles`);
  
  return {
    candles,
    source: 'Binance',
    quality: 100, // Binance data is highest quality
    timeframe,
    fetchedAt: new Date()
  };
}

/**
 * Fetch OHLC data from Kraken (backup)
 * 
 * Kraken provides accurate OHLC data
 * No API key required for public market data
 */
async function fetchFromKraken(
  symbol: string,
  timeframe: '15m' | '1h' | '4h' | '1d',
  limit: number = 500
): Promise<DataProviderResponse> {
  const symbolMap: Record<string, string> = {
    'BTC': 'XXBTZUSD',
    'ETH': 'XETHZUSD'
  };
  
  const krakenSymbol = symbolMap[symbol];
  if (!krakenSymbol) {
    throw new Error(`Unsupported symbol: ${symbol}`);
  }
  
  const intervalMap = {
    '15m': '15',
    '1h': '60',
    '4h': '240',
    '1d': '1440'
  };
  
  const url = `https://api.kraken.com/0/public/OHLC?pair=${krakenSymbol}&interval=${intervalMap[timeframe]}`;
  
  console.log(`[DataProvider] Fetching from Kraken: ${symbol} ${timeframe}`);
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Kraken API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (data.error && data.error.length > 0) {
    throw new Error(`Kraken API error: ${data.error.join(', ')}`);
  }
  
  const ohlcData = data.result[krakenSymbol];
  
  if (!Array.isArray(ohlcData) || ohlcData.length === 0) {
    throw new Error('Kraken returned invalid data');
  }
  
  const candles: OHLCVCandle[] = ohlcData.slice(-limit).map((candle: any[]) => ({
    timestamp: new Date(candle[0] * 1000),
    open: parseFloat(candle[1]),
    high: parseFloat(candle[2]),
    low: parseFloat(candle[3]),
    close: parseFloat(candle[4]),
    volume: parseFloat(candle[6])
  }));
  
  console.log(`[DataProvider] Kraken returned ${candles.length} candles`);
  
  return {
    candles,
    source: 'Kraken',
    quality: 95, // Kraken data is very good
    timeframe,
    fetchedAt: new Date()
  };
}

/**
 * Fetch OHLC data from CoinGecko (fallback for daily data)
 * 
 * CoinGecko only provides daily data, less accurate for intraday
 * Use as last resort
 */
async function fetchFromCoinGecko(
  symbol: string,
  timeframe: '15m' | '1h' | '4h' | '1d',
  limit: number = 500
): Promise<DataProviderResponse> {
  // CoinGecko only supports daily data
  if (timeframe !== '1d') {
    throw new Error('CoinGecko only supports daily timeframe');
  }
  
  const symbolMap: Record<string, string> = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum'
  };
  
  const geckoId = symbolMap[symbol];
  if (!geckoId) {
    throw new Error(`Unsupported symbol: ${symbol}`);
  }
  
  const url = `https://api.coingecko.com/api/v3/coins/${geckoId}/market_chart?vs_currency=usd&days=${limit}&interval=daily`;
  
  console.log(`[DataProvider] Fetching from CoinGecko: ${symbol} ${timeframe}`);
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!data.prices || !Array.isArray(data.prices)) {
    throw new Error('CoinGecko returned invalid data');
  }
  
  // CoinGecko returns prices, we need to estimate OHLC
  const candles: OHLCVCandle[] = data.prices.map((item: [number, number], index: number) => {
    const price = item[1];
    const volume = data.total_volumes?.[index]?.[1] || 0;
    
    return {
      timestamp: new Date(item[0]),
      open: price,
      high: price * 1.02, // Estimate (2% above close)
      low: price * 0.98,  // Estimate (2% below close)
      close: price,
      volume: volume
    };
  });
  
  console.log(`[DataProvider] CoinGecko returned ${candles.length} candles (estimated OHLC)`);
  
  return {
    candles,
    source: 'CoinGecko',
    quality: 70, // Lower quality due to estimated OHLC
    timeframe,
    fetchedAt: new Date()
  };
}

/**
 * Multi-provider data fetcher with fallbacks
 * 
 * Tries providers in order:
 * 1. Binance (best for all timeframes)
 * 2. Kraken (good for all timeframes)
 * 3. CoinGecko (only for daily, estimated OHLC)
 * 
 * @param symbol - Cryptocurrency symbol (BTC or ETH)
 * @param timeframe - Candle timeframe (15m, 1h, 4h, 1d)
 * @param limit - Number of candles to fetch (default 500)
 * @returns OHLC data with source attribution
 */
export async function fetchOHLCData(
  symbol: string,
  timeframe: '15m' | '1h' | '4h' | '1d',
  limit: number = 500
): Promise<DataProviderResponse> {
  const errors: string[] = [];
  
  // Try Binance first (free, accurate, real-time)
  try {
    return await fetchFromBinance(symbol, timeframe, limit);
  } catch (error) {
    const errorMsg = `Binance: ${(error as Error).message}`;
    console.warn(`[DataProvider] ${errorMsg}`);
    errors.push(errorMsg);
  }
  
  // Try Kraken as backup
  try {
    return await fetchFromKraken(symbol, timeframe, limit);
  } catch (error) {
    const errorMsg = `Kraken: ${(error as Error).message}`;
    console.warn(`[DataProvider] ${errorMsg}`);
    errors.push(errorMsg);
  }
  
  // Try CoinGecko as last resort (only for daily)
  if (timeframe === '1d') {
    try {
      return await fetchFromCoinGecko(symbol, timeframe, limit);
    } catch (error) {
      const errorMsg = `CoinGecko: ${(error as Error).message}`;
      console.error(`[DataProvider] ${errorMsg}`);
      errors.push(errorMsg);
    }
  }
  
  // All providers failed
  throw new Error(`Failed to fetch OHLC data from all providers:\n${errors.join('\n')}`);
}

/**
 * Calculate data quality score based on candle data
 * 
 * Checks for:
 * - Data completeness (no gaps)
 * - Price anomalies (>20% jumps)
 * - Volume consistency
 * 
 * @param candles - OHLC candle data
 * @param timeframe - Expected timeframe
 * @returns Quality score (0-100)
 */
export function calculateDataQuality(
  candles: OHLCVCandle[],
  timeframe: '15m' | '1h' | '4h' | '1d'
): number {
  if (candles.length === 0) return 0;
  
  let qualityScore = 100;
  
  // Check for gaps in data
  const timeframeMs = {
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000
  }[timeframe];
  
  let gapCount = 0;
  
  for (let i = 1; i < candles.length; i++) {
    const expectedTime = candles[i - 1].timestamp.getTime() + timeframeMs;
    const actualTime = candles[i].timestamp.getTime();
    const gap = actualTime - expectedTime;
    
    if (gap > timeframeMs * 1.5) {
      gapCount++;
    }
  }
  
  // Reduce quality score for gaps (max 20 points)
  const gapPenalty = Math.min(20, (gapCount / candles.length) * 100);
  qualityScore -= gapPenalty;
  
  // Check for price anomalies (>20% jumps)
  let anomalyCount = 0;
  
  for (let i = 1; i < candles.length; i++) {
    const priceChange = Math.abs((candles[i].close - candles[i - 1].close) / candles[i - 1].close);
    if (priceChange > 0.2) {
      anomalyCount++;
    }
  }
  
  // Reduce quality score for anomalies (max 10 points)
  const anomalyPenalty = Math.min(10, (anomalyCount / candles.length) * 100);
  qualityScore -= anomalyPenalty;
  
  // Check for zero volume candles
  const zeroVolumeCount = candles.filter(c => c.volume === 0).length;
  const volumePenalty = Math.min(10, (zeroVolumeCount / candles.length) * 100);
  qualityScore -= volumePenalty;
  
  return Math.max(0, Math.min(100, Math.round(qualityScore)));
}
