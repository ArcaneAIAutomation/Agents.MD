/**
 * ATGE Trade Verification Cron API Endpoint
 * Bitcoin Sovereign Technology - AI Trade Generation Engine
 * 
 * This endpoint is called by Vercel Cron Jobs to verify all active trades hourly.
 * 
 * Vercel Cron Configuration (vercel.json):
 *   {
 *     "crons": [{
 *       "path": "/api/cron/atge-verify-trades",
 *       "schedule": "0 * * * *"
 *     }]
 *   }
 * 
 * Schedule: Every hour at minute 0
 * Requirements: 2.1
 */

import type { NextApiRequest, NextApiResponse } from 'next';
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
  retryAttempt?: number;
}

interface CronResponse {
  success: boolean;
  message: string;
  verification?: VerificationSummary;
  retryScheduled?: boolean;
  error?: string;
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
// SECURITY MIDDLEWARE
// ============================================================================

/**
 * Verify the request is from Vercel Cron
 * Requirements: 2.1 - Verify CRON_SECRET header matches environment variable
 * 
 * @param req - Next.js API request
 * @returns True if authorized
 */
function isAuthorizedCronRequest(req: NextApiRequest): boolean {
  // In production, Vercel Cron sends a special header
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization;
  
  // If CRON_SECRET is set, verify it matches
  // Requirements: 2.1 - Verify CRON_SECRET header matches environment variable
  if (cronSecret) {
    return authHeader === `Bearer ${cronSecret}`;
  }
  
  // In development, allow requests without auth
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  
  // Check for Vercel Cron user agent
  const userAgent = req.headers['user-agent'] || '';
  if (userAgent.includes('vercel-cron')) {
    return true;
  }
  
  return false;
}

// ============================================================================
// API HANDLER
// ============================================================================

/**
 * Handle ATGE trade verification cron job
 * Requirements: 2.1
 * 
 * @param req - Next.js API request
 * @param res - Next.js API response
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CronResponse>
) {
  // Only allow POST and GET requests
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }
  
  // Verify authorization
  // Requirements: 2.1 - Verify CRON_SECRET header matches environment variable
  if (!isAuthorizedCronRequest(req)) {
    console.warn('⚠️ [ATGE Cron] Unauthorized cron request attempt');
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
  }
  
  console.log('🔄 [ATGE Cron] Trade verification cron job triggered');
  
  try {
    // Call verification logic internally
    // Requirements: 2.1 - Call /api/atge/verify-trades logic internally
    const verificationResult = await verifyAllTrades();
    
    // Requirements: 2.1 - Log verification summary to console
    console.log('📊 [ATGE Cron] Verification summary:', {
      totalTrades: verificationResult.totalTrades,
      verified: verificationResult.verified,
      updated: verificationResult.updated,
      failed: verificationResult.failed,
      errors: verificationResult.errors.length,
      timestamp: verificationResult.timestamp
    });
    
    // If verification failed completely, schedule retry
    // Requirements: 2.1 - Implement retry logic (once after 5 minutes if first attempt fails)
    if (!verificationResult.success && verificationResult.totalTrades > 0) {
      console.warn('⚠️ [ATGE Cron] Verification failed, scheduling retry in 5 minutes');
      
      // Schedule retry (in production, this would be handled by a separate mechanism)
      // For now, we'll attempt immediate retry if this is the first attempt
      const isRetry = req.query.retry === 'true';
      
      if (!isRetry) {
        // Wait 5 minutes and retry
        console.log('⏳ [ATGE Cron] Waiting 5 minutes before retry...');
        await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
        
        console.log('🔄 [ATGE Cron] Retrying verification...');
        const retryResult = await verifyAllTrades();
        
        // Requirements: 2.1 - Log verification summary to console
        console.log('📊 [ATGE Cron] Retry verification summary:', {
          totalTrades: retryResult.totalTrades,
          verified: retryResult.verified,
          updated: retryResult.updated,
          failed: retryResult.failed,
          errors: retryResult.errors.length,
          timestamp: retryResult.timestamp
        });
        
        // Requirements: 2.1 - Return JSON with verification results
        return res.status(200).json({
          success: retryResult.success,
          message: retryResult.success 
            ? `Verification succeeded on retry: ${retryResult.verified} trades verified, ${retryResult.updated} updated`
            : `Verification failed after retry: ${retryResult.failed} failures`,
          verification: {
            ...retryResult,
            retryAttempt: 1
          },
          retryScheduled: false
        });
      }
    }
    
    // Requirements: 2.1 - Return JSON with verification results
    return res.status(200).json({
      success: verificationResult.success,
      message: verificationResult.success
        ? `Successfully verified ${verificationResult.verified} trades, ${verificationResult.updated} updated`
        : `Verification completed with ${verificationResult.failed} failures`,
      verification: verificationResult,
      retryScheduled: false
    });
    
  } catch (error) {
    console.error('❌ [ATGE Cron] Trade verification failed:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Trade verification failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// ============================================================================
// VERIFICATION LOGIC (Internal)
// ============================================================================

/**
 * Verify all active trades
 * This is the core logic from /api/atge/verify-trades
 * Requirements: 2.1 - Call /api/atge/verify-trades logic internally
 */
async function verifyAllTrades(): Promise<VerificationSummary> {
  console.log('[ATGE Cron] Starting trade verification...');

  try {
    // Fetch all active trades from database
    const activeTrades = await fetchActiveTrades();
    
    console.log(`[ATGE Cron] Found ${activeTrades.length} active trades`);

    if (activeTrades.length === 0) {
      return {
        success: true,
        totalTrades: 0,
        verified: 0,
        updated: 0,
        failed: 0,
        errors: [],
        timestamp: new Date().toISOString()
      };
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
          console.log(`[ATGE Cron] Trade ${trade.id} expired`);
          continue;
        }

        // Fetch current market price
        const marketData = await fetchMarketPrice(trade.symbol);
        
        if (!marketData) {
          failed++;
          errors.push(`Failed to fetch price for ${trade.symbol} (trade ${trade.id})`);
          console.error(`[ATGE Cron] Failed to fetch price for ${trade.symbol}`);
          continue;
        }

        // Validate price data
        if (!validatePriceData(marketData)) {
          failed++;
          errors.push(`Invalid price data for ${trade.symbol} (trade ${trade.id})`);
          console.error(`[ATGE Cron] Invalid price data for ${trade.symbol}`);
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
        console.error(`[ATGE Cron] Error verifying trade ${trade.id}:`, error);
      }
    }

    console.log(`[ATGE Cron] Verification complete: ${verified} verified, ${updated} updated, ${failed} failed`);

    return {
      success: failed === 0 || verified > 0,
      totalTrades: activeTrades.length,
      verified,
      updated,
      failed,
      errors,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('[ATGE Cron] Fatal error:', error);
    
    return {
      success: false,
      totalTrades: 0,
      verified: 0,
      updated: 0,
      failed: 0,
      errors: [error instanceof Error ? error.message : 'Internal server error'],
      timestamp: new Date().toISOString()
    };
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
    console.error(`[ATGE Cron] Both CoinMarketCap and CoinGecko failed for ${symbol}:`, error);
    
    // Return null - DO NOT use fallback data
    return null;
  }
}

/**
 * Validate price data quality
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
    console.warn('[ATGE Cron] Price data is stale (older than 5 minutes)');
    return false;
  }

  return true;
}

/**
 * Check if any targets were hit and update database
 * Returns true if any target was hit
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
  if (!alreadyHit.stop_loss_hit && currentPrice <= trade.stopLossPrice) {
    await updateTradeResult(trade.id, 'stop_loss', currentPrice, dataSource);
    await updateTradeStatus(trade.id, 'completed_failure');
    console.log(`[ATGE Cron] Trade ${trade.id} hit stop loss at ${currentPrice}`);
    return true;
  }

  // Check TP3 (highest profit target)
  if (!alreadyHit.tp3_hit && currentPrice >= trade.tp3Price) {
    await updateTradeResult(trade.id, 'tp3', currentPrice, dataSource);
    await updateTradeStatus(trade.id, 'completed_success');
    console.log(`[ATGE Cron] Trade ${trade.id} hit TP3 at ${currentPrice}`);
    return true;
  }

  // Check TP2
  if (!alreadyHit.tp2_hit && currentPrice >= trade.tp2Price) {
    await updateTradeResult(trade.id, 'tp2', currentPrice, dataSource);
    console.log(`[ATGE Cron] Trade ${trade.id} hit TP2 at ${currentPrice}`);
    targetHit = true;
  }

  // Check TP1
  if (!alreadyHit.tp1_hit && currentPrice >= trade.tp1Price) {
    await updateTradeResult(trade.id, 'tp1', currentPrice, dataSource);
    console.log(`[ATGE Cron] Trade ${trade.id} hit TP1 at ${currentPrice}`);
    targetHit = true;
  }

  return targetHit;
}

/**
 * Update trade result when target is hit
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
    
    console.log(`[ATGE Cron] Created trade_results record for trade ${tradeId} with ${target} hit`);
  } else {
    // Update existing record with the new target hit
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
    
    console.log(`[ATGE Cron] Updated trade_results for trade ${tradeId}: ${target} hit at ${hitPrice}`);
  }

  // Calculate and update P/L if this is a final target (TP3 or stop_loss)
  if (target === 'tp3' || target === 'stop_loss') {
    await calculateAndUpdateProfitLoss(tradeId, hitPrice, dataSource);
  }
}

/**
 * Calculate profit/loss and update trade_results
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
    console.error(`[ATGE Cron] Trade ${tradeId} not found`);
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
    : 1000.00;
  
  const feesPaid = resultsData.rows.length > 0 
    ? parseFloat(resultsData.rows[0].fees_paid) 
    : 2.00;
  
  const slippageCost = resultsData.rows.length > 0 
    ? parseFloat(resultsData.rows[0].slippage_cost) 
    : 2.00;
  
  // Calculate P/L percentage
  const profitLossPercentage = ((exitPrice - entryPrice) / entryPrice) * 100;
  
  // Calculate gross P/L in USD
  const grossProfitLoss = tradeSizeUsd * (profitLossPercentage / 100);
  
  // Calculate net P/L (after fees and slippage)
  const netProfitLoss = grossProfitLoss - feesPaid - slippageCost;
  
  const now = new Date();

  // Update trade_results with P/L calculations
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

  console.log(`[ATGE Cron] Updated P/L for trade ${tradeId}: Net P/L ${netProfitLoss.toFixed(2)} (${profitLossPercentage.toFixed(2)}%)`);
}

/**
 * Update trade status based on which target was hit
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
  
  console.log(`[ATGE Cron] Updated trade ${tradeId} status to: ${status}`);
}

/**
 * Mark trade as expired
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
  
  console.log(`[ATGE Cron] Trade ${tradeId} marked as expired`);
}
