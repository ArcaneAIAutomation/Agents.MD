# Quantum BTC Feature Documentation

**Last Updated**: December 19, 2025  
**Status**: ✅ Production Ready  
**Priority**: HIGH  
**Dependencies**: Multiple APIs, Supabase PostgreSQL

---

## Overview

Quantum BTC is an advanced Bitcoin trading intelligence system that combines multiple data sources, AI analysis, and sophisticated trade verification to provide institutional-grade trading insights.

---

## Features

### Core Capabilities
- **Multi-Source Data Pipeline**: Aggregates data from 13+ APIs
- **Trade Verification**: Validates trade signals against historical data
- **Performance Monitoring**: Tracks trade accuracy and performance
- **AI-Powered Analysis**: GPT-5.1 enhanced market analysis
- **Historical Price Queries**: Access to historical price data for backtesting

### Advanced Features
- HQVE (High-Quality Verification Engine)
- QDPP (Quantum Data Processing Pipeline)
- QSIC (Quantum Signal Intelligence Core)
- QSTGE (Quantum Superior Trade Generation Engine)

---

## Technical Architecture

### API Endpoints

```typescript
// Trade details
GET /api/quantum/trade-details/[tradeId]
// Returns: { trade, verification, performance }

// Historical prices
GET /api/quantum/historical-prices
// Query: { symbol, startDate, endDate, interval }
// Returns: { prices: PricePoint[], metadata }

// Performance metrics
GET /api/quantum/performance
// Returns: { accuracy, totalTrades, profitFactor, sharpeRatio }

// Trade verification
POST /api/quantum/verify-trade
// Body: { tradeId, entryPrice, exitPrice, direction }
// Returns: { verified, confidence, reasoning }
```

### Database Schema

```sql
-- Quantum trades table
quantum_trades (
  id UUID PRIMARY KEY,
  symbol VARCHAR(10),
  direction VARCHAR(10),
  entry_price DECIMAL,
  target_prices JSONB,
  stop_loss DECIMAL,
  confidence DECIMAL,
  status VARCHAR(20),
  created_at TIMESTAMP,
  verified_at TIMESTAMP,
  verification_result JSONB
)

-- Historical prices table
quantum_historical_prices (
  id UUID PRIMARY KEY,
  symbol VARCHAR(10),
  timestamp TIMESTAMP,
  open DECIMAL,
  high DECIMAL,
  low DECIMAL,
  close DECIMAL,
  volume DECIMAL,
  source VARCHAR(50)
)

-- Performance metrics table
quantum_performance (
  id UUID PRIMARY KEY,
  period VARCHAR(20),
  total_trades INTEGER,
  winning_trades INTEGER,
  accuracy DECIMAL,
  profit_factor DECIMAL,
  sharpe_ratio DECIMAL,
  calculated_at TIMESTAMP
)
```

### Data Flow

```
1. Market data collected from multiple sources
   ↓
2. Data validated and normalized
   ↓
3. Technical indicators calculated
   ↓
4. AI analysis performed (GPT-5.1)
   ↓
5. Trade signals generated
   ↓
6. Signals verified against historical data
   ↓
7. Performance tracked and reported
```

---

## Configuration

### Environment Variables

```bash
# Required APIs
COINMARKETCAP_API_KEY=your_cmc_key
COINGECKO_API_KEY=your_coingecko_key
OPENAI_API_KEY=your_openai_key

# Database
DATABASE_URL=postgres://user:pass@host:6543/postgres

# Optional
QUANTUM_VERIFICATION_THRESHOLD=0.8
QUANTUM_MAX_TRADES_PER_DAY=10
```

### Vercel Configuration

```json
{
  "functions": {
    "pages/api/quantum/**/*.ts": {
      "maxDuration": 60,
      "memory": 1024
    }
  }
}
```

---

## Components

### Key Files

```
pages/api/quantum/
├── trade-details/[tradeId].ts   # Trade details endpoint
├── historical-prices.ts          # Historical price queries
├── performance.ts                # Performance metrics
├── verify-trade.ts               # Trade verification
└── generate-signal.ts            # Signal generation

lib/quantum/
├── dataProcessor.ts              # Data processing pipeline
├── signalGenerator.ts            # Signal generation logic
├── verificationEngine.ts         # Trade verification
└── performanceTracker.ts         # Performance tracking
```

---

## Trade Verification

### Verification Process

```typescript
interface TradeVerification {
  tradeId: string;
  verified: boolean;
  confidence: number;
  reasoning: string;
  historicalComparison: {
    similarTrades: number;
    successRate: number;
    averageReturn: number;
  };
  riskAssessment: {
    riskLevel: 'low' | 'medium' | 'high';
    maxDrawdown: number;
    volatilityScore: number;
  };
}
```

### Verification Criteria

1. **Price Validity**: Entry/exit prices within reasonable range
2. **Historical Comparison**: Similar trades in past 90 days
3. **Risk Assessment**: Drawdown and volatility analysis
4. **Market Conditions**: Current market state alignment

---

## Performance Metrics

### Tracked Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| Accuracy | % of profitable trades | > 60% |
| Profit Factor | Gross profit / Gross loss | > 1.5 |
| Sharpe Ratio | Risk-adjusted return | > 1.0 |
| Max Drawdown | Largest peak-to-trough decline | < 20% |
| Win Rate | Winning trades / Total trades | > 55% |

### Performance Calculation

```typescript
const calculatePerformance = (trades: Trade[]): Performance => {
  const winningTrades = trades.filter(t => t.profit > 0);
  const losingTrades = trades.filter(t => t.profit <= 0);
  
  const grossProfit = winningTrades.reduce((sum, t) => sum + t.profit, 0);
  const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.profit, 0));
  
  return {
    accuracy: (winningTrades.length / trades.length) * 100,
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit,
    totalTrades: trades.length,
    winningTrades: winningTrades.length,
    // ... other metrics
  };
};
```

---

## Error Handling

### Error States

```typescript
// Insufficient data
{ error: 'insufficient_data', message: 'Not enough historical data' }

// Verification failed
{ error: 'verification_failed', message: 'Trade could not be verified' }

// API failure
{ error: 'api_failure', source: 'coingecko', fallback: 'coinmarketcap' }
```

---

## Troubleshooting

### Common Issues

**Issue**: Trade verification failing
- Check historical data availability
- Verify database connection
- Check verification threshold settings

**Issue**: Performance metrics not updating
- Check cron job is running
- Verify database write permissions
- Check for calculation errors in logs

**Issue**: Slow response times
- Check database query optimization
- Verify indexes are in place
- Check API response times

### Debug Commands

```bash
# Test trade details
curl https://your-domain.com/api/quantum/trade-details/[tradeId]

# Test performance endpoint
curl https://your-domain.com/api/quantum/performance

# Test historical prices
curl "https://your-domain.com/api/quantum/historical-prices?symbol=BTC&days=30"
```

---

## Related Documentation

- **Spec**: `.kiro/specs/quantum-btc-super-spec/`
- **Migration Guide**: `docs/QUANTUM-BTC-MIGRATION-COMPLETE-GUIDE.md`
- **Deployment**: `QUANTUM-BTC-DEPLOYMENT-SUCCESS.md`
