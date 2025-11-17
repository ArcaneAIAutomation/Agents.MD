/**
 * ATGE Backtesting Engine
 * 
 * Core backtesting engine that calculates actual trade outcomes based on
 * historical price data.
 * 
 * Requirements: Task 6.1 - Create Backtesting Engine Core
 * 
 * Key Features:
 * - Fetches historical OHLCV data for trade timeframe
 * - Validates data quality (minimum 70%)
 * - Detects target hits (TP1/2/3, Stop Loss) chronologically
 * - Calculates accurate P/L based on allocations
 * - Handles edge cases (expired, insufficient data, immediate SL)
 */

import { queryHistoricalPrices, HistoricalPriceQueryRequest, OHLCVDataPoint } from './historicalPriceQuery';

// ============================================================================
// TYPES
// ============================================================================

export interface BacktestInput {
  tradeId: string;
  symbol: string;
  entryPrice: number;
  tp1Price: number;
  tp1Allocation: number;
  tp2Price: number;
  tp2Allocation: number;
  tp3Price: number;
  tp3Allocation: number;
  stopLossPrice: number;
  timeframe: '15m' | '1h' | '4h' | '1d' | '1w';
  timeframeHours: number;
  generatedAt: Date;
}

export interface BacktestResult {
  actualEntryPrice: number;
  tp1Hit: boolean;
  tp1HitAt?: Date;
  tp1HitPrice?: number;
  tp2Hit: boolean;
  tp2HitAt?: Date;
  tp2HitPrice?: number;
  tp3Hit: boolean;
  tp3HitAt?: Date;
  tp3HitPrice?: number;
  stopLossHit: boolean;
  stopLossHitAt?: Date;
  stopLossHitPrice?: number;
  profitLossUsd: number;
  profitLossPercentage: number;
  tradeDurationMinutes: number;
  netProfitLossUsd: number;
  dataSource: string;
  dataResolution: string;
  dataQualityScore: number;
  status: 'completed_success' | 'completed_failure' | 'expired' | 'incomplete_data';
  errorMessage?: string; // Descriptive error message when status is incomplete_data
  warningMessage?: string; // Warning message for partial fills or data gaps
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Run backtest for a trade signal
 * 
 * This function:
 * 1. Validates trade parameters
 * 2. Fetches historical prices for the trade timeframe
 * 3. Validates data quality (minimum 70%)
 * 4. Iterates through prices chronologically
 * 5. Detects target hits (TP1/2/3, SL)
 * 6. Calculates P/L based on allocations
 * 7. Returns complete trade result with appropriate status
 * 
 * Edge Cases Handled:
 * - Invalid trade parameters (negative prices, invalid allocations)
 * - Insufficient historical data (data quality <70%)
 * - Missing candles in timeframe (gaps in data)
 * - Trade expires before any target hit
 * - Stop loss hit immediately (first candle)
 * - All 3 TPs hit in sequence
 * - Partial fills (some TPs hit, others not)
 */
export async function runBacktest(input: BacktestInput): Promise<BacktestResult> {
  console.log(`[BacktestEngine] Starting backtest for trade ${input.tradeId} (${input.symbol})`);
  
  // Step 0: Validate trade parameters
  const validationError = validateTradeParameters(input);
  if (validationError) {
    const errorMessage = `Invalid trade parameters: ${validationError}`;
    console.error(`[BacktestEngine] ${errorMessage}`);
    return createInvalidParametersResult(input, errorMessage);
  }
  
  // Step 1: Fetch historical prices for the timeframe
  const endTime = new Date(input.generatedAt.getTime() + input.timeframeHours * 60 * 60 * 1000);
  const historicalPrices = await fetchHistoricalPricesForTimeframe(
    input.symbol,
    input.generatedAt,
    endTime,
    input.timeframe
  );
  
  // Step 2: Validate data quality
  if (historicalPrices.dataQuality < 70) {
    const errorMessage = `Insufficient data quality for accurate backtesting: ${historicalPrices.dataQuality}% (minimum 70% required). This may be due to missing historical data or gaps in the price feed.`;
    console.warn(`[BacktestEngine] ${errorMessage}`);
    return createInsufficientDataResult(input, historicalPrices.dataQuality, errorMessage);
  }
  
  console.log(`[BacktestEngine] Data quality: ${historicalPrices.dataQuality}% (${historicalPrices.data.length} candles)`);
  
  // Step 3: Initialize result
  const result: BacktestResult = {
    actualEntryPrice: input.entryPrice,
    tp1Hit: false,
    tp2Hit: false,
    tp3Hit: false,
    stopLossHit: false,
    profitLossUsd: 0,
    profitLossPercentage: 0,
    tradeDurationMinutes: 0,
    netProfitLossUsd: 0,
    dataSource: 'coingecko',
    dataResolution: input.timeframe,
    dataQualityScore: historicalPrices.dataQuality,
    status: 'expired'
  };
  
  // Step 4: Iterate through historical prices to detect target hits
  let remainingAllocation = 100; // Start with 100% position
  const expiryTime = endTime.getTime();
  let lastCandleTime = input.generatedAt.getTime();
  
  // Edge Case: Empty data array (should be caught by data quality check, but double-check)
  if (historicalPrices.data.length === 0) {
    const errorMessage = `No historical price data available for ${input.symbol} in the specified timeframe (${input.generatedAt.toISOString()} to ${endTime.toISOString()}). Unable to perform backtesting without price data.`;
    console.warn(`[BacktestEngine] ${errorMessage}`);
    return createInsufficientDataResult(input, 0, errorMessage);
  }
  
  for (const candle of historicalPrices.data) {
    const candleTime = new Date(candle.timestamp).getTime();
    
    // Edge Case: Missing candles (gaps in data)
    // Check if there's a significant gap between candles
    const timeSinceLastCandle = candleTime - lastCandleTime;
    const expectedInterval = getExpectedIntervalMs(input.timeframe);
    if (timeSinceLastCandle > expectedInterval * 2) {
      const gapMinutes = Math.floor(timeSinceLastCandle / 60000);
      const warningMessage = `Data gap detected: ${gapMinutes} minutes between candles (expected ${Math.floor(expectedInterval / 60000)} minutes). This may affect backtest accuracy.`;
      console.warn(`[BacktestEngine] ${warningMessage}`);
      
      // Store warning in result (will be set later)
      if (!result.warningMessage) {
        result.warningMessage = warningMessage;
      }
    }
    lastCandleTime = candleTime;
    
    // Check if trade expired
    if (candleTime > expiryTime) {
      console.log(`[BacktestEngine] Trade expired at ${new Date(expiryTime).toISOString()}`);
      break;
    }
    
    // Edge Case: Stop loss hit immediately (first candle)
    // Check stop loss FIRST (highest priority)
    if (candle.low <= input.stopLossPrice && !result.stopLossHit) {
      result.stopLossHit = true;
      result.stopLossHitAt = new Date(candle.timestamp);
      result.stopLossHitPrice = input.stopLossPrice;
      
      // Calculate loss for remaining position
      const loss = (input.stopLossPrice - input.entryPrice) * (remainingAllocation / 100);
      result.profitLossUsd += loss;
      
      // Trade ends when stop loss is hit
      result.tradeDurationMinutes = Math.floor(
        (candleTime - input.generatedAt.getTime()) / 60000
      );
      result.status = 'completed_failure';
      
      const isImmediateSL = candleTime - input.generatedAt.getTime() < expectedInterval;
      if (isImmediateSL) {
        console.log(`[BacktestEngine] Stop loss hit IMMEDIATELY on first candle at ${candle.timestamp} (${remainingAllocation}% remaining)`);
      } else {
        console.log(`[BacktestEngine] Stop loss hit at ${candle.timestamp} (${remainingAllocation}% remaining)`);
      }
      break;
    }
    
    // Check TP1 (always check first)
    if (candle.high >= input.tp1Price && !result.tp1Hit && remainingAllocation > 0) {
      result.tp1Hit = true;
      result.tp1HitAt = new Date(candle.timestamp);
      result.tp1HitPrice = input.tp1Price;
      
      // Calculate profit for TP1 allocation
      const profit = (input.tp1Price - input.entryPrice) * (input.tp1Allocation / 100);
      result.profitLossUsd += profit;
      remainingAllocation -= input.tp1Allocation;
      
      console.log(`[BacktestEngine] TP1 hit at ${candle.timestamp} (+${profit.toFixed(2)} USD, ${remainingAllocation}% remaining)`);
    }
    
    // Check TP2 (only if TP1 has been hit - sequential checking)
    if (candle.high >= input.tp2Price && !result.tp2Hit && result.tp1Hit && remainingAllocation > 0) {
      result.tp2Hit = true;
      result.tp2HitAt = new Date(candle.timestamp);
      result.tp2HitPrice = input.tp2Price;
      
      // Calculate profit for TP2 allocation
      const profit = (input.tp2Price - input.entryPrice) * (input.tp2Allocation / 100);
      result.profitLossUsd += profit;
      remainingAllocation -= input.tp2Allocation;
      
      console.log(`[BacktestEngine] TP2 hit at ${candle.timestamp} (+${profit.toFixed(2)} USD, ${remainingAllocation}% remaining)`);
    }
    
    // Check TP3 (only if TP2 has been hit - sequential checking)
    if (candle.high >= input.tp3Price && !result.tp3Hit && result.tp2Hit && remainingAllocation > 0) {
      result.tp3Hit = true;
      result.tp3HitAt = new Date(candle.timestamp);
      result.tp3HitPrice = input.tp3Price;
      
      // Calculate profit for TP3 allocation
      const profit = (input.tp3Price - input.entryPrice) * (input.tp3Allocation / 100);
      result.profitLossUsd += profit;
      remainingAllocation -= input.tp3Allocation;
      
      // All targets hit, trade complete
      result.tradeDurationMinutes = Math.floor(
        (candleTime - input.generatedAt.getTime()) / 60000
      );
      result.status = 'completed_success';
      
      console.log(`[BacktestEngine] TP3 hit at ${candle.timestamp} (+${profit.toFixed(2)} USD, all targets complete)`);
      break;
    }
  }
  
  // Step 5: Calculate final metrics
  result.profitLossPercentage = (result.profitLossUsd / input.entryPrice) * 100;
  result.netProfitLossUsd = result.profitLossUsd;
  
  // If trade didn't complete, calculate duration as full timeframe
  if (result.tradeDurationMinutes === 0) {
    result.tradeDurationMinutes = input.timeframeHours * 60;
  }
  
  // Determine final status if not already set
  if (result.status === 'expired') {
    // Edge Case: Trade expires before any target hit
    if (!result.tp1Hit && !result.tp2Hit && !result.tp3Hit && !result.stopLossHit) {
      const message = `Trade expired after ${result.tradeDurationMinutes} minutes without hitting any targets (TP1, TP2, TP3, or Stop Loss). Final P/L: $0.00`;
      console.log(`[BacktestEngine] ${message}`);
      result.status = 'expired';
      result.warningMessage = message;
    }
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
  }
  
  // Edge Case: All 3 TPs hit in sequence
  if (result.tp1Hit && result.tp2Hit && result.tp3Hit) {
    console.log(`[BacktestEngine] ALL targets hit successfully (TP1, TP2, TP3)`);
  }
  
  // Log final summary with descriptive message
  const statusMessages = {
    'completed_success': 'Trade completed successfully',
    'completed_failure': 'Trade stopped out (loss)',
    'expired': 'Trade expired without hitting targets',
    'incomplete_data': 'Insufficient data for backtesting'
  };
  
  console.log(`[BacktestEngine] Backtest complete: ${statusMessages[result.status]}`);
  console.log(`[BacktestEngine] Final P/L: ${result.profitLossUsd.toFixed(2)} USD (${result.profitLossPercentage.toFixed(2)}%)`);
  console.log(`[BacktestEngine] Duration: ${result.tradeDurationMinutes} minutes`);
  console.log(`[BacktestEngine] Targets hit: TP1=${result.tp1Hit}, TP2=${result.tp2Hit}, TP3=${result.tp3Hit}, SL=${result.stopLossHit}`);
  
  return result;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get expected interval in milliseconds for a timeframe
 * 
 * Used to detect gaps in historical data
 */
function getExpectedIntervalMs(timeframe: '15m' | '1h' | '4h' | '1d' | '1w'): number {
  const intervals = {
    '15m': 15 * 60 * 1000,      // 15 minutes
    '1h': 60 * 60 * 1000,        // 1 hour
    '4h': 4 * 60 * 60 * 1000,    // 4 hours
    '1d': 24 * 60 * 60 * 1000,   // 1 day
    '1w': 7 * 24 * 60 * 60 * 1000 // 1 week
  };
  
  return intervals[timeframe];
}

/**
 * Fetch historical prices for the trade timeframe
 * 
 * This is the core function that implements the acceptance criterion:
 * "Fetches historical prices for timeframe"
 * 
 * It uses the queryHistoricalPrices function from historicalPriceQuery.ts
 * to retrieve OHLCV data from the database.
 */
async function fetchHistoricalPricesForTimeframe(
  symbol: string,
  startDate: Date,
  endDate: Date,
  timeframe: '15m' | '1h' | '4h' | '1d' | '1w'
): Promise<{ data: OHLCVDataPoint[]; dataQuality: number; gaps: Array<{ start: string; end: string }> }> {
  const request: HistoricalPriceQueryRequest = {
    symbol,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    timeframe
  };
  
  console.log(`[BacktestEngine] Fetching historical prices for ${symbol} from ${startDate.toISOString()} to ${endDate.toISOString()} (${timeframe})`);
  
  const response = await queryHistoricalPrices(request);
  
  console.log(`[BacktestEngine] Fetched ${response.data.length} candles with ${response.dataQuality}% quality`);
  
  return {
    data: response.data,
    dataQuality: response.dataQuality,
    gaps: response.gaps
  };
}

/**
 * Validate trade parameters
 * 
 * Edge Case: Invalid trade parameters
 * 
 * Checks:
 * - All prices are positive numbers
 * - Allocations sum to 100%
 * - TP prices are above entry price (for long trades)
 * - Stop loss is below entry price (for long trades)
 * - Timeframe hours is positive
 */
function validateTradeParameters(input: BacktestInput): string | null {
  // Check for positive prices
  if (input.entryPrice <= 0) {
    return 'Entry price must be positive';
  }
  if (input.tp1Price <= 0 || input.tp2Price <= 0 || input.tp3Price <= 0) {
    return 'Take profit prices must be positive';
  }
  if (input.stopLossPrice <= 0) {
    return 'Stop loss price must be positive';
  }
  
  // Check for valid allocations
  if (input.tp1Allocation < 0 || input.tp2Allocation < 0 || input.tp3Allocation < 0) {
    return 'Allocations must be non-negative';
  }
  
  const totalAllocation = input.tp1Allocation + input.tp2Allocation + input.tp3Allocation;
  if (Math.abs(totalAllocation - 100) > 0.01) {
    return `Allocations must sum to 100% (got ${totalAllocation}%)`;
  }
  
  // Check for logical price relationships (assuming long trade)
  if (input.tp1Price <= input.entryPrice) {
    return 'TP1 price must be above entry price';
  }
  if (input.tp2Price <= input.tp1Price) {
    return 'TP2 price must be above TP1 price';
  }
  if (input.tp3Price <= input.tp2Price) {
    return 'TP3 price must be above TP2 price';
  }
  if (input.stopLossPrice >= input.entryPrice) {
    return 'Stop loss price must be below entry price';
  }
  
  // Check for valid timeframe
  if (input.timeframeHours <= 0) {
    return 'Timeframe hours must be positive';
  }
  
  // All validations passed
  return null;
}

/**
 * Create result for invalid trade parameters
 * 
 * Edge Case: Invalid trade parameters
 * 
 * Returns a descriptive error message explaining what validation failed
 */
function createInvalidParametersResult(input: BacktestInput, errorMessage: string): BacktestResult {
  return {
    actualEntryPrice: input.entryPrice,
    tp1Hit: false,
    tp2Hit: false,
    tp3Hit: false,
    stopLossHit: false,
    profitLossUsd: 0,
    profitLossPercentage: 0,
    tradeDurationMinutes: 0,
    netProfitLossUsd: 0,
    dataSource: 'none',
    dataResolution: input.timeframe,
    dataQualityScore: 0,
    status: 'incomplete_data', // Use incomplete_data status for invalid parameters
    errorMessage: errorMessage // Store descriptive error message
  };
}

/**
 * Create result for insufficient data quality
 * 
 * Edge Case: Insufficient historical data (data quality <70%)
 * 
 * This occurs when:
 * - Too many gaps in historical data
 * - Data is missing for significant portions of the timeframe
 * - Data quality validation fails
 * 
 * Returns a descriptive error message explaining the data quality issue
 */
function createInsufficientDataResult(input: BacktestInput, dataQuality: number, errorMessage: string): BacktestResult {
  return {
    actualEntryPrice: input.entryPrice,
    tp1Hit: false,
    tp2Hit: false,
    tp3Hit: false,
    stopLossHit: false,
    profitLossUsd: 0,
    profitLossPercentage: 0,
    tradeDurationMinutes: 0,
    netProfitLossUsd: 0,
    dataSource: 'coingecko',
    dataResolution: input.timeframe,
    dataQualityScore: dataQuality,
    status: 'incomplete_data',
    errorMessage: errorMessage // Store descriptive error message
  };
}
