# UCIE Derivatives Integration - Quick Start Guide

## 🚀 Quick Start

### 1. Test the API Endpoint

```bash
# Start the development server
npm run dev

# Test the derivatives endpoint (in another terminal)
curl http://localhost:3000/api/ucie/derivatives/BTC
```

**Expected Response**:
```json
{
  "success": true,
  "symbol": "BTC",
  "fundingAnalysis": { ... },
  "openInterestAnalysis": { ... },
  "liquidationAnalysis": { ... },
  "longShortAnalysis": { ... },
  "overallRisk": "moderate",
  "dataQuality": 85,
  "sources": ["Funding Rates", "Binance", "Bybit", ...],
  "cached": false,
  "timestamp": "2025-01-27T..."
}
```

### 2. Use in Your React Component

```tsx
import { useState, useEffect } from 'react';
import DerivativesPanel from '@/components/UCIE/DerivativesPanel';

function MyAnalysisPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ucie/derivatives/BTC')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setData(data);
        }
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading derivatives data...</div>;
  if (!data) return <div>No data available</div>;

  return (
    <DerivativesPanel
      symbol={data.symbol}
      fundingAnalysis={data.fundingAnalysis}
      openInterestAnalysis={data.openInterestAnalysis}
      liquidationAnalysis={data.liquidationAnalysis}
      longShortAnalysis={data.longShortAnalysis}
    />
  );
}
```

### 3. Test Different Symbols

```bash
# Bitcoin
curl http://localhost:3000/api/ucie/derivatives/BTC

# Ethereum
curl http://localhost:3000/api/ucie/derivatives/ETH

# Solana
curl http://localhost:3000/api/ucie/derivatives/SOL
```

## 📊 What You Get

### Funding Rate Analysis
- Current funding rates from 5+ exchanges
- Extreme rate detection (>0.1% or <-0.1%)
- Mean reversion trading opportunities
- Market sentiment (bullish/bearish/neutral)
- Risk level assessment

### Open Interest Tracking
- Total open interest across exchanges
- 24h, 7d, 30d change percentages
- Unusual spike detection (>15% change)
- Exchange-by-exchange breakdown
- Market signal generation

### Liquidation Detection
- 24h liquidation totals
- Liquidation clusters by price level
- Cascade liquidation risk estimation
- Probability scoring
- Chain reaction detection

### Long/Short Ratio Analysis
- Aggregated long/short positioning
- Extreme positioning detection (>70% or <30%)
- Contrarian trading signals
- Entry/exit level recommendations
- Risk/reward calculations

## 🎨 UI Features

The `DerivativesPanel` component provides:

- **4 Tabs**: Funding, Open Interest, Liquidations, Long/Short
- **Risk Alerts**: Automatic warnings for extreme conditions
- **Color Coding**: Orange for bullish, white for bearish
- **Mobile Responsive**: Works on all screen sizes
- **Bitcoin Sovereign Styling**: Black, orange, white theme

## 🔧 Configuration

### Optional: Add CoinGlass API Key

For higher rate limits, add to `.env.local`:

```bash
COINGLASS_API_KEY=your_api_key_here
```

**Note**: Works without API key, but may have lower rate limits.

## 📝 Key Files

```
lib/ucie/
├── derivativesClients.ts          # Fetch data from exchanges
├── fundingRateAnalysis.ts         # Analyze funding rates
├── openInterestTracking.ts        # Track open interest
├── liquidationDetection.ts        # Detect liquidations
├── longShortAnalysis.ts           # Analyze positioning
└── DERIVATIVES-README.md          # Full documentation

components/UCIE/
└── DerivativesPanel.tsx           # UI component

pages/api/ucie/derivatives/
└── [symbol].ts                    # API endpoint
```

## 🐛 Troubleshooting

### No Data Returned
```bash
# Check if symbol is valid
curl http://localhost:3000/api/ucie/derivatives/INVALID
# Should return 404 with error message
```

### Low Data Quality
- Some exchanges may be temporarily down
- Symbol may not be available on all exchanges
- Check console logs for specific errors

### Slow Response
- First request may be slower (no cache)
- Subsequent requests use 5-minute cache
- Check network connectivity

## 📚 Learn More

- **Full Documentation**: `lib/ucie/DERIVATIVES-README.md`
- **Implementation Summary**: `UCIE-DERIVATIVES-INTEGRATION-COMPLETE.md`
- **UCIE Spec**: `.kiro/specs/universal-crypto-intelligence/`

## ✅ Verification Checklist

- [ ] API endpoint returns 200 OK for BTC
- [ ] Response includes all 4 analysis types
- [ ] Data quality score > 0
- [ ] Component renders without errors
- [ ] Tabs switch correctly
- [ ] Risk alerts display when appropriate
- [ ] Mobile layout works (test at 375px width)

## 🎯 Next Steps

1. **Test with Multiple Symbols**: BTC, ETH, SOL, AVAX, etc.
2. **Integrate into UCIE**: Add to main analysis page
3. **Customize Alerts**: Adjust thresholds for your use case
4. **Add Historical Data**: Store trends over time
5. **Enable Real-Time Updates**: Add WebSocket support

## 💡 Pro Tips

1. **Cache is Your Friend**: 5-minute cache reduces API calls
2. **Check Data Quality**: Score indicates completeness
3. **Watch for Extremes**: Orange alerts = high risk/opportunity
4. **Use Contrarian Signals**: When crowd is wrong, opportunity exists
5. **Monitor Cascades**: Liquidation cascades can move markets

---

**Status**: ✅ Ready to Use
**Version**: 1.0.0
**Last Updated**: January 2025

**Happy Trading! 🚀**
