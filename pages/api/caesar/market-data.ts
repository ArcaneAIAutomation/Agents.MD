import type { NextApiRequest, NextApiResponse } from 'next';
import { caesarClient } from '../../../utils/caesarClient';

/**
 * Caesar API Market Data Endpoint
 * Provides real-time cryptocurrency market data from Caesar API
 * Mobile-optimized with caching and error handling
 */

interface MarketDataResponse {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
  source: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MarketDataResponse>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      timestamp: new Date().toISOString(),
      source: 'caesar',
    });
  }

  try {
    const { symbol = 'btc' } = req.query;

    // Validate symbol
    if (typeof symbol !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid symbol parameter',
        timestamp: new Date().toISOString(),
        source: 'caesar',
      });
    }

    // Fetch data from Caesar API
    const response = await caesarClient.getMarketData(symbol);

    if (!response.success) {
      return res.status(500).json({
        success: false,
        error: response.error || 'Failed to fetch market data',
        timestamp: response.timestamp,
        source: 'caesar',
      });
    }

    // Cache for 30 seconds
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate');

    return res.status(200).json({
      success: true,
      data: response.data,
      timestamp: response.timestamp,
      source: 'caesar',
    });
  } catch (error) {
    console.error('Caesar API market data error:', error);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString(),
      source: 'caesar',
    });
  }
}
