# Gemini Model Upgrade Specification

## Overview

Upgrade the Whale Watch Gemini AI integration from experimental `gemini-2.0-flash-exp` to stable Gemini 2.5 models with enhanced capabilities including thinking mode, structured outputs, and Deep Dive blockchain analysis.

## Status

✅ **Requirements Complete** - 11 requirements with EARS-compliant acceptance criteria
✅ **Design Complete** - Comprehensive architecture, components, and data models
✅ **Tasks Ready** - 10 main tasks, 43 sub-tasks, 3-4 day estimate
✅ **Approved for Implementation** - MVP approach with optional testing tasks

## Key Features

### 1. Model Upgrade
- **From:** `gemini-2.0-flash-exp` (experimental, deprecated)
- **To:** `gemini-2.5-flash` (stable, 1M context, 65K output)
- **Optional:** `gemini-2.5-pro` for Deep Dive analysis

### 2. Thinking Mode
- Transparent AI reasoning process
- Collapsible section with Bitcoin Sovereign styling
- Shows how AI arrived at conclusions
- Helps traders understand analysis logic

### 3. Structured Outputs
- JSON schema validation
- Guaranteed response format
- No more parsing errors
- Consistent data structure

### 4. Deep Dive Feature ⭐ NEW
- **Blockchain Data Integration**: Real transaction history from Blockchain.com API
- **Fund Flow Tracing**: 2-3 hops beyond initial transaction
- **Pattern Detection**: Accumulation, distribution, mixing behavior
- **Address Classification**: Exchange, whale, mixer, retail, institutional
- **Market Prediction**: 24h and 7-day outlook with price levels
- **Strategic Intelligence**: Intent, sentiment, positioning, R:R analysis
- **Processing Time**: 10-15 seconds with multi-stage progress indicator
- **Trigger**: Available for transactions >= 100 BTC

### 5. Enhanced Analysis
- Current Bitcoin price context
- Specific price levels (support/resistance)
- Timeframe analysis (24h, 7d)
- Risk/reward ratios
- Historical precedent comparisons
- Exchange-specific flow analysis

### 6. Error Handling
- Exponential backoff retry logic (max 2 retries)
- Graceful degradation on failures
- Clear error messages
- Fallback to cached patterns
- 15-second timeout handling

### 7. Performance Optimization
- Flash model: < 3 seconds
- Pro model (Deep Dive): 10-15 seconds
- Blockchain data caching (5 min TTL)
- Parallel data fetching
- Cost-optimized token limits

## File Structure

```
.kiro/specs/gemini-model-upgrade/
├── README.md           # This file - Overview and quick reference
├── requirements.md     # 11 requirements with acceptance criteria
├── design.md          # Architecture, components, data models
└── tasks.md           # 10 main tasks, 43 sub-tasks
```

## Implementation Approach

### MVP Strategy (Approved)
- Focus on core functionality first
- Optional tasks marked with `*` (unit tests, documentation)
- Manual testing required for all features
- Phased deployment with feature flags

### Task Breakdown
1. **Environment Configuration** (1h) - API keys, validation
2. **Model Selection Logic** (2h) - Flash vs Pro selection
3. **Structured Outputs** (2h) - JSON schema validation
4. **Thinking Mode** (3h) - UI components and display
5. **Enhanced Prompts** (2h) - Market context and analysis depth
6. **Error Handling** (3h) - Retry logic and fallbacks
7. **Response Metadata** (2h) - Model badges and transparency
8. **Deep Dive Feature** (6h) - Blockchain integration ⭐
9. **Documentation** (2h) - Comments and examples
10. **Testing** (4h) - Optional unit/integration tests

**Total Estimate:** 27-31 hours (3-4 days)

## Deep Dive Feature Details

### What It Does
1. **Fetches Blockchain Data**
   - Last 10 transactions for source address
   - Last 10 transactions for destination address
   - 30-day volume calculations
   - Known entity identification (exchanges, mixers)

2. **Analyzes Patterns**
   - Accumulation: More incoming than outgoing
   - Distribution: More outgoing than incoming
   - Mixing: Many small transactions
   - Exchange flow: Deposit or withdrawal

3. **Traces Fund Flows**
   - Origin hypothesis: Where funds came from
   - Destination hypothesis: Where funds will go
   - Multi-hop transaction chain analysis
   - Wallet cluster identification

4. **Provides Strategic Intelligence**
   - Address behavior classification
   - Market impact prediction (24h, 7d)
   - Support and resistance levels
   - Trading recommendations with R:R ratios

### UI Components
- **DeepDiveButton**: Shows for transactions >= 100 BTC
- **DeepDiveProgress**: Multi-stage progress indicator
- **DeepDiveResults**: Comprehensive analysis display
  - Address Behavior Analysis
  - Fund Flow Tracing
  - Market Prediction
  - Strategic Intelligence

### Performance
- **Data Fetch**: 2-3 seconds (parallel, cached)
- **AI Analysis**: 7-12 seconds (Gemini 2.5 Pro)
- **Total Time**: 10-15 seconds
- **Caching**: 5-minute TTL for blockchain data

## Environment Variables

```bash
# Required
GEMINI_API_KEY=AIzaSy...

# Optional (with defaults)
GEMINI_MODEL=gemini-2.5-flash
GEMINI_ENABLE_THINKING=true
GEMINI_PRO_THRESHOLD_BTC=100
GEMINI_MAX_RETRIES=2
GEMINI_TIMEOUT_MS=15000

# Blockchain API (for Deep Dive)
BLOCKCHAIN_API_KEY=...
BLOCKCHAIN_API_URL=https://blockchain.info
```

