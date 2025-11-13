/**
 * Historical Data Fetcher for ATGE
 * 
 * Fetches minute-level OHLCV data from CoinMarketCap with CoinGecko fallback.
 * Implements rate limiting, caching, and queuing to respect API limits.
 * 
 * Requirements: 6.1-6.5, 6.20, 19.1-19.15
 */

import { query, queryOne, queryMany } from '../db';

// ============================================================================
// TYPES
// ============================================================================

export interface OHLCVData {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface HistoricalDataRequest {
  symbol: string;
  startTime: Date;
  endTime: Date;
  resolution: '1m' | '5m' | '1h';
}

export interface HistoricalDataResponse {
  data: OHLCVData[];
  source: 'CoinMarketCap' | 'CoinGecko';
  resolution: '1m' | '5m' | '1h';
  dataQualityScore: number;
  cached: boolean;
}

interface QueuedRequest {
  request: HistoricalDataRequest;
  resolve: (value: HistoricalDataResponse) => void;
  reject: (error: Error) => void;
  priority: number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CACHE_TTL_HOURS = 24;
const MAX_REQUESTS_PER_MINUTE = 10;
const REQUEST_INTERVAL_MS = 6000; // 6 seconds between requests (10 per minute)

// ============================================================================
// REQUEST QUEUE
// ============================================================================

class RequestQueue {
  private queue: QueuedRequest[] = [];
  private processing = false;
  private lastRequestTime = 0;
  private requestCount = 0;
  private requestCountResetTime = Date.now();

