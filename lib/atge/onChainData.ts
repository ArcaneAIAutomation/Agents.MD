/**
 * On-Chain Data Fetcher for ATGE
 * 
 * Fetches whale transactions from Blockchain.com
 * Detects exchange deposits/withdrawals
 * Counts large transactions (>50 BTC)
 * 
 * Requirements: 1.5
 */

interface WhaleTransaction {
  hash: string;
  amount: number;
  fromAddress: string;
  toAddress: string;
  timestamp: Date;
  isExchangeDeposit: boolean;
  isExchangeWithdrawal: boolean;
}

interface OnChainData {
  whaleTransactions: WhaleTransaction[];
  largeTransactionCount: number;
  totalWhaleVolume: number;
  exchangeDeposits: number;
  exchangeWithdrawals: number;
  netFlow: number; // Positive = accumulation, Negative = distribution
  timestamp: Date;
}

// Known exchange addresses (sample list - expand as needed)
const EXCHANGE_ADDRESSES = new Set([
  // Binance
  '1NDyJtNTjmwk5xPNhjgAMu4HDHigtobu1s',
  '3Cbq7aT1tY8kMxWLbitaG7yT6bPbKChq64',
  'bc1qm34lsc65zpw79lxes69zkqmk6ee3ewf0j77s3h',
  
  // Coinbase
  '3D2oetdNuZUqQHPJmcMDDHYoqkyNVsFk9r',
  '3Nxwenay9Z8Lc9JBiywExpnEFiLp6Afp8v',
  'bc1qgdjqv0av3q56jvd82tkdjpy7gdp9ut8tlqmgrpmv24sq90ecnvqqjwvw97',
  
  // Kraken
  '3ANaBZ6odMrzdg9xifgRNxAUFUxnReesws',
  'bc1qj0yrqa7gcgr6c53rvxl87h9dj0ztgznh0w7z0v',
  
  // Bitfinex
  '3D2oetdNuZUqQHPJmcMDDHYoqkyNVsFk9r',
  'bc1qgdjqv0av3q56jvd82tkdjpy7gdp9ut8tlqmgrpmv24sq90ecnvqqjwvw97'
]);

/**
 * Check if an address is a known exchange
 */
function isExchangeAddress(address: string): boolean {
  return EXCHANGE_ADDRESSES.has(address);
}

/**
 * Fetch recent Bitcoin transactions from Blockchain.com
 */
async function fetchBitcoinTransactions(): Promise<WhaleTransaction[]> {
  try {
    // Use Blockchain.com's public API to get recent blocks
    const url = 'https://blockchain.info/blocks?format=json';
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Blockchain.com API error: ${response.status}`);
    }

    const blocks = await response.json();
    
    const whaleTransactions: WhaleTransaction[] = [];
    
    // Get transactions from recent blocks
    for (const block of blocks.slice(0, 10)) {
      try {
        const blockUrl = `https://blockchain.info/rawblock/${block.hash}`;
        const blockResponse = await fetch(blockUrl);
        
        if (!blockResponse.ok) continue;
        
        const blockData = await blockResponse.json();
        
        // Analyze transactions in the block
        for (const tx of blockData.tx) {
          // Calculate total output value
          const totalOutput = tx.out.reduce((sum: number, output: any) => 
            sum + (output.value || 0), 0);
          
          const btcAmount = totalOutput / 100000000; // Convert satoshis to BTC
          
          // Filter for whale transactions (>50 BTC)
          if (btcAmount > 50) {
            const fromAddress = tx.inputs?.[0]?.prev_out?.addr || 'unknown';
            const toAddress = tx.out?.[0]?.addr || 'unknown';
            
            whaleTransactions.push({
              hash: tx.hash,
              amount: btcAmount,
              fromAddress,
              toAddress,
              timestamp: new Date(tx.time * 1000),
              isExchangeDeposit: !isExchangeAddress(fromAddress) && isExchangeAddress(toAddress),
              isExchangeWithdrawal: isExchangeAddress(fromAddress) && !isExchangeAddress(toAddress)
            });
          }
        }
      } catch (blockError) {
        console.error('[ATGE] Error fetching block:', blockError);
        continue;
      }
    }
    
    return whaleTransactions;
  } catch (error) {
    console.error('[ATGE] Failed to fetch Bitcoin transactions:', error);
    return [];
  }
}

