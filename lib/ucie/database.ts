/**
 * UCIE Database Access Functions
 * Bitcoin Sovereign Technology - Universal Crypto Intelligence Engine
 * 
 * Provides type-safe database access for UCIE-specific tables:
 * - ucie_watchlist: User token watchlists
 * - ucie_alerts: Custom price and event alerts
 * - ucie_analysis_history: Analysis tracking
 * - ucie_api_costs: API cost tracking
 */

import { query } from '../db';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface WatchlistItem {
  id: string;
  user_id: string;
  symbol: string;
  added_at: string;
}

export interface Alert {
  id: string;
  user_id: string;
  symbol: string;
  alert_type: 'price_above' | 'price_below' | 'sentiment_change' | 'whale_tx';
  threshold: number | null;
  enabled: boolean;
  last_triggered: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnalysisHistoryEntry {
  id: string;
  user_id: string | null;
  symbol: string;
  analysis_type: string;
  data_quality_score: number | null;
  response_time_ms: number | null;
  created_at: string;
}

export interface ApiCostEntry {
  id: string;
  api_name: string;
  endpoint: string;
  cost_usd: number;
  timestamp: string;
  user_id: string | null;
  symbol: string | null;
}

// ============================================================================
// WATCHLIST FUNCTIONS
// ============================================================================

/**
 * Get user's watchlist
 */
export async function getUserWatchlist(userId: string): Promise<WatchlistItem[]> {
  const result = await query<WatchlistItem>(
    `SELECT * FROM ucie_watchlist 
     WHERE user_id = $1 
     ORDER BY added_at DESC`,
    [userId]
  );
  return result.rows;
}

/**
 * Add token to watchlist
 */
export async function addToWatchlist(
  userId: string,
  symbol: string
): Promise<WatchlistItem> {
  const result = await query<WatchlistItem>(
    `INSERT INTO ucie_watchlist (user_id, symbol)
     VALUES ($1, $2)
     ON CONFLICT (user_id, symbol) DO NOTHING
     RETURNING *`,
    [userId, symbol.toUpperCase()]
  );
  return result.rows[0];
}

/**
 * Remove token from watchlist
 */
export async function removeFromWatchlist(
  userId: string,
  symbol: string
): Promise<boolean> {
  const result = await query(
    `DELETE FROM ucie_watchlist 
     WHERE user_id = $1 AND symbol = $2`,
    [userId, symbol.toUpperCase()]
  );
  return result.rowCount > 0;
}

/**
 * Check if token is in watchlist
 */
export async function isInWatchlist(
  userId: string,
  symbol: string
): Promise<boolean> {
  const result = await query<{ exists: boolean }>(
    `SELECT EXISTS(
       SELECT 1 FROM ucie_watchlist 
       WHERE user_id = $1 AND symbol = $2
     )`,
    [userId, symbol.toUpperCase()]
  );
  return result.rows[0]?.exists || false;
}

// ============================================================================
// ALERTS FUNCTIONS
// ============================================================================

/**
 * Get user's alerts
 */
export async function getUserAlerts(userId: string): Promise<Alert[]> {
  const result = await query<Alert>(
    `SELECT * FROM ucie_alerts 
     WHERE user_id = $1 
     ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
}

/**
 * Get active alerts for a symbol
 */
export async function getActiveAlertsForSymbol(symbol: string): Promise<Alert[]> {
  const result = await query<Alert>(
    `SELECT * FROM ucie_alerts 
     WHERE symbol = $1 AND enabled = TRUE`,
    [symbol.toUpperCase()]
  );
  return result.rows;
}

/**
 * Create new alert
 */
export async function createAlert(
  userId: string,
  symbol: string,
  alertType: Alert['alert_type'],
  threshold?: number
): Promise<Alert> {
  const result = await query<Alert>(
    `INSERT INTO ucie_alerts (user_id, symbol, alert_type, threshold)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, symbol.toUpperCase(), alertType, threshold || null]
  );
  return result.rows[0];
}

/**
 * Update alert
 */
