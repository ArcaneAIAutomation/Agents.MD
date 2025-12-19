# UCIE - Universal Crypto Intelligence Engine

**Last Updated**: December 19, 2025  
**Status**: ⚠️ Partial (Data Collection ✅, GPT Analysis ⚠️ Under Investigation)  
**Priority**: CRITICAL  
**Dependencies**: OpenAI API, Supabase Database, 13+ External APIs

---

## Overview

The Universal Crypto Intelligence Engine (UCIE) is a comprehensive cryptocurrency data aggregation and AI analysis platform. It collects real-time data from 13+ APIs, stores it in Supabase with quality scoring, and provides AI-powered analysis through GPT-5.1 and Caesar AI.

### Key Capabilities
- **Data Aggregation**: Collects from market, sentiment, technical, news, and on-chain sources
- **Quality Scoring**: Each data source is scored for completeness and freshness
- **AI Analysis**: Modular GPT-5.1 analysis with 9 separate analysis modules
- **Caesar Research**: Deep 15-20 minute research with citations (manual opt-in)

---

## Architecture

### 3-Phase Flow

```
Phase 1: Data Collection (60-120s)
├── Market Data (CoinGecko, CoinMarketCap, Kraken)
├── Sentiment (Fear & Greed, LunarCrush, CMC, CoinGecko, Reddit)
├── Technical (RSI, MACD, EMA, Bollinger Bands)
├── News (NewsAPI, CryptoCompare)
└── On-Chain (Etherscan/Blockchain.com)
    ↓
Phase 2: GPT-5.1 Analysis (60-100s) - AUTO-STARTS
├── Market Analysis
├── Technical Analysis
├── Sentiment Analysis
├── News Analysis
└── Executive Summary
    ↓
Phase 3: Caesar Research (15-20 min) - MANUAL START
├── Deep research with 15+ sources
├── Technology, team, partnerships analysis
├── Risk and opportunity identification
└── Comprehensive report with citations
```

### Data Flow

```
User Request → API Endpoint → Check DB Cache
                                    ↓
                    [Cache Hit] → Return cached data (<1s)
                                    ↓
                    [Cache Miss] → Fetch from external API
                                    ↓
                              Store in DB Cache
                                    ↓
                              Return fresh data
```

---

## API Endpoints

### Data Collection Endpoints (Phase 1)

| Endpoint | Purpose | TTL | Sources |
|----------|---------|-----|---------|
| `/api/ucie/market-data/[symbol]` | Price, volume, market cap | 5 min | CoinGecko, CMC, Kraken |
| `/api/ucie/sentiment/[symbol]` | Social sentiment | 5 min | LunarCrush, Twitter, Reddit |
| `/api/ucie/news/[symbol]` | News articles | 5 min | NewsAPI, CryptoCompare |
| `/api/ucie/technical/[symbol]` | Technical indicators | 1 min | Calculated |
| `/api/ucie/on-chain/[symbol]` | Blockchain data | 5 min | Etherscan, Blockchain.com |
| `/api/ucie/risk/[symbol]` | Risk assessment | 1 hour | Calculated |
| `/api/ucie/predictions/[symbol]` | Price predictions | 1 hour | Calculated |
| `/api/ucie/derivatives/[symbol]` | Derivatives data | 5 min | CoinGlass, Binance |
| `/api/ucie/defi/[symbol]` | DeFi metrics | 1 hour | DeFiLlama |

### AI Analysis Endpoints (Phase 2-3)

| Endpoint | Purpose | Timeout |
|----------|---------|---------|
| `/api/ucie/preview-data/[symbol]` | Aggregated preview data | 15 min |
| `/api/ucie/openai-summary-start/[symbol]` | Start GPT-5.1 analysis | 10 min |
| `/api/ucie/openai-summary-poll/[jobId]` | Poll analysis status | 10 min |
| `/api/ucie/research/[symbol]` | Caesar AI research | 25 min |

---

## Database Schema

### Tables

