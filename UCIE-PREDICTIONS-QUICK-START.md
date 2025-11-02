# UCIE Predictions - Quick Start Guide

## Overview

The UCIE Predictive Modeling system provides AI-powered price forecasts, pattern recognition, and scenario analysis for cryptocurrency tokens.

---

## Quick Start

### 1. API Usage

```bash
# Get predictions for Bitcoin
curl https://news.arcane.group/api/ucie/predictions/BTC

# Get predictions for Ethereum
curl https://news.arcane.group/api/ucie/predictions/ETH
```

### 2. Component Usage

```tsx
import PredictiveModelPanel from '@/components/UCIE/PredictiveModelPanel';

function AnalysisPage() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetch('/api/ucie/predictions/BTC')
      .then(res => res.json())
      .then(result => setData(result.data));
  }, []);
  
  if (!data) return <div>Loading...</div>;
  
  return (
    <PredictiveModelPanel
      symbol={data.symbol}
      predictions={data.predictions}
      patternMatching={data.patternMatching}
      scenarios={data.scenarios}
      modelPerformance={data.modelPerformance}
      currentPrice={data.currentPrice}
    />
  );
}
```

### 3. Programmatic Usage

```typescript
import { generatePricePredictions } from '@/lib/ucie/pricePrediction';
import { detectPatterns } from '@/lib/ucie/patternMatching';
import { generateScenarioAnalysis } from '@/lib/ucie/scenarioAnalysis';

// Generate predictions
const predictions = await generatePricePredictions(
  'BTC',
  historicalPrices,
  currentPrice
);

console.log('24h prediction:', predictions.predictions.price24h);
console.log('7d prediction:', predictions.predictions.price7d);
console.log('30d prediction:', predictions.predictions.price30d);

// Detect patterns
const patterns = detectPatterns(closePrices);
console.log('Detected patterns:', patterns);

// Generate scenarios
const scenarios = await generateScenarioAnalysis(
  'BTC',
  currentPrice,
  marketConditions,
  '7d'
);

console.log('Bull case:', scenarios.bullCase);
console.log('Base case:', scenarios.baseCase);
console.log('Bear case:', scenarios.bearCase);
```

---

## API Response Structure

```typescript
{
  success: true,
  data: {
    symbol: "BTC",
    currentPrice: 95000,
    predictions: {
      price24h: {
        low: 93500,
        mid: 95800,
        high: 98200,
        confidence: 75,
        methodology: "Ensemble (EMA + Linear Regression + Momentum)"
      },
      price7d: { ... },
      price30d: { ... }
    },
    patternMatching: {
      currentPattern: {
        type: "ascending_triangle",
        confidence: 82,
        bullish: true,
        description: "Ascending Triangle pattern - typically bullish continuation"
      },
      historicalMatches: [
        {
          similarity: 92,
          historicalDate: "2024-08-15",
          priceChange7d: 8.5,
          outcome: "bullish"
        }
      ],
      probability: {
        bullish: 65,
        bearish: 20,
        neutral: 15
      }
    },
    scenarios: {
      "24h": { ... },
      "7d": {
        bullCase: {
          target: 102000,
          probability: 35,
          reasoning: "Strong momentum continues..."
        },
        baseCase: {
          target: 96500,
          probability: 45,
          reasoning: "Market continues current trajectory..."
        },
        bearCase: {
          target: 89000,
          probability: 20,
          reasoning: "Market correction scenario..."
        }
      },
      "30d": { ... }
    },
    modelPerformance: {
      last30Days: 72,
      last90Days: 68,
      allTime: 65
    },
    dataQuality: 95,
    lastUpdated: "2025-01-27T12:00:00Z"
  },
  cached: false
}
```

---

## Features

### 🎯 Price Predictions
- **3 Timeframes**: 24h, 7d, 30d
- **Confidence Intervals**: Low, mid, high estimates
- **Ensemble Model**: Combines EMA, linear regression, momentum
- **Confidence Scores**: 0-100% based on data quality

### 📊 Pattern Recognition
- **11 Chart Patterns**: Head & shoulders, triangles, flags, wedges
- **Historical Matching**: Finds similar patterns from past
- **Similarity Scores**: 85%+ threshold for matches
- **Outcome Prediction**: Bullish/bearish/neutral probabilities

### 🎲 Scenario Analysis
- **3 Scenarios**: Bull, base, bear cases
- **Probability Distribution**: Weighted by market conditions
- **Key Factors**: Reasoning and supporting evidence
- **Risk Metrics**: Expected value, risk/reward ratio

### 📈 Model Accuracy
- **Performance Tracking**: 30d, 90d, all-time scores
- **Multiple Metrics**: MAE, RMSE, MAPE, directional accuracy
- **Timeframe Breakdown**: Separate metrics for each timeframe
- **Validation System**: Compare predictions to actual outcomes

---

## Configuration

### Cache Settings

```typescript
// In pages/api/ucie/predictions/[symbol].ts
const CACHE_TTL = 60 * 60 * 1000; // 1 hour (default)

// Adjust as needed:
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours
```

### Prediction Parameters