/**
 * Fetch recent Ethereum transactions (for ETH support)
 */
async function fetchEthereumTransactions(): Promise<WhaleTransaction[]> {
  const apiKey = process.env.ETHERSCAN_API_KEY;
  
  if (!apiKey) {
    console.warn('[ATGE] Etherscan API key not configured');
    return [];
  }

  try {
    // Get recent blocks
    const url = `https://api.etherscan.io/api?module=proxy&action=eth_blockNumber&apikey=${apiKey}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Etherscan API error: ${response.status}`);
    }

    const data = await response.json();
    const latestBlock = parseInt(data.result, 16);
    
    const whaleTransactions: WhaleTransaction[] = [];
    
    // Fetch transactions from recent blocks
    for (let i = 0; i < 10; i++) {
      const blockNumber = latestBlock - i;
      const blockUrl = `https://api.etherscan.io/api?module=proxy&action=eth_getBlockByNumber&tag=0x${blockNumber.toString(16)}&boolean=true&apikey=${apiKey}`;
      
      try {
        const blockResponse = await fetch(blockUrl);
        const blockData = await blockResponse.json();
        
        if (!blockData.result?.transactions) continue;
        
        for (const tx of blockData.result.transactions) {
          const ethAmount = parseInt(tx.value, 16) / 1e18;
          
          // Filter for whale transactions (>100 ETH)
          if (ethAmount > 100) {
            whaleTransactions.push({
              hash: tx.hash,
              amount: ethAmount,
              fromAddress: tx.from,
              toAddress: tx.to,
              timestamp: new Date(parseInt(blockData.result.timestamp, 16) * 1000),
              isExchangeDeposit: false, // Would need ETH exchange addresses
              isExchangeWithdrawal: false
            });
          }
        }
      } catch (blockError) {
        console.error('[ATGE] Error fetching ETH block:', blockError);
        continue;
      }
    }
    
    return whaleTransactions;
  } catch (error) {
    console.error('[ATGE] Failed to fetch Ethereum transactions:', error);
    return [];
  }
}

/**
 * Get on-chain data for a symbol
 * 
 * @param symbol - Cryptocurrency symbol (BTC or ETH)
 * @returns On-chain whale activity data
 */
export async function getOnChainData(symbol: string): Promise<OnChainData> {
  console.log(`[ATGE] Fetching on-chain data for ${symbol}`);
  
  let whaleTransactions: WhaleTransaction[];
  
  if (symbol.toUpperCase() === 'BTC') {
    whaleTransactions = await fetchBitcoinTransactions();
  } else if (symbol.toUpperCase() === 'ETH') {
    whaleTransactions = await fetchEthereumTransactions();
  } else {
    throw new Error(`Unsupported symbol: ${symbol}`);
  }
  
  // Calculate metrics
  const largeTransactionCount = whaleTransactions.length;
  const totalWhaleVolume = whaleTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const exchangeDeposits = whaleTransactions.filter(tx => tx.isExchangeDeposit).length;
  const exchangeWithdrawals = whaleTransactions.filter(tx => tx.isExchangeWithdrawal).length;
  const netFlow = exchangeWithdrawals - exchangeDeposits; // Positive = accumulation
  
  return {
    whaleTransactions,
    largeTransactionCount,
    totalWhaleVolume,
    exchangeDeposits,
    exchangeWithdrawals,
    netFlow,
    timestamp: new Date()
  };
}

export type { OnChainData, WhaleTransaction };
