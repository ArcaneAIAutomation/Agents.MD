/**
 * UCIE Job Processor (Cron)
 * 
 * POST /api/cron/process-ucie-jobs
 * 
 * Processes UCIE jobs in background, one phase at a time.
 * Runs every minute via Vercel Cron.
 * 
 * Each phase completes within 60 seconds:
 * - Phase 1: Market Data (< 60s)
 * - Phase 2: Sentiment (< 60s)
 * - Phase 3: Technical (< 60s)
 * - Phase 4: On-Chain (< 60s)
 * - Phase 5: AI Analysis (< 60s)
 * 
 * Total: 5-7 minutes (5 cron executions)
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { query, queryOne } from '../../../lib/db';
import { setCachedAnalysis } from '../../../lib/ucie/cacheUtils';
import { getComprehensiveContext, formatContextForAI } from '../../../lib/ucie/contextAggregator';

interface ProcessorResponse {
  success: boolean;
  processed?: number;
  jobId?: string;
  phase?: string;
  progress?: number;
  message?: string;
  error?: string;
  timestamp: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ProcessorResponse>
) {
  // Verify cron secret
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      timestamp: new Date().toISOString()
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      timestamp: new Date().toISOString()
    });
  }

  try {
    console.log('🔄 UCIE Job Processor started');

    // Get next queued job (FIFO)
    const job = await queryOne(
      `UPDATE ucie_jobs 
       SET status = 'processing', updated_at = NOW() 
       WHERE id = (
         SELECT id FROM ucie_jobs 
         WHERE status = 'queued' 
         ORDER BY created_at ASC 
         LIMIT 1
       ) 
       RETURNING *`
    );

    if (!job) {
      // No queued jobs, check for processing jobs
      const processingJob = await queryOne(
        `SELECT * FROM ucie_jobs 
         WHERE status = 'processing' 
         ORDER BY updated_at ASC 
         LIMIT 1`
      );

      if (!processingJob) {
        console.log('✅ No jobs to process');
        return res.status(200).json({
          success: true,
          processed: 0,
          message: 'No jobs in queue',
          timestamp: new Date().toISOString()
        });
      }

      // Continue processing existing job
      await processJobPhase(processingJob);
      
      return res.status(200).json({
        success: true,
        processed: 1,
        jobId: processingJob.id,
        phase: processingJob.phase,
        progress: processingJob.progress,
        message: `Continued processing job ${processingJob.id}`,
        timestamp: new Date().toISOString()
      });
    }

    // Process new job
    console.log(`📊 Processing job: ${job.id} (${job.symbol})`);
    await processJobPhase(job);

    return res.status(200).json({
      success: true,
      processed: 1,
      jobId: job.id,
      phase: job.phase,
      progress: job.progress,
      message: `Processed job ${job.id}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Processor error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Processor failed',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Process one phase of UCIE job (< 60s per phase)
 */
