/**
 * On-Chain Data Fetching Utilities
 * Fetches blockchain data from Etherscan, BSCScan, Polygonscan
 */

// Types
export interface HolderData {
  address: string;
  balance: string;
  percentage: number;
  rank: number;
}

export interface WhaleTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  valueUSD: number;
  timestamp: number;
  blockNumber: number;
  type: 'transfer' | 'exchange_deposit' | 'exchange_withdrawal';
}

export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  holders: number;
}

// API Clients
class BlockchainExplorerClient {
  private baseUrl: string;
  private apiKey: string;
  private chain: 'ethereum' | 'bsc' | 'polygon';

  constructor(chain: 'ethereum' | 'bsc' | 'polygon', apiKey: string) {
    this.chain = chain;
    this.apiKey = apiKey;
    
    switch (chain) {
      case 'ethereum':
        this.baseUrl = 'https://api.etherscan.io/api';
        break;
      case 'bsc':
        this.baseUrl = 'https://api.bscscan.com/api';
        break;
      case 'polygon':
        this.baseUrl = 'https://api.polygonscan.com/api';
        break;
    }
  }

  private async makeRequest(params: Record<string, string>): Promise<any> {
    const url = new URL(this.baseUrl);
    url.searchParams.append('apikey', this.apiKey);
    
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url.toString(), {
        signal: controller.signal,
        headers: {
          'User-Agent': 'UCIE/1.0'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === '0' && data.message !== 'No transactions found') {
        throw new Error(data.result || 'API error');
      }

      return data.result;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  async getTokenInfo(contractAddress: string): Promise<TokenInfo> {
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      this.makeRequest({
        module: 'token',
        action: 'tokeninfo',
        contractaddress: contractAddress
      }),
      this.makeRequest({
        module: 'stats',
        action: 'tokensupply',
        contractaddress: contractAddress
      })
    ]);

    return {
      address: contractAddress,
      name: name?.name || 'Unknown',
      symbol: symbol?.symbol || 'UNKNOWN',
      decimals: parseInt(name?.decimals || '18'),
      totalSupply: totalSupply || '0',
      holders: 0 // Will be fetched separately
    };
  }

  async getTopHolders(contractAddress: string, limit: number = 100): Promise<HolderData[]> {
    // Note: This endpoint may not be available on all explorers
    // We'll need to use alternative methods or third-party services
    try {
      const holders = await this.makeRequest({
        module: 'token',
        action: 'tokenholderlist',
        contractaddress: contractAddress,
        page: '1',
        offset: limit.toString()
      });

      if (!Array.isArray(holders)) {
        return [];
      }

      const totalSupply = parseFloat(holders.reduce((sum, h) => sum + parseFloat(h.TokenHolderQuantity || '0'), 0));

      return holders.map((holder: any, index: number) => ({
        address: holder.TokenHolderAddress,
        balance: holder.TokenHolderQuantity,
        percentage: (parseFloat(holder.TokenHolderQuantity) / totalSupply) * 100,
        rank: index + 1
      }));
    } catch (error) {
      console.warn(`Failed to fetch holders for ${this.chain}:`, error);
      return [];
    }
  }

  async getTokenTransfers(
    contractAddress: string,
    startBlock: number = 0,
    endBlock: number = 99999999,
    limit: number = 100
  ): Promise<any[]> {
    try {
      const transfers = await this.makeRequest({
        module: 'account',
        action: 'tokentx',
        contractaddress: contractAddress,
        startblock: startBlock.toString(),
        endblock: endBlock.toString(),
        page: '1',
        offset: limit.toString(),
        sort: 'desc'
      });

      return Array.isArray(transfers) ? transfers : [];
    } catch (error) {
      console.warn(`Failed to fetch transfers for ${this.chain}:`, error);
      return [];
    }
  }

  async getContractSourceCode(contractAddress: string): Promise<any> {
    try {
      const result = await this.makeRequest({
        module: 'contract',
        action: 'getsourcecode',
        address: contractAddress
      });

      return Array.isArray(result) && result.length > 0 ? result[0] : null;
    } catch (error) {
      console.warn(`Failed to fetch contract source for ${this.chain}:`, error);
      return null;
    }
  }
}

// Etherscan Client
export function createEtherscanClient(): BlockchainExplorerClient {
  const apiKey = process.env.ETHERSCAN_API_KEY || '';
  if (!apiKey) {
    console.warn('ETHERSCAN_API_KEY not configured');
  }
  return new BlockchainExplorerClient('ethereum', apiKey);
}

