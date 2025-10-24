/**
 * Blockchain Data Fetching Utilities
 * 
 * Fetches transaction history and address data from Blockchain.com API
 * for Deep Dive whale transaction analysis.
 */

export interface BlockchainAddressData {
  address: string;
  totalReceived: number;
  totalSent: number;
  balance: number;
  transactionCount: number;
  recentTransactions: Array<{
    hash: string;
    time: string;
    amount: number;
    type: 'incoming' | 'outgoing';
  }>;
  volume30Days: number;
  knownEntity?: {
    name: string;
    type: 'exchange' | 'mixer' | 'whale' | 'unknown';
  };
}

export interface TransactionPatterns {
  isAccumulation: boolean;
  isDistribution: boolean;
  isMixing: boolean;
  exchangeFlow: 'deposit' | 'withdrawal' | 'none';
}

export interface DeepDiveData {
  sourceAddress: BlockchainAddressData;
  destinationAddress: BlockchainAddressData;
  transactionChain: Array<{
    hop: number;
    from: string;
    to: string;
    amount: number;
    timestamp: string;
  }>;
  patterns: TransactionPatterns;
}

// Cache for blockchain data (5-minute TTL)
const blockchainDataCache = new Map<string, {
  data: BlockchainAddressData;
  timestamp: number;
}>();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Identify known entities (exchanges, mixers, etc.)
 * In production, this would query a database of known addresses
 */
function identifyKnownEntity(address: string): BlockchainAddressData['knownEntity'] {
  // Known exchange addresses (simplified - would be a database in production)
  const knownExchanges: Record<string, string> = {
    // Binance cold wallets
    '34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo': 'Binance',
    'bc1qgdjqv0av3q56jvd82tkdjpy7gdp9ut8tlqmgrpmv24sq90ecnvqqjwvw97': 'Binance',
    // Coinbase
    '3D2oetdNuZUqQHPJmcMDDHYoqkyNVsFk9r': 'Coinbase',
    // Kraken
    '3FupZp77ySr7jwoLYEJ9mwzJpvoNBXsBnE': 'Kraken',
  };
  
  if (knownExchanges[address]) {
    return {
      name: knownExchanges[address],
      type: 'exchange',
    };
  }
  
  return undefined;
}

/**
 * Determine if a transaction is incoming or outgoing for a given address
 */
function determineTransactionType(
  tx: any,
  address: string
): 'incoming' | 'outgoing' {
  // Check if address is in outputs (incoming)
  const isIncoming = tx.out.some((output: any) => output.addr === address);
  return isIncoming ? 'incoming' : 'outgoing';
}

/**
 * Create empty address data for error fallback
 */
function createEmptyAddressData(address: string): BlockchainAddressData {
  return {
    address,
    totalReceived: 0,
    totalSent: 0,
    balance: 0,
    transactionCount: 0,
    recentTransactions: [],
    volume30Days: 0,
  };
}

/**
 * Sleep utility for exponential backoff
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Error types for blockchain API failures
 */
