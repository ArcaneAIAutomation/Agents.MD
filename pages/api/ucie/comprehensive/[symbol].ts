/**
 * UCIE Comprehensive Analysis API Endpoint
 * 
 * GET /api/ucie/comprehensive/[symbol]
 * 
 * Aggregates all UCIE data sources into a single comprehensive response:
 * - Market data (4 exchanges)
 * - Technical analysis (RSI, MACD, Bollinger Bands, etc.)
 * - Sentiment analysis (LunarCrush + Reddit)
 * - News analysis (20 articles with sentiment)
 * - Risk assessment (volatility, correlations, max drawdown)
 * 
 * Returns partial data if some sources fail.
 * Caches results for 5 minutes.
 */

import type { NextApiRequest, NextApiResponse } from 'next';

export interface ComprehensiveAnalysisResponse {
  success: boolean;
  symbol: string;
  timestamp: string;
  dataCompleteness: number; // 0-100%
  overallQuality: number; // 0-100%
  marketData: any | null;
  technicalAnalysis: any | null;
  sentimentAnalysis: any | null;
  newsAnalysis: any | null;
  riskAssessment: any | null;
  sources: {
    marketData: boolean;
    technical: boolean;
    sentiment: boolean;
    news: boolean;
    risk: boolean;
  };
  cacheStatus: 'hit' | 'miss';
  error?: string;
}

// Cache TTL: 5 minutes
const CACHE_TTL = 5 * 60 * 1000; // milliseconds
const cache = new Map<string, { data: any; timestamp: number }>();

/**
 * Fetch data from an endpoint with timeout and retry logic
 */
async function fetchWithTimeout(url: string, timeoutMs: number, retries: number = 2): Promise<any> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      console.log(`🔄 Fetching ${url} (attempt ${attempt + 1}/${retries + 1})`);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`✅ Successfully fetched ${url}`);
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.warn(`⚠️ Attempt ${attempt + 1} failed for ${url}:`, lastError.message);
      
      // Wait before retry (exponential backoff)
      if (attempt < retries) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt), 5000);
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError || new Error('All retry attempts failed');
}

/**
 * Calculate overall data quality score
 */
function calculateOverallQuality(sources: any): number {
  const qualities: number[] = [];
  
  if (sources.marketData?.dataQuality) qualities.push(sources.marketData.dataQuality);
  if (sources.technical?.dataQuality) qualities.push(sources.technical.dataQuality);
  if (sources.sentiment?.dataQuality) qualities.push(sources.sentiment.dataQuality);
  if (sources.news?.dataQuality) qualities.push(sources.news.dataQuality);
  if (sources.risk?.dataQualityScore) qualities.push(sources.risk.dataQualityScore);
  
  if (qualities.length === 0) return 0;
  
  return Math.round(qualities.reduce((a, b) => a + b, 0) / qualities.length);
}

