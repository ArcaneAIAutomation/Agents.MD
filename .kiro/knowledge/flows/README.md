# Knowledge Bank - Data Flows

**Last Updated**: December 19, 2025  
**Purpose**: Document data flows and system interactions

---

## Overview

This directory contains documentation of data flows through the Bitcoin Sovereign Technology platform. Understanding these flows is essential for debugging and extending the system.

---

## Available Flow Documentation

### Core Flows
- [UCIE Data Flow](./ucie-data-flow.md) - Complete UCIE data collection and analysis flow
- [Authentication Flow](./auth-flow.md) - User authentication and session management
- [Whale Watch Flow](./whale-watch-flow.md) - Whale transaction detection and analysis

### API Flows
- [Market Data Flow](./market-data-flow.md) - Price and market data aggregation
- [News Aggregation Flow](./news-flow.md) - News collection and sentiment analysis

---

## Flow Diagram Template

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Source    │ ──► │  Processor  │ ──► │   Output    │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
   [Details]           [Details]           [Details]
```

---

## Contributing

1. Identify a significant data flow
2. Document using ASCII diagrams
3. Include timing and error handling
4. Add to this README