export enum BlockchainErrorType {
  RATE_LIMIT = 'RATE_LIMIT',
  TIMEOUT = 'TIMEOUT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Blockchain API error with detailed information
 */
export class BlockchainAPIError extends Error {
  constructor(
    public type: BlockchainErrorType,
    public address: string,
    public statusCode?: number,
    public retryable: boolean = false,
    message?: string
  ) {
    super(message || `Blockchain API error: ${type}`);
    this.name = 'BlockchainAPIError';
  }
}

/**
 * Classify error type for better handling
 */
function classifyError(error: any, statusCode?: number): BlockchainErrorType {
  if (statusCode === 429) return BlockchainErrorType.RATE_LIMIT;
  if (statusCode === 400) return BlockchainErrorType.INVALID_ADDRESS;
  if (statusCode && statusCode >= 500) return BlockchainErrorType.SERVER_ERROR;
  if (error.name === 'AbortError' || error.name === 'TimeoutError') {
    return BlockchainErrorType.TIMEOUT;
  }
  if (error.message?.includes('fetch') || error.message?.includes('network')) {
    return BlockchainErrorType.NETWORK_ERROR;
  }
  return BlockchainErrorType.UNKNOWN;
}

/**
 * Determine if error is retryable
 */
function isRetryableError(errorType: BlockchainErrorType): boolean {
  return [
    BlockchainErrorType.RATE_LIMIT,
    BlockchainErrorType.TIMEOUT,
    BlockchainErrorType.NETWORK_ERROR,
    BlockchainErrorType.SERVER_ERROR,
  ].includes(errorType);
}

/**
 * Fetch address data from Blockchain.com API with enhanced error handling
 * 
 * Features:
 * - Exponential backoff for rate limits (1s, 2s, 4s, 8s)
 * - Graceful degradation on failures
 * - Detailed error classification
 * - Timeout protection
 * 
 * @param address - Bitcoin address to fetch data for
 * @param retryCount - Current retry attempt (for exponential backoff)
 * @returns Address data including transaction history and volume
 * @throws BlockchainAPIError with detailed error information
 */
export async function fetchAddressData(
  address: string,
  retryCount: number = 0
): Promise<BlockchainAddressData> {
  const baseUrl = 'https://blockchain.info';
  const maxRetries = 3;
  const timeoutMs = 10000; // 10 second timeout
  
  try {
    console.log(`[Blockchain] Fetching data for ${address.substring(0, 10)}... (attempt ${retryCount + 1})`);
    
    // Fetch address summary with last 10 transactions
    const response = await fetch(
      `${baseUrl}/rawaddr/${address}?limit=10`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'BitcoinSovereignTech/1.0',
        },
        signal: AbortSignal.timeout(timeoutMs),
      }
    );
    
    const statusCode = response.status;
    
    // Handle rate limiting with exponential backoff
    if (statusCode === 429) {
      if (retryCount < maxRetries) {
        const backoffDelay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s, 8s
        console.warn(
          `⚠️ [Blockchain] Rate limited (429), retrying in ${backoffDelay}ms ` +
          `(attempt ${retryCount + 1}/${maxRetries})`
        );
        await sleep(backoffDelay);
        return fetchAddressData(address, retryCount + 1);
      } else {
        throw new BlockchainAPIError(
          BlockchainErrorType.RATE_LIMIT,
          address,
          429,
          false,
          'Rate limit exceeded after maximum retries'
        );
      }
    }
    
    // Handle server errors with retry
    if (statusCode >= 500 && statusCode < 600) {
      if (retryCount < maxRetries) {
        const backoffDelay = Math.pow(2, retryCount) * 1000;
        console.warn(
          `⚠️ [Blockchain] Server error (${statusCode}), retrying in ${backoffDelay}ms ` +
          `(attempt ${retryCount + 1}/${maxRetries})`
        );
        await sleep(backoffDelay);
        return fetchAddressData(address, retryCount + 1);
      } else {
        throw new BlockchainAPIError(
          BlockchainErrorType.SERVER_ERROR,
          address,
          statusCode,
          false,
          `Server error ${statusCode} after maximum retries`
        );
      }
    }
    
    // Handle invalid address
    if (statusCode === 400) {
      throw new BlockchainAPIError(
        BlockchainErrorType.INVALID_ADDRESS,
        address,
        400,
        false,
        'Invalid Bitcoin address format'
      );
    }
    
    // Handle other non-OK responses
    if (!response.ok) {
      throw new BlockchainAPIError(
        BlockchainErrorType.UNKNOWN,
        address,
        statusCode,
        false,
        `Blockchain API error: ${statusCode}`
      );
    }
    
    const data = await response.json();
    
    // Validate response data
    if (!data || typeof data !== 'object') {
      throw new BlockchainAPIError(
        BlockchainErrorType.UNKNOWN,
        address,
        undefined,
        false,
        'Invalid response data from Blockchain API'
      );
    }
    
