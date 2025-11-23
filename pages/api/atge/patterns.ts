/**
 * ATGE Pattern Recognition API Route
 * Bitcoin Sovereign Technology - AI Trade Generation Engine
 * 
 * Analyzes completed trades to identify patterns in winning vs losing trades
 * Groups trades by outcome and provides statistical analysis
 * 
 * Requirements: 3.2
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth';
import { query } from '../../../lib/db';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface PatternAnalysisResponse {
  success: boolean;
  data?: {
    summary: {
      totalTrades: number;
      winningTrades: number;
      losingTrades: number;
      expiredTrades: number;
      winRate: number;
    };
    patterns: {
      successFactors: Pattern[];
      failureFactors: Pattern[];
    };
    winningTrades: TradeOutcome[];
    losingTrades: TradeOutcome[];
    expiredTrades: TradeOutcome[];
  };
  error?: string;
}

interface Pattern {
  indicator: string;
  condition: string;
  occurrenceInWinning: number;
  occurrenceInLosing: number;
  winningPercentage: number;
  losingPercentage: number;
  predictivePower: number; // Correlation with outcome
  pValue: number; // Statistical significance
  isSignificant: boolean; // p-value < 0.05
  confidence: number; // 0-100 confidence level
}

interface TradeOutcome {
  id: string;
  symbol: string;
  entryPrice: number;
  exitPrice: number | null;
  netProfitLoss: number | null;
  profitLossPercentage: number | null;
  status: string;
  generatedAt: Date;
  completedAt: Date | null;
  // Technical indicators at time of trade
  rsi?: number;
  macd?: number;
  ema20?: number;
  ema50?: number;
  ema200?: number;
  // Target hits
  tp1Hit: boolean;
  tp2Hit: boolean;
  tp3Hit: boolean;
  stopLossHit: boolean;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

async function handler(req: AuthenticatedRequest, res: NextApiResponse<PatternAnalysisResponse>) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  console.log('[ATGE Patterns] Starting pattern recognition analysis...');

  try {
    // Fetch all completed trades from database
    // Requirement 3.2: Query trade_signals and trade_results for completed trades
    const completedTrades = await fetchCompletedTrades();
    
    console.log(`[ATGE Patterns] Found ${completedTrades.length} completed trades`);

    if (completedTrades.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          summary: {
            totalTrades: 0,
            winningTrades: 0,
            losingTrades: 0,
            expiredTrades: 0,
            winRate: 0
          },
          winningTrades: [],
          losingTrades: [],
          expiredTrades: []
        }
      });
    }

    // Group trades by outcome
    // Requirement 3.2: Group trades by outcome: winning (net_profit_loss > 0), losing (net_profit_loss <= 0), expired (status = 'expired')
    const { winningTrades, losingTrades, expiredTrades } = groupTradesByOutcome(completedTrades);

    // Calculate summary statistics
    const totalTrades = completedTrades.length;
    const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;

    console.log(`[ATGE Patterns] Analysis complete:`);
    console.log(`  - Total: ${totalTrades}`);
    console.log(`  - Winning: ${winningTrades.length} (${winRate.toFixed(2)}%)`);
    console.log(`  - Losing: ${losingTrades.length}`);
    console.log(`  - Expired: ${expiredTrades.length}`);

    // Requirement 3.2: Analyze patterns in winning vs losing trades
    console.log('[ATGE Patterns] Analyzing indicator patterns...');
    const patterns = analyzePatterns(winningTrades, losingTrades);
    
    console.log(`[ATGE Patterns] Found ${patterns.successFactors.length} success factors`);
    console.log(`[ATGE Patterns] Found ${patterns.failureFactors.length} failure factors`);

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalTrades,
          winningTrades: winningTrades.length,
          losingTrades: losingTrades.length,
          expiredTrades: expiredTrades.length,
          winRate: parseFloat(winRate.toFixed(2))
        },
        patterns,
        winningTrades,
        losingTrades,
        expiredTrades
      }
    });

  } catch (error) {
    console.error('[ATGE Patterns] Error:', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Fetch all completed trades from database
 * Joins trade_signals with trade_results to get complete trade data
 * Requirements: 3.2 - Query trade_signals and trade_results for completed trades
 */
