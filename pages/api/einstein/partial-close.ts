import { NextApiRequest, NextApiResponse } from 'next';
import { tradeExecutionTracker } from '../../../lib/einstein/execution/tracker';

/**
 * Einstein Partial Close API Endpoint
 * 
 * Records a partial close of a trade when a target is hit.
 * Updates trade status and execution information.
 * 
 * Requirements: 14.4, 14.5, 16.4
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    // Extract request body
    const { tradeId, exitPrice, percentage, target } = req.body;

    // Validate required fields
    if (!tradeId) {
      return res.status(400).json({
        success: false,
        error: 'Trade ID is required'
      });
    }

    if (!exitPrice || exitPrice <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid exit price is required'
      });
    }

    if (!percentage || percentage <= 0 || percentage > 100) {
      return res.status(400).json({
        success: false,
        error: 'Percentage must be between 1 and 100'
      });
    }

    if (!target || !['TP1', 'TP2', 'TP3', 'STOP_LOSS'].includes(target)) {
      return res.status(400).json({
        success: false,
        error: 'Valid target is required (TP1, TP2, TP3, or STOP_LOSS)'
      });
    }

    // Record partial close
    await tradeExecutionTracker.recordPartialClose(
      tradeId,
      parseFloat(exitPrice),
      parseFloat(percentage),
      target as 'TP1' | 'TP2' | 'TP3' | 'STOP_LOSS'
    );

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Partial close recorded successfully',
      data: {
        tradeId,
        exitPrice: parseFloat(exitPrice),
        percentage: parseFloat(percentage),
        target
      }
    });

  } catch (error) {
    console.error('❌ Partial close API error:', error);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}