    // Calculate 30-day volume
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const recentTxs = (data.txs || []).filter((tx: any) => tx.time * 1000 > thirtyDaysAgo);
    const volume30Days = recentTxs.reduce((sum: number, tx: any) => {
      const amount = (tx.out || []).reduce((s: number, o: any) => s + (o.value || 0), 0) / 100000000;
      return sum + amount;
    }, 0);
    
    // Identify known entity
    const knownEntity = identifyKnownEntity(address);
    
    const addressData: BlockchainAddressData = {
      address,
      totalReceived: (data.total_received || 0) / 100000000, // Convert satoshis to BTC
      totalSent: (data.total_sent || 0) / 100000000,
      balance: (data.final_balance || 0) / 100000000,
      transactionCount: data.n_tx || 0,
      recentTransactions: (data.txs || []).slice(0, 10).map((tx: any) => ({
        hash: tx.hash || '',
        time: new Date((tx.time || 0) * 1000).toISOString(),
        amount: (tx.out || []).reduce((s: number, o: any) => s + (o.value || 0), 0) / 100000000,
        type: determineTransactionType(tx, address),
      })),
      volume30Days,
      knownEntity,
    };
    
    console.log(`✅ [Blockchain] Successfully fetched data for ${address.substring(0, 10)}...`);
    return addressData;
    
  } catch (error) {
    // Classify the error
    const errorType = error instanceof BlockchainAPIError 
      ? error.type 
      : classifyError(error, undefined);
    
    const isRetryable = isRetryableError(errorType);
    
    // Log detailed error information
    console.error(
      `❌ [Blockchain] Failed to fetch data for ${address.substring(0, 10)}...`,
      {
        errorType,
        isRetryable,
        retryCount,
        maxRetries,
        error: error instanceof Error ? error.message : String(error),
      }
    );
    
    // Retry for retryable errors
    if (isRetryable && retryCount < maxRetries) {
      const backoffDelay = Math.pow(2, retryCount) * 1000;
      console.warn(
        `⚠️ [Blockchain] Retrying after ${backoffDelay}ms ` +
        `(attempt ${retryCount + 1}/${maxRetries})`
      );
      await sleep(backoffDelay);
      return fetchAddressData(address, retryCount + 1);
    }
    
    // Return empty data to allow analysis to proceed
    console.warn(
      `⚠️ [Blockchain] Returning empty data for ${address.substring(0, 10)}... ` +
      `to allow analysis to proceed`
    );
    return createEmptyAddressData(address);
  }
}

/**
 * Fetch address data with caching (5-minute TTL)
 * 
 * @param address - Bitcoin address to fetch data for
 * @returns Cached or fresh address data
 */
export async function fetchAddressDataCached(
  address: string
): Promise<BlockchainAddressData> {
  const cached = blockchainDataCache.get(address);
  const now = Date.now();
  
  // Return cached data if still valid
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    console.log(`[Blockchain] Using cached data for ${address.substring(0, 10)}...`);
    return cached.data;
  }
  
  // Fetch fresh data
  console.log(`[Blockchain] Fetching fresh data for ${address.substring(0, 10)}...`);
  const data = await fetchAddressData(address);
  
  // Cache the result
  blockchainDataCache.set(address, { data, timestamp: now });
  
  return data;
}

/**
 * Clear the blockchain data cache
 */
export function clearBlockchainCache(): void {
  blockchainDataCache.clear();
  console.log('[Blockchain] Cache cleared');
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; entries: string[] } {
  return {
    size: blockchainDataCache.size,
    entries: Array.from(blockchainDataCache.keys()).map(addr => 
      `${addr.substring(0, 10)}...`
    ),
  };
}

/**
 * Analyze transaction patterns for both source and destination addresses
 * 
 * Detects:
 * - Accumulation patterns (more incoming than outgoing)
 * - Distribution patterns (more outgoing than incoming)
 * - Mixing behavior (many small transactions)
 * - Exchange flow direction (deposit/withdrawal)
 * 
 * @param sourceData - Blockchain data for source address
 * @param destData - Blockchain data for destination address
 * @returns Detected transaction patterns
 */
