/**
 * Historical Price Fetcher API Endpoint
 * 
 * Fetches historical OHLCV data from CoinGecko or CoinMarketCap and stores it in the database.
 * 
 * Requirements: Task 5.2
 * - Accept parameters: symbol, startDate, endDate, timeframe
 * - Fetch OHLCV data from CoinGecko API (primary)
 * - Implement fallback to CoinMarketCap if CoinGecko fails
 * - Support timeframes: 15m, 1h, 4h, 1d, 1w
 * - Handle pagination for large date ranges
 * - Store data in atge_historical_prices table
 * - Avoid duplicate entries (check existing data first)
 * - Return summary: { fetched, stored, duplicates }
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchHistoricalData, storeHistoricalPrices, OHLCVData } from '../../../../lib/atge/historicalData';
import { query } from '../../../../lib/db';

// ============================================================================
// TYPES
// ============================================================================

interface FetchRequest {
  symbol: string;
  startDate: string; // ISO 8601 date string
  endDate: string;   // ISO 8601 date string
  timeframe: '15m' | '1h' | '4h' | '1d' | '1w';
}

interface FetchResponse {
  success: boolean;
  fetched: number;
  stored: number;
  duplicates: number;
  source?: 'CoinMarketCap' | 'CoinGecko';
  dataQualityScore?: number;
  chunks?: number; // Number of pagination chunks used
  error?: string;
}

// ============================================================================
// API HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FetchResponse>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      fetched: 0,
      stored: 0,
      duplicates: 0,
      error: 'Method not allowed. Use GET.'
    });
  }

  try {
    // Extract and validate query parameters
    const { symbol, startDate, endDate, timeframe } = req.query;

    // Validate required parameters
    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({
        success: false,
        fetched: 0,
        stored: 0,
        duplicates: 0,
        error: 'Missing or invalid parameter: symbol'
      });
    }

    if (!startDate || typeof startDate !== 'string') {
      return res.status(400).json({
        success: false,
        fetched: 0,
        stored: 0,
        duplicates: 0,
        error: 'Missing or invalid parameter: startDate'
      });
    }

    if (!endDate || typeof endDate !== 'string') {
      return res.status(400).json({
        success: false,
        fetched: 0,
        stored: 0,
        duplicates: 0,
        error: 'Missing or invalid parameter: endDate'
      });
    }

    if (!timeframe || typeof timeframe !== 'string') {
      return res.status(400).json({
        success: false,
        fetched: 0,
        stored: 0,
        duplicates: 0,
        error: 'Missing or invalid parameter: timeframe'
      });
    }

    // Validate timeframe
    const validTimeframes = ['15m', '1h', '4h', '1d', '1w'];
    if (!validTimeframes.includes(timeframe)) {
      return res.status(400).json({
        success: false,
        fetched: 0,
        stored: 0,
        duplicates: 0,
        error: `Invalid timeframe. Must be one of: ${validTimeframes.join(', ')}`
      });
    }

    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate dates
    if (isNaN(start.getTime())) {
      return res.status(400).json({
        success: false,
        fetched: 0,
        stored: 0,
        duplicates: 0,
        error: 'Invalid startDate format. Use ISO 8601 format (e.g., 2025-01-01T00:00:00Z)'
      });
    }

    if (isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        fetched: 0,
        stored: 0,
        duplicates: 0,
        error: 'Invalid endDate format. Use ISO 8601 format (e.g., 2025-01-01T00:00:00Z)'
      });
    }

    if (start >= end) {
      return res.status(400).json({
        success: false,
        fetched: 0,
        stored: 0,
        duplicates: 0,
        error: 'startDate must be before endDate'
      });
    }

    // Validate symbol
    const validSymbols = ['BTC', 'ETH'];
    if (!validSymbols.includes(symbol.toUpperCase())) {
      return res.status(400).json({
        success: false,
        fetched: 0,
        stored: 0,
        duplicates: 0,
        error: `Unsupported symbol. Currently supported: ${validSymbols.join(', ')}`
      });
    }

    console.log(`[HistoricalPrices API] Fetching ${symbol} data from ${startDate} to ${endDate} (${timeframe})`);

    // Convert timeframe to resolution
    const resolution = convertTimeframeToResolution(timeframe as '15m' | '1h' | '4h' | '1d' | '1w');

    // Check for existing data to avoid duplicates
    const existingData = await checkExistingData(symbol, start, end, timeframe);
    console.log(`[HistoricalPrices API] Found ${existingData.length} existing data points`);

    // Handle pagination for large date ranges
    const dateRangeMs = end.getTime() - start.getTime();
    const maxChunkSizeMs = getMaxChunkSize(timeframe as '15m' | '1h' | '4h' | '1d' | '1w');
    
    let allFetchedData: OHLCVData[] = [];
    let lastSource: 'CoinMarketCap' | 'CoinGecko' = 'CoinMarketCap';
    let totalDataQualityScore = 0;
    let chunkCount = 0;

    if (dateRangeMs > maxChunkSizeMs) {
      // Large range - paginate into chunks
      console.log(`[HistoricalPrices API] Large date range detected (${Math.ceil(dateRangeMs / maxChunkSizeMs)} chunks)`);
      
      let currentStart = new Date(start);
      
      while (currentStart < end) {
        const currentEnd = new Date(Math.min(
          currentStart.getTime() + maxChunkSizeMs,
          end.getTime()
        ));
        
        console.log(`[HistoricalPrices API] Fetching chunk ${chunkCount + 1}: ${currentStart.toISOString()} to ${currentEnd.toISOString()}`);
        
        try {
          const chunkResponse = await fetchHistoricalData({
            symbol: symbol.toUpperCase(),
            startTime: currentStart,
            endTime: currentEnd,
            resolution
          }, 1); // Priority 1 for API-triggered requests
          
          allFetchedData = allFetchedData.concat(chunkResponse.data);
          lastSource = chunkResponse.source;
          totalDataQualityScore += chunkResponse.dataQualityScore;
          chunkCount++;
          
          console.log(`[HistoricalPrices API] Chunk ${chunkCount} fetched: ${chunkResponse.data.length} data points from ${chunkResponse.source}`);
          
          // Move to next chunk
          currentStart = new Date(currentEnd.getTime() + 1); // Add 1ms to avoid overlap
          
          // Add delay between chunks to respect rate limits (2 seconds)
          if (currentStart < end) {
            console.log(`[HistoricalPrices API] Waiting 2s before next chunk...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        } catch (error) {
          console.error(`[HistoricalPrices API] Failed to fetch chunk ${chunkCount + 1}:`, error);
          // Continue with next chunk instead of failing completely
          currentStart = new Date(currentEnd.getTime() + 1);
        }
      }
      
      console.log(`[HistoricalPrices API] Pagination complete: ${allFetchedData.length} total data points from ${chunkCount} chunks`);
    } else {
      // Small range - fetch in one request
      const historicalDataResponse = await fetchHistoricalData({
        symbol: symbol.toUpperCase(),
        startTime: start,
        endTime: end,
        resolution
      }, 1); // Priority 1 for API-triggered requests

      allFetchedData = historicalDataResponse.data;
      lastSource = historicalDataResponse.source;
      totalDataQualityScore = historicalDataResponse.dataQualityScore;
      chunkCount = 1;
      
      console.log(`[HistoricalPrices API] Fetched ${allFetchedData.length} data points from ${historicalDataResponse.source}`);
    }

    // Calculate average data quality score
    const avgDataQualityScore = chunkCount > 0 ? totalDataQualityScore / chunkCount : 0;

    // Filter out duplicates
    const newData = filterDuplicates(allFetchedData, existingData);
    console.log(`[HistoricalPrices API] ${newData.length} new data points to store (${allFetchedData.length - newData.length} duplicates)`);

    // Store new data in database
    if (newData.length > 0) {
      await storeHistoricalPricesInTable(
        symbol.toUpperCase(),
        newData,
        timeframe as '15m' | '1h' | '4h' | '1d' | '1w',
        lastSource
      );
    }

    // Return summary
    return res.status(200).json({
      success: true,
      fetched: allFetchedData.length,
      stored: newData.length,
      duplicates: allFetchedData.length - newData.length,
      source: lastSource,
      dataQualityScore: Math.round(avgDataQualityScore),
      chunks: chunkCount
    });

  } catch (error) {
    console.error('[HistoricalPrices API] Error:', error);
    
    return res.status(500).json({
      success: false,
      fetched: 0,
      stored: 0,
      duplicates: 0,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert timeframe to resolution for API calls
 */
