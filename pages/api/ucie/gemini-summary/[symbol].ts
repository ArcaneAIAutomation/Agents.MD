/**
 * Gemini AI Summary Endpoint
 * 
 * Generates AI summary using Google Gemini (faster alternative to OpenAI)
 * Uses fresh data from database (no fallback data)
 * 
 * RULES:
 * 1. Only use fresh data from database
 * 2. No fallback/fictitious data
 * 3. Store result in database (replace old data)
 * 4. Higher timeout for AI processing
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getComprehensiveContext } from '../../../../lib/ucie/contextAggregator';
import { storeAIAnalysis } from '../../../../lib/ucie/analysisStorage';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { symbol } = req.query;
  const userId = (req.query.userId as string) || 'anonymous';

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'Symbol is required' });
  }

  try {
    console.log(`🤖 Generating Gemini AI summary for ${symbol}...`);

    // Get ALL fresh data from database
    const context = await getComprehensiveContext(symbol.toUpperCase());

    // Verify data quality (minimum 70%)
    if (context.dataQuality < 70) {
      console.error(`❌ Insufficient data quality: ${context.dataQuality}%`);
      return res.status(400).json({
        error: 'Insufficient data for analysis',
        dataQuality: context.dataQuality,
        availableData: context.availableData,
        message: 'Please ensure at least 70% of data sources are available'
      });
    }

    console.log(`✅ Data quality: ${context.dataQuality}% (${context.availableData.length}/10 sources)`);

    // Build comprehensive prompt for Gemini
    const prompt = buildGeminiPrompt(symbol.toUpperCase(), context);

    // Call Gemini AI with higher timeout
    const geminiResponse = await callGeminiAI(prompt);

    // Store in database (replaces old data)
    await storeAIAnalysis(
      symbol.toUpperCase(),
      geminiResponse.summary,
      context.dataQuality,
      {
        availableData: context.availableData,
        marketData: !!context.marketData,
        technical: !!context.technical,
        sentiment: !!context.sentiment,
        news: !!context.news,
        onChain: !!context.onChain,
        risk: !!context.risk,
        predictions: !!context.predictions,
        defi: !!context.defi,
        derivatives: !!context.derivatives
      },
      'gemini',
      userId
    );

    console.log(`✅ Gemini AI summary generated and stored for ${symbol}`);

    return res.status(200).json({
      success: true,
      symbol: symbol.toUpperCase(),
      summary: geminiResponse.summary,
      dataQuality: context.dataQuality,
      availableData: context.availableData,
      aiProvider: 'gemini',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error generating Gemini summary:', error);
    return res.status(500).json({
      error: 'Failed to generate Gemini AI summary',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Build comprehensive prompt for Gemini AI
 */
