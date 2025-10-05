import type { NextApiRequest, NextApiResponse } from 'next';
import { Caesar } from '../../../utils/caesarClient';

/**
 * Caesar API Market Research Endpoint
 * Deep dive research on specific crypto topics
 * 
 * Query params:
 * - topic: research topic (required)
 * - depth: 1-10 compute units (default: 3)
 */

interface ResearchResponse {
  success: boolean;
  data?: {
    job_id: string;
    content: string;
    sources: Array<{
      title: string;
      url: string;
      citation_index: number;
    }>;
  };
  error?: string;
  timestamp: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResearchResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const { topic, depth = '3' } = req.query;

    if (!topic || typeof topic !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Topic parameter is required',
        timestamp: new Date().toISOString(),
      });
    }

    const computeUnits = Math.min(Math.max(parseInt(depth as string), 1), 10);

    // Create research job
    const job = await Caesar.createResearch({
      query: topic,
      compute_units: computeUnits,
    });

    // Poll until completed (max 10 minutes for deep research)
    const completedJob = await Caesar.pollUntilComplete(job.id, 300, 2000);

    // Extract sources
    const sources = (completedJob.results || []).map(result => ({
      title: result.title,
      url: result.url,
      citation_index: result.citation_index,
    }));

    // Cache for 30 minutes
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate');

    return res.status(200).json({
      success: true,
      data: {
        job_id: completedJob.id,
        content: completedJob.content || '',
        sources,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Caesar market research error:', error);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
}