async function fetchCompletedTrades(): Promise<TradeOutcome[]> {
  const result = await query(`
    SELECT 
      ts.id,
      ts.symbol,
      ts.entry_price,
      ts.status,
      ts.generated_at,
      ts.rsi,
      ts.macd,
      ts.ema_20,
      ts.ema_50,
      ts.ema_200,
      tr.actual_exit_price as exit_price,
      tr.net_profit_loss,
      tr.profit_loss_percentage,
      tr.tp1_hit,
      tr.tp2_hit,
      tr.tp3_hit,
      tr.stop_loss_hit,
      tr.backtested_at as completed_at
    FROM trade_signals ts
    LEFT JOIN trade_results tr ON ts.id = tr.trade_signal_id
    WHERE ts.status IN ('completed_success', 'completed_failure', 'expired')
    ORDER BY ts.generated_at DESC
  `);

  return result.rows.map(row => ({
    id: row.id,
    symbol: row.symbol,
    entryPrice: parseFloat(row.entry_price),
    exitPrice: row.exit_price ? parseFloat(row.exit_price) : null,
    netProfitLoss: row.net_profit_loss ? parseFloat(row.net_profit_loss) : null,
    profitLossPercentage: row.profit_loss_percentage ? parseFloat(row.profit_loss_percentage) : null,
    status: row.status,
    generatedAt: new Date(row.generated_at),
    completedAt: row.completed_at ? new Date(row.completed_at) : null,
    rsi: row.rsi ? parseFloat(row.rsi) : undefined,
    macd: row.macd ? parseFloat(row.macd) : undefined,
    ema20: row.ema_20 ? parseFloat(row.ema_20) : undefined,
    ema50: row.ema_50 ? parseFloat(row.ema_50) : undefined,
    ema200: row.ema_200 ? parseFloat(row.ema_200) : undefined,
    tp1Hit: row.tp1_hit || false,
    tp2Hit: row.tp2_hit || false,
    tp3Hit: row.tp3_hit || false,
    stopLossHit: row.stop_loss_hit || false
  }));
}

/**
 * Group trades by outcome
 * Requirements: 3.2 - Group trades by outcome: winning (net_profit_loss > 0), losing (net_profit_loss <= 0), expired (status = 'expired')
 */
function groupTradesByOutcome(trades: TradeOutcome[]): {
  winningTrades: TradeOutcome[];
  losingTrades: TradeOutcome[];
  expiredTrades: TradeOutcome[];
} {
  const winningTrades: TradeOutcome[] = [];
  const losingTrades: TradeOutcome[] = [];
  const expiredTrades: TradeOutcome[] = [];

  for (const trade of trades) {
    // Requirement 3.2: Group by outcome
    if (trade.status === 'expired') {
      // Expired trades (never hit any target)
      expiredTrades.push(trade);
    } else if (trade.netProfitLoss !== null) {
      if (trade.netProfitLoss > 0) {
        // Winning trades (net_profit_loss > 0)
        winningTrades.push(trade);
      } else {
        // Losing trades (net_profit_loss <= 0)
        losingTrades.push(trade);
      }
    } else {
      // If net_profit_loss is null but status is completed, treat as losing
      if (trade.status === 'completed_failure') {
        losingTrades.push(trade);
      } else if (trade.status === 'completed_success') {
        // This shouldn't happen, but if it does, treat as winning
        winningTrades.push(trade);
      }
    }
  }

  return {
    winningTrades,
    losingTrades,
    expiredTrades
  };
}

/**
 * Analyze patterns in winning vs losing trades
 * Requirements: 3.2 - Analyze winning/losing trades for common indicators and calculate statistical significance
 */
