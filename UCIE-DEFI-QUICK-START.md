# UCIE DeFi Integration - Quick Start Guide

## Overview

This guide will help you quickly integrate and use the DeFi metrics functionality in the Universal Crypto Intelligence Engine (UCIE).

---

## Quick Setup

### 1. API Endpoint Usage

The DeFi metrics API is ready to use immediately:

```typescript
// Fetch DeFi metrics for any token
const response = await fetch('/api/ucie/defi/UNI');
const { success, data } = await response.json();

if (success && data.isDeFiProtocol) {
  console.log('TVL:', data.tvlAnalysis.currentTVL);
  console.log('Revenue:', data.revenueAnalysis.current.revenue24h);
  console.log('Utility Score:', data.utilityAnalysis.utilityScore);
  console.log('Dev Health:', data.developmentAnalysis.metrics.healthScore);
  console.log('Rank:', data.peerComparison.metrics.overall.rank);
}
```

### 2. Component Usage

Add the DeFiMetricsPanel to your analysis page:

```tsx
import DeFiMetricsPanel from '../components/UCIE/DeFiMetricsPanel';

function TokenAnalysis({ symbol }) {
  const [defiData, setDefiData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/ucie/defi/${symbol}`)
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setDefiData(result.data);
        }
        setLoading(false);
      });
  }, [symbol]);

  return (
    <DeFiMetricsPanel
      symbol={symbol}
      tvlAnalysis={defiData?.tvlAnalysis}
      revenueAnalysis={defiData?.revenueAnalysis}
      utilityAnalysis={defiData?.utilityAnalysis}
      developmentAnalysis={defiData?.developmentAnalysis}
      peerComparison={defiData?.peerComparison}
      loading={loading}
    />
  );
}
```

---

## Testing

### Test with Popular DeFi Protocols

```bash
# Uniswap
curl http://localhost:3000/api/ucie/defi/UNI

# Aave
curl http://localhost:3000/api/ucie/defi/AAVE

# Compound
curl http://localhost:3000/api/ucie/defi/COMP

# MakerDAO
curl http://localhost:3000/api/ucie/defi/MKR

# Curve
curl http://localhost:3000/api/ucie/defi/CRV
```

### Expected Response

```json
{
  "success": true,
  "data": {
    "isDeFiProtocol": true,
    "tvlAnalysis": {
      "currentTVL": 5200000000,
      "tvlChange7d": 3.5,
      "tvlTrend": "increasing",
      "tvlCategory": "mega"
    },
    "revenueAnalysis": {
      "current": {
        "revenue24h": 1200000,
        "holderValueCapture": 70
      },
      "projection": {
        "annualizedRevenue": 438000000
      }
    },
    "utilityAnalysis": {
      "utilityScore": 85,
      "utilityCategory": "strong"
    },
    "developmentAnalysis": {
      "metrics": {
        "commits30d": 142,
        "activeDevelopers": 23,
        "healthScore": 88
      }
    },
    "peerComparison": {
      "metrics": {
        "overall": {
          "rank": 3,
          "percentile": 85
        }
      }
    },
    "summary": "UNI is a DeFi protocol with $5.20B in Total Value Locked...",
    "dataQuality": 85,
    "timestamp": "2025-11-02T12:00:00Z"
  }
}
```

---

## Common Use Cases

### 1. Display TVL Trends

```tsx
function TVLDisplay({ tvlAnalysis }) {
  if (!tvlAnalysis) return null;

  return (
    <div>
      <h3>Total Value Locked</h3>
      <p className="text-4xl font-bold text-bitcoin-orange">
        {formatTVL(tvlAnalysis.currentTVL)}
      </p>
      <p className={tvlAnalysis.tvlChange7d >= 0 ? 'text-green' : 'text-red'}>
        {tvlAnalysis.tvlChange7d >= 0 ? '+' : ''}
        {tvlAnalysis.tvlChange7d.toFixed(2)}% (7d)
      </p>
    </div>
  );
}
```

### 2. Show Revenue Metrics

```tsx
function RevenueDisplay({ revenueAnalysis }) {
  if (!revenueAnalysis) return null;

  return (
    <div>
      <h3>Protocol Revenue</h3>
      <p>Daily: {formatRevenue(revenueAnalysis.current.revenue24h)}</p>
      <p>Annual: {formatRevenue(revenueAnalysis.projection.annualizedRevenue)}</p>
      <p>Holder Capture: {revenueAnalysis.current.holderValueCapture.toFixed(1)}%</p>
    </div>
  );
}
```

### 3. Display Utility Score

```tsx
function UtilityDisplay({ utilityAnalysis }) {
  if (!utilityAnalysis) return null;

  return (
    <div>
      <h3>Token Utility</h3>
      <div className="flex items-center gap-2">
        <div className="text-3xl font-bold text-bitcoin-orange">
          {utilityAnalysis.utilityScore}/100
        </div>
        <div className="text-sm text-bitcoin-white-60">
          {utilityAnalysis.utilityCategory}
        </div>
      </div>
      <ul>
        {utilityAnalysis.useCases.filter(uc => uc.active).map((uc, i) => (
          <li key={i}>{uc.description}</li>
        ))}
      </ul>
    </div>
  );
}
```

### 4. Show Development Activity

```tsx
function DevelopmentDisplay({ developmentAnalysis }) {
  if (!developmentAnalysis) return null;

  const { metrics } = developmentAnalysis;

  return (
    <div>
      <h3>Development Activity</h3>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-bitcoin-white-60">Commits (30d)</p>
          <p className="text-2xl font-bold">{metrics.commits30d}</p>
        </div>
        <div>
          <p className="text-sm text-bitcoin-white-60">Active Devs</p>
          <p className="text-2xl font-bold">{metrics.activeDevelopers}</p>
        </div>
        <div>
          <p className="text-sm text-bitcoin-white-60">Health Score</p>
          <p className="text-2xl font-bold">{metrics.healthScore}/100</p>
        </div>
      </div>
    </div>
  );
}
```

### 5. Display Peer Ranking

```tsx
function PeerRankingDisplay({ peerComparison }) {
  if (!peerComparison) return null;

  const { metrics } = peerComparison;

  return (
    <div>
      <h3>Peer Comparison</h3>
      <div className="text-center">
        <p className="text-5xl font-bold text-bitcoin-orange">
          #{metrics.overall.rank}
        </p>
        <p className="text-sm text-bitcoin-white-60">
          {metrics.overall.percentile}th percentile
        </p>
        <p className="text-sm text-bitcoin-white-80">
          {metrics.overall.category.replace('_', ' ')}
        </p>
      </div>
    </div>
  );
}
```

---

## Utility Functions

### Format TVL

```typescript
function formatTVL(tvl: number): string {
  if (tvl >= 1_000_000_000) {
    return `$${(tvl / 1_000_000_000).toFixed(2)}B`;
  } else if (tvl >= 1_000_000) {
    return `$${(tvl / 1_000_000).toFixed(2)}M`;
  } else if (tvl >= 1_000) {
    return `$${(tvl / 1_000).toFixed(2)}K`;
  } else {
    return `$${tvl.toFixed(2)}`;
  }
}
```

### Format Revenue

```typescript
function formatRevenue(revenue: number): string {
  if (revenue >= 1_000_000) {
    return `$${(revenue / 1_000_000).toFixed(2)}M`;
  } else if (revenue >= 1_000) {
    return `$${(revenue / 1_000).toFixed(2)}K`;
  } else {
    return `$${revenue.toFixed(2)}`;
  }
}
```

---

## Advanced Usage

### Custom Hook for DeFi Data

```typescript
import { useState, useEffect } from 'react';