export function analyzeTransactionPatterns(
  sourceData: BlockchainAddressData,
  destData: BlockchainAddressData
): TransactionPatterns {
  // Accumulation: Destination receiving more than sending (1.5x threshold)
  const isAccumulation = destData.totalReceived > destData.totalSent * 1.5;
  
  // Distribution: Source sending more than receiving (1.5x threshold)
  const isDistribution = sourceData.totalSent > sourceData.totalReceived * 1.5;
  
  // Mixing: Many transactions with small amounts
  // Indicators: High transaction count, many recent small transactions
  const hasHighTxCount = sourceData.transactionCount > 100;
  const hasManyRecentTxs = sourceData.recentTransactions.length > 5;
  const hasSmallAmounts = sourceData.recentTransactions.every(tx => tx.amount < 1);
  const isMixing = hasHighTxCount && hasManyRecentTxs && hasSmallAmounts;
  
  // Exchange flow detection based on known entities
  let exchangeFlow: 'deposit' | 'withdrawal' | 'none' = 'none';
  
  if (destData.knownEntity?.type === 'exchange') {
    // Funds going to exchange = deposit
    exchangeFlow = 'deposit';
  } else if (sourceData.knownEntity?.type === 'exchange') {
    // Funds coming from exchange = withdrawal
    exchangeFlow = 'withdrawal';
  }
  
  console.log('[Pattern Analysis]', {
    isAccumulation,
    isDistribution,
    isMixing,
    exchangeFlow,
    sourceStats: {
      totalReceived: sourceData.totalReceived,
      totalSent: sourceData.totalSent,
      txCount: sourceData.transactionCount,
    },
    destStats: {
      totalReceived: destData.totalReceived,
      totalSent: destData.totalSent,
      txCount: destData.transactionCount,
    },
  });
  
  return {
    isAccumulation,
    isDistribution,
    isMixing,
    exchangeFlow,
  };
}

/**
 * Result of Deep Dive data fetch with error information
 */
export interface DeepDiveDataResult {
  data: DeepDiveData;
  success: boolean;
  errors: Array<{
    address: string;
    errorType: BlockchainErrorType;
    message: string;
  }>;
  dataSourceLimitations: string[];
}

/**
 * Fetch complete Deep Dive data for a whale transaction with enhanced error handling
 * 
 * Features:
 * - Parallel fetching with individual error handling
 * - Graceful degradation (proceeds even if one address fails)
 * - Detailed error reporting
 * - Data source limitation tracking
 * 
 * @param fromAddress - Source address
 * @param toAddress - Destination address
 * @returns Complete Deep Dive data with error information and limitations
 */
