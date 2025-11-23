/**
 * ATGE Trade Verification API Route
 * Bitcoin Sovereign Technology - AI Trade Generation Engine
 * 
 * Verifies all active trades against live market data
 * Updates trade status when targets are hit
 * Calculates profit/loss for completed trades
 * 
 * Requirements: 1.2, 1.3, 1.4
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth';
import { query } from '../../../lib/db';
import { getMarketData } from '../../../lib/atge/marketData';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface VerificationSummary {
  success: boolean;
  totalTrades: number;
  verified: number;
  updated: number;
  failed: number;
  errors: string[];
  timestamp: string;
}

interface ActiveTrade {
  id: string;
  symbol: string;
  entryPrice: number;
  tp1Price: number;
  tp2Price: number;
  tp3Price: number;
  stopLossPrice: number;
  expiresAt: Date;
  status: string;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

async function handler(req: AuthenticatedRequest, res: NextApiResponse<VerificationSummary>) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      totalTrades: 0,
      verified: 0,
      updated: 0,
      failed: 0,
      errors: ['Method not allowed'],
      timestamp: new Date().toISOString()
    });
  }

  console.log('[ATGE Verify] Starting trade verification...');

  try {
    // Fetch all active trades from database
    const activeTrades = await fetchActiveTrades();
    
    console.log(`[ATGE Verify] Found ${activeTrades.length} active trades`);

    if (activeTrades.length === 0) {
      return res.status(200).json({
        success: true,
        totalTrades: 0,
        verified: 0,
        updated: 0,
        failed: 0,
        errors: [],
        timestamp: new Date().toISOString()
      });
    }

    // Verify each trade
    let verified = 0;
    let updated = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const trade of activeTrades) {
      try {
        // Check if trade has expired
        if (new Date() > trade.expiresAt) {
          await updateTradeToExpired(trade.id);
          updated++;
          verified++;
          console.log(`[ATGE Verify] Trade ${trade.id} expired`);
          continue;
        }

        // Fetch current market price
        const marketData = await fetchMarketPrice(trade.symbol);
        
        if (!marketData) {
          failed++;
          errors.push(`Failed to fetch price for ${trade.symbol} (trade ${trade.id})`);
          console.error(`[ATGE Verify] Failed to fetch price for ${trade.symbol}`);
          continue;
        }

        // Validate price data
        if (!validatePriceData(marketData)) {
          failed++;
          errors.push(`Invalid price data for ${trade.symbol} (trade ${trade.id})`);
          console.error(`[ATGE Verify] Invalid price data for ${trade.symbol}`);
          continue;
        }

        // Check if any targets were hit
        const targetHit = await checkTargets(trade, marketData.currentPrice, marketData.source);
        
        if (targetHit) {
          updated++;
        }
        
        verified++;

      } catch (error) {
        failed++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Error verifying trade ${trade.id}: ${errorMsg}`);
        console.error(`[ATGE Verify] Error verifying trade ${trade.id}:`, error);
      }
    }

    console.log(`[ATGE Verify] Verification complete: ${verified} verified, ${updated} updated, ${failed} failed`);

    return res.status(200).json({
      success: true,
      totalTrades: activeTrades.length,
      verified,
      updated,
      failed,
      errors,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[ATGE Verify] Fatal error:', error);
    
    return res.status(500).json({
      success: false,
      totalTrades: 0,
      verified: 0,
      updated: 0,
      failed: 0,
      errors: [error instanceof Error ? error.message : 'Internal server error'],
      timestamp: new Date().toISOString()
    });
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Fetch all active trades from database
 */
async function fetchActiveTrades(): Promise<ActiveTrade[]> {
  const result = await query(`
    SELECT 
      id,
      symbol,
      entry_price,
      tp1_price,
      tp2_price,
      tp3_price,
      stop_loss_price,
      expires_at,
      status
    FROM trade_signals
    WHERE status = 'active'
    ORDER BY generated_at ASC
  `);

  return result.rows.map(row => ({
    id: row.id,
    symbol: row.symbol,
    entryPrice: parseFloat(row.entry_price),
    tp1Price: parseFloat(row.tp1_price),
    tp2Price: parseFloat(row.tp2_price),
    tp3Price: parseFloat(row.tp3_price),
    stopLossPrice: parseFloat(row.stop_loss_price),
    expiresAt: new Date(row.expires_at),
    status: row.status
  }));
}

