/**
 * Bitcoin On-Chain Data Utilities
 * 
 * Fetches Bitcoin blockchain data from Blockchain.com API
 * Since Bitcoin uses UTXO model (not account-based), we focus on:
 * - Network metrics (hash rate, difficulty, mempool)
 * - Large transactions (whale activity)
 * - Exchange flows
 */

export interface BitcoinNetworkMetrics {
  hashRate: number; // Hash rate in TH/s
  difficulty: number;
  blockTime: number; // Average minutes between blocks
  mempoolSize: number; // Number of unconfirmed transactions
  mempoolBytes: number; // Size of mempool in bytes
  totalCirculating: number; // Total BTC in circulation
  blocksToday: number;
  marketPriceUSD: number;
}

export interface BitcoinWhaleTransaction {
  hash: string;
  size: number; // Transaction size in bytes
  valueUSD: number;
  valueBTC: number;
  time: number; // Unix timestamp
  inputs: number;
  outputs: number;
  fee: number; // Fee in satoshis
}

export interface BitcoinOnChainData {
  success: boolean;
  symbol: string;
  chain: string;
  networkMetrics: BitcoinNetworkMetrics;
  whaleActivity: {
    transactions: BitcoinWhaleTransaction[];
    summary: {
      totalTransactions: number;
      totalValueUSD: number;
      totalValueBTC: number;
      largestTransaction: number;
      averageSize: number;
    };
  };
  mempoolAnalysis: {
    congestion: 'low' | 'medium' | 'high';
    averageFee: number;
    recommendedFee: number;
  };
  dataQuality: number;
  timestamp: string;
}

/**
 * Fetch Bitcoin network statistics from Blockchain.com
 */