function buildGeminiPrompt(symbol: string, context: any): string {
  let prompt = `You are a professional cryptocurrency analyst. Analyze ${symbol} based on the following REAL, FRESH data:\n\n`;

  // Market Data
  if (context.marketData) {
    prompt += `## MARKET DATA (FRESH)\n`;
    prompt += `Price: $${context.marketData.price?.toLocaleString() || 'N/A'}\n`;
    prompt += `24h Change: ${context.marketData.change24h?.toFixed(2) || 'N/A'}%\n`;
    prompt += `Market Cap: $${context.marketData.marketCap?.toLocaleString() || 'N/A'}\n`;
    prompt += `Volume 24h: $${context.marketData.volume24h?.toLocaleString() || 'N/A'}\n\n`;
  }

  // Technical Analysis
  if (context.technical) {
    prompt += `## TECHNICAL INDICATORS (FRESH)\n`;
    prompt += `RSI: ${context.technical.rsi?.toFixed(2) || 'N/A'}\n`;
    prompt += `MACD: ${context.technical.macd?.toFixed(2) || 'N/A'}\n`;
    prompt += `Signal: ${context.technical.signal || 'N/A'}\n\n`;
  }

  // Sentiment
  if (context.sentiment) {
    prompt += `## SOCIAL SENTIMENT (FRESH)\n`;
    prompt += `Overall Sentiment: ${context.sentiment.overall || 'N/A'}\n`;
    prompt += `Social Score: ${context.sentiment.socialScore || 'N/A'}\n\n`;
  }

  // News
  if (context.news && context.news.articles?.length > 0) {
    prompt += `## RECENT NEWS (FRESH)\n`;
    context.news.articles.slice(0, 5).forEach((article: any, i: number) => {
      prompt += `${i + 1}. ${article.title}\n`;
    });
    prompt += `\n`;
  }

  // On-Chain Data
  if (context.onChain) {
    prompt += `## ON-CHAIN METRICS (FRESH)\n`;
    prompt += `Active Addresses: ${context.onChain.activeAddresses?.toLocaleString() || 'N/A'}\n`;
    prompt += `Transaction Count: ${context.onChain.transactionCount?.toLocaleString() || 'N/A'}\n\n`;
  }

  // Risk Assessment
  if (context.risk) {
    prompt += `## RISK ASSESSMENT (FRESH)\n`;
    prompt += `Risk Level: ${context.risk.level || 'N/A'}\n`;
    prompt += `Volatility: ${context.risk.volatility || 'N/A'}\n\n`;
  }

  // Predictions
  if (context.predictions) {
    prompt += `## PRICE PREDICTIONS (FRESH)\n`;
    prompt += `Short-term: ${context.predictions.shortTerm || 'N/A'}\n`;
    prompt += `Medium-term: ${context.predictions.mediumTerm || 'N/A'}\n\n`;
  }

  prompt += `\nProvide a comprehensive, detailed analysis (approximately 2000 words) covering:\n\n`;
  prompt += `1. EXECUTIVE SUMMARY (200 words)\n`;
  prompt += `   - Current market position and key metrics\n`;
  prompt += `   - Overall sentiment and trend direction\n\n`;
  prompt += `2. MARKET ANALYSIS (400 words)\n`;
  prompt += `   - Price action and recent movements\n`;
  prompt += `   - Market cap and volume analysis\n`;
  prompt += `   - Trading patterns and liquidity\n\n`;
  prompt += `3. TECHNICAL ANALYSIS (400 words)\n`;
  prompt += `   - Key indicators (RSI, MACD, EMAs)\n`;
  prompt += `   - Support/resistance levels\n`;
  prompt += `   - Trend analysis and momentum\n\n`;
  prompt += `4. SOCIAL SENTIMENT (300 words)\n`;
  prompt += `   - Sentiment scores and trends\n`;
  prompt += `   - Community engagement\n`;
  prompt += `   - Notable discussions\n\n`;
  prompt += `5. NEWS & DEVELOPMENTS (300 words)\n`;
  prompt += `   - Recent news and events\n`;
  prompt += `   - Market impact\n\n`;
  prompt += `6. ON-CHAIN METRICS (200 words)\n`;
  prompt += `   - Network activity\n`;
  prompt += `   - Holder behavior\n\n`;
  prompt += `7. RISK ASSESSMENT (200 words)\n`;
  prompt += `   - Key risks and opportunities\n`;
  prompt += `   - Volatility analysis\n`;
  prompt += `   - Short-term outlook\n\n`;
  prompt += `Use ONLY the fresh data provided above. Be specific with numbers and percentages. Provide actionable insights.`;

  return prompt;
}

/**
 * Call Gemini AI API with higher timeout
 */
async function callGeminiAI(prompt: string): Promise<{ summary: string }> {
  const GEMINI_TIMEOUT_MS = 60000; // 60 seconds (higher timeout)

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192  // Increased for 2000 word analysis
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
    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!summary) {
      throw new Error('No summary generated by Gemini AI');
    }

    return { summary };

  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Gemini AI request timeout (60 seconds)');
    }
    
    throw error;
  }
}
