/**
 * Quantum BTC Performance Dashboard Endpoint
 * GET /api/quantum/performance-dashboard
 * 
 * Retrieves comprehensive performance metrics for the Quantum BTC trading system.
 * Aggregates data from trades, snapshots, and anomaly logs.
 * 
 * Requirements: 12.1-12.10
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { query, queryOne, queryMany } from '../../../lib/db';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface TradeSignal {
  id: string;
  symbol: string;
  entry_optimal: number;
  tp1_price: number;
  tp2_price: number;
  tp3_price: number;
  stop_loss_price: number;
  timeframe: string;
  confidence_score: number;
  status: string;
  generated_at: string;
  data_quality_score: number;
}

interface PerformanceMetrics {
  success: boolean;
  metrics: {
    totalTrades: number;
    overallAccuracy: number;
    totalProfitLoss: number;
    averageConfidenceWinning: number;
    averageConfidenceLosing: number;
    bestTimeframe: string;
    worstTimeframe: string;
    recentTrades: TradeSignal[];
    dataQualityTrend: number[];
    apiReliability: {
      cmc: number;
      coingecko: number;
      kraken: number;
      blockchain: number;
      lunarcrush: number;
    };
    anomalyCount: number;
  };
}

// ============================================================================
// DATABASE QUERIES
// ============================================================================

async function getTotalTrades(): Promise<number> {
  const result = await queryOne<{ count: string }>(
    'SELECT COUNT(*) as count FROM btc_trades'
  );
  return parseInt(result?.count || '0');
}

async function getOverallAccuracy(): Promise<number> {
  const result = await queryOne<{ accuracy: number }>(
    `SELECT 
      CASE 
        WHEN COUNT(*) = 0 THEN 0
        ELSE (COUNT(*) FILTER (WHERE status = 'HIT') * 100.0 / COUNT(*))
      END as accuracy
    FROM btc_trades
    WHERE status IN ('HIT', 'NOT_HIT', 'INVALIDATED', 'EXPIRED')`
  );
  return result?.accuracy || 0;
}

async function getTotalProfitLoss(): Promise<number> {
  // Assuming $1000 per trade
  // Win = +5% average, Loss = -5% average
  const result = await queryOne<{ hits: string; losses: string }>(
    `SELECT 
      COUNT(*) FILTER (WHERE status = 'HIT') as hits,
      COUNT(*) FILTER (WHERE status IN ('NOT_HIT', 'INVALIDATED')) as losses
    FROM btc_trades
    WHERE status IN ('HIT', 'NOT_HIT', 'INVALIDATED')`
  );
  
  const hits = parseInt(result?.hits || '0');
  const losses = parseInt(result?.losses || '0');
  
  const profitPerWin = 1000 * 0.05; // $50 per win
  const lossPerLoss = 1000 * 0.05; // $50 per loss
  
  return (hits * profitPerWin) - (losses * lossPerLoss);
}

async function getAverageConfidenceWinning(): Promise<number> {
  const result = await queryOne<{ avg_confidence: number }>(
    `SELECT AVG(confidence_score) as avg_confidence
    FROM btc_trades
    WHERE status = 'HIT'`
  );
  return result?.avg_confidence || 0;
}

async function getAverageConfidenceLosing(): Promise<number> {
  const result = await queryOne<{ avg_confidence: number }>(
    `SELECT AVG(confidence_score) as avg_confidence
    FROM btc_trades
    WHERE status IN ('NOT_HIT', 'INVALIDATED')`
  );
  return result?.avg_confidence || 0;
}

async function getBestTimeframe(): Promise<string> {
  const result = await queryOne<{ timeframe: string; accuracy: number }>(
    `SELECT 
      timeframe,
      (COUNT(*) FILTER (WHERE status = 'HIT') * 100.0 / COUNT(*)) as accuracy
    FROM btc_trades
    WHERE status IN ('HIT', 'NOT_HIT', 'INVALIDATED', 'EXPIRED')
    GROUP BY timeframe
    ORDER BY accuracy DESC
    LIMIT 1`
  );
  return result?.timeframe || 'N/A';
}

async function getWorstTimeframe(): Promise<string> {
  const result = await queryOne<{ timeframe: string; accuracy: number }>(
    `SELECT 
      timeframe,
      (COUNT(*) FILTER (WHERE status = 'HIT') * 100.0 / COUNT(*)) as accuracy
    FROM btc_trades
    WHERE status IN ('HIT', 'NOT_HIT', 'INVALIDATED', 'EXPIRED')
    GROUP BY timeframe
    ORDER BY accuracy ASC
    LIMIT 1`
  );
  return result?.timeframe || 'N/A';
}

async function getRecentTrades(limit: number = 10): Promise<TradeSignal[]> {
  const sql = `
    SELECT 
      id, symbol, entry_optimal,
      tp1_price, tp2_price, tp3_price,
      stop_loss_price, timeframe,
      confidence_score, status,
      generated_at, data_quality_score
    FROM btc_trades
    ORDER BY generated_at DESC
    LIMIT $1
  `;
  
  return await queryMany<TradeSignal>(sql, [limit]);
}

async function getDataQualityTrend(days: number = 7): Promise<number[]> {
  const sql = `
    SELECT 
      DATE(generated_at) as date,
      AVG(data_quality_score) as avg_quality
    FROM btc_trades
    WHERE generated_at >= NOW() - INTERVAL '${days} days'
    GROUP BY DATE(generated_at)
    ORDER BY date ASC
  `;
  
  const results = await queryMany<{ date: string; avg_quality: number }>(sql);
  return results.map(r => r.avg_quality);
}

async function getAPIReliability(): Promise<{
  cmc: number;
  coingecko: number;
  kraken: number;
  blockchain: number;
  lunarcrush: number;
}> {
  // TODO: Implement actual API reliability tracking
  // For now, return placeholder values
  return {
    cmc: 98.5,
    coingecko: 97.2,
    kraken: 99.1,
    blockchain: 96.8,
    lunarcrush: 95.3,
  };
}

async function getAnomalyCount(): Promise<number> {
  const result = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count 
    FROM quantum_anomaly_logs
    WHERE detected_at >= NOW() - INTERVAL '7 days'`
  );
  return parseInt(result?.count || '0');
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PerformanceMetrics>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      metrics: {
        totalTrades: 0,
        overallAccuracy: 0,
        totalProfitLoss: 0,
        averageConfidenceWinning: 0,
        averageConfidenceLosing: 0,
        bestTimeframe: 'N/A',
        worstTimeframe: 'N/A',
        recentTrades: [],
        dataQualityTrend: [],
        apiReliability: {
          cmc: 0,
          coingecko: 0,
          kraken: 0,
          blockchain: 0,
          lunarcrush: 0,
        },
        anomalyCount: 0,
      },
    });
  }
  
  try {
    console.log('[Dashboard] Fetching performance metrics');
    
    // Fetch all metrics in parallel
    const [
      totalTrades,
      overallAccuracy,
      totalProfitLoss,
      averageConfidenceWinning,
      averageConfidenceLosing,
      bestTimeframe,
      worstTimeframe,
      recentTrades,
      dataQualityTrend,
      apiReliability,
      anomalyCount,
    ] = await Promise.all([
      getTotalTrades(),
      getOverallAccuracy(),
      getTotalProfitLoss(),
      getAverageConfidenceWinning(),
      getAverageConfidenceLosing(),
      getBestTimeframe(),
      getWorstTimeframe(),
      getRecentTrades(10),
      getDataQualityTrend(7),
      getAPIReliability(),
      getAnomalyCount(),
    ]);
    
    console.log('[Dashboard] Metrics fetched successfully');
    
    return res.status(200).json({
      success: true,
      metrics: {
        totalTrades,
        overallAccuracy: Math.round(overallAccuracy * 100) / 100,
        totalProfitLoss: Math.round(totalProfitLoss * 100) / 100,
        averageConfidenceWinning: Math.round(averageConfidenceWinning * 100) / 100,
        averageConfidenceLosing: Math.round(averageConfidenceLosing * 100) / 100,
        bestTimeframe,
        worstTimeframe,
        recentTrades,
        dataQualityTrend: dataQualityTrend.map(q => Math.round(q * 100) / 100),
        apiReliability,
        anomalyCount,
      },
    });
    
  } catch (error) {
    console.error('[Error] Failed to fetch performance metrics:', error);
    
    return res.status(500).json({
      success: false,
      metrics: {
        totalTrades: 0,
        overallAccuracy: 0,
        totalProfitLoss: 0,
        averageConfidenceWinning: 0,
        averageConfidenceLosing: 0,
        bestTimeframe: 'N/A',
        worstTimeframe: 'N/A',
        recentTrades: [],
        dataQualityTrend: [],
        apiReliability: {
          cmc: 0,
          coingecko: 0,
          kraken: 0,
          blockchain: 0,
          lunarcrush: 0,
        },
        anomalyCount: 0,
      },
    });
  }
}