function analyzePatterns(
  winningTrades: TradeOutcome[],
  losingTrades: TradeOutcome[]
): {
  successFactors: Pattern[];
  failureFactors: Pattern[];
} {
  const allPatterns: Pattern[] = [];

  // Requirement 3.2: Analyze winning trades for common indicators: RSI ranges, MACD signals, EMA trends
  // Requirement 3.2: Analyze losing trades for common risk factors: RSI ranges, MACD signals, market conditions

  // RSI Patterns
  allPatterns.push(...analyzeRSIPatterns(winningTrades, losingTrades));

  // MACD Patterns
  allPatterns.push(...analyzeMACDPatterns(winningTrades, losingTrades));

  // EMA Patterns
  allPatterns.push(...analyzeEMAPatterns(winningTrades, losingTrades));

  // Requirement 3.2: Calculate statistical significance using chi-square test (p-value < 0.05)
  // Filter for statistically significant patterns
  const significantPatterns = allPatterns.filter(p => p.isSignificant);

  // Requirement 3.2: Rank patterns by predictive power (correlation with outcome)
  const rankedPatterns = significantPatterns.sort((a, b) => b.predictivePower - a.predictivePower);

  // Separate into success factors (higher in winning) and failure factors (higher in losing)
  const successFactors = rankedPatterns.filter(p => p.winningPercentage > p.losingPercentage).slice(0, 5);
  const failureFactors = rankedPatterns.filter(p => p.losingPercentage > p.winningPercentage).slice(0, 5);

  return {
    successFactors,
    failureFactors
  };
}

/**
 * Analyze RSI patterns
 * Requirement 3.2: Analyze RSI ranges in winning vs losing trades
 */
function analyzeRSIPatterns(
  winningTrades: TradeOutcome[],
  losingTrades: TradeOutcome[]
): Pattern[] {
  const patterns: Pattern[] = [];

  // RSI ranges to analyze
  const rsiRanges = [
    { name: 'RSI < 30 (Oversold)', min: 0, max: 30 },
    { name: 'RSI 30-40 (Weak)', min: 30, max: 40 },
    { name: 'RSI 40-60 (Neutral)', min: 40, max: 60 },
    { name: 'RSI 60-70 (Strong)', min: 60, max: 70 },
    { name: 'RSI > 70 (Overbought)', min: 70, max: 100 }
  ];

  for (const range of rsiRanges) {
    const winningWithRSI = winningTrades.filter(t => t.rsi !== undefined);
    const losingWithRSI = losingTrades.filter(t => t.rsi !== undefined);

    if (winningWithRSI.length === 0 && losingWithRSI.length === 0) continue;

    const winningInRange = winningWithRSI.filter(t => t.rsi! >= range.min && t.rsi! < range.max).length;
    const losingInRange = losingWithRSI.filter(t => t.rsi! >= range.min && t.rsi! < range.max).length;

    const winningPercentage = winningWithRSI.length > 0 ? (winningInRange / winningWithRSI.length) * 100 : 0;
    const losingPercentage = losingWithRSI.length > 0 ? (losingInRange / losingWithRSI.length) * 100 : 0;

    // Calculate chi-square test
    const { pValue, isSignificant } = calculateChiSquare(
      winningInRange,
      winningWithRSI.length - winningInRange,
      losingInRange,
      losingWithRSI.length - losingInRange
    );

    // Calculate predictive power (absolute difference in percentages)
    const predictivePower = Math.abs(winningPercentage - losingPercentage);

    // Calculate confidence (inverse of p-value, capped at 100)
    const confidence = Math.min(100, (1 - pValue) * 100);

    patterns.push({
      indicator: 'RSI',
      condition: range.name,
      occurrenceInWinning: winningInRange,
      occurrenceInLosing: losingInRange,
      winningPercentage: parseFloat(winningPercentage.toFixed(2)),
      losingPercentage: parseFloat(losingPercentage.toFixed(2)),
      predictivePower: parseFloat(predictivePower.toFixed(2)),
      pValue: parseFloat(pValue.toFixed(4)),
      isSignificant,
      confidence: parseFloat(confidence.toFixed(2))
    });
  }

  return patterns;
}

/**
 * Analyze MACD patterns
 * Requirement 3.2: Analyze MACD signals in winning vs losing trades
 */
