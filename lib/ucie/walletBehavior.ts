/**
 * Wallet Behavior Analysis
 * Classifies wallets and analyzes trading patterns
 */

import { HolderData, WhaleTransaction } from './onChainData';

export type WalletType = 'exchange' | 'whale' | 'smart_money' | 'retail' | 'contract' | 'unknown';

export interface WalletClassification {
  address: string;
  type: WalletType;
  confidence: number; // 0-100
  reasons: string[];
  profitability?: number; // Percentage
  activityLevel: 'very_high' | 'high' | 'medium' | 'low' | 'inactive';
  pattern: 'accumulation' | 'distribution' | 'neutral' | 'unknown';
}

export interface WalletMetrics {
  totalTransactions: number;
  totalVolume: number;
  averageTransactionSize: number;
  firstSeen: number;
  lastSeen: number;
  holdingPeriod: number; // days
  profitLoss: number; // percentage
  winRate: number; // percentage of profitable trades
}

// Known exchange addresses (partial list - expand as needed)
const KNOWN_EXCHANGES: Record<string, string> = {
  '0x28c6c06298d514db089934071355e5743bf21d60': 'Binance 1',
  '0x21a31ee1afc51d94c2efccaa2092ad1028285549': 'Binance 2',
  '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be': 'Binance 3',
  '0xdfd5293d8e347dfe59e90efd55b2956a1343963d': 'Binance 4',
  '0x56eddb7aa87536c09ccc2793473599fd21a8b17f': 'Binance 5',
  '0x9696f59e4d72e237be84ffd425dcad154bf96976': 'Binance 6',
  '0x4e9ce36e442e55ecd9025b9a6e0d88485d628a67': 'Binance 7',
  '0xbe0eb53f46cd790cd13851d5eff43d12404d33e8': 'Binance 8',
  '0xf977814e90da44bfa03b6295a0616a897441acec': 'Binance 9',
  '0x001866ae5b3de6caa5a51543fd9fb64f524f5478': 'Binance 10',
  '0x85b931a32a0725be14285b66f1a22178c672d69b': 'Binance 11',
  '0x708396f17127c42383e3b9014072679b2f60b82f': 'Binance 12',
  '0xe0f0cfde7ee664943906f17f7f14342e76a5cec7': 'Binance 13',
  '0x8f22f2063d253846b53609231ed80fa571bc0c8f': 'Binance 14',
  
  '0x3cd751e6b0078be393132286c442345e5dc49699': 'Coinbase 1',
  '0xb5d85cbf7cb3ee0d56b3bb207d5fc4b82f43f511': 'Coinbase 2',
  '0xeb2629a2734e272bcc07bda959863f316f4bd4cf': 'Coinbase 3',
  '0xd688aea8f7d450909ade10c47faa95707ce0ce25': 'Coinbase 4',
  '0x02466e547bfdab679fc49e96bbfc62b9747d997c': 'Coinbase 5',
  '0x6b76f8b1e9e59913bfe758821887311ba1805cab': 'Coinbase 6',
  '0x503828976d22510aad0201ac7ec88293211d23da': 'Coinbase 7',
  '0xddfabcdc4d8ffc6d5beaf154f18b778f892a0740': 'Coinbase 8',
  
  '0x267be1c1d684f78cb4f6a176c4911b741e4ffdc0': 'Kraken 1',
  '0xfa52274dd61e1643d2205169732f29114bc240b3': 'Kraken 2',
  '0x53d284357ec70ce289d6d64134dfac8e511c8a3d': 'Kraken 3',
  '0x89e51fa8ca5d66cd220baed62ed01e8951aa7c40': 'Kraken 4',
  '0xe853c56864a2ebe4576a807d26fdc4a0ada51919': 'Kraken 5',
  
  '0x876eabf441b2ee5b5b0554fd502a8e0600950cfa': 'Huobi 1',
  '0xab5c66752a9e8167967685f1450532fb96d5d24f': 'Huobi 2',
  '0x6748f50f686bfbca6fe8ad62b22228b87f31ff2b': 'Huobi 3',
  '0xfdb16996831753d5331ff813c29a93c76834a0ad': 'Huobi 4',
  '0xeee28d484628d41a82d01e21d12e2e78d69920da': 'Huobi 5',
  
  '0x1151314c646ce4e0efd76d1af4760ae66a9fe30f': 'Bitfinex 1',
  '0x742d35cc6634c0532925a3b844bc9e7595f0beb': 'Bitfinex 2',
  
  '0x0d0707963952f2fba59dd06f2b425ace40b492fe': 'Gate.io',
  '0x1c4b70a3968436b9a0a9cf5205c787eb81bb558c': 'Bittrex',
  '0x0681d8db095565fe8a346fa0277bffde9c0edbbf': 'Poloniex',
  '0x32be343b94f860124dc4fee278fdcbd38c102d88': 'KuCoin 1',
  '0x2b5634c42055806a59e9107ed44d43c426e58258': 'KuCoin 2',
  '0xa1d8d972560c2f8144af871db508f0b0b10a3fbf': 'OKX 1',
  '0x236f9f97e0e62388479bf9e5ba4889e46b0273c3': 'OKX 2'
};

