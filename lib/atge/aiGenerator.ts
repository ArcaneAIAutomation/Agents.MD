/**
 * AI Trade Signal Generator for ATGE
 * 
 * Uses OpenAI o1-mini (ChatGPT-5.1) to generate trade signals with advanced reasoning
 * Model is configurable via OPENAI_MODEL environment variable
 * Implements fallback chain: o1-mini → gpt-4o → Gemini AI
 * Validates and retries up to 3 times
 * 
 * Requirements: 11.1-11.8
 */

import { MarketData } from './marketData';
import { TechnicalIndicators } from './technicalIndicators';
import { SentimentData } from './sentimentData';
import { OnChainData } from './onChainData';
// LunarCrush data is now included in SentimentData

// OpenAI o1 model configuration (ChatGPT-5.1)
// Primary: o1-mini for efficient reasoning-based trade signals
// Complex: o1-preview for advanced market analysis (optional)
// Fallback: gpt-4o for speed when o1 models timeout
const MODEL = process.env.OPENAI_MODEL || 'o1-mini';
const COMPLEX_MODEL = process.env.OPENAI_COMPLEX_MODEL || 'o1-preview';
const FALLBACK_MODEL = process.env.OPENAI_FALLBACK_MODEL || 'gpt-4o';

// Timeout configuration for o1 models (longer response times expected)
const O1_TIMEOUT = parseInt(process.env.O1_TIMEOUT || '120000'); // 120 seconds
const GPT4O_TIMEOUT = parseInt(process.env.GPT4O_TIMEOUT || '30000'); // 30 seconds

interface TradeSignal {
  symbol: string;
  entryPrice: number;
  tp1Price: number;
  tp1Allocation: number;
  tp2Price: number;
  tp2Allocation: number;
  tp3Price: number;
  tp3Allocation: number;
  stopLossPrice: number;
  stopLossPercentage: number;
  timeframe: '1h' | '4h' | '1d' | '1w';
  timeframeHours: number;
  confidenceScore: number;
  riskRewardRatio: number;
  marketCondition: 'trending' | 'ranging' | 'volatile';
  aiReasoning: string;
  aiModelVersion: string;
}

interface ComprehensiveContext {
  marketData: MarketData;
  technicalIndicators: TechnicalIndicators;
  sentimentData: SentimentData; // Includes LunarCrush data
  onChainData: OnChainData;
}

/**
 * Build comprehensive context from all data sources
 * LunarCrush data is included in sentimentData
 */
