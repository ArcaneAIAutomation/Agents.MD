/**
 * UCIE OpenAI Summary - Cleanup Stuck Jobs
 * 
 * Marks jobs stuck in "processing" for > 5 minutes as "error"
 * Can be called manually or via cron job
 * 
 * GET /api/ucie/openai-summary-cleanup
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';

interface CleanupResponse {
  success: boolean;
  cleaned: number;
  jobs?: Array<{ id: number; symbol: string; elapsed: number }>;
  error?: string;
  timestamp: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CleanupResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      cleaned: 0,
      error: 'Method not allowed',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    console.log('🧹 Starting cleanup of stuck jobs...');

    // Find jobs stuck in "processing" for > 5 minutes
    const stuckJobs = await query(
      `SELECT id, symbol, created_at, updated_at
       FROM ucie_openai_jobs
       WHERE status = 'processing'
       AND updated_at < NOW() - INTERVAL '5 minutes'`
    );

    if (stuckJobs.rows.length === 0) {
      console.log('✅ No stuck jobs found');
      return res.status(200).json({
        success: true,
        cleaned: 0,
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`⚠️ Found ${stuckJobs.rows.length} stuck jobs`);

    const jobDetails = stuckJobs.rows.map(job => ({
      id: job.id,
      symbol: job.symbol,
      elapsed: Math.floor((Date.now() - new Date(job.updated_at).getTime()) / 1000),
    }));

    // Mark them as error
    const updateResult = await query(
      `UPDATE ucie_openai_jobs
       SET status = 'error',
           error = 'Job timed out after 5 minutes',
           updated_at = NOW(),
           completed_at = NOW()
       WHERE status = 'processing'
       AND updated_at < NOW() - INTERVAL '5 minutes'`
    );

    const cleaned = updateResult.rowCount || 0;
    console.log(`✅ Cleaned ${cleaned} stuck jobs`);

    return res.status(200).json({
      success: true,
      cleaned,
      jobs: jobDetails,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    return res.status(500).json({
      success: false,
      cleaned: 0,
      error: error instanceof Error ? error.message : 'Cleanup failed',
      timestamp: new Date().toISOString(),
    });
  }
}
