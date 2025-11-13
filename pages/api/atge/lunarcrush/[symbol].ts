/**
 * LunarCrush Social Intelligence API Route
 * 
 * Fetches comprehensive social intelligence data from LunarCrush
 * for use in ATGE trade signal generation and analysis
 * 
 * GET /api/atge/lunarcrush/BTC
 * GET /api/atge/lunarcrush/ETH
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../../middleware/auth';
import { getLunarCrushAnalysis } from '../../../../lib/atge/lunarcrush';

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

    console.log(`[LunarCrush API] Fetching data for ${upperSymbol}`);

    // Fetch comprehensive LunarCrush analysis
    const analysis = await getLunarCrushAnalysis(upperSymbol);

    console.log(`[LunarCrush API] Data fetched successfully for ${upperSymbol}`);

    // Return formatted response
    return res.status(200).json({
      success: true,
      symbol: upperSymbol,
      data: {
        // Current Metrics
        galaxyScore: analysis.currentMetrics.galaxyScore,
        altRank: analysis.currentMetrics.altRank,
        socialDominance: analysis.currentMetrics.socialDominance,
        
        // Sentiment
        sentiment: analysis.currentMetrics.sentiment,
        
        // Social Volume
        socialVolume: analysis.currentMetrics.socialVolume,
        
        // Correlation
        correlationScore: analysis.currentMetrics.correlationScore,
        
        // Price Data
        price: analysis.currentMetrics.price,
        priceChange24h: analysis.currentMetrics.priceChange24h,
        
        // Trends
        trends: analysis.trends,
        
        // Signals
        signals: analysis.signals,
        
        // Top Posts
        topPosts: analysis.topPosts.map(post => ({
          text: post.text,
          author: post.author,
          engagement: post.engagement,
          sentiment: post.sentiment,
          timestamp: post.timestamp
        })),
        
        // AI Context (for use in trade generation)
        aiContext: analysis.aiContext
      },
      metadata: {
        lastUpdated: analysis.currentMetrics.lastUpdated,
        source: 'LunarCrush',
        cacheStatus: 'fresh'
      }
    });
  } catch (error) {
    console.error('[LunarCrush API] Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch LunarCrush data',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
}

export default withAuth(handler);
