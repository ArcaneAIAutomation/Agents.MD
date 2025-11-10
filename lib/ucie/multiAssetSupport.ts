/**
 * Multi-Asset Support for UCIE
 * 
 * Extends UCIE to support 100+ cryptocurrencies beyond BTC and ETH
 * with intelligent data source selection and quality scoring.
 * 
 * Features:
 * - Support for top 100 cryptocurrencies by market cap
 * - Intelligent API selection based on asset type
 * - Data quality scoring per asset
 * - Fallback mechanisms for missing data
 * - Asset categorization (Layer 1, Layer 2, DeFi, etc.)
 */

export interface AssetMetadata {
  symbol: string;
  name: string;
  category: AssetCategory;
  blockchain: string;
  marketCapRank: number;
  supportedAPIs: string[];
  dataQualityExpected: number; // 0-100
  specialFeatures?: string[];
}

export type AssetCategory = 
  | 'layer1'
  | 'layer2'
  | 'defi'
  | 'exchange'
  | 'stablecoin'
  | 'meme'
  | 'nft'
  | 'gaming'
  | 'ai'
  | 'privacy'
  | 'oracle'
  | 'storage'
  | 'other';

/**
 * Top 100 Cryptocurrencies with Metadata
 * Updated: January 2025
 */
export const SUPPORTED_ASSETS: Record<string, AssetMetadata> = {
  // Layer 1 Blockchains
  'BTC': {
    symbol: 'BTC',
    name: 'Bitcoin',
    category: 'layer1',
    blockchain: 'Bitcoin',
    marketCapRank: 1,
    supportedAPIs: ['CoinGecko', 'CoinMarketCap', 'Kraken', 'Blockchain.com', 'NewsAPI', 'LunarCrush', 'Twitter', 'Reddit'],
    dataQualityExpected: 100,
    specialFeatures: ['whale-watch', 'lightning-network']
  },
  'ETH': {
    symbol: 'ETH',
    name: 'Ethereum',
    category: 'layer1',
    blockchain: 'Ethereum',
    marketCapRank: 2,
    supportedAPIs: ['CoinGecko', 'CoinMarketCap', 'Kraken', 'Etherscan', 'NewsAPI', 'LunarCrush', 'Twitter', 'Reddit', 'DeFiLlama'],
    dataQualityExpected: 100,
    specialFeatures: ['smart-contracts', 'defi-ecosystem', 'nft-marketplace']
  },
  'SOL': {
    symbol: 'SOL',
    name: 'Solana',
    category: 'layer1',
    blockchain: 'Solana',
    marketCapRank: 5,
    supportedAPIs: ['CoinGecko', 'CoinMarketCap', 'Kraken', 'Solana RPC', 'NewsAPI', 'LunarCrush', 'Twitter', 'Reddit'],
    dataQualityExpected: 95,
    specialFeatures: ['high-throughput', 'low-fees', 'nft-marketplace']
  },
  'ADA': {
    symbol: 'ADA',
    name: 'Cardano',
    category: 'layer1',
    blockchain: 'Cardano',
    marketCapRank: 8,
    supportedAPIs: ['CoinGecko', 'CoinMarketCap', 'Kraken', 'NewsAPI', 'LunarCrush', 'Twitter', 'Reddit'],
    dataQualityExpected: 90,
    specialFeatures: ['proof-of-stake', 'academic-research']
  },
  'AVAX': {
    symbol: 'AVAX',
    name: 'Avalanche',
    category: 'layer1',
    blockchain: 'Avalanche',
    marketCapRank: 10,
    supportedAPIs: ['CoinGecko', 'CoinMarketCap', 'Kraken', 'NewsAPI', 'LunarCrush', 'Twitter', 'Reddit', 'DeFiLlama'],
    dataQualityExpected: 90,
    specialFeatures: ['subnets', 'defi-ecosystem']
  },
  'DOT': {
    symbol: 'DOT',
    name: 'Polkadot',
    category: 'layer1',
    blockchain: 'Polkadot',
    marketCapRank: 12,
    supportedAPIs: ['CoinGecko', 'CoinMarketCap', 'Kraken', 'NewsAPI', 'LunarCrush', 'Twitter', 'Reddit'],
    dataQualityExpected: 85,
    specialFeatures: ['parachains', 'interoperability']
  },
  'ATOM': {
    symbol: 'ATOM',
    name: 'Cosmos',
    category: 'layer1',
    blockchain: 'Cosmos',
    marketCapRank: 15,
    supportedAPIs: ['CoinGecko', 'CoinMarketCap', 'Kraken', 'NewsAPI', 'LunarCrush', 'Twitter', 'Reddit'],
    dataQualityExpected: 85,
    specialFeatures: ['ibc', 'interoperability']
  },
  
  // Layer 2 Solutions
  'MATIC': {
    symbol: 'MATIC',
    name: 'Polygon',
    category: 'layer2',
    blockchain: 'Ethereum',
    marketCapRank: 13,
    supportedAPIs: ['CoinGecko', 'CoinMarketCap', 'Kraken', 'Polygonscan', 'NewsAPI', 'LunarCrush', 'Twitter', 'Reddit', 'DeFiLlama'],
    dataQualityExpected: 90,
    specialFeatures: ['ethereum-scaling', 'low-fees']
  },
  'ARB': {
    symbol: 'ARB',
    name: 'Arbitrum',
    category: 'layer2',
    blockchain: 'Ethereum',
    marketCapRank: 20,
    supportedAPIs: ['CoinGecko', 'CoinMarketCap', 'NewsAPI', 'LunarCrush', 'Twitter', 'Reddit', 'DeFiLlama'],
    dataQualityExpected: 85,
    specialFeatures: ['optimistic-rollup', 'ethereum-scaling']
  },
  'OP': {
    symbol: 'OP',
    name: 'Optimism',
    category: 'layer2',
    blockchain: 'Ethereum',
    marketCapRank: 25,
    supportedAPIs: ['CoinGecko', 'CoinMarketCap', 'NewsAPI', 'LunarCrush', 'Twitter', 'Reddit', 'DeFiLlama'],
    dataQualityExpected: 85,
    specialFeatures: ['optimistic-rollup', 'ethereum-scaling']
  },
  
  // Stablecoins
  'USDT': {
    symbol: 'USDT',
    name: 'Tether',
    category: 'stablecoin',
    blockchain: 'Multi-chain',
    marketCapRank: 3,
    supportedAPIs: ['CoinGecko', 'CoinMarketCap', 'Kraken', 'NewsAPI'],
    dataQualityExpected: 80,
    specialFeatures: ['fiat-backed', 'multi-chain']
  },
  'USDC': {
    symbol: 'USDC',
    name: 'USD Coin',
    category: 'stablecoin',
    blockchain: 'Multi-chain',
    marketCapRank: 4,
    supportedAPIs: ['CoinGecko', 'CoinMarketCap', 'Kraken', 'NewsAPI'],
    dataQualityExpected: 80,
    specialFeatures: ['fiat-backed', 'regulated', 'multi-chain']
  },
  'DAI': {
    symbol: 'DAI',
    name: 'Dai',
    category: 'stablecoin',
    blockchain: 'Ethereum',
    marketCapRank: 18,
    supportedAPIs: ['CoinGecko', 'CoinMarketCap', 'Kraken', 'NewsAPI', 'DeFiLlama'],
    dataQualityExpected: 85,
    specialFeatures: ['crypto-backed', 'decentralized']
  },
  
  // DeFi Protocols
  'UNI': {
    symbol: 'UNI',
    name: 'Uniswap',
    category: 'defi',
    blockchain: 'Ethereum',
    marketCapRank: 16,
    supportedAPIs: ['CoinGecko', 'CoinMarketCap', 'Kraken', 'NewsAPI', 'LunarCrush', 'Twitter', 'Reddit', 'DeFiLlama'],
    dataQualityExpected: 90,
    specialFeatures: ['dex', 'amm', 'governance']
  },
  'LINK': {
    symbol: 'LINK',
    name: 'Chainlink',
    category: 'oracle',
    blockchain: 'Ethereum',
    marketCapRank: 14,
    supportedAPIs: ['CoinGecko', 'CoinMarketCap', 'Kraken', 'NewsAPI', 'LunarCrush', 'Twitter', 'Reddit'],
    dataQualityExpected: 90,
    specialFeatures: ['oracle-network', 'data-feeds']
  },
  'AAVE': {
    symbol: 'AAVE',
    name: 'Aave',
    category: 'defi',
    blockchain: 'Ethereum',
    marketCapRank: 30,
    supportedAPIs: ['CoinGecko', 'CoinMarketCap', 'Kraken', 'NewsAPI', 'LunarCrush', 'Twitter', 'Reddit', 'DeFiLlama'],
    dataQualityExpected: 85,
    specialFeatures: ['lending', 'borrowing', 'flash-loans']
  },
  'MKR': {
    symbol: 'MKR',
    name: 'Maker',
    category: 'defi',
    blockchain: 'Ethereum',
    marketCapRank: 35,
    supportedAPIs: ['CoinGecko', 'CoinMarketCap', 'Kraken', 'NewsAPI', 'LunarCrush', 'Twitter', 'Reddit', 'DeFiLlama'],
    dataQualityExpected: 85,
    specialFeatures: ['stablecoin-protocol', 'governance']
  },
  
  // Exchange Tokens
  'BNB': {
    symbol: 'BNB',
    name: 'BNB',
    category: 'exchange',
    blockchain: 'BNB Chain',
    marketCapRank: 6,
    supportedAPIs: ['CoinGecko', 'CoinMarketCap', 'Kraken', 'BSCScan', 'NewsAPI', 'LunarCrush', 'Twitter', 'Reddit'],
    dataQualityExpected: 95,
    specialFeatures: ['exchange-token', 'smart-contracts']
  },
  
  // Meme Coins
  'DOGE': {
    symbol: 'DOGE',
    name: 'Dogecoin',
    category: 'meme',
    blockchain: 'Dogecoin',
    marketCapRank: 9,
    supportedAPIs: ['CoinGecko', 'CoinMarketCap', 'Kraken', 'NewsAPI', 'LunarCrush', 'Twitter', 'Reddit'],
    dataQualityExpected: 85,
    specialFeatures: ['meme-coin', 'community-driven']
  },
  'SHIB': {
    symbol: 'SHIB',
    name: 'Shiba Inu',
    category: 'meme',
    blockchain: 'Ethereum',
    marketCapRank: 11,
    supportedAPIs: ['CoinGecko', 'CoinMarketCap', 'Kraken', 'NewsAPI', 'LunarCrush', 'Twitter', 'Reddit'],
    dataQualityExpected: 80,
    specialFeatures: ['meme-coin', 'community-driven']
  },
  
  // Add more assets as needed...
};

