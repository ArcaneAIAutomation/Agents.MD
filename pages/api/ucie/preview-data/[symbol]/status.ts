/**
 * UCIE Preview Data Status Endpoint
 * 
 * GET /api/ucie/preview-data/BTC/status
 * 
 * Returns real-time status of data collection and AI analysis
 * by checking Supabase database entries
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getCachedAnalysis } from '../../../../../lib/ucie/cacheUtils';
import { getGeminiAnalysis } from '../../../../../lib/ucie/geminiAnalysisStorage';
import { withOptionalAuth, AuthenticatedRequest } from '../../../../../middleware/auth';

interface DataSourceStatus {
  name: string;
  type: string;
  available: boolean;
  cached: boolean;
  quality: number | null;
  timestamp: string | null;
}

interface AnalysisStatus {
  status: 'initializing' | 'collecting' | 'analyzing' | 'complete' | 'error';
  progress: {
    dataCollection: {
      completed: number;
      total: number;
      percentage: number;
    };
    aiAnalysis: {
      started: boolean;
      complete: boolean;
      estimatedTimeRemaining: number | null;
    };
  };
  dataSources: DataSourceStatus[];
  geminiAnalysis: {
    available: boolean;
    wordCount: number | null;
    quality: number | null;
    timestamp: string | null;
  };
  caesarReady: boolean;
  message: string;
  estimatedTotalTime: number;
}

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<AnalysisStatus | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { symbol } = req.query;
  const userId = req.user?.id || 'anonymous';

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'Invalid symbol parameter' });
  }

  const symbolUpper = symbol.toUpperCase();

  try {
    // ✅ Check database for all 5 core data sources
    const dataSourceChecks = [
      { name: 'Market Data', type: 'market-data', apis: 4 },
      { name: 'Sentiment', type: 'sentiment', apis: 3 },
      { name: 'Technical Analysis', type: 'technical', apis: 1 },
      { name: 'News', type: 'news', apis: 1 },
      { name: 'On-Chain', type: 'on-chain', apis: 1 }
    ];

    const dataSources: DataSourceStatus[] = [];
    let completedCount = 0;

    // Check each data source in database
    for (const source of dataSourceChecks) {
      const cached = await getCachedAnalysis(symbolUpper, source.type as any);
      
      const isAvailable = !!cached;
      
      // ✅ ROBUST QUALITY EXTRACTION: Check multiple possible locations
      // Data can be stored in different formats depending on the API
      let quality: number | null = null;
      if (cached) {
        quality = cached.dataQuality 
          ?? cached.data?.dataQuality 
          ?? cached.quality 
          ?? cached.data?.quality
          ?? (cached.success === true ? 100 : null) // If success flag exists, assume 100%
          ?? null;
      }
      
      // ✅ ROBUST TIMESTAMP EXTRACTION
      let timestamp: string | null = null;
      if (cached) {
        timestamp = cached.timestamp 
          ?? cached.data?.timestamp 
          ?? cached.fetchedAt 
          ?? cached.data?.fetchedAt
          ?? null;
      }
      
      // Log for debugging
      console.log(`   ${source.name}: ${isAvailable ? '✅' : '❌'} (quality: ${quality ?? 'N/A'})`);

      dataSources.push({
        name: source.name,
        type: source.type,
        available: isAvailable,
        cached: isAvailable,
        quality,
        timestamp
      });

      if (isAvailable) completedCount++;
    }

    const totalSources = dataSourceChecks.length;
    const collectionPercentage = Math.round((completedCount / totalSources) * 100);

    // ✅ Check for Gemini analysis in database
    // CRITICAL FIX: Check for ALL analysis types (summary, fallback, error)
    // The preview-data endpoint stores with different analysisTypes based on success/failure
    let geminiAnalysis = await getGeminiAnalysis(symbolUpper, userId, 'summary');
    
    // If no 'summary' found, check for 'fallback' type
    if (!geminiAnalysis) {
      geminiAnalysis = await getGeminiAnalysis(symbolUpper, userId, 'fallback');
    }
    
    // If still not found, check for 'error' type (at least we know it was attempted)
    if (!geminiAnalysis) {
      geminiAnalysis = await getGeminiAnalysis(symbolUpper, userId, 'error');
    }
    
    // Also check for 'anonymous' user if current user has no analysis
    if (!geminiAnalysis && userId !== 'anonymous') {
      geminiAnalysis = await getGeminiAnalysis(symbolUpper, 'anonymous', 'summary');
      if (!geminiAnalysis) {
        geminiAnalysis = await getGeminiAnalysis(symbolUpper, 'anonymous', 'fallback');
      }
      if (!geminiAnalysis) {
        geminiAnalysis = await getGeminiAnalysis(symbolUpper, 'anonymous', 'error');
      }
    }
    
    const geminiAvailable = !!geminiAnalysis;
    const geminiWordCount = geminiAnalysis?.summary_text 
      ? geminiAnalysis.summary_text.split(' ').length 
      : null;
    
    // Log for debugging
    console.log(`📊 Status check for ${symbolUpper}:`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Data sources found: ${completedCount}/${totalSources}`);
    console.log(`   Gemini analysis found: ${geminiAvailable}`);
    if (geminiAnalysis) {
      console.log(`   Analysis type: ${geminiAnalysis.analysis_type}`);
      console.log(`   Word count: ${geminiWordCount}`);
    }

    // ✅ Determine overall status
    let status: AnalysisStatus['status'] = 'initializing';
    let message = 'Initializing analysis...';
    let estimatedTimeRemaining: number | null = null;

    if (completedCount === 0) {
      status = 'initializing';
      message = 'Starting data collection from 9 APIs...';
      estimatedTimeRemaining = 300; // 5 minutes total
    } else if (completedCount < totalSources) {
      status = 'collecting';
      message = `Collecting data... (${completedCount}/${totalSources} sources complete)`;
      estimatedTimeRemaining = 300 - (completedCount * 60); // Estimate 1 min per source
    } else if (completedCount === totalSources && !geminiAvailable) {
      status = 'analyzing';
      message = 'Data collected! Generating AI analysis... (estimated 4-5 minutes)';
      estimatedTimeRemaining = 270; // 4.5 minutes for Gemini
    } else if (geminiAvailable) {
      status = 'complete';
      message = 'Analysis complete! Ready for Caesar AI deep research.';
      estimatedTimeRemaining = 0;
    }

    // ✅ Caesar readiness check
    const caesarReady = completedCount === totalSources && geminiAvailable;

    // ✅ Build response
    const response: AnalysisStatus = {
      status,
      progress: {
        dataCollection: {
          completed: completedCount,
          total: totalSources,
          percentage: collectionPercentage
        },
        aiAnalysis: {
          started: completedCount === totalSources,
          complete: geminiAvailable,
          estimatedTimeRemaining
        }
      },
      dataSources,
      geminiAnalysis: {
        available: geminiAvailable,
        wordCount: geminiWordCount,
        quality: geminiAnalysis?.data_quality_score || null,
        timestamp: geminiAnalysis?.created_at || null
      },
      caesarReady,
      message,
      estimatedTotalTime: 300 // 5 minutes total
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('❌ Status check error:', error);
    return res.status(500).json({
      error: 'Failed to check analysis status'
    });
  }
}

export default withOptionalAuth(handler);
