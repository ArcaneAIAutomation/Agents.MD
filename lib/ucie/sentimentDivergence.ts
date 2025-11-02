/**
 * Sentiment Divergence Detection for UCIE
 * 
 * Identifies sentiment-price divergences for contrarian trading signals
 * Requirements: 22.1, 22.2, 22.3, 22.4, 22.5
 */

export interface SentimentDivergence {
  type: 'distribution' | 'accumulation' | 'none';
  score: number; // -100 to +100
  confidence: number; // 0-100
  timeframe: string;
  description: string;
  sentiment: {
    current: number;
    trend: 'rising' | 'falling' | 'stable';
    change24h: number;
    change7d: number;
  };
  price: {
    current: number;
    trend: 'rising' | 'falling' | 'stable';
    change24h: number;
    change7d: number;
  };
  divergenceStrength: 'weak' | 'moderate' | 'strong' | 'extreme';
  tradingSignal: 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';
  reasoning: string;
}

export interface SmartMoneySentiment {
  sentiment: number; // -100 to +100
  walletCount: number;
  averageHolding: number;
  recentActivity: 'accumulating' | 'distributing' | 'neutral';
  confidence: number;
}

export interface RetailSentiment {
  sentiment: number; // -100 to +100
  socialVolume: number;
  fearGreedIndex: number;
  trendingScore: number;
  confidence: number;
}

export interface DivergenceHistory {
  date: string;
  divergenceType: 'distribution' | 'accumulation';
  divergenceScore: number;
  subsequentReturn: number;
  timeframe: string;
  successful: boolean;
}

export interface DivergenceReport {
  symbol: string;
  timestamp: string;
  currentDivergence: SentimentDivergence;
  smartMoney: SmartMoneySentiment;
  retail: RetailSentiment;
  smartMoneyVsRetail: {
    divergence: boolean;
    smartMoneyBullish: boolean;
    retailBullish: boolean;
    conflictScore: number;
  };
  historicalAccuracy: {
    totalSignals: number;
    successfulSignals: number;
    winRate: number;
    averageReturn: number;
    bestReturn: number;
    worstReturn: number;
  };
  history: DivergenceHistory[];
  recommendation: string;
}

/**
 * Calculate sentiment-price divergence score
 */
export function calculateDivergenceScore(
  sentimentTrend: number, // -100 to +100
  priceTrend: number, // percentage change
  timeframe: string
): number {
  // Normalize price trend to -100 to +100 scale
  const normalizedPriceTrend = Math.max(-100, Math.min(100, priceTrend * 10));
  
  // Calculate divergence (opposite directions = high divergence)
  const divergence = sentimentTrend - normalizedPriceTrend;
  
  // Weight by timeframe (longer timeframes = more significant)
  const timeframeWeight = timeframe === '30d' ? 1.2 : timeframe === '7d' ? 1.0 : 0.8;
  
  return divergence * timeframeWeight;
}

/**
 * Determine trend direction
 */
function determineTrend(change24h: number, change7d: number): 'rising' | 'falling' | 'stable' {
  const avgChange = (change24h + change7d) / 2;
  
  if (avgChange > 5) return 'rising';
  if (avgChange < -5) return 'falling';
  return 'stable';
}

/**
 * Classify divergence strength
 */
function classifyDivergenceStrength(score: number): 'weak' | 'moderate' | 'strong' | 'extreme' {
  const absScore = Math.abs(score);
  
  if (absScore > 80) return 'extreme';
  if (absScore > 60) return 'strong';
  if (absScore > 40) return 'moderate';
  return 'weak';
}

/**
 * Detect distribution phase (high sentiment, falling price)
 */
export function detectDistributionPhase(
  sentiment: number,
  sentimentChange: number,
  priceChange: number
): { isDistribution: boolean; confidence: number; reasoning: string } {
  // Distribution: Sentiment > 80 (extremely bullish) but price declining
  const isDistribution = sentiment > 80 && priceChange < -2;
  
  let confidence = 0;
  if (isDistribution) {
    // Higher confidence if sentiment is very high and price decline is significant
    confidence = Math.min(95, 60 + (sentiment - 80) * 1.5 + Math.abs(priceChange) * 2);
  }
  
  const reasoning = isDistribution
    ? `Extreme bullish sentiment (${sentiment.toFixed(0)}) while price declining ${priceChange.toFixed(1)}% suggests smart money distributing to retail FOMO buyers`
    : 'No distribution phase detected';
  
  return { isDistribution, confidence, reasoning };
}

