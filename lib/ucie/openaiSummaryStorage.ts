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
 */
export async function storeOpenAISummary(
  symbol: string,
  summaryText: string,
  dataQuality: number,
  apiStatus: OpenAISummary['apiStatus'],
  collectedDataSummary?: OpenAISummary['collectedDataSummary'],
  ttlSeconds: number = 15 * 60 // 15 minutes default
): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    
    await query(
      `INSERT INTO ucie_openai_summary (
        symbol,
        summary_text,
        data_quality,
        api_status,
        collected_data_summary,
        expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (symbol)
      DO UPDATE SET
        summary_text = EXCLUDED.summary_text,
        data_quality = EXCLUDED.data_quality,
        api_status = EXCLUDED.api_status,
        collected_data_summary = EXCLUDED.collected_data_summary,
        created_at = NOW(),
        expires_at = EXCLUDED.expires_at`,
      [
        symbol,
        summaryText,
        dataQuality,
        JSON.stringify(apiStatus),
        collectedDataSummary ? JSON.stringify(collectedDataSummary) : null,
        expiresAt
      ]
    );
    
    console.log(`✅ Stored OpenAI summary for ${symbol} in database`);
  } catch (error) {
    console.error('❌ Failed to store OpenAI summary:', error);
    throw error;
  }
}

/**
 * Retrieve OpenAI summary from database
 */
export async function getOpenAISummary(symbol: string): Promise<OpenAISummary | null> {
  try {
    const result = await query(
      `SELECT 
        symbol,
        summary_text as "summaryText",
        data_quality as "dataQuality",
        api_status as "apiStatus",
        collected_data_summary as "collectedDataSummary",
        created_at as "createdAt",
        expires_at as "expiresAt"
      FROM ucie_openai_summary
      WHERE symbol = $1
        AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1`,
      [symbol]
    );
    
    if (result.rows.length === 0) {
      console.log(`📭 No OpenAI summary found for ${symbol}`);
      return null;
    }
    
    const row = result.rows[0];
    
    console.log(`📦 Retrieved OpenAI summary for ${symbol} from database`);
    
    return {
      symbol: row.symbol,
      summaryText: row.summaryText,
      dataQuality: row.dataQuality,
      apiStatus: row.apiStatus,
      collectedDataSummary: row.collectedDataSummary,
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
 */
export async function cleanupExpiredSummaries(): Promise<number> {
  try {
    const result = await query(
      `DELETE FROM ucie_openai_summary
      WHERE expires_at < NOW()
      RETURNING id`
    );
    
    const deletedCount = result.rows.length;
    
    if (deletedCount > 0) {
      console.log(`🧹 Cleaned up ${deletedCount} expired OpenAI summaries`);
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
      if (type === 'market-data') cachedData.marketData = row.data;
      else if (type === 'sentiment') cachedData.sentiment = row.data;
      else if (type === 'technical') cachedData.technical = row.data;
      else if (type === 'news') cachedData.news = row.data;
      else if (type === 'on-chain') cachedData.onChain = row.data;
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

