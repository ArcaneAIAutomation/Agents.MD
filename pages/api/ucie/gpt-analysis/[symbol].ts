/**
 * UCIE GPT-5.1 Analysis Endpoint
 * 
 * Analyzes collected UCIE data using GPT-5.1 with medium reasoning effort
 * Similar to Whale Watch deep dive analysis
 * 
 * GET /api/ucie/gpt-analysis/BTC
 * 
 * Features:
 * - GPT-5.1 with Responses API
 * - Medium reasoning effort (3-5 seconds)
 * - Analyzes market data, sentiment, technical, on-chain
 * - Stores analysis in database
 * - Adds to Caesar prompt context
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getCachedAnalysis, setCachedAnalysis } from '../../../../lib/ucie/cacheUtils';
import { withOptionalAuth, AuthenticatedRequest } from '../../../../middleware/auth';
import { extractResponseText, validateResponseText } from '../../../../utils/openai';

// Cache TTL: 30 minutes (analysis is expensive)
const CACHE_TTL = 30 * 60; // 1800 seconds

export interface GPTAnalysisResponse {
  success: boolean;
  symbol: string;
  analysis?: {
    marketOutlook: string;
    sentimentAnalysis: string;
    technicalSignals: string;
    onChainInsights: string;
    riskAssessment: string;
    tradingRecommendation: string;
    keyFactors: string[];
    confidence: number;
  };
  dataQuality: number;
  cached: boolean;
  timestamp: string;
  error?: string;
}

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<GPTAnalysisResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      symbol: '',
      dataQuality: 0,
      cached: false,
      timestamp: new Date().toISOString(),
      error: 'Method not allowed',
    });
  }

  const { symbol } = req.query;
  const symbolUpper = (symbol as string).toUpperCase();

  // Get user info if authenticated
  const userId = req.user?.id || 'anonymous';
  const userEmail = req.user?.email;

  // Check for refresh parameter
  const forceRefresh = req.query.refresh === 'true';

  // Check cache first (skip if refresh=true)
  if (!forceRefresh) {
    const cached = await getCachedAnalysis(symbolUpper, 'gpt-analysis', userId, userEmail);
    if (cached) {
      console.log(`✅ Cache hit for ${symbolUpper} GPT analysis`);
      return res.status(200).json({
        ...cached,
        cached: true,
      });
    }
  }

  try {
    console.log(`🤖 Starting GPT-5.1 analysis for ${symbolUpper}...`);

    // Fetch all available data
    const [marketData, sentiment, technical, onChain, news] = await Promise.all([
      getCachedAnalysis(symbolUpper, 'market-data', userId, userEmail),
      getCachedAnalysis(symbolUpper, 'sentiment', userId, userEmail),
      getCachedAnalysis(symbolUpper, 'technical', userId, userEmail),
      getCachedAnalysis(symbolUpper, 'on-chain', userId, userEmail),
      getCachedAnalysis(symbolUpper, 'news', userId, userEmail),
    ]);

    // Calculate data quality
    let dataQuality = 0;
    if (marketData) dataQuality += 30;
    if (sentiment) dataQuality += 25;
    if (technical) dataQuality += 20;
    if (onChain) dataQuality += 15;
    if (news) dataQuality += 10;

    // Require minimum 50% data quality
    if (dataQuality < 50) {
      return res.status(503).json({
        success: false,
        symbol: symbolUpper,
        dataQuality,
        cached: false,
        timestamp: new Date().toISOString(),
        error: `Insufficient data for analysis (${dataQuality}%). Need at least 50%.`,
      });
    }

    // Build comprehensive prompt
    let prompt = `# ${symbolUpper} Comprehensive Market Analysis\n\n`;
    prompt += `Analyze the following cryptocurrency data and provide actionable insights.\n\n`;

    // Market Data
    if (marketData) {
      prompt += `## Market Data\n`;
      prompt += `- Current Price: $${marketData.priceAggregation?.weightedAverage?.toLocaleString() || 'N/A'}\n`;
      prompt += `- 24h Change: ${marketData.priceAggregation?.change24h || 'N/A'}%\n`;
      prompt += `- 24h Volume: $${marketData.marketData?.volume24h?.toLocaleString() || 'N/A'}\n`;
      prompt += `- Market Cap: $${marketData.marketData?.marketCap?.toLocaleString() || 'N/A'}\n`;
      prompt += `- 24h High: $${marketData.marketData?.high24h?.toLocaleString() || 'N/A'}\n`;
      prompt += `- 24h Low: $${marketData.marketData?.low24h?.toLocaleString() || 'N/A'}\n\n`;
    }

    // Sentiment Analysis
    if (sentiment) {
      prompt += `## Sentiment Analysis\n`;
      prompt += `- Overall Sentiment: ${sentiment.overallScore || 'N/A'}/100 (${sentiment.sentiment || 'neutral'})\n`;
      if (sentiment.fearGreedIndex) {
        prompt += `- Fear & Greed Index: ${sentiment.fearGreedIndex.value}/100 (${sentiment.fearGreedIndex.classification})\n`;
      }
      if (sentiment.lunarCrush) {
        prompt += `- Social Score: ${sentiment.lunarCrush.socialScore || 'N/A'}/100\n`;
        prompt += `- Galaxy Score: ${sentiment.lunarCrush.galaxyScore || 'N/A'}/100\n`;
        prompt += `- Social Volume Change: ${sentiment.lunarCrush.socialVolumeChange24h || 'N/A'}%\n`;
      }
      prompt += `\n`;
    }

    // Technical Analysis
    if (technical) {
      prompt += `## Technical Indicators\n`;
      if (technical.rsi) {
        prompt += `- RSI: ${technical.rsi.value || 'N/A'} (${technical.rsi.signal || 'N/A'})\n`;
      }
      if (technical.macd) {
        prompt += `- MACD: ${technical.macd.signal || 'N/A'}\n`;
      }
      if (technical.signals) {
        prompt += `- Overall Signal: ${technical.signals.overall || 'N/A'} (${technical.signals.confidence || 'N/A'}% confidence)\n`;
      }
      prompt += `\n`;
    }

    // On-Chain Metrics
    if (onChain) {
      prompt += `## On-Chain Metrics\n`;
      if (onChain.networkMetrics) {
        prompt += `- Hash Rate: ${onChain.networkMetrics.hashRate?.toLocaleString() || 'N/A'} TH/s\n`;
        prompt += `- Transaction Count (24h): ${onChain.networkMetrics.transactionCount24h?.toLocaleString() || 'N/A'}\n`;
      }
      if (onChain.exchangeFlows) {
        prompt += `- Exchange Net Flow: ${onChain.exchangeFlows.netFlow?.toLocaleString() || 'N/A'} ${symbolUpper}\n`;
        prompt += `- Flow Sentiment: ${onChain.exchangeFlows.sentiment || 'N/A'}\n`;
      }
      prompt += `\n`;
    }

    // Recent News
    if (news && news.articles) {
      prompt += `## Recent News Headlines\n`;
      news.articles.slice(0, 5).forEach((article: any, i: number) => {
        prompt += `${i + 1}. ${article.title} (${article.sentiment || 'neutral'})\n`;
      });
      prompt += `\n`;
    }

    prompt += `## Analysis Requirements\n`;
    prompt += `Provide a comprehensive analysis in JSON format with the following structure:\n`;
    prompt += `{\n`;
    prompt += `  "marketOutlook": "Brief market outlook (2-3 sentences)",\n`;
    prompt += `  "sentimentAnalysis": "Sentiment interpretation (2-3 sentences)",\n`;
    prompt += `  "technicalSignals": "Technical indicator analysis (2-3 sentences)",\n`;
    prompt += `  "onChainInsights": "On-chain data interpretation (2-3 sentences)",\n`;
    prompt += `  "riskAssessment": "Risk level and factors (2-3 sentences)",\n`;
    prompt += `  "tradingRecommendation": "Actionable recommendation (2-3 sentences)",\n`;
    prompt += `  "keyFactors": ["factor1", "factor2", "factor3"],\n`;
    prompt += `  "confidence": 85\n`;
    prompt += `}\n\n`;
    prompt += `Be specific, data-driven, and actionable. Focus on what the data tells us about potential price movements.`;

    // Call GPT-5.1 with Responses API
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const model = 'gpt-5.1';
    const reasoningEffort = 'medium'; // 3-5 seconds

    console.log(`📡 Calling OpenAI Responses API with ${model} (reasoning: ${reasoningEffort})...`);
    const openaiStart = Date.now();

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: model,
        input: `You are an expert cryptocurrency analyst. Analyze this data and respond only with valid JSON.\n\n${prompt}`,
        reasoning: {
          effort: reasoningEffort
        },
        text: {
          verbosity: 'medium'
        },
        max_output_tokens: 4000,
      }),
      signal: AbortSignal.timeout(60000), // 60 seconds
    });

    const openaiTime = Date.now() - openaiStart;
    console.log(`✅ ${model} Responses API responded in ${openaiTime}ms with status ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ ${model} Responses API error: ${response.status}`, errorText);
      throw new Error(`${model} Responses API error: ${response.status}`);
    }

    const data = await response.json();

    // Extract text using bulletproof utility
    const analysisText = extractResponseText(data, true);
    validateResponseText(analysisText, model, data);

    console.log(`✅ Got ${model} response text (${analysisText.length} chars)`);

    // Parse JSON response
    const analysis = JSON.parse(analysisText);

    // Build response
    const responseData: GPTAnalysisResponse = {
      success: true,
      symbol: symbolUpper,
      analysis,
      dataQuality,
      cached: false,
      timestamp: new Date().toISOString(),
    };

    // Cache the analysis (30 minutes)
    if (!forceRefresh) {
      await setCachedAnalysis(symbolUpper, 'gpt-analysis', responseData, CACHE_TTL, dataQuality, userId, userEmail);
      console.log(`💾 Cached ${symbolUpper} GPT analysis for ${CACHE_TTL}s`);
    }

    console.log(`✅ GPT-5.1 analysis complete for ${symbolUpper}`);

    return res.status(200).json(responseData);

  } catch (error) {
    console.error(`❌ GPT analysis error for ${symbolUpper}:`, error);

    return res.status(500).json({
      success: false,
      symbol: symbolUpper,
      dataQuality: 0,
      cached: false,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}

export default withOptionalAuth(handler);