function analyzeMACDPatterns(
  winningTrades: TradeOutcome[],
  losingTrades: TradeOutcome[]
): Pattern[] {
  const patterns: Pattern[] = [];

  // MACD conditions to analyze
  const macdConditions = [
    { name: 'MACD Strongly Negative (< -2)', test: (macd: number) => macd < -2 },
    { name: 'MACD Negative (-2 to 0)', test: (macd: number) => macd >= -2 && macd < 0 },
    { name: 'MACD Neutral (0 to 2)', test: (macd: number) => macd >= 0 && macd < 2 },
    { name: 'MACD Positive (2 to 5)', test: (macd: number) => macd >= 2 && macd < 5 },
    { name: 'MACD Strongly Positive (> 5)', test: (macd: number) => macd >= 5 }
  ];

  for (const condition of macdConditions) {
    const winningWithMACD = winningTrades.filter(t => t.macd !== undefined);
    const losingWithMACD = losingTrades.filter(t => t.macd !== undefined);

    if (winningWithMACD.length === 0 && losingWithMACD.length === 0) continue;

    const winningInCondition = winningWithMACD.filter(t => condition.test(t.macd!)).length;
    const losingInCondition = losingWithMACD.filter(t => condition.test(t.macd!)).length;

    const winningPercentage = winningWithMACD.length > 0 ? (winningInCondition / winningWithMACD.length) * 100 : 0;
    const losingPercentage = losingWithMACD.length > 0 ? (losingInCondition / losingWithMACD.length) * 100 : 0;

    const { pValue, isSignificant } = calculateChiSquare(
      winningInCondition,
      winningWithMACD.length - winningInCondition,
      losingInCondition,
      losingWithMACD.length - losingInCondition
    );

    const predictivePower = Math.abs(winningPercentage - losingPercentage);
    const confidence = Math.min(100, (1 - pValue) * 100);

    patterns.push({
      indicator: 'MACD',
      condition: condition.name,
      occurrenceInWinning: winningInCondition,
      occurrenceInLosing: losingInCondition,
      winningPercentage: parseFloat(winningPercentage.toFixed(2)),
      losingPercentage: parseFloat(losingPercentage.toFixed(2)),
      predictivePower: parseFloat(predictivePower.toFixed(2)),
      pValue: parseFloat(pValue.toFixed(4)),
      isSignificant,
      confidence: parseFloat(confidence.toFixed(2))
    });
  }

  return patterns;
}

/**
 * Analyze EMA patterns
 * Requirement 3.2: Analyze EMA trends in winning vs losing trades
 */
function analyzeEMAPatterns(
  winningTrades: TradeOutcome[],
  losingTrades: TradeOutcome[]
): Pattern[] {
  const patterns: Pattern[] = [];

  // EMA trend conditions to analyze
  const emaConditions = [
    {
      name: 'Price Above EMA20',
      test: (t: TradeOutcome) => t.ema20 !== undefined && t.entryPrice > t.ema20
    },
    {
      name: 'Price Below EMA20',
      test: (t: TradeOutcome) => t.ema20 !== undefined && t.entryPrice < t.ema20
    },
    {
      name: 'EMA20 > EMA50 (Bullish)',
      test: (t: TradeOutcome) => t.ema20 !== undefined && t.ema50 !== undefined && t.ema20 > t.ema50
    },
    {
      name: 'EMA20 < EMA50 (Bearish)',
      test: (t: TradeOutcome) => t.ema20 !== undefined && t.ema50 !== undefined && t.ema20 < t.ema50
    },
    {
      name: 'EMA50 > EMA200 (Long-term Bullish)',
      test: (t: TradeOutcome) => t.ema50 !== undefined && t.ema200 !== undefined && t.ema50 > t.ema200
    },
    {
      name: 'EMA50 < EMA200 (Long-term Bearish)',
      test: (t: TradeOutcome) => t.ema50 !== undefined && t.ema200 !== undefined && t.ema50 < t.ema200
    }
  ];

  for (const condition of emaConditions) {
    const winningInCondition = winningTrades.filter(condition.test).length;
    const losingInCondition = losingTrades.filter(condition.test).length;

    const winningPercentage = winningTrades.length > 0 ? (winningInCondition / winningTrades.length) * 100 : 0;
    const losingPercentage = losingTrades.length > 0 ? (losingInCondition / losingTrades.length) * 100 : 0;

    const { pValue, isSignificant } = calculateChiSquare(
      winningInCondition,
      winningTrades.length - winningInCondition,
      losingInCondition,
      losingTrades.length - losingInCondition
    );

    const predictivePower = Math.abs(winningPercentage - losingPercentage);
    const confidence = Math.min(100, (1 - pValue) * 100);

    patterns.push({
      indicator: 'EMA',
      condition: condition.name,
      occurrenceInWinning: winningInCondition,
      occurrenceInLosing: losingInCondition,
      winningPercentage: parseFloat(winningPercentage.toFixed(2)),
      losingPercentage: parseFloat(losingPercentage.toFixed(2)),
      predictivePower: parseFloat(predictivePower.toFixed(2)),
      pValue: parseFloat(pValue.toFixed(4)),
      isSignificant,
      confidence: parseFloat(confidence.toFixed(2))
    });
  }

  return patterns;
}

