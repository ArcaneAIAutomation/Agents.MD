# UCIE Advanced Features - Quick Start Guide

**Quick reference for using the 6 advanced analysis features**

---

## 1. Anomaly Detection

**Purpose**: Detect unusual patterns across all metrics in real-time

### Basic Usage

```typescript
import {
  detectPriceAnomalies,
  detectVolumeAnomalies,
  detectSocialAnomalies,
  detectOnChainAnomalies,
  detectMultiDimensionalAnomalies,
  generateAnomalyReport
} from '@/lib/ucie/anomalyDetection';

// Detect price anomalies
const priceAnomalies = await detectPriceAnomalies(
  'BTC',
  95000, // current price
  { values: [90000, 91000, 92000, ...], timestamps: [...] }
);

// Generate comprehensive report
const report = await generateAnomalyReport('BTC', allAnomalies);
console.log(report.summary);
console.log(`Risk Level: ${report.overallRiskLevel}`);
```

### Key Outputs
- Anomaly type (price, volume, social, on-chain, multi-dimensional)
- Severity (low, medium, high, critical)
- Standard deviations from mean
- Historical context
- Recommended actions

---

## 2. Sentiment Divergence Detection

**Purpose**: Identify contrarian trading opportunities

### Basic Usage

```typescript
import {
  analyzeSentimentDivergence,
  analyzeSmartMoneySentiment,
  analyzeRetailSentiment,
  generateDivergenceReport
} from '@/lib/ucie/sentimentDivergence';

// Analyze divergence
const divergence = await analyzeSentimentDivergence(
  'BTC',
  85, // current sentiment (very bullish)
  10, // 24h change
  15, // 7d change
  95000, // current price
  -5, // 24h price change (falling!)
  -8, // 7d price change
  '7d'
);

console.log(divergence.type); // 'distribution'
console.log(divergence.tradingSignal); // 'sell' or 'strong_sell'
console.log(divergence.reasoning);
```

### Key Outputs
- Divergence type (distribution, accumulation, none)
- Trading signal (strong_buy, buy, neutral, sell, strong_sell)
- Confidence score
- Smart money vs retail sentiment
- Historical accuracy

---

## 3. Regulatory Risk Assessment

**Purpose**: Assess legal and regulatory risks across jurisdictions

### Basic Usage

```typescript
import {
  generateRegulatoryRiskReport
} from '@/lib/ucie/regulatoryRisk';

// Generate comprehensive regulatory report
const report = await generateRegulatoryRiskReport(
  'BTC',
  {
    hasICO: false,
    hasFoundation: true,
    isDecentralized: true,
    hasStaking: false,
    hasGovernance: false,
    marketingPromises: []
  }
);

console.log(`Overall Risk: ${report.overallRisk}`);
console.log(`Compliance Score: ${report.complianceScore}/100`);
console.log(`Howey Test: ${report.howeyTest.isLikelySecurity ? 'Security' : 'Not Security'}`);
console.log(report.recommendations.global);
```

### Key Outputs
- Jurisdiction status (US, EU, UK, Asia)
- Risk levels (green, yellow, red)
- Howey Test assessment
- Regulatory actions and delistings
- Jurisdiction-specific recommendations

---

## 4. Tokenomics Deep Dive

**Purpose**: Comprehensive supply and distribution analysis

### Basic Usage

```typescript
import {
  generateTokenomicsReport
} from '@/lib/ucie/tokenomicsAnalysis';

// Generate tokenomics report
const report = await generateTokenomicsReport(
  'BTC',
  {
    currentSupply: 19500000,
    maxSupply: 21000000,
    circulatingSupply: 19500000,
    inflationRate: 1.8, // Annual %
    burnRate: 0,
    totalBurned: 0
  },
  {
    team: 0,
    investors: 0,
    community: 100,
    treasury: 0,
    foundation: 0,
    other: 0
  },
  holderData,
  transactionVolume,
  true // has utility
);

console.log(`Tokenomics Score: ${report.score.overall}/100`);
console.log(`Future Supply (5y): ${report.futureSupply.fiveYears.estimatedSupply}`);
console.log(`Dilution Impact: ${report.futureSupply.fiveYears.dilutionImpact}%`);
```

### Key Outputs
- Supply schedule and inflation rate
- Token velocity
- Distribution and concentration
- Future supply estimates (1y, 2y, 5y)
- Tokenomics score with strengths/weaknesses
- Peer comparison

---

## 5. Market Microstructure Analysis

**Purpose**: Analyze liquidity, slippage, and market manipulation

### Basic Usage

```typescript
import {
  generateMarketMicrostructureReport
} from '@/lib/ucie/marketMicrostructure';

// Generate market microstructure report
const report = await generateMarketMicrostructureReport(
  'BTC',
  95000, // current price
  [
    {
      exchange: 'Binance',
      bids: [{ price: 94990, volume: 10 }, ...],
      asks: [{ price: 95010, volume: 8 }, ...]
    },
    // ... more exchanges
  ],
  [
    {
      exchange: 'Uniswap',
      pair: 'BTC/USDT',
      liquidity: 50000000,
      volume24h: 10000000,
      fee: 0.003
    }
  ]
);

console.log(`Total Liquidity: $${report.aggregatedDepth.totalBidDepth + report.aggregatedDepth.totalAskDepth}`);
console.log(`Weighted Spread: ${report.aggregatedDepth.weightedSpread}%`);

// Check slippage for $1M trade
const slippage1M = report.slippageEstimates.find(s => s.tradeSizeUSD === 1000000);
console.log(`$1M Trade Slippage: ${slippage1M.slippage}%`);

// Check for manipulation
if (report.marketMakerActivity.detected) {
  console.log(`⚠️ Manipulation detected: ${report.marketMakerActivity.description}`);
}
```

