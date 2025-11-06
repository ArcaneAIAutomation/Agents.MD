/**
 * UCIE Caesar AI Client Utility
 * Specialized Caesar API integration for Universal Crypto Intelligence Engine
 * 
 * Features:
 * - Research job creation with crypto-specific queries
 * - Polling with timeout and error handling
 * - Result parsing and formatting for UCIE
 * - Structured JSON output for analysis
 */

import { Caesar, ResearchJob, ResearchStatus } from '../../utils/caesarClient';

/**
 * Caesar Research Result for UCIE
 */
export interface UCIECaesarResearch {
  technologyOverview: string;
  teamLeadership: string;
  partnerships: string;
  marketPosition: string;
  riskFactors: string[];
  recentDevelopments: string;
  sources: Array<{
    title: string;
    url: string;
    relevance: number;
    citationIndex: number;
  }>;
  confidence: number;
  rawContent?: string;
}

/**
 * Caesar Research Status
 */
export interface UCIECaesarStatus {
  jobId: string;
  status: ResearchStatus;
  progress: number; // 0-100
  estimatedTimeRemaining?: number; // seconds
}

/**
 * Create a comprehensive research query for a cryptocurrency token with context
 */
export function generateCryptoResearchQuery(symbol: string, contextData?: any): string {
  // Build context section if data is available
  let contextSection = '';
  
  if (contextData && Object.keys(contextData).length > 0) {
    contextSection = `\n**REAL-TIME MARKET CONTEXT:**\n\n`;
    
    // Market Data
    if (contextData['market-data'] || contextData.marketData) {
      const market = contextData['market-data'] || contextData.marketData;
      contextSection += `**Current Market Data:**\n`;
      contextSection += `- Price: $${market.price?.toLocaleString() || 'N/A'}\n`;
      contextSection += `- 24h Volume: $${market.volume24h?.toLocaleString() || 'N/A'}\n`;
      contextSection += `- Market Cap: $${market.marketCap?.toLocaleString() || 'N/A'}\n`;
      contextSection += `- 24h Change: ${market.priceChange24h?.toFixed(2) || 'N/A'}%\n\n`;
    }
    
    // Sentiment
    if (contextData.sentiment) {
      contextSection += `**Social Sentiment:**\n`;
      contextSection += `- Overall Score: ${contextData.sentiment.overallScore || 'N/A'}/100\n`;
      contextSection += `- Trend: ${contextData.sentiment.trend || 'N/A'}\n`;
      contextSection += `- 24h Mentions: ${contextData.sentiment.mentions24h || 'N/A'}\n\n`;
    }
    
    // Technical Analysis
    if (contextData.technical) {
      contextSection += `**Technical Analysis:**\n`;
      contextSection += `- RSI: ${contextData.technical.indicators?.rsi || 'N/A'}\n`;
      contextSection += `- MACD Signal: ${contextData.technical.macd?.signal || 'N/A'}\n`;
      contextSection += `- Trend: ${contextData.technical.trend?.direction || 'N/A'}\n\n`;
    }
    
    // On-Chain Data
    if (contextData['on-chain'] || contextData.onChain) {
      const onChain = contextData['on-chain'] || contextData.onChain;
      contextSection += `**On-Chain Metrics:**\n`;
      contextSection += `- Active Addresses: ${onChain.activeAddresses || 'N/A'}\n`;
      contextSection += `- Transaction Volume: ${onChain.transactionVolume || 'N/A'}\n`;
      contextSection += `- Whale Transactions: ${onChain.whaleTransactions?.length || 0}\n\n`;
    }
    
    // News
    if (contextData.news && contextData.news.articles) {
      contextSection += `**Recent News (Top 5):**\n`;
      contextData.news.articles.slice(0, 5).forEach((article: any, i: number) => {
        contextSection += `${i + 1}. ${article.title}\n`;
      });
      contextSection += `\n`;
    }
  }
  
  return `Analyze ${symbol} cryptocurrency comprehensively using this real-time data:
${contextSection}

1. **Technology and Innovation**
   - Core technology and blockchain architecture
   - Unique features and innovations
   - Technical advantages over competitors
   - Development roadmap and progress

2. **Team and Leadership**
   - Founding team background and experience
   - Key leadership and advisors
   - Team credibility and track record
   - Development team size and activity

3. **Partnerships and Ecosystem**
   - Major partnerships and collaborations
   - Ecosystem integrations and use cases
   - Exchange listings and liquidity
   - Community size and engagement

4. **Market Position and Competitors**
   - Market capitalization and ranking
   - Competitive landscape analysis
   - Market share and adoption metrics
   - Unique value proposition

5. **Risk Factors and Concerns**
   - Regulatory risks and compliance issues
   - Technical vulnerabilities or concerns
   - Market risks and volatility factors
   - Team or governance concerns
   - Security incidents or controversies

6. **Recent Developments**
   - Latest news and announcements (last 30 days)
   - Recent partnerships or integrations
   - Protocol upgrades or changes
   - Community sentiment shifts

Provide detailed, factual analysis with source citations for all claims.`;
}

