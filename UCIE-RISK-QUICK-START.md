# UCIE Risk Assessment - Quick Start Guide

## 🚀 Quick Start

Get up and running with UCIE Risk Assessment in 5 minutes.

---

## 1. Test the API Endpoint

```bash
# Start your development server
npm run dev

# Test Bitcoin risk assessment
curl http://localhost:3000/api/ucie/risk/bitcoin

# Test Ethereum risk assessment
curl http://localhost:3000/api/ucie/risk/ethereum

# Test caching (second request should be faster)
curl http://localhost:3000/api/ucie/risk/bitcoin
```

---

## 2. Use in Your React Component

```tsx
import { useState, useEffect } from 'react';
import RiskAssessmentPanel from '../components/UCIE/RiskAssessmentPanel';

export default function RiskPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetch('/api/ucie/risk/bitcoin')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setData(data);
        } else {
          setError(data.error);
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-bitcoin-white mb-6">
        Risk Assessment
      </h1>
      
      {data && (
        <RiskAssessmentPanel
          symbol="BTC"
          riskScore={data.riskScore}
          volatilityMetrics={data.volatilityMetrics}
          correlationMetrics={data.correlationMetrics}
          maxDrawdownMetrics={data.maxDrawdownMetrics}
          portfolioImpact={data.portfolioImpact}
          loading={loading}
          error={error}
        />
      )}
    </div>
  );
}
```

---

## 3. Use Individual Functions

```typescript
// Calculate volatility
import { getVolatilityMetrics } from '../lib/ucie/volatilityCalculators';

const volatility = await getVolatilityMetrics('bitcoin');
console.log(`Volatility: ${(volatility.annualized30d * 100).toFixed(1)}%`);
console.log(`Category: ${volatility.volatilityCategory}`);

// Calculate correlations
import { calculateCorrelationMetrics } from '../lib/ucie/correlationAnalysis';

const correlation = await calculateCorrelationMetrics('ethereum');
console.log(`BTC correlation: ${correlation.btc.toFixed(2)}`);
console.log(`Diversification score: ${correlation.diversificationScore}`);

// Calculate max drawdown
import { getMaxDrawdownMetrics } from '../lib/ucie/maxDrawdown';

const drawdown = await getMaxDrawdownMetrics('solana', 10000);
console.log(`Historical: ${(drawdown.historical * 100).toFixed(1)}%`);
console.log(`95% CI: ${(drawdown.estimated95 * 100).toFixed(1)}%`);

// Calculate risk score
import { calculateRiskScore } from '../lib/ucie/riskScoring';

const riskScore = calculateRiskScore({
  annualizedVolatility: 0.60,
  volatilityPercentile: 75,
  dailyVolume: 5_000_000_000,
  marketCap: 50_000_000_000,
  top10HolderPercentage: 0.45,
  giniCoefficient: 0.65,
  regulatoryStatus: 'Clear',
  marketCapUSD: 50_000_000_000
});

console.log(`Risk score: ${riskScore.overall} (${riskScore.category})`);
console.log(`Explanation: ${riskScore.explanation}`);

// Calculate portfolio impact
import { 
  calculatePortfolioImpactWithDefaults,
  estimateAssetMetrics 
} from '../lib/ucie/portfolioImpact';

const assetMetrics = estimateAssetMetrics(0.35, 0.70, 0.65, 0.75);
const impact = calculatePortfolioImpactWithDefaults(assetMetrics);

console.log(`Optimal allocation: ${impact.optimalAllocation}%`);
console.log(`Diversification benefit: ${impact.diversificationBenefit.toFixed(1)}%`);
impact.recommendations.forEach(rec => console.log(`• ${rec}`));
```

---

## 4. API Response Structure

```typescript
interface RiskAssessmentResponse {
  success: boolean;
  symbol: string;
  timestamp: string;
  dataQualityScore: number;
  
  riskScore: {
    overall: number;              // 0-100
    category: string;             // Low, Medium, High, Critical
    components: {
      volatility: number;
      liquidity: number;
      concentration: number;
      regulatory: number;
      marketCap: number;
    };
    explanation: string;
  };
  
  volatilityMetrics: {
    std30d: number;
    std90d: number;
    std1y: number;
    percentile: number;
    annualized30d: number;
    annualized90d: number;
    annualized1y: number;
    volatilityCategory: string;
  };
  
  correlationMetrics: {
    btc: number;
    eth: number;
    sp500: number;
    gold: number;
    rolling30d: { btc: number; eth: number };
    rolling90d: { btc: number; eth: number };
    regimeChanges: Array<{
      asset: string;
      date: string;
      previousCorrelation: number;
      newCorrelation: number;
      significance: string;
    }>;
    diversificationScore: number;
  };
  
  maxDrawdownMetrics: {
    historical: number;
    estimated95: number;
    estimated99: number;
    historicalPeriod: {
      start: string;
      end: string;
      duration: number;
    };
    monteCarloResults: {
      mean: number;
      median: number;
      worstCase: number;
      iterations: number;
    };
  };
  
  portfolioImpact: {
    allocations: Array<{
      percentage: number;
      expectedReturn: number;
      volatility: number;
      sharpeRatio: number;
      maxDrawdown: number;
      diversificationScore: number;
    }>;
    optimalAllocation: number;
    diversificationBenefit: number;
    recommendations: string[];
  };
  
  cacheStatus: 'hit' | 'miss';
}
```

---

## 5. Common Use Cases

### Display Risk Score Only

