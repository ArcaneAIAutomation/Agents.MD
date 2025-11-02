/**
 * On-Chain Analytics API Endpoint
 * Fetches and analyzes blockchain data for a given token
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import {
  fetchHolderDistribution,
  detectWhaleTransactions,
  getTokenInfo,
  HolderData,
  WhaleTransaction,
  TokenInfo
} from '../../../../lib/ucie/onChainData';
import {
  analyzeSmartContract,
  ContractSecurityScore
} from '../../../../lib/ucie/smartContractAnalysis';
import {
  analyzeWalletBehavior,
  WalletBehaviorSummary
} from '../../../../lib/ucie/walletBehavior';

interface OnChainAnalyticsResponse {
  success: boolean;
  symbol: string;
  chain: 'ethereum' | 'bsc' | 'polygon';
  timestamp: string;
  data?: {
    tokenInfo: TokenInfo | null;
    holders: HolderData[];
    holderConcentration: {
      giniCoefficient: number;
      top10Percentage: number;
      top50Percentage: number;
      top100Percentage: number;
      distributionScore: number;
    };
    whaleTransactions: WhaleTransaction[];
    exchangeFlows: {
      inflow24h: number;
      outflow24h: number;
      netFlow: number;
      trend: 'accumulation' | 'distribution' | 'neutral';
    };
    smartContract: ContractSecurityScore;
    walletBehavior: WalletBehaviorSummary;
  };
  error?: string;
  cached?: boolean;
}

// Simple in-memory cache (5 minutes TTL)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Token contract addresses (expand as needed)
const TOKEN_CONTRACTS: Record<string, { address: string; chain: 'ethereum' | 'bsc' | 'polygon' }> = {
  'ETH': { address: '0x0000000000000000000000000000000000000000', chain: 'ethereum' }, // Native ETH
  'USDT': { address: '0xdac17f958d2ee523a2206206994597c13d831ec7', chain: 'ethereum' },
  'USDC': { address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', chain: 'ethereum' },
  'BNB': { address: '0x0000000000000000000000000000000000000000', chain: 'bsc' }, // Native BNB
  'MATIC': { address: '0x0000000000000000000000000000000000000000', chain: 'polygon' }, // Native MATIC
  // Add more tokens as needed
};

/**
 * Calculate Gini coefficient for holder distribution
 * Measures inequality in token distribution (0 = perfect equality, 1 = perfect inequality)
 */
function calculateGiniCoefficient(holders: HolderData[]): number {
  if (holders.length === 0) return 0;

  const balances = holders.map(h => parseFloat(h.balance)).sort((a, b) => a - b);
  const n = balances.length;
  const totalBalance = balances.reduce((sum, b) => sum + b, 0);

  if (totalBalance === 0) return 0;

  let numerator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (2 * (i + 1) - n - 1) * balances[i];
  }

  const gini = numerator / (n * totalBalance);
  return Math.max(0, Math.min(1, gini)); // Clamp between 0 and 1
}

/**
 * Calculate distribution score (0-100, higher is better)
 * Based on Gini coefficient and top holder concentration
 */
function calculateDistributionScore(
  giniCoefficient: number,
  top10Percentage: number
): number {
  // Lower Gini is better (more equal distribution)
  const giniScore = (1 - giniCoefficient) * 50;
  
  // Lower top10 concentration is better
  const concentrationScore = Math.max(0, (100 - top10Percentage) / 2);
  
  return Math.round(giniScore + concentrationScore);
}

/**
 * Analyze exchange flows from whale transactions
 */