/**
 * Fetch current market price with fallback
 * Returns null if both APIs fail (no fallback data)
 */
async function fetchMarketPrice(symbol: string): Promise<{ currentPrice: number; source: string; timestamp: Date } | null> {
  try {
    // Try CoinMarketCap first
    const marketData = await getMarketData(symbol, true); // Force refresh for verification
    
    return {
      currentPrice: marketData.currentPrice,
      source: marketData.source,
      timestamp: marketData.timestamp
    };
  } catch (error) {
    console.error(`[ATGE Verify] Both CoinMarketCap and CoinGecko failed for ${symbol}:`, error);
    
    // Return null - DO NOT use fallback data (Requirement 1.3)
    return null;
  }
}

/**
 * Validate price data quality
 * Requirements: 1.3
 * - Timestamp within 5 minutes
 * - Price spread < 3% (checked in getMarketData)
 */
function validatePriceData(data: { currentPrice: number; timestamp: Date }): boolean {
  // Check if price is valid
  if (!data.currentPrice || data.currentPrice <= 0) {
    return false;
  }

  // Check if timestamp is within last 5 minutes
  const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
  if (data.timestamp.getTime() < fiveMinutesAgo) {
    console.warn('[ATGE Verify] Price data is stale (older than 5 minutes)');
    return false;
  }

  return true;
}

/**
 * Check if any targets were hit and update database
 * Returns true if any target was hit
 * Requirements: 1.2
 */
async function checkTargets(
  trade: ActiveTrade,
  currentPrice: number,
  dataSource: string
): Promise<boolean> {
  let targetHit = false;

  // Fetch existing trade results to check what's already been hit
  const existingResults = await query(
    'SELECT tp1_hit, tp2_hit, tp3_hit, stop_loss_hit FROM trade_results WHERE trade_signal_id = $1',
    [trade.id]
  );

  const alreadyHit = existingResults.rows.length > 0 ? existingResults.rows[0] : {
    tp1_hit: false,
    tp2_hit: false,
    tp3_hit: false,
    stop_loss_hit: false
  };

  // Check Stop Loss first (highest priority)
  // Requirement 1.2: Check if current price <= stop loss
  if (!alreadyHit.stop_loss_hit && currentPrice <= trade.stopLossPrice) {
    await updateTradeResult(trade.id, 'stop_loss', currentPrice, dataSource);
    await updateTradeStatus(trade.id, 'completed_failure');
    console.log(`[ATGE Verify] Trade ${trade.id} hit stop loss at ${currentPrice}`);
    return true;
  }

  // Check TP3 (highest profit target)
  // Requirement 1.2: Check if current price >= TP3
  if (!alreadyHit.tp3_hit && currentPrice >= trade.tp3Price) {
    await updateTradeResult(trade.id, 'tp3', currentPrice, dataSource);
    await updateTradeStatus(trade.id, 'completed_success');
    console.log(`[ATGE Verify] Trade ${trade.id} hit TP3 at ${currentPrice}`);
    return true;
  }

  // Check TP2
  // Requirement 1.2: Check if current price >= TP2
  if (!alreadyHit.tp2_hit && currentPrice >= trade.tp2Price) {
    await updateTradeResult(trade.id, 'tp2', currentPrice, dataSource);
    // Don't change status yet - trade is still active for TP3
    console.log(`[ATGE Verify] Trade ${trade.id} hit TP2 at ${currentPrice}`);
    targetHit = true;
  }

  // Check TP1
  // Requirement 1.2: Check if current price >= TP1
  if (!alreadyHit.tp1_hit && currentPrice >= trade.tp1Price) {
    await updateTradeResult(trade.id, 'tp1', currentPrice, dataSource);
    // Don't change status yet - trade is still active for TP2/TP3
    console.log(`[ATGE Verify] Trade ${trade.id} hit TP1 at ${currentPrice}`);
    targetHit = true;
  }

  return targetHit;
}

