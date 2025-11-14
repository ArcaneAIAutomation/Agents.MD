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
    
    // ✅ OpenAI Summary (PRIORITY - Most important context)
    if (contextData.openaiSummary) {
      contextSection += `**=== OPENAI ANALYSIS SUMMARY ===**\n`;
      contextSection += `${contextData.openaiSummary}\n\n`;
      contextSection += `**Data Quality Score:** ${contextData.dataQuality || 0}%\n`;
      
      if (contextData.apiStatus) {
        const status = contextData.apiStatus;
        contextSection += `**Data Sources:** ${status.working?.length || 0}/${status.total || 5} working (${status.successRate || 0}% success rate)\n`;
        if (status.working && status.working.length > 0) {
          contextSection += `**Working APIs:** ${status.working.join(', ')}\n`;
        }
        if (status.failed && status.failed.length > 0) {
          contextSection += `**Failed APIs:** ${status.failed.join(', ')}\n`;
        }
      }
      contextSection += `\n`;
    }
    
    // Market Data
    if (contextData['market-data'] || contextData.marketData) {
      const market = contextData['market-data'] || contextData.marketData;
      contextSection += `**Current Market Data:**\n`;
      // Use safe formatters to handle different property names
      const { formatPrice, formatVolume, formatMarketCap, formatPriceChange } = require('./dataFormatter');
      contextSection += `- Price: ${formatPrice(market)}\n`;
      contextSection += `- 24h Volume: ${formatVolume(market)}\n`;
      contextSection += `- Market Cap: ${formatMarketCap(market)}\n`;
      contextSection += `- 24h Change: ${formatPriceChange(market)}\n\n`;
    }
    
    // Sentiment
    if (contextData.sentiment) {
      contextSection += `**Social Sentiment:**\n`;
      // Extract actual values from sentiment data structure
      const sentiment = contextData.sentiment.sentiment || contextData.sentiment;
      const score = sentiment.overallScore || 0;
      const trend = sentiment.trend || 'neutral';
      const mentions = contextData.sentiment.volumeMetrics?.total24h || sentiment.mentions24h || 0;
      
      contextSection += `- Overall Score: ${score.toFixed(0)}/100\n`;
      contextSection += `- Trend: ${trend}\n`;
      contextSection += `- 24h Mentions: ${mentions.toLocaleString('en-US')}\n`;
      
      // Add sources if available
      if (contextData.sentiment.sources) {
        const sources = Object.keys(contextData.sentiment.sources).filter(k => contextData.sentiment.sources[k]);
        if (sources.length > 0) {
          contextSection += `- Sources: ${sources.join(', ')}\n`;
        }
      }
      contextSection += `\n`;
    }
    
    // Technical Analysis
    if (contextData.technical) {
      contextSection += `**Technical Analysis:**\n`;
      // Extract actual values from technical indicators
      const indicators = contextData.technical.indicators || contextData.technical;
      const rsi = indicators.rsi?.value || indicators.rsi || 0;
      const macdSignal = indicators.macd?.signal || 'neutral';
      const trend = indicators.trend?.direction || contextData.technical.trend?.direction || 'neutral';
      
      contextSection += `- RSI: ${typeof rsi === 'number' ? rsi.toFixed(2) : rsi}\n`;
      contextSection += `- MACD Signal: ${macdSignal}\n`;
      contextSection += `- Trend: ${trend}\n`;
      
      // Add additional indicators if available
      if (indicators.trend?.strength) {
        contextSection += `- Trend Strength: ${indicators.trend.strength}\n`;
      }
      if (indicators.volatility) {
        contextSection += `- Volatility: ${indicators.volatility.current || 'N/A'}\n`;
      }
      contextSection += `\n`;
    }
    
    // On-Chain Data (Blockchain Intelligence)
    if (contextData['on-chain'] || contextData.onChain) {
      const onChain = contextData['on-chain'] || contextData.onChain;
      contextSection += `**Blockchain Intelligence (On-Chain Data):**\n`;
      
      // Token Info
      if (onChain.tokenInfo) {
        contextSection += `- Token Contract: ${onChain.tokenInfo.address}\n`;
        contextSection += `- Blockchain: ${onChain.chain || 'N/A'}\n`;
        contextSection += `- Total Supply: ${onChain.tokenInfo.totalSupply?.toLocaleString() || 'N/A'}\n`;
        contextSection += `- Circulating Supply: ${onChain.tokenInfo.circulatingSupply?.toLocaleString() || 'N/A'}\n`;
      }
      
      // Holder Distribution & Concentration
      if (onChain.holderDistribution) {
        const conc = onChain.holderDistribution.concentration;
        contextSection += `\n**Holder Distribution:**\n`;
        contextSection += `- Top 10 Holders: ${conc?.top10Percentage?.toFixed(2) || 'N/A'}% of supply\n`;
        contextSection += `- Top 50 Holders: ${conc?.top50Percentage?.toFixed(2) || 'N/A'}% of supply\n`;
        contextSection += `- Gini Coefficient: ${conc?.giniCoefficient?.toFixed(3) || 'N/A'} (0=equal, 1=concentrated)\n`;
        contextSection += `- Distribution Score: ${conc?.distributionScore?.toFixed(0) || 'N/A'}/100 (higher=better)\n`;
        
        if (onChain.holderDistribution.topHolders?.length > 0) {
          contextSection += `- Total Unique Holders: ${onChain.holderDistribution.topHolders.length}\n`;
        }
      }
      
      // Whale Activity with Exchange Flow Analysis
      if (onChain.whaleActivity) {
        const whale = onChain.whaleActivity.summary;
        contextSection += `\n**Whale Activity (Large Transactions >$1M):**\n`;
        contextSection += `- Total Whale Transactions: ${whale?.totalTransactions || 0}\n`;
        contextSection += `- Total Value: $${whale?.totalValueUSD?.toLocaleString() || '0'}\n`;
        contextSection += `- Largest Transaction: $${whale?.largestTransaction?.toLocaleString() || '0'}\n`;
        
        // ✅ NEW: Exchange Flow Analysis
        if (whale?.exchangeDeposits !== undefined || whale?.exchangeWithdrawals !== undefined) {
          contextSection += `\n**Exchange Flow Analysis:**\n`;
          contextSection += `- To Exchanges (Deposits): ${whale?.exchangeDeposits || 0} transactions (⚠️ SELLING PRESSURE)\n`;
          contextSection += `- From Exchanges (Withdrawals): ${whale?.exchangeWithdrawals || 0} transactions (✅ ACCUMULATION)\n`;
          contextSection += `- Cold Wallet Movements: ${whale?.coldWalletMovements || 0} transactions (whale-to-whale)\n`;
          
          // Calculate net flow sentiment
          const deposits = whale?.exchangeDeposits || 0;
          const withdrawals = whale?.exchangeWithdrawals || 0;
          const netFlow = withdrawals - deposits;
          
          if (netFlow > 0) {
            contextSection += `- Net Flow: +${netFlow} (BULLISH - More withdrawals than deposits)\n`;
          } else if (netFlow < 0) {
            contextSection += `- Net Flow: ${netFlow} (BEARISH - More deposits than withdrawals)\n`;
          } else {
            contextSection += `- Net Flow: Neutral (Equal deposits and withdrawals)\n`;
          }
        }
        
        // Recent whale transactions count
        if (onChain.whaleActivity.transactions?.length > 0) {
          contextSection += `- Recent Large Transactions: ${onChain.whaleActivity.transactions.length} tracked\n`;
        }
      }
      
      // Exchange Flows
      if (onChain.exchangeFlows) {
        const flows = onChain.exchangeFlows;
        contextSection += `\n**Exchange Flows (24h):**\n`;
        contextSection += `- Inflow to Exchanges: $${flows.inflow24h?.toLocaleString() || 'N/A'}\n`;
        contextSection += `- Outflow from Exchanges: $${flows.outflow24h?.toLocaleString() || 'N/A'}\n`;
        contextSection += `- Net Flow: $${flows.netFlow?.toLocaleString() || 'N/A'}\n`;
        contextSection += `- Trend: ${flows.trend || 'N/A'} (accumulation=bullish, distribution=bearish)\n`;
      }
      
      // Wallet Behavior Analysis
      if (onChain.walletBehavior) {
        const behavior = onChain.walletBehavior;
        contextSection += `\n**Wallet Behavior Analysis:**\n`;
        contextSection += `- Smart Money Accumulating: ${behavior.smartMoneyAccumulating ? 'YES ✓' : 'NO'}\n`;
        contextSection += `- Whale Activity: ${behavior.whaleActivity || 'N/A'}\n`;
        contextSection += `- Retail Sentiment: ${behavior.retailSentiment || 'N/A'}\n`;
        contextSection += `- Analysis Confidence: ${behavior.confidence || 0}%\n`;
      }
      
      // Smart Contract Security
      if (onChain.smartContract) {
        const contract = onChain.smartContract;
        contextSection += `\n**Smart Contract Security:**\n`;
        contextSection += `- Security Score: ${contract.score || 0}/100\n`;
        contextSection += `- Contract Verified: ${contract.isVerified ? 'YES ✓' : 'NO'}\n`;
        contextSection += `- Audit Status: ${contract.auditStatus || 'N/A'}\n`;
        
        if (contract.vulnerabilities?.length > 0) {
          contextSection += `- Vulnerabilities: ${contract.vulnerabilities.length} found\n`;
        }
        if (contract.redFlags?.length > 0) {
          contextSection += `- Red Flags: ${contract.redFlags.join(', ')}\n`;
        }
        if (contract.warnings?.length > 0) {
          contextSection += `- Warnings: ${contract.warnings.join(', ')}\n`;
        }
      }
      
      contextSection += `\n`;
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

**CRITICAL: Pay special attention to the blockchain intelligence data above, including:**
- Holder concentration and distribution patterns
- Whale activity and exchange flows
- Smart money accumulation signals
- Smart contract security assessment

1. **Technology and Innovation**
   - Core technology and blockchain architecture
   - Unique features and innovations
   - Technical advantages over competitors
   - Development roadmap and progress
   - Smart contract security and audit status

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
   - **BLOCKCHAIN RISKS**: Analyze holder concentration, whale manipulation risk, smart contract vulnerabilities
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
   - **WHALE ACTIVITY**: Recent large transactions and their market impact

7. **Blockchain Intelligence Summary**
   - Interpret the on-chain data: Is smart money accumulating or distributing?
   - What do exchange flows tell us about market sentiment?
   - Are there concentration risks from top holders?
   - Is the smart contract secure and audited?
   - What is the overall blockchain health score?

Provide detailed, factual analysis with source citations for all claims. **Integrate blockchain intelligence throughout your analysis, not just in a separate section.**`;
}

/**
 * Generate system prompt for structured JSON output
 */
export function generateSystemPrompt(): string {
  return `You MUST return your analysis as a valid JSON object with this EXACT structure:

{
  "technologyOverview": "Comprehensive 3-5 paragraph analysis of the blockchain technology, consensus mechanism, unique features, scalability solutions, and technical innovations. Include specific technical details.",
  "teamLeadership": "Detailed 2-3 paragraph overview of founding team members with names, backgrounds, previous experience, and track record. Include key advisors and development team size.",
  "partnerships": "Comprehensive 2-3 paragraph analysis of major partnerships, exchange listings, ecosystem integrations, institutional backing, and community size. Include specific partnership names and dates.",
  "marketPosition": "Detailed 3-4 paragraph analysis of market capitalization rank, competitive landscape, unique value proposition, adoption metrics, and comparison with top competitors. Include specific numbers and rankings.",
  "riskFactors": [
    "Specific regulatory risk with details",
    "Technical vulnerability or concern with explanation",
    "Market risk factor with context",
    "Team or governance concern with details",
    "Security incident or controversy with specifics"
  ],
  "recentDevelopments": "Comprehensive 2-3 paragraph summary of developments in the last 30 days including protocol upgrades, partnerships, announcements, and sentiment shifts. Include specific dates and details.",
  "confidence": 85
}

CRITICAL REQUIREMENTS:
1. ALL fields must be populated with substantive, detailed information (minimum 200 words per text field)
2. DO NOT use placeholder text like "No information available" or "Information unavailable"
3. If you lack specific information, provide general industry context and note the limitation
4. riskFactors array must contain 3-7 specific, detailed risk items
5. confidence must be a number from 0-100 based on source quality
6. Use proper JSON formatting with escaped quotes
7. Provide factual, verifiable information with source citations in the text

Return ONLY the JSON object, no additional text before or after.`;
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
      
      // Check if completed - STOP POLLING IMMEDIATELY
      if (job.status === 'completed') {
        console.log(`✅ Caesar research completed after ${elapsed}s - STOPPING POLL`);
        console.log(`📄 Job has ${job.results?.length || 0} sources`);
        console.log(`📝 Content length: ${job.content?.length || 0} chars`);
        console.log(`🔄 Transformed content length: ${job.transformed_content?.length || 0} chars`);
        return job; // RETURN IMMEDIATELY - DO NOT CONTINUE POLLING
      }
      
      // Check if failed
      if (job.status === 'failed') {
        console.error(`❌ Research job failed: ${jobId}`);
        throw new Error(`Research job failed: ${jobId}`);
      }
      
      // Check if cancelled or expired
      if (job.status === 'cancelled' || job.status === 'expired') {
        console.error(`❌ Research job ${job.status}: ${jobId}`);
        throw new Error(`Research job ${job.status}: ${jobId}`);
      }
      
      // Only wait if NOT completed (status is queued, pending, or researching)
      if (attempt < maxAttempts) {
        console.log(`⏳ Status: ${job.status}, waiting ${pollInterval}ms before next poll...`);
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
      
    } catch (error) {
      if (error instanceof Error && error.message.includes('Research job')) {
        throw error; // Re-throw job-specific errors
      }
      console.error(`⚠️ Poll attempt ${attempt} failed:`, error);
      // Continue polling on network errors (but not if we've exceeded max attempts)
      if (attempt >= maxAttempts) {
        throw new Error(`Polling failed after ${maxAttempts} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }
  
  throw new Error(`Research job timed out after ${maxWaitTime}s: ${jobId}`);
}