// BSCScan Client
export function createBSCScanClient(): BlockchainExplorerClient {
  const apiKey = process.env.BSCSCAN_API_KEY || '';
  if (!apiKey) {
    console.warn('BSCSCAN_API_KEY not configured');
  }
  return new BlockchainExplorerClient('bsc', apiKey);
}

// Polygonscan Client
export function createPolygonscanClient(): BlockchainExplorerClient {
  const apiKey = process.env.POLYGONSCAN_API_KEY || '';
  if (!apiKey) {
    console.warn('POLYGONSCAN_API_KEY not configured');
  }
  return new BlockchainExplorerClient('polygon', apiKey);
}

// Holder Distribution Fetching
export async function fetchHolderDistribution(
  contractAddress: string,
  chain: 'ethereum' | 'bsc' | 'polygon' = 'ethereum'
): Promise<HolderData[]> {
  let client: BlockchainExplorerClient;
  
  switch (chain) {
    case 'ethereum':
      client = createEtherscanClient();
      break;
    case 'bsc':
      client = createBSCScanClient();
      break;
    case 'polygon':
      client = createPolygonscanClient();
      break;
  }

  return await client.getTopHolders(contractAddress, 100);
}

// Whale Transaction Detection
export async function detectWhaleTransactions(
  contractAddress: string,
  chain: 'ethereum' | 'bsc' | 'polygon' = 'ethereum',
  thresholdUSD: number = 100000
): Promise<WhaleTransaction[]> {
  let client: BlockchainExplorerClient;
  
  switch (chain) {
    case 'ethereum':
      client = createEtherscanClient();
      break;
    case 'bsc':
      client = createBSCScanClient();
      break;
    case 'polygon':
      client = createPolygonscanClient();
      break;
  }

  const transfers = await client.getTokenTransfers(contractAddress);
  const tokenInfo = await client.getTokenInfo(contractAddress);
  
  // Get current token price (would need to integrate with price API)
  const tokenPriceUSD = 1; // Placeholder - integrate with CoinGecko/CMC

  const whaleTransactions: WhaleTransaction[] = [];

  for (const transfer of transfers) {
    const value = parseFloat(transfer.value) / Math.pow(10, tokenInfo.decimals);
    const valueUSD = value * tokenPriceUSD;

    if (valueUSD >= thresholdUSD) {
      // Classify transaction type
      let type: 'transfer' | 'exchange_deposit' | 'exchange_withdrawal' = 'transfer';
      
      // Simple heuristic - can be improved with exchange address database
      const knownExchanges = [
        '0x28c6c06298d514db089934071355e5743bf21d60', // Binance
        '0x21a31ee1afc51d94c2efccaa2092ad1028285549', // Binance 2
        '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be', // Binance 3
        // Add more exchange addresses
      ];

      if (knownExchanges.includes(transfer.to.toLowerCase())) {
        type = 'exchange_deposit';
      } else if (knownExchanges.includes(transfer.from.toLowerCase())) {
        type = 'exchange_withdrawal';
      }

      whaleTransactions.push({
        hash: transfer.hash,
        from: transfer.from,
        to: transfer.to,
        value: transfer.value,
        valueUSD,
        timestamp: parseInt(transfer.timeStamp),
        blockNumber: parseInt(transfer.blockNumber),
        type
      });
    }
  }

  return whaleTransactions.sort((a, b) => b.timestamp - a.timestamp);
}

// Get token info across chains
export async function getTokenInfo(
  contractAddress: string,
  chain: 'ethereum' | 'bsc' | 'polygon' = 'ethereum'
): Promise<TokenInfo | null> {
  let client: BlockchainExplorerClient;
  
  switch (chain) {
    case 'ethereum':
      client = createEtherscanClient();
      break;
    case 'bsc':
      client = createBSCScanClient();
      break;
    case 'polygon':
      client = createPolygonscanClient();
      break;
  }

  try {
    return await client.getTokenInfo(contractAddress);
  } catch (error) {
    console.error(`Failed to get token info for ${chain}:`, error);
    return null;
  }
}

// Get contract source code
export async function getContractSource(
  contractAddress: string,
  chain: 'ethereum' | 'bsc' | 'polygon' = 'ethereum'
): Promise<any> {
  let client: BlockchainExplorerClient;
  
  switch (chain) {
    case 'ethereum':
      client = createEtherscanClient();
      break;
    case 'bsc':
      client = createBSCScanClient();
      break;
    case 'polygon':
      client = createPolygonscanClient();
      break;
  }

  return await client.getContractSourceCode(contractAddress);
}