/**
 * Calculate chi-square test for statistical significance
 * Requirement 3.2: Calculate statistical significance using chi-square test (p-value < 0.05)
 * 
 * @param a11 - Count in group 1 with condition
 * @param a12 - Count in group 1 without condition
 * @param a21 - Count in group 2 with condition
 * @param a22 - Count in group 2 without condition
 * @returns Object with pValue and isSignificant (p < 0.05)
 */
function calculateChiSquare(
  a11: number,
  a12: number,
  a21: number,
  a22: number
): { pValue: number; isSignificant: boolean } {
  // Total counts
  const n1 = a11 + a12; // Total in group 1
  const n2 = a21 + a22; // Total in group 2
  const m1 = a11 + a21; // Total with condition
  const m2 = a12 + a22; // Total without condition
  const n = n1 + n2;    // Grand total

  // Handle edge cases
  if (n === 0 || n1 === 0 || n2 === 0 || m1 === 0 || m2 === 0) {
    return { pValue: 1.0, isSignificant: false };
  }

  // Expected frequencies
  const e11 = (n1 * m1) / n;
  const e12 = (n1 * m2) / n;
  const e21 = (n2 * m1) / n;
  const e22 = (n2 * m2) / n;

  // Chi-square statistic
  const chiSquare = 
    Math.pow(a11 - e11, 2) / e11 +
    Math.pow(a12 - e12, 2) / e12 +
    Math.pow(a21 - e21, 2) / e21 +
    Math.pow(a22 - e22, 2) / e22;

  // Degrees of freedom = 1 for 2x2 contingency table
  const df = 1;

  // Approximate p-value using chi-square distribution
  // For df=1, we can use a simplified approximation
  const pValue = approximateChiSquarePValue(chiSquare, df);

  // Requirement 3.2: p-value < 0.05 indicates statistical significance
  const isSignificant = pValue < 0.05;

  return { pValue, isSignificant };
}

/**
 * Approximate p-value for chi-square distribution
 * Uses a simplified approximation for df=1
 */
function approximateChiSquarePValue(chiSquare: number, df: number): number {
  if (df !== 1) {
    // For simplicity, only handle df=1 case
    // For other df values, return a conservative estimate
    return 0.5;
  }

  // For df=1, use lookup table approximation
  // Critical values for chi-square with df=1:
  // p=0.10: 2.706
  // p=0.05: 3.841
  // p=0.01: 6.635
  // p=0.001: 10.828

  if (chiSquare < 2.706) return 0.10;
  if (chiSquare < 3.841) return 0.05;
  if (chiSquare < 6.635) return 0.01;
  if (chiSquare < 10.828) return 0.001;
  return 0.0001; // Very significant
}

// ============================================================================
// EXPORT
// ============================================================================

export default withAuth(handler);
