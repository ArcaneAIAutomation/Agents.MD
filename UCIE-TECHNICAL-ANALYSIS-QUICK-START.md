# UCIE Technical Analysis - Quick Start Guide

## Overview

The UCIE Technical Analysis system provides comprehensive cryptocurrency technical analysis with 11+ indicators, AI interpretation, multi-timeframe analysis, support/resistance detection, and chart pattern recognition.

---

## Quick Usage

### 1. API Endpoint

```bash
# Get technical analysis for Bitcoin
GET /api/ucie/technical/BTC

# Get technical analysis for Ethereum
GET /api/ucie/technical/ETH

# Get technical analysis for any token
GET /api/ucie/technical/[SYMBOL]
```

### 2. Response Structure

```typescript
{
  success: true,
  symbol: "BTC",
  timestamp: "2025-01-27T...",
  currentPrice: 95000,
  
  // 11+ Technical Indicators
  indicators: {
    rsi: { value: 65, signal: "neutral", interpretation: "..." },
    macd: { macd: 1200, signal: 1100, signalType: "bullish", ... },
    bollingerBands: { upper: 96000, middle: 95000, lower: 94000, ... },
    ema: { ema9: 94500, ema21: 94000, ema50: 93000, ema200: 90000, ... },
    stochastic: { k: 70, d: 65, signal: "neutral", ... },
    atr: { value: 1500, volatility: "medium", ... },
    adx: { value: 25, trend: "strong", ... },
    obv: { value: 1000000, trend: "bullish", ... },
    fibonacci: { levels: [...], currentLevel: "50%", ... },
    ichimoku: { signal: "bullish", cloud: "bullish", ... },
    volumeProfile: { poc: 95000, vah: 96000, val: 94000, ... }
  },
  
  // AI Interpretation
  aiInterpretation: {
    summary: "Technical indicators show predominantly bullish signals.",
    explanation: "...",
    tradingImplication: "Consider long positions...",
    confidence: 85,
    signals: {
      bullish: ["RSI oversold", "MACD bullish crossover"],
      bearish: [],
      neutral: ["Stochastic neutral"]
    }
  },
  
  // Multi-Timeframe Analysis
  multiTimeframe: {
    timeframes: {
      "15m": { signal: "buy", confidence: 75, ... },
      "1h": { signal: "buy", confidence: 80, ... },
      "4h": { signal: "neutral", confidence: 70, ... },
      "1d": { signal: "buy", confidence: 85, ... },
      "1w": { signal: "strong_buy", confidence: 90, ... }
    },
    overall: {
      signal: "buy",
      confidence: 82,
      agreement: 80,
      shortTerm: "buy",
      mediumTerm: "buy",
      longTerm: "strong_buy"
    }
  },
  
  // Support & Resistance
  supportResistance: {
    levels: [...],
    nearestSupport: { price: 94000, strength: "strong", confidence: 85 },
    nearestResistance: { price: 96000, strength: "moderate", confidence: 75 }
  },
  
  // Chart Patterns
  patterns: {
    patterns: [
      {
        name: "Bull Flag",
        signal: "bullish",
        confidence: 85,
        targetPrice: 98000,
        description: "..."
      }
    ],
    highConfidencePatterns: [...],
    summary: "..."
  },
  
  dataQuality: 95
}
```

---

## React Component Usage

### Basic Usage

```tsx
import TechnicalAnalysisPanel from '@/components/UCIE/TechnicalAnalysisPanel';

function MyPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ucie/technical/BTC')
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      });
  }, []);

  return (
    <TechnicalAnalysisPanel
      symbol="BTC"
      data={data}
      loading={loading}
    />
  );
}
```

### With Custom Hook

```tsx
import { useTechnicalAnalysis } from '@/hooks/useTechnicalAnalysis';

function MyPage() {
  const { data, loading, error } = useTechnicalAnalysis('BTC');

  if (error) return <div>Error: {error.message}</div>;

  return (
    <TechnicalAnalysisPanel
      symbol="BTC"
      data={data}
      loading={loading}
    />
  );
}
```

---

## Direct Library Usage

### Calculate Individual Indicators