/**
 * Main API handler
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ComprehensiveAnalysisResponse>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      symbol: '',
      timestamp: new Date().toISOString(),
      dataCompleteness: 0,
      overallQuality: 0,
      marketData: null,
      technicalAnalysis: null,
      sentimentAnalysis: null,
      newsAnalysis: null,
      riskAssessment: null,
      sources: {
        marketData: false,
        technical: false,
        sentiment: false,
        news: false,
        risk: false
      },
      cacheStatus: 'miss',
      error: 'Method not allowed'
    });
  }
  
  const { symbol } = req.query;
  
  // Validate symbol
  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({
      success: false,
      symbol: '',
      timestamp: new Date().toISOString(),
      dataCompleteness: 0,
      overallQuality: 0,
      marketData: null,
      technicalAnalysis: null,
      sentimentAnalysis: null,
      newsAnalysis: null,
      riskAssessment: null,
      sources: {
        marketData: false,
        technical: false,
        sentiment: false,
        news: false,
        risk: false
      },
      cacheStatus: 'miss',
      error: 'Invalid symbol parameter'
    });
  }
  
  // Normalize symbol to uppercase
  const symbolUpper = symbol.toUpperCase();
  const cacheKey = `comprehensive:${symbolUpper}`;
  
  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.status(200).json({
      ...cached.data,
      cacheStatus: 'hit'
    });
  }
  
  try {
    // Use production URL for API calls (serverless functions need absolute URLs)
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://news.arcane.group';
    
    console.log(`🔍 Comprehensive analysis fetching from: ${baseUrl}`);
    console.log(`📊 Using STAGED approach to prevent timeouts`);
    
    // ✅ STAGED APPROACH: Fetch data in stages to prevent timeout
    // Stage 1: Fast endpoints (market data, technical) - 30s timeout each
    console.log(`📊 Stage 1: Fetching market data and technical analysis...`);
    const [marketDataResult, technicalResult] = await Promise.allSettled([
      fetchWithTimeout(`${baseUrl}/api/ucie/market-data/${symbolUpper}`, 30000, 2),
      fetchWithTimeout(`${baseUrl}/api/ucie/technical/${symbolUpper}`, 30000, 2)
    ]);
    
    // Stage 2: Medium endpoints (sentiment, risk) - 30s timeout each
    console.log(`📊 Stage 2: Fetching sentiment and risk analysis...`);
    const [sentimentResult, riskResult] = await Promise.allSettled([
      fetchWithTimeout(`${baseUrl}/api/ucie/sentiment/${symbolUpper}`, 30000, 2),
      fetchWithTimeout(`${baseUrl}/api/ucie/risk/${symbolUpper}`, 30000, 2)
    ]);
    
    // Stage 3: Slow endpoint (news) - 90s timeout with retries
    console.log(`📊 Stage 3: Fetching news (this may take longer)...`);
    const [newsResult] = await Promise.allSettled([
      fetchWithTimeout(`${baseUrl}/api/ucie/news/${symbolUpper}`, 90000, 2) // 90 seconds with 2 retries
    ]);
    
    // Extract successful results with logging
    const marketData = marketDataResult.status === 'fulfilled' ? marketDataResult.value : null;
    const technical = technicalResult.status === 'fulfilled' ? technicalResult.value : null;
    const sentiment = sentimentResult.status === 'fulfilled' ? sentimentResult.value : null;
    const news = newsResult.status === 'fulfilled' ? newsResult.value : null;
    const risk = riskResult.status === 'fulfilled' ? riskResult.value : null;
    
    // Log failures for debugging
    if (marketDataResult.status === 'rejected') console.error('Market data failed:', marketDataResult.reason);
    if (technicalResult.status === 'rejected') console.error('Technical failed:', technicalResult.reason);
    if (sentimentResult.status === 'rejected') console.error('Sentiment failed:', sentimentResult.reason);
    if (newsResult.status === 'rejected') console.error('News failed:', newsResult.reason);
    if (riskResult.status === 'rejected') console.error('Risk failed:', riskResult.reason);
    
    // Calculate data completeness (how many sources succeeded)
    const sourcesAvailable = {
      marketData: marketData?.success === true,
      technical: technical?.success === true,
      sentiment: sentiment?.success === true,
      news: news?.success === true,
      risk: risk?.success === true
    };
    
    const completenessCount = Object.values(sourcesAvailable).filter(Boolean).length;
    const dataCompleteness = Math.round((completenessCount / 5) * 100);
    
    // Calculate overall quality
    const overallQuality = calculateOverallQuality({
      marketData,
      technical,
      sentiment,
      news,
      risk
    });
    
    // Prepare response
    const response: ComprehensiveAnalysisResponse = {
      success: dataCompleteness >= 40, // At least 2/5 sources must work
      symbol: symbolUpper,
      timestamp: new Date().toISOString(),
      dataCompleteness,
      overallQuality,
      marketData: marketData?.success ? marketData : null,
      technicalAnalysis: technical?.success ? technical : null,
      sentimentAnalysis: sentiment?.success ? sentiment : null,
      newsAnalysis: news?.success ? news : null,
      riskAssessment: risk?.success ? risk : null,
      sources: sourcesAvailable,
      cacheStatus: 'miss'
    };
    
    // Cache the response
    cache.set(cacheKey, {
      data: response,
      timestamp: Date.now()
    });
    
    // Return response
    return res.status(200).json(response);
    
  } catch (error) {
    console.error('Error fetching comprehensive analysis:', error);
    
    return res.status(500).json({
      success: false,
      symbol: symbolUpper,
      timestamp: new Date().toISOString(),
      dataCompleteness: 0,
      overallQuality: 0,
      marketData: null,
      technicalAnalysis: null,
      sentimentAnalysis: null,
      newsAnalysis: null,
      riskAssessment: null,
      sources: {
        marketData: false,
        technical: false,
        sentiment: false,
        news: false,
        risk: false
      },
      cacheStatus: 'miss',
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}