async function processJobPhase(job: any) {
  const { id, symbol, phase } = job;

  try {
    console.log(`🔧 Processing phase: ${phase} for ${symbol}`);

    // Phase 1: Market Data (15-20s)
    if (phase === 'initializing' || phase === 'market-data') {
      await updateJobPhase(id, 'market-data', 10);
      
      const marketData = await fetchWithTimeout(
        `/api/ucie/market-data/${symbol}`,
        45000 // 45s timeout
      );
      
      if (marketData) {
        await setCachedAnalysis(symbol, 'market-data', marketData, 300, 100);
        console.log(`✅ Market data cached for ${symbol}`);
      }
      
      await updateJobPhase(id, 'sentiment', 25);
      return;
    }

    // Phase 2: Sentiment (15-20s)
    if (phase === 'sentiment') {
      const sentiment = await fetchWithTimeout(
        `/api/ucie/sentiment/${symbol}`,
        45000
      );
      
      if (sentiment) {
        await setCachedAnalysis(symbol, 'sentiment', sentiment, 300, 100);
        console.log(`✅ Sentiment cached for ${symbol}`);
      }
      
      await updateJobPhase(id, 'technical', 40);
      return;
    }

    // Phase 3: Technical (15-20s)
    if (phase === 'technical') {
      const technical = await fetchWithTimeout(
        `/api/ucie/technical/${symbol}`,
        45000
      );
      
      if (technical) {
        await setCachedAnalysis(symbol, 'technical', technical, 300, 100);
        console.log(`✅ Technical cached for ${symbol}`);
      }
      
      await updateJobPhase(id, 'on-chain', 55);
      return;
    }

    // Phase 4: On-Chain (15-20s)
    if (phase === 'on-chain') {
      const onChain = await fetchWithTimeout(
        `/api/ucie/on-chain/${symbol}`,
        45000
      );
      
      if (onChain) {
        await setCachedAnalysis(symbol, 'on-chain', onChain, 300, 100);
        console.log(`✅ On-chain cached for ${symbol}`);
      }
      
      await updateJobPhase(id, 'news', 70);
      return;
    }

    // Phase 5: News (15-20s)
    if (phase === 'news') {
      const news = await fetchWithTimeout(
        `/api/ucie/news/${symbol}`,
        45000
      );
      
      if (news) {
        await setCachedAnalysis(symbol, 'news', news, 300, 100);
        console.log(`✅ News cached for ${symbol}`);
      }
      
      await updateJobPhase(id, 'ai-analysis', 85);
      return;
    }

    // Phase 6: AI Analysis (30-40s)
    if (phase === 'ai-analysis') {
      // Get all cached data
      const context = await getComprehensiveContext(symbol);
      
      // Check data quality
      if (context.dataQuality < 70) {
        throw new Error(`Insufficient data quality: ${context.dataQuality}%`);
      }
      
      // Format for AI
      const contextPrompt = formatContextForAI(context);
      
      // Call AI (Caesar or OpenAI)
      const analysis = await callAIAnalysis(symbol, contextPrompt);
      
      // Store result
      const result = {
        symbol,
        dataQuality: context.dataQuality,
        collectedData: {
          marketData: context.marketData,
          sentiment: context.sentiment,
          technical: context.technical,
          news: context.news,
          onChain: context.onChain
        },
        aiAnalysis: analysis,
        timestamp: new Date().toISOString()
      };
      
      // Mark complete
      await query(
        `UPDATE ucie_jobs 
         SET status = 'completed', 
             progress = 100, 
             result = $1, 
             data_quality = $2,
             completed_at = NOW(), 
             updated_at = NOW() 
         WHERE id = $3`,
        [JSON.stringify(result), context.dataQuality, id]
      );
      
      console.log(`✅ Job ${id} completed successfully`);
      return;
    }

  } catch (error) {
    console.error(`❌ Phase ${phase} failed:`, error);
    
    // Mark job as failed
    await query(
      `UPDATE ucie_jobs 
       SET status = 'failed', 
           error = $1, 
           updated_at = NOW() 
       WHERE id = $2`,
      [error instanceof Error ? error.message : 'Unknown error', id]
    );
  }
}

/**
 * Update job phase and progress
 */
async function updateJobPhase(jobId: string, phase: string, progress: number) {
  await query(
    `UPDATE ucie_jobs 
     SET phase = $1, progress = $2, updated_at = NOW() 
     WHERE id = $3`,
    [phase, progress, jobId]
  );
  console.log(`📊 Job ${jobId}: ${phase} (${progress}%)`);
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(url: string, timeout: number): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}${url}`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`Fetch failed: ${url}`, error);
    return null;
  }
}

/**
 * Call AI analysis (placeholder - implement based on your AI service)
 */
async function callAIAnalysis(symbol: string, context: string): Promise<any> {
  // TODO: Implement actual AI call (Caesar or OpenAI)
  // For now, return placeholder
  return {
    summary: `AI analysis for ${symbol} based on collected data`,
    confidence: 85,
    recommendation: 'Hold',
    keyInsights: [
      'Market data shows stable trend',
      'Sentiment is neutral',
      'Technical indicators suggest consolidation'
    ]
  };
}

// Vercel Pro: 60 seconds max
export const config = {
  maxDuration: 60, // Use full 60s for data collection
};
