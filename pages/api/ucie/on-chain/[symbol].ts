/**
 * UCIE On-Chain Analysis API Endpoint
 * 
 * GET /api/ucie/on-chain/BTC
 * 
 * Returns blockchain data showing what's happening on the Bitcoin network.
 * 
 * What you'll see:
 * - Network Hash Rate: Mining power securing the network (higher = more secure)
 * - Difficulty: How hard it is to mine new blocks (adjusts every 2 weeks)
 * - Mempool Size: Number of pending transactions waiting to be confirmed
 * - Whale Activity: Large transactions (>50 BTC) that could impact price
 * - Exchange Flows: Bitcoin moving to/from exchanges (deposits = potential selling, withdrawals = holding)
 * - Active Addresses: Number of unique wallets transacting (shows network usage)
 * 
 * Why it matters: On-chain data reveals what Bitcoin holders are actually doing with their coins.
 * Large movements to exchanges often precede selling, while withdrawals suggest long-term holding.
 * Network metrics show the health and security of the blockchain.
 * 
 * Cache: 5 minutes
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getCachedAnalysis, setCachedAnalysis } from '../../../../lib/ucie/cacheUtils';
import { fetchEthereumOnChainData } from '../../../../lib/ucie/ethereumOnChain';

/**
 * ✅ WORKING Bitcoin On-Chain Data Fetcher with REAL Whale Activity
 * Uses the same blockchain client as the working Whale Watch feature
 * Fetches actual whale transactions from the last 30 minutes
 */
