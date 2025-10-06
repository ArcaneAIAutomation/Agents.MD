# Whale Watch Intelligence - Requirements

## Overview
Track and analyze large cryptocurrency wallet movements with AI-powered context analysis using Caesar API.

## Core Features

### 1. Whale Transaction Detection
- Monitor BTC and ETH blockchain for large transactions
- Threshold: >100 BTC or >1000 ETH
- Real-time detection via blockchain APIs
- Filter out exchange-to-exchange transfers

### 2. Context Analysis (Caesar API)
For each whale transaction, Caesar researches:
- **Why**: Exchange deposit? OTC deal? Hack? Accumulation?
- **Who**: Known wallet? Exchange? Institution? Whale history?
- **Impact**: Historical price impact of similar moves
- **Sentiment**: Market reaction and news coverage
- **Confidence**: Score based on source quality

### 3. Historical Pattern Analysis
- Store all whale transactions
- Identify patterns (time of day, price levels, outcomes)
- ML predictions for price impact
- Success rate tracking

### 4. Real-Time Alerts
- Push notifications for significant moves
- Customizable thresholds per user
- Alert types: Exchange deposit, Accumulation, Distribution
- Mobile-optimized notifications

### 5. Intelligence Dashboard
- Live whale activity feed
- Transaction details with context
- Price impact visualization
- Source citations for all claims
- "Show Raw Research" button

## Technical Architecture

### Data Sources

**Blockchain Data:**
- Etherscan API (Ethereum)
- Blockchain.com API (Bitcoin)
- Whale Alert API (optional premium)

**Context Research:**
- Caesar API (2 CU per whale transaction)
- Query: "Analyze this crypto transaction: [details]. Why did it happen? What's the likely impact? Include sources."

**Price Data:**
- CoinGecko/CoinMarketCap for correlation
- Historical price at transaction time

### API Endpoints

```
POST /api/whale-watch/detect
- Fetches recent large transactions
- Returns: transaction list

POST /api/whale-watch/analyze/:txHash
- Triggers Caesar research for specific transaction
- Returns: job_id

GET /api/whale-watch/analysis/:jobId
- Polls Caesar for completed analysis
- Returns: context, sources, confidence

GET /api/whale-watch/feed
- Returns: recent whale transactions with analysis
- Pagination support

GET /api/whale-watch/patterns
- Returns: historical patterns and predictions
```

### Database Schema

```typescript
interface WhaleTransaction {
  id: string;
  txHash: string;
  blockchain: 'BTC' | 'ETH';
  amount: number;
  amountUSD: number;
  fromAddress: string;
  toAddress: string;
  timestamp: Date;
  blockNumber: number;
  
  // Analysis
  analysisStatus: 'pending' | 'analyzing' | 'completed' | 'failed';
  caesarJobId?: string;
  context?: string;
  transactionType?: 'exchange_deposit' | 'exchange_withdrawal' | 'otc' | 'accumulation' | 'distribution' | 'unknown';
  impactPrediction?: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  sources: Array<{
    title: string;
    url: string;
    relevance: number;
  }>;
  
  // Price Impact
  priceAtTransaction: number;
  priceAfter1h?: number;
  priceAfter24h?: number;
  actualImpact?: number;
  
  // Metadata
  createdAt: Date;
  analyzedAt?: Date;
}
```

### Caesar Integration

**Query Template:**
```
Analyze this cryptocurrency whale transaction:
- Blockchain: {blockchain}
- Amount: {amount} {symbol} (${amountUSD})
- From: {fromAddress}
- To: {toAddress}
- Time: {timestamp}

Research and answer:
1. What type of transaction is this? (exchange deposit, withdrawal, OTC, accumulation, etc.)
2. Why did this transaction likely happen?
3. What is the probable market impact? (bullish, bearish, neutral)
4. Are there any related news or events?
5. Historical context: similar transactions and their outcomes

Provide sources for all claims.
```

**System Prompt:**
```json
{
  "format": "strict_json",
  "schema": {
    "transaction_type": "string",
    "reasoning": "string",
    "impact_prediction": "bullish|bearish|neutral",
    "confidence": "number (0-100)",
    "key_findings": ["string"],
    "sources": [{"title": "string", "url": "string"}]
  }
}
```

## UI Components

### 1. Whale Feed Component
- Card-based layout
- Real-time updates
- Filter by blockchain, amount, type
- Sort by time, amount, impact

### 2. Transaction Detail Modal
- Full transaction details
- Caesar analysis with citations
- Price impact chart
- "Show Raw Research" expandable
- Share button

### 3. Patterns Dashboard
- Historical success rate
- Common patterns visualization
- Prediction accuracy metrics
- Top whale wallets

### 4. Alert Settings
- Threshold configuration
- Notification preferences
- Watchlist management

## Mobile Optimization

- Card-based responsive design
- Swipe gestures for actions
- Progressive loading
- Offline caching of recent transactions
- Push notifications

## Performance Targets

- Transaction detection: < 5 minutes from blockchain
- Caesar analysis: 2-4 minutes (2 CU)
- Feed load time: < 2 seconds
- Real-time updates: WebSocket or polling every 30s

## Beta Constraints

- 5 concurrent Caesar jobs max
- 200 CU/month = ~100 whale analyses
- Prioritize high-value transactions (>$10M)
- Queue system for analysis

## Success Metrics

- Whale detection accuracy: >95%
- Analysis completion rate: >90%
- Price prediction accuracy: >60%
- User engagement: Daily active users
- Alert click-through rate

## Future Enhancements

- Multi-chain support (Solana, Avalanche, etc.)
- Whale wallet profiles
- Social sentiment integration
- Automated trading signals
- Community whale tracking
