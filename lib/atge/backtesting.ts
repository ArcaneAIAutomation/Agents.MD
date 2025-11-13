/**
 * Backtesting Engine for ATGE
 * 
 * Analyzes historical OHLCV data to determine if trade targets were hit.
 * Calculates profit/loss based on $1000 standardized trade size with fees and slippage.
 * 
 * Requirements: 4.1-4.15, 20.1-20.15
 */

import { OHLCVData } from './historicalData';

// ============================================================================
// TYPES
// ============================================================================

export interface TradeSignal {
  id: string;
  symbol: string;
  entryPrice: number;
  tp1Price: number;
  tp1Allocation: number;
  tp2Price: number;
  tp2Allocation: number;
  tp3Price: number;
  tp3Allocation: number;
  stopLossPrice: number;
  stopLossPercentage: number;
  timeframe: string;
  generatedAt: Date;
  expiresAt: Date;
}

export interface TargetHit {
  hit: boolean;
  hitAt?: Date;
  hitPrice?: number;
}

export interface BacktestResult {
  // Entry/Exit
  actualEntryPrice: number;
  actualExitPrice: number;
  
  // Target Hits
  tp1Hit: TargetHit;
  tp2Hit: TargetHit;
  tp3Hit: TargetHit;
  stopLossHit: TargetHit;
  
  // Profit/Loss
  profitLossUsd: number;
  profitLossPercentage: number;
  tradeDurationMinutes: number;
  
  // Trade Size & Fees
  tradeSizeUsd: number;
  feesUsd: number;
  slippageUsd: number;
  netProfitLossUsd: number;
  
  // Data Quality
  dataSource: string;
  dataResolution: string;
  dataQualityScore: number;
  
