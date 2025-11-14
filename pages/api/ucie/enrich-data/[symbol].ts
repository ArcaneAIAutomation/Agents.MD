/**
 * UCIE Data Enrichment Endpoint
 * 
 * Uses Gemini AI to fill missing data fields with intelligent analysis
 * 
 * Missing Data Filled:
 * - Social Sentiment: Overall Score, Trend, 24h Mentions
 * - Technical Analysis: Trend (from RSI + MACD)
 * - Blockchain: Exchange Deposit/Withdrawal classifications
 * 
 * SAFE: This is a NEW endpoint that doesn't modify existing code
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getCachedAnalysis, setCachedAnalysis } from '../../../../lib/ucie/cacheUtils';
import { withOptionalAuth, AuthenticatedRequest } from '../../../../middleware/auth';

// Cache TTL: 2 minutes (for fresh, accurate data)
const CACHE_TTL = 2 * 60; // 120 seconds

interface EnrichedData {
  success: boolean;
  symbol: string;
  timestamp: string;
  socialSentiment: {
    overallScore: number;
    trend: 'bullish' | 'bearish' | 'neutral';
    mentions24h: number;
    confidence: number;
  };
  technicalAnalysis: {
    rsi: number;
    macd: number;
    trend: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
  };
  blockchain: {
    whaleTransactions: number;
    totalValue: number;
    exchangeDeposits: number;
    exchangeWithdrawals: number;
    largestTransaction: number;
    classifications: {
      sellingPressure: number;
      accumulation: number;
      neutral: number;
    };
  };
  dataQuality: number;
  cached: boolean;
}

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse
) {
  const userId = req.user?.id || 'anonymous';
  const userEmail = req.user?.email;

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  const { symbol } = req.query;

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Symbol parameter is required'
    });
  }

  const normalizedSymbol = symbol.toUpperCase();

  try {
    // Check database cache first
    const cachedData = await getCachedAnalysis(normalizedSymbol, 'enriched-data');
    if (cachedData) {
      return res.status(200).json({
        ...cachedData,
        cached: true
      });
    }

    console.log(`🔍 Enriching data for ${normalizedSymbol} with Gemini AI...`);

    // Fetch existing data from UCIE endpoints
    const [sentimentData, technicalData, onChainData] = await Promise.allSettled([
      fetchSentimentData(normalizedSymbol),
      fetchTechnicalData(normalizedSymbol),
      fetchOnChainData(normalizedSymbol)
    ]);

    // Extract data from settled promises
    const sentiment = sentimentData.status === 'fulfilled' ? sentimentData.value : null;
    const technical = technicalData.status === 'fulfilled' ? technicalData.value : null;
    const onChain = onChainData.status === 'fulfilled' ? onChainData.value : null;

    // Use Gemini AI to enrich missing fields
    const enrichedData = await enrichDataWithGemini(
      normalizedSymbol,
      sentiment,
      technical,
      onChain
    );

    // Calculate data quality
    const dataQuality = calculateDataQuality(sentiment, technical, onChain);

    const response: EnrichedData = {
      success: true,
      symbol: normalizedSymbol,
      timestamp: new Date().toISOString(),
      ...enrichedData,
      dataQuality,
      cached: false
    };

    // Cache in database
    await setCachedAnalysis(
      normalizedSymbol,
      'enriched-data',
      response,
      CACHE_TTL,
      dataQuality,
      userId,
      userEmail
    );

    console.log(`✅ Data enriched for ${normalizedSymbol} (quality: ${dataQuality}%)`);

    return res.status(200).json(response);

  } catch (error) {
    console.error('❌ Error enriching data:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to enrich data'
    });
  }
}

/**
 * Fetch sentiment data from UCIE endpoint
 */
async function fetchSentimentData(symbol: string): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/ucie/sentiment/${symbol}`, {
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (!response.ok) {
    throw new Error(`Sentiment API failed: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Fetch technical data from UCIE endpoint
 */
async function fetchTechnicalData(symbol: string): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/ucie/technical/${symbol}?timeframe=1h`, {
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (!response.ok) {
    throw new Error(`Technical API failed: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Fetch on-chain data from UCIE endpoint
 */
async function fetchOnChainData(symbol: string): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/ucie/on-chain/${symbol}`, {
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (!response.ok) {
    throw new Error(`On-chain API failed: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Use Gemini AI to enrich missing data fields
 */