```typescript
import {
  calculateRSI,
  calculateMACD,
  calculateEMAs,
  OHLCVData
} from '@/lib/ucie/technicalIndicators';

// Your OHLCV data
const data: OHLCVData[] = [
  { timestamp: 1234567890, open: 95000, high: 96000, low: 94000, close: 95500, volume: 1000 },
  // ... more data
];

// Calculate RSI
const rsi = calculateRSI(data);
console.log(rsi.value); // 65.5
console.log(rsi.signal); // "neutral"
console.log(rsi.interpretation); // "RSI at 65.5 is in neutral territory..."

// Calculate MACD
const macd = calculateMACD(data);
console.log(macd.macd); // 1200
console.log(macd.signal); // 1100
console.log(macd.signalType); // "bullish"

// Calculate EMAs
const ema = calculateEMAs(data);
console.log(ema.ema9); // 94500
console.log(ema.trend); // "bullish"
```

### AI Interpretation

```typescript
import { interpretTechnicalIndicators } from '@/lib/ucie/indicatorInterpretation';

const indicators = {
  rsi: calculateRSI(data),
  macd: calculateMACD(data),
  ema: calculateEMAs(data),
  // ... other indicators
};

const interpretation = await interpretTechnicalIndicators(
  'BTC',
  indicators,
  95000 // current price
);

console.log(interpretation.summary);
console.log(interpretation.confidence);
console.log(interpretation.signals.bullish);
```

### Multi-Timeframe Analysis

```typescript
import { performMultiTimeframeAnalysis } from '@/lib/ucie/multiTimeframeAnalysis';

const analysis = await performMultiTimeframeAnalysis('BTC');

console.log(analysis.overall.signal); // "buy"
console.log(analysis.overall.confidence); // 82
console.log(analysis.timeframes['1d'].signal); // "buy"
```

### Support/Resistance Detection

```typescript
import { detectSupportResistance } from '@/lib/ucie/supportResistance';

const sr = detectSupportResistance(data, 95000);

console.log(sr.nearestSupport?.price); // 94000
console.log(sr.nearestResistance?.price); // 96000
console.log(sr.levels.length); // 15
```

### Chart Pattern Recognition

```typescript
import { recognizeChartPatterns } from '@/lib/ucie/chartPatterns';

const patterns = recognizeChartPatterns(data);

console.log(patterns.patterns.length); // 3
console.log(patterns.highConfidencePatterns); // Patterns with >70% confidence
console.log(patterns.summary); // "3 chart pattern(s) detected..."
```

---

## Available Indicators

### Momentum Indicators
- **RSI** - Relative Strength Index (14 period)
- **Stochastic** - %K and %D oscillator
- **MACD** - Moving Average Convergence Divergence

### Trend Indicators
- **EMA** - Exponential Moving Averages (9, 21, 50, 200)
- **ADX** - Average Directional Index
- **Ichimoku Cloud** - Complete cloud analysis

### Volatility Indicators
- **Bollinger Bands** - 20 period, 2 std dev
- **ATR** - Average True Range

### Volume Indicators
- **OBV** - On-Balance Volume
- **Volume Profile** - POC, VAH, VAL

### Price Levels
- **Fibonacci** - Retracement levels
- **Support/Resistance** - Multiple detection methods

---

## Chart Patterns

### Reversal Patterns
- Head and Shoulders (82% accuracy)
- Inverse Head and Shoulders (83% accuracy)
- Double Top (79% accuracy)
- Double Bottom (81% accuracy)

### Continuation Patterns
- Ascending Triangle (84% accuracy)
- Descending Triangle (82% accuracy)
- Symmetrical Triangle (75% accuracy)
- Bull Flag (78% accuracy)
- Bear Flag (78% accuracy)
- Rising Wedge (76% accuracy)
- Falling Wedge (76% accuracy)

---

## Timeframes

- **15m** - 15-minute candles (short-term scalping)
- **1h** - 1-hour candles (intraday trading)
- **4h** - 4-hour candles (swing trading)
- **1d** - Daily candles (position trading)
- **1w** - Weekly candles (long-term investing)

---

## Signal Types

### Trading Signals
- `strong_buy` - Very bullish, high confidence
- `buy` - Bullish, moderate confidence
- `neutral` - No clear direction
- `sell` - Bearish, moderate confidence
- `strong_sell` - Very bearish, high confidence

### Indicator Signals
- `bullish` - Positive momentum
- `bearish` - Negative momentum
- `neutral` - No clear signal
- `overbought` - Price may correct down
- `oversold` - Price may bounce up

---

## Caching

The API endpoint caches responses for **1 minute** with stale-while-revalidate:

```typescript
// Cache headers
Cache-Control: public, s-maxage=60, stale-while-revalidate=120
```