function convertTimeframeToResolution(timeframe: '15m' | '1h' | '4h' | '1d' | '1w'): '1m' | '5m' | '1h' {
  // Map timeframes to appropriate resolutions
  const resolutionMap: Record<string, '1m' | '5m' | '1h'> = {
    '15m': '1m',  // 1-minute data for 15-minute timeframe
    '1h': '1m',   // 1-minute data for 1-hour timeframe
    '4h': '5m',   // 5-minute data for 4-hour timeframe
    '1d': '1h',   // 1-hour data for 1-day timeframe
    '1w': '1h'    // 1-hour data for 1-week timeframe
  };
  
  return resolutionMap[timeframe] || '1m';
}

/**
 * Get maximum chunk size in milliseconds for pagination
 * Prevents API timeouts and rate limit issues for large date ranges
 */
function getMaxChunkSize(timeframe: '15m' | '1h' | '4h' | '1d' | '1w'): number {
  // Define maximum chunk sizes based on timeframe
  // These are conservative limits to ensure API reliability
  const chunkSizeMap: Record<string, number> = {
    '15m': 7 * 24 * 60 * 60 * 1000,    // 7 days for 15-minute data
    '1h': 14 * 24 * 60 * 60 * 1000,    // 14 days for 1-hour data
    '4h': 30 * 24 * 60 * 60 * 1000,    // 30 days for 4-hour data
    '1d': 90 * 24 * 60 * 60 * 1000,    // 90 days for 1-day data
    '1w': 365 * 24 * 60 * 60 * 1000    // 365 days for 1-week data
  };
  
  return chunkSizeMap[timeframe] || 7 * 24 * 60 * 60 * 1000; // Default to 7 days
}

