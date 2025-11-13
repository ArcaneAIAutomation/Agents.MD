/**
 * Expired Trades Checker for ATGE
 * 
 * Background job that runs every 5 minutes to check for expired trades
 * and trigger backtesting for them.
 * 
 * Requirements: 5.7, 5.8, 5.20
 */

import { queryMany } from '../db';

// ============================================================================
// TYPES
// ============================================================================

interface ExpiredTrade {
  id: string;
  symbol: string;
  timeframe: string;
  generatedAt: Date;
  expiresAt: Date;
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Check for expired trades and trigger backtesting
 * This function should be called by a cron job every 5 minutes
 */
export async function checkExpiredTrades(): Promise<{
  checked: number;
  triggered: number;
  errors: number;
}> {
  console.log('[ExpiredTradesChecker] Starting expired trades check...');

  try {
    // Query database for trades that have expired but not been backtested
    const expiredTrades = await findExpiredTrades();

    console.log(`[ExpiredTradesChecker] Found ${expiredTrades.length} expired trades`);

    if (expiredTrades.length === 0) {
      return {
        checked: 0,
        triggered: 0,
        errors: 0
      };
    }

    // Trigger backtesting for each expired trade
    let triggered = 0;
    let errors = 0;

    for (const trade of expiredTrades) {
      try {
        await triggerBacktesting(trade);
        triggered++;
        console.log(`[ExpiredTradesChecker] Triggered backtesting for trade ${trade.id}`);
      } catch (error) {
        errors++;
        console.error(`[ExpiredTradesChecker] Failed to trigger backtesting for trade ${trade.id}:`, error);
      }
    }

    console.log(`[ExpiredTradesChecker] Completed: ${triggered} triggered, ${errors} errors`);

    return {
      checked: expiredTrades.length,
      triggered,
      errors
    };

  } catch (error) {
    console.error('[ExpiredTradesChecker] Error during expired trades check:', error);
    throw error;
  }
}

// ============================================================================
// DATABASE FUNCTIONS
// ============================================================================

async function findExpiredTrades(): Promise<ExpiredTrade[]> {
  // Find trades that:
  // 1. Have status 'active' (not yet completed)
  // 2. Have expired (expires_at < NOW())
  // 3. Don't have a result in trade_results table
  const result = await queryMany(
    `SELECT 
      ts.id,
      ts.symbol,
      ts.timeframe,
      ts.generated_at,
      ts.expires_at
    FROM trade_signals ts
    LEFT JOIN trade_results tr ON ts.id = tr.trade_signal_id
    WHERE ts.status = 'active'
      AND ts.expires_at < NOW()
      AND tr.id IS NULL
    ORDER BY ts.expires_at ASC
    LIMIT 50`, // Process max 50 trades per run
    []
  );

  return result.map(row => ({
    id: row.id,
    symbol: row.symbol,
    timeframe: row.timeframe,
    generatedAt: new Date(row.generated_at),
    expiresAt: new Date(row.expires_at)
  }));
}

// ============================================================================
// BACKTESTING TRIGGER
// ============================================================================

async function triggerBacktesting(trade: ExpiredTrade): Promise<void> {
  // Call the historical data API endpoint to trigger backtesting
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const endpoint = `${apiUrl}/api/atge/historical-data`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tradeSignalId: trade.id
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to trigger backtesting: ${response.status} ${error}`);
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(`Backtesting failed: ${result.error}`);
  }

  console.log(`[ExpiredTradesChecker] Backtesting completed for trade ${trade.id}: ${result.result?.status}`);
}

/**
 * Get statistics about expired trades
 */
export async function getExpiredTradesStats(): Promise<{
  totalExpired: number;
  pendingBacktest: number;
  completedBacktest: number;
}> {
  const result = await queryMany(
    `SELECT 
      COUNT(*) FILTER (WHERE ts.expires_at < NOW()) as total_expired,
      COUNT(*) FILTER (WHERE ts.expires_at < NOW() AND tr.id IS NULL) as pending_backtest,
      COUNT(*) FILTER (WHERE ts.expires_at < NOW() AND tr.id IS NOT NULL) as completed_backtest
    FROM trade_signals ts
    LEFT JOIN trade_results tr ON ts.id = tr.trade_signal_id
    WHERE ts.status = 'active'`,
    []
  );

  const row = result[0] || { total_expired: 0, pending_backtest: 0, completed_backtest: 0 };

  return {
    totalExpired: parseInt(row.total_expired || '0'),
    pendingBacktest: parseInt(row.pending_backtest || '0'),
    completedBacktest: parseInt(row.completed_backtest || '0')
  };
}
