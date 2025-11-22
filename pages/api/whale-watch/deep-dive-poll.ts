import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';

/**
 * Poll Deep Dive Analysis Status
 * 
 * Returns current status and results if completed
 * Frontend polls this endpoint every 2-3 seconds
 */

interface PollResponse {
  success: boolean;
  status?: 'pending' | 'analyzing' | 'completed' | 'failed';
  analysis?: any;
  blockchainData?: any;
  metadata?: any;
  error?: string;
  timestamp: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PollResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const { jobId } = req.query;

    if (!jobId || typeof jobId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing jobId parameter',
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`📊 Polling job ${jobId}...`);

    // Get job status from database
    const result = await query(
      `SELECT 
        status,
        analysis_data,
        blockchain_data,
        metadata
       FROM whale_analysis
       WHERE id = $1`,
      [parseInt(jobId)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
        timestamp: new Date().toISOString(),
      });
    }

    const job = result.rows[0];
    console.log(`📊 Job ${jobId} status: ${job.status}`);

    // Return current status
    if (job.status === 'completed') {
      return res.status(200).json({
        success: true,
        status: 'completed',
        analysis: job.analysis_data,
        blockchainData: job.blockchain_data,
        metadata: job.metadata,
        timestamp: new Date().toISOString(),
      });
    }

    if (job.status === 'failed') {
      return res.status(200).json({
        success: false,
        status: 'failed',
        error: 'Analysis failed',
        timestamp: new Date().toISOString(),
      });
    }

    // Still processing
    return res.status(200).json({
      success: true,
      status: job.status,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Failed to poll job:', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to poll job',
      timestamp: new Date().toISOString(),
    });
  }
}
