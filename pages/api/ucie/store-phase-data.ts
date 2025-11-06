/**
 * UCIE Store Phase Data API Endpoint
 * 
 * POST /api/ucie/store-phase-data
 * 
 * Stores phase data in database for progressive loading.
 * Allows Phase 4 to retrieve context from previous phases.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { storePhaseData } from '../../../lib/ucie/phaseDataStorage';

interface StorePhaseDataRequest {
  sessionId: string;
  symbol: string;
  phaseNumber: number;
  data: any;
}

interface SuccessResponse {
  success: true;
  message: string;
}

interface ErrorResponse {
  success: false;
  error: string;
}

type ApiResponse = SuccessResponse | ErrorResponse;

/**
 * Main API Handler
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
    });
  }

  try {
    const { sessionId, symbol, phaseNumber, data }: StorePhaseDataRequest = req.body;
    
    // Validate required fields
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid sessionId'
      });
    }
    
    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid symbol'
      });
    }
    
    if (phaseNumber === undefined || typeof phaseNumber !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid phaseNumber'
      });
    }
    
    if (!data || typeof data !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid data'
      });
    }
    
    // Validate phase number range
    if (phaseNumber < 1 || phaseNumber > 4) {
      return res.status(400).json({
        success: false,
        error: 'Phase number must be between 1 and 4'
      });
    }
    
    // Store phase data in database
    await storePhaseData(sessionId, symbol, phaseNumber, data);
    
    console.log(`✅ Stored Phase ${phaseNumber} data for ${symbol} (session: ${sessionId.substring(0, 8)}...)`);
    
    return res.status(200).json({
      success: true,
      message: `Phase ${phaseNumber} data stored successfully`
    });
    
  } catch (error) {
    console.error('❌ Store phase data API error:', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to store phase data'
    });
  }
}

/**
 * API Configuration
 */
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb', // Allow up to 1MB of phase data
    },
  },
};
