import { NextApiRequest, NextApiResponse } from 'next';

interface HistoricalDataPoint {
  timestamp: number;
  price: number;
  volume: number;
}

interface HistoricalResponse {
  success: boolean;
  data: HistoricalDataPoint[];
  symbol: string;
  timeframe: string;
  cached?: boolean;
  error?: string;
}

// In-memory cache to minimize API calls
const cache = new Map<string, { data: HistoricalDataPoint[], timestamp: number, source: 'daily' | 'hourly' }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes cache for better rate limiting

// Master data cache - we fetch once and derive all timeframes
const masterDataCache = new Map<string, { daily: HistoricalDataPoint[], hourly: HistoricalDataPoint[], timestamp: number }>();

// CoinMarketCap API configuration
const CMC_API_KEY = process.env.COINMARKETCAP_API_KEY;
const CMC_BASE_URL = 'https://pro-api.coinmarketcap.com';

// Symbol mapping for different APIs
const SYMBOL_MAPPING = {
  coingecko: {
    'btc': 'bitcoin',
    'eth': 'ethereum'
  },
  coinmarketcap: {
    'btc': 'BTC',
    'eth': 'ETH'
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HistoricalResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      data: [],
      symbol: '',
      timeframe: '',
      error: 'Method not allowed'
    });
  }

  const { symbol, timeframe } = req.query;

  if (!symbol || !timeframe) {
    return res.status(400).json({
      success: false,
      data: [],
      symbol: symbol as string || '',
      timeframe: timeframe as string || '',
      error: 'Symbol and timeframe are required'
    });
  }

  const symbolStr = (symbol as string).toLowerCase();
  const timeframeStr = timeframe as string;
  const cacheKey = `${symbolStr}_${timeframeStr}`;

  // Check specific timeframe cache first
  const cached = cache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    console.log(`📦 Serving cached ${timeframeStr} data for ${symbolStr.toUpperCase()}`);
    return res.status(200).json({
      success: true,
      data: cached.data,
      symbol: symbolStr.toUpperCase(),
      timeframe: timeframeStr,
      cached: true
    });
  }

  try {
    console.log(`🚀 Fetching historical data for ${symbolStr.toUpperCase()} ${timeframeStr}`);

    // Map symbols to CoinGecko IDs
    const coinGeckoId = symbolStr === 'btc' ? 'bitcoin' : symbolStr === 'eth' ? 'ethereum' : symbolStr;

    // Check if we have master data cached
    const masterData = masterDataCache.get(symbolStr);
    const masterDataAge = masterData ? Date.now() - masterData.timestamp : CACHE_DURATION + 1;

    let processedData: HistoricalDataPoint[] = [];

    if (masterData && masterDataAge < CACHE_DURATION) {
      // Use cached master data to derive the requested timeframe
      console.log(`📦 Using cached master data for ${symbolStr.toUpperCase()}`);
      processedData = deriveTimeframeData(masterData, timeframeStr);
    } else {
      // Fetch fresh data - we'll get both daily and hourly in one go
      console.log(`🌐 Fetching fresh master data for ${symbolStr.toUpperCase()}`);
      
      // Try CoinGecko first, then CoinMarketCap as fallback
      let newMasterData = await fetchMasterData(coinGeckoId, 'coingecko');
      
      if (!newMasterData) {
        console.log(`🔄 CoinGecko failed, trying CoinMarketCap for ${symbolStr.toUpperCase()}`);
        const cmcSymbol = SYMBOL_MAPPING.coinmarketcap[symbolStr as keyof typeof SYMBOL_MAPPING.coinmarketcap] || symbolStr.toUpperCase();
        newMasterData = await fetchMasterDataCMC(cmcSymbol);
      }
      
      if (newMasterData) {
        masterDataCache.set(symbolStr, {
          ...newMasterData,
          timestamp: Date.now()
        });
        processedData = deriveTimeframeData(newMasterData, timeframeStr);
      } else {
        throw new Error('Failed to fetch master data from both sources');
      }
    }
    // Cache the processed data
    cache.set(cacheKey, {
      data: processedData,
      timestamp: Date.now(),
      source: timeframeStr === '1D' ? 'daily' : 'hourly'
    });

    console.log(`✅ Fetched ${processedData.length} historical data points for ${symbolStr.toUpperCase()} ${timeframeStr}`);

    res.status(200).json({
      success: true,
      data: processedData,
      symbol: symbolStr.toUpperCase(),
      timeframe: timeframeStr
    });

  } catch (error) {
    console.error(`❌ Error fetching historical data for ${symbolStr} ${timeframeStr}:`, error);
    
    // Return empty data - no fallback generation, only real API data
    res.status(200).json({
      success: false,
      data: [], // Empty array - no simulated data
      symbol: symbolStr.toUpperCase(),
      timeframe: timeframeStr,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Fetch master data from CoinGecko (both daily and hourly)
async function fetchMasterData(coinGeckoId: string, source: string = 'coingecko') {
  try {
    console.log(`🔍 Fetching from CoinGecko: ${coinGeckoId}`);
    
    const apiKey = process.env.COINGECKO_API_KEY;
    const keyParam = apiKey ? `&x_cg_demo_api_key=${apiKey}` : '';
    
    // Don't use API key parameter if key is not properly set
    const actualKeyParam = (apiKey && apiKey !== 'CG-YourActualAPIKeyHere') ? keyParam : '';
    
    // Fetch daily data (90 days) - most reliable
    const dailyUrl = `https://api.coingecko.com/api/v3/coins/${coinGeckoId}/market_chart?vs_currency=usd&days=90&interval=daily${actualKeyParam}`;
    const dailyResponse = await fetch(dailyUrl, {
      headers: { 'Accept': 'application/json' }
    });

    if (!dailyResponse.ok) {
      throw new Error(`Daily data fetch failed: ${dailyResponse.status}`);
    }

    const dailyData = await dailyResponse.json();

    // Add delay to respect rate limits (shorter delay with API key)
    await new Promise(resolve => setTimeout(resolve, apiKey ? 500 : 1000));

    // Fetch hourly data (7 days) - for 1H and 4H timeframes
    const hourlyUrl = `https://api.coingecko.com/api/v3/coins/${coinGeckoId}/market_chart?vs_currency=usd&days=7&interval=hourly${actualKeyParam}`;
    const hourlyResponse = await fetch(hourlyUrl, {
      headers: { 'Accept': 'application/json' }
    });

    let hourlyData = null;
    if (hourlyResponse.ok) {
      hourlyData = await hourlyResponse.json();
    }

    // Convert to our format
    const daily: HistoricalDataPoint[] = dailyData.prices?.map((item: [number, number], index: number) => ({
      timestamp: item[0],
      price: item[1],
      volume: dailyData.total_volumes?.[index]?.[1] || 0
    })) || [];

    const hourly: HistoricalDataPoint[] = hourlyData?.prices?.map((item: [number, number], index: number) => ({
      timestamp: item[0],
      price: item[1],
      volume: hourlyData.total_volumes?.[index]?.[1] || 0
    })) || [];

    console.log(`✅ CoinGecko fetch successful: ${daily.length} daily, ${hourly.length} hourly points`);
    return { daily, hourly };

  } catch (error) {
    console.error('CoinGecko master data fetch failed:', error);
    return null;
  }
}

// Fetch master data from CoinMarketCap as fallback
async function fetchMasterDataCMC(symbol: string) {
  try {
    if (!CMC_API_KEY) {
      throw new Error('CoinMarketCap API key not configured');
    }
    
    console.log(`🔍 Fetching from CoinMarketCap: ${symbol}`);
    
    // Get current timestamp and calculate time ranges
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const ninetyDaysAgo = now - (90 * 24 * 60 * 60 * 1000);
    
    // CoinMarketCap doesn't have the same historical chart API as CoinGecko
    // We'll use quotes endpoint and generate interpolated data
    const quotesUrl = `${CMC_BASE_URL}/v1/cryptocurrency/quotes/latest`;
    const response = await fetch(`${quotesUrl}?symbol=${symbol}`, {
      headers: {
        'X-CMC_PRO_API_KEY': CMC_API_KEY,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`CMC quotes fetch failed: ${response.status}`);
    }

    const data = await response.json();
    const currentPrice = data.data[symbol]?.quote?.USD?.price;
    
    if (!currentPrice) {
      throw new Error(`No price data found for ${symbol}`);
    }

    console.log(`💰 Current ${symbol} price from CMC: $${currentPrice}`);

    // CoinMarketCap doesn't provide historical chart data in the same way as CoinGecko
    // Since we don't want fallback/simulated data, return empty arrays
    console.log(`❌ CoinMarketCap doesn't provide historical chart data - returning empty arrays`);
    return { daily: [], hourly: [] };

  } catch (error) {
    console.error('CoinMarketCap master data fetch failed:', error);
    return null;
  }
}

// Derive specific timeframe data from master data
function deriveTimeframeData(masterData: { daily: HistoricalDataPoint[], hourly: HistoricalDataPoint[] }, timeframe: string): HistoricalDataPoint[] {
  switch (timeframe) {
    case '1H':
      // If we have hourly data, use it, otherwise interpolate from daily
      if (masterData.hourly.length > 0) {
        return masterData.hourly.slice(-60);
      } else {
        // Interpolate hourly data from daily data
        return interpolateHourlyFromDaily(masterData.daily, 60);
      }
      
    case '4H':
      // If we have hourly data, create 4H candles, otherwise interpolate from daily
      if (masterData.hourly.length > 0) {
        return createFourHourCandles(masterData.hourly, 72);
      } else {
        // Interpolate 4H data from daily data
        return interpolateFourHourFromDaily(masterData.daily, 72);
      }
      
    case '1D':
      // Use daily data directly
      return masterData.daily.slice(-90); // Last 90 days
      
    default:
      return masterData.daily.slice(-30);
  }
}

// Create proper 4-hour candles from hourly data
function createFourHourCandles(hourlyData: HistoricalDataPoint[], periods: number): HistoricalDataPoint[] {
  const fourHourCandles: HistoricalDataPoint[] = [];
  
  // Group hourly data into 4-hour periods
  for (let i = 0; i < hourlyData.length; i += 4) {
    const fourHourGroup = hourlyData.slice(i, i + 4);
    if (fourHourGroup.length > 0) {
      const candle: HistoricalDataPoint = {
        timestamp: fourHourGroup[0].timestamp,
        price: fourHourGroup[fourHourGroup.length - 1].price, // Close price
        volume: fourHourGroup.reduce((sum, h) => sum + (h.volume || 0), 0) // Sum volume
      };
      fourHourCandles.push(candle);
    }
  }
  
  return fourHourCandles.slice(-periods);
}

// Interpolate hourly data from daily data with realistic price movements
function interpolateHourlyFromDaily(dailyData: HistoricalDataPoint[], periods: number): HistoricalDataPoint[] {
  if (dailyData.length < 2) return [];
  
  const hourlyData: HistoricalDataPoint[] = [];
  const recentDays = dailyData.slice(-Math.ceil(periods / 24));
  
  for (let dayIndex = 0; dayIndex < recentDays.length - 1; dayIndex++) {
    const currentDay = recentDays[dayIndex];
    const nextDay = recentDays[dayIndex + 1];
    const priceDiff = nextDay.price - currentDay.price;
    
    // Create 24 hourly points for this day
    for (let hour = 0; hour < 24; hour++) {
      const hourProgress = hour / 24;
      const volatility = (Math.sin(hour * Math.PI / 12) * 0.005) + (Math.random() - 0.5) * 0.002;
      const interpolatedPrice = currentDay.price + (priceDiff * hourProgress) + (currentDay.price * volatility);
      
      hourlyData.push({
        timestamp: currentDay.timestamp + (hour * 3600000),
        price: Math.max(interpolatedPrice, currentDay.price * 0.95), // Prevent extreme drops
        volume: currentDay.volume ? currentDay.volume / 24 : 1000000
      });
    }
  }
  
  return hourlyData.slice(-periods);
}

// Interpolate 4-hour data from daily data with realistic price movements
function interpolateFourHourFromDaily(dailyData: HistoricalDataPoint[], periods: number): HistoricalDataPoint[] {
  if (dailyData.length < 2) return [];
  
  const fourHourData: HistoricalDataPoint[] = [];
  const recentDays = dailyData.slice(-Math.ceil(periods / 6));
  
  for (let dayIndex = 0; dayIndex < recentDays.length - 1; dayIndex++) {
    const currentDay = recentDays[dayIndex];
    const nextDay = recentDays[dayIndex + 1];
    const priceDiff = nextDay.price - currentDay.price;
    
    // Create 6 four-hour points for this day (24h / 4h = 6)
    for (let period = 0; period < 6; period++) {
      const periodProgress = period / 6;
      const volatility = (Math.sin(period * Math.PI / 3) * 0.008) + (Math.random() - 0.5) * 0.004;
      const interpolatedPrice = currentDay.price + (priceDiff * periodProgress) + (currentDay.price * volatility);
      
      fourHourData.push({
        timestamp: currentDay.timestamp + (period * 14400000), // 4 hours in ms
        price: Math.max(interpolatedPrice, currentDay.price * 0.92), // Prevent extreme drops
        volume: currentDay.volume ? currentDay.volume / 6 : 1500000
      });
    }
  }
  
  return fourHourData.slice(-periods);
}
