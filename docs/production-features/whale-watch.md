# Whale Watch Feature Documentation

**Last Updated**: December 19, 2025  
**Status**: ✅ Production Ready  
**Priority**: HIGH  
**Dependencies**: Gemini AI, Blockchain.com API, Caesar API

---

## Overview

Whale Watch is a real-time Bitcoin whale transaction tracking system that detects large BTC transfers (>50 BTC) and provides AI-powered analysis of their potential market impact.

---

## Features

### Core Capabilities
- **Real-time Detection**: Monitors Bitcoin blockchain for large transactions
- **Threshold Filtering**: Configurable minimum BTC threshold (default: 50 BTC)
- **Transaction Classification**: Identifies exchange deposits, withdrawals, whale-to-whale transfers
- **AI Analysis**: Gemini AI provides fast transaction analysis
- **Deep Dive**: Caesar API provides comprehensive research (15-20 minutes)
- **Market Impact Assessment**: Bullish/Bearish/Neutral classification

### User Experience
- Live transaction feed with auto-refresh
- One-click AI analysis initiation
- Analysis lock system (prevents API spam)
- Progress indicators for long-running analyses
- Source citations for research-backed insights

---

## Technical Architecture

### API Endpoints

```typescript
// Detect whale transactions
GET /api/whale-watch/detect?threshold=50
// Returns: { whales: WhaleTransaction[], timestamp: string }

// Start AI analysis
POST /api/whale-watch/analyze
// Body: { txHash, amount, fromAddress, toAddress, ... }
// Returns: { success: boolean, jobId: string }

// Poll analysis results
GET /api/whale-watch/analysis/[jobId]
// Returns: { status: string, analysis?: object, sources?: array }
```

### Data Flow

```
1. User opens Whale Watch page
   ↓
2. Frontend calls /api/whale-watch/detect
   ↓
3. Backend queries Blockchain.com API
   ↓
4. Transactions filtered by threshold
   ↓
5. Results displayed in real-time feed
   ↓
6. User clicks "Analyze" on transaction
   ↓
7. Backend starts Gemini AI analysis job
   ↓
8. Frontend polls for results every 3 seconds
   ↓
9. Analysis displayed when complete
```

### Database Tables

```sql
-- Whale transactions cache
whale_transactions (
  id UUID PRIMARY KEY,
  tx_hash VARCHAR(64) UNIQUE,
  amount DECIMAL,
  from_address VARCHAR(64),
  to_address VARCHAR(64),
  timestamp TIMESTAMP,
  analysis_status VARCHAR(20),
  analysis_result JSONB,
  created_at TIMESTAMP DEFAULT NOW()
)

-- Analysis jobs
whale_analysis_jobs (
  id UUID PRIMARY KEY,
  tx_hash VARCHAR(64),
  status VARCHAR(20),
  result JSONB,
  sources JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
)
```

---

## Configuration

### Environment Variables

```bash
# Required
GEMINI_API_KEY=your_gemini_api_key
BLOCKCHAIN_API_KEY=your_blockchain_api_key

# Optional (for Caesar deep dive)
CAESAR_API_KEY=your_caesar_api_key
```

### Vercel Configuration

```json
{
  "functions": {
    "pages/api/whale-watch/**/*.ts": {
      "maxDuration": 300,
      "memory": 1024
    }
  }
}
```

---

## Components

### Frontend Components

```
components/WhaleWatch/
├── WhaleWatchDashboard.tsx    # Main dashboard component
├── WhaleTransactionCard.tsx   # Individual transaction display
├── WhaleAnalysisModal.tsx     # Analysis results modal
├── WhaleFilters.tsx           # Threshold and filter controls
└── index.ts                   # Component exports
```

### Key Files

```
pages/
├── whale-watch.tsx            # Whale Watch page
└── api/whale-watch/
    ├── detect.ts              # Transaction detection
    ├── analyze.ts             # Start analysis
    └── analysis/[jobId].ts    # Poll results
```

---

## Analysis Lock System

To prevent API spam from multiple simultaneous requests:

```typescript
// 1. Track active analysis state
const [analyzingTx, setAnalyzingTx] = useState<string | null>(null);

// 2. Guard clause at function start
const analyzeTransaction = async (whale: WhaleTransaction) => {
  if (analyzingTx !== null) {
    console.log('⚠️ Analysis already in progress');
    return;
  }
  
  // 3. Immediately set state before API call
  setAnalyzingTx(whale.txHash);
  
  // 4. Make API call
  // ...
};

// 5. Disable UI with pointer-events
<div className={isDisabled ? 'pointer-events-none opacity-50' : ''}>
```

---

## Troubleshooting

### Common Issues

**Issue**: Transactions not loading
- Check Blockchain.com API key is valid
- Verify network connectivity
- Check Vercel function logs

**Issue**: Analysis stuck in "processing"
- Check Gemini API key is valid
- Verify API quota not exceeded
- Check for timeout errors in logs

**Issue**: Analysis lock not releasing
- Clear browser state
- Refresh page
- Check for JavaScript errors in console

### Debug Commands

```bash
# Test detection endpoint
curl https://your-domain.com/api/whale-watch/detect?threshold=50

# Check analysis status
curl https://your-domain.com/api/whale-watch/analysis/[jobId]
```

---

## Performance Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Detection latency | < 2s | ~1.5s |
| Analysis start | < 1s | ~0.5s |
| Gemini analysis | < 30s | ~15-25s |
| Caesar deep dive | < 20min | ~15-18min |

---

## Related Documentation

- **Steering**: `.kiro/steering/api-integration.md`
- **Spec**: `.kiro/specs/whale-watch/` (if exists)
- **API Status**: `.kiro/steering/api-status.md`
