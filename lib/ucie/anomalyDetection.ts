/**
 * Anomaly Detection System for UCIE
 * 
 * Monitors all metrics in real-time and detects statistical anomalies
 * Requirements: 21.1, 21.2, 21.3, 21.4, 21.5
 */

export interface Anomaly {
  id: string;
  timestamp: string;
  type: 'price' | 'volume' | 'social' | 'on-chain' | 'multi-dimensional';
  severity: 'low' | 'medium' | 'high' | 'critical';
  metric: string;
  currentValue: number;
  expectedValue: number;
  standardDeviations: number;
  description: string;
  historicalContext: HistoricalContext[];
  rootCause: string;
  recommendedActions: string[];
  confidence: number;
}

export interface HistoricalContext {
  date: string;
  similarAnomaly: boolean;
  subsequentImpact: string;
  priceChange: number;
  timeframe: string;
}

export interface AnomalyReport {
  symbol: string;
  timestamp: string;
  totalAnomalies: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  anomalies: Anomaly[];
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  summary: string;
}

interface MetricData {
  values: number[];
  timestamps: string[];
}

/**
 * Calculate statistical anomalies (>3 standard deviations)
 */
function detectStatisticalAnomaly(
  currentValue: number,
  historicalValues: number[]
): { isAnomaly: boolean; stdDev: number; zScore: number } {
  if (historicalValues.length < 30) {
    return { isAnomaly: false, stdDev: 0, zScore: 0 };
  }

  const mean = historicalValues.reduce((a, b) => a + b, 0) / historicalValues.length;
  const variance = historicalValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / historicalValues.length;
  const stdDev = Math.sqrt(variance);
  
  const zScore = stdDev > 0 ? Math.abs((currentValue - mean) / stdDev) : 0;
  const isAnomaly = zScore > 3;

  return { isAnomaly, stdDev, zScore };
}

/**
 * Classify anomaly severity based on z-score and metric type
 */
function classifyAnomalySeverity(
  zScore: number,
  metricType: string,
  priceImpact: number
): 'low' | 'medium' | 'high' | 'critical' {
  // Critical: z-score > 5 or significant price impact
  if (zScore > 5 || Math.abs(priceImpact) > 10) {
    return 'critical';
  }
  
  // High: z-score > 4 or moderate price impact
  if (zScore > 4 || Math.abs(priceImpact) > 5) {
    return 'high';
  }
  
  // Medium: z-score > 3.5
  if (zScore > 3.5) {
    return 'medium';
  }
  
  return 'low';
}

/**
 * Detect price anomalies
 */
export async function detectPriceAnomalies(
  symbol: string,
  currentPrice: number,
  historicalPrices: MetricData
): Promise<Anomaly[]> {
  const anomalies: Anomaly[] = [];
  
  const { isAnomaly, stdDev, zScore } = detectStatisticalAnomaly(
    currentPrice,
    historicalPrices.values
  );

  if (isAnomaly) {
    const expectedValue = historicalPrices.values.reduce((a, b) => a + b, 0) / historicalPrices.values.length;
    const priceChange = ((currentPrice - expectedValue) / expectedValue) * 100;
    
    anomalies.push({
      id: `price-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'price',
      severity: classifyAnomalySeverity(zScore, 'price', priceChange),
      metric: 'Price',
      currentValue: currentPrice,
      expectedValue,
      standardDeviations: zScore,
      description: `Price is ${zScore.toFixed(2)} standard deviations from the mean (${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}%)`,
      historicalContext: await getHistoricalContext(symbol, 'price', zScore),
      rootCause: analyzePriceAnomalyRootCause(priceChange, zScore),
      recommendedActions: generatePriceAnomalyActions(priceChange, zScore),
      confidence: Math.min(95, 70 + (zScore - 3) * 5)
    });
  }

  return anomalies;
}

/**
 * Detect volume anomalies
 */
export async function detectVolumeAnomalies(
  symbol: string,
  currentVolume: number,
  historicalVolumes: MetricData
): Promise<Anomaly[]> {
  const anomalies: Anomaly[] = [];
  
  const { isAnomaly, stdDev, zScore } = detectStatisticalAnomaly(
    currentVolume,
    historicalVolumes.values
  );

  if (isAnomaly) {
    const expectedValue = historicalVolumes.values.reduce((a, b) => a + b, 0) / historicalVolumes.values.length;
    const volumeChange = ((currentVolume - expectedValue) / expectedValue) * 100;
    
    anomalies.push({
      id: `volume-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'volume',
      severity: classifyAnomalySeverity(zScore, 'volume', volumeChange / 10),
      metric: 'Trading Volume',
      currentValue: currentVolume,
      expectedValue,
      standardDeviations: zScore,
      description: `Volume is ${zScore.toFixed(2)} standard deviations from the mean (${volumeChange > 0 ? '+' : ''}${volumeChange.toFixed(2)}%)`,
      historicalContext: await getHistoricalContext(symbol, 'volume', zScore),
      rootCause: analyzeVolumeAnomalyRootCause(volumeChange, zScore),
      recommendedActions: generateVolumeAnomalyActions(volumeChange, zScore),
      confidence: Math.min(95, 70 + (zScore - 3) * 5)
    });
  }

  return anomalies;
}