export function useDeFiMetrics(symbol: string) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!symbol) return;

    setLoading(true);
    fetch(`/api/ucie/defi/${symbol}`)
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [symbol]);

  return { data, loading, error };
}

// Usage
function MyComponent({ symbol }) {
  const { data, loading, error } = useDeFiMetrics(symbol);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data?.isDeFiProtocol) return <div>Not a DeFi protocol</div>;

  return <DeFiMetricsPanel {...data} />;
}
```

### Batch Fetch Multiple Protocols

```typescript
async function fetchMultipleDeFiProtocols(symbols: string[]) {
  const promises = symbols.map(symbol =>
    fetch(`/api/ucie/defi/${symbol}`).then(res => res.json())
  );

  const results = await Promise.allSettled(promises);
  
  return results
    .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
    .map(r => r.value.data)
    .filter(d => d?.isDeFiProtocol);
}

// Usage
const defiProtocols = await fetchMultipleDeFiProtocols(['UNI', 'AAVE', 'COMP']);
```

---

## Troubleshooting

### Issue: "Not a DeFi protocol"

**Solution**: The token may not be in DeFiLlama's database. Check:
1. Token symbol is correct
2. Protocol is actually a DeFi protocol
3. Protocol has TVL data available

### Issue: Low data quality score

**Solution**: Some data sources may be unavailable. This is normal for:
- New protocols
- Protocols without GitHub repos
- Protocols not on major chains

### Issue: Slow API response

**Solution**: 
1. First request takes 2-5 seconds (fetching from multiple APIs)
2. Subsequent requests are cached (< 50ms)
3. Cache expires after 1 hour

---

## Best Practices

### 1. Check Protocol Status First

```typescript
const response = await fetch(`/api/ucie/defi/${symbol}`);
const { data } = await response.json();

if (!data.isDeFiProtocol) {
  // Show "Not a DeFi protocol" message
  return;
}

// Proceed with DeFi analysis
```

### 2. Handle Missing Data Gracefully

```typescript
<DeFiMetricsPanel
  symbol={symbol}
  tvlAnalysis={data?.tvlAnalysis || null}
  revenueAnalysis={data?.revenueAnalysis || null}
  utilityAnalysis={data?.utilityAnalysis || null}
  developmentAnalysis={data?.developmentAnalysis || null}
  peerComparison={data?.peerComparison || null}
  loading={loading}
  error={error}
/>
```

### 3. Show Data Quality

```typescript
{data.dataQuality < 50 && (
  <div className="text-bitcoin-white-60 text-sm">
    ⚠️ Limited data available (quality: {data.dataQuality}%)
  </div>
)}
```

### 4. Cache Awareness

```typescript
// Show cache status
{cached && (
  <div className="text-bitcoin-white-60 text-xs">
    Cached data (refreshes hourly)
  </div>
)}
```

---

## Integration Checklist

- [ ] API endpoint accessible at `/api/ucie/defi/[symbol]`
- [ ] DeFiMetricsPanel component imported
- [ ] Bitcoin Sovereign styling applied
- [ ] Loading states implemented
- [ ] Error handling in place
- [ ] Mobile responsive design tested
- [ ] Cache working correctly
- [ ] Data quality displayed
- [ ] Tested with multiple protocols

---

## Support

For issues or questions:
1. Check the main documentation: `UCIE-DEFI-INTEGRATION-COMPLETE.md`
2. Review the design document: `.kiro/specs/universal-crypto-intelligence/design.md`
3. Check requirements: `.kiro/specs/universal-crypto-intelligence/requirements.md`

---

**Status**: ✅ Ready to use  
**Version**: 1.0.0  
**Last Updated**: November 2, 2025

Happy analyzing! 🚀