```tsx
const { riskScore } = await fetch('/api/ucie/risk/bitcoin').then(r => r.json());

<div className="bitcoin-block p-6">
  <h3 className="text-xl font-bold text-bitcoin-white mb-2">
    Risk Score
  </h3>
  <div className="font-mono text-4xl font-bold text-bitcoin-orange">
    {riskScore.overall}
  </div>
  <div className="text-sm text-bitcoin-white-60 mt-1">
    {riskScore.category} Risk
  </div>
  <p className="text-bitcoin-white-80 mt-4">
    {riskScore.explanation}
  </p>
</div>
```

### Display Volatility Metrics

```tsx
const { volatilityMetrics } = await fetch('/api/ucie/risk/bitcoin').then(r => r.json());

<div className="grid grid-cols-3 gap-4">
  <div className="bitcoin-block-subtle p-4">
    <div className="text-xs text-bitcoin-white-60 uppercase">30-Day</div>
    <div className="font-mono text-2xl font-bold text-bitcoin-orange">
      {(volatilityMetrics.annualized30d * 100).toFixed(1)}%
    </div>
  </div>
  <div className="bitcoin-block-subtle p-4">
    <div className="text-xs text-bitcoin-white-60 uppercase">90-Day</div>
    <div className="font-mono text-2xl font-bold text-bitcoin-orange">
      {(volatilityMetrics.annualized90d * 100).toFixed(1)}%
    </div>
  </div>
  <div className="bitcoin-block-subtle p-4">
    <div className="text-xs text-bitcoin-white-60 uppercase">1-Year</div>
    <div className="font-mono text-2xl font-bold text-bitcoin-orange">
      {(volatilityMetrics.annualized1y * 100).toFixed(1)}%
    </div>
  </div>
</div>
```

### Display Portfolio Recommendations

```tsx
const { portfolioImpact } = await fetch('/api/ucie/risk/bitcoin').then(r => r.json());

<div className="bitcoin-block p-6">
  <h3 className="text-xl font-bold text-bitcoin-white mb-4">
    Portfolio Recommendations
  </h3>
  <div className="space-y-2">
    {portfolioImpact.recommendations.map((rec, idx) => (
      <div key={idx} className="text-sm text-bitcoin-white-80 p-3 bg-bitcoin-black border border-bitcoin-orange-20 rounded">
        • {rec}
      </div>
    ))}
  </div>
  <div className="mt-4 p-4 bg-bitcoin-orange-10 border border-bitcoin-orange rounded-lg">
    <div className="text-sm text-bitcoin-white">
      <span className="font-semibold">Optimal Allocation:</span> {portfolioImpact.optimalAllocation}%
    </div>
  </div>
</div>
```

---

## 6. Error Handling

```typescript
try {
  const response = await fetch('/api/ucie/risk/bitcoin');
  const data = await response.json();
  
  if (!data.success) {
    console.error('Risk assessment failed:', data.error);
    // Handle error (show message to user)
    return;
  }
  
  if (data.dataQualityScore < 70) {
    console.warn('Low data quality:', data.dataQualityScore);
    // Show warning to user
  }
  
  // Use the data
  console.log('Risk score:', data.riskScore.overall);
  
} catch (error) {
  console.error('Network error:', error);
  // Handle network error
}
```

---

## 7. Performance Tips

### Use Caching
```typescript
// First request: ~5-7 seconds
const data1 = await fetch('/api/ucie/risk/bitcoin').then(r => r.json());

// Second request (within 1 hour): <100ms
const data2 = await fetch('/api/ucie/risk/bitcoin').then(r => r.json());

console.log(data2.cacheStatus); // 'hit'
```

### Parallel Requests
```typescript
// Fetch multiple symbols in parallel
const [btc, eth, sol] = await Promise.all([
  fetch('/api/ucie/risk/bitcoin').then(r => r.json()),
  fetch('/api/ucie/risk/ethereum').then(r => r.json()),
  fetch('/api/ucie/risk/solana').then(r => r.json())
]);
```

### Progressive Loading
```typescript
// Load critical data first
const quickData = await fetch('/api/ucie/risk/bitcoin').then(r => r.json());
setRiskScore(quickData.riskScore);

// Then load detailed metrics
setVolatilityMetrics(quickData.volatilityMetrics);
setCorrelationMetrics(quickData.correlationMetrics);
```

---

## 8. Troubleshooting

### API Returns 400 Error
```
Error: Invalid symbol parameter
```
**Solution**: Ensure symbol is a valid string (e.g., 'bitcoin', 'ethereum')

### API Returns 503 Error
```
Error: Insufficient data available for risk assessment
```
**Solution**: Token may not have enough historical data. Try a more established token.

### Slow Response Times
```
Response time: >10 seconds
```
**Solution**: 
- Check CoinGecko API rate limits
- Verify network connection
- Use caching for repeated requests

### TypeScript Errors
```
Error: Property 'riskScore' does not exist
```
**Solution**: Import types from the module:
```typescript
import type { RiskAssessmentResponse } from '../pages/api/ucie/risk/[symbol]';
```

---

## 9. Next Steps

1. **Integrate with UCIE Hub** - Add risk assessment to main analysis page
2. **Add to Navigation** - Link from main menu
3. **Connect Real Data** - Integrate market data and on-chain APIs
4. **Add Unit Tests** - Test calculations with known data
5. **Deploy to Production** - Test with real users

---

## 10. Resources

- **Full Documentation**: `lib/ucie/RISK-ASSESSMENT-README.md`
- **Completion Summary**: `UCIE-RISK-ASSESSMENT-COMPLETE.md`
- **UCIE Spec**: `.kiro/specs/universal-crypto-intelligence/`
- **Requirements**: `.kiro/specs/universal-crypto-intelligence/requirements.md`

---

**Need Help?**
- Check the full documentation in `lib/ucie/RISK-ASSESSMENT-README.md`
- Review the completion summary in `UCIE-RISK-ASSESSMENT-COMPLETE.md`
- Examine the code examples in each module file

**Happy Coding!** 🚀