/**
 * Generate system prompt for structured JSON output
 */
export function generateSystemPrompt(): string {
  return `Return your analysis as a valid JSON object with the following structure:
{
  "technologyOverview": "Detailed overview of the technology...",
  "teamLeadership": "Information about the team and leadership...",
  "partnerships": "Details about partnerships and ecosystem...",
  "marketPosition": "Analysis of market position and competitors...",
  "riskFactors": ["Risk 1", "Risk 2", "Risk 3"],
  "recentDevelopments": "Summary of recent developments...",
  "confidence": 85
}

Ensure all fields are populated with substantive information. The confidence field should be a number from 0-100 indicating your confidence in the analysis based on source quality and data availability.`;
}

/**
 * Create a Caesar research job for a cryptocurrency token
 * 
 * @param symbol - Token symbol (e.g., "BTC", "ETH")
 * @param computeUnits - Compute units to allocate (1-10, default 5 for deep analysis)
 * @param contextData - Real-time context data from previous analysis phases
 * @returns Research job with ID for polling
 */
export async function createCryptoResearch(
  symbol: string,
  computeUnits: number = 5,
  contextData?: any
): Promise<{ jobId: string; status: ResearchStatus }> {
  try {
    console.log(`🔍 Creating Caesar research job for ${symbol} with ${computeUnits} CU`);
    
    const query = generateCryptoResearchQuery(symbol, contextData);
    const systemPrompt = generateSystemPrompt();
    
    const job = await Caesar.createResearch({
      query,
      compute_units: computeUnits,
      system_prompt: systemPrompt
    });
    
    console.log(`✅ Caesar research job created: ${job.id} (status: ${job.status})`);
    
    return {
      jobId: job.id,
      status: job.status
    };
  } catch (error) {
    console.error(`❌ Failed to create Caesar research job for ${symbol}:`, error);
    throw new Error(`Failed to initiate research: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Poll Caesar research job until completion
 * 
 * @param jobId - Research job ID
 * @param maxWaitTime - Maximum wait time in seconds (default 600 = 10 minutes)
 * @param pollInterval - Polling interval in milliseconds (default 60000 = 60 seconds)
 * @returns Completed research job
 */
export async function pollCaesarResearch(
  jobId: string,
  maxWaitTime: number = 600,
  pollInterval: number = 60000
): Promise<ResearchJob> {
  const maxAttempts = Math.floor((maxWaitTime * 1000) / pollInterval);
  const startTime = Date.now();
  
  console.log(`⏳ Polling Caesar research job ${jobId} (max ${maxWaitTime}s, interval ${pollInterval}ms)`);
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const job = await Caesar.getResearch(jobId);
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      
      console.log(`📊 Poll attempt ${attempt}/${maxAttempts}: status=${job.status}, elapsed=${elapsed}s`);
      
      // Check if completed
      if (job.status === 'completed') {
        console.log(`✅ Caesar research completed after ${elapsed}s`);
        return job;
      }
      
      // Check if failed
      if (job.status === 'failed') {
        throw new Error(`Research job failed: ${jobId}`);
      }
      
      // Check if cancelled or expired
      if (job.status === 'cancelled' || job.status === 'expired') {
        throw new Error(`Research job ${job.status}: ${jobId}`);
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      
    } catch (error) {
      if (error instanceof Error && error.message.includes('Research job')) {
        throw error; // Re-throw job-specific errors
      }
      console.error(`⚠️ Poll attempt ${attempt} failed:`, error);
      // Continue polling on network errors
    }
  }
  
  throw new Error(`Research job timed out after ${maxWaitTime}s: ${jobId}`);
}

/**
 * Parse Caesar research results into UCIE format
 * 
 * @param job - Completed research job
 * @returns Structured research data for UCIE
 */
export function parseCaesarResearch(job: ResearchJob): UCIECaesarResearch {
  try {
    // Parse transformed_content (JSON) if available
    let parsedData: any = {};
    
    if (job.transformed_content) {
      try {
        parsedData = JSON.parse(job.transformed_content);
      } catch (parseError) {
        console.warn('⚠️ Failed to parse transformed_content as JSON, using raw content');
      }
    }
    
    // Extract sources from results
    const sources = (job.results || []).map(result => ({
      title: result.title,
      url: result.url,
      relevance: result.score,
      citationIndex: result.citation_index
    }));
    
    // Build structured response
    const research: UCIECaesarResearch = {
      technologyOverview: parsedData.technologyOverview || job.content || 'No technology overview available',
      teamLeadership: parsedData.teamLeadership || 'No team information available',
      partnerships: parsedData.partnerships || 'No partnership information available',
      marketPosition: parsedData.marketPosition || 'No market position data available',
      riskFactors: parsedData.riskFactors || [],
      recentDevelopments: parsedData.recentDevelopments || 'No recent developments available',
      sources,
      confidence: parsedData.confidence || 0,
      rawContent: job.content || undefined
    };
    
    console.log(`✅ Parsed Caesar research: ${sources.length} sources, confidence ${research.confidence}%`);
    
    return research;
    
  } catch (error) {
    console.error('❌ Failed to parse Caesar research:', error);
    throw new Error(`Failed to parse research results: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get research status with progress estimation
 * 
 * @param jobId - Research job ID
 * @returns Status with progress information
 */
export async function getCaesarResearchStatus(jobId: string): Promise<UCIECaesarStatus> {
  try {
    const job = await Caesar.getResearch(jobId);
    
    // Estimate progress based on status
    let progress = 0;
    let estimatedTimeRemaining: number | undefined;
    
    switch (job.status) {
      case 'queued':
        progress = 10;
        estimatedTimeRemaining = 300; // 5 minutes
        break;
      case 'pending':
        progress = 20;
        estimatedTimeRemaining = 240; // 4 minutes
        break;
      case 'researching':
        progress = 50;
        estimatedTimeRemaining = 120; // 2 minutes
        break;
      case 'completed':
        progress = 100;
        estimatedTimeRemaining = 0;
        break;
      case 'failed':
      case 'cancelled':
      case 'expired':
        progress = 0;
        estimatedTimeRemaining = 0;
        break;
    }
    
    return {
      jobId: job.id,
      status: job.status,
      progress,
      estimatedTimeRemaining
    };
    
  } catch (error) {
    console.error(`❌ Failed to get research status for ${jobId}:`, error);
    throw error;
  }
}

/**
 * Complete research workflow: create, poll, and parse
 * 
 * @param symbol - Token symbol
 * @param computeUnits - Compute units (default 5)
 * @param maxWaitTime - Maximum wait time in seconds (default 600)
 * @param contextData - Real-time context data from previous analysis phases
 * @returns Parsed research data
 */
export async function performCryptoResearch(
  symbol: string,
  computeUnits: number = 5,
  maxWaitTime: number = 600,
  contextData?: any
): Promise<UCIECaesarResearch> {
  console.log(`🚀 Starting complete research workflow for ${symbol}`);
  
  if (contextData && Object.keys(contextData).length > 0) {
    console.log(`📊 Using context data from ${Object.keys(contextData).length} sources`);
  }
  
  // Step 1: Create research job with context
  const { jobId } = await createCryptoResearch(symbol, computeUnits, contextData);
  
  // Step 2: Poll until completion
  const completedJob = await pollCaesarResearch(jobId, maxWaitTime);
  
  // Step 3: Parse results
  const research = parseCaesarResearch(completedJob);
  
  console.log(`✅ Complete research workflow finished for ${symbol}`);
  
  return research;
}

/**
 * Handle research errors with fallback
 */
export function handleResearchError(error: unknown): UCIECaesarResearch {
  console.error('❌ Caesar research error:', error);
  
  return {
    technologyOverview: 'Research unavailable due to API error',
    teamLeadership: 'Information unavailable',
    partnerships: 'Information unavailable',
    marketPosition: 'Information unavailable',
    riskFactors: ['Unable to assess risks - research failed'],
    recentDevelopments: 'Information unavailable',
    sources: [],
    confidence: 0,
    rawContent: error instanceof Error ? error.message : 'Unknown error'
  };
}