/**
 * Detect social sentiment anomalies
 */
export async function detectSocialAnomalies(
  symbol: string,
  currentSentiment: number,
  historicalSentiment: MetricData
): Promise<Anomaly[]> {
  const anomalies: Anomaly[] = [];
  
  const { isAnomaly, stdDev, zScore } = detectStatisticalAnomaly(
    currentSentiment,
    historicalSentiment.values
  );

  if (isAnomaly) {
    const expectedValue = historicalSentiment.values.reduce((a, b) => a + b, 0) / historicalSentiment.values.length;
    const sentimentChange = currentSentiment - expectedValue;
    
    anomalies.push({
      id: `social-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'social',
      severity: classifyAnomalySeverity(zScore, 'social', sentimentChange / 10),
      metric: 'Social Sentiment',
      currentValue: currentSentiment,
      expectedValue,
      standardDeviations: zScore,
      description: `Sentiment is ${zScore.toFixed(2)} standard deviations from the mean (${sentimentChange > 0 ? '+' : ''}${sentimentChange.toFixed(1)} points)`,
      historicalContext: await getHistoricalContext(symbol, 'social', zScore),
      rootCause: analyzeSocialAnomalyRootCause(sentimentChange, zScore),
      recommendedActions: generateSocialAnomalyActions(sentimentChange, zScore),
      confidence: Math.min(90, 65 + (zScore - 3) * 5)
    });
  }

  return anomalies;
}

/**
 * Detect on-chain anomalies
 */
export async function detectOnChainAnomalies(
  symbol: string,
  currentMetrics: { whaleTransactions: number; exchangeFlows: number; activeAddresses: number },
  historicalMetrics: { whaleTransactions: MetricData; exchangeFlows: MetricData; activeAddresses: MetricData }
): Promise<Anomaly[]> {
  const anomalies: Anomaly[] = [];
  
  // Check whale transactions
  const whaleAnomaly = detectStatisticalAnomaly(
    currentMetrics.whaleTransactions,
    historicalMetrics.whaleTransactions.values
  );
  
  if (whaleAnomaly.isAnomaly) {
    const expectedValue = historicalMetrics.whaleTransactions.values.reduce((a, b) => a + b, 0) / historicalMetrics.whaleTransactions.values.length;
    const change = ((currentMetrics.whaleTransactions - expectedValue) / expectedValue) * 100;
    
    anomalies.push({
      id: `onchain-whale-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'on-chain',
      severity: classifyAnomalySeverity(whaleAnomaly.zScore, 'on-chain', change / 10),
      metric: 'Whale Transactions',
      currentValue: currentMetrics.whaleTransactions,
      expectedValue,
      standardDeviations: whaleAnomaly.zScore,
      description: `Whale transaction count is ${whaleAnomaly.zScore.toFixed(2)} standard deviations from the mean`,
      historicalContext: await getHistoricalContext(symbol, 'whale-transactions', whaleAnomaly.zScore),
      rootCause: analyzeOnChainAnomalyRootCause('whale', change, whaleAnomaly.zScore),
      recommendedActions: generateOnChainAnomalyActions('whale', change, whaleAnomaly.zScore),
      confidence: Math.min(92, 68 + (whaleAnomaly.zScore - 3) * 5)
    });
  }

  // Check exchange flows
  const flowAnomaly = detectStatisticalAnomaly(
    currentMetrics.exchangeFlows,
    historicalMetrics.exchangeFlows.values
  );
  
  if (flowAnomaly.isAnomaly) {
    const expectedValue = historicalMetrics.exchangeFlows.values.reduce((a, b) => a + b, 0) / historicalMetrics.exchangeFlows.values.length;
    const change = ((currentMetrics.exchangeFlows - expectedValue) / expectedValue) * 100;
    
    anomalies.push({
      id: `onchain-flow-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'on-chain',
      severity: classifyAnomalySeverity(flowAnomaly.zScore, 'on-chain', change / 10),
      metric: 'Exchange Flows',
      currentValue: currentMetrics.exchangeFlows,
      expectedValue,
      standardDeviations: flowAnomaly.zScore,
      description: `Exchange flow is ${flowAnomaly.zScore.toFixed(2)} standard deviations from the mean`,
      historicalContext: await getHistoricalContext(symbol, 'exchange-flows', flowAnomaly.zScore),
      rootCause: analyzeOnChainAnomalyRootCause('flow', change, flowAnomaly.zScore),
      recommendedActions: generateOnChainAnomalyActions('flow', change, flowAnomaly.zScore),
      confidence: Math.min(90, 67 + (flowAnomaly.zScore - 3) * 5)
    });
  }

  return anomalies;
}

/**
 * Detect multi-dimensional anomalies using ML-inspired approach
 */
export async function detectMultiDimensionalAnomalies(
  symbol: string,
  metrics: {
    price: number;
    volume: number;
    sentiment: number;
    whaleActivity: number;
    fundingRate: number;
  },
  historicalData: {
    price: MetricData;
    volume: MetricData;
    sentiment: MetricData;
    whaleActivity: MetricData;
    fundingRate: MetricData;
  }
): Promise<Anomaly[]> {
  const anomalies: Anomaly[] = [];
  
  // Calculate z-scores for all metrics
  const zScores = {
    price: detectStatisticalAnomaly(metrics.price, historicalData.price.values).zScore,
    volume: detectStatisticalAnomaly(metrics.volume, historicalData.volume.values).zScore,
    sentiment: detectStatisticalAnomaly(metrics.sentiment, historicalData.sentiment.values).zScore,
    whaleActivity: detectStatisticalAnomaly(metrics.whaleActivity, historicalData.whaleActivity.values).zScore,
    fundingRate: detectStatisticalAnomaly(metrics.fundingRate, historicalData.fundingRate.values).zScore
  };

  // Detect complex patterns
  // Pattern 1: High volume + High whale activity + Extreme sentiment
  if (zScores.volume > 2.5 && zScores.whaleActivity > 2.5 && Math.abs(zScores.sentiment) > 2.5) {
    anomalies.push({
      id: `multi-coordinated-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'multi-dimensional',
      severity: 'high',
      metric: 'Coordinated Activity',
      currentValue: (zScores.volume + zScores.whaleActivity + Math.abs(zScores.sentiment)) / 3,
      expectedValue: 0,
      standardDeviations: Math.max(zScores.volume, zScores.whaleActivity, Math.abs(zScores.sentiment)),
      description: 'Unusual coordinated activity detected across volume, whale transactions, and sentiment',
      historicalContext: await getHistoricalContext(symbol, 'coordinated-activity', 3.5),
      rootCause: 'Potential coordinated buying/selling campaign or market manipulation',
      recommendedActions: [
        'Monitor for additional whale transactions',
        'Check for news or announcements',
        'Review social media for coordinated campaigns',
        'Consider reducing position size until pattern clarifies'
      ],
      confidence: 82
    });
  }

  // Pattern 2: Price divergence from fundamentals
  if (Math.abs(zScores.price) > 3 && Math.abs(zScores.sentiment) < 1.5 && Math.abs(zScores.volume) < 1.5) {
    anomalies.push({
      id: `multi-divergence-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'multi-dimensional',
      severity: 'medium',
      metric: 'Price-Fundamental Divergence',
      currentValue: Math.abs(zScores.price),
      expectedValue: 0,
      standardDeviations: Math.abs(zScores.price),
      description: 'Price moving significantly without corresponding changes in volume or sentiment',
      historicalContext: await getHistoricalContext(symbol, 'price-divergence', Math.abs(zScores.price)),
      rootCause: 'Potential low-liquidity manipulation or external market factors',
      recommendedActions: [
        'Verify price across multiple exchanges',
        'Check for liquidity issues',
        'Review order book depth',
        'Wait for volume confirmation before trading'
      ],
      confidence: 75
    });
  }

  // Pattern 3: Extreme funding rate with price stability
  if (Math.abs(zScores.fundingRate) > 3 && Math.abs(zScores.price) < 1.5) {
    anomalies.push({
      id: `multi-funding-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'multi-dimensional',
      severity: 'medium',
      metric: 'Funding Rate Anomaly',
      currentValue: Math.abs(zScores.fundingRate),
      expectedValue: 0,
      standardDeviations: Math.abs(zScores.fundingRate),
      description: 'Extreme funding rate without corresponding price movement',
      historicalContext: await getHistoricalContext(symbol, 'funding-anomaly', Math.abs(zScores.fundingRate)),
      rootCause: 'Potential mean reversion opportunity or derivatives market imbalance',
      recommendedActions: [
        'Consider funding rate arbitrage opportunities',
        'Monitor for potential price correction',
        'Check open interest trends',
        'Review liquidation levels'
      ],
      confidence: 78
    });
  }

  return anomalies;
}

