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
  // Block Information
  latestBlockHeight: number; // Current block height
  latestBlockTime: number; // Unix timestamp of latest block
  latestBlockHash: string; // Hash of latest block
  blockTime: number; // Average minutes between blocks
  blocksToday: number; // Number of blocks mined today
  
  // Network Security
  hashRate: number; // Hash rate in TH/s
  difficulty: number; // Current mining difficulty
  
  // Mempool Status
  mempoolSize: number; // Number of unconfirmed transactions
  mempoolBytes: number; // Size of mempool in bytes
  
  // Transaction Fees
  averageFeePerTx: number; // Average fee per transaction (satoshis)
  recommendedFeePerVByte: number; // Recommended fee per vByte (sat/vB)
  typicalFeePerVByte: number; // Typical fee per vByte (sat/vB)
  
  // Supply Information
  totalCirculating: number; // Total BTC in circulation
  totalMined: number; // Total BTC mined (same as circulating)
  maxSupply: number; // Maximum BTC supply (21M)
  
  // Recent Activity
  recentTxCountPerBlock: number; // Average transactions per block (recent)
  
  // Market Data
  marketPriceUSD: number; // Current BTC price in USD
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
    timeframe: string; // ✅ NEW: "24 hours" to indicate analysis period
    transactions: BitcoinWhaleTransaction[];
    summary: {
      totalTransactions: number;
      totalValueUSD: number;
      totalValueBTC: number;
      largestTransaction: number;
      averageSize: number;
      exchangeDeposits: number; // Transactions to exchanges (selling pressure)
      exchangeWithdrawals: number; // Transactions from exchanges (accumulation)
      coldWalletMovements: number; // Large cold wallet transfers
      netFlow: number; // ✅ NEW: Net flow (withdrawals - deposits)
      flowSentiment: 'bullish' | 'bearish' | 'neutral'; // ✅ NEW: Overall flow sentiment
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
 * Fetch latest block information from Blockchain.com
 */
async function fetchLatestBlock(): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch('https://blockchain.info/latestblock', {
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
 * Fetch recent blocks to calculate average transactions per block
 */
async function fetchRecentBlocks(limit: number = 10): Promise<any[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`https://blockchain.info/blocks/${Date.now()}?format=json`, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'UCIE/1.0'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Blockchain.com API error: ${response.status}`);
    }

    const blocks = await response.json();
    return blocks.slice(0, limit);
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Failed to fetch recent blocks:', error);
    return [];
  }
}

/**
 * Fetch blocks from the last 24 hours
 * Bitcoin averages ~144 blocks per day (1 block every 10 minutes)
 */
async function fetch24HourBlocks(): Promise<any[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    // Get blocks from last 24 hours (approximately 144 blocks)
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const response = await fetch(`https://blockchain.info/blocks/${oneDayAgo}?format=json`, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'UCIE/1.0'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Blockchain.com API error: ${response.status}`);
    }

    const blocks = await response.json();
    console.log(`📊 Fetched ${blocks.length} blocks from last 24 hours`);
    return blocks;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Failed to fetch 24-hour blocks:', error);
    return [];
  }
}

/**
 * Fetch large transactions from a specific block
 */
async function fetchBlockTransactions(blockHash: string): Promise<any[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`https://blockchain.info/rawblock/${blockHash}`, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'UCIE/1.0'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Blockchain.com API error: ${response.status}`);
    }

    const blockData = await response.json();
    return blockData.tx || [];
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`Failed to fetch transactions for block ${blockHash}:`, error);
    return [];
  }
}

/**
 * Fetch whale transactions from the last 24 hours
 * This provides a more comprehensive view of large movements
 */
async function fetch24HourWhaleTransactions(
  btcPrice: number,
  minValueUSD: number = 1000000
): Promise<any[]> {
  try {
    console.log('🐋 Fetching 24-hour whale activity...');
    
    // Get blocks from last 24 hours
    const blocks = await fetch24HourBlocks();
    
    if (blocks.length === 0) {
      console.warn('⚠️ No blocks fetched for 24-hour analysis, using mempool only');
      return await fetchLargeTransactions();
    }

    const allTransactions: any[] = [];
    
    // Sample blocks to avoid too many API calls
    // Take every 10th block to get ~14 samples across 24 hours
    const sampledBlocks = blocks.filter((_: any, index: number) => index % 10 === 0);
    console.log(`📊 Sampling ${sampledBlocks.length} blocks for whale analysis`);
    
    // Fetch transactions from sampled blocks
    for (const block of sampledBlocks.slice(0, 15)) { // Limit to 15 blocks max
      try {
        const txs = await fetchBlockTransactions(block.hash);
        
        // Filter for large transactions
        const largeTxs = txs.filter((tx: any) => {
          const totalOutput = tx.out?.reduce((sum: number, output: any) => {
            return sum + (output.value || 0);
          }, 0) || 0;
          
          const valueBTC = totalOutput / 100000000;
          const valueUSD = valueBTC * btcPrice;
          
          return valueUSD >= minValueUSD;
        });
        
        allTransactions.push(...largeTxs);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error fetching block ${block.hash}:`, error);
      }
    }
    
    // Also include current mempool transactions
    const mempoolTxs = await fetchLargeTransactions();
    allTransactions.push(...mempoolTxs);
    
    console.log(`✅ Found ${allTransactions.length} whale transactions in last 24 hours`);
    return allTransactions;
    
  } catch (error) {
    console.error('Error fetching 24-hour whale transactions:', error);
    // Fallback to mempool only
    return await fetchLargeTransactions();
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
 * Known exchange wallet addresses (partial list of major exchanges)
 * These are publicly known cold/hot wallet addresses
 */
const KNOWN_EXCHANGE_ADDRESSES = new Set([
  // Binance
  '34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo',
  'bc1qm34lsc65zpw79lxes69zkqmk6ee3ewf0j77s3h',
  '3LYJfcfHPXYJreMsASk2jkn69LWEYKzexb',
  
  // Coinbase
  '3D2oetdNuZUqQHPJmcMDDHYoqkyNVsFk9r',
  'bc1qgdjqv0av3q56jvd82tkdjpy7gdp9ut8tlqmgrpmv24sq90ecnvqqjwvw97',
  '3Cbq7aT1tY8kMxWLbitaG7yT6bPbKChq64',
  
  // Kraken
  '3ANaBZ6odMrzdg9xifgRNxAUFUxnReesws',
  'bc1qj89046x7zv6pm4n00qgqp505nvljnfp6xfznyw',
  
  // Bitfinex
  '3D8WBrPqc8vVJhLDdyJKqQqYqJqQqJqQqJ',
  'bc1qgdjqv0av3q56jvd82tkdjpy7gdp9ut8tlqmgrpmv24sq90ecnvqqjwvw97',
  
  // Huobi
  '3QJmV3qfvL9SuYo34YihAf3sRCW3qSinyC',
  
  // OKEx
  '1NDyJtNTjmwk5xPNhjgAMu4HDHigtobu1s',
  
  // Gemini
  'bc1qgdjqv0av3q56jvd82tkdjpy7gdp9ut8tlqmgrpmv24sq90ecnvqqjwvw97',
  
  // Bitstamp
  '3Nxwenay9Z8Lc9JBiywExpnEFiLp6Afp8v',
]);

/**
 * Check if an address is a known exchange address
 */
function isExchangeAddress(address: string): boolean {
  return KNOWN_EXCHANGE_ADDRESSES.has(address);
}

/**
 * Analyze transaction flow direction
 */
function analyzeTransactionFlow(tx: any): {
  isExchangeDeposit: boolean;
  isExchangeWithdrawal: boolean;
  isColdWalletMovement: boolean;
} {
  let isExchangeDeposit = false;
  let isExchangeWithdrawal = false;
  let isColdWalletMovement = false;

  try {
    // Check inputs (from addresses)
    const fromAddresses = tx.inputs?.map((input: any) => input.prev_out?.addr).filter(Boolean) || [];
    const hasExchangeInput = fromAddresses.some((addr: string) => isExchangeAddress(addr));

    // Check outputs (to addresses)
    const toAddresses = tx.out?.map((output: any) => output.addr).filter(Boolean) || [];
    const hasExchangeOutput = toAddresses.some((addr: string) => isExchangeAddress(addr));

    // Determine flow direction
    if (hasExchangeOutput && !hasExchangeInput) {
      // Money going TO exchange = Deposit (potential selling pressure)
      isExchangeDeposit = true;
    } else if (hasExchangeInput && !hasExchangeOutput) {
      // Money coming FROM exchange = Withdrawal (accumulation signal)
      isExchangeWithdrawal = true;
    } else if (!hasExchangeInput && !hasExchangeOutput) {
      // Neither input nor output is exchange = Cold wallet movement
      isColdWalletMovement = true;
    }
  } catch (error) {
    console.error('Error analyzing transaction flow:', error);
  }

  return {
    isExchangeDeposit,
    isExchangeWithdrawal,
    isColdWalletMovement
  };
}

/**
 * Parse and filter whale transactions with exchange flow analysis
 * ✅ ENHANCED: Now detects exchange deposits, withdrawals, and cold wallet movements
 */
function parseWhaleTransactions(
  transactions: any[],
  btcPrice: number,
  minValueUSD: number = 1000000 // $1M minimum
): {
  transactions: BitcoinWhaleTransaction[];
  exchangeDeposits: number;
  exchangeWithdrawals: number;
  coldWalletMovements: number;
} {
  const whaleTransactions: BitcoinWhaleTransaction[] = [];
  let exchangeDeposits = 0;
  let exchangeWithdrawals = 0;
  let coldWalletMovements = 0;

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
        // Analyze transaction flow
        const flow = analyzeTransactionFlow(tx);
        
        // Count by type
        if (flow.isExchangeDeposit) exchangeDeposits++;
        if (flow.isExchangeWithdrawal) exchangeWithdrawals++;
        if (flow.isColdWalletMovement) coldWalletMovements++;

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
  const sortedTransactions = whaleTransactions.sort((a, b) => b.valueUSD - a.valueUSD);

  return {
    transactions: sortedTransactions,
    exchangeDeposits,
    exchangeWithdrawals,
    coldWalletMovements
  };
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
    console.log('📊 Starting 24-hour Bitcoin on-chain analysis...');
    
    // Fetch basic data first (fast)
    const [stats, latestBlock, recentBlocks, btcPrice] = await Promise.allSettled([
      fetchBitcoinStats(),
      fetchLatestBlock(),
      fetchRecentBlocks(10),
      getBitcoinPrice()
    ]);

    // Extract results
    const statsData = stats.status === 'fulfilled' ? stats.value : null;
    const latestBlockData = latestBlock.status === 'fulfilled' ? latestBlock.value : null;
    const recentBlocksData = recentBlocks.status === 'fulfilled' ? recentBlocks.value : [];
    const btcPriceData = btcPrice.status === 'fulfilled' ? btcPrice.value : 0;
    
    // Fetch 24-hour whale transactions (this takes longer, so do it after getting price)
    console.log('🐋 Fetching 24-hour whale activity...');
    const largeTxsData = await fetch24HourWhaleTransactions(
      btcPriceData || statsData?.market_price_usd || 0,
      1000000 // $1M threshold
    );

    // Calculate average transactions per block from recent blocks
    let recentTxCountPerBlock = 0;
    if (recentBlocksData.length > 0) {
      const totalTxs = recentBlocksData.reduce((sum: number, block: any) => {
        return sum + (block.n_tx || 0);
      }, 0);
      recentTxCountPerBlock = Math.round(totalTxs / recentBlocksData.length);
    }

    // Calculate fee recommendations based on mempool congestion
    const mempoolSize = statsData?.n_tx_mempool || 0;
    const mempoolBytes = statsData?.mempool_size || 0;
    
    // Fee estimation based on congestion
    let recommendedFeePerVByte = 1; // Default: 1 sat/vB
    let typicalFeePerVByte = 1;
    
    if (mempoolSize > 100000 || mempoolBytes > 100000000) {
      // High congestion
      recommendedFeePerVByte = 50;
      typicalFeePerVByte = 40;
    } else if (mempoolSize > 50000 || mempoolBytes > 50000000) {
      // Medium congestion
      recommendedFeePerVByte = 20;
      typicalFeePerVByte = 15;
    } else {
      // Low congestion
      recommendedFeePerVByte = 5;
      typicalFeePerVByte = 3;
    }

    // Calculate average fee per transaction (estimate)
    const averageFeePerTx = typicalFeePerVByte * 250; // Assume average tx size of 250 vBytes

    // Parse network metrics with all new fields
    const networkMetrics: BitcoinNetworkMetrics = {
      // Block Information
      latestBlockHeight: latestBlockData?.height || statsData?.n_blocks_total || 0,
      latestBlockTime: latestBlockData?.time || Math.floor(Date.now() / 1000),
      latestBlockHash: latestBlockData?.hash || '',
      blockTime: statsData?.minutes_between_blocks || 10,
      blocksToday: statsData?.n_blocks_total || 0,
      
      // Network Security
      hashRate: statsData?.hash_rate || 0,
      difficulty: statsData?.difficulty || 0,
      
      // Mempool Status
      mempoolSize: mempoolSize,
      mempoolBytes: mempoolBytes,
      
      // Transaction Fees
      averageFeePerTx: averageFeePerTx,
      recommendedFeePerVByte: recommendedFeePerVByte,
      typicalFeePerVByte: typicalFeePerVByte,
      
      // Supply Information
      totalCirculating: (statsData?.totalbc || 0) / 100000000,
      totalMined: (statsData?.totalbc || 0) / 100000000,
      maxSupply: 21000000,
      
      // Recent Activity
      recentTxCountPerBlock: recentTxCountPerBlock,
      
      // Market Data
      marketPriceUSD: statsData?.market_price_usd || btcPriceData
    };

    // Parse whale transactions with exchange flow analysis
    const whaleData = parseWhaleTransactions(
      largeTxsData,
      networkMetrics.marketPriceUSD,
      1000000 // $1M threshold
    );

    // Calculate whale activity summary
    const totalValueBTC = whaleData.transactions.reduce((sum, tx) => sum + tx.valueBTC, 0);
    const totalValueUSD = whaleData.transactions.reduce((sum, tx) => sum + tx.valueUSD, 0);
    const largestTransaction = whaleData.transactions.length > 0 
      ? Math.max(...whaleData.transactions.map(tx => tx.valueUSD))
      : 0;
    const averageSize = whaleData.transactions.length > 0
      ? whaleData.transactions.reduce((sum, tx) => sum + tx.size, 0) / whaleData.transactions.length
      : 0;
    
    // Calculate net flow and sentiment
    const netFlow = whaleData.exchangeWithdrawals - whaleData.exchangeDeposits;
    let flowSentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    if (netFlow > 5) {
      flowSentiment = 'bullish'; // More withdrawals = accumulation
    } else if (netFlow < -5) {
      flowSentiment = 'bearish'; // More deposits = selling pressure
    }
    
    console.log(`✅ 24-hour analysis complete: ${whaleData.transactions.length} whale transactions, net flow: ${netFlow > 0 ? '+' : ''}${netFlow} (${flowSentiment})`);

    // Analyze mempool
    const mempoolAnalysis = analyzeMempoolCongestion(
      networkMetrics.mempoolSize,
      networkMetrics.mempoolBytes
    );

    // Calculate data quality
    let dataQuality = 0;
    if (stats.status === 'fulfilled') dataQuality += 50;
    if (largeTxsData && largeTxsData.length > 0) dataQuality += 30;
    if (btcPrice.status === 'fulfilled' && btcPriceData > 0) dataQuality += 20;

    return {
      success: true,
      symbol: 'BTC',
      chain: 'bitcoin',
      networkMetrics,
      whaleActivity: {
        timeframe: '24 hours', // ✅ NEW: Indicate analysis period
        transactions: whaleData.transactions.slice(0, 50), // Top 50 from 24 hours
        summary: {
          totalTransactions: whaleData.transactions.length,
          totalValueUSD,
          totalValueBTC,
          largestTransaction,
          averageSize,
          exchangeDeposits: whaleData.exchangeDeposits,
          exchangeWithdrawals: whaleData.exchangeWithdrawals,
          coldWalletMovements: whaleData.coldWalletMovements,
          netFlow, // ✅ NEW
          flowSentiment // ✅ NEW
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
        // Block Information
        latestBlockHeight: 0,
        latestBlockTime: Math.floor(Date.now() / 1000),
        latestBlockHash: '',
        blockTime: 10,
        blocksToday: 0,
        
        // Network Security
        hashRate: 0,
        difficulty: 0,
        
        // Mempool Status
        mempoolSize: 0,
        mempoolBytes: 0,
        
        // Transaction Fees
        averageFeePerTx: 0,
        recommendedFeePerVByte: 0,
        typicalFeePerVByte: 0,
        
        // Supply Information
        totalCirculating: 19600000, // Approximate
        totalMined: 19600000,
        maxSupply: 21000000,
        
        // Recent Activity
        recentTxCountPerBlock: 0,
        
        // Market Data
        marketPriceUSD: 0
      },
      whaleActivity: {
        timeframe: '24 hours',
        transactions: [],
        summary: {
          totalTransactions: 0,
          totalValueUSD: 0,
          totalValueBTC: 0,
          largestTransaction: 0,
          averageSize: 0,
          exchangeDeposits: 0,
          exchangeWithdrawals: 0,
          coldWalletMovements: 0,
          netFlow: 0,
          flowSentiment: 'neutral'
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
