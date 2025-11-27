/**
 * UCIE Start Analysis API
 * 
 * POST /api/ucie/start-analysis
 * 
 * Initiates UCIE analysis and returns job ID for polling.
 * Follows the proven ATGE/Whale Watch async pattern.
 * 
 * Pattern:
 * 1. Create job in database
 * 2. Return job ID immediately (< 5s)
 * 3. Cron processes job in background
 * 4. Client polls /api/ucie/status/[jobId]
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { query, queryOne } from '../../../lib/db';
import { withOptionalAuth, AuthenticatedRequest } from '../../../middleware/auth';

interface StartAnalysisRequest {
  symbol: string;
  forceRefresh?: boolean;
}

interface StartAnalysisResponse {
  success: boolean;
  jobId?: string;
  status?: string;
  message?: string;
  error?: string;
  timestamp: string;
}

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<StartAnalysisResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.',
      timestamp: new Date().toISOString()
    });
  }

  try {
    const { symbol, forceRefresh = false } = req.body as StartAnalysisRequest;

    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: 'Symbol is required',
        timestamp: new Date().toISOString()
      });
    }

    const normalizedSymbol = symbol.toUpperCase();
    const userId = req.user?.id || 'anonymous';

    console.log(`🚀 Starting UCIE analysis for ${normalizedSymbol} (user: ${userId})`);

    // Check if there's already a pending/processing job for this symbol
    const existingJob = await queryOne(
      `SELECT id, status, progress, created_at 
       FROM ucie_jobs 
       WHERE symbol = $1 
       AND status IN ('queued', 'processing') 
       AND created_at > NOW() - INTERVAL '30 minutes'
       ORDER BY created_at DESC 
       LIMIT 1`,
      [normalizedSymbol]
    );

    if (existingJob) {
      console.log(`♻️ Found existing job: ${existingJob.id} (${existingJob.status})`);
      return res.status(200).json({
        success: true,
        jobId: existingJob.id,
        status: existingJob.status,
        message: `Analysis already in progress. Job ID: ${existingJob.id}`,
        timestamp: new Date().toISOString()
      });
    }

    // Create new job
    const job = await queryOne(
      `INSERT INTO ucie_jobs (
        symbol, 
        status, 
        progress, 
        phase, 
        user_id,
        force_refresh,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING id, status, progress, phase, created_at`,
      [normalizedSymbol, 'queued', 0, 'initializing', userId, forceRefresh]
    );

    console.log(`✅ Created UCIE job: ${job.id}`);
    console.log(`   Symbol: ${normalizedSymbol}`);
    console.log(`   Status: ${job.status}`);
    console.log(`   Phase: ${job.phase}`);

    return res.status(200).json({
      success: true,
      jobId: job.id,
      status: job.status,
      message: `UCIE analysis started for ${normalizedSymbol}. Poll /api/ucie/status/${job.id} for progress.`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Start analysis error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start analysis',
      timestamp: new Date().toISOString()
    });
  }
}

export default withOptionalAuth(handler);

// Vercel Pro: 60 seconds max
export const config = {
  maxDuration: 10, // This endpoint is fast (< 10s)
};
