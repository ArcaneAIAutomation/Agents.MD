/**
 * Caesar Research Storage Utilities
 * 
 * Functions for storing and retrieving Caesar AI research results
 * in the database for caching and reference.
 */

import { query } from '../db';
import type { ResearchJob, ResearchResult } from '../../utils/caesarClient';

export interface StoredCaesarJob {
  id: string;
  caesar_job_id: string;
  symbol: string | null;
  query: string;
  status: string;
  compute_units: number;
  content: string | null;
  transformed_content: string | null;
  results: ResearchResult[] | null;
  data_quality_score: number | null;
  created_at: string;
  completed_at: string | null;
  expires_at: string | null;
  user_id: string | null;
  cost_usd: number | null;
}

/**
 * Store a new Caesar research job in the database
 */
export async function storeCaesarJob(
  caesarJobId: string,
  queryText: string,
  symbol?: string,
  computeUnits: number = 2,
  userId?: string,
  userEmail?: string
): Promise<string> {
  const result = await query(
    `INSERT INTO caesar_research_jobs 
     (caesar_job_id, symbol, query, status, compute_units, user_id, user_email, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() + INTERVAL '7 days')
     RETURNING id`,
    [caesarJobId, symbol || null, queryText, 'queued', computeUnits, userId || null, userEmail || null]
  );
  
  return result.rows[0].id;
}

/**
 * Update Caesar job status
 */
export async function updateCaesarJobStatus(
  caesarJobId: string,
  status: string
): Promise<void> {
  await query(
    `UPDATE caesar_research_jobs 
     SET status = $1, updated_at = NOW()
     WHERE caesar_job_id = $2`,
    [status, caesarJobId]
  );
}

/**
 * Store completed Caesar research results
 */
export async function storeCaesarResults(
  caesarJobId: string,
  job: ResearchJob,
  dataQualityScore: number,
  costUsd?: number
): Promise<void> {
  // ✅ FIX: Round quality score to integer (database expects INTEGER, not FLOAT)
  const qualityScoreInt = Math.round(dataQualityScore);
  
  await query(
    `UPDATE caesar_research_jobs 
     SET status = $1,
         content = $2,
         transformed_content = $3,
         results = $4,
         data_quality_score = $5,
         completed_at = NOW(),
         cost_usd = $6
     WHERE caesar_job_id = $7`,
    [
      job.status,
      job.content || null,
      job.transformed_content || null,
      JSON.stringify(job.results || []),
      qualityScoreInt,
      costUsd || null,
      caesarJobId
    ]
  );
  
  // Store individual sources for detailed tracking
  if (job.results && job.results.length > 0) {
    const jobRecord = await query(
      'SELECT id FROM caesar_research_jobs WHERE caesar_job_id = $1',
      [caesarJobId]
    );
    
    if (jobRecord.rows.length > 0) {
      const jobId = jobRecord.rows[0].id;
      
      for (const result of job.results) {
        await query(
          `INSERT INTO caesar_research_sources 
           (research_job_id, caesar_result_id, title, url, score, citation_index)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [jobId, result.id, result.title, result.url, result.score, result.citation_index]
        );
      }
    }
  }
}

/**
 * Get cached Caesar research by symbol and query
 */
export async function getCachedCaesarResearch(
  symbol: string,
  queryPattern: string
): Promise<StoredCaesarJob | null> {
  const result = await query(
    `SELECT * FROM caesar_research_jobs 
     WHERE symbol = $1 
       AND query ILIKE $2
       AND status = 'completed'
       AND expires_at > NOW()
     ORDER BY created_at DESC
     LIMIT 1`,
    [symbol.toUpperCase(), `%${queryPattern}%`]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const row = result.rows[0];
  return {
    ...row,
    results: row.results ? JSON.parse(row.results) : null
  };
}

/**
 * Get Caesar research by Caesar job ID
 */
export async function getCaesarJobById(
  caesarJobId: string
): Promise<StoredCaesarJob | null> {
  const result = await query(
    'SELECT * FROM caesar_research_jobs WHERE caesar_job_id = $1',
    [caesarJobId]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const row = result.rows[0];
  return {
    ...row,
    results: row.results ? JSON.parse(row.results) : null
  };
}

/**
 * Get all sources for a research job
 */
export async function getCaesarJobSources(
  caesarJobId: string
): Promise<any[]> {
  const result = await query(
    `SELECT s.* FROM caesar_research_sources s
     JOIN caesar_research_jobs j ON s.research_job_id = j.id
     WHERE j.caesar_job_id = $1
     ORDER BY s.citation_index`,
    [caesarJobId]
  );
  
  return result.rows;
}

/**
 * Calculate data quality score for Caesar research
 */
export function calculateCaesarQuality(job: ResearchJob): number {
  let score = 0;
  
  // Has content (40 points)
  if (job.content && job.content.length > 100) {
    score += 40;
  }
  
  // Has results/sources (30 points)
  if (job.results && job.results.length > 0) {
    score += Math.min(job.results.length * 5, 30);
  }
  
  // Has transformed content (20 points)
  if (job.transformed_content) {
    score += 20;
  }
  
  // Average source quality (10 points)
  if (job.results && job.results.length > 0) {
    const avgScore = job.results.reduce((sum, r) => sum + r.score, 0) / job.results.length;
    score += avgScore * 10;
  }
  
  return Math.round(Math.min(score, 100));
}

/**
 * Clean up expired Caesar research jobs
 */
export async function cleanupExpiredCaesarJobs(): Promise<number> {
  const result = await query(
    'DELETE FROM caesar_research_jobs WHERE expires_at < NOW()',
    []
  );
  
  return result.rowCount || 0;
}

/**
 * Get Caesar research statistics
 */
export async function getCaesarStats(): Promise<{
  total: number;
  completed: number;
  failed: number;
  avgQuality: number;
  totalCost: number;
}> {
  const result = await query(
    `SELECT 
       COUNT(*) as total,
       SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
       SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
       AVG(data_quality_score) as avg_quality,
       SUM(cost_usd) as total_cost
     FROM caesar_research_jobs`,
    []
  );
  
  const row = result.rows[0];
  return {
    total: parseInt(row.total) || 0,
    completed: parseInt(row.completed) || 0,
    failed: parseInt(row.failed) || 0,
    avgQuality: parseFloat(row.avg_quality) || 0,
    totalCost: parseFloat(row.total_cost) || 0
  };
}
