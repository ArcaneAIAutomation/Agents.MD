/**
 * Einstein Data Refresh API Endpoint
 * 
 * Handles real-time data refresh requests from the RefreshButton component.
 * Re-fetches ALL data from all 13+ APIs and validates accuracy.
 * 
 * Requirements: 16.1, 16.2, 16.3, 16.4, 16.5
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { DataAccuracyVerifier } from '../../../lib/einstein/data/verifier';
import type { Timeframe } from '../../../lib/einstein/types';

// ============================================================================
// Types
// ============================================================================

interface RefreshDataRequest {
  symbol: string;
  timeframe?: Timeframe;
}

interface RefreshDataResponse {
  success: boolean;
  dataQuality: {
    overall: number;
    market: number;
    sentiment: number;
    onChain: number;
    technical: number;
    sources: {
      successful: string[];
      failed: string[];
    };
  };
  changes: {
    priceChanged: boolean;
    priceDelta: number;
    indicatorsChanged: string[];
    sentimentChanged: boolean;
    onChainChanged: boolean;
    significantChanges: boolean;
  };
  timestamp: string;
  duration: number;
  error?: string;
}

// ============================================================================
// API Handler
// ============================================================================

/**
 * POST /api/einstein/refresh-data
 * 
 * Refresh all data from all 13+ APIs and validate accuracy
 * 
 * Requirement 16.1: WHEN the user clicks "Refresh" on a trade signal THEN 
 * the system SHALL re-fetch market data, technical indicators, sentiment, 
 * and on-chain data
 * 
 * @param req - Next.js API request
 * @param res - Next.js API response
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RefreshDataResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      dataQuality: {
        overall: 0,
        market: 0,
        sentiment: 0,
        onChain: 0,
        technical: 0,
        sources: { successful: [], failed: [] }
      },
      changes: {
        priceChanged: false,
        priceDelta: 0,
        indicatorsChanged: [],
        sentimentChanged: false,
        onChainChanged: false,
        significantChanges: false
      },
      timestamp: new Date().toISOString(),
      duration: 0,
      error: 'Method not allowed. Use POST.'
    });
  }

  const startTime = Date.now();

  try {
    // Parse request body
    const { symbol, timeframe = '1h' } as RefreshDataRequest = req.body;

    // Validate symbol
    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({
        success: false,
        dataQuality: {
          overall: 0,
          market: 0,
          sentiment: 0,
          onChain: 0,
          technical: 0,
          sources: { successful: [], failed: [] }
        },
        changes: {
          priceChanged: false,
          priceDelta: 0,
          indicatorsChanged: [],
          sentimentChanged: false,
          onChainChanged: false,
          significantChanges: false
        },
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        error: 'Invalid symbol parameter'
      });
    }

    // Validate timeframe
    const validTimeframes: Timeframe[] = ['15m', '1h', '4h', '1d'];
    if (timeframe && !validTimeframes.includes(timeframe)) {
      return res.status(400).json({
        success: false,
        dataQuality: {
          overall: 0,
          market: 0,
          sentiment: 0,
          onChain: 0,
          technical: 0,
          sources: { successful: [], failed: [] }
        },
        changes: {
          priceChanged: false,
          priceDelta: 0,
          indicatorsChanged: [],
          sentimentChanged: false,
          onChainChanged: false,
          significantChanges: false
        },
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        error: `Invalid timeframe. Must be one of: ${validTimeframes.join(', ')}`
      });
    }

    console.log(`[Einstein Refresh API] Starting refresh for ${symbol} (${timeframe})...`);

    // Create data accuracy verifier
    const verifier = new DataAccuracyVerifier(symbol, timeframe);

    // Refresh all data from all 13+ APIs (Requirement 16.1)
    const result = await verifier.refreshAllData();

    // Log results
    console.log(`[Einstein Refresh API] Refresh complete:`, {
      success: result.success,
      dataQuality: `${result.dataQuality.overall}%`,
      duration: `${result.duration}ms`,
      significantChanges: result.changes.significantChanges
    });

    // Return success response
    return res.status(200).json({
      success: result.success,
      dataQuality: result.dataQuality,
      changes: result.changes,
      timestamp: result.timestamp,
      duration: result.duration
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[Einstein Refresh API] Error:', error);

    // Return error response
    return res.status(500).json({
      success: false,
      dataQuality: {
        overall: 0,
        market: 0,
        sentiment: 0,
        onChain: 0,
        technical: 0,
        sources: { successful: [], failed: [] }
      },
      changes: {
        priceChanged: false,
        priceDelta: 0,
        indicatorsChanged: [],
        sentimentChanged: false,
        onChainChanged: false,
        significantChanges: false
      },
      timestamp: new Date().toISOString(),
      duration,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}
