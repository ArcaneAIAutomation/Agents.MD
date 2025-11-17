/**
 * Historical Price Query Utility for ATGE
 * 
 * Provides functions to query historical OHLCV data from the database
 * for backtesting calculations.
 * 
 * Requirements: Task 5.3 - Historical Price Query API
 * 
 * Performance Optimizations:
 * - 5-minute in-memory caching (reduces database load)
 * - Optimized database query using composite index (symbol, timeframe, timestamp)
 * - Efficient data quality analysis (single pass through data)
 * - Target: <500ms response time for 1000 candles
 */

import { queryMany } from '../db';
import { validateDataQuality, DataQualityReport } from './dataQualityValidator';

// ============================================================================
// TYPES
// ============================================================================

export interface OHLCVDataPoint {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface HistoricalPriceQueryRequest {
  symbol: string;
  startDate: string;
  endDate: string;
  timeframe: '15m' | '1h' | '4h' | '1d' | '1w';
}

export interface HistoricalPriceQueryResponse {
  symbol: string;
  timeframe: string;
  data: OHLCVDataPoint[];
  dataQuality: number;
  gaps: Array<{ start: string; end: string }>;
  qualityReport?: DataQualityReport;
}

// ============================================================================
// CACHE
// ============================================================================

interface CacheEntry {
  data: HistoricalPriceQueryResponse;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCacheKey(request: HistoricalPriceQueryRequest): string {
  return `${request.symbol}:${request.startDate}:${request.endDate}:${request.timeframe}`;
}

function getCachedData(request: HistoricalPriceQueryRequest): HistoricalPriceQueryResponse | null {
  const key = getCacheKey(request);
  const entry = cache.get(key);
  
  if (!entry) {
    return null;
  }
  
  // Check if cache is still valid
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  
  return entry.data;
}

function setCachedData(request: HistoricalPriceQueryRequest, data: HistoricalPriceQueryResponse): void {
  const key = getCacheKey(request);
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Query historical prices from database
 * Returns data sorted by timestamp ascending
 * Implements 5-minute caching to reduce database load
 */
export async function queryHistoricalPrices(
  request: HistoricalPriceQueryRequest
): Promise<HistoricalPriceQueryResponse> {
  // Check cache first
  const cached = getCachedData(request);
  if (cached) {
    console.log(`[HistoricalPriceQuery] Cache hit for ${request.symbol} ${request.timeframe}`);
    return cached;
  }
  
  console.log(`[HistoricalPriceQuery] Querying database for ${request.symbol} ${request.timeframe}`);
  
  // Query database with optimized query
  // Uses composite index (symbol, timestamp, timeframe) for fast lookups
  const startTime = Date.now();
  const rows = await queryMany(
    `SELECT 
      timestamp,
      open as open,
      high as high,
      low as low,
      close as close,
      volume
    FROM atge_historical_prices
    WHERE symbol = $1
      AND timeframe = $4
      AND timestamp >= $2::timestamptz
      AND timestamp <= $3::timestamptz
    ORDER BY timestamp ASC`,
    [request.symbol, request.startDate, request.endDate, request.timeframe]
  );
  const queryDuration = Date.now() - startTime;
  console.log(`[HistoricalPriceQuery] Database query took ${queryDuration}ms for ${rows.length} rows`);
  
  // Transform database rows to OHLCV data points
  const data: OHLCVDataPoint[] = rows.map(row => ({
    timestamp: new Date(row.timestamp).toISOString(),
    open: parseFloat(row.open),
    high: parseFloat(row.high),
    low: parseFloat(row.low),
    close: parseFloat(row.close),
    volume: parseFloat(row.volume || '0')
  }));
  
  // Use comprehensive data quality validator (Task 5.4)
  const qualityReport = validateDataQuality(
    data,
    request.startDate,
    request.endDate,
    request.timeframe
  );
  
  // Map gaps to legacy format for backward compatibility
  const gaps = qualityReport.gaps.map(gap => ({
    start: gap.startTime,
    end: gap.endTime
  }));
  
  const response: HistoricalPriceQueryResponse = {
    symbol: request.symbol,
    timeframe: request.timeframe,
    data,
    dataQuality: qualityReport.overallScore,
    gaps,
    qualityReport
  };
  
  // Cache the response
  setCachedData(request, response);
  
  console.log(`[HistoricalPriceQuery] Returned ${data.length} data points with ${qualityReport.overallScore}% quality (${qualityReport.recommendation})`);
  
  return response;
}

// ============================================================================
// DATA QUALITY ANALYSIS
// ============================================================================

/**
 * Analyze data quality in a single pass for optimal performance
 * Checks completeness, validity, and consistency
 */
function analyzeDataQuality(
  data: OHLCVDataPoint[],
  request: HistoricalPriceQueryRequest
): { dataQuality: number; gaps: Array<{ start: string; end: string }> } {
  if (data.length === 0) {
    return { dataQuality: 0, gaps: [] };
  }
  
  // Calculate expected number of data points based on timeframe
  const startTime = new Date(request.startDate).getTime();
  const endTime = new Date(request.endDate).getTime();
  const timeRangeMs = endTime - startTime;
  const intervalMs = getTimeframeMs(request.timeframe);
  const expectedPoints = Math.floor(timeRangeMs / intervalMs);
  
  // Calculate completeness percentage
  const actualPoints = data.length;
  const completeness = Math.min(100, (actualPoints / expectedPoints) * 100);
  
  // Single pass through data for gap detection and anomaly checking
  const gaps: Array<{ start: string; end: string }> = [];
  const maxGapMs = intervalMs * 1.5; // Allow 50% tolerance
  let anomalyCount = 0;
  
  for (let i = 1; i < data.length; i++) {
    const prevTime = new Date(data[i - 1].timestamp).getTime();
    const currTime = new Date(data[i].timestamp).getTime();
    const gap = currTime - prevTime;
    
    // Check for gaps
    if (gap > maxGapMs) {
      gaps.push({
        start: data[i - 1].timestamp,
        end: data[i].timestamp
      });
    }
    
    // Check for price anomalies (combined in single loop for performance)
    const prevClose = data[i - 1].close;
    const currOpen = data[i].open;
    const priceChange = Math.abs((currOpen - prevClose) / prevClose);
    
    // Flag price changes > 20% as anomalies
    if (priceChange > 0.2) {
      anomalyCount++;
    }
    
    // Validate OHLC relationships
    if (data[i].high < data[i].open || data[i].high < data[i].close ||
        data[i].low > data[i].open || data[i].low > data[i].close) {
      anomalyCount++;
    }
  }
  
  // Calculate validity score
  const anomalyPenalty = Math.min(30, (anomalyCount / data.length) * 100);
  const validityScore = 100 - anomalyPenalty;
  
  // Calculate consistency score
  const gapPenalty = Math.min(10, (gaps.length / data.length) * 100);
  const consistencyScore = 100 - gapPenalty;
  
  // Calculate final data quality score
  // Formula: completeness (60%) + validity (30%) + consistency (10%)
  const dataQuality = Math.round(
    (completeness * 0.6) + (validityScore * 0.3) + (consistencyScore * 0.1)
  );
  
  return {
    dataQuality: Math.max(0, Math.min(100, dataQuality)),
    gaps
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getTimeframeMs(timeframe: '15m' | '1h' | '4h' | '1d' | '1w'): number {
  const timeframeMap = {
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
    '1w': 7 * 24 * 60 * 60 * 1000
  };
  return timeframeMap[timeframe];
}
