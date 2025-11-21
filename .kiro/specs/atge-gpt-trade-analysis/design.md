# ATGE GPT Trade Analysis Engine - Design Document

## Overview

This document outlines the technical design for implementing a comprehensive GPT-powered trade analysis system for ATGE. The system will be built in 4 sequential phases, each adding more sophisticated analysis capabilities.

**Implementation Phases:**
1. **Phase 1**: Lightweight Post-Trade Analysis (4-6 hours)
2. **Phase 2**: Vision-Enabled Chart Analysis (10-15 hours)
3. **Phase 3**: Real-Time Monitoring + Analysis (15-20 hours)
4. **Phase 4**: Batch Analysis with Pattern Recognition (6-8 hours)

**Total Estimated Time**: 35-49 hours (1-2 weeks)

---

## System Architecture

### High-Level Flow

```
Trade Generation → Backtesting → Phase 1 Analysis → Store in DB
                                      ↓
                              Phase 2 Chart Analysis (if enabled)
                                      ↓
                              Phase 3 Real-Time Events (if enabled)
                                      ↓
                              Phase 4 Batch Patterns (on demand)
```

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    ATGE Trade Analysis System                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Phase 1    │  │   Phase 2    │  │   Phase 3    │      │
│  │ Text Analysis│→ │Chart Analysis│→ │Real-Time Mon.│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         ↓                  ↓                  ↓              │
│  ┌──────────────────────────────────────────────────┐      │
│  │              Phase 4: Batch Analysis              │      │
│  └──────────────────────────────────────────────────┘      │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────┐      │
│  │           Supabase Database Storage               │      │
│  └──────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Lightweight Post-Trade Analysis

### Architecture

**Trigger**: Automatic after backtest completes
**Processing Time**: 3-5 seconds
**Cost**: ~$0.01 per analysis

### Components


#### 1. Analysis Trigger (`lib/atge/analysisOrchestrator.ts`)

```typescript
export async function triggerPostTradeAnalysis(tradeId: string): Promise<void> {
  // 1. Check if analysis already exists
  const existing = await checkExistingAnalysis(tradeId);
  if (existing) return;
  
  // 2. Fetch complete trade data
  const tradeData = await fetchTradeDataForAnalysis(tradeId);
  
  // 3. Generate analysis context
  const context = buildAnalysisContext(tradeData);
  
  // 4. Call GPT-4o
  const analysis = await generateGPTAnalysis(context);
  
  // 5. Store in database
  await storeAnalysis(tradeId, analysis);
}
```

#### 2. Context Builder (`lib/atge/analysisContextBuilder.ts`)

```typescript
interface AnalysisContext {
  trade: {
    symbol: string;
    entryPrice: number;
    exitPrice?: number;
    tp1: number; tp2: number; tp3: number;
    stopLoss: number;
    timeframe: string;
  };
  indicators: {
    rsi?: number;
    macd?: number;
    ema20?: number;
    ema50?: number;
    ema200?: number;
  };
  snapshot: {
    price: number;
    volume24h?: number;
    sentiment?: number;
  };
  outcome: {
    tp1Hit: boolean;
    tp2Hit: boolean;
    tp3Hit: boolean;
    stopLossHit: boolean;
    profitLoss: number;
    profitLossPercentage: number;
  };
}
```