/**
 * Classify wallet type based on behavior patterns
 */
export function classifyWallet(
  address: string,
  holders: HolderData[],
  transactions: WhaleTransaction[],
  metrics?: WalletMetrics
): WalletClassification {
  const reasons: string[] = [];
  let type: WalletType = 'unknown';
  let confidence = 0;

  // Check if it's a known exchange
  const exchangeName = KNOWN_EXCHANGES[address.toLowerCase()];
  if (exchangeName) {
    return {
      address,
      type: 'exchange',
      confidence: 100,
      reasons: [`Known ${exchangeName} address`],
      activityLevel: 'very_high',
      pattern: 'neutral'
    };
  }

  // Find holder data for this address
  const holderData = holders.find(h => h.address.toLowerCase() === address.toLowerCase());
  
  // Check if it's a contract (ends with many zeros or has specific patterns)
  if (address.endsWith('000000000000') || address.startsWith('0x000000')) {
    type = 'contract';
    confidence = 80;
    reasons.push('Address pattern suggests smart contract');
  }

  // Analyze transaction patterns
  const addressTransactions = transactions.filter(
    tx => tx.from.toLowerCase() === address.toLowerCase() || 
          tx.to.toLowerCase() === address.toLowerCase()
  );

  if (addressTransactions.length > 0) {
    const avgValue = addressTransactions.reduce((sum, tx) => sum + tx.valueUSD, 0) / addressTransactions.length;
    const totalValue = addressTransactions.reduce((sum, tx) => sum + tx.valueUSD, 0);

    // Whale classification (large holdings or transactions)
    if (holderData && holderData.percentage > 1) {
      type = 'whale';
      confidence = 90;
      reasons.push(`Holds ${holderData.percentage.toFixed(2)}% of total supply`);
    } else if (avgValue > 100000) {
      type = 'whale';
      confidence = 85;
      reasons.push(`Average transaction size: $${avgValue.toLocaleString()}`);
    }

    // Smart money classification (profitable patterns)
    if (metrics && metrics.winRate > 70 && metrics.profitLoss > 50) {
      type = 'smart_money';
      confidence = 85;
      reasons.push(`High win rate: ${metrics.winRate.toFixed(1)}%`);
      reasons.push(`Profitable: +${metrics.profitLoss.toFixed(1)}%`);
    }

    // Exchange classification (high volume, many transactions)
    if (addressTransactions.length > 100 && totalValue > 10000000) {
      type = 'exchange';
      confidence = 75;
      reasons.push(`Very high transaction volume: ${addressTransactions.length} transactions`);
      reasons.push(`Total value: $${totalValue.toLocaleString()}`);
    }

    // Retail classification (small holdings, low activity)
    if (holderData && holderData.percentage < 0.01 && avgValue < 10000) {
      type = 'retail';
      confidence = 70;
      reasons.push(`Small holder: ${holderData.percentage.toFixed(4)}% of supply`);
      reasons.push(`Average transaction: $${avgValue.toLocaleString()}`);
    }
  }

  // Determine activity level
  let activityLevel: 'very_high' | 'high' | 'medium' | 'low' | 'inactive' = 'inactive';
  if (addressTransactions.length > 100) activityLevel = 'very_high';
  else if (addressTransactions.length > 50) activityLevel = 'high';
  else if (addressTransactions.length > 10) activityLevel = 'medium';
  else if (addressTransactions.length > 0) activityLevel = 'low';

  // Determine pattern (accumulation vs distribution)
  const pattern = determinePattern(address, addressTransactions);

  return {
    address,
    type,
    confidence,
    reasons: reasons.length > 0 ? reasons : ['Insufficient data for classification'],
    profitability: metrics?.profitLoss,
    activityLevel,
    pattern
  };
}

/**
 * Determine if wallet is accumulating or distributing
 */
function determinePattern(
  address: string,
  transactions: WhaleTransaction[]
): 'accumulation' | 'distribution' | 'neutral' | 'unknown' {
  if (transactions.length < 5) return 'unknown';

  // Recent transactions (last 30 days)
  const thirtyDaysAgo = Date.now() / 1000 - (30 * 24 * 60 * 60);
  const recentTxs = transactions.filter(tx => tx.timestamp > thirtyDaysAgo);

  if (recentTxs.length === 0) return 'unknown';

  let inflow = 0;
  let outflow = 0;

  recentTxs.forEach(tx => {
    if (tx.to.toLowerCase() === address.toLowerCase()) {
      inflow += tx.valueUSD;
    } else if (tx.from.toLowerCase() === address.toLowerCase()) {
      outflow += tx.valueUSD;
    }
  });

  const netFlow = inflow - outflow;
  const totalFlow = inflow + outflow;

  if (totalFlow === 0) return 'unknown';

  const flowRatio = netFlow / totalFlow;

  if (flowRatio > 0.3) return 'accumulation';
  if (flowRatio < -0.3) return 'distribution';
  return 'neutral';
}