export async function updateAlert(
  alertId: string,
  userId: string,
  updates: Partial<Pick<Alert, 'threshold' | 'enabled'>>
): Promise<Alert | null> {
  const setClauses: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (updates.threshold !== undefined) {
    setClauses.push(`threshold = $${paramIndex++}`);
    values.push(updates.threshold);
  }
  if (updates.enabled !== undefined) {
    setClauses.push(`enabled = $${paramIndex++}`);
    values.push(updates.enabled);
  }

  if (setClauses.length === 0) return null;

  setClauses.push(`updated_at = NOW()`);
  values.push(alertId, userId);

  const result = await query<Alert>(
    `UPDATE ucie_alerts 
     SET ${setClauses.join(', ')}
     WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
     RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

/**
 * Delete alert
 */
export async function deleteAlert(alertId: string, userId: string): Promise<boolean> {
  const result = await query(
    `DELETE FROM ucie_alerts 
     WHERE id = $1 AND user_id = $2`,
    [alertId, userId]
  );
  return result.rowCount > 0;
}

/**
 * Mark alert as triggered
 */
export async function triggerAlert(alertId: string): Promise<void> {
  await query(
    `UPDATE ucie_alerts 
     SET last_triggered = NOW() 
     WHERE id = $1`,
    [alertId]
  );
}

// ============================================================================
// ANALYSIS HISTORY FUNCTIONS
// ============================================================================

/**
 * Record analysis in history
 */
export async function recordAnalysis(
  symbol: string,
  analysisType: string,
  dataQualityScore: number,
  responseTimeMs: number,
  userId?: string
): Promise<void> {
  await query(
    `INSERT INTO ucie_analysis_history 
     (user_id, symbol, analysis_type, data_quality_score, response_time_ms)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId || null, symbol.toUpperCase(), analysisType, dataQualityScore, responseTimeMs]
  );
}

/**
 * Get analysis history for user
 */
export async function getUserAnalysisHistory(
  userId: string,
  limit: number = 50
): Promise<AnalysisHistoryEntry[]> {
  const result = await query<AnalysisHistoryEntry>(
    `SELECT * FROM ucie_analysis_history 
     WHERE user_id = $1 
     ORDER BY created_at DESC 
     LIMIT $2`,
    [userId, limit]
  );
  return result.rows;
}

/**
 * Get analysis statistics
 */
export async function getAnalysisStats(): Promise<{
  total_analyses: number;
  avg_quality_score: number;
  avg_response_time_ms: number;
  unique_symbols: number;
}> {
  const result = await query<{
    total_analyses: number;
    avg_quality_score: number;
    avg_response_time_ms: number;
    unique_symbols: number;
  }>(
    `SELECT 
       COUNT(*) as total_analyses,
       AVG(data_quality_score) as avg_quality_score,
       AVG(response_time_ms) as avg_response_time_ms,
       COUNT(DISTINCT symbol) as unique_symbols
     FROM ucie_analysis_history
     WHERE created_at > NOW() - INTERVAL '30 days'`
  );
  return result.rows[0];
}

// ============================================================================
// API COST TRACKING FUNCTIONS
// ============================================================================

/**
 * Record API cost
 */
export async function recordApiCost(
  apiName: string,
  endpoint: string,
  costUsd: number,
  symbol?: string,
  userId?: string
): Promise<void> {
  await query(
    `INSERT INTO ucie_api_costs (api_name, endpoint, cost_usd, symbol, user_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [apiName, endpoint, costUsd, symbol?.toUpperCase() || null, userId || null]
  );
}

/**
 * Get API costs for period
 */
export async function getApiCosts(days: number = 30): Promise<ApiCostEntry[]> {
  const result = await query<ApiCostEntry>(
    `SELECT * FROM ucie_api_costs 
     WHERE timestamp > NOW() - INTERVAL '${days} days'
     ORDER BY timestamp DESC`,
    []
  );
  return result.rows;
}

/**
 * Get API cost summary
 */
export async function getApiCostSummary(days: number = 30): Promise<{
  total_cost: number;
  cost_by_api: Record<string, number>;
  total_requests: number;
}> {
  const result = await query<{
    api_name: string;
    total_cost: number;
    request_count: number;
  }>(
    `SELECT 
       api_name,
       SUM(cost_usd) as total_cost,
       COUNT(*) as request_count
     FROM ucie_api_costs 
     WHERE timestamp > NOW() - INTERVAL '${days} days'
     GROUP BY api_name`,
    []
  );

  const costByApi: Record<string, number> = {};
  let totalCost = 0;
  let totalRequests = 0;

  result.rows.forEach(row => {
    costByApi[row.api_name] = Number(row.total_cost);
    totalCost += Number(row.total_cost);
    totalRequests += Number(row.request_count);
  });

  return {
    total_cost: totalCost,
    cost_by_api: costByApi,
    total_requests: totalRequests,
  };
}
