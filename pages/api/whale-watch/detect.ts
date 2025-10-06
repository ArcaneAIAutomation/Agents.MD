import type { NextApiRequest, NextApiResponse } from 'next';
import { blockchainClient } from '../../../utils/blockchainClient';

/**
 * Whale Watch Detection API
 * Detects large Bitcoin transactions (>100 BTC)
 */

interface WhaleDetectionResponse {
  success: boolean;
  whales?: any[];
  count?: number;
  threshold?: number;
  error?: string;
  timestamp: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<WhaleDetectionResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const { threshold = '100' } = req.query;
    const thresholdBTC = parseFloat(threshold as string);

    console.log(`🐋 Detecting whale transactions (>${thresholdBTC} BTC)...`);

    // Get current BTC price from CoinMarketCap
    let btcPrice = 45000; // Default fallback
    try {
      const priceResponse = await fetch(
        `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=BTC`,
        {
          headers: {
            'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY || '',
          },
        }
      );
      
      if (priceResponse.ok) {
        const priceData = await priceResponse.json();
        btcPrice = priceData.data.BTC.quote.USD.price;
        console.log(`💰 Current BTC price: $${btcPrice.toLocaleString()}`);
      }
    } catch (error) {
      console.error('Failed to fetch BTC price, using fallback');
    }

    // Get unconfirmed transactions from mempool
    const transactions = await blockchainClient.getUnconfirmedTransactions();
    console.log(`📊 Found ${transactions.length} unconfirmed transactions`);

    // Detect whale transactions
    const whales = blockchainClient.detectWhaleTransactions(
      transactions,
      thresholdBTC,
      btcPrice
    );

    console.log(`🐋 Detected ${whales.length} whale transactions`);

    // Classify each whale transaction
    const classifiedWhales = whales.map(whale => {
      const classification = blockchainClient.classifyTransaction(whale);
      return {
        ...whale,
        ...classification,
        timestamp: whale.timestamp.toISOString(),
      };
    });

    // Sort by amount (largest first)
    classifiedWhales.sort((a, b) => b.amount - a.amount);

    // Cache for 30 seconds
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate');

    return res.status(200).json({
      success: true,
      whales: classifiedWhales,
      count: classifiedWhales.length,
      threshold: thresholdBTC,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Whale detection error:', error);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to detect whale transactions',
      timestamp: new Date().toISOString(),
    });
  }
}