async function fetchBitcoinStats(): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch('https://blockchain.info/stats?format=json', {
      signal: controller.signal,
      headers: {
        'User-Agent': 'UCIE/1.0'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Blockchain.com API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Fetch large unconfirmed transactions (potential whale activity)
 */
async function fetchLargeTransactions(): Promise<any[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch('https://blockchain.info/unconfirmed-transactions?format=json', {
      signal: controller.signal,
      headers: {
        'User-Agent': 'UCIE/1.0'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Blockchain.com API error: ${response.status}`);
    }

    const data = await response.json();
    return data.txs || [];
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Failed to fetch large transactions:', error);
    return [];
  }
}

/**
 * Get current Bitcoin price from Blockchain.com
 */
async function getBitcoinPrice(): Promise<number> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch('https://blockchain.info/ticker', {
      signal: controller.signal,
      headers: {
        'User-Agent': 'UCIE/1.0'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Price API error: ${response.status}`);
    }

    const data = await response.json();
    return data.USD?.last || 0;
  } catch (error) {
    console.error('Failed to fetch Bitcoin price:', error);
    return 0;
  }
}

/**
 * Parse and filter whale transactions
 */
function parseWhaleTransactions(
  transactions: any[],
  btcPrice: number,
  minValueUSD: number = 1000000 // $1M minimum
): BitcoinWhaleTransaction[] {
  const whaleTransactions: BitcoinWhaleTransaction[] = [];

  for (const tx of transactions) {
    try {
      // Calculate total output value in satoshis
      const totalOutput = tx.out?.reduce((sum: number, output: any) => {
        return sum + (output.value || 0);
      }, 0) || 0;

      // Convert to BTC
      const valueBTC = totalOutput / 100000000;
      const valueUSD = valueBTC * btcPrice;

      // Only include if above threshold
      if (valueUSD >= minValueUSD) {
        whaleTransactions.push({
          hash: tx.hash,
          size: tx.size || 0,
          valueUSD,
          valueBTC,
          time: tx.time || Math.floor(Date.now() / 1000),
          inputs: tx.inputs?.length || 0,
          outputs: tx.out?.length || 0,
          fee: tx.fee || 0
        });
      }
    } catch (error) {
      console.error('Error parsing transaction:', error);
    }
  }

  // Sort by value (largest first)
  return whaleTransactions.sort((a, b) => b.valueUSD - a.valueUSD);
}

/**
 * Analyze mempool congestion
 */
function analyzeMempoolCongestion(
  mempoolSize: number,
  mempoolBytes: number
): {
  congestion: 'low' | 'medium' | 'high';
  averageFee: number;
  recommendedFee: number;
} {
  // Congestion thresholds
  let congestion: 'low' | 'medium' | 'high' = 'low';
  
  if (mempoolSize > 100000 || mempoolBytes > 100000000) {
    congestion = 'high';
  } else if (mempoolSize > 50000 || mempoolBytes > 50000000) {
    congestion = 'medium';
  }

  // Estimate fees based on congestion
  let recommendedFee = 1; // sat/vB
  
  switch (congestion) {
    case 'high':
      recommendedFee = 50;
      break;
    case 'medium':
      recommendedFee = 20;
      break;
    case 'low':
      recommendedFee = 5;
      break;
  }

  return {
    congestion,
    averageFee: recommendedFee * 0.8,
    recommendedFee
  };
}

/**
 * Fetch complete Bitcoin on-chain data
 */
export async function fetchBitcoinOnChainData(): Promise<BitcoinOnChainData> {
  try {
    // Fetch all data in parallel
    const [stats, largeTxs, btcPrice] = await Promise.allSettled([
      fetchBitcoinStats(),
      fetchLargeTransactions(),
      getBitcoinPrice()
    ]);

    // Extract results
    const statsData = stats.status === 'fulfilled' ? stats.value : null;
    const largeTxsData = largeTxs.status === 'fulfilled' ? largeTxs.value : [];
    const btcPriceData = btcPrice.status === 'fulfilled' ? btcPrice.value : 0;

    // Parse network metrics
    const networkMetrics: BitcoinNetworkMetrics = {
      hashRate: statsData?.hash_rate || 0,
      difficulty: statsData?.difficulty || 0,
      blockTime: statsData?.minutes_between_blocks || 10,
      mempoolSize: statsData?.n_tx_mempool || 0,
      mempoolBytes: statsData?.mempool_size || 0,
      totalCirculating: (statsData?.totalbc || 0) / 100000000,
      blocksToday: statsData?.n_blocks_total || 0,
      marketPriceUSD: statsData?.market_price_usd || btcPriceData
    };

    // Parse whale transactions
    const whaleTransactions = parseWhaleTransactions(
      largeTxsData,
      networkMetrics.marketPriceUSD,
      1000000 // $1M threshold
    );

    // Calculate whale activity summary
    const totalValueBTC = whaleTransactions.reduce((sum, tx) => sum + tx.valueBTC, 0);
    const totalValueUSD = whaleTransactions.reduce((sum, tx) => sum + tx.valueUSD, 0);
    const largestTransaction = whaleTransactions.length > 0 
      ? Math.max(...whaleTransactions.map(tx => tx.valueUSD))
      : 0;
    const averageSize = whaleTransactions.length > 0
      ? whaleTransactions.reduce((sum, tx) => sum + tx.size, 0) / whaleTransactions.length
      : 0;

    // Analyze mempool
    const mempoolAnalysis = analyzeMempoolCongestion(
      networkMetrics.mempoolSize,
      networkMetrics.mempoolBytes
    );

    // Calculate data quality
    let dataQuality = 0;
    if (stats.status === 'fulfilled') dataQuality += 50;
    if (largeTxs.status === 'fulfilled' && largeTxsData.length > 0) dataQuality += 30;
    if (btcPrice.status === 'fulfilled' && btcPriceData > 0) dataQuality += 20;

    return {
      success: true,
      symbol: 'BTC',
      chain: 'bitcoin',
      networkMetrics,
      whaleActivity: {
        transactions: whaleTransactions.slice(0, 20), // Top 20
        summary: {
          totalTransactions: whaleTransactions.length,
          totalValueUSD,
          totalValueBTC,
          largestTransaction,
          averageSize
        }
      },
      mempoolAnalysis,
      dataQuality,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Bitcoin on-chain data fetch error:', error);
    
    // Return minimal data on error
    return {
      success: false,
      symbol: 'BTC',
      chain: 'bitcoin',
      networkMetrics: {
        hashRate: 0,
        difficulty: 0,
        blockTime: 10,
        mempoolSize: 0,
        mempoolBytes: 0,
        totalCirculating: 19600000, // Approximate
        blocksToday: 0,
        marketPriceUSD: 0
      },
      whaleActivity: {
        transactions: [],
        summary: {
          totalTransactions: 0,
          totalValueUSD: 0,
          totalValueBTC: 0,
          largestTransaction: 0,
          averageSize: 0
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
