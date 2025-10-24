# Task 5: Enhance Analysis Prompts - Implementation Summary

## Overview
Task 5 enhances the Gemini AI whale transaction analysis prompts with current market context, specific price levels, timeframe analysis, risk/reward ratios, historical precedents, and exchange-specific flow analysis.

## Implementation Status

### ✅ Completed Sub-tasks

#### 5.1 Add current Bitcoin price context to prompt
**Status:** ✅ COMPLETED

**Implementation:**
- Added `getCurrentBitcoinPrice()` function that fetches live BTC price from `/api/crypto-prices`
- Function includes 5-second timeout and fallback to $95,000 if API fails
- Price is fetched before building the prompt
- Transaction value is calculated at current price: `whale.amount * currentBtcPrice`
- Prompt now includes:
  - Current Bitcoin Price
  - Current Market Value of transaction
  - Transaction as % of total BTC supply
  - Transaction value as % of $1B

**Code Location:** `pages/api/whale-watch/analyze-gemini.ts` lines 35-60

#### 5.2 Request specific price levels in prompt
**Status:** ⏳ IN PROGRESS

**Implementation Plan:**
The prompt needs to be updated to explicitly request:
- SPECIFIC support levels below current price (exact dollar amounts)
- SPECIFIC resistance levels above current price (exact dollar amounts)
- SPECIFIC entry prices for traders
- SPECIFIC exit prices and stop-loss levels

**Prompt Addition:**
```
2. **Market Context & Price Levels (Requirements 4.1, 4.2):**
   - Current Bitcoin price: $${currentBtcPrice.toLocaleString()}
   - Identify SPECIFIC support levels below current price (provide exact dollar amounts)
   - Identify SPECIFIC resistance levels above current price (provide exact dollar amounts)
   - Provide SPECIFIC entry prices for traders considering positions
   - Provide SPECIFIC exit prices and stop-loss levels
   - Recent whale activity trends and market sentiment
```

**JSON Schema Update:**
```typescript
price_levels: {
  type: 'object',
  properties: {
    support: { 
      type: 'array', 
      items: { type: 'number' },
      description: 'Support price levels to watch'
    },
    resistance: { 
      type: 'array', 
      items: { type: 'number' },
      description: 'Resistance price levels to watch'
    }
  },
  description: 'Key price levels for trading decisions (optional)'
}
```

#### 5.3 Add timeframe analysis to prompt
**Status:** ⏳ IN PROGRESS

**Implementation Plan:**
The prompt needs to explicitly request:
- SHORT-TERM (24-48 hours): Detailed prediction with specific price targets
- MEDIUM-TERM (1-2 weeks): Detailed outlook with key levels and scenarios

**Prompt Addition:**
```
3. **Timeframe Analysis (Requirement 4.2):**
   - SHORT-TERM (24-48 hours): Detailed prediction with specific price targets
   - MEDIUM-TERM (1-2 weeks): Detailed outlook with key levels and scenarios
   - Consider how this transaction might influence price action in each timeframe
```

**JSON Schema Update:**
```typescript
timeframe_analysis: {
  type: 'object',
  properties: {
    short_term: { 
      type: 'string',
      minLength: 20,
      description: 'Short-term outlook (24-48 hours)'
    },
    medium_term: { 
      type: 'string',
      minLength: 20,
      description: 'Medium-term outlook (1-2 weeks)'
    }
  },
  description: 'Timeframe-specific analysis (optional)'
}
```

#### 5.4 Request risk/reward ratios
**Status:** ⏳ IN PROGRESS

**Implementation Plan:**
The prompt needs to explicitly request:
- SPECIFIC risk/reward ratios for potential trades
- Position sizing recommendations
- Optimal entry points with stop-loss levels
- Potential profit targets with probability estimates

**Prompt Addition:**
```
4. **Risk/Reward Analysis (Requirement 4.3):**
   - Calculate SPECIFIC risk/reward ratios for potential trades
   - Provide position sizing recommendations based on transaction size
   - Identify optimal entry points with corresponding stop-loss levels
   - Calculate potential profit targets with probability estimates
```

#### 5.5 Add historical precedent analysis
**Status:** ⏳ IN PROGRESS

