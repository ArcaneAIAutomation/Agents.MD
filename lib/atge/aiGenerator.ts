/**
 * AI Trade Signal Generator for ATGE
 * 
 * Uses OpenAI GPT-5.1 to generate trade signals with comprehensive market analysis
 * Implements Gemini AI fallback
 * Validates and retries up to 3 times
 * 
 * Requirements: 11.1-11.8
 */

import { MarketData } from './marketData';
import { TechnicalIndicators } from './technicalIndicators';
import { SentimentData } from './sentimentData';
import { OnChainData } from './onChainData';
// LunarCrush data is now included in SentimentData

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
 * Create OpenAI GPT-5.1 prompt for trade signal generation
 */
function createGPT4oPrompt(context: string): string {
  return `You are an expert cryptocurrency trading analyst. Based on the comprehensive market analysis below, generate a precise trading signal.

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
 * Generate trade signal using OpenAI GPT-5.1
 */
async function generateWithGPT4o(context: string, symbol: string): Promise<TradeSignal> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-5',
      messages: [
        {
          role: 'system',
          content: 'You are an expert cryptocurrency trading analyst. You MUST respond with ONLY valid JSON. No markdown, no code blocks, no explanations - just the raw JSON object.'
        },
        {
          role: 'user',
          content: createGPT4oPrompt(context)
        }
      ],
      response_format: { type: 'json_object' }, // Force JSON mode
      max_completion_tokens: 1000
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI GPT-5.1 API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  // Parse JSON response with better error handling
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('[ATGE] No JSON found in OpenAI GPT-5.1 response:', content);
    throw new Error('Invalid JSON response from OpenAI GPT-5.1 - no JSON object found');
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
      throw new Error(`Invalid JSON from OpenAI GPT-5.1: ${parseError.message}`);
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
    aiModelVersion: 'gpt-5'
  };
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
 * Generate trade signal with retry logic
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
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[ATGE] Generating trade signal (attempt ${attempt}/${maxRetries})`);
      
      // Try OpenAI GPT-5.1 first
      try {
        const signal = await generateWithGPT4o(context, symbol);
        
        if (validateTradeSignal(signal)) {
          console.log('[ATGE] Trade signal generated successfully with OpenAI GPT-5.1');
          return signal;
        } else {
          console.warn('[ATGE] Invalid signal from OpenAI GPT-5.1, retrying...');
        }
      } catch (gptError) {
        console.error('[ATGE] OpenAI GPT-5.1 failed, trying Gemini:', gptError);
        
        // Fallback to Gemini
        const signal = await generateWithGemini(context, symbol);
        
        if (validateTradeSignal(signal)) {
          console.log('[ATGE] Trade signal generated successfully with Gemini');
          return signal;
        } else {
          console.warn('[ATGE] Invalid signal from Gemini, retrying...');
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
