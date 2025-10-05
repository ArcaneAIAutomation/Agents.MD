import type { NextApiRequest, NextApiResponse } from 'next';
import { getCaesarTradeSignals } from '../../utils/caesarApi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { symbol } = req.query;

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'Symbol parameter required' });
  }

  try {
    const signals = await getCaesarTradeSignals(symbol);

    res.status(200).json({
      success: true,
      signals,
      source: 'Caesar API',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Caesar trade signals error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch trade signals from Caesar API',
      timestamp: new Date().toISOString(),
    });
  }
}
