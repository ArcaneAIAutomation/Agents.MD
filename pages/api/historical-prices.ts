import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Historical Prices API
 * Fetches real historical price data for different timeframes
 * Supports: BTC, ETH, and other major cryptocurrencies
 */

interface HistoricalDataPoint {
  timestamp: number;
  price: number;
  volume: number;
}

interface HistoricalResponse {
  success: boolean;
  data?: HistoricalDataPoint[];
  error?: string;
  timeframe: string;
  symbol: string;
  dataPoints: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HistoricalResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      timeframe: '',
      symbol: '',
      dataPoints: 0,
    });
  }

  try {
    const { symbol = 'BTC', timeframe = '1H' } = req.query;

    if (typeof symbol !== 'string' || typeof timeframe !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid parameters',
        timeframe: timeframe as string,
        symbol: symbol as string,
        dataPoints: 0,
      });
    }

    // Map crypto symbols to CoinGecko IDs
    const coinGeckoIds: Record<string, string> = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'SOL': 'solana',
      'AVAX': 'avalanche-2',
      'MATIC': 'matic-network',
    };

    const coinId = coinGeckoIds[symbol.toUpperCase()] || 'bitcoin';

    // Determine days based on timeframe
    const timeframeConfig: Record<string, { days: number, interval: string }> = {
      '1H': { days: 1, interval: 'hourly' },
      '4H': { days: 3, interval: 'hourly' },
      '1D': { days: 30, interval: 'daily' },
    };

    const config = timeframeConfig[timeframe] || timeframeConfig['1H'];

    // Fetch from CoinGecko (free tier)
    const coingeckoUrl = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${config.days}&interval=${config.interval}`;

    console.log(`📊 Fetching historical data: ${symbol} ${timeframe} (${config.days} days)`);

    const response = await fetch(coingeckoUrl, {
      headers: {
        'Accept': 'application/json',
        ...(process.env.COINGECKO_API_KEY && {
          'x-cg-pro-api-key': process.env.COINGECKO_API_KEY
        })
      },
    });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform CoinGecko data format
    // CoinGecko returns: { prices: [[timestamp, price], ...], total_volumes: [[timestamp, volume], ...] }
    const historicalData: HistoricalDataPoint[] = data.prices.map((priceData: [number, number], index: number) => {
      const volumeData = data.total_volumes[index] || [priceData[0], 0];
      return {
        timestamp: priceData[0],
        price: priceData[1],
        volume: volumeData[1],
      };
    });

    // Filter based on timeframe to get appropriate number of data points
    let filteredData = historicalData;
    
    if (timeframe === '1H') {
      // Last 60 hours (hourly data)
      filteredData = historicalData.slice(-60);
    } else if (timeframe === '4H') {
      // Last 72 hours (every 4 hours)
      filteredData = historicalData.filter((_, index) => index % 4 === 0).slice(-72);
    } else if (timeframe === '1D') {
      // Last 90 days (daily data)
      filteredData = historicalData.slice(-90);
    }

    console.log(`✅ Historical data fetched: ${filteredData.length} data points for ${symbol} ${timeframe}`);

    // Cache for 5 minutes
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');

    return res.status(200).json({
      success: true,
      data: filteredData,
      timeframe,
      symbol: symbol.toUpperCase(),
      dataPoints: filteredData.length,
    });

  } catch (error) {
    console.error('Historical prices error:', error);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch historical data',
      timeframe: req.query.timeframe as string || '',
      symbol: req.query.symbol as string || '',
      dataPoints: 0,
    });
  }
}