/**
 * Calculate wallet profitability metrics
 */
export function calculateWalletMetrics(
  address: string,
  transactions: WhaleTransaction[],
  currentPrice: number
): WalletMetrics {
  const addressTxs = transactions.filter(
    tx => tx.from.toLowerCase() === address.toLowerCase() || 
          tx.to.toLowerCase() === address.toLowerCase()
  );

  if (addressTxs.length === 0) {
    return {
      totalTransactions: 0,
      totalVolume: 0,
      averageTransactionSize: 0,
      firstSeen: 0,
      lastSeen: 0,
      holdingPeriod: 0,
      profitLoss: 0,
      winRate: 0
    };
  }

  const totalVolume = addressTxs.reduce((sum, tx) => sum + tx.valueUSD, 0);
  const averageTransactionSize = totalVolume / addressTxs.length;

  const timestamps = addressTxs.map(tx => tx.timestamp).sort((a, b) => a - b);
  const firstSeen = timestamps[0];
  const lastSeen = timestamps[timestamps.length - 1];
  const holdingPeriod = (lastSeen - firstSeen) / (24 * 60 * 60); // days

  // Calculate profit/loss (simplified - would need more data for accurate calculation)
  let totalBought = 0;
  let totalSold = 0;
  let buyCount = 0;
  let sellCount = 0;

  addressTxs.forEach(tx => {
    if (tx.to.toLowerCase() === address.toLowerCase()) {
      totalBought += tx.valueUSD;
      buyCount++;
    } else {
      totalSold += tx.valueUSD;
      sellCount++;
    }
  });

  const profitLoss = totalBought > 0 ? ((totalSold - totalBought) / totalBought) * 100 : 0;
  const winRate = sellCount > 0 ? (profitLoss > 0 ? 100 : 0) : 0;

  return {
    totalTransactions: addressTxs.length,
    totalVolume,
    averageTransactionSize,
    firstSeen,
    lastSeen,
    holdingPeriod,
    profitLoss,
    winRate
  };
}

/**
 * Identify smart money wallets (high profitability, good timing)
 */
export function identifySmartMoney(
  holders: HolderData[],
  transactions: WhaleTransaction[],
  currentPrice: number
): WalletClassification[] {
  const smartMoneyWallets: WalletClassification[] = [];

  // Analyze top holders
  const topHolders = holders.slice(0, 50); // Top 50 holders

  for (const holder of topHolders) {
    const metrics = calculateWalletMetrics(holder.address, transactions, currentPrice);
    
    // Smart money criteria
    if (
      metrics.profitLoss > 50 && // >50% profit
      metrics.winRate > 70 && // >70% win rate
      metrics.totalTransactions > 5 // Minimum activity
    ) {
      const classification = classifyWallet(holder.address, holders, transactions, metrics);
      
      if (classification.type === 'smart_money' || classification.type === 'whale') {
        smartMoneyWallets.push(classification);
      }
    }
  }

  return smartMoneyWallets.sort((a, b) => (b.profitability || 0) - (a.profitability || 0));
}

/**
 * Analyze overall wallet behavior trends
 */
export interface WalletBehaviorSummary {
  totalWallets: number;
  whaleCount: number;
  smartMoneyCount: number;
  retailCount: number;
  exchangeCount: number;
  accumulationCount: number;
  distributionCount: number;
  averageProfitability: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
}

export function analyzeWalletBehavior(
  holders: HolderData[],
  transactions: WhaleTransaction[],
  currentPrice: number
): WalletBehaviorSummary {
  const classifications: WalletClassification[] = [];

  // Classify top 100 holders
  for (const holder of holders.slice(0, 100)) {
    const metrics = calculateWalletMetrics(holder.address, transactions, currentPrice);
    const classification = classifyWallet(holder.address, holders, transactions, metrics);
    classifications.push(classification);
  }

  const whaleCount = classifications.filter(c => c.type === 'whale').length;
  const smartMoneyCount = classifications.filter(c => c.type === 'smart_money').length;
  const retailCount = classifications.filter(c => c.type === 'retail').length;
  const exchangeCount = classifications.filter(c => c.type === 'exchange').length;
  const accumulationCount = classifications.filter(c => c.pattern === 'accumulation').length;
  const distributionCount = classifications.filter(c => c.pattern === 'distribution').length;

  const profitabilities = classifications
    .filter(c => c.profitability !== undefined)
    .map(c => c.profitability!);
  
  const averageProfitability = profitabilities.length > 0
    ? profitabilities.reduce((sum, p) => sum + p, 0) / profitabilities.length
    : 0;

  // Determine sentiment
  let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (accumulationCount > distributionCount * 1.5) {
    sentiment = 'bullish';
  } else if (distributionCount > accumulationCount * 1.5) {
    sentiment = 'bearish';
  }

  return {
    totalWallets: classifications.length,
    whaleCount,
    smartMoneyCount,
    retailCount,
    exchangeCount,
    accumulationCount,
    distributionCount,
    averageProfitability,
    sentiment
  };
}
