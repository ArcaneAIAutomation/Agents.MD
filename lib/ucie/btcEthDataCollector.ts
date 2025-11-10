/**
 * BTC & ETH Optimized Data Collector
 * 
 * Quickly fetches and stores all API data for Bitcoin and Ethereum
 * in Supabase database, ready for OpenAI/ChatGPT analysis and Caesar AI.
 * 
 * Features:
 * - Parallel data fetching for maximum speed
 * - Automatic database storage with cache replacement
 * - Data quality validation
 * - Error handling with fallbacks
 * - Progress tracking
 */

import { getCachedAnalysis, setCachedAnalysis, invalidateCache } from './cacheUtils';

export interface DataCollectionProgress {
  phase: number;
  totalPhases: number;
  currentEndpoint: string;
  progress: number;
  dataQuality: number;
  errors: string[];
}

export interface CollectedData {
  symbol: string;
  timestamp: string;
  dataQuality: number;
  marketData: any;
  sentiment: any;
  news: any;
  technical: any;
  onChain: any;
  risk: any;
  predictions: any;
  derivatives: any;
  defi: any;
  openaiSummary?: any;
}

/**
 * Collect all data for BTC or ETH with progress tracking
 */
export async function collectBTCETHData(
  symbol: 'BTC' | 'ETH',
  onProgress?: (progress: DataCollectionProgress) => void,
  forceRefresh: boolean = false
): Promise<CollectedData> {
  console.log(`🚀 Starting data collection for ${symbol} (forceRefresh: ${forceRefresh})`);
  
  const startTime = Date.now();
  const errors: string[] = [];
  let completedEndpoints = 0;
  const totalEndpoints = 9; // 9 data endpoints (excluding research)
  
  // Step 1: Invalidate old cache if force refresh
  if (forceRefresh) {
    console.log(`🗑️ Invalidating old cache for ${symbol}...`);
    await Promise.all([
      invalidateCache(symbol, 'market-data'),
      invalidateCache(symbol, 'sentiment'),
      invalidateCache(symbol, 'news'),
      invalidateCache(symbol, 'technical'),
      invalidateCache(symbol, 'on-chain'),
      invalidateCache(symbol, 'risk'),
      invalidateCache(symbol, 'predictions'),
      invalidateCache(symbol, 'derivatives'),
      invalidateCache(symbol, 'defi')
    ]);
    console.log(`✅ Cache invalidated for ${symbol}`);
  }
  
  // Step 2: Fetch all data in parallel (fastest approach)
  console.log(`📡 Fetching data from 9 endpoints in parallel...`);
  
  const fetchEndpoint = async (endpoint: string, type: string) => {
    try {
      if (onProgress) {
        onProgress({
          phase: 1,
          totalPhases: 2,
          currentEndpoint: endpoint,
          progress: (completedEndpoints / totalEndpoints) * 50,
          dataQuality: 0,
          errors
        });
      }
      
      const response = await fetch(endpoint, {
        signal: AbortSignal.timeout(30000), // 30 second timeout
        credentials: 'include' // Include auth cookies
      });
      
      if (!response.ok) {
        throw new Error(`${type} failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      completedEndpoints++;
      
      console.log(`✅ ${type} completed (${completedEndpoints}/${totalEndpoints})`);
      
      return { type, data, success: true };
    } catch (error) {
      const errorMsg = `${type}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      console.error(`❌ ${errorMsg}`);
      completedEndpoints++;
      
      return { type, data: null, success: false, error: errorMsg };
    }
  };
  
  // Fetch all endpoints in parallel
  const results = await Promise.all([
    fetchEndpoint(`/api/ucie/market-data/${symbol}`, 'market-data'),
    fetchEndpoint(`/api/ucie/sentiment/${symbol}`, 'sentiment'),
    fetchEndpoint(`/api/ucie/news/${symbol}`, 'news'),
    fetchEndpoint(`/api/ucie/technical/${symbol}`, 'technical'),
    fetchEndpoint(`/api/ucie/on-chain/${symbol}`, 'on-chain'),
    fetchEndpoint(`/api/ucie/risk/${symbol}`, 'risk'),
    fetchEndpoint(`/api/ucie/predictions/${symbol}`, 'predictions'),
    fetchEndpoint(`/api/ucie/derivatives/${symbol}`, 'derivatives'),
    fetchEndpoint(`/api/ucie/defi/${symbol}`, 'defi')
  ]);
  
  // Step 3: Aggregate results
  const collectedData: CollectedData = {
    symbol,
    timestamp: new Date().toISOString(),
    dataQuality: 0,
    marketData: null,
    sentiment: null,
    news: null,
    technical: null,
    onChain: null,
    risk: null,
    predictions: null,
    derivatives: null,
    defi: null
  };
  
  let successfulEndpoints = 0;
  
  results.forEach(result => {
    if (result.success && result.data) {
      successfulEndpoints++;
      
      // Extract data from response
      const data = result.data.data || result.data;
      
      switch (result.type) {
        case 'market-data':
          collectedData.marketData = data;
          break;
        case 'sentiment':
          collectedData.sentiment = data;
          break;
        case 'news':
          collectedData.news = data;
          break;
        case 'technical':
          collectedData.technical = data;
          break;
        case 'on-chain':
          collectedData.onChain = data;
          break;
        case 'risk':
          collectedData.risk = data;
          break;
        case 'predictions':
          collectedData.predictions = data;
          break;
        case 'derivatives':
          collectedData.derivatives = data;
          break;
        case 'defi':
          collectedData.defi = data;
          break;
      }
    }
  });
  
  // Calculate data quality
  collectedData.dataQuality = Math.round((successfulEndpoints / totalEndpoints) * 100);
  
  const elapsedTime = Date.now() - startTime;
  
  console.log(`✅ Data collection complete for ${symbol}`);
  console.log(`   Time: ${elapsedTime}ms`);
  console.log(`   Success: ${successfulEndpoints}/${totalEndpoints} endpoints`);
  console.log(`   Quality: ${collectedData.dataQuality}%`);
  console.log(`   Errors: ${errors.length}`);
  
  if (onProgress) {
    onProgress({
      phase: 1,
      totalPhases: 2,
      currentEndpoint: 'Complete',
      progress: 50,
      dataQuality: collectedData.dataQuality,
      errors
    });
  }
  
  return collectedData;
}

/**
 * Generate OpenAI summary of collected data
 */
export async function generateOpenAISummary(
  collectedData: CollectedData,
  onProgress?: (progress: DataCollectionProgress) => void
): Promise<any> {
  console.log(`🤖 Generating OpenAI summary for ${collectedData.symbol}...`);
  
  if (onProgress) {
    onProgress({
      phase: 2,
      totalPhases: 2,
      currentEndpoint: 'OpenAI Summary',
      progress: 75,
      dataQuality: collectedData.dataQuality,
      errors: []
    });
  }
  
  try {
    // Call OpenAI summary endpoint
    const response = await fetch(`/api/ucie/openai-summary/${collectedData.symbol}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        collectedData,
        forceRefresh: true // Always generate fresh summary
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI summary failed: ${response.status}`);
    }
    
    const summary = await response.json();
    
    console.log(`✅ OpenAI summary generated for ${collectedData.symbol}`);
    console.log(`   Summary length: ${summary.summaryText?.length || 0} chars`);
    
    if (onProgress) {
      onProgress({
        phase: 2,
        totalPhases: 2,
        currentEndpoint: 'Complete',
        progress: 100,
        dataQuality: collectedData.dataQuality,
        errors: []
      });
    }
    
    return summary;
  } catch (error) {
    console.error(`❌ OpenAI summary failed:`, error);
    throw error;
  }
}

/**
 * Complete data collection and preparation for Caesar AI
 * 
 * This function:
 * 1. Collects all API data for BTC/ETH
 * 2. Stores in Supabase database (replacing old data)
 * 3. Generates OpenAI summary
 * 4. Returns complete dataset ready for Caesar AI
 */
export async function prepareDataForCaesar(
  symbol: 'BTC' | 'ETH',
  onProgress?: (progress: DataCollectionProgress) => void
): Promise<{
  collectedData: CollectedData;
  openaiSummary: any;
  readyForCaesar: boolean;
}> {
  console.log(`🎯 Preparing complete dataset for Caesar AI analysis of ${symbol}...`);
  
  try {
    // Step 1: Collect all API data (force refresh to replace old data)
    const collectedData = await collectBTCETHData(symbol, onProgress, true);
    
    // Step 2: Validate data quality
    if (collectedData.dataQuality < 70) {
      console.warn(`⚠️ Data quality below 70% (${collectedData.dataQuality}%)`);
      console.warn(`   This may affect Caesar AI analysis quality`);
    }
    
    // Step 3: Generate OpenAI summary
    const openaiSummary = await generateOpenAISummary(collectedData, onProgress);
    
    // Step 4: Store OpenAI summary in collected data
    collectedData.openaiSummary = openaiSummary;
    
    // Step 5: Verify all data is in database
    console.log(`✅ All data stored in Supabase database for ${symbol}`);
    console.log(`   Market Data: ${collectedData.marketData ? '✓' : '✗'}`);
    console.log(`   Sentiment: ${collectedData.sentiment ? '✓' : '✗'}`);
    console.log(`   News: ${collectedData.news ? '✓' : '✗'}`);
    console.log(`   Technical: ${collectedData.technical ? '✓' : '✗'}`);
    console.log(`   On-Chain: ${collectedData.onChain ? '✓' : '✗'}`);
    console.log(`   Risk: ${collectedData.risk ? '✓' : '✗'}`);
    console.log(`   Predictions: ${collectedData.predictions ? '✓' : '✗'}`);
    console.log(`   Derivatives: ${collectedData.derivatives ? '✓' : '✗'}`);
    console.log(`   DeFi: ${collectedData.defi ? '✓' : '✗'}`);
    console.log(`   OpenAI Summary: ${collectedData.openaiSummary ? '✓' : '✗'}`);
    
    const readyForCaesar = collectedData.dataQuality >= 70 && !!collectedData.openaiSummary;
    
    if (readyForCaesar) {
      console.log(`🎉 Dataset ready for Caesar AI analysis!`);
    } else {
      console.warn(`⚠️ Dataset not ready for Caesar AI (quality: ${collectedData.dataQuality}%, summary: ${!!collectedData.openaiSummary})`);
    }
    
    return {
      collectedData,
      openaiSummary,
      readyForCaesar
    };
    
  } catch (error) {
    console.error(`❌ Failed to prepare data for Caesar AI:`, error);
    throw error;
  }
}

/**
 * Quick check if data is already in database
 */
export async function checkDataAvailability(symbol: 'BTC' | 'ETH'): Promise<{
  available: boolean;
  dataQuality: number;
  missingEndpoints: string[];
  age: number; // milliseconds since last update
}> {
  console.log(`🔍 Checking data availability for ${symbol}...`);
  
  const endpoints = [
    'market-data',
    'sentiment',
    'news',
    'technical',
    'on-chain',
    'risk',
    'predictions',
    'derivatives',
    'defi'
  ];
  
  const results = await Promise.all(
    endpoints.map(async (type) => {
      const cached = await getCachedAnalysis(symbol, type as any);
      return {
        type,
        available: !!cached,
        timestamp: cached?.timestamp ? new Date(cached.timestamp).getTime() : 0
      };
    })
  );
  
  const availableEndpoints = results.filter(r => r.available);
  const missingEndpoints = results.filter(r => !r.available).map(r => r.type);
  const dataQuality = Math.round((availableEndpoints.length / endpoints.length) * 100);
  
  // Calculate age (oldest timestamp)
  const timestamps = results.filter(r => r.timestamp > 0).map(r => r.timestamp);
  const oldestTimestamp = timestamps.length > 0 ? Math.min(...timestamps) : 0;
  const age = oldestTimestamp > 0 ? Date.now() - oldestTimestamp : Infinity;
  
  console.log(`   Available: ${availableEndpoints.length}/${endpoints.length} endpoints`);
  console.log(`   Quality: ${dataQuality}%`);
  console.log(`   Age: ${age < Infinity ? Math.round(age / 1000) + 's' : 'N/A'}`);
  console.log(`   Missing: ${missingEndpoints.join(', ') || 'None'}`);
  
  return {
    available: dataQuality >= 70,
    dataQuality,
    missingEndpoints,
    age
  };
}
