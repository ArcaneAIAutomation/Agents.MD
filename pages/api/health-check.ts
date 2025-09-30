import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Check environment variables
    const envCheck = {
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      BINANCE_API_KEY: !!process.env.BINANCE_API_KEY,
      ALPHA_VANTAGE_API_KEY: !!process.env.ALPHA_VANTAGE_API_KEY,
      NEWSAPI_KEY: !!process.env.NEWSAPI_KEY,
      COINMARKETCAP_API_KEY: !!process.env.COINMARKETCAP_API_KEY,
      ENABLE_LIVE_DATA: process.env.ENABLE_LIVE_DATA
    };

    // Test Binance API connectivity
    let binanceStatus = 'unknown';
    try {
      const response = await fetch('https://api.binance.com/api/v3/ping', {
        signal: AbortSignal.timeout(3000)
      });
      binanceStatus = response.ok ? 'connected' : 'error';
    } catch (error) {
      binanceStatus = 'timeout';
    }

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      apis: {
        binance: binanceStatus
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