/**
 * Generate comprehensive anomaly report
 */
export async function generateAnomalyReport(
  symbol: string,
  allAnomalies: Anomaly[]
): Promise<AnomalyReport> {
  const criticalCount = allAnomalies.filter(a => a.severity === 'critical').length;
  const highCount = allAnomalies.filter(a => a.severity === 'high').length;
  const mediumCount = allAnomalies.filter(a => a.severity === 'medium').length;
  const lowCount = allAnomalies.filter(a => a.severity === 'low').length;

  let overallRiskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (criticalCount > 0) overallRiskLevel = 'critical';
  else if (highCount > 1) overallRiskLevel = 'high';
  else if (highCount > 0 || mediumCount > 2) overallRiskLevel = 'medium';

  const summary = generateAnomalySummary(allAnomalies, overallRiskLevel);

  return {
    symbol,
    timestamp: new Date().toISOString(),
    totalAnomalies: allAnomalies.length,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    anomalies: allAnomalies.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    }),
    overallRiskLevel,
    summary
  };
}

// Helper functions

async function getHistoricalContext(
  symbol: string,
  anomalyType: string,
  zScore: number
): Promise<HistoricalContext[]> {
  // In production, this would query historical database
  // For now, return mock data
  return [
    {
      date: '2024-01-15',
      similarAnomaly: true,
      subsequentImpact: 'Price increased 8% over next 3 days',
      priceChange: 8.2,
      timeframe: '3 days'
    },
    {
      date: '2023-11-22',
      similarAnomaly: true,
      subsequentImpact: 'Price decreased 5% over next 2 days',
      priceChange: -5.1,
      timeframe: '2 days'
    }
  ];
}

