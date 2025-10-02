import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: 'production',
    envVars: {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing',

      COINMARKETCAP_API_KEY: process.env.COINMARKETCAP_API_KEY ? '✅ Set' : '❌ Missing',
      NEWS_API_KEY: process.env.NEWS_API_KEY ? '✅ Set' : '❌ Missing',
      ALPHA_VANTAGE_API_KEY: process.env.ALPHA_VANTAGE_API_KEY ? '✅ Set' : '❌ Missing',
      COINGECKO_API_KEY: process.env.COINGECKO_API_KEY ? '✅ Set' : '❌ Missing',
      ENABLE_LIVE_DATA: process.env.ENABLE_LIVE_DATA || '❌ Missing',
    },
    apiTests: {}
  };

  // Test Kraken API
  try {
    const krakenResponse = await fetch('https://api.kraken.com/0/public/Ticker?pair=XBTUSD', {
      signal: AbortSignal.timeout(5000)
    });
    diagnostics.apiTests.kraken = {
      status: krakenResponse.ok ? '✅ Working' : `❌ Error ${krakenResponse.status}`,
      response: krakenResponse.ok ? 'Connected' : await krakenResponse.text()
    };
  } catch (error: any) {
    diagnostics.apiTests.kraken = {
      status: '❌ Failed',
      error: error.message
    };
  }

  // Test CoinGecko API
  try {
    const coinGeckoResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd', {
      headers: {
        'x-cg-pro-api-key': process.env.COINGECKO_API_KEY || ''
      },
      signal: AbortSignal.timeout(5000)
    });
    diagnostics.apiTests.coingecko = {
      status: coinGeckoResponse.ok ? '✅ Working' : `❌ Error ${coinGeckoResponse.status}`,
      response: coinGeckoResponse.ok ? 'Connected' : await coinGeckoResponse.text()
    };
  } catch (error: any) {
    diagnostics.apiTests.coingecko = {
      status: '❌ Failed',
      error: error.message
    };
  }

  // Test OpenAI API
  if (process.env.OPENAI_API_KEY) {
    try {
      const openaiResponse = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(5000)
      });
      diagnostics.apiTests.openai = {
        status: openaiResponse.ok ? '✅ Working' : `❌ Error ${openaiResponse.status}`,
        response: openaiResponse.ok ? 'Connected' : await openaiResponse.text()
      };
    } catch (error: any) {
      diagnostics.apiTests.openai = {
        status: '❌ Failed',
        error: error.message
      };
    }
  }

  res.status(200).json({
    success: true,
    diagnostics
  });
}