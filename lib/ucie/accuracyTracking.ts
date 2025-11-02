/**
 * Historical Accuracy Tracking System
 * 
 * Tracks consensus signals over time and compares them to actual price movements
 * to calculate win rates, average returns, and Sharpe ratios.
 */

import { query } from '../db';

export interface ConsensusSignal {
  id?: number;
  symbol: string;
  timestamp: string;
  recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  overallScore: number;
  confidence: number;
  priceAtSignal: number;
  shortTermScore: number;
  mediumTermScore: number;
  longTermScore: number;
}

export interface SignalOutcome {
  signalId: number;
  symbol: string;
  signalTimestamp: string;
  recommendation: string;
  priceAtSignal: number;
  priceAfter7d?: number;
  priceAfter30d?: number;
  priceAfter90d?: number;
  return7d?: number;
  return30d?: number;
  return90d?: number;
  correct7d?: boolean;
  correct30d?: boolean;
  correct90d?: boolean;
  evaluatedAt: string;
}

export interface AccuracyMetrics {
  totalSignals: number;
  winRate7d: number;
  winRate30d: number;
  winRate90d: number;
  avgReturn7d: number;
  avgReturn30d: number;
  avgReturn90d: number;
  sharpeRatio7d: number;
  sharpeRatio30d: number;
  sharpeRatio90d: number;
  byRecommendation: {
    strong_buy: { count: number; winRate: number; avgReturn: number };
    buy: { count: number; winRate: number; avgReturn: number };
    hold: { count: number; winRate: number; avgReturn: number };
    sell: { count: number; winRate: number; avgReturn: number };
    strong_sell: { count: number; winRate: number; avgReturn: number };
  };
}

/**
 * Store a consensus signal in the database
 */
