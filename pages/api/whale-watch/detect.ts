import type { NextApiRequest, NextApiResponse } from 'next';
import { blockchainClient } from '../../../utils/blockchainClient';
import { storeWhaleTransaction, cacheWhaleDetection, getCachedWhaleDetection } from '../../../lib/whale-watch/database';

/**
 * Whale Watch Detection API
 * Detects large Bitcoin transactions (>50 BTC)
 * 
 * Time Period Scanned:
 * - Unconfirmed transactions in mempool (last few minutes)
 * - Last 3 confirmed blocks (~30 minutes of activity)
 * - Total window: approximately 30-35 minutes of recent activity
 * 
 * ✅ 99% ACCURACY RULE: Returns error if unable to fetch accurate BTC price
 * ✅ STORES DATA: Saves detected whales to Supabase database
 * ✅ CACHES: 30-second cache to reduce API calls
 * ✅ ENHANCED: Scans 30 minutes of transactions for better whale detection
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
    const { threshold = '50', blocks = '1' } = req.query;
    const thresholdBTC = parseFloat(threshold as string);
    const blocksToScan = parseInt(blocks as string, 10);

    console.log(`🐋 Detecting whale transactions (>${thresholdBTC} BTC) in last ${blocksToScan} block(s)...`);

    // Get current BTC price from CoinMarketCap
    // ✅ 99% ACCURACY RULE: Must have accurate price for whale detection
    let btcPrice: number;
    try {
      const priceResponse = await fetch(
        `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=BTC`,
        {
          headers: {
            'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY || '',
          },
        }
      );
      
      if (!priceResponse.ok) {
        throw new Error(`CMC API returned ${priceResponse.status}`);
      }
      
      const priceData = await priceResponse.json();
      btcPrice = priceData.data.BTC.quote.USD.price;
      
      if (!btcPrice || typeof btcPrice !== 'number' || btcPrice <= 0) {
        throw new Error('Invalid BTC price from CMC');
      }
      
      console.log(`💰 Current BTC price: $${btcPrice.toLocaleString()}`);
    } catch (error) {
      console.error('❌ Failed to fetch accurate BTC price:', error);
      return res.status(500).json({
        success: false,
        error: 'Unable to fetch accurate Bitcoin price. Whale detection requires real-time price data. Please try again.',
        timestamp: new Date().toISOString(),
      });
    }

    // Get unconfirmed transactions from mempool (last few minutes)
    const unconfirmedTxs = await blockchainClient.getUnconfirmedTransactions();
    console.log(`📊 Found ${unconfirmedTxs.length} unconfirmed transactions in mempool`);

    // Get transactions from last 30 minutes (3 blocks)
    // ✅ ENHANCED: Scan multiple recent blocks for better whale detection
    const confirmedTxs = await blockchainClient.getRecentTransactions(30);
    console.log(`📊 Found ${confirmedTxs.length} confirmed transactions in last 30 minutes`);

    // Combine unconfirmed and recent confirmed transactions
    const allTransactions = [...unconfirmedTxs, ...confirmedTxs];
    console.log(`📊 Total transactions to scan: ${allTransactions.length} (${unconfirmedTxs.length} unconfirmed + ${confirmedTxs.length} confirmed)`);

    // Detect whale transactions
    const whales = blockchainClient.detectWhaleTransactions(
      allTransactions,
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

    // ✅ STORE IN DATABASE: Save each whale transaction
    for (const whale of classifiedWhales) {
      try {
        await storeWhaleTransaction({
          txHash: whale.txHash,
          blockchain: whale.blockchain,
          amount: whale.amount,
          amountUSD: whale.amountUSD,
          fromAddress: whale.fromAddress,
          toAddress: whale.toAddress,
          transactionType: whale.type,
          description: whale.description,
          blockHeight: whale.blockHeight,
          transactionTimestamp: new Date(whale.timestamp),
        });
      } catch (error) {
        console.error(`⚠️ Failed to store whale ${whale.txHash.substring(0, 20)}... (continuing):`, error);
      }
    }

    // ✅ CACHE IN DATABASE: Store detection results
    const cacheKey = `whale-detection-${thresholdBTC}-${blocksToScan}`;
    try {
      await cacheWhaleDetection(cacheKey, thresholdBTC, classifiedWhales);
    } catch (error) {
      console.error('⚠️ Failed to cache detection results:', error);
    }

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