/**
 * Detect accumulation phase (low sentiment, rising price)
 */
export function detectAccumulationPhase(
  sentiment: number,
  sentimentChange: number,
  priceChange: number
): { isAccumulation: boolean; confidence: number; reasoning: string } {
  // Accumulation: Sentiment < 20 (extremely bearish) but price rising
  const isAccumulation = sentiment < 20 && priceChange > 2;
  
  let confidence = 0;
  if (isAccumulation) {
    // Higher confidence if sentiment is very low and price increase is significant
    confidence = Math.min(95, 60 + (20 - sentiment) * 1.5 + priceChange * 2);
  }
  
  const reasoning = isAccumulation
    ? `Extreme bearish sentiment (${sentiment.toFixed(0)}) while price rising ${priceChange.toFixed(1)}% suggests smart money accumulating from fearful retail sellers`
    : 'No accumulation phase detected';
  
  return { isAccumulation, confidence, reasoning };
}

/**
 * Analyze sentiment divergence
 */
export async function analyzeSentimentDivergence(
  symbol: string,
  currentSentiment: number,
  sentimentChange24h: number,
  sentimentChange7d: number,
  currentPrice: number,
  priceChange24h: number,
  priceChange7d: number,
  timeframe: string = '7d'
): Promise<SentimentDivergence> {
  const sentimentTrend = determineTrend(sentimentChange24h, sentimentChange7d);
  const priceTrend = determineTrend(priceChange24h, priceChange7d);
  
  const divergenceScore = calculateDivergenceScore(
    currentSentiment,
    timeframe === '7d' ? priceChange7d : priceChange24h,
    timeframe
  );
  
  const distribution = detectDistributionPhase(currentSentiment, sentimentChange7d, priceChange7d);
  const accumulation = detectAccumulationPhase(currentSentiment, sentimentChange7d, priceChange7d);
  
  let type: 'distribution' | 'accumulation' | 'none' = 'none';
  let confidence = 0;
  let reasoning = '';
  let tradingSignal: 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell' = 'neutral';
  
  if (distribution.isDistribution) {
    type = 'distribution';
    confidence = distribution.confidence;
    reasoning = distribution.reasoning;
    tradingSignal = confidence > 80 ? 'strong_sell' : 'sell';
  } else if (accumulation.isAccumulation) {
    type = 'accumulation';
    confidence = accumulation.confidence;
    reasoning = accumulation.reasoning;
    tradingSignal = confidence > 80 ? 'strong_buy' : 'buy';
  } else {
    // Check for moderate divergences
    if (Math.abs(divergenceScore) > 40) {
      if (divergenceScore > 0) {
        // Sentiment more positive than price action
        type = 'distribution';
        confidence = Math.min(75, 50 + Math.abs(divergenceScore) / 4);
        reasoning = `Sentiment (${currentSentiment.toFixed(0)}) is significantly more positive than price action (${priceChange7d.toFixed(1)}%), suggesting potential distribution`;
        tradingSignal = 'sell';
      } else {
        // Sentiment more negative than price action
        type = 'accumulation';
        confidence = Math.min(75, 50 + Math.abs(divergenceScore) / 4);
        reasoning = `Sentiment (${currentSentiment.toFixed(0)}) is significantly more negative than price action (${priceChange7d.toFixed(1)}%), suggesting potential accumulation`;
        tradingSignal = 'buy';
      }
    } else {
      reasoning = 'Sentiment and price action are aligned. No significant divergence detected.';
    }
  }
  
  const divergenceStrength = classifyDivergenceStrength(divergenceScore);
  
  const description = type === 'none'
    ? 'No significant sentiment-price divergence'
    : `${type === 'distribution' ? 'Distribution' : 'Accumulation'} phase detected with ${divergenceStrength} divergence`;
  
  return {
    type,
    score: divergenceScore,
    confidence,
    timeframe,
    description,
    sentiment: {
      current: currentSentiment,
      trend: sentimentTrend,
      change24h: sentimentChange24h,
      change7d: sentimentChange7d
    },
    price: {
      current: currentPrice,
      trend: priceTrend,
      change24h: priceChange24h,
      change7d: priceChange7d
    },
    divergenceStrength,
    tradingSignal,
    reasoning
  };
}