This means:
- Fresh data for 60 seconds
- Stale data served for up to 120 seconds while revalidating
- Reduces API calls and improves performance

---

## Error Handling

```typescript
try {
  const response = await fetch('/api/ucie/technical/BTC');
  const data = await response.json();
  
  if (!data.success) {
    console.error('Analysis failed:', data.error);
    return;
  }
  
  // Use data
  console.log(data.aiInterpretation.summary);
} catch (error) {
  console.error('Network error:', error);
}
```

---

## Data Requirements

### Minimum Requirements
- **50+ candles** for basic analysis
- **100+ candles** for reliable patterns
- **200+ candles** for optimal accuracy

### Data Sources
1. **Binance** (primary) - Most reliable OHLCV data
2. **CoinGecko** (fallback) - Good coverage but no volume

---

## Performance Tips

### 1. Use Caching
```typescript
// Cache responses client-side
const cache = new Map();

async function getCachedAnalysis(symbol: string) {
  if (cache.has(symbol)) {
    const { data, timestamp } = cache.get(symbol);
    if (Date.now() - timestamp < 60000) { // 1 minute
      return data;
    }
  }
  
  const response = await fetch(`/api/ucie/technical/${symbol}`);
  const data = await response.json();
  
  cache.set(symbol, { data, timestamp: Date.now() });
  return data;
}
```

### 2. Parallel Requests
```typescript
// Fetch multiple symbols in parallel
const symbols = ['BTC', 'ETH', 'SOL'];
const analyses = await Promise.all(
  symbols.map(symbol => fetch(`/api/ucie/technical/${symbol}`).then(r => r.json()))
);
```

### 3. Progressive Loading
```typescript
// Show cached data immediately, update in background
const [data, setData] = useState(cachedData);

useEffect(() => {
  fetch('/api/ucie/technical/BTC')
    .then(r => r.json())
    .then(newData => setData(newData));
}, []);
```

---

## Troubleshooting

### "Insufficient historical data"
- Symbol may not be available on Binance or CoinGecko
- Try a more popular token (BTC, ETH, etc.)

### "Failed to fetch historical data"
- Check network connection
- Verify symbol is correct (use uppercase)
- API rate limits may be hit

### Low data quality score
- Insufficient candles (< 100)
- Missing volume data
- Failed timeframe analyses

---

## Examples

### Example 1: Simple Analysis Display

```tsx
function SimpleAnalysis({ symbol }: { symbol: string }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`/api/ucie/technical/${symbol}`)
      .then(r => r.json())
      .then(setData);
  }, [symbol]);

  if (!data) return <div>Loading...</div>;

  return (
    <div>
      <h2>{symbol} Technical Analysis</h2>
      <p>Signal: {data.multiTimeframe.overall.signal}</p>
      <p>Confidence: {data.multiTimeframe.overall.confidence}%</p>
      <p>RSI: {data.indicators.rsi.value}</p>
      <p>AI Summary: {data.aiInterpretation.summary}</p>
    </div>
  );
}
```

### Example 2: Trading Dashboard

```tsx
function TradingDashboard() {
  const symbols = ['BTC', 'ETH', 'SOL', 'ADA'];
  const [analyses, setAnalyses] = useState({});

  useEffect(() => {
    Promise.all(
      symbols.map(symbol =>
        fetch(`/api/ucie/technical/${symbol}`)
          .then(r => r.json())
          .then(data => ({ symbol, data }))
      )
    ).then(results => {
      const analysisMap = {};
      results.forEach(({ symbol, data }) => {
        analysisMap[symbol] = data;
      });
      setAnalyses(analysisMap);
    });
  }, []);

  return (
    <div className="grid grid-cols-2 gap-4">
      {symbols.map(symbol => (
        <div key={symbol} className="bitcoin-block">
          <h3>{symbol}</h3>
          {analyses[symbol] && (
            <>
              <p>Signal: {analyses[symbol].multiTimeframe.overall.signal}</p>
              <p>Price: ${analyses[symbol].currentPrice}</p>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## Support

For issues or questions:
1. Check the complete documentation: `UCIE-TECHNICAL-ANALYSIS-COMPLETE.md`
2. Review the spec: `.kiro/specs/universal-crypto-intelligence/`
3. Check TypeScript types in the library files

---

**Quick Start Guide Version**: 1.0  
**Last Updated**: January 27, 2025  
**Status**: Production Ready ✅
