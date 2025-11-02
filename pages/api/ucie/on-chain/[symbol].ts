/**
 * On-Chain Analytics API Endpoint
 * Fetches and analyzes blockchain data for a given token
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import {
  fetchHolderDistribution,
  detectWhaleTransactions,
  getTokenInfo,
  type HolderData,
  type WhaleTransaction,
  type TokenInfo
} from '../../../../lib/ucie/onChainData';
import {
  analyzeSmartContract,
  type ContractSecurityScore
} from '../../../../lib/ucie/smartContractAnalysis';
import {
  classifyWalletType,
  analyzeWalletBehavior,
  type WalletClassification
} from '../../../../lib/ucie/walletBehavior';

interface OnChainAnalyticsResponse {
  success: boolean;
  symbol: string;
  chain: 'ethereum' | 'bsc' | 'polygon';
  tokenInfo: TokenInfo | null;
  holderDistribution: {
    topHolders: HolderData[];
    concentration: {
      giniCoefficient: number;
      top10Percentage: number;
      top50Percentage: number;
      top100Percentage: number;
      distributionScore: number;
    };
  };
  whaleActivity: {
    transactions: WhaleTransaction[];
    summary: {
      totalTransactions: number;
      totalValueUSD: number;
      exchangeDeposits: number;
      exchangeWithdrawals: number;
      largestTransaction: number;
    };
  };
  exchangeFlows: {
    inflow24h: number;
    outflow24h: number;
    netFlow: number;
    trend: 'accumulation' | 'distribution' | 'neutral';
  };
  smartContract: ContractSecurityScore;
  walletBehavior: {
    smartMoneyAccumulating: boolean;
    whaleActivity: 'buying' | 'selling' | 'neutral';
    retailSentiment: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
  };
  dataQuality: number;
  timestamp: string;
  error?: string;
}

// Token contract addresses (expand as needed)
const TOKEN_CONTRACTS: Record<string, { address: string; chain: 'ethereum' | 'bsc' | 'polygon' }> = {
  // Ethereum tokens
  'ETH': { address: '0x0000000000000000000000000000000000000000', chain: 'ethereum' },
  'USDT': { address: '0xdac17f958d2ee523a2206206994597c13d831ec7', chain: 'ethereum' },
  'USDC': { address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', chain: 'ethereum' },
  'LINK': { address: '0x514910771af9ca656af840dff83e8264ecf986ca', chain: 'ethereum' },
  'UNI': { address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', chain: 'ethereum' },
  'AAVE': { address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9', chain: 'ethereum' },
  
  // BSC tokens
  'BNB': { address: '0x0000000000000000000000000000000000000000', chain: 'bsc' },
  'CAKE': { address: '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82', chain: 'bsc' },
  
  // Polygon tokens
  'MATIC': { address: '0x0000000000000000000000000000000000000000', chain: 'polygon' },
};

/**
 * Calculate Gini coefficient for holder distribution
 */
function calculateGiniCoefficient(holders: HolderData[]): number {
  if (holders.length === 0) return 0;
  
  const balances = holders.map(h => parseFloat(h.balance)).sort((a, b) => a - b);
  const n = balances.length;
  const sum = balances.reduce((a, b) => a + b, 0);
  
  if (sum === 0) return 0;
  
  let numerator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (2 * (i + 1) - n - 1) * balances[i];
  }
  
  const gini = numerator / (n * sum);
  return Math.max(0, Math.min(1, gini));
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
  const now = Date.now() / 1000;
  const oneDayAgo = now - 86400;
  
  const recent24h = transactions.filter(tx => tx.timestamp >= oneDayAgo);
  
  const inflow = recent24h
    .filter(tx => tx.type === 'exchange_deposit')
    .reduce((sum, tx) => sum + tx.valueUSD, 0);
  
  const outflow = recent24h
    .filter(tx => tx.type === 'exchange_withdrawal')
    .reduce((sum, tx) => sum + tx.valueUSD, 0);
  
  const netFlow = outflow - inflow;
  
  let trend: 'accumulation' | 'distribution' | 'neutral' = 'neutral';
  if (netFlow > inflow * 0.2) {
    trend = 'accumulation';
  } else if (netFlow < -inflow * 0.2) {
    trend = 'distribution';
  }
  
  return {
    inflow24h: inflow,
    outflow24h: outflow,
    netFlow,
    trend
  };
}

/**
 * Analyze wallet behavior patterns
 */