/**
 * Update trade result when target is hit
 * Requirements: 1.2 - Record timestamp and price for each target hit
 */
async function updateTradeResult(
  tradeId: string,
  target: 'tp1' | 'tp2' | 'tp3' | 'stop_loss',
  hitPrice: number,
  dataSource: string
): Promise<void> {
  const now = new Date();

  // Check if trade_results record exists
  const existingResult = await query(
    'SELECT id FROM trade_results WHERE trade_signal_id = $1',
    [tradeId]
  );

  if (existingResult.rows.length === 0) {
    // Create new trade_results record with the hit target
    // Requirement 1.2: Record timestamp and price for target hit
    await query(`
      INSERT INTO trade_results (
        trade_signal_id,
        ${target}_hit,
        ${target}_hit_at,
        ${target}_hit_price,
        data_source,
        data_resolution,
        data_quality_score,
        trade_size_usd,
        fees_paid,
        slippage_cost,
        last_verified_at,
        verification_data_source
      )
      VALUES (
        $1,
        true,
        $2,
        $3,
        $4,
        'live',
        100,
        1000.00,
        2.00,
        2.00,
        $2,
        $4
      )
    `, [tradeId, now, hitPrice, dataSource]);
    
    console.log(`[ATGE Verify] Created trade_results record for trade ${tradeId} with ${target} hit`);
  } else {
    // Update existing record with the new target hit
    // Requirement 1.2: Record timestamp and price for target hit
    await query(`
      UPDATE trade_results
      SET
        ${target}_hit = true,
        ${target}_hit_at = $1,
        ${target}_hit_price = $2,
        last_verified_at = $1,
        verification_data_source = $3
      WHERE trade_signal_id = $4
    `, [now, hitPrice, dataSource, tradeId]);
    
    console.log(`[ATGE Verify] Updated trade_results for trade ${tradeId}: ${target} hit at ${hitPrice}`);
  }

  // Calculate and update P/L if this is a final target (TP3 or stop_loss)
  if (target === 'tp3' || target === 'stop_loss') {
    await calculateAndUpdateProfitLoss(tradeId, hitPrice, dataSource);
  }
}

/**
 * Calculate profit/loss and update trade_results
 * Requirements: 1.2
 * - Calculate P/L in USD based on hit price and entry price
 * - Calculate P/L percentage
 * - Store in trade_results.net_profit_loss and profit_loss_percentage
 * - Include data source in verification_data_source
 * - Include timestamp in last_verified_at
 */
