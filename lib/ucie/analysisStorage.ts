/**
 * UCIE Analysis Storage Utilities
 * 
 * Handles storage of OpenAI/Gemini and Caesar AI analysis with automatic replacement.
 * Every new query replaces old data in the database.
 * 
 * RULES:
 * 1. Cached data is fine as long as new requests don't rely on it
 * 2. Database always updated with latest data (UPSERT replaces old entries)
 * 3. Never use fallback/fictitious data
 * 4. Higher timeouts for Caesar AI (12-15 minutes)
 * 5. Poll Caesar every 60 seconds with progress updates
 * 
 * Features:
 * - Automatic data replacement (UPSERT)
 * - OpenAI/Gemini analysis storage
 * - Caesar AI research storage with polling
 * - Timestamp tracking
 * - Data quality scoring
 * - Progress tracking for long-running jobs
 */

import { query } from '../db';

/**
 * Store AI analysis (OpenAI or Gemini) - REPLACES existing data
 * 
 * Uses UPSERT (INSERT ... ON CONFLICT UPDATE) to replace old data
 * Supports both OpenAI GPT-4o and Gemini AI
 */
export async function storeAIAnalysis(
  symbol: string,
  summaryText: string,
  dataQualityScore: number,
  apiStatus: any,
  aiProvider: 'openai' | 'gemini' = 'openai',
  userId: string = 'anonymous',
  userEmail?: string
): Promise<void> {
  try {
    console.log(`💾 Storing ${aiProvider.toUpperCase()} analysis for ${symbol} (user: ${userId})...`);
    
    // UPSERT: Replace existing data if it exists
    await query(
      `INSERT INTO ucie_openai_analysis (
        symbol, user_id, user_email, summary_text, data_quality_score, api_status, ai_provider, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      ON CONFLICT (symbol, user_id) 
      DO UPDATE SET
        summary_text = EXCLUDED.summary_text,
        data_quality_score = EXCLUDED.data_quality_score,
        api_status = EXCLUDED.api_status,
        ai_provider = EXCLUDED.ai_provider,
        user_email = EXCLUDED.user_email,
        updated_at = NOW()`,
      [
        symbol.toUpperCase(),
        userId,
        userEmail || null,
        summaryText,
        dataQualityScore,
        JSON.stringify(apiStatus),
        aiProvider
      ]
    );
    
    console.log(`✅ ${aiProvider.toUpperCase()} analysis stored for ${symbol} (replaced old data if existed)`);
  } catch (error) {
    console.error(`❌ Failed to store ${aiProvider.toUpperCase()} analysis for ${symbol}:`, error);
    throw error;
  }
}

/**
 * Legacy function for backward compatibility
 */
export async function storeOpenAIAnalysis(
  symbol: string,
  summaryText: string,
  dataQualityScore: number,
  apiStatus: any,
  userId: string = 'anonymous',
  userEmail?: string
): Promise<void> {
  return storeAIAnalysis(symbol, summaryText, dataQualityScore, apiStatus, 'openai', userId, userEmail);
}

/**
 * Get OpenAI analysis from database
 */