```sql
-- Cached analysis results
ucie_analysis_cache (
  id, symbol, analysis_type, data, quality_score,
  created_at, expires_at, user_id
)

-- Session-based phase data
ucie_phase_data (
  id, session_id, symbol, phase, data,
  created_at, expires_at
)

-- OpenAI job tracking
ucie_openai_jobs (
  id, symbol, status, result, error,
  created_at, updated_at, user_id
)

-- User watchlists
ucie_watchlist (id, user_id, symbol, created_at)

-- User alerts
ucie_alerts (id, user_id, symbol, condition, created_at)
```

---

## Key Components

### Frontend Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `DataPreviewModal.tsx` | `components/UCIE/` | Main UCIE interface |
| `CaesarAnalysisContainer.tsx` | `components/UCIE/` | Caesar research UI |
| `ModularAnalysisDisplay.tsx` | `components/UCIE/` | GPT analysis display |

### Backend Utilities

| Utility | Location | Purpose |
|---------|----------|---------|
| `cacheUtils.ts` | `lib/ucie/` | Database cache operations |
| `contextAggregator.ts` | `lib/ucie/` | Context aggregation for AI |
| `db.ts` | `lib/` | PostgreSQL connection pool |

---

## Configuration

### Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-...
DATABASE_URL=postgres://...

# Data Sources
COINMARKETCAP_API_KEY=...
COINGECKO_API_KEY=...
LUNARCRUSH_API_KEY=...
NEWS_API_KEY=...
ETHERSCAN_API_KEY=...

# Optional
OPENAI_MODEL=gpt-5-mini  # Default model
```

### Vercel Timeouts

```json
{
  "functions": {
    "pages/api/ucie/research/**": { "maxDuration": 1500 },
    "pages/api/ucie/preview-data/**": { "maxDuration": 900 },
    "pages/api/ucie/**": { "maxDuration": 600 }
  }
}
```

---

## Current Status

### ✅ Working (90%)
- Data collection from 13+ APIs
- Database caching with TTL
- Quality scoring system
- Sentiment API (40-100% quality)
- On-Chain API (60-100% quality)
- Context aggregation
- Frontend UI components

### ⚠️ Under Investigation
- GPT-5.1 analysis pipeline (may have stuck jobs)
- Polling mechanism reliability
- Database job status updates

### ❌ Blocked Features
- ATGE (depends on UCIE)
- Einstein (depends on ATGE)

---

## Troubleshooting

### Common Issues

**1. GPT Analysis Not Starting**
- Check `ucie_openai_jobs` table for stuck jobs
- Verify OpenAI API key has credits
- Check Vercel function logs

**2. Low Data Quality Score**
- Individual API may be failing
- Check rate limits on external APIs
- Verify API keys are configured

**3. Slow Response Times**
- Check database connection latency
- Verify cache is being used
- Check for sequential vs parallel fetching

### Debug Commands

```bash
# Test database connection
npx tsx scripts/test-database-access.ts

# Verify cache storage
npx tsx scripts/verify-database-storage.ts

# Check context aggregation
npx tsx -e "
import { getComprehensiveContext } from './lib/ucie/contextAggregator';
const ctx = await getComprehensiveContext('BTC');
console.log('Quality:', ctx.dataQuality);
"
```

---

## Critical Rules

### Rule #1: AI Analysis Happens LAST
Never call AI before all data is cached in the database.

### Rule #2: Database is Source of Truth
All data must be stored in Supabase. No in-memory caching.

### Rule #3: Use Utility Functions
Always use `getCachedAnalysis()` and `setCachedAnalysis()`.

### Rule #4: Check Data Quality
Minimum 70% quality required before AI analysis.

---

## Related Documentation

- **Steering**: `.kiro/steering/ucie-system.md`
- **OpenAI Integration**: `.kiro/steering/openai-integration.md`
- **API Status**: `.kiro/steering/api-status.md`
- **Spec**: `.kiro/specs/project-restructure/`

---

## Next Steps

1. **Investigate GPT Analysis** - Check for stuck jobs, verify polling
2. **Update Steering Docs** - Reflect actual model (`gpt-5-mini`)
3. **Unblock ATGE** - Once UCIE is stable
4. **Unblock Einstein** - Once ATGE is stable

---

**Owner**: Development Team  
**Review Cycle**: Weekly  
**Last Verified**: December 19, 2025