```typescript
// In lib/ucie/pricePrediction.ts

// Adjust EMA periods
const ema20 = calculateEMA(closePrices, 20); // Short-term
const ema50 = calculateEMA(closePrices, 50); // Long-term

// Adjust confidence calculation
const confidence = Math.max(20, Math.min(95, dataQuality - volatilityPenalty));
```

### Pattern Detection Thresholds

```typescript
// In lib/ucie/patternMatching.ts

// Similarity threshold for historical matches
const SIMILARITY_THRESHOLD = 85; // 85%+

// Pattern confidence thresholds
const MIN_CONFIDENCE = 60; // Minimum 60%
const HIGH_CONFIDENCE = 80; // High confidence 80%+
```

---

## Best Practices

### 1. Caching
- Use the built-in 1-hour cache for production
- Implement client-side caching for repeated requests
- Clear cache when market conditions change significantly

### 2. Error Handling
```typescript
try {
  const response = await fetch('/api/ucie/predictions/BTC');
  const data = await response.json();
  
  if (!data.success) {
    console.error('Prediction error:', data.error);
    // Handle error gracefully
  }
} catch (error) {
  console.error('Network error:', error);
  // Show fallback UI
}
```

### 3. Data Validation
```typescript
// Always validate prediction data
if (data.predictions.price24h.confidence < 50) {
  console.warn('Low confidence prediction');
  // Show warning to user
}

if (data.dataQuality < 70) {
  console.warn('Low data quality');
  // Indicate data quality issues
}
```

### 4. User Disclaimers
```tsx
// Always show disclaimers for predictions
<div className="disclaimer">
  <AlertCircle />
  <p>
    Predictions are probabilistic estimates and should not be 
    considered financial advice. Past performance does not 
    guarantee future results.
  </p>
</div>
```

---

## Troubleshooting

### Issue: Low Confidence Scores
**Cause**: Insufficient historical data or high volatility  
**Solution**: 
- Ensure at least 30 days of historical data
- Check data quality score
- Consider using longer timeframes

### Issue: No Patterns Detected
**Cause**: Price action doesn't match known patterns  
**Solution**:
- This is normal - not all price action forms patterns
- Check if price data is sufficient (20+ candles)
- Patterns are detected when confidence > 60%

### Issue: Cached Data Too Old
**Cause**: Cache TTL too long for volatile markets  
**Solution**:
- Reduce CACHE_TTL to 30 minutes
- Implement cache invalidation on major events
- Add manual refresh button

### Issue: API Timeout
**Cause**: Complex calculations taking too long  
**Solution**:
- Increase API timeout limit
- Optimize historical data fetching
- Implement progressive loading

---

## Performance Tips

### 1. Optimize Historical Data
```typescript
// Fetch only required data points
const requiredDays = 365; // 1 year
const historicalPrices = await fetchHistoricalPrices(symbol, requiredDays);
```

### 2. Parallel Processing
```typescript
// Fetch multiple predictions in parallel
const [btcPredictions, ethPredictions] = await Promise.all([
  fetch('/api/ucie/predictions/BTC').then(r => r.json()),
  fetch('/api/ucie/predictions/ETH').then(r => r.json())
]);
```

### 3. Progressive Loading
```tsx
// Load critical data first
const [predictions, setPredictions] = useState(null);
const [patterns, setPatterns] = useState(null);
const [scenarios, setScenarios] = useState(null);

useEffect(() => {
  // Load predictions first (fastest)
  fetchPredictions().then(setPredictions);
  
  // Then patterns
  fetchPatterns().then(setPatterns);
  
  // Finally scenarios
  fetchScenarios().then(setScenarios);
}, []);
```

---

## Integration Checklist

- [ ] API endpoint accessible at `/api/ucie/predictions/[symbol]`
- [ ] Component imported and used in analysis page
- [ ] Historical price data connected
- [ ] Market conditions data connected
- [ ] Caching configured appropriately
- [ ] Error handling implemented
- [ ] Disclaimers displayed
- [ ] Mobile responsive design tested
- [ ] Performance optimized
- [ ] Documentation reviewed

---

## Support

### Documentation
- Full implementation: `UCIE-PREDICTIVE-MODELING-COMPLETE.md`
- Requirements: `.kiro/specs/universal-crypto-intelligence/requirements.md`
- Design: `.kiro/specs/universal-crypto-intelligence/design.md`

### Code Files
- Price predictions: `lib/ucie/pricePrediction.ts`
- Pattern matching: `lib/ucie/patternMatching.ts`
- Scenario analysis: `lib/ucie/scenarioAnalysis.ts`
- Model accuracy: `lib/ucie/modelAccuracy.ts`
- Component: `components/UCIE/PredictiveModelPanel.tsx`
- API: `pages/api/ucie/predictions/[symbol].ts`

### Next Steps
- Integrate with real historical data sources
- Connect to database for prediction storage
- Implement real-time validation
- Add to main UCIE analysis hub
- Monitor performance metrics

---

**Status**: ✅ Ready to Use  
**Version**: 1.0.0  
**Last Updated**: January 27, 2025

