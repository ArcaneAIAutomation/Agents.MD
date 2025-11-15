/**
 * Gemini Analysis Storage Utility
 * 
 * Handles storing and retrieving Gemini AI analysis results
 * in the ucie_gemini_analysis table
 */

import { query } from '../db';

export interface GeminiAnalysisData {
  symbol: string;
  userId: string;
  userEmail?: string;
  summaryText: string;
  thinkingProcess?: string;
  dataQualityScore: number;
  apiStatus: any;
  modelUsed?: string;
  tokensUsed?: number;
  promptTokens?: number;
  completionTokens?: number;
  thinkingTokens?: number;
  estimatedCostUsd?: number;
  responseTimeMs?: number;
  processingTimeMs?: number;
  dataSourcesUsed?: string[];
  availableDataCount?: number;
  analysisType?: 'summary' | 'deep-dive' | 'quick';
  confidenceScore?: number;
}

/**
 * Store Gemini AI analysis in database
 * 
 * @param data - Gemini analysis data
 * @returns Stored analysis ID
 */
export async function storeGeminiAnalysis(data: GeminiAnalysisData): Promise<number> {
  const result = await query(
    `INSERT INTO ucie_gemini_analysis (
      symbol,
      user_id,
      user_email,
      summary_text,
      thinking_process,
      data_quality_score,
      api_status,
      ai_provider,
      model_used,
      tokens_used,
      prompt_tokens,
      completion_tokens,
      thinking_tokens,
      estimated_cost_usd,
      response_time_ms,
      processing_time_ms,
      data_sources_used,
      available_data_count,
      total_data_sources,
      analysis_type,
      confidence_score
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
      $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
    )
    ON CONFLICT (symbol, user_id, analysis_type)
    DO UPDATE SET
      summary_text = EXCLUDED.summary_text,
      thinking_process = EXCLUDED.thinking_process,
      data_quality_score = EXCLUDED.data_quality_score,
      api_status = EXCLUDED.api_status,
      model_used = EXCLUDED.model_used,
      tokens_used = EXCLUDED.tokens_used,
      prompt_tokens = EXCLUDED.prompt_tokens,
      completion_tokens = EXCLUDED.completion_tokens,
      thinking_tokens = EXCLUDED.thinking_tokens,
      estimated_cost_usd = EXCLUDED.estimated_cost_usd,
      response_time_ms = EXCLUDED.response_time_ms,
      processing_time_ms = EXCLUDED.processing_time_ms,
      data_sources_used = EXCLUDED.data_sources_used,
      available_data_count = EXCLUDED.available_data_count,
      confidence_score = EXCLUDED.confidence_score,
      updated_at = NOW()
    RETURNING id`,
    [
      data.symbol.toUpperCase(),
      data.userId,
      data.userEmail || null,
      data.summaryText,
      data.thinkingProcess || null,
      data.dataQualityScore,
      JSON.stringify(data.apiStatus),
      'gemini',
      data.modelUsed || 'gemini-2.5-pro',
      data.tokensUsed || null,
      data.promptTokens || null,
      data.completionTokens || null,
      data.thinkingTokens || null,
      data.estimatedCostUsd || null,
      data.responseTimeMs || null,
      data.processingTimeMs || null,
      data.dataSourcesUsed ? JSON.stringify(data.dataSourcesUsed) : null,
      data.availableDataCount || null,
      10, // total_data_sources
      data.analysisType || 'summary',
      data.confidenceScore || null
    ]
  );

  return result.rows[0].id;
}

/**
 * Get Gemini analysis by symbol and user
 * 
 * @param symbol - Token symbol
 * @param userId - User ID
 * @param analysisType - Type of analysis
 * @returns Gemini analysis or null
 */
export async function getGeminiAnalysis(
  symbol: string,
  userId: string,
  analysisType: string = 'summary'
): Promise<any | null> {
  const result = await query(
    `SELECT * FROM ucie_gemini_analysis
     WHERE symbol = $1 AND user_id = $2 AND analysis_type = $3
     ORDER BY created_at DESC
     LIMIT 1`,
    [symbol.toUpperCase(), userId, analysisType]
  );

  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Get recent Gemini analyses for a symbol
 * 
 * @param symbol - Token symbol
 * @param limit - Maximum number of results
 * @returns Array of analyses
 */
export async function getRecentGeminiAnalyses(
  symbol: string,
  limit: number = 10
): Promise<any[]> {
  const result = await query(
    `SELECT * FROM ucie_gemini_analysis
     WHERE symbol = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [symbol.toUpperCase(), limit]
  );

  return result.rows;
}

/**
 * Get Gemini cost summary for a date range
 * 
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Cost summary
 */
export async function getGeminiCostSummary(
  startDate?: Date,
  endDate?: Date
): Promise<any> {
  let sql = `
    SELECT 
      COUNT(*) as total_analyses,
      SUM(tokens_used) as total_tokens,
      SUM(estimated_cost_usd) as total_cost_usd,
      AVG(response_time_ms) as avg_response_time_ms,
      AVG(data_quality_score) as avg_data_quality,
      COUNT(DISTINCT symbol) as unique_symbols,
      COUNT(DISTINCT user_id) as unique_users
    FROM ucie_gemini_analysis
  `;

  const params: any[] = [];

  if (startDate && endDate) {
    sql += ` WHERE created_at BETWEEN $1 AND $2`;
    params.push(startDate, endDate);
  } else if (startDate) {
    sql += ` WHERE created_at >= $1`;
    params.push(startDate);
  }

  const result = await query(sql, params);
  return result.rows[0];
}

/**
 * Get Gemini model usage statistics
 * 
 * @returns Model usage stats
 */
export async function getGeminiModelStats(): Promise<any[]> {
  const result = await query(`
    SELECT * FROM vw_gemini_model_stats
    ORDER BY usage_count DESC
  `);

  return result.rows;
}

/**
 * Delete old Gemini analyses (cleanup)
 * 
 * @param daysOld - Delete analyses older than this many days
 * @returns Number of deleted rows
 */
export async function cleanupOldGeminiAnalyses(daysOld: number = 30): Promise<number> {
  const result = await query(
    `DELETE FROM ucie_gemini_analysis
     WHERE created_at < NOW() - INTERVAL '${daysOld} days'
     RETURNING id`
  );

  return result.rows.length;
}
