# UCIE Data Flow

**Last Updated**: December 19, 2025  
**Status**: Production  
**Total Duration**: 17-22 minutes (with Caesar)

---

## Overview

The UCIE (Universal Crypto Intelligence Engine) data flow consists of three phases:
1. **Data Collection** (60-120s) - Parallel API fetching
2. **GPT Analysis** (60-100s) - Modular AI analysis
3. **Caesar Research** (15-20min) - Deep research (optional)

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER INITIATES UCIE                          │
│                    (Enter symbol, click "Get Preview")           │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PHASE 1: DATA COLLECTION                      │
│                         (60-120 seconds)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ Market   │  │Sentiment │  │Technical │  │  News    │        │
│  │  Data    │  │  Data    │  │  Data    │  │  Data    │        │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │
│       │             │             │             │               │
│       │    ┌────────┴─────────────┴─────────────┘               │
│       │    │                                                    │
│       ▼    ▼                                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              SUPABASE DATABASE CACHE                     │   │
│  │         (ucie_analysis_cache table, 30min TTL)          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Data Sources:                                                   │
│  • Market: CoinGecko, CoinMarketCap, Kraken                     │
│  • Sentiment: Fear & Greed, LunarCrush, CMC, Reddit             │
│  • Technical: RSI, MACD, EMA, Bollinger (calculated)            │
│  • News: NewsAPI, CryptoCompare                                 │
│  • On-Chain: Etherscan, Blockchain.com                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ Data Quality Check (≥70%)
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   PHASE 2: GPT-5.1 ANALYSIS                      │
│                      (60-100 seconds)                            │
│                      AUTO-STARTS                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Create job: POST /api/ucie/openai-summary-start/[symbol]    │
│                                                                  │
│  2. Job processes 9 modular analyses:                           │
│     ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│     │ Market  │ │Technical│ │Sentiment│ │  News   │            │
│     │Analysis │ │Analysis │ │Analysis │ │Analysis │            │
│     └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘            │
│          │           │           │           │                  │
│          └───────────┴───────────┴───────────┘                  │
│                          │                                      │
│                          ▼                                      │
│     ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│     │On-Chain │ │  Risk   │ │Predict- │ │  DeFi   │            │
│     │Analysis │ │Analysis │ │  ions   │ │Analysis │            │
│     └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘            │
│          │           │           │           │                  │
│          └───────────┴───────────┴───────────┘                  │
│                          │                                      │
│                          ▼                                      │
│                 ┌─────────────────┐                             │
│                 │    Executive    │                             │
│                 │    Summary      │                             │
│                 └────────┬────────┘                             │
│                          │                                      │
│  3. Frontend polls: GET /api/ucie/openai-summary-poll/[jobId]   │
│     (every 3 seconds)                                           │
│                                                                  │
│  4. Results stored in ucie_openai_jobs table                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ Display results to user
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                  PHASE 3: CAESAR RESEARCH                        │
│                     (15-20 minutes)                              │
│                   MANUAL START ONLY                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User clicks "Start Caesar Deep Dive" button                 │
│                                                                  │
│  2. 3-second delay (ensure DB writes complete)                  │
│                                                                  │
│  3. Create job: POST /api/ucie/research/[symbol]                │
│                                                                  │
│  4. Caesar API processes:                                       │
│     • Search 15+ authoritative sources                          │
│     • Analyze technology, team, partnerships                    │
│     • Identify risks and opportunities                          │
│     • Generate comprehensive report with citations              │
│                                                                  │
│  5. Frontend polls: GET /api/ucie/research/[symbol]             │
│     (every 60 seconds)                                          │
│                                                                  │
│  6. Results cached for 24 hours                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    COMPLETE ANALYSIS                             │
│              Display full report to user                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Components

### Frontend
- `components/UCIE/DataPreviewModal.tsx` - Main UI component
- `components/UCIE/CaesarAnalysisContainer.tsx` - Caesar research UI
- `components/UCIE/ModularAnalysisDisplay.tsx` - GPT results display

### Backend
- `pages/api/ucie/preview-data/[symbol].ts` - Data aggregation
- `pages/api/ucie/openai-summary-start/[symbol].ts` - Start GPT job
- `pages/api/ucie/openai-summary-poll/[jobId].ts` - Poll GPT status
- `pages/api/ucie/research/[symbol].ts` - Caesar research

### Utilities
- `lib/ucie/cacheUtils.ts` - Database cache operations
- `lib/ucie/contextAggregator.ts` - Context formatting for AI

---

## Error Handling

### Phase 1 Errors
- Individual API failures don't crash entire request
- Graceful degradation with partial data
- Quality score reflects available data

### Phase 2 Errors
- Job status tracked in database
- Timeout after 5 minutes
- Retry logic with exponential backoff

### Phase 3 Errors
- 25-minute timeout for Caesar
- User can retry if failed
- Results cached on success

---

## Related Documentation

- [UCIE System Steering](../../steering/ucie-system.md)
- [Database Caching Pattern](../patterns/database-caching.md)
- [UCIE Feature Docs](../../../docs/production-features/ucie.md)