function analyzeExchangeFlows(transactions: WhaleTransaction[]): {
  inflow24h: number;
  outflow24h: number;
  netFlow: number;
  trend: 'accumulation' | 'distribution' | 'neutral';
} {
  const oneDayAgo = Date.now() / 1000 - (24 * 60 * 60);
  const recentTxs = transactions.filter(tx => tx.timestamp > oneDayAgo);

  let inflow = 0;
  let outflow = 0;

  recentTxs.forEach(tx => {
    if (tx.type === 'exchange_deposit') {
      inflow += tx.valueUSD;
    } else if (tx.type === 'exchange_withdrawal') {
      outflow += tx.valueUSD;
    }
  });

  const netFlow = outflow - inflow; // Positive = more leaving exchanges (bullish)
  
  let trend: 'accumulation' | 'distribution' | 'neutral' = 'neutral';
  const totalFlow = inflow + outflow;
  
  if (totalFlow > 0) {
    const flowRatio = netFlow / totalFlow;
    if (flowRatio > 0.3) trend = 'accumulation';
    else if (flowRatio < -0.3) trend = 'distribution';
  }

  return {
    inflow24h: Math.round(inflow),
    outflow24h: Math.round(outflow),
    netFlow: Math.round(netFlow),
    trend
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OnChainAnalyticsResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      symbol: '',
      chain: 'ethereum',
      timestamp: new Date().toISOString(),
      error: 'Method not allowed'
    });
  }

  const { symbol } = req.query;

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({
      success: false,
      symbol: '',
      chain: 'ethereum',
      timestamp: new Date().toISOString(),
      error: 'Symbol parameter is required'
    });
  }

  const symbolUpper = symbol.toUpperCase();

  // Check cache
  const cacheKey = `onchain:${symbolUpper}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.status(200).json({
      ...cached.data,
      cached: true
    });
  }

  try {
    // Get token contract address and chain
    const tokenConfig = TOKEN_CONTRACTS[symbolUpper];
    
    if (!tokenConfig) {
      return res.status(404).json({
        success: false,
        symbol: symbolUpper,
        chain: 'ethereum',
        timestamp: new Date().toISOString(),
        error: `Token ${symbolUpper} not supported for on-chain analysis`
      });
    }

    const { address: contractAddress, chain } = tokenConfig;

    // Check if API keys are configured
    const apiKeyEnvVar = chain === 'ethereum' ? 'ETHERSCAN_API_KEY' 
      : chain === 'bsc' ? 'BSCSCAN_API_KEY' 
      : 'POLYGONSCAN_API_KEY';
    
    if (!process.env[apiKeyEnvVar]) {
      return res.status(503).json({
        success: false,
        symbol: symbolUpper,
        chain,
        timestamp: new Date().toISOString(),
        error: `${chain} blockchain explorer API not configured`
      });
    }

    // Fetch data in parallel
    const [tokenInfo, holders, whaleTransactions, smartContractAnalysis] = await Promise.allSettled([
      getTokenInfo(contractAddress, chain),
      fetchHolderDistribution(contractAddress, chain),
      detectWhaleTransactions(contractAddress, chain, 100000), // $100k threshold
      analyzeSmartContract(contractAddress, chain)
    ]);

    // Extract results
    const tokenInfoData = tokenInfo.status === 'fulfilled' ? tokenInfo.value : null;
    const holdersData = holders.status === 'fulfilled' ? holders.value : [];
    const whaleTransactionsData = whaleTransactions.status === 'fulfilled' ? whaleTransactions.value : [];
    const smartContractData = smartContractAnalysis.status === 'fulfilled' 
      ? smartContractAnalysis.value 
      : {
          score: 0,
          isVerified: false,
          vulnerabilities: [],
          redFlags: ['Analysis failed'],
          warnings: ['Unable to analyze contract'],
          strengths: [],
          auditStatus: 'not_audited' as const
        };

    // Calculate holder concentration metrics
    const top10Percentage = holdersData.slice(0, 10).reduce((sum, h) => sum + h.percentage, 0);
    const top50Percentage = holdersData.slice(0, 50).reduce((sum, h) => sum + h.percentage, 0);
    const top100Percentage = holdersData.reduce((sum, h) => sum + h.percentage, 0);
    const giniCoefficient = calculateGiniCoefficient(holdersData);
    const distributionScore = calculateDistributionScore(giniCoefficient, top10Percentage);

    // Analyze exchange flows
    const exchangeFlows = analyzeExchangeFlows(whaleTransactionsData);

    // Analyze wallet behavior
    const walletBehavior = analyzeWalletBehavior(holdersData, whaleTransactionsData, 1); // Price placeholder

    const response: OnChainAnalyticsResponse = {
      success: true,
      symbol: symbolUpper,
      chain,
      timestamp: new Date().toISOString(),
      data: {
        tokenInfo: tokenInfoData,
        holders: holdersData,
        holderConcentration: {
          giniCoefficient: Math.round(giniCoefficient * 100) / 100,
          top10Percentage: Math.round(top10Percentage * 100) / 100,
          top50Percentage: Math.round(top50Percentage * 100) / 100,
          top100Percentage: Math.round(top100Percentage * 100) / 100,
          distributionScore
        },
        whaleTransactions: whaleTransactionsData,
        exchangeFlows,
        smartContract: smartContractData,
        walletBehavior
      }
    };

    // Cache the response
    cache.set(cacheKey, {
      data: response,
      timestamp: Date.now()
    });

    // Clean up old cache entries
    for (const [key, value] of cache.entries()) {
      if (Date.now() - value.timestamp > CACHE_TTL) {
        cache.delete(key);
      }
    }

    return res.status(200).json(response);

  } catch (error) {
    console.error('On-chain analytics error:', error);
    
    return res.status(500).json({
      success: false,
      symbol: symbolUpper,
      chain: 'ethereum',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}
