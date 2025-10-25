/**
 * In-Memory Job Store for Gemini Analysis
 * 
 * Since Gemini analysis takes 1-10 minutes and Vercel has a 30s timeout,
 * we need to store job state and poll for results asynchronously.
 * 
 * This is a simple in-memory store. In production, use Redis or a database.
 */

export interface GeminiJob {
  id: string;
  status: 'queued' | 'analyzing' | 'completed' | 'failed';
  whale: any;
  analysis?: any;
  thinking?: string;
  metadata?: any;
  error?: string;
  createdAt: number;
  completedAt?: number;
}

// In-memory store (will be lost on serverless function restart)
const jobs = new Map<string, GeminiJob>();

// Job expiration time (1 hour)
const JOB_EXPIRATION_MS = 60 * 60 * 1000;

/**
 * Create a new job
 */
export function createJob(whale: any): GeminiJob {
  const jobId = `gemini-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  
  const job: GeminiJob = {
    id: jobId,
    status: 'queued',
    whale,
    createdAt: Date.now(),
  };
  
  jobs.set(jobId, job);
  
  // Clean up old jobs
  cleanupExpiredJobs();
  
  return job;
}

/**
 * Get a job by ID
 */
export function getJob(jobId: string): GeminiJob | null {
  return jobs.get(jobId) || null;
}

/**
 * Update job status
 */
export function updateJob(jobId: string, updates: Partial<GeminiJob>): void {
  const job = jobs.get(jobId);
  if (job) {
    Object.assign(job, updates);
    jobs.set(jobId, job);
  }
}

/**
 * Mark job as analyzing
 */
export function markJobAnalyzing(jobId: string): void {
  updateJob(jobId, { status: 'analyzing' });
}

/**
 * Mark job as completed
 */
export function markJobCompleted(
  jobId: string,
  analysis: any,
  thinking?: string,
  metadata?: any
): void {
  updateJob(jobId, {
    status: 'completed',
    analysis,
    thinking,
    metadata,
    completedAt: Date.now(),
  });
}

/**
 * Mark job as failed
 */
export function markJobFailed(jobId: string, error: string): void {
  updateJob(jobId, {
    status: 'failed',
    error,
    completedAt: Date.now(),
  });
}

/**
 * Clean up expired jobs (older than 1 hour)
 */
function cleanupExpiredJobs(): void {
  const now = Date.now();
  const expiredJobs: string[] = [];
  
  jobs.forEach((job, jobId) => {
    if (now - job.createdAt > JOB_EXPIRATION_MS) {
      expiredJobs.push(jobId);
    }
  });
  
  expiredJobs.forEach(jobId => {
    jobs.delete(jobId);
    console.log(`🗑️ Cleaned up expired job: ${jobId}`);
  });
  
  if (expiredJobs.length > 0) {
    console.log(`🗑️ Cleaned up ${expiredJobs.length} expired jobs`);
  }
}

/**
 * Get all jobs (for debugging)
 */
export function getAllJobs(): GeminiJob[] {
  return Array.from(jobs.values());
}

/**
 * Get job count (for monitoring)
 */
export function getJobCount(): number {
  return jobs.size;
}
