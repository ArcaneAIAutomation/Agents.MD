/**
 * Blockchain.com API Integration
 * 
 * Fetches real-time Bitcoin on-chain data from Blockchain.com.
 * Provides mempool size, difficulty, hash rate, and network stats.
 */

import { trackAPICall } from '../performanceMonitor';

export interface BlockchainStats {
  mempoolSize: number; // Number of unconfirmed transactions
  difficulty: number; // Current mining difficulty
  hashRate: number; // Network hash rate (hashes per second)
  totalBTC: number; // Total BTC in circulation
  blockHeight: number; // Current block height
  avgBlockTime: number; // Average block time in minutes
  last_updated: number;
}

export interface BlockchainResponse {
  success: boolean;
  data: BlockchainStats | null;
  error?: string;
  source: 'Blockchain.com';
}

/**
 * Fetch Bitcoin on-chain data from Blockchain.com API
 */
export async function fetchBlockchainData(): Promise<BlockchainResponse> {
  try {
    const result = await trackAPICall(
      'Blockchain.com',
      '/stats',
      'GET',
      async () => {
        const url = 'https://blockchain.info/stats?format=json';
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Blockchain.com API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Validate response structure
        if (!data.n_tx || !data.difficulty) {
          throw new Error('Invalid Blockchain.com API response structure');
        }
        
        return {
          mempoolSize: data.n_tx_mempool || 0,
          difficulty: data.difficulty || 0,
          hashRate: data.hash_rate || 0,
          totalBTC: (data.totalbc || 0) / 100000000, // Convert satoshis to BTC
          blockHeight: data.n_blocks_total || 0,
          avgBlockTime: data.minutes_between_blocks || 10,
          last_updated: Date.now(),
        };
      }
    );
    
    return {
      success: true,
      data: result,
      source: 'Blockchain.com',
    };
  } catch (error) {
    console.error('[Blockchain.com] Error fetching data:', error);
    
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      source: 'Blockchain.com',
    };
  }
}
