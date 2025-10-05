import type { NextApiRequest, NextApiResponse } from 'next';
import { Caesar } from '../../../utils/caesarClient';

/**
 * Caesar API Crypto News Endpoint
 * Generates crypto news briefs using Caesar's research engine
 * 
 * Query params:
 * - assets: comma-separated list (default: BTC,ETH,SOL)
 * - hours: lookback period (default: 12)
 * - format: json or markdown (default: json)
 */

interface NewsItem {
  asset: string;
  headline: string;
  summary: string;
  url: string;
  time_utc: string;
}

interface NewsResponse {
  success: boolean;
  data?: {
    date_utc: string;
    items: NewsItem[];
    job_id: string;
  };
  error?: string;
  timestamp: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<NewsResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const {
      assets = 'BTC,ETH,SOL',
      hours = '12',
      format = 'json'
    } = req.query;

    // Build research query
    const query = `Summarize the last ${hours}h of ${assets} market and on-chain news with links. Include times (UTC) and keep it concise. Focus on price movements, major announcements, regulatory news, and significant on-chain activity.`;

    // System prompt for structured output
    const systemPrompt = format === 'json'
      ? `You are formatting an output that is already fully researched. Convert the content into strict JSON: { date_utc, items: [{ asset, headline, summary, url, time_utc }] }. items length 8-12. Headlines ≤100 chars. Use ISO 8601 times (UTC). Every item must include a working url drawn from the citations.`
      : `Return a markdown news brief with 5-8 bullets per asset. Each bullet should include: headline, brief summary, timestamp (UTC), and [Source] link.`;

    // Create research job
    const job = await Caesar.createResearch({
      query,
      compute_units: 2, // 2 CU for balanced speed/depth
      system_prompt: systemPrompt,
    });

    // Poll until completed (max 2 minutes)
    const completedJob = await Caesar.pollUntilComplete(job.id, 60, 2000);

    // Parse response based on format
    if (format === 'json' && completedJob.transformed_content) {
      try {
        const parsed = JSON.parse(completedJob.transformed_content);
        
        // Cache for 5 minutes
        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
        
        return res.status(200).json({
          success: true,
          data: {
            ...parsed,
            job_id: completedJob.id,
          },
          timestamp: new Date().toISOString(),
        });
      } catch (parseError) {
        // Fallback to raw content if JSON parsing fails
        return res.status(200).json({
          success: true,
          data: {
            date_utc: new Date().toISOString(),
            items: [],
            job_id: completedJob.id,
          },
          error: 'Failed to parse structured output, check job content',
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Return markdown or raw content
    return res.status(200).json({
      success: true,
      data: {
        date_utc: new Date().toISOString(),
        items: [{
          asset: 'ALL',
          headline: 'Crypto News Brief',
          summary: completedJob.content || completedJob.transformed_content || '',
          url: '',
          time_utc: new Date().toISOString(),
        }],
        job_id: completedJob.id,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Caesar crypto news error:', error);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
}
