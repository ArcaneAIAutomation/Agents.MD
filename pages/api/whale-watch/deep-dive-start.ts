import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';

/**
 * Start Deep Dive Analysis (Async)
 * 
 * Creates a job in the database and returns immediately
 * Frontend polls /deep-dive-poll/[jobId] for results
 * 
 * This avoids Vercel 60-second timeout on Hobby plan
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

    // Create job in database
    const result = await query(
      `INSERT INTO whale_analysis 
       (tx_hash, analysis_provider, analysis_type, analysis_data, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        whale.txHash,
        'openai',
        'deep-dive',
        JSON.stringify({ whale }), // Store whale data for processing
        'pending'
      ]
    );

    const jobId = result.rows[0].id;
    console.log(`✅ Created job ${jobId} for ${whale.txHash.substring(0, 20)}`);

    // Trigger background processing (Vercel will handle this)
    // The actual analysis will happen in a separate request
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    // Fire and forget - don't wait for response
    fetch(`${baseUrl}/api/whale-watch/deep-dive-process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, whale }),
    }).catch(error => {
      console.error('⚠️ Failed to trigger background processing:', error);
    });

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
