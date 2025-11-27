/**
 * UCIE Job Status API
 * 
 * GET /api/ucie/status/[jobId]
 * 
 * Returns current status and progress of UCIE analysis job.
 * Client polls this endpoint every 3-5 seconds.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { queryOne } from '../../../../lib/db';

interface StatusResponse {
  success: boolean;
  jobId?: string;
  symbol?: string;
  status?: string;
  progress?: number;
  phase?: string;
  error?: string;
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string;
  estimatedTimeRemaining?: number;
  timestamp: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StatusResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET.',
      timestamp: new Date().toISOString()
    });
  }

  try {
    const { jobId } = req.query;

    if (!jobId || typeof jobId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Job ID is required',
        timestamp: new Date().toISOString()
      });
    }

    // Fetch job status
    const job = await queryOne(
      `SELECT 
        id, 
        symbol, 
        status, 
        progress, 
        phase, 
        error, 
        created_at, 
        updated_at, 
        completed_at
       FROM ucie_jobs 
       WHERE id = $1`,
      [jobId]
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
        timestamp: new Date().toISOString()
      });
    }

    // Calculate estimated time remaining
    let estimatedTimeRemaining = 0;
    if (job.status === 'processing' || job.status === 'queued') {
      // Estimate based on progress (total time ~5-7 minutes)
      const totalEstimatedTime = 420000; // 7 minutes in ms
      const elapsed = Date.now() - new Date(job.created_at).getTime();
      const remaining = totalEstimatedTime - elapsed;
      estimatedTimeRemaining = Math.max(0, Math.floor(remaining / 1000)); // seconds
    }

    return res.status(200).json({
      success: true,
      jobId: job.id,
      symbol: job.symbol,
      status: job.status,
      progress: job.progress,
      phase: job.phase,
      error: job.error,
      createdAt: job.created_at,
      updatedAt: job.updated_at,
      completedAt: job.completed_at,
      estimatedTimeRemaining,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Status check error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check status',
      timestamp: new Date().toISOString()
    });
  }
}

// Vercel Pro: 60 seconds max
export const config = {
  maxDuration: 5, // This endpoint is very fast (< 5s)
};