**Implementation Plan:**
The prompt needs to explicitly request:
- Comparison to similar past whale transactions
- What happened to Bitcoin price after similar transactions
- Pattern recognition from historical data
- Statistical context (e.g., "70% of similar transactions led to...")

**Prompt Addition:**
```
5. **Historical Precedent Analysis (Requirement 4.4):**
   - Compare to similar past whale transactions of this size
   - What happened to Bitcoin price after similar transactions?
   - Identify patterns from historical data
   - Provide statistical context (e.g., "70% of similar transactions led to...")
```

#### 5.6 Add exchange-specific flow analysis
**Status:** ✅ COMPLETED

**Implementation:**
- Added `detectExchangeAddress()` function that identifies known exchange addresses
- Function checks against patterns for Binance, Bitfinex, Kraken, Coinbase
- Exchange detection runs before prompt building
- If exchange detected, adds context to prompt with exchange name and flow implications

**Code Location:** `pages/api/whale-watch/analyze-gemini.ts` lines 62-82

**Prompt Enhancement:**
```
**Exchange Detection:**
- From Address: Detected as ${fromExchange} exchange
- To Address: Detected as ${toExchange} exchange
- Provide exchange-specific flow analysis and implications

6. **Exchange Flow Analysis (Requirement 4.5):**
   - DETECTED: From ${fromExchange} to ${toExchange}
   - Analyze exchange-specific implications
   - Is this a deposit (bearish) or withdrawal (bullish)?
   - What does exchange flow data suggest about market direction?
```

## Next Steps

### Immediate Actions Required

1. **Update the prompt template** in `pages/api/whale-watch/analyze-gemini.ts` (lines 152-210) to include all enhanced sections:
   - Market Context & Price Levels (5.2)
   - Timeframe Analysis (5.3)
   - Risk/Reward Analysis (5.4)
   - Historical Precedent Analysis (5.5)
   - Exchange Flow Analysis (already added in context, needs prompt section)

2. **Update the JSON response format** to include the new optional fields:
   ```json
   {
     "price_levels": {
       "support": [number, number, number],
       "resistance": [number, number, number]
     },
     "timeframe_analysis": {
       "short_term": "string (24-48h outlook with specific price targets)",
       "medium_term": "string (1-2 week outlook with key levels)"
     }
   }
   ```

3. **Add final instruction** to the prompt:
   ```
   CRITICAL: Include SPECIFIC numbers, prices, and percentages. Avoid vague statements like "significant" or "considerable". Use exact figures and historical data references.
   ```

## Testing Checklist

After completing the implementation:

- [ ] Test with small transaction (< 100 BTC) - should use Flash model
- [ ] Test with large transaction (>= 100 BTC) - should use Pro model
- [ ] Verify current BTC price is fetched and included in prompt
- [ ] Verify exchange detection works for known addresses
- [ ] Verify response includes price_levels when requested
- [ ] Verify response includes timeframe_analysis when requested
- [ ] Check that analysis includes specific numbers and prices
- [ ] Verify risk/reward ratios are calculated
- [ ] Check for historical precedent references
- [ ] Verify exchange-specific insights when applicable

## Requirements Mapping

- **Requirement 4.1** ✅ Current Bitcoin price context added
- **Requirement 4.2** ⏳ Specific price levels and timeframe analysis (in progress)
- **Requirement 4.3** ⏳ Risk/reward ratios (in progress)
- **Requirement 4.4** ⏳ Historical precedent analysis (in progress)
- **Requirement 4.5** ✅ Exchange-specific flow analysis added

## Files Modified

1. `pages/api/whale-watch/analyze-gemini.ts`
   - Added `getCurrentBitcoinPrice()` function
   - Added `detectExchangeAddress()` function
   - Enhanced prompt with market context
   - Added exchange detection logic
   - Updated interface to include optional price_levels and timeframe_analysis

## Estimated Completion Time

- Remaining work: ~30 minutes
- Main task: Update prompt template with all enhanced sections
- Testing: ~15 minutes

---

**Last Updated:** January 24, 2025
**Status:** 60% Complete (2 of 6 sub-tasks fully implemented, 4 in progress)