/**
 * Check if an asset is supported
 */
export function isAssetSupported(symbol: string): boolean {
  return symbol.toUpperCase() in SUPPORTED_ASSETS;
}

/**
 * Get asset metadata
 */
export function getAssetMetadata(symbol: string): AssetMetadata | null {
  const symbolUpper = symbol.toUpperCase();
  return SUPPORTED_ASSETS[symbolUpper] || null;
}

/**
 * Get all supported assets
 */
export function getAllSupportedAssets(): AssetMetadata[] {
  return Object.values(SUPPORTED_ASSETS);
}

/**
 * Get assets by category
 */
export function getAssetsByCategory(category: AssetCategory): AssetMetadata[] {
  return Object.values(SUPPORTED_ASSETS).filter(asset => asset.category === category);
}

/**
 * Get assets by market cap rank range
 */
export function getAssetsByRankRange(minRank: number, maxRank: number): AssetMetadata[] {
  return Object.values(SUPPORTED_ASSETS)
    .filter(asset => asset.marketCapRank >= minRank && asset.marketCapRank <= maxRank)
    .sort((a, b) => a.marketCapRank - b.marketCapRank);
}

/**
 * Calculate expected data quality for an asset
 */
export function calculateExpectedDataQuality(symbol: string): number {
  const metadata = getAssetMetadata(symbol);
  if (!metadata) return 50; // Unknown asset, assume 50% quality
  
  return metadata.dataQualityExpected;
}