function analyzePriceAnomalyRootCause(priceChange: number, zScore: number): string {
  if (priceChange > 10) {
    return 'Potential causes: Major positive news, whale accumulation, short squeeze, or market manipulation';
  } else if (priceChange < -10) {
    return 'Potential causes: Major negative news, whale distribution, long liquidations, or market manipulation';
  } else if (priceChange > 5) {
    return 'Potential causes: Positive sentiment shift, increased buying pressure, or technical breakout';
  } else {
    return 'Potential causes: Negative sentiment shift, increased selling pressure, or technical breakdown';
  }
}

function generatePriceAnomalyActions(priceChange: number, zScore: number): string[] {
  const actions: string[] = [];
  
  if (Math.abs(priceChange) > 10) {
    actions.push('URGENT: Review all recent news and announcements');
    actions.push('Check for whale transactions and exchange flows');
    actions.push('Verify price across multiple exchanges');
  }
  
  if (priceChange > 0) {
    actions.push('Consider taking partial profits if holding');
    actions.push('Wait for pullback before entering new positions');
    actions.push('Monitor for continuation or reversal signals');
  } else {
    actions.push('Consider buying opportunity if fundamentals remain strong');
    actions.push('Set tight stop-losses for existing positions');
    actions.push('Monitor for capitulation or bounce signals');
  }
  
  actions.push('Review technical indicators for confirmation');
  actions.push('Check social sentiment for additional context');
  
  return actions;
}

function analyzeVolumeAnomalyRootCause(volumeChange: number, zScore: number): string {
  if (volumeChange > 100) {
    return 'Potential causes: Major news event, listing announcement, whale activity, or coordinated buying/selling';
  } else if (volumeChange > 50) {
    return 'Potential causes: Increased market interest, technical breakout, or institutional activity';
  } else {
    return 'Potential causes: Reduced market interest, consolidation phase, or holiday period';
  }
}

