import type { NextApiRequest, NextApiResponse } from 'next';
import { getCaesarNews } from '../../utils/caesarApi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { symbols, limit } = req.query;

  try {
    const symbolArray = symbols 
      ? (typeof symbols === 'string' ? symbols.split(',') : symbols)
      : ['BTC', 'ETH'];
    
    const limitNum = limit ? parseInt(limit as string, 10) : 15;

    const news = await getCaesarNews(symbolArray, limitNum);

    res.status(200).json({
      success: true,
      news,
      source: 'Caesar API',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Caesar news error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch news from Caesar API',
      timestamp: new Date().toISOString(),
    });
  }
}
