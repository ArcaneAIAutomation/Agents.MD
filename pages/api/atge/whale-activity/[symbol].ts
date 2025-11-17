/**
 * Whale Activity API Route
 * 
 * Returns whale transaction count from Blockchain.com API
 * for use in ATGE Trade Details modal Market Snapshot section
 * 
 * GET /api/atge/whale-activity/BTC
 * GET /api/atge/whale-activity/ETH
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../../middleware/auth';
import { getOnChainData } from '../../../../lib/atge/onChainData';

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

    console.log(`[Whale Activity API] Fetching data for ${upperSymbol}`);

    // Fetch on-chain whale data
    const onChainData = await getOnChainData(upperSymbol);

    // Calculate whale activity metrics
    const whaleCount = onChainData.largeTransactionCount;
    const totalVolume = onChainData.totalWhaleVolume;
    const exchangeDeposits = onChainData.exchangeDeposits;
    const exchangeWithdrawals = onChainData.exchangeWithdrawals;
    const netFlow = onChainData.netFlow;

    // Determine market sentiment based on net flow
    let flowSentiment: 'Bullish' | 'Bearish' | 'Neutral';
    if (netFlow > 5) {
      flowSentiment = 'Bullish'; // More withdrawals = accumulation
    } else if (netFlow < -5) {
      flowSentiment = 'Bearish'; // More deposits = selling pressure
    } else {
      flowSentiment = 'Neutral';
    }

    console.log(`[Whale Activity API] Found ${whaleCount} whale transactions for ${upperSymbol}`);
    console.log(`[Whale Activity API] Net flow: ${netFlow} (${flowSentiment})`);

    // Return simplified response
    return res.status(200).json({
      success: true,
      symbol: upperSymbol,
      whaleCount: whaleCount,
      totalVolume: Math.round(totalVolume * 100) / 100, // Round to 2 decimals
      exchangeDeposits: exchangeDeposits,
      exchangeWithdrawals: exchangeWithdrawals,
      netFlow: netFlow,
      flowSentiment: flowSentiment,
      metadata: {
        threshold: upperSymbol === 'BTC' ? '50 BTC' : '100 ETH',
        timeframe: '24 hours',
        lastUpdated: onChainData.timestamp.toISOString(),
        source: 'Blockchain.com'
      }
    });
  } catch (error) {
    console.error('[Whale Activity API] Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Categorize error type for better handling
    let errorType: 'network' | 'timeout' | 'rateLimit' | 'apiError' | 'unsupported' | 'unknown' = 'unknown';
    let statusCode = 200; // Return 200 with error details for graceful degradation
    
    if (errorMessage.includes('Unsupported symbol')) {
      errorType = 'unsupported';
    } else if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
      errorType = 'timeout';
    } else if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
      errorType = 'rateLimit';
    } else if (errorMessage.includes('network') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ENOTFOUND')) {
      errorType = 'network';
    } else if (errorMessage.includes('API') || errorMessage.includes('fetch')) {
      errorType = 'apiError';
    }

    // Log error details for monitoring
    console.error('[Whale Activity API] Error details:', {
      type: errorType,
      symbol: req.query.symbol,
      message: errorMessage,
      timestamp: new Date().toISOString()
    });

    // Return N/A response on error with error type for client-side handling
    return res.status(statusCode).json({
      success: false,
      symbol: req.query.symbol?.toString().toUpperCase() || 'UNKNOWN',
      whaleCount: null,
      totalVolume: null,
      exchangeDeposits: null,
      exchangeWithdrawals: null,
      netFlow: null,
      flowSentiment: 'N/A',
      error: 'Failed to fetch whale activity data',
      errorType: errorType,
      retryable: errorType === 'timeout' || errorType === 'network',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
}

export default withAuth(handler);