async function enrichDataWithGemini(
  symbol: string,
  sentiment: any,
  technical: any,
  onChain: any
): Promise<Omit<EnrichedData, 'success' | 'symbol' | 'timestamp' | 'dataQuality' | 'cached'>> {
  // Build prompt for Gemini AI
  const prompt = buildEnrichmentPrompt(symbol, sentiment, technical, onChain);

  // Call Gemini AI
  const geminiResponse = await callGeminiAI(prompt);

  // Parse and structure the response
  return parseGeminiResponse(geminiResponse, sentiment, technical, onChain);
}

/**
 * Build comprehensive prompt for Gemini AI
 */
function buildEnrichmentPrompt(symbol: string, sentiment: any, technical: any, onChain: any): string {
  let prompt = `You are a cryptocurrency data analyst. Analyze ${symbol} and provide missing data fields in strict JSON format.\n\n`;

  prompt += `## AVAILABLE DATA:\n\n`;

  // Sentiment data
  if (sentiment) {
    prompt += `### Social Sentiment:\n`;
    prompt += `- LunarCrush Social Score: ${sentiment.sentiment?.socialScore || 'N/A'}\n`;
    prompt += `- Galaxy Score: ${sentiment.sentiment?.galaxyScore || 'N/A'}\n`;
    prompt += `- Sentiment: ${sentiment.sentiment?.sentiment || 'N/A'}\n`;
    prompt += `- Alt Rank: ${sentiment.sentiment?.altRank || 'N/A'}\n\n`;
  }

  // Technical data
  if (technical) {
    prompt += `### Technical Indicators:\n`;
    prompt += `- RSI: ${technical.indicators?.rsi || 'N/A'}\n`;
    prompt += `- MACD: ${technical.indicators?.macd?.value || 'N/A'}\n`;
    prompt += `- MACD Signal: ${technical.indicators?.macd?.signal || 'N/A'}\n`;
    prompt += `- Signal: ${technical.signals?.overall || 'N/A'}\n\n`;
  }

  // On-chain data
  if (onChain) {
    prompt += `### Blockchain Data:\n`;
    prompt += `- Whale Transactions: ${onChain.whaleActivity?.transactions?.length || 0}\n`;
    prompt += `- Total Value: ${onChain.whaleActivity?.totalValue || 'N/A'}\n`;
    prompt += `- Largest Transaction: ${onChain.whaleActivity?.largestTransaction || 'N/A'}\n\n`;
  }

  prompt += `## REQUIRED OUTPUT (strict JSON only, no markdown):\n`;
  prompt += `{\n`;
  prompt += `  "socialSentiment": {\n`;
  prompt += `    "overallScore": <number 0-100>,\n`;
  prompt += `    "trend": "<bullish|bearish|neutral>",\n`;
  prompt += `    "mentions24h": <estimated number>,\n`;
  prompt += `    "confidence": <number 0-100>\n`;
  prompt += `  },\n`;
  prompt += `  "technicalAnalysis": {\n`;
  prompt += `    "rsi": <actual RSI value>,\n`;
  prompt += `    "macd": <actual MACD value>,\n`;
  prompt += `    "trend": "<bullish|bearish|neutral>",\n`;
  prompt += `    "confidence": <number 0-100>\n`;
  prompt += `  },\n`;
  prompt += `  "blockchain": {\n`;
  prompt += `    "whaleTransactions": <actual count>,\n`;
  prompt += `    "totalValue": <actual value in USD>,\n`;
  prompt += `    "exchangeDeposits": <estimated count>,\n`;
  prompt += `    "exchangeWithdrawals": <estimated count>,\n`;
  prompt += `    "largestTransaction": <actual value in USD>,\n`;
  prompt += `    "classifications": {\n`;
  prompt += `      "sellingPressure": <percentage 0-100>,\n`;
  prompt += `      "accumulation": <percentage 0-100>,\n`;
  prompt += `      "neutral": <percentage 0-100>\n`;
  prompt += `    }\n`;
  prompt += `  }\n`;
  prompt += `}\n\n`;

  prompt += `RULES:\n`;
  prompt += `1. Return ONLY valid JSON (no markdown, no code blocks)\n`;
  prompt += `2. Use actual values from data when available\n`;
  prompt += `3. Calculate trend from RSI (>70=bullish, <30=bearish, else neutral)\n`;
  prompt += `4. Estimate mentions24h from social score (score * 100)\n`;
  prompt += `5. Classify whale transactions as deposits/withdrawals/neutral (33% each if unknown)\n`;
  prompt += `6. Confidence based on data availability (100% if all data present)\n`;

  return prompt;
}