export async function fetchDeepDiveData(
  fromAddress: string,
  toAddress: string
): Promise<DeepDiveDataResult> {
  const timeout = 5000; // 5 seconds max for blockchain data (Vercel timeout constraint)
  const errors: Array<{ address: string; errorType: BlockchainErrorType; message: string }> = [];
  const dataSourceLimitations: string[] = [];
  
  console.log('[Deep Dive] Fetching blockchain data for both addresses...');
  
  try {
    // Fetch both addresses in parallel with individual error handling
    const fetchPromises = Promise.all([
      fetchAddressDataCached(fromAddress).catch((error) => {
        const errorType = error instanceof BlockchainAPIError 
          ? error.type 
          : BlockchainErrorType.UNKNOWN;
        
        errors.push({
          address: fromAddress,
          errorType,
          message: error instanceof Error ? error.message : String(error),
        });
        
        console.warn(
          `⚠️ [Deep Dive] Failed to fetch source address data, using fallback`
        );
        return createEmptyAddressData(fromAddress);
      }),
      fetchAddressDataCached(toAddress).catch((error) => {
        const errorType = error instanceof BlockchainAPIError 
          ? error.type 
          : BlockchainErrorType.UNKNOWN;
        
        errors.push({
          address: toAddress,
          errorType,
          message: error instanceof Error ? error.message : String(error),
        });
        
        console.warn(
          `⚠️ [Deep Dive] Failed to fetch destination address data, using fallback`
        );
        return createEmptyAddressData(toAddress);
      }),
    ]);
    
    // Race against timeout
    const [sourceData, destData] = await Promise.race([
      fetchPromises,
      new Promise<never>((_, reject) => 
        setTimeout(() => {
          reject(new BlockchainAPIError(
            BlockchainErrorType.TIMEOUT,
            'both',
            undefined,
            false,
            'Blockchain data fetch timeout after 15 seconds'
          ));
        }, timeout)
      ),
    ]);
    
    // Check if we got real data or fallback empty data
    const sourceDataAvailable = sourceData.transactionCount > 0;
    const destDataAvailable = destData.transactionCount > 0;
    
    // Track data source limitations
    if (!sourceDataAvailable) {
      dataSourceLimitations.push(
        `Source address (${fromAddress.substring(0, 10)}...) blockchain data unavailable`
      );
    }
    
    if (!destDataAvailable) {
      dataSourceLimitations.push(
        `Destination address (${toAddress.substring(0, 10)}...) blockchain data unavailable`
      );
    }
    
    if (errors.length > 0) {
      const errorTypes = [...new Set(errors.map(e => e.errorType))];
      if (errorTypes.includes(BlockchainErrorType.RATE_LIMIT)) {
        dataSourceLimitations.push(
          'Blockchain.com API rate limit reached - some data may be incomplete'
        );
      }
      if (errorTypes.includes(BlockchainErrorType.TIMEOUT)) {
        dataSourceLimitations.push(
          'Blockchain data fetch timed out - analysis based on available information'
        );
      }
      if (errorTypes.includes(BlockchainErrorType.NETWORK_ERROR)) {
        dataSourceLimitations.push(
          'Network connectivity issues - blockchain data may be incomplete'
        );
      }
    }
    
    // Analyze patterns (even with partial data)
    const patterns = analyzeTransactionPatterns(sourceData, destData);
    
    const success = sourceDataAvailable && destDataAvailable && errors.length === 0;
    
    if (success) {
      console.log('✅ [Deep Dive] Blockchain data fetched successfully for both addresses');
    } else {
      console.warn(
        `⚠️ [Deep Dive] Blockchain data fetch completed with limitations: ` +
        `${dataSourceLimitations.length} limitation(s), ${errors.length} error(s)`
      );
    }
    
    return {
      data: {
        sourceAddress: sourceData,
        destinationAddress: destData,
        transactionChain: [], // Would be populated with multi-hop analysis in future
        patterns,
      },
      success,
      errors,
      dataSourceLimitations,
    };
    
  } catch (error) {
    // Handle catastrophic failure (e.g., timeout for both addresses)
    const errorType = error instanceof BlockchainAPIError 
      ? error.type 
      : BlockchainErrorType.UNKNOWN;
    
    console.error('[Deep Dive] Catastrophic data fetch failure:', error);
    
    errors.push({
      address: 'both',
      errorType,
      message: error instanceof Error ? error.message : String(error),
    });
    
    dataSourceLimitations.push(
      'Complete blockchain data fetch failure - analysis based on transaction details only'
    );
    
    if (errorType === BlockchainErrorType.TIMEOUT) {
      dataSourceLimitations.push(
        'Blockchain API timeout - network or service issues detected'
      );
    }
    
    // Return minimal data to allow analysis to proceed
    return {
      data: {
        sourceAddress: createEmptyAddressData(fromAddress),
        destinationAddress: createEmptyAddressData(toAddress),
        transactionChain: [],
        patterns: {
          isAccumulation: false,
          isDistribution: false,
          isMixing: false,
          exchangeFlow: 'none',
        },
      },
      success: false,
      errors,
      dataSourceLimitations,
    };
  }
}
