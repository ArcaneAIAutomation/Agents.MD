# Task 6.2: Trade Expires After Timeframe - COMPLETE ✅

**Date**: January 27, 2025  
**Status**: ✅ **VERIFIED COMPLETE**  
**Task**: Trade expires after timeframe  
**Spec**: `.kiro/specs/atge-trade-details-fix/tasks.md` - Task 6.2

---

## Summary

The acceptance criterion "Trade expires after timeframe" from Task 6.2 (Implement Target Hit Detection) has been **verified as complete**. The backtesting engine correctly enforces trade expiration after the specified timeframe hours, ensuring that no targets are processed beyond the trade's time limit.

---

## Implementation Details

### How Trade Expiration Works

The backtesting engine calculates an expiry time based on the trade's generation time and timeframe hours, then checks each candle's timestamp against this expiry time:

```typescript
// Calculate expiry time (line 135)
const endTime = new Date(input.generatedAt.getTime() + input.timeframeHours * 60 * 60 * 1000);
const expiryTime = endTime.getTime();

// Check expiration in main loop (lines 165-170)
for (const candle of historicalPrices.data) {
  const candleTime = new Date(candle.timestamp).getTime();
  
  // Check if trade expired
  if (candleTime > expiryTime) {
    console.log(`[BacktestEngine] Trade expired at ${new Date(expiryTime).toISOString()}`);
    break; // ✅ Stop processing candles
  }
  
  // Process targets (TP1, TP2, TP3, SL)...
}
```

### Key Features

1. **Precise Expiry Calculation**: `generatedAt + (timeframeHours * 60 * 60 * 1000)`
2. **Chronological Processing**: Candles are processed in time order
3. **Hard Stop at Expiry**: Loop breaks immediately when expiry time is reached
4. **No Post-Expiry Processing**: Targets beyond expiry are never checked
5. **Expiry Status Handling**: Trades without hits are marked as 'expired'
6. **Duration Calculation**: Full timeframe duration used for expired trades

---

## Test Coverage

### Test 1: Trade Expires With No Targets Hit ✅

**File**: `__tests__/atge/backtestingEngine.test.ts` (lines 686-710)

**Scenario**: Trade runs through timeframe without hitting any targets

**Test Code**:
```typescript
test('should handle trade expiring with no targets hit', async () => {
  const input = createValidBacktestInput();
  
  mockQueryHistoricalPrices.mockResolvedValue(createMockHistoricalData([
    {
      timestamp: '2025-01-01T01:00:00Z',
      open: 100000,
      high: 101000, // Doesn't hit any TP
      low: 99000,   // Doesn't hit SL
      close: 100500,
      volume: 1000
    }
  ]));
  
  const result = await runBacktest(input);
  
  expect(result.status).toBe('expired');
  expect(result.tp1Hit).toBe(false);
  expect(result.tp2Hit).toBe(false);
  expect(result.tp3Hit).toBe(false);
  expect(result.stopLossHit).toBe(false);
  expect(result.profitLossUsd).toBe(0);
});
```

**Result**: ✅ **PASSING** (2ms)

---

### Test 2: Trade Expires After Timeframe Hours ✅

**File**: `__tests__/atge/backtestingEngine.test.ts` (lines 712-762)

**Scenario**: Candles beyond timeframe are NOT processed

**Test Code**:
```typescript
test('should expire trade after timeframe hours have passed', async () => {
  const input = createValidBacktestInput({
    generatedAt: new Date('2025-01-01T00:00:00Z'),
    timeframeHours: 24 // 24-hour timeframe
  });
  
  // Create candles that span beyond the 24-hour timeframe
  mockQueryHistoricalPrices.mockResolvedValue(createMockHistoricalData([
    {
      timestamp: '2025-01-01T01:00:00Z', // 1 hour - within timeframe
      open: 100000,
      high: 101000,
      low: 99000,
      close: 100500,
      volume: 1000
    },
    {
      timestamp: '2025-01-01T23:00:00Z', // 23 hours - within timeframe
      open: 101000,
      high: 101800,
      low: 100000,
      close: 101500,
      volume: 1000
    },
    {
      timestamp: '2025-01-02T01:00:00Z', // 25 hours - BEYOND timeframe
      open: 101500,
      high: 106500, // Would hit all TPs if processed
      low: 97000,   // Would hit SL if processed
      close: 106000,
      volume: 1000
    }
  ]));
  
  const result = await runBacktest(input);
  
  // Trade should expire after 24 hours
  expect(result.status).toBe('expired');
  expect(result.tp1Hit).toBe(false);
  expect(result.tp2Hit).toBe(false);
  expect(result.tp3Hit).toBe(false);
  expect(result.stopLossHit).toBe(false);
  expect(result.profitLossUsd).toBe(0);
  expect(result.tradeDurationMinutes).toBe(1440); // 24 hours = 1440 minutes
});
```

**Result**: ✅ **PASSING** (3ms)

**Key Verification**: The candle at 25 hours (which would hit all targets) is **NOT processed** because it's beyond the 24-hour timeframe.

---

### Test 3: Process Within Timeframe, Stop at Expiration ✅

**File**: `__tests__/atge/backtestingEngine.test.ts` (lines 764-806)

**Scenario**: Candles within timeframe are processed, but processing stops at expiration

