import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';

/**
 * Deep Dive Analysis - Async Start
 * 
 * Starts analysis job and returns immediately (avoids 60s timeout)
 * Frontend polls /api/whale-watch/deep-dive-poll/[jobId] for results
 * 
 * ✅ ASYNC: Returns job ID immediately
 * ✅ NO TIMEOUT: Processing happens in background
 * ✅ POLLING: Frontend checks status every 2-3 seconds
 */

interface StartResponse {
  success: boolean;
  jobId?: string;
  error?: string;
  timestamp: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StartResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const whale = req.body;

    if (!whale.txHash || !whale.fromAddress || !whale.toAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: txHash, fromAddress, toAddress',
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`🚀 Starting async Deep Dive for ${whale.txHash.substring(0, 20)}...`);

    // ✅ CHECK FOR EXISTING ANALYSIS
    const existingAnalysis = await query(
      `SELECT id, status, analysis_data, created_at
       FROM whale_analysis
       WHERE tx_hash = $1 
         AND analysis_provider = $2 
         AND analysis_type = $3
       ORDER BY created_at DESC
       LIMIT 1`,
      [whale.txHash, 'openai', 'deep-dive']
    );

    let jobId: number;

    if (existingAnalysis.rows.length > 0) {
      const existing = existingAnalysis.rows[0];
      console.log(`📊 Found existing analysis: Job ${existing.id}, Status: ${existing.status}`);

      if (existing.status === 'completed') {
        // Analysis already completed - return existing jobId
        console.log(`✅ Analysis already completed, returning existing job ${existing.id}`);
        return res.status(200).json({
          success: true,
          jobId: existing.id.toString(),
          timestamp: new Date().toISOString(),
        });
      } else if (existing.status === 'analyzing' || existing.status === 'pending') {
        // Analysis in progress - return existing jobId
        console.log(`⏳ Analysis already in progress, returning existing job ${existing.id}`);
        return res.status(200).json({
          success: true,
          jobId: existing.id.toString(),
          timestamp: new Date().toISOString(),
        });
      } else if (existing.status === 'failed') {
        // Previous analysis failed - delete and create new one
        console.log(`🔄 Previous analysis failed, deleting and creating new job...`);
        await query(
          'DELETE FROM whale_analysis WHERE id = $1',
          [existing.id]
        );
        
        // Create new job
        const result = await query(
          `INSERT INTO whale_analysis 
           (tx_hash, analysis_provider, analysis_type, analysis_data, status)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [whale.txHash, 'openai', 'deep-dive', JSON.stringify({ whale }), 'pending']
        );
        jobId = result.rows[0].id;
        console.log(`✅ Created new job ${jobId} after deleting failed one`);
      }
    } else {
      // No existing analysis - create new job
      console.log(`📝 No existing analysis found, creating new job...`);
      const result = await query(
        `INSERT INTO whale_analysis 
         (tx_hash, analysis_provider, analysis_type, analysis_data, status)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [whale.txHash, 'openai', 'deep-dive', JSON.stringify({ whale }), 'pending']
      );
      jobId = result.rows[0].id;
      console.log(`✅ Created job ${jobId} for ${whale.txHash.substring(0, 20)}`);
    }

    // ✅ TRIGGER BACKGROUND PROCESSING (only for new/failed jobs)
    // For completed/in-progress jobs, we already returned above
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    console.log(`🚀 Triggering background processor for job ${jobId}...`);
    
    // Start processing but don't wait for completion
    fetch(`${baseUrl}/api/whale-watch/deep-dive-process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, whale }),
    }).then(response => {
      if (response.ok) {
        console.log(`✅ Background processor started for job ${jobId}`);
      } else {
        console.error(`❌ Background processor failed: ${response.status}`);
      }
    }).catch(error => {
      console.error('⚠️ Failed to trigger background processing:', error);
    });

    // Return immediately with jobId
    return res.status(200).json({
      success: true,
      jobId: jobId.toString(),
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Failed to start Deep Dive:', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start Deep Dive',
      timestamp: new Date().toISOString(),
    });
  }
}
