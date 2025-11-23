/**
 * API Usage Logger
 * Bitcoin Sovereign Technology - AI Trade Generation Engine
 * 
 * Logs API usage and costs for monitoring and cost tracking.
 * 
 * Requirements: Task 47 - Monitor OpenAI API costs, Monitor CoinMarketCap API usage
 */

import { query } from '../db';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface OpenAIUsage {
  model: string;
  reasoningEffort?: 'low' | 'medium' | 'high';
  tokensUsed: number;
  costUsd: number;
  responseTimeMs: number;
  requestType: string; // 'trade_generation', 'analysis', 'verification'
  success: boolean;
  errorMessage?: string;
}

interface MarketDataUsage {
  provider: 'coinmarketcap' | 'coingecko';
  endpoint: string;
  responseTimeMs: number;
  success: boolean;
  errorMessage?: string;
}

// ============================================================================
// OPENAI USAGE LOGGING
// ============================================================================

/**
 * Log OpenAI API usage
 * Requirements: Task 47 - Monitor OpenAI API costs (should be <$100/month)
 * 
 * @param usage - OpenAI usage details
 */
export async function logOpenAIUsage(usage: OpenAIUsage): Promise<void> {
  try {
    await query(
      `SELECT log_api_usage($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        'openai',
        null, // endpoint (not needed for OpenAI)
        usage.requestType,
        usage.model,
        usage.reasoningEffort || null,
        usage.tokensUsed,
        usage.costUsd,
        usage.responseTimeMs,
        usage.success,
        usage.errorMessage || null
      ]
    );

    console.log(`[API Logger] OpenAI usage logged: ${usage.model} (${usage.requestType}) - $${usage.costUsd.toFixed(4)}`);
  } catch (error) {
    // Don't fail the main operation if logging fails
    console.error('[API Logger] Failed to log OpenAI usage:', error);
  }
}

/**
 * Calculate OpenAI cost based on model and tokens
 * 
 * Pricing (as of January 2025):
 * - GPT-5.1: $0.03 per 1K input tokens, $0.12 per 1K output tokens
 * - GPT-4o: $0.005 per 1K input tokens, $0.015 per 1K output tokens
 * 
 * @param model - Model name
 * @param inputTokens - Input tokens used
 * @param outputTokens - Output tokens used
 * @returns Cost in USD
 */
export function calculateOpenAICost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  let inputCostPer1K = 0;
  let outputCostPer1K = 0;

  if (model === 'gpt-5.1') {
    inputCostPer1K = 0.03;
    outputCostPer1K = 0.12;
  } else if (model === 'gpt-4o') {
    inputCostPer1K = 0.005;
    outputCostPer1K = 0.015;
  } else {
    // Default to GPT-4o pricing
    inputCostPer1K = 0.005;
    outputCostPer1K = 0.015;
  }

  const inputCost = (inputTokens / 1000) * inputCostPer1K;
  const outputCost = (outputTokens / 1000) * outputCostPer1K;

  return inputCost + outputCost;
}

// ============================================================================
// MARKET DATA USAGE LOGGING
// ============================================================================

/**
 * Log market data API usage
 * Requirements: Task 47 - Monitor CoinMarketCap API usage
 * 
 * @param usage - Market data usage details
 */
export async function logMarketDataUsage(usage: MarketDataUsage): Promise<void> {
  try {
    await query(
      `SELECT log_api_usage($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        usage.provider,
        usage.endpoint,
        'market_data',
        null, // model (not applicable)
        null, // reasoning_effort (not applicable)
        null, // tokens_used (not applicable)
        null, // cost_usd (free tier or included in plan)
        usage.responseTimeMs,
        usage.success,
        usage.errorMessage || null
      ]
    );

    console.log(`[API Logger] ${usage.provider} usage logged: ${usage.endpoint}`);
  } catch (error) {
    // Don't fail the main operation if logging fails
    console.error('[API Logger] Failed to log market data usage:', error);
  }
}

// ============================================================================
// COST MONITORING
// ============================================================================

/**
 * Get current month's OpenAI costs
 * Requirements: Task 47 - Monitor OpenAI API costs (should be <$100/month)
 * 
 * @returns Total cost for current month
 */
