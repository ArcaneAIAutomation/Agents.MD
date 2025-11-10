/**
 * Caesar AI Job Polling Endpoint
 * 
 * Polls Caesar AI job status with progress tracking
 * Returns real-time updates every 60 seconds
 * 
 * RULES:
 * 1. No fallback/fictitious data
 * 2. 15-minute timeout for Caesar AI
 * 3. Poll every 60 seconds
 * 4. Provide progress updates to user
 */

import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { jobId } = req.query;

  if (!jobId || typeof jobId !== 'string') {
    return res.status(400).json({ error: 'Job ID is required' });
  }

  try {
    console.log(`🔄 Polling Caesar AI job: ${jobId}`);

    // Call Caesar API
    const response = await fetch(`https://api.caesar.xyz/research/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.CAESAR_API_KEY}`
      }
    });

    if (!response.ok) {
      console.error(`❌ Caesar API error: ${response.status}`);
      return res.status(response.status).json({
        error: 'Failed to poll Caesar AI job',
        status: response.status
      });
    }

    const data = await response.json();

    // Calculate progress
    const createdAt = new Date(data.created_at);
    const elapsedSeconds = Math.floor((Date.now() - createdAt.getTime()) / 1000);
    const estimatedTotalSeconds = 12 * 60; // 12 minutes
    const percentComplete = Math.min(95, Math.floor((elapsedSeconds / estimatedTotalSeconds) * 100));

    // Return status with progress
    return res.status(200).json({
      success: true,
      jobId: data.id,
      status: data.status,
      progress: {
        elapsedSeconds,
        estimatedTotalSeconds,
        percentComplete,
        message: getProgressMessage(data.status, elapsedSeconds)
      },
      data: data.status === 'completed' ? {
        content: data.content,
        transformedContent: data.transformed_content,
        results: data.results
      } : null
    });

  } catch (error) {
    console.error('❌ Error polling Caesar job:', error);
    return res.status(500).json({
      error: 'Failed to poll Caesar AI job',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get user-friendly progress message
 */
function getProgressMessage(status: string, elapsedSeconds: number): string {
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  
  switch (status) {
    case 'queued':
      return `Analysis queued and waiting to start... (${minutes}m ${seconds}s elapsed)`;
    case 'researching':
      return `Analyzing market data, news, and sources... (${minutes}m ${seconds}s elapsed)`;
    case 'processing':
      return `Processing research results and generating insights... (${minutes}m ${seconds}s elapsed)`;
    case 'completed':
      return `Analysis complete! (${minutes}m ${seconds}s total)`;
    case 'failed':
      return `Analysis failed after ${minutes}m ${seconds}s`;
    default:
      return `Status: ${status} (${minutes}m ${seconds}s elapsed)`;
  }
}