export function buildComprehensiveContext(
  marketData: MarketData,
  technicalIndicators: TechnicalIndicators,
  sentimentData: SentimentData,
  onChainData: OnChainData
): string {
  // LunarCrush data is now included in sentimentData.lunarCrush (basic metrics only)
  // LunarCrush data is now included in sentimentData.lunarCrush (basic metrics only)

  return `
# Comprehensive Market Analysis for ${marketData.symbol}

## Current Market Data
- Current Price: $${marketData.currentPrice.toLocaleString()}
- 24h Change: ${marketData.priceChangePercentage24h.toFixed(2)}% ($${marketData.priceChange24h.toLocaleString()})
- 24h High: $${marketData.high24h.toLocaleString()}
- 24h Low: $${marketData.low24h.toLocaleString()}
- 24h Volume: $${marketData.volume24h.toLocaleString()}
- Market Cap: $${marketData.marketCap.toLocaleString()}
- Data Source: ${marketData.source}

## Technical Indicators
- RSI (14): ${technicalIndicators.rsi.toFixed(2)} ${technicalIndicators.rsi > 70 ? '(Overbought)' : technicalIndicators.rsi < 30 ? '(Oversold)' : '(Neutral)'}
- MACD: ${technicalIndicators.macd.value.toFixed(2)}
- MACD Signal: ${technicalIndicators.macd.signal.toFixed(2)}
- MACD Histogram: ${technicalIndicators.macd.histogram.toFixed(2)} ${technicalIndicators.macd.histogram > 0 ? '(Bullish)' : '(Bearish)'}
- EMA 20: $${technicalIndicators.ema.ema20.toLocaleString()}
- EMA 50: $${technicalIndicators.ema.ema50.toLocaleString()}
- EMA 200: $${technicalIndicators.ema.ema200.toLocaleString()}
- Price vs EMA 20: ${((marketData.currentPrice / technicalIndicators.ema.ema20 - 1) * 100).toFixed(2)}%
- Price vs EMA 50: ${((marketData.currentPrice / technicalIndicators.ema.ema50 - 1) * 100).toFixed(2)}%
- Price vs EMA 200: ${((marketData.currentPrice / technicalIndicators.ema.ema200 - 1) * 100).toFixed(2)}%
- Bollinger Bands:
  - Upper: $${technicalIndicators.bollingerBands.upper.toLocaleString()}
  - Middle: $${technicalIndicators.bollingerBands.middle.toLocaleString()}
  - Lower: $${technicalIndicators.bollingerBands.lower.toLocaleString()}
  - Position: ${marketData.currentPrice > technicalIndicators.bollingerBands.upper ? 'Above upper band' : marketData.currentPrice < technicalIndicators.bollingerBands.lower ? 'Below lower band' : 'Within bands'}
- ATR (14): $${technicalIndicators.atr.toLocaleString()} (Volatility measure)

## Social Sentiment
${sentimentData.lunarCrush ? `
- LunarCrush:
  - Social Score: ${sentimentData.lunarCrush.socialScore}/100
  - Galaxy Score: ${sentimentData.lunarCrush.galaxyScore}/100
  - Alt Rank: #${sentimentData.lunarCrush.altRank}
  - Sentiment: ${sentimentData.lunarCrush.sentiment.toUpperCase()}
` : '- LunarCrush: Data unavailable'}

${sentimentData.twitter ? `
- Twitter/X:
  - Mentions: ${sentimentData.twitter.mentionCount}
  - Sentiment: ${sentimentData.twitter.sentiment.toUpperCase()}
  - Score: ${sentimentData.twitter.sentimentScore}/100
` : '- Twitter/X: Data unavailable'}

${sentimentData.reddit ? `
- Reddit:
  - Posts: ${sentimentData.reddit.postCount}
  - Comments: ${sentimentData.reddit.commentCount}
  - Sentiment: ${sentimentData.reddit.sentiment.toUpperCase()}
  - Score: ${sentimentData.reddit.sentimentScore}/100
` : '- Reddit: Data unavailable'}

- Aggregate Sentiment: ${sentimentData.aggregateSentiment.score}/100 (${sentimentData.aggregateSentiment.label.replace('_', ' ').toUpperCase()})

## On-Chain Activity
- Whale Transactions (>50 ${marketData.symbol}): ${onChainData.largeTransactionCount}
- Total Whale Volume: ${onChainData.totalWhaleVolume.toFixed(2)} ${marketData.symbol}
- Exchange Deposits: ${onChainData.exchangeDeposits} (Potential selling pressure)
- Exchange Withdrawals: ${onChainData.exchangeWithdrawals} (Potential accumulation)
- Net Flow: ${onChainData.netFlow > 0 ? `+${onChainData.netFlow} (Accumulation)` : `${onChainData.netFlow} (Distribution)`}

## Market Context
- Current trend: ${marketData.currentPrice > technicalIndicators.ema.ema50 ? 'Uptrend' : 'Downtrend'} (Price vs EMA 50)
- Long-term trend: ${marketData.currentPrice > technicalIndicators.ema.ema200 ? 'Bull market' : 'Bear market'} (Price vs EMA 200)
- Momentum: ${technicalIndicators.macd.histogram > 0 ? 'Bullish' : 'Bearish'} (MACD histogram)
- Volatility: ${technicalIndicators.atr > marketData.currentPrice * 0.03 ? 'High' : technicalIndicators.atr > marketData.currentPrice * 0.015 ? 'Medium' : 'Low'} (ATR)
`;
}

/**
 * Create OpenAI o1 model prompt for trade signal generation
 * o1 models use advanced reasoning to analyze market conditions
 */