async function calculateAndUpdateProfitLoss(
  tradeId: string,
  exitPrice: number,
  dataSource: string
): Promise<void> {
  // Fetch trade signal data and existing trade results
  const tradeData = await query(
    'SELECT entry_price FROM trade_signals WHERE id = $1',
    [tradeId]
  );

  if (tradeData.rows.length === 0) {
    console.error(`[ATGE Verify] Trade ${tradeId} not found`);
    return;
  }

  const entryPrice = parseFloat(tradeData.rows[0].entry_price);
  
  // Fetch trade size from trade_results (or use default)
  const resultsData = await query(
    'SELECT trade_size_usd, fees_paid, slippage_cost FROM trade_results WHERE trade_signal_id = $1',
    [tradeId]
  );
  
  const tradeSizeUsd = resultsData.rows.length > 0 
    ? parseFloat(resultsData.rows[0].trade_size_usd) 
    : 1000.00; // Default $1000 trade size
  
  const feesPaid = resultsData.rows.length > 0 
    ? parseFloat(resultsData.rows[0].fees_paid) 
    : 2.00; // Default 0.2% total fees (0.1% entry + 0.1% exit)
  
  const slippageCost = resultsData.rows.length > 0 
    ? parseFloat(resultsData.rows[0].slippage_cost) 
    : 2.00; // Default 0.2% total slippage (0.1% entry + 0.1% exit)
  
  // Calculate P/L percentage
  // Requirement 1.2: Calculate P/L percentage
  const profitLossPercentage = ((exitPrice - entryPrice) / entryPrice) * 100;
  
  // Calculate gross P/L in USD
  // Requirement 1.2: Calculate P/L in USD based on hit price and entry price
  const grossProfitLoss = tradeSizeUsd * (profitLossPercentage / 100);
  
  // Calculate net P/L (after fees and slippage)
  // Requirement 1.2: Store in trade_results.net_profit_loss
  const netProfitLoss = grossProfitLoss - feesPaid - slippageCost;
  
  const now = new Date();

  // Update trade_results with P/L calculations
  // Requirement 1.2: Store in trade_results.net_profit_loss and profit_loss_percentage
  // Requirement 1.2: Include data source in verification_data_source
  // Requirement 1.2: Include timestamp in last_verified_at
  await query(`
    UPDATE trade_results
    SET
      gross_profit_loss = $1,
      net_profit_loss = $2,
      profit_loss_percentage = $3,
      last_verified_at = $4,
      verification_data_source = $5
    WHERE trade_signal_id = $6
  `, [
    grossProfitLoss,
    netProfitLoss,
    profitLossPercentage,
    now,
    dataSource,
    tradeId
  ]);

  console.log(`[ATGE Verify] Updated P/L for trade ${tradeId}:`);
  console.log(`  - Entry: $${entryPrice.toFixed(2)}, Exit: $${exitPrice.toFixed(2)}`);
  console.log(`  - Gross P/L: $${grossProfitLoss.toFixed(2)} (${profitLossPercentage.toFixed(2)}%)`);
  console.log(`  - Fees: $${feesPaid.toFixed(2)}, Slippage: $${slippageCost.toFixed(2)}`);
  console.log(`  - Net P/L: $${netProfitLoss.toFixed(2)}`);
  console.log(`  - Data Source: ${dataSource}`);
  console.log(`  - Verified At: ${now.toISOString()}`);
}

/**
 * Update trade status based on which target was hit
 * Requirements: 1.2 - Update trade_signals.status based on which target was hit
 */
async function updateTradeStatus(
  tradeId: string,
  status: 'completed_success' | 'completed_failure' | 'expired'
): Promise<void> {
  await query(`
    UPDATE trade_signals
    SET status = $1, updated_at = NOW()
    WHERE id = $2
  `, [status, tradeId]);
  
  console.log(`[ATGE Verify] Updated trade ${tradeId} status to: ${status}`);
}

/**
 * Mark trade as expired
 * Requirements: 1.2 - Check if trade expired (based on expires_at), update status to "expired"
 */
async function updateTradeToExpired(tradeId: string): Promise<void> {
  await updateTradeStatus(tradeId, 'expired');
  
  // Also update trade_results to mark as expired
  const existingResult = await query(
    'SELECT id FROM trade_results WHERE trade_signal_id = $1',
    [tradeId]
  );
  
  if (existingResult.rows.length === 0) {
    // Create trade_results record for expired trade
    await query(`
      INSERT INTO trade_results (
        trade_signal_id,
        actual_entry_price,
        data_source,
        data_resolution,
        data_quality_score,
        trade_size_usd,
        fees_usd,
        slippage_usd,
        last_verified_at,
        verification_data_source,
        backtested_at
      )
      SELECT
        $1,
        entry_price,
        'system',
        'live',
        100,
        1000,
        0,
        0,
        NOW(),
        'system',
        NOW()
      FROM trade_signals
      WHERE id = $1
    `, [tradeId]);
  } else {
    // Update existing record
    await query(`
      UPDATE trade_results
      SET
        last_verified_at = NOW(),
        verification_data_source = 'system'
      WHERE trade_signal_id = $1
    `, [tradeId]);
  }
  
  console.log(`[ATGE Verify] Trade ${tradeId} marked as expired`);
}

// ============================================================================
// EXPORT
// ============================================================================

export default withAuth(handler);
