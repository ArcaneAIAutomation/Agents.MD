/**
 * Historical Price Query API for ATGE
 * 
 * Retrieves historical OHLCV data from the database for backtesting calculations.
 * Implements caching (5-minute TTL) to reduce database load.
 * 
 * Requirements: Task 5.3 - Historical Price Query API
 * 
 * Query Parameters:
 * - symbol: Cryptocurrency symbol (e.g., 'BTC', 'ETH')
 * - startDate: ISO 8601 start date (e.g., '2025-01-01T00:00:00Z')
 * - endDate: ISO 8601 end date (e.g., '2025-01-01T23:59:59Z')
 * - timeframe: Data timeframe ('15m', '1h', '4h', '1d', '1w')
 * 
 * Response Format:
 * {
 *   symbol: 'BTC',
 *   timeframe: '15m',
 *   data: [
 *     {
 *       timestamp: '2025-01-01T00:00:00Z',
 *       open: 95000,
 *       high: 95500,
 *       low: 94800,
 *       close: 95200,
 *       volume: 1234567
 *     },
 *     ...
 *   ],
 *   dataQuality: 98.5,
 *   gaps: []
 * }
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import {
  queryHistoricalPrices,
  HistoricalPriceQueryRequest,
  HistoricalPriceQueryResponse
} from '../../../../lib/atge/historicalPriceQuery';

// ============================================================================
// TYPES
// ============================================================================

interface ErrorResponse {
  success: false;
  error: string;
  details?: string;
}

type ApiResponse = HistoricalPriceQueryResponse | ErrorResponse;

// ============================================================================
// API HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    // Extract and validate query parameters
    const { symbol, startDate, endDate, timeframe } = req.query;

    // Validate required parameters
    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid parameter: symbol',
        details: 'Symbol must be a string (e.g., "BTC", "ETH")'
      });
    }

    if (!startDate || typeof startDate !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid parameter: startDate',
        details: 'Start date must be an ISO 8601 string (e.g., "2025-01-01T00:00:00Z")'
      });
    }

    if (!endDate || typeof endDate !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid parameter: endDate',
        details: 'End date must be an ISO 8601 string (e.g., "2025-01-01T23:59:59Z")'
      });
    }

    if (!timeframe || typeof timeframe !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid parameter: timeframe',
        details: 'Timeframe must be one of: "15m", "1h", "4h", "1d", "1w"'
      });
    }

    // Validate timeframe value
    const validTimeframes = ['15m', '1h', '4h', '1d', '1w'];
    if (!validTimeframes.includes(timeframe)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid timeframe',
        details: `Timeframe must be one of: ${validTimeframes.join(', ')}`
      });
    }

    // Validate date format
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    if (isNaN(startDateObj.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid startDate format',
        details: 'Start date must be a valid ISO 8601 date string'
      });
    }

    if (isNaN(endDateObj.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid endDate format',
        details: 'End date must be a valid ISO 8601 date string'
      });
    }

    // Validate date range
    if (endDateObj <= startDateObj) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date range',
        details: 'End date must be after start date'
      });
    }

    // Check if date range is reasonable (max 90 days)
    const maxRangeMs = 90 * 24 * 60 * 60 * 1000; // 90 days
    const rangeMs = endDateObj.getTime() - startDateObj.getTime();

    if (rangeMs > maxRangeMs) {
      return res.status(400).json({
        success: false,
        error: 'Date range too large',
        details: 'Maximum date range is 90 days'
      });
    }

    // Build request object
    const request: HistoricalPriceQueryRequest = {
      symbol: symbol.toUpperCase(),
      startDate,
      endDate,
      timeframe: timeframe as '15m' | '1h' | '4h' | '1d' | '1w'
    };

    console.log(`[HistoricalPriceQuery API] Query: ${request.symbol} ${request.timeframe} from ${request.startDate} to ${request.endDate}`);

    // Query historical prices with performance monitoring
    const startTime = Date.now();
    const response = await queryHistoricalPrices(request);
    const totalDuration = Date.now() - startTime;

    // Log performance metrics
    console.log(`[HistoricalPriceQuery API] Total response time: ${totalDuration}ms for ${response.data.length} candles`);
    
    // Warn if performance target not met
    if (totalDuration > 500) {
      console.warn(`[HistoricalPriceQuery API] ⚠️  Performance warning: ${totalDuration}ms exceeds 500ms target`);
    }

    // Set cache headers (5-minute cache)
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    
    // Add performance header for monitoring
    res.setHeader('X-Query-Duration-Ms', totalDuration.toString());

    // Return response
    return res.status(200).json(response);

  } catch (error) {
    console.error('[HistoricalPriceQuery API] Error:', error);

    // Return error response
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}