function generateVolumeAnomalyActions(volumeChange: number, zScore: number): string[] {
  const actions: string[] = [];
  
  if (volumeChange > 100) {
    actions.push('URGENT: Investigate cause of volume spike');
    actions.push('Check for news, announcements, or social media trends');
    actions.push('Monitor price action for direction confirmation');
  }
  
  if (volumeChange > 0) {
    actions.push('High volume suggests strong conviction in current move');
    actions.push('Wait for volume confirmation before entering trades');
    actions.push('Monitor for volume exhaustion signals');
  } else {
    actions.push('Low volume suggests weak conviction');
    actions.push('Avoid trading during low liquidity periods');
    actions.push('Wait for volume to return before making decisions');
  }
  
  return actions;
}

function analyzeSocialAnomalyRootCause(sentimentChange: number, zScore: number): string {
  if (sentimentChange > 30) {
    return 'Potential causes: Viral positive news, influencer endorsement, or coordinated social campaign';
  } else if (sentimentChange < -30) {
    return 'Potential causes: Viral negative news, FUD campaign, or security concerns';
  } else if (sentimentChange > 15) {
    return 'Potential causes: Positive community developments or growing adoption';
  } else {
    return 'Potential causes: Negative community sentiment or declining interest';
  }
}

function generateSocialAnomalyActions(sentimentChange: number, zScore: number): string[] {
  const actions: string[] = [];
  
  if (Math.abs(sentimentChange) > 30) {
    actions.push('URGENT: Verify source of sentiment shift');
    actions.push('Check for coordinated social media campaigns');
    actions.push('Review influencer activity and engagement');
  }
  
  if (sentimentChange > 0) {
    actions.push('Positive sentiment may precede price increase');
    actions.push('Monitor for sentiment-price divergence');
    actions.push('Consider contrarian signals if sentiment becomes extreme');
  } else {
    actions.push('Negative sentiment may precede price decrease');
    actions.push('Look for capitulation signals');
    actions.push('Consider accumulation if fundamentals remain strong');
  }
  
  return actions;
}

function analyzeOnChainAnomalyRootCause(type: string, change: number, zScore: number): string {
  if (type === 'whale') {
    if (change > 0) {
      return 'Potential causes: Whale accumulation, large transfers between wallets, or exchange deposits';
    } else {
      return 'Potential causes: Whale distribution, reduced large transactions, or exchange withdrawals';
    }
  } else {
    if (change > 0) {
      return 'Potential causes: Increased exchange inflows (potential selling pressure) or institutional activity';
    } else {
      return 'Potential causes: Increased exchange outflows (potential accumulation) or reduced trading activity';
    }
  }
}

function generateOnChainAnomalyActions(type: string, change: number, zScore: number): string[] {
  const actions: string[] = [];
  
  if (type === 'whale') {
    actions.push('Monitor whale wallet addresses for additional activity');
    actions.push('Check if whales are accumulating or distributing');
    actions.push('Review historical whale behavior patterns');
  } else {
    if (change > 0) {
      actions.push('Increased exchange inflows may indicate selling pressure');
      actions.push('Monitor for potential price decline');
      actions.push('Consider reducing position size');
    } else {
      actions.push('Increased exchange outflows may indicate accumulation');
      actions.push('Monitor for potential price increase');
      actions.push('Consider accumulation opportunities');
    }
  }
  
  actions.push('Cross-reference with price and volume data');
  actions.push('Check for correlation with news events');
  
  return actions;
}

function generateAnomalySummary(anomalies: Anomaly[], riskLevel: string): string {
  if (anomalies.length === 0) {
    return 'No significant anomalies detected. All metrics are within normal ranges.';
  }

  const criticalAnomalies = anomalies.filter(a => a.severity === 'critical');
  const highAnomalies = anomalies.filter(a => a.severity === 'high');

  if (criticalAnomalies.length > 0) {
    return `CRITICAL: ${criticalAnomalies.length} critical anomal${criticalAnomalies.length > 1 ? 'ies' : 'y'} detected. Immediate attention required. ${criticalAnomalies[0].description}`;
  }

  if (highAnomalies.length > 0) {
    return `WARNING: ${highAnomalies.length} high-severity anomal${highAnomalies.length > 1 ? 'ies' : 'y'} detected. ${highAnomalies[0].description}`;
  }

  return `${anomalies.length} anomal${anomalies.length > 1 ? 'ies' : 'y'} detected with ${riskLevel} overall risk level. Monitor situation closely.`;
}