export async function getCurrentMonthOpenAICost(): Promise<number> {
  try {
    const result = await query(`
      SELECT COALESCE(SUM(cost_usd), 0) as total_cost
      FROM api_usage_logs
      WHERE 
        api_provider = 'openai'
        AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
    `);

    const totalCost = parseFloat(result.rows[0]?.total_cost || '0');
    return totalCost;
  } catch (error) {
    console.error('[API Logger] Failed to get current month cost:', error);
    return 0;
  }
}

/**
 * Check if OpenAI cost is approaching budget limit
 * Requirements: Task 47 - Monitor OpenAI API costs (should be <$100/month)
 * 
 * @param budgetLimit - Monthly budget limit (default: $100)
 * @returns Alert if cost is approaching or exceeding limit
 */
export async function checkOpenAICostAlert(budgetLimit: number = 100): Promise<{
  alert: boolean;
  severity: 'warning' | 'critical' | null;
  message: string;
  currentCost: number;
  projectedCost: number;
}> {
  const currentCost = await getCurrentMonthOpenAICost();
  
  // Project monthly cost based on current usage
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const currentDay = new Date().getDate();
  const projectedCost = currentCost * (daysInMonth / currentDay);

  if (projectedCost > budgetLimit) {
    return {
      alert: true,
      severity: 'critical',
      message: `Projected OpenAI cost ($${projectedCost.toFixed(2)}) exceeds budget limit ($${budgetLimit})`,
      currentCost,
      projectedCost
    };
  } else if (projectedCost > budgetLimit * 0.8) {
    return {
      alert: true,
      severity: 'warning',
      message: `Projected OpenAI cost ($${projectedCost.toFixed(2)}) is approaching budget limit ($${budgetLimit})`,
      currentCost,
      projectedCost
    };
  }

  return {
    alert: false,
    severity: null,
    message: `OpenAI cost is within budget ($${currentCost.toFixed(2)} / $${budgetLimit})`,
    currentCost,
    projectedCost
  };
}

/**
 * Get current month's CoinMarketCap usage
 * Requirements: Task 47 - Monitor CoinMarketCap API usage
 * 
 * @returns Total requests for current month
 */
export async function getCurrentMonthCMCUsage(): Promise<number> {
  try {
    const result = await query(`
      SELECT COUNT(*) as total_requests
      FROM api_usage_logs
      WHERE 
        api_provider = 'coinmarketcap'
        AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
    `);

    const totalRequests = parseInt(result.rows[0]?.total_requests || '0');
    return totalRequests;
  } catch (error) {
    console.error('[API Logger] Failed to get CMC usage:', error);
    return 0;
  }
}

/**
 * Check if CoinMarketCap usage is approaching limit
 * Requirements: Task 47 - Monitor CoinMarketCap API usage
 * 
 * @param monthlyLimit - Monthly request limit (default: 10,000)
 * @returns Alert if usage is approaching or exceeding limit
 */
export async function checkCMCUsageAlert(monthlyLimit: number = 10000): Promise<{
  alert: boolean;
  severity: 'warning' | 'critical' | null;
  message: string;
  currentUsage: number;
  usagePercentage: number;
}> {
  const currentUsage = await getCurrentMonthCMCUsage();
  const usagePercentage = (currentUsage / monthlyLimit) * 100;

  if (usagePercentage > 90) {
    return {
      alert: true,
      severity: 'critical',
      message: `CoinMarketCap usage (${currentUsage}) exceeds 90% of monthly limit (${monthlyLimit})`,
      currentUsage,
      usagePercentage
    };
  } else if (usagePercentage > 75) {
    return {
      alert: true,
      severity: 'warning',
      message: `CoinMarketCap usage (${currentUsage}) is approaching monthly limit (${monthlyLimit})`,
      currentUsage,
      usagePercentage
    };
  }

  return {
    alert: false,
    severity: null,
    message: `CoinMarketCap usage is within limit (${currentUsage} / ${monthlyLimit})`,
    currentUsage,
    usagePercentage
  };
}