function analyzeWalletBehaviorPatterns(
  holders: HolderData[],
  transactions: WhaleTransaction[]
): {
  smartMoneyAccumulating: boolean;
  whaleActivity: 'buying' | 'selling' | 'neutral';
  retailSentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
} {
  // Classify top holders
  const topHolders = holders.slice(0, 20);
  const classifications = topHolders.map(holder => 
    classifyWalletType(holder.address, parseFloat(holder.balance))
  );
  
  const smartMoneyCount = classifications.filter(c => c.type === 'smart_money').length;
  const whaleCount = classifications.filter(c => c.type === 'whale').length;
  
  // Analyze recent whale activity
  const recentTxs = transactions.slice(0, 50);
  const buyingTxs = recentTxs.filter(tx => tx.type === 'exchange_withdrawal').length;
  const sellingTxs = recentTxs.filter(tx => tx.type === 'exchange_deposit').length;
  
  let whaleActivity: 'buying' | 'selling' | 'neutral' = 'neutral';
  if (buyingTxs > sellingTxs * 1.5) {
    whaleActivity = 'buying';
  } else if (sellingTxs > buyingTxs * 1.5) {
    whaleActivity = 'selling';
  }
  
  // Determine smart money accumulation
  const smartMoneyAccumulating = smartMoneyCount > 5 && whaleActivity === 'buying';
  
  // Retail sentiment (inverse of whale activity)
  let retailSentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (whaleActivity === 'selling') {
    retailSentiment = 'bullish'; // Retail buying from whales
  } else if (whaleActivity === 'buying') {
    retailSentiment = 'bearish'; // Retail selling to whales
  }
  
  // Calculate confidence based on data quality
  const confidence = Math.min(
    100,
    (topHolders.length / 20) * 50 + (recentTxs.length / 50) * 50
  );
  
  return {
    smartMoneyAccumulating,
    whaleActivity,
    retailSentiment,
    confidence
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
      tokenInfo: null,
      holderDistribution: {
        topHolders: [],
        concentration: {
          giniCoefficient: 0,
          top10Percentage: 0,
          top50Percentage: 0,
          top100Percentage: 0,
          distributionScore: 0
        }
      },
      whaleActivity: {
        transactions: [],
        summary: {
          totalTransactions: 0,
          totalValueUSD: 0,
          exchangeDeposits: 0,
          exchangeWithdrawals: 0,
          largestTransaction: 0
        }
      },
      exchangeFlows: {
        inflow24h: 0,
        outflow24h: 0,
        netFlow: 0,
        trend: 'neutral'
      },
      smartContract: {
        score: 0,
        isVerified: false,
        vulnerabilities: [],
        redFlags: [],
        warnings: [],
        strengths: [],
        auditStatus: 'not_audited'
      },
      walletBehavior: {
        smartMoneyAccumulating: false,
        whaleActivity: 'neutral',
        retailSentiment: 'neutral',
        confidence: 0
      },
      dataQuality: 0,
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
      tokenInfo: null,
      holderDistribution: {
        topHolders: [],
        concentration: {
          giniCoefficient: 0,
          top10Percentage: 0,
          top50Percentage: 0,
          top100Percentage: 0,
          distributionScore: 0
        }
      },
      whaleActivity: {
        transactions: [],
        summary: {
          totalTransactions: 0,
          totalValueUSD: 0,
          exchangeDeposits: 0,
          exchangeWithdrawals: 0,
          largestTransaction: 0
        }
      },
      exchangeFlows: {
        inflow24h: 0,
        outflow24h: 0,
        netFlow: 0,
        trend: 'neutral'
      },
      smartContract: {
        score: 0,
        isVerified: false,
        vulnerabilities: [],
        redFlags: [],
        warnings: [],
        strengths: [],
        auditStatus: 'not_audited'
      },
      walletBehavior: {
        smartMoneyAccumulating: false,
        whaleActivity: 'neutral',
        retailSentiment: 'neutral',
        confidence: 0
      },
      dataQuality: 0,
      timestamp: new Date().toISOString(),
      error: 'Invalid symbol parameter'
    });
  }

  const symbolUpper = symbol.toUpperCase();
  
  // Get token contract address and chain
  const tokenContract = TOKEN_CONTRACTS[symbolUpper];
  
  if (!tokenContract) {
    return res.status(404).json({
      success: false,
      symbol: symbolUpper,
      chain: 'ethereum',
      tokenInfo: null,
      holderDistribution: {
        topHolders: [],
        concentration: {
          giniCoefficient: 0,
          top10Percentage: 0,
          top50Percentage: 0,
          top100Percentage: 0,
          distributionScore: 0
        }
      },
      whaleActivity: {
        transactions: [],
        summary: {
          totalTransactions: 0,
          totalValueUSD: 0,
          exchangeDeposits: 0,
          exchangeWithdrawals: 0,
          largestTransaction: 0
        }
      },
      exchangeFlows: {
        inflow24h: 0,
        outflow24h: 0,
        netFlow: 0,
        trend: 'neutral'
      },
      smartContract: {
        score: 0,
        isVerified: false,
        vulnerabilities: [],
        redFlags: [],
        warnings: [],
        strengths: [],
        auditStatus: 'not_audited'
      },
      walletBehavior: {
        smartMoneyAccumulating: false,
        whaleActivity: 'neutral',
        retailSentiment: 'neutral',
        confidence: 0
      },
      dataQuality: 0,
      timestamp: new Date().toISOString(),
      error: `Token ${symbolUpper} not supported for on-chain analysis`
    });
  }

  try {
    const { address: contractAddress, chain } = tokenContract;
    
    // Fetch all data in parallel
    const [tokenInfo, holders, whaleTransactions, smartContractAnalysis] = await Promise.allSettled([
      getTokenInfo(contractAddress, chain),
      fetchHolderDistribution(contractAddress, chain),
      detectWhaleTransactions(contractAddress, chain, 100000),
      analyzeSmartContract(contractAddress, chain)
    ]);

    // Extract results
    const tokenInfoData = tokenInfo.status === 'fulfilled' ? tokenInfo.value : null;
    const holdersData = holders.status === 'fulfilled' ? holders.value : [];
    const whaleTransactionsData = whaleTransactions.status === 'fulfilled' ? whaleTransactions.value : [];
    const smartContractData = smartContractAnalysis.status === 'fulfilled' ? smartContractAnalysis.value : {
      score: 0,
      isVerified: false,
      vulnerabilities: [],
      redFlags: [],
      warnings: [],
      strengths: [],
      auditStatus: 'not_audited' as const
    };

    // Calculate holder concentration metrics
    const top10Percentage = holdersData.slice(0, 10).reduce((sum, h) => sum + h.percentage, 0);
    const top50Percentage = holdersData.slice(0, 50).reduce((sum, h) => sum + h.percentage, 0);
    const top100Percentage = holdersData.reduce((sum, h) => sum + h.percentage, 0);
    const giniCoefficient = calculateGiniCoefficient(holdersData);
    
    // Distribution score (0-100, higher is better/more distributed)
    const distributionScore = Math.max(0, 100 - (giniCoefficient * 100));

    // Analyze whale activity
    const totalValueUSD = whaleTransactionsData.reduce((sum, tx) => sum + tx.valueUSD, 0);
    const exchangeDeposits = whaleTransactionsData.filter(tx => tx.type === 'exchange_deposit').length;
    const exchangeWithdrawals = whaleTransactionsData.filter(tx => tx.type === 'exchange_withdrawal').length;
    const largestTransaction = Math.max(...whaleTransactionsData.map(tx => tx.valueUSD), 0);

    // Analyze exchange flows
    const exchangeFlows = analyzeExchangeFlows(whaleTransactionsData);

    // Analyze wallet behavior
    const walletBehavior = analyzeWalletBehaviorPatterns(holdersData, whaleTransactionsData);

    // Calculate data quality score
    let dataQuality = 0;
    if (tokenInfo.status === 'fulfilled') dataQuality += 25;
    if (holders.status === 'fulfilled' && holdersData.length > 0) dataQuality += 25;
    if (whaleTransactions.status === 'fulfilled' && whaleTransactionsData.length > 0) dataQuality += 25;
    if (smartContractAnalysis.status === 'fulfilled') dataQuality += 25;

    const response: OnChainAnalyticsResponse = {
      success: true,
      symbol: symbolUpper,
      chain,
      tokenInfo: tokenInfoData,
      holderDistribution: {
        topHolders: holdersData,
        concentration: {
          giniCoefficient,
          top10Percentage,
          top50Percentage,
          top100Percentage,
          distributionScore
        }
      },
      whaleActivity: {
        transactions: whaleTransactionsData,
        summary: {
          totalTransactions: whaleTransactionsData.length,
          totalValueUSD,
          exchangeDeposits,
          exchangeWithdrawals,
          largestTransaction
        }
      },
      exchangeFlows,
      smartContract: smartContractData,
      walletBehavior,
      dataQuality,
      timestamp: new Date().toISOString()
    };

    // Cache for 5 minutes
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    
    return res.status(200).json(response);

  } catch (error) {
    console.error('On-chain analytics error:', error);
    
    return res.status(500).json({
      success: false,
      symbol: symbolUpper,
      chain: tokenContract.chain,
      tokenInfo: null,
      holderDistribution: {
        topHolders: [],
        concentration: {
          giniCoefficient: 0,
          top10Percentage: 0,
          top50Percentage: 0,
          top100Percentage: 0,
          distributionScore: 0
        }
      },
      whaleActivity: {
        transactions: [],
        summary: {
          totalTransactions: 0,
          totalValueUSD: 0,
          exchangeDeposits: 0,
          exchangeWithdrawals: 0,
          largestTransaction: 0
        }
      },
      exchangeFlows: {
        inflow24h: 0,
        outflow24h: 0,
        netFlow: 0,
        trend: 'neutral'
      },
      smartContract: {
        score: 0,
        isVerified: false,
        vulnerabilities: [],
        redFlags: [],
        warnings: [],
        strengths: [],
        auditStatus: 'not_audited'
      },
      walletBehavior: {
        smartMoneyAccumulating: false,
        whaleActivity: 'neutral',
        retailSentiment: 'neutral',
        confidence: 0
      },
      dataQuality: 0,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}
