/**
 * Risk Calculator Usage Example
 * 
 * Demonstrates how to use the RiskCalculator for trade signal generation
 */

import { riskCalculator } from './riskCalculator';
import type { RiskCalculationInput } from './riskCalculator';
import type { TechnicalIndicators } from '../types';

/**
 * Example: Calculate risk parameters for a Bitcoin LONG trade
 */
export function exampleLongTrade() {
  // Sample technical indicators (would come from data collection)
  const indicators: TechnicalIndicators = {
    rsi: 45,
    macd: {
      value: 150,
      signal: 100,
      histogram: 50
    },
    ema: {
      ema9: 95500,
      ema21: 94800,
      ema50: 93500,
      ema200: 90000
    },
    bollingerBands: {
      upper: 98000,
      middle: 95000,
      lower: 92000
    },
    atr: 1200, // Current volatility
    stochastic: {
      k: 40,
      d: 35
    }
  };

  // Risk calculation input
  const input: RiskCalculationInput = {
    accountBalance: 100000,      // $100,000 account
    riskTolerance: 80,           // Use 80% of max risk (1.6% instead of 2%)
    entryPrice: 95000,           // Entry at $95,000
    positionType: 'LONG',
    atr: 1200,
    currentPrice: 95000,
    technicalIndicators: indicators
  };

  // Calculate risk parameters
  const result = riskCalculator.calculateRisk(input);

  console.log('=== LONG Trade Risk Calculation ===');
  console.log(`Account Balance: $${input.accountBalance.toLocaleString()}`);
  console.log(`Risk Tolerance: ${input.riskTolerance}%`);
  console.log(`Entry Price: $${input.entryPrice.toLocaleString()}`);
  console.log('');
  console.log('=== Results ===');
  console.log(`Position Size: ${result.positionSize.toFixed(4)} BTC`);
  console.log(`Stop Loss: $${result.stopLoss.toLocaleString()}`);
  console.log(`Take Profit 1: $${result.takeProfits.tp1.price.toLocaleString()} (${result.takeProfits.tp1.allocation}%)`);
  console.log(`Take Profit 2: $${result.takeProfits.tp2.price.toLocaleString()} (${result.takeProfits.tp2.allocation}%)`);
  console.log(`Take Profit 3: $${result.takeProfits.tp3.price.toLocaleString()} (${result.takeProfits.tp3.allocation}%)`);
  console.log(`Risk-Reward Ratio: ${result.riskReward.toFixed(2)}:1`);
  console.log(`Maximum Loss: $${result.maxLoss.toLocaleString()} (${result.maxLossPercent.toFixed(2)}%)`);
  console.log(`Potential Profit: $${result.potentialProfit.toLocaleString()}`);
  console.log('');

  return result;
}

/**
 * Example: Calculate risk parameters for a Bitcoin SHORT trade
 */
export function exampleShortTrade() {
  const indicators: TechnicalIndicators = {
    rsi: 75,
    macd: {
      value: -150,
      signal: -100,
      histogram: -50
    },
    ema: {
      ema9: 94500,
      ema21: 95200,
      ema50: 96500,
      ema200: 100000
    },
    bollingerBands: {
      upper: 98000,
      middle: 95000,
      lower: 92000
    },
    atr: 1500, // Higher volatility
    stochastic: {
      k: 80,
      d: 85
    }
  };

  const input: RiskCalculationInput = {
    accountBalance: 100000,
    riskTolerance: 100,          // Use full 2% risk
    entryPrice: 95000,
    positionType: 'SHORT',
    atr: 1500,
    currentPrice: 95000,
    technicalIndicators: indicators
  };

  const result = riskCalculator.calculateRisk(input);

  console.log('=== SHORT Trade Risk Calculation ===');
  console.log(`Account Balance: $${input.accountBalance.toLocaleString()}`);
  console.log(`Risk Tolerance: ${input.riskTolerance}%`);
  console.log(`Entry Price: $${input.entryPrice.toLocaleString()}`);
  console.log('');
  console.log('=== Results ===');
  console.log(`Position Size: ${result.positionSize.toFixed(4)} BTC`);
  console.log(`Stop Loss: $${result.stopLoss.toLocaleString()}`);
  console.log(`Take Profit 1: $${result.takeProfits.tp1.price.toLocaleString()} (${result.takeProfits.tp1.allocation}%)`);
  console.log(`Take Profit 2: $${result.takeProfits.tp2.price.toLocaleString()} (${result.takeProfits.tp2.allocation}%)`);
  console.log(`Take Profit 3: $${result.takeProfits.tp3.price.toLocaleString()} (${result.takeProfits.tp3.allocation}%)`);
  console.log(`Risk-Reward Ratio: ${result.riskReward.toFixed(2)}:1`);
  console.log(`Maximum Loss: $${result.maxLoss.toLocaleString()} (${result.maxLossPercent.toFixed(2)}%)`);
  console.log(`Potential Profit: $${result.potentialProfit.toLocaleString()}`);
  console.log('');

  return result;
}

/**
 * Example: Adjust stop-loss for changing volatility
 */
export function exampleVolatilityAdjustment() {
  const baseStopLoss = 93000;
  const entryPrice = 95000;
  const historicalAtr = 1000;

  console.log('=== Volatility-Based Stop Adjustment ===');
  console.log(`Entry Price: $${entryPrice.toLocaleString()}`);
  console.log(`Base Stop Loss: $${baseStopLoss.toLocaleString()}`);
  console.log(`Historical ATR: ${historicalAtr}`);
  console.log('');

  // High volatility scenario
  const highVolatilityAtr = 2000;
  const adjustedStopHigh = riskCalculator.adjustStopLossForVolatility(
    baseStopLoss,
    highVolatilityAtr,
    historicalAtr,
    entryPrice,
    'LONG'
  );
  console.log(`High Volatility (ATR: ${highVolatilityAtr}):`);
  console.log(`  Adjusted Stop: $${adjustedStopHigh.toLocaleString()}`);
  console.log(`  Change: $${(adjustedStopHigh - baseStopLoss).toLocaleString()} (wider stop)`);
  console.log('');

  // Normal volatility scenario
  const normalVolatilityAtr = 1000;
  const adjustedStopNormal = riskCalculator.adjustStopLossForVolatility(
    baseStopLoss,
    normalVolatilityAtr,
    historicalAtr,
    entryPrice,
    'LONG'
  );
  console.log(`Normal Volatility (ATR: ${normalVolatilityAtr}):`);
  console.log(`  Adjusted Stop: $${adjustedStopNormal.toLocaleString()}`);
  console.log(`  Change: $${(adjustedStopNormal - baseStopLoss).toLocaleString()} (no change)`);
  console.log('');

  // Low volatility scenario
  const lowVolatilityAtr = 400;
  const adjustedStopLow = riskCalculator.adjustStopLossForVolatility(
    baseStopLoss,
    lowVolatilityAtr,
    historicalAtr,
    entryPrice,
    'LONG'
  );
  console.log(`Low Volatility (ATR: ${lowVolatilityAtr}):`);
  console.log(`  Adjusted Stop: $${adjustedStopLow.toLocaleString()}`);
  console.log(`  Change: $${(adjustedStopLow - baseStopLoss).toLocaleString()} (tighter stop)`);
  console.log('');
}

// Run examples if executed directly
if (require.main === module) {
  console.log('\n');
  exampleLongTrade();
  console.log('\n');
  exampleShortTrade();
  console.log('\n');
  exampleVolatilityAdjustment();
}