  async add(request: HistoricalDataRequest, priority: number = 0): Promise<HistoricalDataResponse> {
    return new Promise((resolve, reject) => {
      this.queue.push({ request, resolve, reject, priority });
      this.queue.sort((a, b) => b.priority - a.priority); // Higher priority first
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      // Reset request count every minute
      if (Date.now() - this.requestCountResetTime > 60000) {
        this.requestCount = 0;
        this.requestCountResetTime = Date.now();
      }

      // Check rate limit
      if (this.requestCount >= MAX_REQUESTS_PER_MINUTE) {
        const waitTime = 60000 - (Date.now() - this.requestCountResetTime);
        console.log(`[HistoricalData] Rate limit reached, waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        this.requestCount = 0;
        this.requestCountResetTime = Date.now();
      }

      // Wait for minimum interval between requests
      const timeSinceLastRequest = Date.now() - this.lastRequestTime;
      if (timeSinceLastRequest < REQUEST_INTERVAL_MS) {
        await new Promise(resolve => setTimeout(resolve, REQUEST_INTERVAL_MS - timeSinceLastRequest));
      }

      const item = this.queue.shift()!;
      
      try {
        const result = await this.fetchHistoricalData(item.request);
        item.resolve(result);
      } catch (error) {
        item.reject(error as Error);
      }

      this.lastRequestTime = Date.now();
      this.requestCount++;
    }

    this.processing = false;
  }

  private async fetchHistoricalData(request: HistoricalDataRequest): Promise<HistoricalDataResponse> {
    // Check cache first
    const cached = await checkCache(request);
    if (cached) {
      console.log(`[HistoricalData] Cache hit for ${request.symbol} ${request.startTime.toISOString()}`);
      return cached;
    }

    // Try CoinMarketCap first
    try {
      console.log(`[HistoricalData] Fetching from CoinMarketCap: ${request.symbol}`);
      const data = await fetchFromCoinMarketCap(request);
      
      // Cache the data
      await cacheHistoricalData(request, data, 'CoinMarketCap');
      
      return {
        data,
        source: 'CoinMarketCap',
        resolution: request.resolution,
        dataQualityScore: calculateDataQuality(data, request.resolution),
        cached: false
      };
    } catch (error) {
      console.warn(`[HistoricalData] CoinMarketCap failed, trying CoinGecko:`, error);
      
      // Fallback to CoinGecko
      try {
        const data = await fetchFromCoinGecko(request);
        
        // Cache the data
        await cacheHistoricalData(request, data, 'CoinGecko');
        
        return {
          data,
          source: 'CoinGecko',
          resolution: request.resolution,
          dataQualityScore: calculateDataQuality(data, request.resolution),
          cached: false
        };
      } catch (geckoError) {
        console.error(`[HistoricalData] Both APIs failed:`, geckoError);
        throw new Error('Failed to fetch historical data from all sources');
      }
    }
  }
}

const requestQueue = new RequestQueue();

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Fetch historical OHLCV data for a trade signal
 * Automatically queues requests and respects rate limits
 */
export async function fetchHistoricalData(
  request: HistoricalDataRequest,
  priority: number = 0
): Promise<HistoricalDataResponse> {
  return requestQueue.add(request, priority);
}

/**
 * Fetch historical data for a specific trade signal from database
 */
export async function getTradeHistoricalData(
  tradeSignalId: string
): Promise<OHLCVData[]> {
  const result = await queryMany(
    `SELECT 
      timestamp,
      open_price as open,
      high_price as high,
      low_price as low,
      close_price as close,
      volume
    FROM trade_historical_prices
    WHERE trade_signal_id = $1
    ORDER BY timestamp ASC`,
    [tradeSignalId]
  );

  return result.map(row => ({
    timestamp: new Date(row.timestamp),
    open: parseFloat(row.open),
    high: parseFloat(row.high),
    low: parseFloat(row.low),
    close: parseFloat(row.close),
    volume: parseFloat(row.volume || '0')
  }));
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

async function checkCache(request: HistoricalDataRequest): Promise<HistoricalDataResponse | null> {
  // Check if we have cached data for this timeframe
  const result = await queryOne(
    `SELECT 
      COUNT(*) as count,
      MIN(timestamp) as min_time,
      MAX(timestamp) as max_time,
      data_source
    FROM trade_historical_prices
    WHERE trade_signal_id IN (
      SELECT id FROM trade_signals 
      WHERE symbol = $1 
      AND generated_at >= NOW() - INTERVAL '${CACHE_TTL_HOURS} hours'
    )
    AND timestamp >= $2
    AND timestamp <= $3
    GROUP BY data_source
    ORDER BY COUNT(*) DESC
    LIMIT 1`,
    [request.symbol, request.startTime, request.endTime]
  );

  if (!result || parseInt(result.count) === 0) {
    return null;
  }

  // Calculate expected data points based on resolution
  const timeRangeMs = request.endTime.getTime() - request.startTime.getTime();
  const resolutionMs = getResolutionMs(request.resolution);
  const expectedPoints = Math.floor(timeRangeMs / resolutionMs);
  const actualPoints = parseInt(result.count);

  // Only use cache if we have at least 90% of expected data
  if (actualPoints < expectedPoints * 0.9) {
    console.log(`[HistoricalData] Cache incomplete: ${actualPoints}/${expectedPoints} points`);
    return null;
  }

  // Fetch the cached data
  const data = await queryMany(
    `SELECT 
      timestamp,
      open_price as open,
      high_price as high,
      low_price as low,
      close_price as close,
      volume
    FROM trade_historical_prices
    WHERE trade_signal_id IN (
      SELECT id FROM trade_signals 
      WHERE symbol = $1 
      AND generated_at >= NOW() - INTERVAL '${CACHE_TTL_HOURS} hours'
    )
    AND timestamp >= $2
    AND timestamp <= $3
    ORDER BY timestamp ASC`,
    [request.symbol, request.startTime, request.endTime]
  );

  const ohlcvData: OHLCVData[] = data.map(row => ({
    timestamp: new Date(row.timestamp),
    open: parseFloat(row.open),
    high: parseFloat(row.high),
    low: parseFloat(row.low),
    close: parseFloat(row.close),
    volume: parseFloat(row.volume || '0')
  }));

  return {
    data: ohlcvData,
    source: result.data_source as 'CoinMarketCap' | 'CoinGecko',
    resolution: request.resolution,
    dataQualityScore: calculateDataQuality(ohlcvData, request.resolution),
    cached: true
  };
}

async function cacheHistoricalData(
  request: HistoricalDataRequest,
  data: OHLCVData[],
  source: 'CoinMarketCap' | 'CoinGecko'
): Promise<void> {
  // Note: This will be called after storing in trade_historical_prices table
  // The actual storage happens in the backtesting API route
  console.log(`[HistoricalData] Cached ${data.length} data points from ${source}`);
}

// ============================================================================
// API INTEGRATIONS
// ============================================================================

async function fetchFromCoinMarketCap(request: HistoricalDataRequest): Promise<OHLCVData[]> {
  const apiKey = process.env.COINMARKETCAP_API_KEY;
  if (!apiKey) {
    throw new Error('CoinMarketCap API key not configured');
  }

  // Convert symbol to CoinMarketCap ID
  const symbolMap: Record<string, string> = {
    'BTC': '1',
    'ETH': '1027'
  };

  const cmcId = symbolMap[request.symbol];
  if (!cmcId) {
    throw new Error(`Unsupported symbol: ${request.symbol}`);
  }

  // CoinMarketCap OHLCV endpoint
  const url = new URL('https://pro-api.coinmarketcap.com/v2/cryptocurrency/ohlcv/historical');
  url.searchParams.append('id', cmcId);
  url.searchParams.append('time_start', request.startTime.toISOString());
  url.searchParams.append('time_end', request.endTime.toISOString());
  url.searchParams.append('interval', getIntervalParam(request.resolution));
  url.searchParams.append('convert', 'USD');

  // Retry logic with exponential backoff
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[HistoricalData] CoinMarketCap attempt ${attempt}/${maxRetries}`);
      
      const response = await fetch(url.toString(), {
        headers: {
          'X-CMC_PRO_API_KEY': apiKey,
          'Accept': 'application/json',
          'User-Agent': 'ATGE-Trading-System/1.0'
        },
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      if (!response.ok) {
        if (response.status === 429) {
          // Rate limited - wait longer
          const waitTime = Math.pow(2, attempt) * 2000; // 4s, 8s, 16s
          console.log(`[HistoricalData] Rate limited, waiting ${waitTime}ms`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        throw new Error(`CoinMarketCap API error: ${response.status} ${response.statusText}`);
      }

      const json = await response.json();
      
      if (json.status?.error_code !== 0) {
        throw new Error(`CoinMarketCap API error: ${json.status?.error_message}`);
      }

      // Parse response
      const quotes = json.data?.quotes || [];
      
      const ohlcvData = quotes.map((quote: any) => ({
        timestamp: new Date(quote.time_open),
        open: quote.quote.USD.open,
        high: quote.quote.USD.high,
        low: quote.quote.USD.low,
        close: quote.quote.USD.close,
        volume: quote.quote.USD.volume
      }));

      console.log(`[HistoricalData] CoinMarketCap success on attempt ${attempt}`);
      return ohlcvData;
      
    } catch (error: any) {
      lastError = error;
      console.warn(`[HistoricalData] CoinMarketCap attempt ${attempt} failed:`, error.message);
      
      // Don't retry on certain errors
      if (error.name === 'AbortError') {
        console.error(`[HistoricalData] Request timeout after 30s`);
        break;
      }
      
      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`[HistoricalData] Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError || new Error('CoinMarketCap fetch failed after all retries');
}

async function fetchFromCoinGecko(request: HistoricalDataRequest): Promise<OHLCVData[]> {
  // Convert symbol to CoinGecko ID
  const symbolMap: Record<string, string> = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum'
  };

  const geckoId = symbolMap[request.symbol];
  if (!geckoId) {
    throw new Error(`Unsupported symbol: ${request.symbol}`);
  }

  // CoinGecko uses Unix timestamps in seconds
  const from = Math.floor(request.startTime.getTime() / 1000);
  const to = Math.floor(request.endTime.getTime() / 1000);

  // CoinGecko market chart endpoint
  const url = `https://api.coingecko.com/api/v3/coins/${geckoId}/market_chart/range?vs_currency=usd&from=${from}&to=${to}`;

  // Retry logic with exponential backoff
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[HistoricalData] CoinGecko attempt ${attempt}/${maxRetries}`);
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ATGE-Trading-System/1.0'
        },
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      if (!response.ok) {
        if (response.status === 429) {
          // Rate limited - wait longer
          const waitTime = Math.pow(2, attempt) * 2000; // 4s, 8s, 16s
          console.log(`[HistoricalData] Rate limited, waiting ${waitTime}ms`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
      }

      const json = await response.json();
      
      // Success - return data
      console.log(`[HistoricalData] CoinGecko success on attempt ${attempt}`);
      return parseCoinGeckoResponse(json, request);
      
    } catch (error: any) {
      lastError = error;
      console.warn(`[HistoricalData] CoinGecko attempt ${attempt} failed:`, error.message);
      
      // Don't retry on certain errors
      if (error.name === 'AbortError') {
        console.error(`[HistoricalData] Request timeout after 30s`);
        break;
      }
      
      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`[HistoricalData] Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError || new Error('CoinGecko fetch failed after all retries');
}

function parseCoinGeckoResponse(json: any, request: HistoricalDataRequest): OHLCVData[] {

  // CoinGecko returns prices, market_caps, total_volumes arrays
  // Each array contains [timestamp, value] pairs
  const prices = json.prices || [];
  const volumes = json.total_volumes || [];

  // Convert to OHLCV format (CoinGecko doesn't provide OHLC, so we approximate)
  const ohlcvData: OHLCVData[] = [];
  const resolutionMs = getResolutionMs(request.resolution);

  for (let i = 0; i < prices.length; i++) {
    const [timestamp, price] = prices[i];
    const volume = volumes[i]?.[1] || 0;

    // Group prices by resolution interval
    const intervalStart = Math.floor(timestamp / resolutionMs) * resolutionMs;
    
    // Find or create OHLCV entry for this interval
    let ohlcv = ohlcvData.find(d => d.timestamp.getTime() === intervalStart);
    
    if (!ohlcv) {
      ohlcv = {
        timestamp: new Date(intervalStart),
        open: price,
        high: price,
        low: price,
        close: price,
        volume: volume
      };
      ohlcvData.push(ohlcv);
    } else {
      // Update high/low/close
      ohlcv.high = Math.max(ohlcv.high, price);
      ohlcv.low = Math.min(ohlcv.low, price);
      ohlcv.close = price;
      ohlcv.volume += volume;
    }
  }

  return ohlcvData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getIntervalParam(resolution: '1m' | '5m' | '1h'): string {
  const intervalMap = {
    '1m': '1m',
    '5m': '5m',
    '1h': '1h'
  };
  return intervalMap[resolution];
}

function getResolutionMs(resolution: '1m' | '5m' | '1h'): number {
  const resolutionMap = {
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '1h': 60 * 60 * 1000
  };
  return resolutionMap[resolution];
}

function calculateDataQuality(data: OHLCVData[], resolution: '1m' | '5m' | '1h'): number {
  if (data.length === 0) return 0;

  let qualityScore = 100;

  // Check for gaps in data
  const resolutionMs = getResolutionMs(resolution);
  let gapCount = 0;
  
  for (let i = 1; i < data.length; i++) {
    const expectedTime = data[i - 1].timestamp.getTime() + resolutionMs;
    const actualTime = data[i].timestamp.getTime();
    const gap = actualTime - expectedTime;
    
    if (gap > resolutionMs * 1.5) {
      gapCount++;
    }
  }

  // Reduce quality score for gaps (max 20 points)
  const gapPenalty = Math.min(20, (gapCount / data.length) * 100);
  qualityScore -= gapPenalty;

  // Check for price anomalies (>20% jumps)
  let anomalyCount = 0;
  
  for (let i = 1; i < data.length; i++) {
    const priceChange = Math.abs((data[i].close - data[i - 1].close) / data[i - 1].close);
    if (priceChange > 0.2) {
      anomalyCount++;
    }
  }

  // Reduce quality score for anomalies (max 10 points)
  const anomalyPenalty = Math.min(10, (anomalyCount / data.length) * 100);
  qualityScore -= anomalyPenalty;

  // Resolution quality bonus
  if (resolution === '1m') {
    qualityScore += 0; // Best resolution, no bonus needed
  } else if (resolution === '5m') {
    qualityScore -= 5; // Slightly lower quality
  } else if (resolution === '1h') {
    qualityScore -= 10; // Lower quality
  }

  return Math.max(0, Math.min(100, Math.round(qualityScore)));
}

/**
 * Store historical prices in database for a trade signal
 */
export async function storeHistoricalPrices(
  tradeSignalId: string,
  data: OHLCVData[],
  source: 'CoinMarketCap' | 'CoinGecko'
): Promise<void> {
  if (data.length === 0) {
    console.warn(`[HistoricalData] No data to store for trade ${tradeSignalId}`);
    return;
  }

  // Batch insert historical prices
  const values = data.map((d, index) => 
    `($1, $${index * 6 + 2}, $${index * 6 + 3}, $${index * 6 + 4}, $${index * 6 + 5}, $${index * 6 + 6}, $${index * 6 + 7}, $${index * 6 + 8})`
  ).join(',');

  const params = [tradeSignalId];
  data.forEach(d => {
    params.push(
      d.timestamp.toISOString(),
      d.open.toString(),
      d.high.toString(),
      d.low.toString(),
      d.close.toString(),
      d.volume.toString(),
      source
    );
  });

  await query(
    `INSERT INTO trade_historical_prices 
      (trade_signal_id, timestamp, open_price, high_price, low_price, close_price, volume, data_source)
    VALUES ${values}
    ON CONFLICT (trade_signal_id, timestamp, data_source) DO NOTHING`,
    params
  );

  console.log(`[HistoricalData] Stored ${data.length} historical prices for trade ${tradeSignalId}`);
}
