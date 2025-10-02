import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Check environment variables
    const envCheck = {
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,

      ALPHA_VANTAGE_API_KEY: !!process.env.ALPHA_VANTAGE_API_KEY,
      NEWSAPI_KEY: !!process.env.NEWSAPI_KEY,
      COINMARKETCAP_API_KEY: !!process.env.COINMARKETCAP_API_KEY,
      ENABLE_LIVE_DATA: process.env.ENABLE_LIVE_DATA
    };

    // Test Kraken API connectivity
    let krakenStatus = 'unknown';
    try {
      const response = await fetch('https://api.kraken.com/0/public/SystemStatus', {
        signal: AbortSignal.timeout(3000)
      });
      krakenStatus = response.ok ? 'connected' : 'error';
    } catch (error) {
      krakenStatus = 'timeout';
    }

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      apis: {
        kraken: krakenStatus
      },
      envVars: envCheck
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}