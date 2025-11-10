/**
 * UCIE Optimized Preview Data API
 * 
 * GET /api/ucie/preview-data-optimized/[symbol]?refresh=true
 * 
 * Optimized for BTC & ETH:
 * 1. Collects ALL API data in parallel (fastest)
 * 2. Stores in Supabase database (replacing old data)
 * 3. Generates OpenAI summary
 * 4. Returns preview for user confirmation
 * 5. Data is ready for Caesar AI
 * 
 * Features:
 * - Force refresh to replace old data
 * - Parallel data collection (10-15 seconds)
 * - OpenAI summary generation
 * - Database storage with cache replacement
 * - Progress tracking
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { withOptionalAuth, AuthenticatedRequest } from '../../../../middleware/auth';
import { prepareDataForCaesar, checkDataAvailability } from '../../../../lib/ucie/btcEthDataCollector';

interface DataPreview {
  symbol: string;
  timestamp: string;
  dataQuality: number;
  summary: string;
  collectedData: {
    marketData: any;
    sentiment: any;
    technical: any;
    news: any;
    onChain: any;
    risk: any;
    predictions: any;
    derivatives: any;
    defi: any;
  };
  openaiSummary: any;
  apiStatus: {
    working: string[];
    failed: string[];
    total: number;
    successRate: number;
  };
  readyForCaesar: boolean;
}

interface ApiResponse {
  success: boolean;
  data?: DataPreview;
  error?: string;
}

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<ApiResponse>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET.'
    });
  }
  
  const { symbol } = req.query;
  const refresh = req.query.refresh === 'true';
  
  // Validate symbol
  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Invalid symbol parameter'
    });
  }
  
  const symbolUpper = symbol.toUpperCase() as 'BTC' | 'ETH';
  
  // Only allow BTC and ETH
  if (symbolUpper !== 'BTC' && symbolUpper !== 'ETH') {
    return res.status(400).json({
      success: false,
      error: 'Only BTC and ETH are supported'
    });
  }
  
  try {
    console.log(`🚀 Preview data request for ${symbolUpper} (refresh: ${refresh})`);
    
    // Check if data is already available (unless refresh requested)
    if (!refresh) {
      const availability = await checkDataAvailability(symbolUpper);
      
      if (availability.available && availability.age < 15 * 60 * 1000) {
        console.log(`✅ Using existing data for ${symbolUpper} (age: ${Math.round(availability.age / 1000)}s)`);
        // Return existing data (implement this if needed)
      }
    }
    
    // Prepare complete dataset for Caesar AI
    console.log(`📊 Collecting and storing all data for ${symbolUpper}...`);
    
    const { collectedData, openaiSummary, readyForCaesar } = await prepareDataForCaesar(
      symbolUpper,
      (progress) => {
        console.log(`   Progress: Phase ${progress.phase}/${progress.totalPhases} - ${progress.currentEndpoint} (${progress.progress}%)`);
      }
    );
    
    // Build API status
    const working: string[] = [];
    const failed: string[] = [];
    
    const endpoints = [
      { name: 'Market Data', data: collectedData.marketData },
      { name: 'Sentiment', data: collectedData.sentiment },
      { name: 'News', data: collectedData.news },
      { name: 'Technical', data: collectedData.technical },
      { name: 'On-Chain', data: collectedData.onChain },
      { name: 'Risk', data: collectedData.risk },
      { name: 'Predictions', data: collectedData.predictions },
      { name: 'Derivatives', data: collectedData.derivatives },
      { name: 'DeFi', data: collectedData.defi }
    ];
    
    endpoints.forEach(endpoint => {
      if (endpoint.data) {
        working.push(endpoint.name);
      } else {
        failed.push(endpoint.name);
      }
    });
    
    const successRate = Math.round((working.length / endpoints.length) * 100);
    
    // Build preview response
    const preview: DataPreview = {
      symbol: symbolUpper,
      timestamp: collectedData.timestamp,
      dataQuality: collectedData.dataQuality,
      summary: openaiSummary?.summaryText || 'Summary generation in progress...',
      collectedData: {
        marketData: collectedData.marketData,
        sentiment: collectedData.sentiment,
        technical: collectedData.technical,
        news: collectedData.news,
        onChain: collectedData.onChain,
        risk: collectedData.risk,
        predictions: collectedData.predictions,
        derivatives: collectedData.derivatives,
        defi: collectedData.defi
      },
      openaiSummary,
      apiStatus: {
        working,
        failed,
        total: endpoints.length,
        successRate
      },
      readyForCaesar
    };
    
    console.log(`✅ Preview data ready for ${symbolUpper}`);
    console.log(`   Data Quality: ${preview.dataQuality}%`);
    console.log(`   APIs Working: ${working.length}/${endpoints.length}`);
    console.log(`   Ready for Caesar: ${readyForCaesar ? 'Yes' : 'No'}`);
    
    return res.status(200).json({
      success: true,
      data: preview
    });
    
  } catch (error) {
    console.error(`❌ Preview data error for ${symbolUpper}:`, error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to collect preview data'
    });
  }
}

export default withOptionalAuth(handler);

/**
 * API Configuration
 * Increase timeout for data collection
 */
export const config = {
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '2mb',
    },
  },
  maxDuration: 60, // 60 seconds for data collection
};