/**
 * Check for existing data in the database
 */
async function checkExistingData(
  symbol: string,
  startDate: Date,
  endDate: Date,
  timeframe: string
): Promise<OHLCVData[]> {
  const result = await query(
    `SELECT 
      timestamp,
      open,
      high,
      low,
      close,
      volume
    FROM atge_historical_prices
    WHERE symbol = $1
      AND timestamp >= $2
      AND timestamp <= $3
      AND timeframe = $4
    ORDER BY timestamp ASC`,
    [symbol.toUpperCase(), startDate, endDate, timeframe]
  );

  return result.rows.map(row => ({
    timestamp: new Date(row.timestamp),
    open: parseFloat(row.open),
    high: parseFloat(row.high),
    low: parseFloat(row.low),
    close: parseFloat(row.close),
    volume: parseFloat(row.volume || '0')
  }));
}

/**
 * Filter out duplicate data points
 */
function filterDuplicates(
  fetchedData: OHLCVData[],
  existingData: OHLCVData[]
): OHLCVData[] {
  // Create a Set of existing timestamps for fast lookup
  const existingTimestamps = new Set(
    existingData.map(d => d.timestamp.getTime())
  );

  // Filter out data points that already exist
  return fetchedData.filter(d => !existingTimestamps.has(d.timestamp.getTime()));
}

/**
 * Store historical prices in the atge_historical_prices table
 * 
 * FIXED: Added proper SQL parameter placeholders ($1, $2, etc.) and corrected count to 9 parameters
 */
async function storeHistoricalPricesInTable(
  symbol: string,
  data: OHLCVData[],
  timeframe: '15m' | '1h' | '4h' | '1d' | '1w',
  source: 'CoinMarketCap' | 'CoinGecko'
): Promise<void> {
  if (data.length === 0) {
    console.warn(`[HistoricalPrices API] No data to store`);
    return;
  }

  // Batch insert historical prices with proper SQL placeholders
  const values: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  for (const d of data) {
    // Create placeholder string with $ signs for PostgreSQL
    const placeholders = [];
    for (let i = 0; i < 9; i++) {
      placeholders.push(`$${paramIndex + i}`);
    }
    values.push(`(${placeholders.join(', ')})`);
    
    // Push all 9 parameters
    params.push(
      symbol,
      d.timestamp.toISOString(),
      d.open.toString(),
      d.high.toString(),
      d.low.toString(),
      d.close.toString(),
      d.volume.toString(),
      timeframe,
      source
    );
    paramIndex += 9;
  }

  await query(
    `INSERT INTO atge_historical_prices 
      (symbol, timestamp, open, high, low, close, volume, timeframe, data_source)
    VALUES ${values.join(', ')}
    ON CONFLICT (symbol, timestamp, timeframe) DO NOTHING`,
    params
  );

  console.log(`[HistoricalPrices API] Stored ${data.length} historical prices for ${symbol}`);
}