## API Endpoints

### Standard Analysis
```
POST /api/whale-watch/analyze-gemini
Body: { txHash, amount, fromAddress, toAddress, ... }
Response: { success, analysis, thinking?, metadata }
```

### Deep Dive Analysis
```
POST /api/whale-watch/deep-dive-gemini
Body: { txHash, amount, fromAddress, toAddress, ... }
Response: { 
  success, 
  analysis, 
  thinking?, 
  blockchainData: { sourceAddress, destinationAddress, patterns },
  metadata 
}
```

## Response Structure

### Standard Analysis
```typescript
{
  success: true,
  analysis: {
    transaction_type: 'exchange_deposit' | 'exchange_withdrawal' | 'whale_to_whale' | 'unknown',
    market_impact: 'Bearish' | 'Bullish' | 'Neutral',
    confidence: 85,
    reasoning: '2-3 paragraphs...',
    key_findings: ['Finding 1', 'Finding 2', ...],
    trader_action: 'Specific recommendation...'
  },
  thinking: 'AI reasoning process...',
  metadata: {
    model: 'gemini-2.5-flash',
    provider: 'Google Gemini',
    processingTime: 2847,
    timestamp: '2025-01-24T...',
    thinkingEnabled: true
  }
}
```

### Deep Dive Analysis
```typescript
{
  success: true,
  analysis: {
    // Standard fields +
    address_behavior: {
      source_classification: 'whale',
      destination_classification: 'exchange',
      source_strategy: 'Analysis...',
      destination_strategy: 'Analysis...'
    },
    fund_flow_analysis: {
      origin_hypothesis: 'Funds originated from...',
      destination_hypothesis: 'Funds will likely...',
      mixing_detected: false,
      cluster_analysis: 'Wallet cluster insights...'
    },
    market_prediction: {
      short_term_24h: 'Prediction...',
      medium_term_7d: 'Prediction...',
      key_price_levels: {
        support: [94000, 92000, 90000],
        resistance: [98000, 100000, 102000]
      },
      probability_further_movement: 75
    },
    strategic_intelligence: {
      intent: 'Strategic intent...',
      sentiment_indicator: 'Sentiment...',
      trader_positioning: 'Positioning advice...',
      risk_reward_ratio: 'R:R analysis...'
    }
  },
  blockchainData: {
    sourceAddress: { /* address data */ },
    destinationAddress: { /* address data */ },
    patterns: { /* pattern analysis */ }
  },
  metadata: {
    model: 'gemini-2.5-pro',
    analysisType: 'deep-dive',
    processingTime: 12453,
    dataSourcesUsed: ['blockchain.com', 'gemini-pro']
  }
}
```

## Testing Strategy

### Manual Testing (Required)
- [ ] Test Flash model with small transaction (< 100 BTC)
- [ ] Test Deep Dive with large transaction (>= 100 BTC)
- [ ] Verify thinking mode displays correctly
- [ ] Test structured output validation
- [ ] Verify error handling with invalid API key
- [ ] Test retry logic with simulated 429 error
- [ ] Verify mobile display of all components
- [ ] Test Deep Dive progress indicator
- [ ] Verify blockchain data fetching
- [ ] Test Deep Dive results display

### Unit Tests (Optional)
- Model selection logic
- JSON schema validation
- Pattern detection algorithms
- Address classification

### Integration Tests (Optional)
- Gemini API calls
- Blockchain API calls
- Retry logic
- Error handling

## Deployment Plan

### Phase 1: Development (Week 1)
- Implement core features (Tasks 1-7)
- Implement Deep Dive feature (Task 8)
- Add documentation (Task 9)

### Phase 2: Testing (Week 1)
- Manual testing on local environment
- Fix any issues found
- Performance benchmarking

### Phase 3: Staging (Week 2)
- Deploy to Vercel staging
- Configure environment variables
- Monitor error rates
- Gather feedback

### Phase 4: Production (Week 2)
- Deploy with feature flag
- Gradual rollout (10% → 50% → 100%)
- Monitor costs and performance
- Document any issues

## Success Metrics

### Performance
- Flash analysis: < 3 seconds (target)
- Deep Dive analysis: < 15 seconds (target)
- Error rate: < 5%
- Retry success rate: > 80%

### Quality
- Thinking mode adoption: > 50% of users expand
- Deep Dive usage: > 30% for eligible transactions
- User satisfaction: Positive feedback on analysis depth
- Cost efficiency: < $0.01 per analysis average

## Rollback Plan

If critical issues occur:
1. Disable feature flag to revert to old model
2. Investigate logs and error reports
3. Fix issues in development
4. Re-test and re-deploy

## Next Steps

1. **Review this spec** - Ensure all stakeholders understand the plan
2. **Begin Task 1** - Environment configuration and validation
3. **Proceed sequentially** - Follow task order for dependencies
4. **Test continuously** - Manual testing after each major task
5. **Deploy to staging** - Test in production-like environment
6. **Production rollout** - Gradual deployment with monitoring

---

**Spec Created:** January 24, 2025
**Status:** ✅ Ready for Implementation
**Estimated Duration:** 3-4 days
**Complexity:** Medium
**Risk Level:** Low (backward compatible, feature flags)
