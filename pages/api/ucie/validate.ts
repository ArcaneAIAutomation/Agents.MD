import type { NextApiRequest, NextApiResponse } from 'next';
import { validateToken } from '../../../lib/ucie/tokenValidation';

interface ValidationResponse {
  success: boolean;
  valid: boolean;
  symbol?: string;
  error?: string;
  suggestions?: string[];
  timestamp: string;
}

interface ErrorResponse {
  success: false;
  error: string;
  timestamp: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ValidationResponse | ErrorResponse>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      timestamp: new Date().toISOString()
    });
  }

  try {
    const { symbol } = req.query;

    // Validate query parameter
    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid symbol parameter',
        timestamp: new Date().toISOString()
      });
    }

    // Validate token
    const result = await validateToken(symbol);

    // Return validation result
    return res.status(200).json({
      success: true,
      valid: result.valid,
      symbol: result.symbol,
      error: result.error,
      suggestions: result.suggestions,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Validation API error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
}
