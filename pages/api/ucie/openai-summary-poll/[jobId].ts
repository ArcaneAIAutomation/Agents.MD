/**
 * UCIE OpenAI Summary - Poll Status
 * 
 * GET /api/ucie/openai-summary-poll/[jobId]
 * 
 * Checks status of GPT-5.1 analysis job
 * Frontend calls this every 3 seconds until complete (max 30 minutes)
 * 
 * Status: queued -> processing -> completed -> error
 * 
 * Pattern matches Whale Watch Deep Dive:
 * - 3-second polling interval
 * - 30-minute maximum timeout (600 attempts × 3s = 1800s)
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../../lib/db';
import { withOptionalAuth, AuthenticatedRequest } from '../../../../middleware/auth';

interface PollResponse {
  success: boolean;
  status: 'queued' | 'processing' | 'completed' | 'error';
  result?: string;
  error?: string;
  progress?: string;
  timestamp: string;
  elapsedTime?: number;
}

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<PollResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      status: 'error',
      error: 'Method not allowed',
      timestamp: new Date().toISOString(),
    });
  }

  const { jobId } = req.query;
  const userId = req.user?.id || null;

  if (!jobId || typeof jobId !== 'string') {
    return res.status(400).json({
      success: false,
      status: 'error',
      error: 'Invalid jobId',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    // Get job status from database
    const result = await query(
      `SELECT id, symbol, status, result_data, error_message, progress, created_at, updated_at
       FROM ucie_openai_jobs 
       WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)`,
      [parseInt(jobId), userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        status: 'error',
        error: 'Job not found',
        timestamp: new Date().toISOString(),
      });
    }

    const job = result.rows[0];
    const elapsedTime = Math.floor((Date.now() - new Date(job.created_at).getTime()) / 1000);

    console.log(`📊 Job ${jobId} status: ${job.status} (${elapsedTime}s elapsed)`);

    const response: PollResponse = {
      success: true,
      status: job.status,
      timestamp: new Date().toISOString(),
      elapsedTime,
    };

    if (job.status === 'completed' && job.result_data) {
      response.result = job.result_data;
    }

    if (job.status === 'error' && job.error_message) {
      response.error = job.error_message;
    }

    if (job.progress) {
      response.progress = job.progress;
    }

    return res.status(200).json(response);

  } catch (error) {
    console.error('Failed to poll job status:', error);
    return res.status(500).json({
      success: false,
      status: 'error',
      error: error instanceof Error ? error.message : 'Failed to poll status',
      timestamp: new Date().toISOString(),
    });
  }
}

export default withOptionalAuth(handler);