function createO1Prompt(context: string): string {
  return `You are an expert cryptocurrency trading analyst with advanced reasoning capabilities. Based on the comprehensive market analysis below, use your reasoning abilities to generate a precise trading signal.

${context}

CRITICAL: You MUST respond with ONLY valid JSON. No markdown, no code blocks, no explanations - JUST the JSON object.

Generate a trading signal with this EXACT structure:

{
  "entryPrice": 103000.00,
  "tp1Price": 106090.00,
  "tp1Allocation": 40,
  "tp2Price": 109270.00,
  "tp2Allocation": 30,
  "tp3Price": 113300.00,
  "tp3Allocation": 30,
  "stopLossPrice": 98860.00,
  "stopLossPercentage": 4.02,
  "timeframe": "4h",
  "confidenceScore": 78,
  "marketCondition": "trending",
  "reasoning": "Detailed explanation here"
}

Guidelines:
1. Entry price should be close to current price (within 2%)
2. TP1 should be 2-5% from entry, TP2 should be 5-10%, TP3 should be 10-20%
3. Stop loss should be 3-7% below entry for long positions
4. Timeframe must be one of: "1h", "4h", "1d", "1w"
5. Confidence score must be 0-100 (integer)
6. Market condition must be one of: "trending", "ranging", "volatile"
7. Reasoning should be detailed and reference specific indicators
8. If LunarCrush Galaxy Score >70, increase confidence by 5-10 points
9. All prices must be numbers (not strings)
10. All property names must be in double quotes

RESPOND WITH ONLY THE JSON OBJECT - NO OTHER TEXT.`;
}

/**
 * Generate trade signal using OpenAI o1 models (ChatGPT-5.1)
 * Model is configurable via OPENAI_MODEL environment variable
 * Supports o1-mini (efficient) and o1-preview (advanced reasoning)
 */
async function generateWithO1(context: string, symbol: string, useComplexModel: boolean = false): Promise<TradeSignal> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const selectedModel = useComplexModel ? COMPLEX_MODEL : MODEL;
  const timeout = O1_TIMEOUT;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: selectedModel,
        input: [
          {
            role: 'user',
            content: createO1Prompt(context)
          }
        ],
        max_output_tokens: 2000 // o1 models may need more tokens for reasoning
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OpenAI o1 API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Extract actual model used from API response for accurate tracking
    const modelUsed = data.model || selectedModel;
    
    // Extract reasoning if available from o1 models
    const reasoning = data.choices[0].message.reasoning || null;
  
    // Parse JSON response with better error handling
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[ATGE] No JSON found in o1 model response:', content);
      throw new Error('Invalid JSON response from o1 model - no JSON object found');
    }
    
    let signalData;
    try {
      // Try to parse the JSON
      signalData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('[ATGE] JSON parse error:', parseError);
      console.error('[ATGE] Raw JSON string:', jsonMatch[0]);
      
      // Try to fix common JSON issues
      let fixedJson = jsonMatch[0]
        // Fix unquoted property names
        .replace(/(\w+):/g, '"$1":')
        // Fix single quotes
        .replace(/'/g, '"')
        // Fix trailing commas
        .replace(/,(\s*[}\]])/g, '$1');
      
      try {
        signalData = JSON.parse(fixedJson);
        console.log('[ATGE] Successfully parsed JSON after fixes');
      } catch (secondError) {
        console.error('[ATGE] Failed to parse JSON even after fixes');
        throw new Error(`Invalid JSON from o1 model: ${parseError.message}`);
      }
    }
    
    // Calculate timeframe hours
    const timeframeHours = {
      '1h': 1,
      '4h': 4,
      '1d': 24,
      '1w': 168
    }[signalData.timeframe];
    
    // Calculate risk/reward ratio
    const potentialProfit = (
      (signalData.tp1Price - signalData.entryPrice) * 0.4 +
      (signalData.tp2Price - signalData.entryPrice) * 0.3 +
      (signalData.tp3Price - signalData.entryPrice) * 0.3
    );
    const potentialLoss = signalData.entryPrice - signalData.stopLossPrice;
    const riskRewardRatio = potentialProfit / potentialLoss;
    
    // Combine AI reasoning with o1 reasoning chain if available
    const fullReasoning = reasoning 
      ? `${signalData.reasoning}\n\n[o1 Reasoning Process]: ${reasoning}`
      : signalData.reasoning;
    
    return {
      symbol: symbol.toUpperCase(),
      entryPrice: signalData.entryPrice,
      tp1Price: signalData.tp1Price,
      tp1Allocation: signalData.tp1Allocation,
      tp2Price: signalData.tp2Price,
      tp2Allocation: signalData.tp2Allocation,
      tp3Price: signalData.tp3Price,
      tp3Allocation: signalData.tp3Allocation,
      stopLossPrice: signalData.stopLossPrice,
      stopLossPercentage: signalData.stopLossPercentage,
      timeframe: signalData.timeframe,
      timeframeHours,
      confidenceScore: signalData.confidenceScore,
      riskRewardRatio: Math.round(riskRewardRatio * 100) / 100,
      marketCondition: signalData.marketCondition,
      aiReasoning: fullReasoning,
      aiModelVersion: modelUsed  // Use actual model from API response
    };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`o1 model timeout after ${timeout/1000} seconds`);
    }
    throw error;
  }
}