/**
 * Parse Caesar research results into UCIE format
 * ✅ UPDATED: Include initial query in rawContent for transparency
 * 
 * @param job - Completed research job
 * @param initialQuery - The query that was sent to Caesar (optional)
 * @returns Structured research data for UCIE
 */
export function parseCaesarResearch(job: ResearchJob, initialQuery?: string): UCIECaesarResearch {
  try {
    console.log(`🔍 Parsing Caesar research job ${job.id}`);
    console.log(`📊 Job status: ${job.status}`);
    console.log(`📄 Content available: ${!!job.content}`);
    console.log(`🔄 Transformed content available: ${!!job.transformed_content}`);
    console.log(`📚 Sources count: ${job.results?.length || 0}`);
    
    // Parse transformed_content (JSON) if available
    let parsedData: any = {};
    
    if (job.transformed_content) {
      try {
        console.log(`🔄 Attempting to parse transformed_content as JSON...`);
        parsedData = JSON.parse(job.transformed_content);
        console.log(`✅ Successfully parsed JSON with keys:`, Object.keys(parsedData));
      } catch (parseError) {
        console.warn('⚠️ Failed to parse transformed_content as JSON, will use raw content');
        console.warn('Parse error:', parseError);
        // If JSON parsing fails, try to extract sections from raw content
        if (job.content) {
          parsedData = extractSectionsFromRawContent(job.content);
        }
      }
    } else if (job.content) {
      // No transformed_content, extract from raw content
      console.log(`📝 No transformed_content, extracting from raw content...`);
      parsedData = extractSectionsFromRawContent(job.content);
    }
    
    // Extract sources from results
    const sources = (job.results || []).map(result => ({
      title: result.title,
      url: result.url,
      relevance: result.score,
      citationIndex: result.citation_index
    }));
    
    console.log(`📚 Extracted ${sources.length} sources`);
    
    // Build structured response with fallbacks
    const research: UCIECaesarResearch = {
      technologyOverview: parsedData.technologyOverview || 
                          parsedData.technology || 
                          extractSection(job.content, 'Technology') ||
                          job.content || 
                          'No technology overview available',
      teamLeadership: parsedData.teamLeadership || 
                      parsedData.team || 
                      extractSection(job.content, 'Team') ||
                      'No team information available',
      partnerships: parsedData.partnerships || 
                    parsedData.ecosystem || 
                    extractSection(job.content, 'Partnership') ||
                    'No partnership information available',
      marketPosition: parsedData.marketPosition || 
                      parsedData.market || 
                      extractSection(job.content, 'Market') ||
                      'No market position data available',
      riskFactors: Array.isArray(parsedData.riskFactors) ? parsedData.riskFactors : 
                   Array.isArray(parsedData.risks) ? parsedData.risks :
                   extractRiskFactors(job.content),
      recentDevelopments: parsedData.recentDevelopments || 
                          parsedData.developments || 
                          extractSection(job.content, 'Recent') ||
                          'No recent developments available',
      sources,
      confidence: typeof parsedData.confidence === 'number' ? parsedData.confidence : 
                  sources.length > 0 ? Math.min(85, 50 + (sources.length * 5)) : 0,
      rawContent: initialQuery 
        ? `=== INITIAL QUERY SENT TO CAESAR ===\n\n${initialQuery}\n\n=== CAESAR'S RAW RESPONSE ===\n\n${job.content || 'No raw content available'}`
        : job.content || undefined
    };
    
    console.log(`✅ Parsed Caesar research successfully:`);
    console.log(`   - Technology: ${research.technologyOverview.substring(0, 100)}...`);
    console.log(`   - Team: ${research.teamLeadership.substring(0, 100)}...`);
    console.log(`   - Partnerships: ${research.partnerships.substring(0, 100)}...`);
    console.log(`   - Market: ${research.marketPosition.substring(0, 100)}...`);
    console.log(`   - Risk Factors: ${research.riskFactors.length} items`);
    console.log(`   - Recent Developments: ${research.recentDevelopments.substring(0, 100)}...`);
    console.log(`   - Sources: ${sources.length}`);
    console.log(`   - Confidence: ${research.confidence}%`);
    
    return research;
    
  } catch (error) {
    console.error('❌ Failed to parse Caesar research:', error);
    throw new Error(`Failed to parse research results: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract sections from raw content using pattern matching
 */
function extractSectionsFromRawContent(content: string): any {
  const sections: any = {};
  
  // Try to extract sections based on common patterns
  const technologyMatch = content.match(/(?:Technology|Innovation|Technical)[\s\S]*?(?=\n\n(?:Team|Partnership|Market|Risk|Recent|$))/i);
  if (technologyMatch) sections.technologyOverview = technologyMatch[0].trim();
  
  const teamMatch = content.match(/(?:Team|Leadership)[\s\S]*?(?=\n\n(?:Partnership|Market|Risk|Recent|$))/i);
  if (teamMatch) sections.teamLeadership = teamMatch[0].trim();
  
  const partnershipMatch = content.match(/(?:Partnership|Ecosystem|Collaboration)[\s\S]*?(?=\n\n(?:Market|Risk|Recent|$))/i);
  if (partnershipMatch) sections.partnerships = partnershipMatch[0].trim();
  
  const marketMatch = content.match(/(?:Market|Position|Competitor)[\s\S]*?(?=\n\n(?:Risk|Recent|$))/i);
  if (marketMatch) sections.marketPosition = marketMatch[0].trim();
  
  const developmentsMatch = content.match(/(?:Recent|Development|News)[\s\S]*?$/i);
  if (developmentsMatch) sections.recentDevelopments = developmentsMatch[0].trim();
  
  return sections;
}

/**
 * Extract a specific section from content
 */
function extractSection(content: string | null | undefined, keyword: string): string | null {
  if (!content) return null;
  
  const regex = new RegExp(`(?:${keyword}[^\\n]*\\n)([\\s\\S]*?)(?=\\n\\n[A-Z]|$)`, 'i');
  const match = content.match(regex);
  
  return match ? match[1].trim() : null;
}

/**
 * Extract risk factors from content
 */
function extractRiskFactors(content: string | null | undefined): string[] {
  if (!content) return [];
  
  const risks: string[] = [];
  
  // Look for bullet points or numbered lists in risk section
  const riskSection = extractSection(content, 'Risk');
  if (riskSection) {
    const lines = riskSection.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.match(/^[-•*\d.]/)) {
        const cleaned = trimmed.replace(/^[-•*\d.]\s*/, '').trim();
        if (cleaned.length > 10) {
          risks.push(cleaned);
        }
      }
    }
  }
  
  // If no risks found, look for common risk keywords
  if (risks.length === 0 && content) {
    const riskKeywords = ['regulatory', 'volatility', 'security', 'competition', 'adoption'];
    for (const keyword of riskKeywords) {
      const regex = new RegExp(`([^.]*${keyword}[^.]*\\.)`, 'gi');
      const matches = content.match(regex);
      if (matches) {
        risks.push(...matches.slice(0, 2)); // Add up to 2 matches per keyword
      }
    }
  }
  
  return risks.slice(0, 10); // Limit to 10 risk factors
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
    
    // Calculate progress based on elapsed time and status
    let progress = 0;
    let estimatedTimeRemaining: number | undefined;
    
    // Parse created_at timestamp to calculate elapsed time
    const createdAt = new Date(job.created_at);
    const now = new Date();
    const elapsedSeconds = Math.floor((now.getTime() - createdAt.getTime()) / 1000);
    
    // Expected total time: 10-15 minutes (600-900 seconds)
    const EXPECTED_TOTAL_TIME = 900; // 15 minutes in seconds
    
    switch (job.status) {
      case 'queued':
        // 0-2 minutes: 0-20% progress
        progress = Math.min(20, Math.floor((elapsedSeconds / 120) * 20));
        estimatedTimeRemaining = Math.max(0, EXPECTED_TOTAL_TIME - elapsedSeconds);
        break;
        
      case 'pending':
        // 2-4 minutes: 20-40% progress
        progress = Math.min(40, 20 + Math.floor(((elapsedSeconds - 120) / 120) * 20));
        estimatedTimeRemaining = Math.max(0, EXPECTED_TOTAL_TIME - elapsedSeconds);
        break;
        
      case 'researching':
        // 4-15 minutes: 40-95% progress (logarithmic curve)
        const researchingTime = elapsedSeconds - 240; // Time since researching started
        const researchingProgress = Math.min(55, Math.floor(Math.log(researchingTime + 1) * 10));
        progress = Math.min(95, 40 + researchingProgress);
        estimatedTimeRemaining = Math.max(0, EXPECTED_TOTAL_TIME - elapsedSeconds);
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
    
    // Log progress for debugging
    console.log(`📊 Job ${jobId}: ${job.status} - ${progress}% (${elapsedSeconds}s elapsed, ~${estimatedTimeRemaining}s remaining)`);
    
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
  
  // Generate the query (we'll need this for transparency)
  const query = generateCryptoResearchQuery(symbol, contextData);
  
  // Step 1: Create research job with context
  const { jobId } = await createCryptoResearch(symbol, computeUnits, contextData);
  
  // Step 2: Poll until completion
  const completedJob = await pollCaesarResearch(jobId, maxWaitTime);
  
  // Step 3: Parse results with the original query for transparency
  const research = parseCaesarResearch(completedJob, query);
  
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
