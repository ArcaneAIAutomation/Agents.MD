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
    // Note: CoinGecko free API auto-determines interval based on days
    // 1 day = 5 minute intervals
    // 2-90 days = hourly intervals
    // 90+ days = daily intervals
    const timeframeConfig: Record<string, { days: number }> = {
      '1H': { days: 1 },    // Will get 5-min intervals, we'll filter to hourly
      '4H': { days: 7 },    // Will get hourly intervals, we'll filter to 4-hourly
      '1D': { days: 90 },   // Will get daily intervals
    };

    const config = timeframeConfig[timeframe] || timeframeConfig['1H'];

    // Fetch from CoinGecko (free tier) - no interval param, it's auto-determined
    const coingeckoUrl = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${config.days}`;

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
      // For 1 day of data, CoinGecko returns 5-min intervals (~288 points)
      // Filter to get hourly data (every 12th point = 1 hour)
      filteredData = historicalData.filter((_, index) => index % 12 === 0).slice(-60);
    } else if (timeframe === '4H') {
      // For 7 days of data, CoinGecko returns hourly intervals (~168 points)
      // Filter to get 4-hour data (every 4th point)
      filteredData = historicalData.filter((_, index) => index % 4 === 0).slice(-72);
    } else if (timeframe === '1D') {
      // For 90 days, CoinGecko returns daily intervals
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
