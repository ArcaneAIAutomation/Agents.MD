import type { NextApiRequest, NextApiResponse } from 'next';
import { getJob } from '../../../../utils/geminiJobStore';

/**
 * Gemini Analysis Polling API
 * Polls for completed Gemini analysis results
 * 
 * Similar to Caesar's polling endpoint but for Gemini jobs
 */

interface GeminiAnalysisResultResponse {
  success: boolean;
  status?: 'queued' | 'analyzing' | 'completed' | 'failed';
  analysis?: any;
  thinking?: string;
  metadata?: any;
  error?: string;
  timestamp: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GeminiAnalysisResultResponse>
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
        error: 'Invalid job ID',
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`📊 Checking Gemini job status: ${jobId}`);

    // Get job from store
    const job = getJob(jobId);
    
    if (!job) {
      console.error(`❌ Job not found: ${jobId}`);
      return res.status(404).json({
        success: false,
        error: 'Job not found. It may have expired (jobs expire after 1 hour).',
        timestamp: new Date().toISOString(),
      });
    }
    
    console.log(`📊 Job status: ${job.status}`);

    if (job.status === 'completed') {
      console.log(`✅ Analysis complete for job: ${jobId}`);

      // Cache completed analysis for 1 hour
      res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

      return res.status(200).json({
        success: true,
        status: 'completed',
        analysis: job.analysis,
        thinking: job.thinking,
        metadata: job.metadata,
        timestamp: new Date().toISOString(),
      });
    }

    if (job.status === 'failed') {
      console.error(`❌ Analysis failed for job: ${jobId}`);
      return res.status(500).json({
        success: false,
        status: 'failed',
        error: job.error || 'Analysis job failed',
        timestamp: new Date().toISOString(),
      });
    }

    // Still processing (queued or analyzing)
    console.log(`⏳ Job ${jobId} status: ${job.status}`);
    
    return res.status(200).json({
      success: true,
      status: job.status,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Gemini analysis polling error:', error);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get analysis',
      timestamp: new Date().toISOString(),
    });
  }
}