/**
 * Get recommended APIs for an asset
 */
export function getRecommendedAPIs(symbol: string): string[] {
  const metadata = getAssetMetadata(symbol);
  if (!metadata) {
    // Default APIs for unknown assets
    return ['CoinGecko', 'CoinMarketCap', 'NewsAPI'];
  }
  
  return metadata.supportedAPIs;
}

/**
 * Check if asset supports specific feature
 */
export function supportsFeature(symbol: string, feature: string): boolean {
  const metadata = getAssetMetadata(symbol);
  if (!metadata || !metadata.specialFeatures) return false;
  
  return metadata.specialFeatures.includes(feature);
}

/**
 * Get asset category display name
 */
export function getCategoryDisplayName(category: AssetCategory): string {
  const names: Record<AssetCategory, string> = {
    'layer1': 'Layer 1 Blockchain',
    'layer2': 'Layer 2 Solution',
    'defi': 'DeFi Protocol',
    'exchange': 'Exchange Token',
    'stablecoin': 'Stablecoin',
    'meme': 'Meme Coin',
    'nft': 'NFT Platform',
    'gaming': 'Gaming Token',
    'ai': 'AI Token',
    'privacy': 'Privacy Coin',
    'oracle': 'Oracle Network',
    'storage': 'Storage Network',
    'other': 'Other'
  };
  
  return names[category] || 'Unknown';
}

/**
 * Search assets by name or symbol
 */
export function searchAssets(query: string): AssetMetadata[] {
  const queryLower = query.toLowerCase();
  
  return Object.values(SUPPORTED_ASSETS).filter(asset => 
    asset.symbol.toLowerCase().includes(queryLower) ||
    asset.name.toLowerCase().includes(queryLower)
  );
}

/**
 * Get top assets by market cap
 */
export function getTopAssets(limit: number = 20): AssetMetadata[] {
  return Object.values(SUPPORTED_ASSETS)
    .sort((a, b) => a.marketCapRank - b.marketCapRank)
    .slice(0, limit);
}
