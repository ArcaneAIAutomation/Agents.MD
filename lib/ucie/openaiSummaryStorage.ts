/**
 * OpenAI Summary Storage Utilities
 * 
 * Functions for storing and retrieving OpenAI-generated summaries
 * from the ucie_openai_summary table for Caesar AI context.
 */

import { query } from '../db';

export interface OpenAISummary {
  symbol: string;
  summaryText: string;
  dataQuality: number;
  apiStatus: {
    working: string[];
    failed: string[];
    total: number;
    successRate: number;
  };
  collectedDataSummary?: {
    marketData?: boolean;
    sentiment?: boolean;
    technical?: boolean;
    news?: boolean;
    onChain?: boolean;
  };
  createdAt: string;
  expiresAt: string;
}

/**
 * Store OpenAI summary in database
 * ✅ UPDATED: Now stores in ucie_openai_analysis table (correct table from migration)
 */
export async function storeOpenAISummary(
  symbol: string,
  summaryText: string,
  dataQuality: number,
  apiStatus: OpenAISummary['apiStatus'],
  collectedDataSummary?: OpenAISummary['collectedDataSummary'],
  ttlSeconds: number = 15 * 60, // 15 minutes default
  userId: string = 'anonymous',
  userEmail?: string
): Promise<void> {
  try {
    // ✅ FIX: Round data quality to integer (database column is INTEGER, not FLOAT)
    const dataQualityInt = Math.round(dataQuality);
    
    await query(
      `INSERT INTO ucie_openai_analysis (
        symbol,
        user_id,
        user_email,
        summary_text,
        data_quality_score,
        api_status,
        ai_provider,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (symbol, user_id)
      DO UPDATE SET
        summary_text = EXCLUDED.summary_text,
        data_quality_score = EXCLUDED.data_quality_score,
        api_status = EXCLUDED.api_status,
        ai_provider = EXCLUDED.ai_provider,
        updated_at = NOW()`,
      [
        symbol,
        userId,
        userEmail || null,
        summaryText,
        dataQualityInt,
        JSON.stringify(apiStatus),
        'openai'
      ]
    );
    
    console.log(`✅ Stored OpenAI summary for ${symbol} in ucie_openai_analysis table`);
  } catch (error) {
    console.error('❌ Failed to store OpenAI summary:', error);
    throw error;
  }
}

/**
 * Retrieve OpenAI summary from database
 * ✅ UPDATED: Now retrieves from ucie_openai_analysis table
 */
export async function getOpenAISummary(
  symbol: string,
  userId: string = 'anonymous'
): Promise<OpenAISummary | null> {
  try {
    const result = await query(
      `SELECT 
        symbol,
        summary_text as "summaryText",
        data_quality_score as "dataQuality",
        api_status as "apiStatus",
        created_at as "createdAt",
        updated_at as "expiresAt"
      FROM ucie_openai_analysis
      WHERE symbol = $1
        AND user_id = $2
      ORDER BY updated_at DESC
      LIMIT 1`,
      [symbol, userId]
    );
    
    if (result.rows.length === 0) {
      console.log(`📭 No OpenAI summary found for ${symbol}`);
      return null;
    }
    
    const row = result.rows[0];
    
    console.log(`📦 Retrieved OpenAI summary for ${symbol} from ucie_openai_analysis table`);
    
    return {
      symbol: row.symbol,
      summaryText: row.summaryText,
      dataQuality: row.dataQuality,
      apiStatus: row.apiStatus,
      collectedDataSummary: undefined,
      createdAt: row.createdAt,
      expiresAt: row.expiresAt
    };
  } catch (error) {
    console.error('❌ Failed to retrieve OpenAI summary:', error);
    return null;
  }
}

/**
 * Delete expired OpenAI summaries
 * ✅ UPDATED: Now cleans from ucie_openai_analysis table
 * Note: This table doesn't have expires_at, so we clean old entries (>24 hours)
 */
export async function cleanupExpiredSummaries(): Promise<number> {
  try {
    const result = await query(
      `DELETE FROM ucie_openai_analysis
      WHERE updated_at < NOW() - INTERVAL '24 hours'
      RETURNING id`
    );
    
    const deletedCount = result.rows.length;
    
    if (deletedCount > 0) {
      console.log(`🧹 Cleaned up ${deletedCount} old OpenAI summaries (>24h)`);
    }
    
    return deletedCount;
  } catch (error) {
    console.error('❌ Failed to cleanup expired summaries:', error);
    return 0;
  }
}

/**
 * Get all cached data for a symbol (for Caesar context)
 */
export async function getAllCachedDataForCaesar(symbol: string): Promise<{
  openaiSummary: OpenAISummary | null;
  marketData: any | null;
  sentiment: any | null;
  technical: any | null;
  news: any | null;
  onChain: any | null;
}> {
  try {
    // Get OpenAI summary
    const openaiSummary = await getOpenAISummary(symbol);
    
    // Get all cached analysis data
    const cacheResult = await query(
      `SELECT 
        analysis_type as "analysisType",
        data
      FROM ucie_analysis_cache
      WHERE symbol = $1
        AND expires_at > NOW()
      ORDER BY created_at DESC`,
      [symbol]
    );
    
    // Organize data by type
    const cachedData: any = {
      openaiSummary,
      marketData: null,
      sentiment: null,
      technical: null,
      news: null,
      onChain: null
    };
    
    for (const row of cacheResult.rows) {
      const type = row.analysisType;
      
      // Log the actual structure of the data
      console.log(`🔍 Database row for ${type}:`, {
        keys: Object.keys(row.data || {}),
        sample: JSON.stringify(row.data).substring(0, 300)
      });
      
      // ✅ FIX: The database stores the raw response object directly
      // APIs call: setCachedAnalysis(symbol, type, response, ttl, quality)
      // where response = { symbol, overallScore, sentiment, lunarCrush, reddit, ... }
      // So row.data IS the actual data (no wrapper)
      const actualData = row.data;
      
      if (type === 'market-data') cachedData.marketData = actualData;
      else if (type === 'sentiment') cachedData.sentiment = actualData;
      else if (type === 'technical') cachedData.technical = actualData;
      else if (type === 'news') cachedData.news = actualData;
      else if (type === 'on-chain') cachedData.onChain = actualData;
      
      console.log(`✅ Extracted ${type} data:`, {
        hasData: !!actualData,
        keys: Object.keys(actualData || {}),
        sample: JSON.stringify(actualData).substring(0, 200)
      });
    }
    
    const dataCount = Object.values(cachedData).filter(v => v !== null).length;
    console.log(`📊 Retrieved ${dataCount} cached data sources for ${symbol} (including OpenAI summary)`);
    
    return cachedData;
  } catch (error) {
    console.error('❌ Failed to get all cached data:', error);
    return {
      openaiSummary: null,
      marketData: null,
      sentiment: null,
      technical: null,
      news: null,
      onChain: null
    };
  }
}

