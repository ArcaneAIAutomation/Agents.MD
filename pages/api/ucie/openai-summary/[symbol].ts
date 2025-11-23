/**
 * OpenAI Summary API Endpoint (REDIRECT TO ASYNC)
 * 
 * ⚠️ This endpoint now redirects to async pattern to avoid Vercel 60s timeout
 * 
 * ✅ NEW PATTERN:
 * 1. POST /api/ucie/openai-summary-start/[symbol] - Returns jobId immediately
 * 2. GET /api/ucie/openai-summary-poll/[jobId] - Poll every 3 seconds
 * 
 * This endpoint returns instructions to use the async endpoints instead.
 */

import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { symbol } = req.query;

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
    });
  }

  // Return instructions to use async pattern
  return res.status(200).json({
    success: false,
    deprecated: true,
    message: 'This endpoint is deprecated. Use async pattern to avoid Vercel timeout.',
    instructions: {
      step1: {
        method: 'POST',
        endpoint: `/api/ucie/openai-summary-start/${symbol}`,
        description: 'Start analysis (returns immediately with jobId)'
      },
      step2: {
        method: 'GET',
        endpoint: '/api/ucie/openai-summary-poll/[jobId]',
        description: 'Poll every 3 seconds until status is "completed"',
        polling: {
          interval: '3 seconds',
          maxTimeout: '30 minutes',
          pattern: 'Whale Watch Deep Dive'
        }
      }
    },
    example: {
      start: `POST /api/ucie/openai-summary-start/${symbol}`,
      poll: 'GET /api/ucie/openai-summary-poll/123'
    }
  });
}