**Test Code**:
```typescript
test('should process candles within timeframe but stop at expiration', async () => {
  const input = createValidBacktestInput({
    generatedAt: new Date('2025-01-01T00:00:00Z'),
    timeframeHours: 4 // 4-hour timeframe
  });
  
  mockQueryHistoricalPrices.mockResolvedValue(createMockHistoricalData([
    {
      timestamp: '2025-01-01T01:00:00Z', // 1 hour - within timeframe
      open: 100000,
      high: 102500, // Hits TP1
      low: 99000,
      close: 102000,
      volume: 1000
    },
    {
      timestamp: '2025-01-01T03:00:00Z', // 3 hours - within timeframe
      open: 102000,
      high: 103500,
      low: 101000,
      close: 103000,
      volume: 1000
    },
    {
      timestamp: '2025-01-01T05:00:00Z', // 5 hours - BEYOND timeframe
      open: 103000,
      high: 106500, // Would hit TP2 and TP3 if processed
      low: 102000,
      close: 106000,
      volume: 1000
    }
  ]));
  
  const result = await runBacktest(input);
  
  // Should process first two candles (within 4-hour timeframe) but not the third
  expect(result.tp1Hit).toBe(true);
  expect(result.tp2Hit).toBe(false); // Not hit because candle at 5 hours is beyond timeframe
  expect(result.tp3Hit).toBe(false);
  expect(result.status).toBe('completed_success'); // Partial success with TP1
  expect(result.tradeDurationMinutes).toBe(240); // 4 hours = 240 minutes
});
```

**Result**: ✅ **PASSING** (2ms)

**Key Verification**: TP1 is hit at 1 hour (within timeframe), but TP2/TP3 are NOT hit because the candle at 5 hours is beyond the 4-hour timeframe.

---

## Edge Cases Handled

### 1. Expired Trade Status ✅

**Code**: `lib/atge/backtestingEngine.ts` (lines 237-247)

```typescript
// Edge Case: Trade expires before any target hit
if (!result.tp1Hit && !result.tp2Hit && !result.tp3Hit && !result.stopLossHit) {
  const message = `Trade expired after ${result.tradeDurationMinutes} minutes without hitting any targets (TP1, TP2, TP3, or Stop Loss). Final P/L: $0.00`;
  console.log(`[BacktestEngine] ${message}`);
  result.status = 'expired';
  result.warningMessage = message;
}
```

**Behavior**: Trades that expire without hitting any targets are marked with status 'expired' and include a descriptive warning message.

---

### 2. Partial Fills with Expiration ✅

**Code**: `lib/atge/backtestingEngine.ts` (lines 249-257)

```typescript
// Edge Case: Partial fills (some TPs hit, others not)
else if (result.tp1Hit || result.tp2Hit || result.tp3Hit) {
  const targetsHit = [
    result.tp1Hit ? 'TP1' : null,
    result.tp2Hit ? 'TP2' : null,
    result.tp3Hit ? 'TP3' : null
  ].filter(Boolean).join(', ');
  const message = `Trade expired with partial fills: ${targetsHit} hit. Some targets were not reached before the timeframe ended.`;
  console.log(`[BacktestEngine] ${message}`);
  result.status = 'completed_success'; // Partial success
  result.warningMessage = message;
}
```

**Behavior**: Trades that hit some targets but expire before hitting all are marked as 'completed_success' with a warning about partial fills.

---

### 3. Duration Calculation for Expired Trades ✅

**Code**: `lib/atge/backtestingEngine.ts` (lines 232-235)

```typescript
// If trade didn't complete, calculate duration as full timeframe
if (result.tradeDurationMinutes === 0) {
  result.tradeDurationMinutes = input.timeframeHours * 60;
}
```

**Behavior**: Expired trades use the full timeframe duration (e.g., 24 hours = 1440 minutes).

---

## Verification

### Code Location
**File**: `lib/atge/backtestingEngine.ts`  
**Lines**: 
- 99: Expiry time calculation (`endTime`)
- 135: Expiry time in milliseconds (`expiryTime`)
- 165-170: Expiration check in main loop
- 237-257: Expired status handling

### Console Logging
The engine logs when a trade expires:
```
[BacktestEngine] Trade expired at 2025-01-02T00:00:00.000Z
[BacktestEngine] Trade expired after 1440 minutes without hitting any targets (TP1, TP2, TP3, or Stop Loss). Final P/L: $0.00
```

---

## Test Results

### All Expiration Tests Passing ✅

```
Backtesting Engine - Edge Cases
  ✓ should handle trade expiring with no targets hit (2ms) ✅
  ✓ should expire trade after timeframe hours have passed (3ms) ✅
  ✓ should process candles within timeframe but stop at expiration (2ms) ✅
  ✓ should handle partial fills with trade expiration (2ms) ✅
```

**Total Expiration Tests**: 4/4 passing ✅

---

## Acceptance Criteria Status

From Task 6.2 in `tasks.md`:

- [x] Stop loss checked first (highest priority) ✅
- [x] TPs checked in sequence (1, 2, 3) ✅
- [x] Exact timestamp and price recorded ✅
- [x] Remaining allocation tracked correctly ✅
- **[x] Trade expires after timeframe** ✅ **VERIFIED COMPLETE**
- [x] Handles partial fills correctly ✅
- [x] Unit tests for all scenarios ✅

---

## Conclusion

The "Trade expires after timeframe" acceptance criterion is **fully implemented and tested**. The backtesting engine:

1. ✅ Calculates precise expiry time based on generation time + timeframe hours
2. ✅ Checks each candle's timestamp against expiry time
3. ✅ Stops processing immediately when expiry is reached
4. ✅ Never processes candles beyond the timeframe
5. ✅ Marks expired trades with appropriate status
6. ✅ Handles partial fills with expiration
7. ✅ Calculates correct duration for expired trades
8. ✅ Has comprehensive test coverage (4 specific tests + integration tests)
9. ✅ All tests passing

**Status**: ✅ **COMPLETE AND VERIFIED**

---

**Task Updated**: `.kiro/specs/atge-trade-details-fix/tasks.md` - Task 6.2 subtask "Trade expires after timeframe" marked as complete
