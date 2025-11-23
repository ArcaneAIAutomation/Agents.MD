/**
 * UCIE OpenAI Summary - Start Analysis (Async)
 * 
 * POST /api/ucie/openai-summary-start/[symbol]
 * 
 * Starts GPT-5.1 analysis in background, returns jobId immediately
 * Frontend polls /api/ucie/openai-summary-poll/[jobId] every 10 seconds
 * 
 * ✅ ASYNC: Avoids Vercel 60-second timeout
 * ✅ POLLING: Frontend checks status every 10 seconds
 * ✅ BULLETPROOF: Can run for up to 3 minutes
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../../lib/db';
import { withOptionalAuth, AuthenticatedRequest } from '../../../../middleware/auth';

interface StartResponse {
  success: boolean;
  jobId?: string;
  status?: string;
  error?: string;
  timestamp: string;
}

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<StartResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      timestamp: new Date().toISOString(),
    });
  }

  const { symbol } = req.query;
  const userId = req.user?.id || null;

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Invalid symbol',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const symbolUpper = symbol.toUpperCase();
    const { collectedData, context } = req.body;

    if (!collectedData || !context) {
      return res.status(400).json({
        success: false,
        error: 'Missing collectedData or context',
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`🚀 Starting GPT-5.1 analysis for ${symbolUpper}...`);

    // Create job in database
    const result = await query(
      `INSERT INTO ucie_openai_jobs (symbol, user_id, status, context_data, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING id, status`,
      [symbolUpper, userId, 'queued', JSON.stringify({ collectedData, context })]
    );

    const jobId = result.rows[0].id;
    console.log(`✅ Job created: ${jobId}`);

    // Trigger background processing (fire and forget)
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    fetch(`${baseUrl}/api/ucie/openai-summary-process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, symbol: symbolUpper, collectedData, context })
    }).catch(err => console.error('Background process trigger failed:', err));

    // Return immediately with jobId
    return res.status(200).json({
      success: true,
      jobId: jobId.toString(),
      status: 'queued',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Failed to start GPT-5.1 analysis:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start analysis',
      timestamp: new Date().toISOString(),
    });
  }
}

export default withOptionalAuth(handler);
