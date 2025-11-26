# Einstein Risk Calculator

## Overview

The Risk Calculator is a core component of the Einstein 100000x Trade Generation Engine that implements advanced risk management calculations. It ensures all trades meet strict risk management criteria while maximizing potential returns.

## Features

### 1. Position Sizing (Requirement 8.1)
- Calculates optimal position size based on account balance and risk tolerance
- Respects user-defined risk tolerance (0-100%)
- Ensures consistent risk management across all trades

### 2. ATR-Based Dynamic Stop-Loss (Requirement 8.2)
- Uses Average True Range (ATR) to calculate stop-loss levels
- Adapts to market volatility automatically
- Provides 2x ATR multiplier for standard stops
- Includes volatility adjustment methods for extreme conditions

### 3. Take-Profit Targets (Requirement 8.3)
- Generates 3 take-profit levels with allocations:
  - TP1: 50% allocation (1.618 Fibonacci extension)
  - TP2: 30% allocation (2.618 Fibonacci extension)
  - TP3: 20% allocation (4.236 Fibonacci extension)
- Uses Bollinger Bands for resistance/support levels
- Ensures correct ordering for LONG and SHORT positions

### 4. Risk-Reward Validation (Requirement 8.4)
- Calculates weighted average risk-reward ratio
- Enforces minimum 2:1 ratio for all trades
- Throws error if ratio is below minimum

### 5. Maximum Loss Cap (Requirement 8.5)
- Ensures maximum loss never exceeds 2% of account balance
- Validates position size against account balance
- Throws error if loss cap is exceeded

## Usage

### Basic Usage

```typescript
import { riskCalculator } from './lib/einstein/analysis/riskCalculator';
import type { RiskCalculationInput } from './lib/einstein/analysis/riskCalculator';

// Prepare input
const input: RiskCalculationInput = {
  accountBalance: 100000,      // $100,000 account
  riskTolerance: 80,           // Use 80% of max risk (1.6%)
  entryPrice: 95000,           // Entry at $95,000
  positionType: 'LONG',
  atr: 1200,                   // Current ATR
  currentPrice: 95000,
  technicalIndicators: {
    // ... technical indicators
  }
};

// Calculate risk parameters
const result = riskCalculator.calculateRisk(input);

console.log('Position Size:', result.positionSize);
console.log('Stop Loss:', result.stopLoss);
console.log('Take Profits:', result.takeProfits);
console.log('Risk-Reward:', result.riskReward);
console.log('Max Loss:', result.maxLoss);
```

### Volatility Adjustment

```typescript
// Adjust stop-loss for changing volatility
const adjustedStop = riskCalculator.adjustStopLossForVolatility(
  baseStopLoss,
  currentAtr,
  historicalAtr,
  entryPrice,
  'LONG'
);
```

## Calculation Details

### Position Size Formula

```
Risk Amount = Account Balance × (Max Risk % / 100) × (Risk Tolerance / 100)
Stop Distance = |Entry Price - Stop Loss|
Position Size = Risk Amount / Stop Distance
```

### Stop-Loss Formula

```
Stop Distance = ATR × Multiplier (2.0)

For LONG:  Stop Loss = Entry Price - Stop Distance
For SHORT: Stop Loss = Entry Price + Stop Distance
```

### Take-Profit Formula

```
For LONG:
  TP1 = Entry + (Stop Distance × 1.618)
  TP2 = Entry + (Stop Distance × 2.618)
  TP3 = max(Entry + (Stop Distance × 4.236), Bollinger Upper)

For SHORT:
  TP1 = Entry - (Stop Distance × 1.618)
  TP2 = Entry - (Stop Distance × 2.618)
  TP3 = min(Entry - (Stop Distance × 4.236), Bollinger Lower)
```

### Risk-Reward Formula

```
Risk = |Entry - Stop Loss|
Reward = Weighted Average of TP distances
  = (TP1 distance × 50%) + (TP2 distance × 30%) + (TP3 distance × 20%)

Risk-Reward Ratio = Reward / Risk
```

## Validation Rules

The calculator enforces the following validation rules:

1. **Account Balance**: Must be positive
2. **Risk Tolerance**: Must be between 0 and 100
3. **Entry Price**: Must be positive
4. **ATR**: Must be positive
5. **Position Type**: Cannot be 'NO_TRADE'
6. **Risk-Reward Ratio**: Must be ≥ 2:1
7. **Maximum Loss**: Must be ≤ 2% of account balance

## Error Handling

The calculator throws descriptive errors for invalid inputs:

```typescript
try {
  const result = riskCalculator.calculateRisk(input);
} catch (error) {
  if (error.message.includes('Risk-reward ratio')) {
    // Handle insufficient risk-reward
  } else if (error.message.includes('Maximum loss')) {
    // Handle excessive loss
  } else {
    // Handle other validation errors
  }
}
```

## Examples

See `riskCalculator.example.ts` for complete working examples:

1. **LONG Trade Example**: Demonstrates position sizing and target calculation for bullish trades
2. **SHORT Trade Example**: Shows how calculations work for bearish trades
3. **Volatility Adjustment Example**: Illustrates dynamic stop-loss adjustment

Run examples:
```bash
npx tsx lib/einstein/analysis/riskCalculator.example.ts
```

## Testing

Comprehensive unit tests are available in `__tests__/lib/einstein/analysis/riskCalculator.test.ts`.

Run tests:
```bash
npm test -- __tests__/lib/einstein/analysis/riskCalculator.test.ts
```

Test coverage includes:
- Position sizing calculations
- Stop-loss calculations for LONG and SHORT
- Take-profit target generation
- Risk-reward ratio validation
- Maximum loss cap enforcement
- Volatility-based adjustments
- Input validation
- Error handling

## Integration

The Risk Calculator integrates with other Einstein components:

1. **Data Collection**: Receives ATR and technical indicators
2. **GPT-5.1 Analysis**: Provides risk parameters for AI analysis
3. **Approval Workflow**: Risk metrics displayed in preview modal
4. **Trade Execution**: Position size and stops used for execution

## Constants

```typescript
MAX_RISK_PERCENT = 2           // Maximum 2% risk per trade
MIN_RISK_REWARD_RATIO = 2      // Minimum 2:1 risk-reward
ATR_STOP_MULTIPLIER = 2        // 2x ATR for stop distance
FIBONACCI_LEVELS = {
  TP1: 1.618,                  // 161.8% extension
  TP2: 2.618,                  // 261.8% extension
  TP3: 4.236                   // 423.6% extension
}
```

## Future Enhancements

Potential improvements for future versions:

1. **Dynamic ATR Multiplier**: Adjust multiplier based on market conditions
2. **Partial Position Sizing**: Support for scaling in/out of positions
3. **Correlation Analysis**: Adjust position size based on portfolio correlation
4. **Kelly Criterion**: Optional Kelly-based position sizing
5. **Drawdown Protection**: Reduce position size after consecutive losses

## References

- **Requirements**: See `requirements.md` sections 8.1, 8.2, 8.3, 8.4, 8.5
- **Design**: See `design.md` Risk Management section
- **Tasks**: Task 19 in `tasks.md`

---

**Status**: ✅ Complete  
**Version**: 1.0.0  
**Last Updated**: January 27, 2025
