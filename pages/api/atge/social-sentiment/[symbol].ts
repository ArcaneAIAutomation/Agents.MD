/**
 * Social Sentiment API Route
 * 
 * Simplified endpoint that returns social sentiment score from LunarCrush
 * for use in ATGE Trade Details modal Market Snapshot section
 * 
 * GET /api/atge/social-sentiment/BTC
 * GET /api/atge/social-sentiment/ETH
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../../middleware/auth';
import { getLunarCrushData } from '../../../../lib/atge/lunarcrush';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const { symbol } = req.query;

    // Validate symbol
    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Symbol parameter is required'
      });
    }

    const upperSymbol = symbol.toUpperCase();
    if (!['BTC', 'ETH'].includes(upperSymbol)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid symbol. Must be BTC or ETH'
      });
    }

    console.log(`[Social Sentiment API] Fetching data for ${upperSymbol}`);

    // Fetch LunarCrush data
    const data = await getLunarCrushData(upperSymbol);

    // Calculate overall sentiment score (0-100)
    // Using positive sentiment percentage as the primary score
    const sentimentScore = Math.round(data.sentiment.positive);

    // Determine sentiment label
    let sentimentLabel: 'Very Positive' | 'Positive' | 'Neutral' | 'Negative' | 'Very Negative';
    if (sentimentScore >= 70) {
      sentimentLabel = 'Very Positive';
    } else if (sentimentScore >= 55) {
      sentimentLabel = 'Positive';
    } else if (sentimentScore >= 45) {
      sentimentLabel = 'Neutral';
    } else if (sentimentScore >= 30) {
      sentimentLabel = 'Negative';
    } else {
      sentimentLabel = 'Very Negative';
    }

    console.log(`[Social Sentiment API] Score: ${sentimentScore}/100 (${sentimentLabel}) for ${upperSymbol}`);

    // Return simplified response
    return res.status(200).json({
      success: true,
      symbol: upperSymbol,
      sentimentScore: sentimentScore,
      sentimentLabel: sentimentLabel,
      metadata: {
        galaxyScore: data.galaxyScore,
        altRank: data.altRank,
        socialDominance: data.socialDominance,
        socialVolume: data.socialVolume.total,
        contributors: data.socialVolume.contributors,
        lastUpdated: data.lastUpdated,
        source: 'LunarCrush'
      }
    });
  } catch (error) {
    console.error('[Social Sentiment API] Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Categorize error type for better handling
    let errorType: 'network' | 'timeout' | 'rateLimit' | 'apiError' | 'unknown' = 'unknown';
    let statusCode = 200; // Return 200 with error details for graceful degradation
    
    if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
      errorType = 'timeout';
    } else if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
      errorType = 'rateLimit';
    } else if (errorMessage.includes('network') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ENOTFOUND')) {
      errorType = 'network';
    } else if (errorMessage.includes('API') || errorMessage.includes('fetch')) {
      errorType = 'apiError';
    }

    // Log error details for monitoring
    console.error('[Social Sentiment API] Error details:', {
      type: errorType,
      symbol: req.query.symbol,
      message: errorMessage,
      timestamp: new Date().toISOString()
    });

    // Return N/A response on error with error type for client-side handling
    return res.status(statusCode).json({
      success: false,
      symbol: req.query.symbol?.toString().toUpperCase() || 'UNKNOWN',
      sentimentScore: null,
      sentimentLabel: 'N/A',
      error: 'Failed to fetch social sentiment data',
      errorType: errorType,
      retryable: errorType === 'timeout' || errorType === 'network',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
}

export default withAuth(handler);
