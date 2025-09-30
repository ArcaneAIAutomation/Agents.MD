import { NextApiRequest, NextApiResponse } from 'next';

interface HistoricalDataPoint {
  timestamp: number;
  price: number;
  volume: number;
}

interface HistoricalResponse {
  success: boolean;
  data: HistoricalDataPoint[];
  symbol: string;
  timeframe: string;
  cached?: boolean;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HistoricalResponse>
) {
  const { symbol, timeframe } = req.query;
  const symbolStr = (symbol as string || 'BTC').toUpperCase();
  const timeframeStr = timeframe as string || '1D';

  console.log(`🚀 Quick historical prices for ${symbolStr} ${timeframeStr}`);

  // Generate quick demo data
  const basePrice = symbolStr === 'BTC' ? 43250 : 2650;
  const periods = timeframeStr === '1H' ? 168 : timeframeStr === '4H' ? 180 : 365;
  const interval = timeframeStr === '1H' ? 3600000 : timeframeStr === '4H' ? 14400000 : 86400000;
  
  const data: HistoricalDataPoint[] = [];
  const now = Date.now();
  
  for (let i = periods; i >= 0; i--) {
    const timestamp = now - (i * interval);
    const volatility = basePrice * 0.02 * (Math.random() - 0.5);
    const price = basePrice + volatility;
    
    data.push({
      timestamp,
      price: Math.round(price * 100) / 100,
      volume: Math.round(1000000 + Math.random() * 500000)
    });
  }

  res.status(200).json({
    success: true,
    data,
    symbol: symbolStr,
    timeframe: timeframeStr
  });
}