export async function getOpenAIAnalysis(
  symbol: string,
  userId: string = 'anonymous'
): Promise<any | null> {
  try {
    const result = await query(
      `SELECT * FROM ucie_openai_analysis
       WHERE symbol = $1 AND user_id = $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [symbol.toUpperCase(), userId]
    );
    
    if (result.rows.length === 0) {
      console.log(`❌ No OpenAI analysis found for ${symbol} (user: ${userId})`);
      return null;
    }
    
    const row = result.rows[0];
    console.log(`✅ OpenAI analysis retrieved for ${symbol} (age: ${Math.floor((Date.now() - new Date(row.created_at).getTime()) / 1000)}s)`);
    
    return {
      id: row.id,
      symbol: row.symbol,
      summaryText: row.summary_text,
      dataQualityScore: row.data_quality_score,
      apiStatus: row.api_status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  } catch (error) {
    console.error(`❌ Failed to get OpenAI analysis for ${symbol}:`, error);
    return null;
  }
}

/**
 * Store Caesar AI research (REPLACES existing data)
 * 
 * Uses UPSERT (INSERT ... ON CONFLICT UPDATE) to replace old data
 */
export async function storeCaesarResearch(
  symbol: string,
  jobId: string,
  status: string,
  researchData: any,
  userId: string = 'anonymous',
  userEmail?: string,
  options?: {
    executiveSummary?: string;
    keyFindings?: string[];
    opportunities?: string[];
    risks?: string[];
    recommendation?: string;
    confidenceScore?: number;
    sources?: any[];
    dataQualityScore?: number;
    analysisDepth?: string;
    startedAt?: Date;
    completedAt?: Date;
    durationSeconds?: number;
  }
): Promise<void> {
  try {
    console.log(`💾 Storing Caesar research for ${symbol} (user: ${userId}, status: ${status})...`);
    
    // UPSERT: Replace existing data if it exists
    await query(
      `INSERT INTO ucie_caesar_research (
        symbol, user_id, user_email, job_id, status, research_data,
        executive_summary, key_findings, opportunities, risks,
        recommendation, confidence_score, sources, source_count,
        data_quality_score, analysis_depth,
        started_at, completed_at, duration_seconds,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW(), NOW())
      ON CONFLICT (symbol, user_id)
      DO UPDATE SET
        job_id = EXCLUDED.job_id,
        status = EXCLUDED.status,
        research_data = EXCLUDED.research_data,
        executive_summary = EXCLUDED.executive_summary,
        key_findings = EXCLUDED.key_findings,
        opportunities = EXCLUDED.opportunities,
        risks = EXCLUDED.risks,
        recommendation = EXCLUDED.recommendation,
        confidence_score = EXCLUDED.confidence_score,
        sources = EXCLUDED.sources,
        source_count = EXCLUDED.source_count,
        data_quality_score = EXCLUDED.data_quality_score,
        analysis_depth = EXCLUDED.analysis_depth,
        started_at = EXCLUDED.started_at,
        completed_at = EXCLUDED.completed_at,
        duration_seconds = EXCLUDED.duration_seconds,
        user_email = EXCLUDED.user_email,
        updated_at = NOW()`,
      [
        symbol.toUpperCase(),
        userId,
        userEmail || null,
        jobId,
        status,
        JSON.stringify(researchData),
        options?.executiveSummary || null,
        JSON.stringify(options?.keyFindings || []),
        JSON.stringify(options?.opportunities || []),
        JSON.stringify(options?.risks || []),
        options?.recommendation || null,
        options?.confidenceScore || null,
        JSON.stringify(options?.sources || []),
        options?.sources?.length || 0,
        options?.dataQualityScore || null,
        options?.analysisDepth || null,
        options?.startedAt || null,
        options?.completedAt || null,
        options?.durationSeconds || null
      ]
    );
    
    console.log(`✅ Caesar research stored for ${symbol} (replaced old data if existed)`);
  } catch (error) {
    console.error(`❌ Failed to store Caesar research for ${symbol}:`, error);
    throw error;
  }
}

/**
 * Get Caesar AI research from database
 */
export async function getCaesarResearch(
  symbol: string,
  userId: string = 'anonymous'
): Promise<any | null> {
  try {
    const result = await query(
      `SELECT * FROM ucie_caesar_research
       WHERE symbol = $1 AND user_id = $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [symbol.toUpperCase(), userId]
    );
    
    if (result.rows.length === 0) {
      console.log(`❌ No Caesar research found for ${symbol} (user: ${userId})`);
      return null;
    }
    
    const row = result.rows[0];
    console.log(`✅ Caesar research retrieved for ${symbol} (status: ${row.status}, age: ${Math.floor((Date.now() - new Date(row.created_at).getTime()) / 1000)}s)`);
    
    return {
      id: row.id,
      symbol: row.symbol,
      jobId: row.job_id,
      status: row.status,
      researchData: row.research_data,
      executiveSummary: row.executive_summary,
      keyFindings: row.key_findings,
      opportunities: row.opportunities,
      risks: row.risks,
      recommendation: row.recommendation,
      confidenceScore: row.confidence_score,
      sources: row.sources,
      sourceCount: row.source_count,
      dataQualityScore: row.data_quality_score,
      analysisDepth: row.analysis_depth,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      durationSeconds: row.duration_seconds,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  } catch (error) {
    console.error(`❌ Failed to get Caesar research for ${symbol}:`, error);
    return null;
  }
}

/**
 * Update Caesar research status
 */
export async function updateCaesarResearchStatus(
  symbol: string,
  status: string,
  userId: string = 'anonymous',
  additionalData?: {
    completedAt?: Date;
    durationSeconds?: number;
  }
): Promise<void> {
  try {
    console.log(`🔄 Updating Caesar research status for ${symbol} to ${status}...`);
    
    await query(
      `UPDATE ucie_caesar_research
       SET status = $1,
           completed_at = $2,
           duration_seconds = $3,
           updated_at = NOW()
       WHERE symbol = $4 AND user_id = $5`,
      [
        status,
        additionalData?.completedAt || null,
        additionalData?.durationSeconds || null,
        symbol.toUpperCase(),
        userId
      ]
    );
    
    console.log(`✅ Caesar research status updated for ${symbol}`);
  } catch (error) {
    console.error(`❌ Failed to update Caesar research status for ${symbol}:`, error);
    throw error;
  }
}

/**
 * Delete old analysis data (cleanup)
 */
export async function deleteOldAnalysis(
  symbol: string,
  userId: string = 'anonymous'
): Promise<void> {
  try {
    console.log(`🗑️ Deleting old analysis for ${symbol} (user: ${userId})...`);
    
    // Delete OpenAI analysis
    await query(
      `DELETE FROM ucie_openai_analysis
       WHERE symbol = $1 AND user_id = $2`,
      [symbol.toUpperCase(), userId]
    );
    
    // Delete Caesar research
    await query(
      `DELETE FROM ucie_caesar_research
       WHERE symbol = $1 AND user_id = $2`,
      [symbol.toUpperCase(), userId]
    );
    
    console.log(`✅ Old analysis deleted for ${symbol}`);
  } catch (error) {
    console.error(`❌ Failed to delete old analysis for ${symbol}:`, error);
    throw error;
  }
}

/**
 * Get complete analysis (OpenAI/Gemini + Caesar)
 */
export async function getCompleteAnalysis(
  symbol: string,
  userId: string = 'anonymous'
): Promise<{
  openai: any | null;
  caesar: any | null;
} | null> {
  try {
    const [openai, caesar] = await Promise.all([
      getOpenAIAnalysis(symbol, userId),
      getCaesarResearch(symbol, userId)
    ]);
    
    return {
      openai,
      caesar
    };
  } catch (error) {
    console.error(`❌ Failed to get complete analysis for ${symbol}:`, error);
    return null;
  }
}

/**
 * Poll Caesar AI job with progress tracking
 * 
 * Polls every 60 seconds for up to 15 minutes
 * Returns progress updates to keep user informed
 */
export async function pollCaesarJob(
  jobId: string,
  onProgress?: (progress: {
    elapsedSeconds: number;
    estimatedTotalSeconds: number;
    percentComplete: number;
    status: string;
    message: string;
  }) => void
): Promise<any> {
  const POLL_INTERVAL_MS = 60000; // 60 seconds
  const MAX_DURATION_MS = 15 * 60 * 1000; // 15 minutes
  const ESTIMATED_DURATION_SECONDS = 12 * 60; // 12 minutes average
  
  const startTime = Date.now();
  let attempts = 0;
  
  console.log(`🔄 Starting Caesar AI polling for job ${jobId} (max 15 minutes)...`);
  
  while (Date.now() - startTime < MAX_DURATION_MS) {
    attempts++;
    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    const percentComplete = Math.min(95, Math.floor((elapsedSeconds / ESTIMATED_DURATION_SECONDS) * 100));
    
    try {
      // Call Caesar API to check job status
      const response = await fetch(`https://api.caesar.xyz/research/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.CAESAR_API_KEY}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Caesar API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update progress
      if (onProgress) {
        onProgress({
          elapsedSeconds,
          estimatedTotalSeconds: ESTIMATED_DURATION_SECONDS,
          percentComplete,
          status: data.status,
          message: getProgressMessage(data.status, elapsedSeconds, attempts)
        });
      }
      
      // Check if completed
      if (data.status === 'completed') {
        console.log(`✅ Caesar AI job ${jobId} completed after ${elapsedSeconds}s (${attempts} polls)`);
        return data;
      }
      
      // Check if failed
      if (data.status === 'failed') {
        console.error(`❌ Caesar AI job ${jobId} failed after ${elapsedSeconds}s`);
        throw new Error('Caesar AI analysis failed');
      }
      
      // Wait before next poll
      console.log(`⏳ Poll ${attempts}: Job ${data.status}, waiting 60s... (${elapsedSeconds}s elapsed, ${percentComplete}% complete)`);
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
      
    } catch (error) {
      console.error(`❌ Error polling Caesar job ${jobId}:`, error);
      
      // If we're past the timeout, throw error
      if (Date.now() - startTime >= MAX_DURATION_MS) {
        throw new Error('Caesar AI analysis timeout (15 minutes exceeded)');
      }
      
      // Otherwise, wait and retry
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
    }
  }
  
  // Timeout reached
  throw new Error('Caesar AI analysis timeout (15 minutes exceeded)');
}

/**
 * Get user-friendly progress message
 */
function getProgressMessage(status: string, elapsedSeconds: number, attempts: number): string {
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  
  switch (status) {
    case 'queued':
      return `Analysis queued... (${minutes}m ${seconds}s elapsed)`;
    case 'researching':
      return `Analyzing market data and sources... (${minutes}m ${seconds}s elapsed, poll ${attempts})`;
    case 'processing':
      return `Processing research results... (${minutes}m ${seconds}s elapsed)`;
    default:
      return `Status: ${status} (${minutes}m ${seconds}s elapsed)`;
  }
}