/**
 * Generate trade signal using GPT-4o (fallback for o1 timeout)
 */
async function generateWithGPT4o(context: string, symbol: string): Promise<TradeSignal> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GPT4O_TIMEOUT);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: FALLBACK_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an expert cryptocurrency trading analyst. You MUST respond with ONLY valid JSON. No markdown, no code blocks, no explanations - just the raw JSON object.'
          },
          {
            role: 'user',
            content: createO1Prompt(context)
          }
        ],
        response_format: { type: 'json_object' }, // Force JSON mode
        max_tokens: 1000 // gpt-4o uses max_tokens, not max_output_tokens
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`GPT-4o API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const modelUsed = data.model || FALLBACK_MODEL;
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from GPT-4o');
    }
    
    const signalData = JSON.parse(jsonMatch[0]);
    
    const timeframeHours = {
      '1h': 1,
      '4h': 4,
      '1d': 24,
      '1w': 168
    }[signalData.timeframe];
    
    const potentialProfit = (
      (signalData.tp1Price - signalData.entryPrice) * 0.4 +
      (signalData.tp2Price - signalData.entryPrice) * 0.3 +
      (signalData.tp3Price - signalData.entryPrice) * 0.3
    );
    const potentialLoss = signalData.entryPrice - signalData.stopLossPrice;
    const riskRewardRatio = potentialProfit / potentialLoss;
    
    return {
      symbol: symbol.toUpperCase(),
      entryPrice: signalData.entryPrice,
      tp1Price: signalData.tp1Price,
      tp1Allocation: signalData.tp1Allocation,
      tp2Price: signalData.tp2Price,
      tp2Allocation: signalData.tp2Allocation,
      tp3Price: signalData.tp3Price,
      tp3Allocation: signalData.tp3Allocation,
      stopLossPrice: signalData.stopLossPrice,
      stopLossPercentage: signalData.stopLossPercentage,
      timeframe: signalData.timeframe,
      timeframeHours,
      confidenceScore: signalData.confidenceScore,
      riskRewardRatio: Math.round(riskRewardRatio * 100) / 100,
      marketCondition: signalData.marketCondition,
      aiReasoning: signalData.reasoning,
      aiModelVersion: `${modelUsed} (fallback)`
    };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`GPT-4o timeout after ${GPT4O_TIMEOUT/1000} seconds`);
    }
    throw error;
  }
}

/**
 * Generate trade signal using Gemini AI (fallback)
 */
async function generateWithGemini(context: string, symbol: string): Promise<TradeSignal> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: createGPT4oPrompt(context)
        }]
      }]
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.candidates[0].content.parts[0].text;
  
  // Parse JSON response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Invalid JSON response from Gemini');
  }
  
  const signalData = JSON.parse(jsonMatch[0]);
  
  // Calculate timeframe hours
  const timeframeHours = {
    '1h': 1,
    '4h': 4,
    '1d': 24,
    '1w': 168
  }[signalData.timeframe];
  
  // Calculate risk/reward ratio
  const potentialProfit = (
    (signalData.tp1Price - signalData.entryPrice) * 0.4 +
    (signalData.tp2Price - signalData.entryPrice) * 0.3 +
    (signalData.tp3Price - signalData.entryPrice) * 0.3
  );
  const potentialLoss = signalData.entryPrice - signalData.stopLossPrice;
  const riskRewardRatio = potentialProfit / potentialLoss;
  
  return {
    symbol: symbol.toUpperCase(),
    entryPrice: signalData.entryPrice,
    tp1Price: signalData.tp1Price,
    tp1Allocation: signalData.tp1Allocation,
    tp2Price: signalData.tp2Price,
    tp2Allocation: signalData.tp2Allocation,
    tp3Price: signalData.tp3Price,
    tp3Allocation: signalData.tp3Allocation,
    stopLossPrice: signalData.stopLossPrice,
    stopLossPercentage: signalData.stopLossPercentage,
    timeframe: signalData.timeframe,
    timeframeHours,
    confidenceScore: signalData.confidenceScore,
    riskRewardRatio: Math.round(riskRewardRatio * 100) / 100,
    marketCondition: signalData.marketCondition,
    aiReasoning: signalData.reasoning,
    aiModelVersion: 'gemini-pro'
  };
}

/**
 * Validate trade signal structure
 */
function validateTradeSignal(signal: TradeSignal): boolean {
  // Check required fields
  if (!signal.entryPrice || !signal.tp1Price || !signal.tp2Price || !signal.tp3Price || !signal.stopLossPrice) {
    return false;
  }
  
  // Check price logic
  if (signal.tp1Price <= signal.entryPrice || signal.tp2Price <= signal.tp1Price || signal.tp3Price <= signal.tp2Price) {
    return false;
  }
  
  if (signal.stopLossPrice >= signal.entryPrice) {
    return false;
  }
  
  // Check allocations
  if (signal.tp1Allocation + signal.tp2Allocation + signal.tp3Allocation !== 100) {
    return false;
  }
  
  // Check confidence score
  if (signal.confidenceScore < 0 || signal.confidenceScore > 100) {
    return false;
  }
  
  // Check timeframe
  if (!['1h', '4h', '1d', '1w'].includes(signal.timeframe)) {
    return false;
  }
  
  return true;
}

/**
 * Detect if market conditions require complex analysis
 * Uses o1-preview for highly volatile or unusual conditions
 */
function requiresComplexAnalysis(context: ComprehensiveContext): boolean {
  const { marketData, technicalIndicators, sentimentData } = context;
  
  // High volatility indicators
  const highVolatility = technicalIndicators.atr > marketData.currentPrice * 0.05;
  const extremeRSI = technicalIndicators.rsi > 80 || technicalIndicators.rsi < 20;
  const extremeSentiment = sentimentData.aggregateSentiment.score > 85 || sentimentData.aggregateSentiment.score < 15;
  const largePrice Change = Math.abs(marketData.priceChangePercentage24h) > 10;
  
  return highVolatility || extremeRSI || extremeSentiment || largePriceChange;
}

/**
 * Generate trade signal with intelligent fallback chain
 * Fallback order: o1-mini → gpt-4o → Gemini AI
 * 
 * @param comprehensiveContext - All market data including LunarCrush
 * @param maxRetries - Maximum retry attempts (default: 3)
 * @returns Generated trade signal
 */
export async function generateTradeSignal(
  comprehensiveContext: ComprehensiveContext,
  maxRetries: number = 3
): Promise<TradeSignal> {
  const context = buildComprehensiveContext(
    comprehensiveContext.marketData,
    comprehensiveContext.technicalIndicators,
    comprehensiveContext.sentimentData,
    comprehensiveContext.onChainData
  );
  
  const symbol = comprehensiveContext.marketData.symbol;
  const useComplexModel = requiresComplexAnalysis(comprehensiveContext);
  
  if (useComplexModel) {
    console.log('[ATGE] Complex market conditions detected, using o1-preview');
  }
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[ATGE] Generating trade signal (attempt ${attempt}/${maxRetries})`);
      
      // Try o1 models first (o1-mini or o1-preview based on complexity)
      try {
        const signal = await generateWithO1(context, symbol, useComplexModel);
        
        if (validateTradeSignal(signal)) {
          console.log(`[ATGE] Trade signal generated successfully with ${signal.aiModelVersion}`);
          return signal;
        } else {
          console.warn(`[ATGE] Invalid signal from o1 model, retrying...`);
        }
      } catch (o1Error) {
        console.error(`[ATGE] o1 model failed, trying GPT-4o fallback:`, o1Error);
        
        // Fallback to GPT-4o
        try {
          const signal = await generateWithGPT4o(context, symbol);
          
          if (validateTradeSignal(signal)) {
            console.log('[ATGE] Trade signal generated successfully with GPT-4o (fallback)');
            return signal;
          } else {
            console.warn('[ATGE] Invalid signal from GPT-4o, trying Gemini...');
          }
        } catch (gpt4oError) {
          console.error(`[ATGE] GPT-4o failed, trying Gemini:`, gpt4oError);
          
          // Final fallback to Gemini
          const signal = await generateWithGemini(context, symbol);
          
          if (validateTradeSignal(signal)) {
            console.log('[ATGE] Trade signal generated successfully with Gemini (final fallback)');
            return signal;
          } else {
            console.warn('[ATGE] Invalid signal from Gemini, retrying...');
          }
        }
      }
    } catch (error) {
      console.error(`[ATGE] Attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        throw new Error(`Failed to generate valid trade signal after ${maxRetries} attempts`);
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  throw new Error('Failed to generate valid trade signal');
}

export type { TradeSignal, ComprehensiveContext };