/**
 * Analyze smart money sentiment
 */
export async function analyzeSmartMoneySentiment(
  symbol: string,
  walletData: {
    largeWallets: Array<{ address: string; balance: number; recentChange: number }>;
    profitableWallets: Array<{ address: string; profitability: number; recentActivity: string }>;
  }
): Promise<SmartMoneySentiment> {
  // Filter for smart money (large + profitable wallets)
  const smartMoneyWallets = walletData.largeWallets.filter(wallet => {
    const profitableWallet = walletData.profitableWallets.find(p => p.address === wallet.address);
    return profitableWallet && profitableWallet.profitability > 0.2; // 20%+ profit
  });
  
  // Calculate average recent change
  const avgChange = smartMoneyWallets.reduce((sum, w) => sum + w.recentChange, 0) / smartMoneyWallets.length;
  
  // Determine activity
  let recentActivity: 'accumulating' | 'distributing' | 'neutral' = 'neutral';
  if (avgChange > 5) recentActivity = 'accumulating';
  else if (avgChange < -5) recentActivity = 'distributing';
  
  // Calculate sentiment score based on activity
  let sentiment = 0;
  if (recentActivity === 'accumulating') {
    sentiment = Math.min(80, 50 + avgChange * 3);
  } else if (recentActivity === 'distributing') {
    sentiment = Math.max(-80, -50 + avgChange * 3);
  }
  
  const averageHolding = smartMoneyWallets.reduce((sum, w) => sum + w.balance, 0) / smartMoneyWallets.length;
  
  return {
    sentiment,
    walletCount: smartMoneyWallets.length,
    averageHolding,
    recentActivity,
    confidence: Math.min(90, 60 + smartMoneyWallets.length * 2)
  };
}

/**
 * Analyze retail sentiment
 */
export async function analyzeRetailSentiment(
  symbol: string,
  socialData: {
    sentiment: number;
    volume: number;
    fearGreedIndex: number;
    trendingScore: number;
  }
): Promise<RetailSentiment> {
  return {
    sentiment: socialData.sentiment,
    socialVolume: socialData.volume,
    fearGreedIndex: socialData.fearGreedIndex,
    trendingScore: socialData.trendingScore,
    confidence: Math.min(85, 55 + socialData.volume / 1000)
  };
}

/**
 * Compare smart money vs retail sentiment
 */
export function compareSmartMoneyVsRetail(
  smartMoney: SmartMoneySentiment,
  retail: RetailSentiment
): {
  divergence: boolean;
  smartMoneyBullish: boolean;
  retailBullish: boolean;
  conflictScore: number;
} {
  const smartMoneyBullish = smartMoney.sentiment > 20;
  const retailBullish = retail.sentiment > 20;
  const divergence = smartMoneyBullish !== retailBullish;
  
  // Calculate conflict score (0-100)
  const conflictScore = divergence
    ? Math.min(100, Math.abs(smartMoney.sentiment - retail.sentiment))
    : 0;
  
  return {
    divergence,
    smartMoneyBullish,
    retailBullish,
    conflictScore
  };
}

/**
 * Calculate historical accuracy
 */
export async function calculateHistoricalAccuracy(
  symbol: string,
  history: DivergenceHistory[]
): Promise<{
  totalSignals: number;
  successfulSignals: number;
  winRate: number;
  averageReturn: number;
  bestReturn: number;
  worstReturn: number;
}> {
  if (history.length === 0) {
    return {
      totalSignals: 0,
      successfulSignals: 0,
      winRate: 0,
      averageReturn: 0,
      bestReturn: 0,
      worstReturn: 0
    };
  }
  
  const successfulSignals = history.filter(h => h.successful).length;
  const winRate = (successfulSignals / history.length) * 100;
  
  const returns = history.map(h => h.subsequentReturn);
  const averageReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const bestReturn = Math.max(...returns);
  const worstReturn = Math.min(...returns);
  
  return {
    totalSignals: history.length,
    successfulSignals,
    winRate,
    averageReturn,
    bestReturn,
    worstReturn
  };
}