/**
 * Call Gemini AI API
 */
async function callGeminiAI(prompt: string): Promise<string> {
  const GEMINI_TIMEOUT_MS = 30000; // 30 seconds

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3, // Low temperature for consistent data
            topK: 20,
            topP: 0.8,
            maxOutputTokens: 1024
          }
        }),
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!text) {
      throw new Error('No response from Gemini AI');
    }

    return text;

  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Gemini AI request timeout (30 seconds)');
    }
    
    throw error;
  }
}

/**
 * Parse Gemini AI response and structure data
 */
function parseGeminiResponse(
  geminiText: string,
  sentiment: any,
  technical: any,
  onChain: any
): Omit<EnrichedData, 'success' | 'symbol' | 'timestamp' | 'dataQuality' | 'cached'> {
  try {
    // Remove markdown code blocks if present
    let cleanText = geminiText.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/```\n?/g, '');
    }

    const parsed = JSON.parse(cleanText);

    return {
      socialSentiment: parsed.socialSentiment,
      technicalAnalysis: parsed.technicalAnalysis,
      blockchain: parsed.blockchain
    };

  } catch (error) {
    console.error('Failed to parse Gemini response, using fallback:', error);
    
    // Fallback: Calculate from available data
    return {
      socialSentiment: {
        overallScore: sentiment?.sentiment?.socialScore || 50,
        trend: calculateSentimentTrend(sentiment),
        mentions24h: estimateMentions(sentiment),
        confidence: sentiment ? 80 : 30
      },
      technicalAnalysis: {
        rsi: technical?.indicators?.rsi || 50,
        macd: technical?.indicators?.macd?.value || 0,
        trend: calculateTechnicalTrend(technical),
        confidence: technical ? 90 : 40
      },
      blockchain: {
        whaleTransactions: onChain?.whaleActivity?.transactions?.length || 0,
        totalValue: onChain?.whaleActivity?.totalValue || 0,
        exchangeDeposits: 0,
        exchangeWithdrawals: 0,
        largestTransaction: onChain?.whaleActivity?.largestTransaction || 0,
        classifications: {
          sellingPressure: 33,
          accumulation: 33,
          neutral: 34
        }
      }
    };
  }
}

/**
 * Calculate sentiment trend from available data
 */
function calculateSentimentTrend(sentiment: any): 'bullish' | 'bearish' | 'neutral' {
  if (!sentiment?.sentiment) return 'neutral';
  
  const score = sentiment.sentiment.socialScore || 50;
  const galaxyScore = sentiment.sentiment.galaxyScore || 50;
  const avgScore = (score + galaxyScore) / 2;
  
  if (avgScore > 65) return 'bullish';
  if (avgScore < 35) return 'bearish';
  return 'neutral';
}

/**
 * Calculate technical trend from RSI and MACD
 */
function calculateTechnicalTrend(technical: any): 'bullish' | 'bearish' | 'neutral' {
  if (!technical?.indicators) return 'neutral';
  
  const rsi = technical.indicators.rsi || 50;
  const macd = technical.indicators.macd?.value || 0;
  
  // RSI-based trend
  if (rsi > 70 && macd > 0) return 'bullish';
  if (rsi < 30 && macd < 0) return 'bearish';
  if (rsi > 60) return 'bullish';
  if (rsi < 40) return 'bearish';
  return 'neutral';
}

/**
 * Estimate 24h mentions from social score
 */
function estimateMentions(sentiment: any): number {
  if (!sentiment?.sentiment) return 0;
  
  const socialScore = sentiment.sentiment.socialScore || 0;
  // Rough estimate: social score * 100
  return Math.round(socialScore * 100);
}

/**
 * Calculate data quality score
 */
function calculateDataQuality(sentiment: any, technical: any, onChain: any): number {
  let score = 0;
  
  if (sentiment) score += 40;
  if (technical) score += 40;
  if (onChain) score += 20;
  
  return score;
}

export default withOptionalAuth(handler);
