import type { NextApiRequest, NextApiResponse } from 'next';
import { Caesar } from '../../../../utils/caesarClient';

/**
 * Whale Watch Analysis Polling API
 * Polls Caesar for completed analysis results
 */

interface AnalysisResultResponse {
  success: boolean;
  status?: 'queued' | 'researching' | 'completed' | 'failed' | 'cancelled' | 'expired' | 'pending';
  analysis?: any;
  sources?: any[];
  error?: string;
  timestamp: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AnalysisResultResponse>
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

    console.log(`📊 Checking Caesar job status: ${jobId}`);

    // Get job status from Caesar
    const job = await Caesar.getResearch(jobId);
    
    console.log(`📊 Job status: ${job.status}, has content: ${!!job.content}, has transformed: ${!!job.transformed_content}`);

    if (job.status === 'completed') {
      console.log(`✅ Analysis complete for job: ${jobId}`);

      // Parse the transformed content (JSON)
      let analysis = null;
      if (job.transformed_content) {
        try {
          console.log(`🔍 Parsing transformed_content: ${job.transformed_content.substring(0, 200)}...`);
          analysis = JSON.parse(job.transformed_content);
          console.log(`✅ Successfully parsed analysis JSON`);
        } catch (parseError) {
          console.error('❌ Failed to parse analysis JSON:', parseError);
          console.error('Raw transformed_content:', job.transformed_content);
          // Fallback: use raw content
          analysis = {
            reasoning: job.content || job.transformed_content || 'Analysis completed but format error',
            confidence: 50,
            transaction_type: 'unknown',
            impact_prediction: 'neutral',
            key_findings: ['Analysis completed but could not parse structured output'],
          };
        }
      } else if (job.content) {
        // No transformed content, use raw content
        console.log(`⚠️ No transformed_content, using raw content`);
        analysis = {
          reasoning: job.content,
          confidence: 50,
          transaction_type: 'unknown',
          impact_prediction: 'neutral',
          key_findings: ['Analysis completed without structured output'],
        };
      } else {
        console.error(`❌ No content or transformed_content in completed job`);
        analysis = {
          reasoning: 'Analysis completed but no content returned',
          confidence: 0,
          transaction_type: 'unknown',
          impact_prediction: 'neutral',
          key_findings: ['No analysis content available'],
        };
      }

      // Extract sources
      const sources = (job.results || []).map(result => ({
        title: result.title,
        url: result.url,
        relevance: result.score,
        citation_index: result.citation_index,
      }));

      // Cache completed analysis for 1 hour
      res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

      return res.status(200).json({
        success: true,
        status: 'completed',
        analysis,
        sources,
        timestamp: new Date().toISOString(),
      });
    }

    if (job.status === 'failed' || job.status === 'cancelled' || job.status === 'expired') {
      console.error(`❌ Analysis ${job.status} for job: ${jobId}`);
      return res.status(500).json({
        success: false,
        status: 'failed',
        error: `Analysis job ${job.status}`,
        timestamp: new Date().toISOString(),
      });
    }

    // Still processing (queued, researching, pending)
    console.log(`⏳ Job ${jobId} status: ${job.status}`);
    
    return res.status(200).json({
      success: true,
      status: job.status as any,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Analysis polling error:', error);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get analysis',
      timestamp: new Date().toISOString(),
    });
  }
}
