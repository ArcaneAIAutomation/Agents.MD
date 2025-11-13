/**
 * Historical Data API Route for ATGE
 * 
 * Fetches historical OHLCV data, runs backtesting, and stores results.
 * 
 * Requirements: 6.1-6.20, 4.1-4.15
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { query, queryOne } from '../../../lib/db';
import { fetchHistoricalData, storeHistoricalPrices } from '../../../lib/atge/historicalData';
import { runBacktest, TradeSignal, BacktestResult } from '../../../lib/atge/backtesting';

// ============================================================================
// TYPES
// ============================================================================

interface HistoricalDataRequest {
  tradeSignalId: string;
}

interface HistoricalDataResponse {
  success: boolean;
  tradeSignalId: string;
  result?: BacktestResult;
  error?: string;
}

// ============================================================================
// API HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HistoricalDataResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      tradeSignalId: '',
      error: 'Method not allowed'
    });
  }

  try {
    // Parse request body
    const { tradeSignalId } = req.body as HistoricalDataRequest;

    if (!tradeSignalId) {
      return res.status(400).json({
        success: false,
        tradeSignalId: '',
        error: 'Missing tradeSignalId'
      });
    }

    console.log(`[HistoricalData API] Processing trade ${tradeSignalId}`);

    // Fetch trade signal from database
    const tradeSignal = await fetchTradeSignal(tradeSignalId);

    if (!tradeSignal) {
      return res.status(404).json({
        success: false,
        tradeSignalId,
        error: 'Trade signal not found'
      });
    }

    // Check if trade has already been backtested
    const existingResult = await checkExistingResult(tradeSignalId);
    if (existingResult) {
      console.log(`[HistoricalData API] Trade ${tradeSignalId} already backtested`);
      return res.status(200).json({
        success: true,
        tradeSignalId,
        result: existingResult
      });
    }

    // Determine resolution based on timeframe
    const resolution = getResolution(tradeSignal.timeframe);

    // Fetch historical OHLCV data
    console.log(`[HistoricalData API] Fetching historical data for ${tradeSignal.symbol}`);
    const historicalDataResponse = await fetchHistoricalData({
      symbol: tradeSignal.symbol,
      startTime: tradeSignal.generatedAt,
      endTime: tradeSignal.expiresAt,
      resolution
    }, 1); // Priority 1 for API-triggered requests

    // Store historical prices in database
    await storeHistoricalPrices(
      tradeSignalId,
      historicalDataResponse.data,
      historicalDataResponse.source
    );

    // Run backtesting analysis
    console.log(`[HistoricalData API] Running backtesting for trade ${tradeSignalId}`);
    const backtestResult = runBacktest(
      tradeSignal,
      historicalDataResponse.data,
      historicalDataResponse.source,
      historicalDataResponse.resolution,
      historicalDataResponse.dataQualityScore
    );

    // Store results in database
    await storeBacktestResult(tradeSignalId, backtestResult);

    // Update trade status
    await updateTradeStatus(tradeSignalId, backtestResult.status);

    console.log(`[HistoricalData API] Completed backtesting for trade ${tradeSignalId}: ${backtestResult.status}`);

    return res.status(200).json({
      success: true,
      tradeSignalId,
      result: backtestResult
    });

  } catch (error) {
    console.error('[HistoricalData API] Error:', error);
    
    return res.status(500).json({
      success: false,
      tradeSignalId: req.body?.tradeSignalId || '',
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

// ============================================================================
// DATABASE FUNCTIONS
// ============================================================================

async function fetchTradeSignal(tradeSignalId: string): Promise<TradeSignal | null> {
  const result = await queryOne(
    `SELECT 
      id,
      symbol,
      entry_price,
      tp1_price,
      tp1_allocation,
      tp2_price,
      tp2_allocation,
      tp3_price,
      tp3_allocation,
      stop_loss_price,
      stop_loss_percentage,
      timeframe,
      generated_at,
      expires_at
    FROM trade_signals
    WHERE id = $1`,
    [tradeSignalId]
  );

  if (!result) {
    return null;
  }

  return {
    id: result.id,
    symbol: result.symbol,
    entryPrice: parseFloat(result.entry_price),
    tp1Price: parseFloat(result.tp1_price),
    tp1Allocation: parseFloat(result.tp1_allocation),
    tp2Price: parseFloat(result.tp2_price),
    tp2Allocation: parseFloat(result.tp2_allocation),
    tp3Price: parseFloat(result.tp3_price),
    tp3Allocation: parseFloat(result.tp3_allocation),
    stopLossPrice: parseFloat(result.stop_loss_price),
    stopLossPercentage: parseFloat(result.stop_loss_percentage),
    timeframe: result.timeframe,
    generatedAt: new Date(result.generated_at),
    expiresAt: new Date(result.expires_at)
  };
}

async function checkExistingResult(tradeSignalId: string): Promise<BacktestResult | null> {
  const result = await queryOne(
    `SELECT 
      actual_entry_price,
      actual_exit_price,
      tp1_hit,
      tp1_hit_at,
      tp1_hit_price,
      tp2_hit,
      tp2_hit_at,
      tp2_hit_price,
      tp3_hit,
      tp3_hit_at,
      tp3_hit_price,
      stop_loss_hit,
      stop_loss_hit_at,
      stop_loss_hit_price,
      profit_loss_usd,
      profit_loss_percentage,
      trade_duration_minutes,
      trade_size_usd,
      fees_usd,
      slippage_usd,
      net_profit_loss_usd,
      data_source,
      data_resolution,
      data_quality_score
    FROM trade_results
    WHERE trade_signal_id = $1`,
    [tradeSignalId]
  );

  if (!result) {
    return null;
  }

  // Determine status based on results
  let status: 'completed_success' | 'completed_failure' | 'expired' | 'incomplete_data';
  if (result.data_quality_score === 0) {
    status = 'incomplete_data';
  } else if (result.stop_loss_hit) {
    status = 'completed_failure';
  } else if (result.tp1_hit || result.tp2_hit || result.tp3_hit) {
    status = 'completed_success';
  } else {
    status = 'expired';
  }

  return {
    actualEntryPrice: parseFloat(result.actual_entry_price),
    actualExitPrice: parseFloat(result.actual_exit_price),
    tp1Hit: {
      hit: result.tp1_hit,
      hitAt: result.tp1_hit_at ? new Date(result.tp1_hit_at) : undefined,
      hitPrice: result.tp1_hit_price ? parseFloat(result.tp1_hit_price) : undefined
    },
    tp2Hit: {
      hit: result.tp2_hit,
      hitAt: result.tp2_hit_at ? new Date(result.tp2_hit_at) : undefined,
      hitPrice: result.tp2_hit_price ? parseFloat(result.tp2_hit_price) : undefined
    },
    tp3Hit: {
      hit: result.tp3_hit,
      hitAt: result.tp3_hit_at ? new Date(result.tp3_hit_at) : undefined,
      hitPrice: result.tp3_hit_price ? parseFloat(result.tp3_hit_price) : undefined
    },
    stopLossHit: {
      hit: result.stop_loss_hit,
      hitAt: result.stop_loss_hit_at ? new Date(result.stop_loss_hit_at) : undefined,
      hitPrice: result.stop_loss_hit_price ? parseFloat(result.stop_loss_hit_price) : undefined
    },
    profitLossUsd: parseFloat(result.profit_loss_usd),
    profitLossPercentage: parseFloat(result.profit_loss_percentage),
    tradeDurationMinutes: parseInt(result.trade_duration_minutes),
    tradeSizeUsd: parseFloat(result.trade_size_usd),
    feesUsd: parseFloat(result.fees_usd),
    slippageUsd: parseFloat(result.slippage_usd),
    netProfitLossUsd: parseFloat(result.net_profit_loss_usd),
    dataSource: result.data_source,
    dataResolution: result.data_resolution,
    dataQualityScore: parseInt(result.data_quality_score),
    status
  };
}

async function storeBacktestResult(
  tradeSignalId: string,
  result: BacktestResult
): Promise<void> {
  await query(
    `INSERT INTO trade_results (
      trade_signal_id,
      actual_entry_price,
      actual_exit_price,
      tp1_hit,
      tp1_hit_at,
      tp1_hit_price,
      tp2_hit,
      tp2_hit_at,
      tp2_hit_price,
      tp3_hit,
      tp3_hit_at,
      tp3_hit_price,
      stop_loss_hit,
      stop_loss_hit_at,
      stop_loss_hit_price,
      profit_loss_usd,
      profit_loss_percentage,
      trade_duration_minutes,
      trade_size_usd,
      fees_usd,
      slippage_usd,
      net_profit_loss_usd,
      data_source,
      data_resolution,
      data_quality_score
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
      $16, $17, $18, $19, $20, $21, $22, $23, $24, $25
    )
    ON CONFLICT (trade_signal_id) DO UPDATE SET
      actual_entry_price = EXCLUDED.actual_entry_price,
      actual_exit_price = EXCLUDED.actual_exit_price,
      tp1_hit = EXCLUDED.tp1_hit,
      tp1_hit_at = EXCLUDED.tp1_hit_at,
      tp1_hit_price = EXCLUDED.tp1_hit_price,
      tp2_hit = EXCLUDED.tp2_hit,
      tp2_hit_at = EXCLUDED.tp2_hit_at,
      tp2_hit_price = EXCLUDED.tp2_hit_price,
      tp3_hit = EXCLUDED.tp3_hit,
      tp3_hit_at = EXCLUDED.tp3_hit_at,
      tp3_hit_price = EXCLUDED.tp3_hit_price,
      stop_loss_hit = EXCLUDED.stop_loss_hit,
      stop_loss_hit_at = EXCLUDED.stop_loss_hit_at,
      stop_loss_hit_price = EXCLUDED.stop_loss_hit_price,
      profit_loss_usd = EXCLUDED.profit_loss_usd,
      profit_loss_percentage = EXCLUDED.profit_loss_percentage,
      trade_duration_minutes = EXCLUDED.trade_duration_minutes,
      trade_size_usd = EXCLUDED.trade_size_usd,
      fees_usd = EXCLUDED.fees_usd,
      slippage_usd = EXCLUDED.slippage_usd,
      net_profit_loss_usd = EXCLUDED.net_profit_loss_usd,
      data_source = EXCLUDED.data_source,
      data_resolution = EXCLUDED.data_resolution,
      data_quality_score = EXCLUDED.data_quality_score,
      backtested_at = NOW()`,
    [
      tradeSignalId,
      result.actualEntryPrice,
      result.actualExitPrice,
      result.tp1Hit.hit,
      result.tp1Hit.hitAt || null,
      result.tp1Hit.hitPrice || null,
      result.tp2Hit.hit,
      result.tp2Hit.hitAt || null,
      result.tp2Hit.hitPrice || null,
      result.tp3Hit.hit,
      result.tp3Hit.hitAt || null,
      result.tp3Hit.hitPrice || null,
      result.stopLossHit.hit,
      result.stopLossHit.hitAt || null,
      result.stopLossHit.hitPrice || null,
      result.profitLossUsd,
      result.profitLossPercentage,
      result.tradeDurationMinutes,
      result.tradeSizeUsd,
      result.feesUsd,
      result.slippageUsd,
      result.netProfitLossUsd,
      result.dataSource,
      result.dataResolution,
      result.dataQualityScore
    ]
  );

  console.log(`[HistoricalData API] Stored backtest result for trade ${tradeSignalId}`);
}

async function updateTradeStatus(
  tradeSignalId: string,
  status: 'completed_success' | 'completed_failure' | 'expired' | 'incomplete_data'
): Promise<void> {
  await query(
    `UPDATE trade_signals
    SET status = $1, updated_at = NOW()
    WHERE id = $2`,
    [status, tradeSignalId]
  );

  console.log(`[HistoricalData API] Updated trade ${tradeSignalId} status to ${status}`);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getResolution(timeframe: string): '1m' | '5m' | '1h' {
  // Determine best resolution based on timeframe
  switch (timeframe) {
    case '1h':
      return '1m'; // 1-minute data for 1-hour trades
    case '4h':
      return '5m'; // 5-minute data for 4-hour trades
    case '1d':
      return '1h'; // 1-hour data for 1-day trades
    case '1w':
      return '1h'; // 1-hour data for 1-week trades
    default:
      return '1m';
  }
}