/**
 * Generate comprehensive divergence report
 */
export async function generateDivergenceReport(
  symbol: string,
  currentDivergence: SentimentDivergence,
  smartMoney: SmartMoneySentiment,
  retail: RetailSentiment,
  history: DivergenceHistory[]
): Promise<DivergenceReport> {
  const smartMoneyVsRetail = compareSmartMoneyVsRetail(smartMoney, retail);
  const historicalAccuracy = await calculateHistoricalAccuracy(symbol, history);
  
  let recommendation = '';
  
  if (currentDivergence.type === 'distribution' && currentDivergence.confidence > 70) {
    recommendation = `SELL SIGNAL: Distribution phase detected with ${currentDivergence.confidence.toFixed(0)}% confidence. ${currentDivergence.reasoning}`;
    if (smartMoneyVsRetail.divergence && !smartMoneyVsRetail.smartMoneyBullish) {
      recommendation += ' Smart money is also distributing, confirming the signal.';
    }
  } else if (currentDivergence.type === 'accumulation' && currentDivergence.confidence > 70) {
    recommendation = `BUY SIGNAL: Accumulation phase detected with ${currentDivergence.confidence.toFixed(0)}% confidence. ${currentDivergence.reasoning}`;
    if (smartMoneyVsRetail.divergence && smartMoneyVsRetail.smartMoneyBullish) {
      recommendation += ' Smart money is also accumulating, confirming the signal.';
    }
  } else if (smartMoneyVsRetail.divergence && smartMoneyVsRetail.conflictScore > 50) {
    if (smartMoneyVsRetail.smartMoneyBullish) {
      recommendation = `CONTRARIAN BUY: Smart money is bullish while retail is bearish. Consider accumulation.`;
    } else {
      recommendation = `CONTRARIAN SELL: Smart money is bearish while retail is bullish. Consider distribution.`;
    }
  } else {
    recommendation = `NEUTRAL: No significant divergence detected. Sentiment and price action are aligned.`;
  }
  
  if (historicalAccuracy.winRate > 0) {
    recommendation += ` Historical win rate: ${historicalAccuracy.winRate.toFixed(1)}% (${historicalAccuracy.successfulSignals}/${historicalAccuracy.totalSignals} signals).`;
  }
  
  return {
    symbol,
    timestamp: new Date().toISOString(),
    currentDivergence,
    smartMoney,
    retail,
    smartMoneyVsRetail,
    historicalAccuracy,
    history: history.slice(0, 10), // Last 10 signals
    recommendation
  };
}

/**
 * Mock historical data for testing
 */
export function getMockDivergenceHistory(symbol: string): DivergenceHistory[] {
  return [
    {
      date: '2024-01-15',
      divergenceType: 'accumulation',
      divergenceScore: -65,
      subsequentReturn: 12.5,
      timeframe: '7 days',
      successful: true
    },
    {
      date: '2024-01-08',
      divergenceType: 'distribution',
      divergenceScore: 72,
      subsequentReturn: -8.3,
      timeframe: '5 days',
      successful: true
    },
    {
      date: '2023-12-20',
      divergenceType: 'accumulation',
      divergenceScore: -58,
      subsequentReturn: -2.1,
      timeframe: '10 days',
      successful: false
    },
    {
      date: '2023-12-10',
      divergenceType: 'distribution',
      divergenceScore: 68,
      subsequentReturn: -15.7,
      timeframe: '7 days',
      successful: true
    },
    {
      date: '2023-11-25',
      divergenceType: 'accumulation',
      divergenceScore: -71,
      subsequentReturn: 18.2,
      timeframe: '14 days',
      successful: true
    }
  ];
}
