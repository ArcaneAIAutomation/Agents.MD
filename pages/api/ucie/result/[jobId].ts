/**
 * UCIE Job Result API
 * 
 * GET /api/ucie/result/[jobId]
 * 
 * Returns completed UCIE analysis result.
 * Only returns data when status is 'completed'.
 */

import type { NextApiRequest, NextApiResponse} from 'next';
import { queryOne } from '../../../../lib/db';

interface ResultResponse {
  success: boolean;
  jobId?: string;
  symbol?: string;
  status?: string;
  result?: any;
  dataQuality?: number;
  completedAt?: string;
  error?: string;
  message?: string;
  timestamp: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResultResponse>
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

    // Fetch job with result
    const job = await queryOne(
      `SELECT 
        id, 
        symbol, 
        status, 
        progress, 
        phase,
        result, 
        data_quality,
        error, 
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

    // Check if job is completed
    if (job.status !== 'completed') {
      return res.status(202).json({
        success: false,
        message: `Analysis not yet complete. Current status: ${job.status} (${job.progress}%)`,
        status: job.status,
        jobId: job.id,
        symbol: job.symbol,
        timestamp: new Date().toISOString()
      });
    }

    // Check if job failed
    if (job.status === 'failed') {
      return res.status(500).json({
        success: false,
        error: job.error || 'Analysis failed',
        jobId: job.id,
        symbol: job.symbol,
        status: job.status,
        timestamp: new Date().toISOString()
      });
    }

    // Return completed result
    return res.status(200).json({
      success: true,
      jobId: job.id,
      symbol: job.symbol,
      status: job.status,
      result: job.result,
      dataQuality: job.data_quality,
      completedAt: job.completed_at,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Result fetch error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch result',
      timestamp: new Date().toISOString()
    });
  }
}

// Vercel Pro: 60 seconds max
export const config = {
  maxDuration: 10, // This endpoint is fast (< 10s)
};
