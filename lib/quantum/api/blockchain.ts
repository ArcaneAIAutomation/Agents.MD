/**
 * Blockchain.com API Client
 * Quantum BTC Super Spec - API Integration Layer
 * 
 * On-chain data: mempool, difficulty, whale transactions
 */

interface BlockchainStatsResponse {
  market_price_usd: number;
  hash_rate: number;
  total_fees_btc: number;
  n_btc_mined: number;
  n_tx: number;
  n_blocks_mined: number;
  minutes_between_blocks: number;
  totalbc: number;
  n_blocks_total: number;
  estimated_transaction_volume_usd: number;
  blocks_size: number;
  miners_revenue_usd: number;
  nextretarget: number;
  difficulty: number;
  estimated_btc_sent: number;
  miners_revenue_btc: number;
  total_btc_sent: number;
  trade_volume_btc: number;
  trade_volume_usd: number;
  timestamp: number;
}

interface MempoolInfo {
  size: number; // Number of transactions in mempool
  bytes: number; // Total size in bytes
  usage: number; // Memory usage
  maxmempool: number; // Maximum memory
  mempoolminfee: number; // Minimum fee rate
  minrelaytxfee: number; // Minimum relay fee
}

interface WhaleTransaction {
  hash: string;
  time: number;
  size: number;
  inputs: Array<{
    prev_out: {
      addr: string;
      value: number;
    };
  }>;
  out: Array<{
    addr: string;
    value: number;
  }>;
  result: number; // Net BTC moved
  balance: number;
}

interface BlockchainOnChainData {
  difficulty: number;
  hashRate: number;
  mempoolSize: number;
  mempoolBytes: number;
  avgBlockTime: number;
  totalBTC: number;
  dailyTransactions: number;
  dailyVolumeBTC: number;
  dailyVolumeUSD: number;
  minerRevenue: number;
  timestamp: string;
  source: 'blockchain.com';
}

interface RateLimitState {
  requests: number[];
  limit: number;
  window: number;
}

class BlockchainClient {
  private baseUrl = 'https://blockchain.info';
  private apiKey: string | null;
  private rateLimit: RateLimitState = {
    requests: [],
    limit: 10, // Conservative limit for public API
    window: 1000, // 1 second
  };

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.BLOCKCHAIN_API_KEY || null;
  }

  /**
   * Check if we're within rate limits
   */
  private checkRateLimit(): boolean {
    const now = Date.now();
    
    // Remove requests outside the current window
    this.rateLimit.requests = this.rateLimit.requests.filter(
      timestamp => now - timestamp < this.rateLimit.window
    );
    
    return this.rateLimit.requests.length < this.rateLimit.limit;
  }

  /**
   * Wait until rate limit allows next request
   */
  private async waitForRateLimit(): Promise<void> {
    while (!this.checkRateLimit()) {
      const oldestRequest = this.rateLimit.requests[0];
      const waitTime = this.rateLimit.window - (Date.now() - oldestRequest);
      
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime + 10));
      }
    }
    
    // Record this request
    this.rateLimit.requests.push(Date.now());
  }

  /**
   * Make API request with retry logic and exponential backoff
   */
  private async makeRequest<T>(
    endpoint: string,
    retries = 3,
    timeout = 10000
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        // Wait for rate limit
        await this.waitForRateLimit();
        
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        // Add API key if available
        const url = this.apiKey 
          ? `${this.baseUrl}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${this.apiKey}`
          : `${this.baseUrl}${endpoint}`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Blockchain.com API error: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        
        console.log(`✅ Blockchain.com API request successful (attempt ${attempt}/${retries})`);
        return data as T;
        
      } catch (error: any) {
        lastError = error;
        
        // Log error and retry
        console.error(`❌ Blockchain.com API error (attempt ${attempt}/${retries}):`, error.message);
        
        if (attempt < retries) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error('Blockchain.com API request failed after retries');
  }

  /**
   * Get blockchain statistics
   */
  async getStats(): Promise<BlockchainStatsResponse> {
    return this.makeRequest<BlockchainStatsResponse>('/stats');
  }

  /**
   * Get mempool information
   */
  async getMempoolInfo(): Promise<MempoolInfo> {
    return this.makeRequest<MempoolInfo>('/q/mempool');
  }

  /**
   * Get recent unconfirmed transactions (potential whale activity)
   */
  async getUnconfirmedTransactions(): Promise<WhaleTransaction[]> {
    const response = await this.makeRequest<{ txs: WhaleTransaction[] }>(
      '/unconfirmed-transactions?format=json'
    );
    
    return response.txs || [];
  }

  /**
   * Detect whale transactions (>50 BTC)
   */
  async detectWhaleTransactions(threshold: number = 50): Promise<WhaleTransaction[]> {
    const unconfirmed = await this.getUnconfirmedTransactions();
    
    // Filter for large transactions
    const whales = unconfirmed.filter(tx => {
      const btcAmount = Math.abs(tx.result) / 100000000; // Convert satoshis to BTC
      return btcAmount >= threshold;
    });
    
    // Sort by size (largest first)
    return whales.sort((a, b) => Math.abs(b.result) - Math.abs(a.result));
  }

  /**
   * Get comprehensive on-chain data
   */
  async getOnChainData(): Promise<BlockchainOnChainData> {
    const [stats, mempoolInfo] = await Promise.all([
      this.getStats(),
      this.getMempoolInfo().catch(() => ({
        size: 0,
        bytes: 0,
        usage: 0,
        maxmempool: 0,
        mempoolminfee: 0,
        minrelaytxfee: 0,
      })),
    ]);
    
    return {
      difficulty: stats.difficulty,
      hashRate: stats.hash_rate,
      mempoolSize: mempoolInfo.size,
      mempoolBytes: mempoolInfo.bytes,
      avgBlockTime: stats.minutes_between_blocks,
      totalBTC: stats.totalbc / 100000000, // Convert satoshis to BTC
      dailyTransactions: stats.n_tx,
      dailyVolumeBTC: stats.estimated_btc_sent,
      dailyVolumeUSD: stats.estimated_transaction_volume_usd,
      minerRevenue: stats.miners_revenue_usd,
      timestamp: new Date(stats.timestamp * 1000).toISOString(),
      source: 'blockchain.com',
    };
  }

  /**
   * Get comprehensive data including whale activity
   */
  async getComprehensiveData(whaleThreshold: number = 50): Promise<{
    onChain: BlockchainOnChainData;
    whales: WhaleTransaction[];
  }> {
    const [onChain, whales] = await Promise.all([
      this.getOnChainData(),
      this.detectWhaleTransactions(whaleThreshold),
    ]);
    
    return { onChain, whales };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    latency: number | null;
    error: string | null;
  }> {
    const startTime = Date.now();
    
    try {
      await this.getStats();
      return {
        healthy: true,
        latency: Date.now() - startTime,
        error: null,
      };
    } catch (error: any) {
      return {
        healthy: false,
        latency: Date.now() - startTime,
        error: error.message,
      };
    }
  }
}

// Export singleton instance
export const blockchainClient = new BlockchainClient();

// Export types
export type {
  BlockchainOnChainData,
  BlockchainStatsResponse,
  MempoolInfo,
  WhaleTransaction,
};