  // Status
  status: 'completed_success' | 'completed_failure' | 'expired' | 'incomplete_data';
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TRADE_SIZE_USD = 1000;
const FEE_PERCENTAGE = 0.001; // 0.1%
const SLIPPAGE_PERCENTAGE = 0.001; // 0.1%
const ENTRY_FEE_USD = TRADE_SIZE_USD * FEE_PERCENTAGE; // $1
const EXIT_FEE_USD = TRADE_SIZE_USD * FEE_PERCENTAGE; // $1
const TOTAL_FEES_USD = ENTRY_FEE_USD + EXIT_FEE_USD; // $2
const ENTRY_SLIPPAGE_USD = TRADE_SIZE_USD * SLIPPAGE_PERCENTAGE; // $1
const EXIT_SLIPPAGE_USD = TRADE_SIZE_USD * SLIPPAGE_PERCENTAGE; // $1
const TOTAL_SLIPPAGE_USD = ENTRY_SLIPPAGE_USD + EXIT_SLIPPAGE_USD; // $2

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Run backtesting analysis on a trade signal using historical OHLCV data
 */
export function runBacktest(
  signal: TradeSignal,
  historicalData: OHLCVData[],
  dataSource: string,
  dataResolution: string,
  dataQualityScore: number
): BacktestResult {
  console.log(`[Backtesting] Analyzing trade ${signal.id} with ${historicalData.length} data points`);

  // Validate data
  if (historicalData.length === 0) {
    return createIncompleteDataResult(signal, dataSource, dataResolution);
  }

  // Check data quality
  if (dataQualityScore < 70) {
    console.warn(`[Backtesting] Low data quality score: ${dataQualityScore}`);
    return createIncompleteDataResult(signal, dataSource, dataResolution);
  }

  // Determine if trade is long or short based on target prices
  const isLong = signal.tp1Price > signal.entryPrice;

  // Find entry point (first data point after signal generation)
  const entryData = findEntryPoint(signal, historicalData);
  if (!entryData) {
    console.warn(`[Backtesting] No entry point found`);
    return createIncompleteDataResult(signal, dataSource, dataResolution);
  }

  const actualEntryPrice = entryData.close;
  const entryTime = entryData.timestamp;

  console.log(`[Backtesting] Entry: $${actualEntryPrice} at ${entryTime.toISOString()}`);

  // Analyze price action to find target hits
  const analysis = analyzePriceAction(
    signal,
    historicalData,
    entryTime,
    actualEntryPrice,
    isLong
  );

  // Calculate profit/loss
  const profitLoss = calculateProfitLoss(
    signal,
    actualEntryPrice,
    analysis,
    isLong
  );

  // Determine final status
  const status = determineStatus(analysis, profitLoss.profitLossUsd);

  // Calculate trade duration
  const exitTime = getExitTime(analysis, signal.expiresAt);
  const tradeDurationMinutes = Math.round((exitTime.getTime() - entryTime.getTime()) / 60000);

  console.log(`[Backtesting] Result: ${status}, P/L: $${profitLoss.netProfitLossUsd.toFixed(2)}, Duration: ${tradeDurationMinutes}m`);

  return {
    actualEntryPrice,
    actualExitPrice: profitLoss.exitPrice,
    tp1Hit: analysis.tp1,
    tp2Hit: analysis.tp2,
    tp3Hit: analysis.tp3,
    stopLossHit: analysis.stopLoss,
    profitLossUsd: profitLoss.profitLossUsd,
    profitLossPercentage: profitLoss.profitLossPercentage,
    tradeDurationMinutes,
    tradeSizeUsd: TRADE_SIZE_USD,
    feesUsd: TOTAL_FEES_USD,
    slippageUsd: TOTAL_SLIPPAGE_USD,
    netProfitLossUsd: profitLoss.netProfitLossUsd,
    dataSource,
    dataResolution,
    dataQualityScore,
    status
  };
}

// ============================================================================
// ANALYSIS FUNCTIONS
// ============================================================================

function findEntryPoint(signal: TradeSignal, data: OHLCVData[]): OHLCVData | null {
  // Find first data point after signal generation
  return data.find(d => d.timestamp >= signal.generatedAt) || null;
}

interface PriceAnalysis {
  tp1: TargetHit;
  tp2: TargetHit;
  tp3: TargetHit;
  stopLoss: TargetHit;
}

function analyzePriceAction(
  signal: TradeSignal,
  data: OHLCVData[],
  entryTime: Date,
  entryPrice: number,
  isLong: boolean
): PriceAnalysis {
  const analysis: PriceAnalysis = {
    tp1: { hit: false },
    tp2: { hit: false },
    tp3: { hit: false },
    stopLoss: { hit: false }
  };

  // Filter data to only include points after entry and before expiration
  const relevantData = data.filter(
    d => d.timestamp >= entryTime && d.timestamp <= signal.expiresAt
  );

  if (relevantData.length === 0) {
    return analysis;
  }

  // Analyze each candle to find target hits
  for (const candle of relevantData) {
    // For long trades: check if high reached targets or low hit stop loss
    // For short trades: check if low reached targets or high hit stop loss
    
    if (isLong) {
      // Check stop loss first (priority)
      if (!analysis.stopLoss.hit && candle.low <= signal.stopLossPrice) {
        analysis.stopLoss = {
          hit: true,
          hitAt: candle.timestamp,
          hitPrice: signal.stopLossPrice
        };
        // Stop loss hit, trade is over
        break;
      }

      // Check take profit levels (in order)
      if (!analysis.tp1.hit && candle.high >= signal.tp1Price) {
        analysis.tp1 = {
          hit: true,
          hitAt: candle.timestamp,
          hitPrice: signal.tp1Price
        };
      }

      if (analysis.tp1.hit && !analysis.tp2.hit && candle.high >= signal.tp2Price) {
        analysis.tp2 = {
          hit: true,
          hitAt: candle.timestamp,
          hitPrice: signal.tp2Price
        };
      }

      if (analysis.tp2.hit && !analysis.tp3.hit && candle.high >= signal.tp3Price) {
        analysis.tp3 = {
          hit: true,
          hitAt: candle.timestamp,
          hitPrice: signal.tp3Price
        };
        // All targets hit, trade is complete
        break;
      }
    } else {
      // Short trade logic
      if (!analysis.stopLoss.hit && candle.high >= signal.stopLossPrice) {
        analysis.stopLoss = {
          hit: true,
          hitAt: candle.timestamp,
          hitPrice: signal.stopLossPrice
        };
        break;
      }

      if (!analysis.tp1.hit && candle.low <= signal.tp1Price) {
        analysis.tp1 = {
          hit: true,
          hitAt: candle.timestamp,
          hitPrice: signal.tp1Price
        };
      }

      if (analysis.tp1.hit && !analysis.tp2.hit && candle.low <= signal.tp2Price) {
        analysis.tp2 = {
          hit: true,
          hitAt: candle.timestamp,
          hitPrice: signal.tp2Price
        };
      }

      if (analysis.tp2.hit && !analysis.tp3.hit && candle.low <= signal.tp3Price) {
        analysis.tp3 = {
          hit: true,
          hitAt: candle.timestamp,
          hitPrice: signal.tp3Price
        };
        break;
      }
    }
  }

  return analysis;
}

// ============================================================================
// PROFIT/LOSS CALCULATIONS
// ============================================================================

interface ProfitLossCalculation {
  profitLossUsd: number;
  profitLossPercentage: number;
  netProfitLossUsd: number;
  exitPrice: number;
}

function calculateProfitLoss(
  signal: TradeSignal,
  entryPrice: number,
  analysis: PriceAnalysis,
  isLong: boolean
): ProfitLossCalculation {
  let totalProfitLoss = 0;
  let exitPrice = entryPrice;

  // If stop loss was hit, calculate full loss
  if (analysis.stopLoss.hit) {
    exitPrice = analysis.stopLoss.hitPrice!;
    const priceChange = isLong 
      ? (exitPrice - entryPrice) / entryPrice
      : (entryPrice - exitPrice) / entryPrice;
    totalProfitLoss = TRADE_SIZE_USD * priceChange;
  } else {
    // Calculate weighted profit based on which targets were hit
    let remainingAllocation = 100;

    if (analysis.tp1.hit) {
      const tp1ProfitLoss = calculatePartialProfitLoss(
        entryPrice,
        signal.tp1Price,
        signal.tp1Allocation,
        isLong
      );
      totalProfitLoss += tp1ProfitLoss;
      remainingAllocation -= signal.tp1Allocation;
      exitPrice = signal.tp1Price;
    }

    if (analysis.tp2.hit) {
      const tp2ProfitLoss = calculatePartialProfitLoss(
        entryPrice,
        signal.tp2Price,
        signal.tp2Allocation,
        isLong
      );
      totalProfitLoss += tp2ProfitLoss;
      remainingAllocation -= signal.tp2Allocation;
      exitPrice = signal.tp2Price;
    }

    if (analysis.tp3.hit) {
      const tp3ProfitLoss = calculatePartialProfitLoss(
        entryPrice,
        signal.tp3Price,
        signal.tp3Allocation,
        isLong
      );
      totalProfitLoss += tp3ProfitLoss;
      remainingAllocation -= signal.tp3Allocation;
      exitPrice = signal.tp3Price;
    }

    // If no targets hit, trade expired at entry price (no profit/loss)
    if (!analysis.tp1.hit && !analysis.tp2.hit && !analysis.tp3.hit) {
      totalProfitLoss = 0;
      exitPrice = entryPrice;
    }
  }

  // Calculate percentage
  const profitLossPercentage = (totalProfitLoss / TRADE_SIZE_USD) * 100;

  // Apply fees and slippage
  const netProfitLoss = totalProfitLoss - TOTAL_FEES_USD - TOTAL_SLIPPAGE_USD;

  return {
    profitLossUsd: totalProfitLoss,
    profitLossPercentage,
    netProfitLossUsd: netProfitLoss,
    exitPrice
  };
}

function calculatePartialProfitLoss(
  entryPrice: number,
  targetPrice: number,
  allocation: number,
  isLong: boolean
): number {
  const allocationDecimal = allocation / 100;
  const positionSize = TRADE_SIZE_USD * allocationDecimal;
  
  const priceChange = isLong
    ? (targetPrice - entryPrice) / entryPrice
    : (entryPrice - targetPrice) / entryPrice;
  
  return positionSize * priceChange;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function determineStatus(
  analysis: PriceAnalysis,
  profitLossUsd: number
): 'completed_success' | 'completed_failure' | 'expired' {
  // If stop loss was hit, it's a failure
  if (analysis.stopLoss.hit) {
    return 'completed_failure';
  }

  // If any target was hit, it's a success
  if (analysis.tp1.hit || analysis.tp2.hit || analysis.tp3.hit) {
    return 'completed_success';
  }

  // If no targets hit and no stop loss, trade expired
  return 'expired';
}

function getExitTime(analysis: PriceAnalysis, expiresAt: Date): Date {
  // Find the latest target hit time
  const times: Date[] = [];
  
  if (analysis.stopLoss.hit && analysis.stopLoss.hitAt) {
    times.push(analysis.stopLoss.hitAt);
  }
  if (analysis.tp1.hit && analysis.tp1.hitAt) {
    times.push(analysis.tp1.hitAt);
  }
  if (analysis.tp2.hit && analysis.tp2.hitAt) {
    times.push(analysis.tp2.hitAt);
  }
  if (analysis.tp3.hit && analysis.tp3.hitAt) {
    times.push(analysis.tp3.hitAt);
  }

  if (times.length === 0) {
    return expiresAt;
  }

  // Return the latest time
  return times.reduce((latest, current) => 
    current > latest ? current : latest
  );
}

function createIncompleteDataResult(
  signal: TradeSignal,
  dataSource: string,
  dataResolution: string
): BacktestResult {
  return {
    actualEntryPrice: signal.entryPrice,
    actualExitPrice: signal.entryPrice,
    tp1Hit: { hit: false },
    tp2Hit: { hit: false },
    tp3Hit: { hit: false },
    stopLossHit: { hit: false },
    profitLossUsd: 0,
    profitLossPercentage: 0,
    tradeDurationMinutes: 0,
    tradeSizeUsd: TRADE_SIZE_USD,
    feesUsd: TOTAL_FEES_USD,
    slippageUsd: TOTAL_SLIPPAGE_USD,
    netProfitLossUsd: -TOTAL_FEES_USD - TOTAL_SLIPPAGE_USD,
    dataSource,
    dataResolution,
    dataQualityScore: 0,
    status: 'incomplete_data'
  };
}

/**
 * Calculate aggregate performance statistics from multiple backtest results
 */
export function calculatePerformanceStats(results: BacktestResult[]): {
  totalTrades: number;
  completedTrades: number;
  successfulTrades: number;
  failedTrades: number;
  expiredTrades: number;
  incompleteTrades: number;
  successRate: number;
  totalProfitLoss: number;
  averageProfit: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  winLossRatio: number;
} {
  const totalTrades = results.length;
  const completedTrades = results.filter(r => 
    r.status === 'completed_success' || r.status === 'completed_failure'
  ).length;
  const successfulTrades = results.filter(r => r.status === 'completed_success').length;
  const failedTrades = results.filter(r => r.status === 'completed_failure').length;
  const expiredTrades = results.filter(r => r.status === 'expired').length;
  const incompleteTrades = results.filter(r => r.status === 'incomplete_data').length;

  const successRate = completedTrades > 0 
    ? (successfulTrades / completedTrades) * 100 
    : 0;

  const totalProfitLoss = results.reduce((sum, r) => sum + r.netProfitLossUsd, 0);

  const profits = results.filter(r => r.netProfitLossUsd > 0).map(r => r.netProfitLossUsd);
  const losses = results.filter(r => r.netProfitLossUsd < 0).map(r => r.netProfitLossUsd);

  const averageProfit = profits.length > 0
    ? profits.reduce((sum, p) => sum + p, 0) / profits.length
    : 0;

  const averageLoss = losses.length > 0
    ? losses.reduce((sum, l) => sum + l, 0) / losses.length
    : 0;

  const largestWin = profits.length > 0 ? Math.max(...profits) : 0;
  const largestLoss = losses.length > 0 ? Math.min(...losses) : 0;

  const winLossRatio = averageLoss !== 0 
    ? Math.abs(averageProfit / averageLoss)
    : 0;

  return {
    totalTrades,
    completedTrades,
    successfulTrades,
    failedTrades,
    expiredTrades,
    incompleteTrades,
    successRate,
    totalProfitLoss,
    averageProfit,
    averageLoss,
    largestWin,
    largestLoss,
    winLossRatio
  };
}