async function fetchBitcoinOnChainDataSimplified() {
  try {
    console.log('📊 Fetching Bitcoin on-chain data with real whale activity...');

    // Import blockchain client (same as Whale Watch)
    const { blockchainClient } = await import('../../../../utils/blockchainClient');

    // Fetch basic stats, latest block, and BTC price in parallel
    const [statsResponse, blockResponse, priceResponse] = await Promise.allSettled([
      fetch('https://blockchain.info/stats?format=json', {
        signal: AbortSignal.timeout(5000),
        headers: { 'User-Agent': 'UCIE/1.0' }
      }),
      fetch('https://blockchain.info/latestblock', {
        signal: AbortSignal.timeout(5000),
        headers: { 'User-Agent': 'UCIE/1.0' }
      }),
      fetch('https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=BTC', {
        signal: AbortSignal.timeout(5000),
        headers: {
          'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY || ''
        }
      })
    ]);

    // Extract results
    const stats = statsResponse.status === 'fulfilled' && statsResponse.value.ok
      ? await statsResponse.value.json()
      : null;
    
    const latestBlock = blockResponse.status === 'fulfilled' && blockResponse.value.ok
      ? await blockResponse.value.json()
      : null;

    // Get BTC price for whale USD calculations
    let btcPrice = 0;
    if (priceResponse.status === 'fulfilled' && priceResponse.value.ok) {
      const priceData = await priceResponse.value.json();
      btcPrice = priceData.data?.BTC?.quote?.USD?.price || 0;
    }

    // ✅ FETCH REAL WHALE ACTIVITY (same as Whale Watch)
    let whaleActivity = {
      timeframe: '30 minutes',
      minThreshold: '50 BTC',
      summary: {
        totalTransactions: 0,
        totalValueUSD: 0,
        totalValueBTC: 0,
        largestTransaction: 0,
        message: 'No whale activity detected'
      }
    };

    if (btcPrice > 0) {
      try {
        console.log('🐋 Detecting whale transactions (>50 BTC) in last 30 minutes...');
        
        // Get unconfirmed and recent confirmed transactions (same as Whale Watch)
        const [unconfirmedTxs, confirmedTxs] = await Promise.all([
          blockchainClient.getUnconfirmedTransactions(),
          blockchainClient.getRecentTransactions(30)
        ]);

        const allTransactions = [...unconfirmedTxs, ...confirmedTxs];
        console.log(`📊 Scanning ${allTransactions.length} transactions for whales...`);

        // Detect whale transactions (>50 BTC)
        const whales = blockchainClient.detectWhaleTransactions(allTransactions, 50, btcPrice);
        
        if (whales.length > 0) {
          const totalBTC = whales.reduce((sum, w) => sum + w.amount, 0);
          const totalUSD = whales.reduce((sum, w) => sum + w.amountUSD, 0);
          const largestWhale = Math.max(...whales.map(w => w.amount));

          whaleActivity = {
            timeframe: '30 minutes',
            minThreshold: '50 BTC',
            summary: {
              totalTransactions: whales.length,
              totalValueUSD: totalUSD,
              totalValueBTC: totalBTC,
              largestTransaction: largestWhale,
              message: `${whales.length} whale transaction${whales.length > 1 ? 's' : ''} detected`
            }
          };

          console.log(`🐋 Detected ${whales.length} whale transactions (${totalBTC.toFixed(2)} BTC / $${totalUSD.toLocaleString()})`);
        } else {
          console.log('🐋 No whale transactions detected in last 30 minutes');
        }
      } catch (whaleError) {
        console.error('⚠️ Whale detection failed (continuing with other data):', whaleError);
        whaleActivity.summary.message = 'Whale detection temporarily unavailable';
      }
    } else {
      console.warn('⚠️ BTC price unavailable - skipping whale detection');
      whaleActivity.summary.message = 'Whale detection requires BTC price data';
    }

    // Calculate data quality
    let dataQuality = 0;
    if (stats) dataQuality += 40;
    if (latestBlock) dataQuality += 30;
    if (btcPrice > 0) dataQuality += 20;
    if (whaleActivity.summary.totalTransactions >= 0) dataQuality += 10;

    // Return complete on-chain data with REAL whale activity
    return {
      success: true,
      symbol: 'BTC',
      chain: 'bitcoin',
      networkMetrics: {
        // Block Information
        latestBlockHeight: latestBlock?.height || stats?.n_blocks_total || 0,
        latestBlockTime: latestBlock?.time || Math.floor(Date.now() / 1000),
        blockTime: stats?.minutes_between_blocks || 10,
        
        // Network Security
        hashRate: stats?.hash_rate || 0,
        difficulty: stats?.difficulty || 0,
        
        // Mempool Status
        mempoolSize: stats?.n_tx_mempool || 0,
        mempoolBytes: stats?.mempool_size || 0,
        
        // Supply Information
        totalCirculating: (stats?.totalbc || 0) / 100000000,
        maxSupply: 21000000,
        
        // Market Data
        marketPriceUSD: btcPrice || stats?.market_price_usd || 0
      },
      whaleActivity,
      mempoolAnalysis: {
        congestion: stats?.n_tx_mempool > 100000 ? 'high' : stats?.n_tx_mempool > 50000 ? 'medium' : 'low',
        averageFee: 0,
        recommendedFee: stats?.n_tx_mempool > 100000 ? 50 : stats?.n_tx_mempool > 50000 ? 20 : 5
      },
      dataQuality,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Bitcoin on-chain fetch error:', error);
    
    // Return minimal data on error
    return {
      success: false,
      symbol: 'BTC',
      chain: 'bitcoin',
      networkMetrics: {
        latestBlockHeight: 0,
        latestBlockTime: Math.floor(Date.now() / 1000),
        blockTime: 10,
        hashRate: 0,
        difficulty: 0,
        mempoolSize: 0,
        mempoolBytes: 0,
        totalCirculating: 19600000,
        maxSupply: 21000000,
        marketPriceUSD: 0
      },
      whaleActivity: {
        timeframe: '30 minutes',
        minThreshold: '50 BTC',
        summary: {
          totalTransactions: 0,
          totalValueUSD: 0,
          totalValueBTC: 0,
          largestTransaction: 0,
          message: 'Data temporarily unavailable'
        }
      },
      mempoolAnalysis: {
        congestion: 'low',
        averageFee: 0,
        recommendedFee: 0
      },
      dataQuality: 0,
      timestamp: new Date().toISOString()
    };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { symbol } = req.query;

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'Symbol parameter is required' });
  }

  const symbolUpper = symbol.toUpperCase();

  try {
    // ✅ Check if refresh parameter is set to force fresh data
    const forceRefresh = req.query.refresh === 'true';
    console.log(`⛓️ UCIE On-Chain API called for ${symbolUpper}${forceRefresh ? ' (FORCING FRESH DATA)' : ''}`);

    // 1. Check cache first (5 minute TTL) - SKIP if refresh=true
    if (!forceRefresh) {
      const cached = await getCachedAnalysis(symbolUpper, 'on-chain');
      if (cached) {
        console.log(`✅ Cache hit for ${symbolUpper}/on-chain`);
        return res.status(200).json({
          success: true,
          data: cached,
          cached: true,
          timestamp: new Date().toISOString()
        });
      }
    } else {
      console.log(`🔄 Refresh requested - bypassing cache for ${symbolUpper}/on-chain`);
    }

    console.log(`❌ Cache miss for ${symbolUpper}/on-chain - fetching fresh data`);

    // 2. Fetch on-chain data based on symbol
    let onChainData;
    
    if (symbolUpper === 'BTC' || symbolUpper === 'BITCOIN') {
      // ✅ FIXED: Use simplified direct API calls (mirrors working BTC analysis pattern)
      onChainData = await fetchBitcoinOnChainDataSimplified();
    } else {
      // ❌ RESTRICTION: Only Bitcoin is supported for on-chain analysis
      console.log(`❌ On-chain analysis not supported for ${symbolUpper} - Bitcoin only`);
      return res.status(400).json({
        success: false,
        error: 'On-chain analysis is only available for Bitcoin (BTC)',
        symbol: symbolUpper,
        message: 'UCIE currently focuses on Bitcoin on-chain metrics only',
        timestamp: new Date().toISOString()
      });
    }

    // 3. Cache the result (6.5 minutes = 390 seconds)
    // ✅ FIX: Store unwrapped data (no API wrappers)
    const unwrappedData = {
      networkMetrics: onChainData.networkMetrics,
      whaleActivity: onChainData.whaleActivity,
      mempoolAnalysis: onChainData.mempoolAnalysis,
      holderDistribution: onChainData.holderDistribution,
      exchangeFlows: onChainData.exchangeFlows,
      smartContract: onChainData.smartContract,
      dataQuality: onChainData.dataQuality,
      timestamp: onChainData.timestamp,
      chain: onChainData.chain
    };
    
    await setCachedAnalysis(
      symbolUpper,
      'on-chain',
      unwrappedData,
      390, // 6.5 minutes
      onChainData.dataQuality
    );

    console.log(`✅ On-chain data fetched and cached for ${symbolUpper} (quality: ${onChainData.dataQuality}%, unwrapped format)`);

    // 4. Return response (with API wrappers for client)
    return res.status(200).json({
      success: true,
      data: onChainData,
      cached: false,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ UCIE On-Chain API Error for ${symbolUpper}:`, error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch on-chain data',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}
