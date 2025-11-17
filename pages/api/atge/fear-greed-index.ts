/**
 * Fear & Greed Index API Route
 * 
 * Fetches the Crypto Fear & Greed Index from Alternative.me API
 * for use in ATGE Trade Details modal Market Snapshot section
 * 
 * GET /api/atge/fear-greed-index
 * 
 * Returns:
 * - value: 0-100 (0 = Extreme Fear, 100 = Extreme Greed)
 * - classification: Text label for the index value
 * - timestamp: When the index was last updated
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth';

// Fear & Greed Index classifications
function getClassification(value: number): string {
  if (value >= 76) return 'Extreme Greed';
  if (value >= 56) return 'Greed';
  if (value >= 45) return 'Neutral';
  if (value >= 25) return 'Fear';
  return 'Extreme Fear';
}

// Get color for the classification (for UI display)
function getColor(value: number): string {
  if (value >= 76) return 'green';
  if (value >= 56) return 'orange';
  if (value >= 45) return 'yellow';
  if (value >= 25) return 'orange';
  return 'red';
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    console.log('[Fear & Greed API] Fetching index from Alternative.me');

    // Fetch from Alternative.me API (free, no API key required)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch('https://api.alternative.me/fng/?limit=1', {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Bitcoin-Sovereign-Technology/1.0'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Alternative.me API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Validate response structure
    if (!data || !data.data || !Array.isArray(data.data) || data.data.length === 0) {
      throw new Error('Invalid response structure from Alternative.me API');
    }

    const indexData = data.data[0];
    const value = parseInt(indexData.value, 10);
    const timestamp = parseInt(indexData.timestamp, 10) * 1000; // Convert to milliseconds

    if (isNaN(value) || value < 0 || value > 100) {
      throw new Error(`Invalid Fear & Greed Index value: ${indexData.value}`);
    }

    const classification = getClassification(value);
    const color = getColor(value);

    console.log(`[Fear & Greed API] Index: ${value}/100 (${classification})`);

    // Return successful response
    return res.status(200).json({
      success: true,
      value: value,
      classification: classification,
      color: color,
      timestamp: new Date(timestamp).toISOString(),
      metadata: {
        valueClassification: indexData.value_classification,
        timeUntilUpdate: indexData.time_until_update,
        source: 'Alternative.me',
        lastUpdated: new Date(timestamp).toISOString()
      }
    });
  } catch (error) {
    console.error('[Fear & Greed API] Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Categorize error type for better handling
    let errorType: 'network' | 'timeout' | 'apiError' | 'unknown' = 'unknown';
    let statusCode = 200; // Return 200 with error details for graceful degradation
    
    if (errorMessage.includes('timeout') || errorMessage.includes('aborted') || errorMessage.includes('ETIMEDOUT')) {
      errorType = 'timeout';
    } else if (errorMessage.includes('network') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ENOTFOUND')) {
      errorType = 'network';
    } else if (errorMessage.includes('API') || errorMessage.includes('fetch') || errorMessage.includes('status')) {
      errorType = 'apiError';
    }

    // Log error details for monitoring
    console.error('[Fear & Greed API] Error details:', {
      type: errorType,
      message: errorMessage,
      timestamp: new Date().toISOString()
    });

    // Return N/A response on error with error type for client-side handling
    return res.status(statusCode).json({
      success: false,
      value: null,
      classification: 'N/A',
      color: 'gray',
      error: 'Failed to fetch Fear & Greed Index',
      errorType: errorType,
      retryable: errorType === 'timeout' || errorType === 'network',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
}

export default withAuth(handler);
