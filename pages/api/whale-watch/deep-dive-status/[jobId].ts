import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Deep Dive Analysis - Poll Status
 * Check the status of an async Deep Dive job
 */

interface DeepDiveStatusResponse {
  success: boolean;
  status?: 'queued' | 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
  timestamp: string;
}

// Import job store from start endpoint
// Note: In production, use Redis or database instead of in-memory store
let jobStore: Map<string, any>;

// Lazy load job store
async function getJobStore() {
  if (!jobStore) {
    const startModule = await import('../deep-dive-start');
    jobStore = startModule.jobStore;
  }
  return jobStore;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DeepDiveStatusResponse>
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

    console.log(`📊 Checking Deep Dive job status: ${jobId}`);

    const store = await getJobStore();
    const job = store.get(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`📊 Job ${jobId} status: ${job.status}`);

    // Job completed successfully
    if (job.status === 'completed') {
      console.log(`✅ Deep Dive completed for job: ${jobId}`);
      
      // Cache completed results for 1 hour
      res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

      return res.status(200).json({
        success: true,
        status: 'completed',
        result: job.result,
        timestamp: new Date().toISOString(),
      });
    }

    // Job failed
    if (job.status === 'failed') {
      console.error(`❌ Deep Dive failed for job: ${jobId}`);
      return res.status(500).json({
        success: false,
        status: 'failed',
        error: job.error || 'Analysis failed',
        timestamp: new Date().toISOString(),
      });
    }

    // Still processing (queued or processing)
    console.log(`⏳ Job ${jobId} status: ${job.status}`);
    
    return res.status(200).json({
      success: true,
      status: job.status,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Deep Dive status check error:', error);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check status',
      timestamp: new Date().toISOString(),
    });
  }
}
