/**
 * Blockchain API Client
 * Fetches real-time Bitcoin blockchain data for whale tracking
 */

const BLOCKCHAIN_API_KEY = process.env.BLOCKCHAIN_API_KEY;
const BLOCKCHAIN_API_URL = process.env.BLOCKCHAIN_API_URL || 'https://blockchain.info';

interface BitcoinTransaction {
  hash: string;
  time: number;
  size: number;
  block_height?: number;
  inputs: Array<{
    prev_out: {
      addr?: string;
      value: number;
    };
  }>;
  out: Array<{
    addr?: string;
    value: number;
  }>;
}

interface WhaleTransaction {
  txHash: string;
  blockchain: 'BTC';
  amount: number;
  amountUSD: number;
  fromAddress: string;
  toAddress: string;
  timestamp: Date;
  blockHeight?: number;
  isWhale: boolean;
}

export class BlockchainClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = BLOCKCHAIN_API_KEY || '';
    this.baseUrl = BLOCKCHAIN_API_URL;
  }

  /**
   * Get recent unconfirmed transactions (mempool)
   */
  async getUnconfirmedTransactions(): Promise<BitcoinTransaction[]> {
    try {
      console.log(`📡 Fetching unconfirmed transactions from ${this.baseUrl}/unconfirmed-transactions`);
      const url = `${this.baseUrl}/unconfirmed-transactions?format=json`;
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {})
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (!response.ok) {
        console.error(`❌ Blockchain.com API error: ${response.status}`);
        throw new Error(`Blockchain.com API error: ${response.status}`);
      }

      const data = await response.json();
      const txs = data.txs || [];
      console.log(`✅ Fetched ${txs.length} unconfirmed transactions`);
      return txs;
    } catch (error) {
      console.error('❌ Error fetching unconfirmed transactions:', error);
      // Return empty array instead of throwing - allow detection to continue with confirmed txs
      return [];
    }
  }

  /**
   * Get recent confirmed transactions
   */
  async getLatestBlock(): Promise<any> {
    try {
      console.log(`📡 Fetching latest block from ${this.baseUrl}/latestblock`);
      const url = `${this.baseUrl}/latestblock`;
      
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      if (!response.ok) {
        console.error(`❌ Blockchain.com API error: ${response.status}`);
        throw new Error(`Blockchain.com API error: ${response.status}`);
      }

      const block = await response.json();
      console.log(`✅ Latest block: ${block.height} (${block.hash?.substring(0, 20)}...)`);
      return block;
    } catch (error) {
      console.error('❌ Error fetching latest block:', error);
      return null;
    }
  }

  /**
   * Get transactions from a specific block
   */
  async getBlockTransactions(blockHash: string): Promise<BitcoinTransaction[]> {
    try {
      console.log(`📡 Fetching block transactions for ${blockHash.substring(0, 20)}...`);
      const url = `${this.baseUrl}/rawblock/${blockHash}`;
      
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(15000) // 15 second timeout (blocks can be large)
      });
      
      if (!response.ok) {
        console.error(`❌ Blockchain.com API error: ${response.status}`);
        throw new Error(`Blockchain.com API error: ${response.status}`);
      }

      const data = await response.json();
      const txs = data.tx || [];
      console.log(`✅ Fetched ${txs.length} transactions from block`);
      return txs;
    } catch (error) {
      console.error('❌ Error fetching block transactions:', error);
      return [];
    }
  }

  /**
   * Get address balance
   */
  async getAddressBalance(address: string): Promise<number> {
    try {
      const url = `${this.baseUrl}/balance?active=${address}&cors=true`;
      
      const response = await fetch(url, {
        headers: this.apiKey ? {
          'Authorization': `Bearer ${this.apiKey}`
        } : {}
      });

      if (!response.ok) {
        throw new Error(`Blockchain.com API error: ${response.status}`);
      }

      const data = await response.json();
      const balanceSatoshi = data[address]?.final_balance || 0;
      return balanceSatoshi / 1e8; // Convert to BTC
    } catch (error) {
      console.error('Error fetching address balance:', error);
      return 0;
    }
  }

  /**
   * Detect whale transactions (>50 BTC)
   * Returns transactions with total output > threshold
   */
  detectWhaleTransactions(
    transactions: BitcoinTransaction[],
    thresholdBTC: number = 50,
    currentBTCPrice: number = 45000
  ): WhaleTransaction[] {
    const whaleTransactions: WhaleTransaction[] = [];

    for (const tx of transactions) {
      // Calculate total output value
      const totalOutput = tx.out.reduce((sum, output) => sum + output.value, 0);
      const totalBTC = totalOutput / 1e8; // Convert satoshi to BTC

      // Check if it's a whale transaction
      if (totalBTC >= thresholdBTC) {
        // Get primary addresses
        const fromAddress = tx.inputs[0]?.prev_out?.addr || 'Unknown';
        const toAddress = tx.out[0]?.addr || 'Unknown';

        whaleTransactions.push({
          txHash: tx.hash,
          blockchain: 'BTC',
          amount: totalBTC,
          amountUSD: totalBTC * currentBTCPrice,
          fromAddress,
          toAddress,
          timestamp: new Date(tx.time * 1000),
          blockHeight: tx.block_height,
          isWhale: true
        });
      }
    }

    return whaleTransactions;
  }

  /**
   * Check if address is a known exchange
   */
  isKnownExchange(address: string): { isExchange: boolean; name?: string } {
    // Known exchange addresses (partial list)
    const knownExchanges: { [key: string]: string } = {
      // Binance
      'bc1qgdjqv0av3q56jvd82tkdjpy7gdp9ut8tlqmgrpmv24sq90ecnvqqjwvw97': 'Binance Cold Wallet',
      '34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo': 'Binance Hot Wallet',
      
      // Coinbase
      'bc1qm34lsc65zpw79lxes69zkqmk6ee3ewf0j77s3h': 'Coinbase',
      
      // Kraken
      'bc1qjasf9z3h7w3jspkhtgatgpyvvzgpa2wwd2lr0eh5tx44reyn2k7sfc27a4': 'Kraken',
      
      // Bitfinex
      'bc1qgdjqv0av3q56jvd82tkdjpy7gdp9ut8tlqmgrpmv24sq90ecnvqqjwvw97': 'Bitfinex'
    };

    const exchangeName = knownExchanges[address];
    return {
      isExchange: !!exchangeName,
      name: exchangeName
    };
  }

  /**
   * Classify transaction type
   */
  classifyTransaction(whale: WhaleTransaction): {
    type: 'exchange_deposit' | 'exchange_withdrawal' | 'whale_to_whale' | 'unknown';
    description: string;
  } {
    const fromExchange = this.isKnownExchange(whale.fromAddress);
    const toExchange = this.isKnownExchange(whale.toAddress);

    if (!fromExchange.isExchange && toExchange.isExchange) {
      return {
        type: 'exchange_deposit',
        description: `Deposit to ${toExchange.name || 'exchange'} - Potential sell pressure`
      };
    }

    if (fromExchange.isExchange && !toExchange.isExchange) {
      return {
        type: 'exchange_withdrawal',
        description: `Withdrawal from ${fromExchange.name || 'exchange'} - Potential accumulation`
      };
    }

    if (fromExchange.isExchange && toExchange.isExchange) {
      return {
        type: 'whale_to_whale',
        description: `Exchange to exchange transfer`
      };
    }

    return {
      type: 'unknown',
      description: 'Whale to whale transfer or OTC deal'
    };
  }
}

// Export singleton instance
export const blockchainClient = new BlockchainClient();