### Key Outputs
- Order book depth across exchanges
- Slippage estimates ($10K, $100K, $1M, $10M)
- Liquidity pools (CEX and DEX)
- Optimal routing for large trades
- Market manipulation detection
- Market impact scores

---

## 6. Portfolio Optimization

**Purpose**: Modern Portfolio Theory optimization and correlation analysis

### Basic Usage

```typescript
import {
  generatePortfolioOptimizationReport
} from '@/lib/ucie/portfolioOptimization';

// Generate portfolio optimization report
const report = await generatePortfolioOptimizationReport(
  'BTC',
  btcReturns, // Daily returns array
  btcReturns, // BTC returns for comparison
  ethReturns, // ETH returns
  {
    'SOL': solReturns,
    'ADA': adaReturns,
    'DOT': dotReturns,
    // ... more assets
  }
);

console.log(`Correlation with BTC: ${report.correlations.withBTC.averageCorrelation}`);
console.log(`Correlation with ETH: ${report.correlations.withETH.averageCorrelation}`);

// Optimal portfolios
console.log(`Max Sharpe Portfolio:`);
console.log(`  Sharpe Ratio: ${report.optimalPortfolios.maxSharpe.metrics.sharpeRatio}`);
console.log(`  Expected Return: ${report.optimalPortfolios.maxSharpe.metrics.expectedReturn}%`);
console.log(`  Volatility: ${report.optimalPortfolios.maxSharpe.metrics.volatility}%`);

// Diversification benefit
console.log(`Diversification Benefit: ${report.diversificationBenefit}% risk reduction`);
```

### Key Outputs
- Rolling correlations (30d, 90d, 1y)
- Correlation matrix
- Correlation regime changes
- Portfolio metrics (Sharpe, Sortino, max drawdown)
- Efficient frontier
- Optimal portfolios (max Sharpe, min volatility, target return)
- Scenario analysis (bull, bear, sideways)
- Diversification benefit

---

## Integration Example

### Complete Analysis Pipeline

```typescript
import { generateComprehensiveAnalysis } from '@/lib/ucie/analysis';

async function analyzeToken(symbol: string) {
  // Fetch all data
  const marketData = await fetchMarketData(symbol);
  const onChainData = await fetchOnChainData(symbol);
  const sentimentData = await fetchSentimentData(symbol);
  
  // Run all advanced analyses
  const [
    anomalies,
    divergence,
    regulatory,
    tokenomics,
    microstructure,
    portfolio
  ] = await Promise.all([
    generateAnomalyReport(symbol, allAnomalies),
    generateDivergenceReport(symbol, ...),
    generateRegulatoryRiskReport(symbol, ...),
    generateTokenomicsReport(symbol, ...),
    generateMarketMicrostructureReport(symbol, ...),
    generatePortfolioOptimizationReport(symbol, ...)
  ]);
  
  // Combine into comprehensive report
  return {
    symbol,
    timestamp: new Date().toISOString(),
    marketData,
    onChainData,
    sentimentData,
    advancedAnalysis: {
      anomalies,
      divergence,
      regulatory,
      tokenomics,
      microstructure,
      portfolio
    }
  };
}
```

---

## Common Patterns

### 1. Risk Assessment

```typescript
// Combine multiple risk signals
const overallRisk = {
  anomalyRisk: anomalyReport.overallRiskLevel,
  regulatoryRisk: regulatoryReport.overallRisk,
  liquidityRisk: microstructureReport.marketImpact[2].impactScore > 60 ? 'high' : 'low',
  tokenomicsRisk: tokenomicsReport.score.overall < 50 ? 'high' : 'low'
};
```

### 2. Trading Signals

```typescript
// Aggregate trading signals
const signals = {
  divergence: divergenceReport.currentDivergence.tradingSignal,
  anomalies: anomalyReport.criticalCount > 0 ? 'sell' : 'neutral',
  portfolio: portfolioReport.recommendation
};
```

### 3. Opportunity Identification

```typescript
// Find opportunities
if (divergenceReport.currentDivergence.type === 'accumulation' &&
    anomalyReport.overallRiskLevel === 'low' &&
    regulatoryReport.overallRisk !== 'critical') {
  console.log('🎯 Accumulation opportunity detected!');
}
```

---

## Performance Tips

1. **Cache Results**: Cache reports for 5-15 minutes
2. **Parallel Execution**: Run independent analyses concurrently
3. **Lazy Loading**: Load detailed analysis on demand
4. **Data Sampling**: Use representative samples for large datasets
5. **Incremental Updates**: Update only changed data

---

## Error Handling

```typescript
try {
  const report = await generateAnomalyReport(symbol, anomalies);
} catch (error) {
  console.error('Anomaly detection failed:', error);
  // Fallback to basic analysis
}
```

---

## Next Steps

1. **Integrate with UI**: Create React components for each feature
2. **Add Visualizations**: Charts for correlations, efficient frontier, etc.
3. **Real-time Updates**: WebSocket integration for live monitoring
4. **Custom Alerts**: User-configurable anomaly notifications
5. **API Endpoints**: Expose features via REST API

---

**For detailed documentation, see**: `UCIE-ADVANCED-FEATURES-COMPLETE.md`