export async function storeConsensusSignal(signal: ConsensusSignal): Promise<number> {
  try {
    const result = await query(
      `INSERT INTO ucie_consensus_signals 
       (symbol, timestamp, recommendation, overall_score, confidence, price_at_signal, 
        short_term_score, medium_term_score, long_term_score)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        signal.symbol,
        signal.timestamp,
        signal.recommendation,
        signal.overallScore,
        signal.confidence,
        signal.priceAtSignal,
        signal.shortTermScore,
        signal.mediumTermScore,
        signal.longTermScore,
      ]
    );

    return result.rows[0].id;
  } catch (error) {
    console.error('Error storing consensus signal:', error);
    throw error;
  }
}

/**
 * Fetch historical signals for a symbol
 */
export async function getHistoricalSignals(
  symbol: string,
  limit: number = 100
): Promise<ConsensusSignal[]> {
  try {
    const result = await query(
      `SELECT id, symbol, timestamp, recommendation, overall_score, confidence, 
              price_at_signal, short_term_score, medium_term_score, long_term_score
       FROM ucie_consensus_signals
       WHERE symbol = $1
       ORDER BY timestamp DESC
       LIMIT $2`,
      [symbol, limit]
    );

    return result.rows.map((row) => ({
      id: row.id,
      symbol: row.symbol,
      timestamp: row.timestamp,
      recommendation: row.recommendation,
      overallScore: row.overall_score,
      confidence: row.confidence,
      priceAtSignal: row.price_at_signal,
      shortTermScore: row.short_term_score,
      mediumTermScore: row.medium_term_score,
      longTermScore: row.long_term_score,
    }));
  } catch (error) {
    console.error('Error fetching historical signals:', error);
    return [];
  }
}

/**
 * Update signal outcomes with actual price movements
 */
export async function updateSignalOutcomes(
  signalId: number,
  priceAfter7d?: number,
  priceAfter30d?: number,
  priceAfter90d?: number
): Promise<void> {
  try {
    // Get the original signal
    const signalResult = await query(
      `SELECT recommendation, price_at_signal FROM ucie_consensus_signals WHERE id = $1`,
      [signalId]
    );

    if (signalResult.rows.length === 0) {
      throw new Error(`Signal ${signalId} not found`);
    }

    const { recommendation, price_at_signal } = signalResult.rows[0];

    // Calculate returns
    const return7d = priceAfter7d ? ((priceAfter7d - price_at_signal) / price_at_signal) * 100 : null;
    const return30d = priceAfter30d ? ((priceAfter30d - price_at_signal) / price_at_signal) * 100 : null;
    const return90d = priceAfter90d ? ((priceAfter90d - price_at_signal) / price_at_signal) * 100 : null;

    // Determine if signal was correct
    const correct7d = return7d !== null ? isSignalCorrect(recommendation, return7d) : null;
    const correct30d = return30d !== null ? isSignalCorrect(recommendation, return30d) : null;
    const correct90d = return90d !== null ? isSignalCorrect(recommendation, return90d) : null;

    // Store or update outcome
    await query(
      `INSERT INTO ucie_signal_outcomes 
       (signal_id, price_after_7d, price_after_30d, price_after_90d, 
        return_7d, return_30d, return_90d, correct_7d, correct_30d, correct_90d, evaluated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
       ON CONFLICT (signal_id) 
       DO UPDATE SET 
         price_after_7d = COALESCE($2, ucie_signal_outcomes.price_after_7d),
         price_after_30d = COALESCE($3, ucie_signal_outcomes.price_after_30d),
         price_after_90d = COALESCE($4, ucie_signal_outcomes.price_after_90d),
         return_7d = COALESCE($5, ucie_signal_outcomes.return_7d),
         return_30d = COALESCE($6, ucie_signal_outcomes.return_30d),
         return_90d = COALESCE($7, ucie_signal_outcomes.return_90d),
         correct_7d = COALESCE($8, ucie_signal_outcomes.correct_7d),
         correct_30d = COALESCE($9, ucie_signal_outcomes.correct_30d),
         correct_90d = COALESCE($10, ucie_signal_outcomes.correct_90d),
         evaluated_at = NOW()`,
      [signalId, priceAfter7d, priceAfter30d, priceAfter90d, return7d, return30d, return90d, correct7d, correct30d, correct90d]
    );
  } catch (error) {
    console.error('Error updating signal outcomes:', error);
    throw error;
  }
}

/**
 * Determine if a signal was correct based on the return
 */
function isSignalCorrect(recommendation: string, returnPercent: number): boolean {
  switch (recommendation) {
    case 'strong_buy':
    case 'buy':
      return returnPercent > 0; // Positive return for buy signals
    case 'sell':
    case 'strong_sell':
      return returnPercent < 0; // Negative return for sell signals
    case 'hold':
      return Math.abs(returnPercent) < 5; // Within 5% for hold signals
    default:
      return false;
  }
}

/**
 * Calculate accuracy metrics for a symbol or all symbols
 */
export async function calculateAccuracyMetrics(symbol?: string): Promise<AccuracyMetrics> {
  try {
    const whereClause = symbol ? 'WHERE s.symbol = $1' : '';
    const params = symbol ? [symbol] : [];

    const result = await query(
      `SELECT 
         s.recommendation,
         o.return_7d,
         o.return_30d,
         o.return_90d,
         o.correct_7d,
         o.correct_30d,
         o.correct_90d
       FROM ucie_consensus_signals s
       JOIN ucie_signal_outcomes o ON s.id = o.signal_id
       ${whereClause}
       ORDER BY s.timestamp DESC`,
      params
    );

    const outcomes = result.rows;

    if (outcomes.length === 0) {
      return getEmptyMetrics();
    }

    // Calculate overall metrics
    const totalSignals = outcomes.length;

    // Win rates
    const correct7d = outcomes.filter((o) => o.correct_7d === true).length;
    const correct30d = outcomes.filter((o) => o.correct_30d === true).length;
    const correct90d = outcomes.filter((o) => o.correct_90d === true).length;

    const winRate7d = (correct7d / totalSignals) * 100;
    const winRate30d = (correct30d / totalSignals) * 100;
    const winRate90d = (correct90d / totalSignals) * 100;

    // Average returns
    const returns7d = outcomes.filter((o) => o.return_7d !== null).map((o) => o.return_7d);
    const returns30d = outcomes.filter((o) => o.return_30d !== null).map((o) => o.return_30d);
    const returns90d = outcomes.filter((o) => o.return_90d !== null).map((o) => o.return_90d);

    const avgReturn7d = returns7d.length > 0 ? returns7d.reduce((a, b) => a + b, 0) / returns7d.length : 0;
    const avgReturn30d = returns30d.length > 0 ? returns30d.reduce((a, b) => a + b, 0) / returns30d.length : 0;
    const avgReturn90d = returns90d.length > 0 ? returns90d.reduce((a, b) => a + b, 0) / returns90d.length : 0;

    // Sharpe ratios (assuming risk-free rate of 0 for simplicity)
    const sharpeRatio7d = calculateSharpeRatio(returns7d);
    const sharpeRatio30d = calculateSharpeRatio(returns30d);
    const sharpeRatio90d = calculateSharpeRatio(returns90d);

    // Metrics by recommendation type
    const byRecommendation = calculateMetricsByRecommendation(outcomes);

    return {
      totalSignals,
      winRate7d,
      winRate30d,
      winRate90d,
      avgReturn7d,
      avgReturn30d,
      avgReturn90d,
      sharpeRatio7d,
      sharpeRatio30d,
      sharpeRatio90d,
      byRecommendation,
    };
  } catch (error) {
    console.error('Error calculating accuracy metrics:', error);
    return getEmptyMetrics();
  }
}

/**
 * Calculate Sharpe ratio for a set of returns
 */
function calculateSharpeRatio(returns: number[]): number {
  if (returns.length < 2) return 0;

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) return 0;

  // Annualize the Sharpe ratio (assuming daily returns)
  return (mean / stdDev) * Math.sqrt(365);
}

/**
 * Calculate metrics broken down by recommendation type
 */
function calculateMetricsByRecommendation(outcomes: any[]): AccuracyMetrics['byRecommendation'] {
  const recommendations = ['strong_buy', 'buy', 'hold', 'sell', 'strong_sell'];
  const result: any = {};

  for (const rec of recommendations) {
    const filtered = outcomes.filter((o) => o.recommendation === rec);
    const count = filtered.length;

    if (count === 0) {
      result[rec] = { count: 0, winRate: 0, avgReturn: 0 };
      continue;
    }

    const correct30d = filtered.filter((o) => o.correct_30d === true).length;
    const winRate = (correct30d / count) * 100;

    const returns = filtered.filter((o) => o.return_30d !== null).map((o) => o.return_30d);
    const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;

    result[rec] = { count, winRate, avgReturn };
  }

  return result;
}

/**
 * Get empty metrics structure
 */
function getEmptyMetrics(): AccuracyMetrics {
  return {
    totalSignals: 0,
    winRate7d: 0,
    winRate30d: 0,
    winRate90d: 0,
    avgReturn7d: 0,
    avgReturn30d: 0,
    avgReturn90d: 0,
    sharpeRatio7d: 0,
    sharpeRatio30d: 0,
    sharpeRatio90d: 0,
    byRecommendation: {
      strong_buy: { count: 0, winRate: 0, avgReturn: 0 },
      buy: { count: 0, winRate: 0, avgReturn: 0 },
      hold: { count: 0, winRate: 0, avgReturn: 0 },
      sell: { count: 0, winRate: 0, avgReturn: 0 },
      strong_sell: { count: 0, winRate: 0, avgReturn: 0 },
    },
  };
}

/**
 * Get signals that need outcome updates (7, 30, or 90 days old)
 */
export async function getSignalsNeedingUpdate(): Promise<ConsensusSignal[]> {
  try {
    const result = await query(
      `SELECT s.id, s.symbol, s.timestamp, s.recommendation, s.overall_score, 
              s.confidence, s.price_at_signal, s.short_term_score, 
              s.medium_term_score, s.long_term_score
       FROM ucie_consensus_signals s
       LEFT JOIN ucie_signal_outcomes o ON s.id = o.signal_id
       WHERE 
         (o.signal_id IS NULL AND s.timestamp <= NOW() - INTERVAL '7 days')
         OR (o.price_after_7d IS NULL AND s.timestamp <= NOW() - INTERVAL '7 days')
         OR (o.price_after_30d IS NULL AND s.timestamp <= NOW() - INTERVAL '30 days')
         OR (o.price_after_90d IS NULL AND s.timestamp <= NOW() - INTERVAL '90 days')
       ORDER BY s.timestamp ASC
       LIMIT 100`
    );

    return result.rows.map((row) => ({
      id: row.id,
      symbol: row.symbol,
      timestamp: row.timestamp,
      recommendation: row.recommendation,
      overallScore: row.overall_score,
      confidence: row.confidence,
      priceAtSignal: row.price_at_signal,
      shortTermScore: row.short_term_score,
      mediumTermScore: row.medium_term_score,
      longTermScore: row.long_term_score,
    }));
  } catch (error) {
    console.error('Error fetching signals needing update:', error);
    return [];
  }
}

/**
 * Database schema for consensus signals and outcomes
 * 
 * Run this SQL to create the required tables:
 * 
 * CREATE TABLE IF NOT EXISTS ucie_consensus_signals (
 *   id SERIAL PRIMARY KEY,
 *   symbol VARCHAR(20) NOT NULL,
 *   timestamp TIMESTAMP NOT NULL,
 *   recommendation VARCHAR(20) NOT NULL,
 *   overall_score INTEGER NOT NULL,
 *   confidence INTEGER NOT NULL,
 *   price_at_signal DECIMAL(20, 8) NOT NULL,
 *   short_term_score INTEGER NOT NULL,
 *   medium_term_score INTEGER NOT NULL,
 *   long_term_score INTEGER NOT NULL,
 *   created_at TIMESTAMP DEFAULT NOW()
 * );
 * 
 * CREATE INDEX idx_consensus_signals_symbol ON ucie_consensus_signals(symbol);
 * CREATE INDEX idx_consensus_signals_timestamp ON ucie_consensus_signals(timestamp);
 * 
 * CREATE TABLE IF NOT EXISTS ucie_signal_outcomes (
 *   signal_id INTEGER PRIMARY KEY REFERENCES ucie_consensus_signals(id),
 *   price_after_7d DECIMAL(20, 8),
 *   price_after_30d DECIMAL(20, 8),
 *   price_after_90d DECIMAL(20, 8),
 *   return_7d DECIMAL(10, 4),
 *   return_30d DECIMAL(10, 4),
 *   return_90d DECIMAL(10, 4),
 *   correct_7d BOOLEAN,
 *   correct_30d BOOLEAN,
 *   correct_90d BOOLEAN,
 *   evaluated_at TIMESTAMP NOT NULL
 * );
 */
