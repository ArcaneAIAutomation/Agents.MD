/**
 * ATGE GPT-5.1 Trade Analysis Generation API Route
 * Bitcoin Sovereign Technology - AI Trade Generation Engine
 * 
 * Generates comprehensive AI analysis for completed trades using GPT-5.1
 * with high reasoning effort. Analyzes trade outcomes, success/failure factors,
 * and provides actionable recommendations.
 * 
 * Requirements: 3.1
 */

import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth';
import { query } from '../../../lib/db';
import OpenAI from 'openai';
import { extractResponseText, validateResponseText } from '../../../utils/openai';

// Initialize OpenAI client with Responses API headers
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  defaultHeaders: {
    'OpenAI-Beta': 'responses=v1'
  }
});

interface AnalysisResult {
  summary: string;
  successFactors: string[];
  failureFactors: string[];
  recommendations: string[];
  confidenceScore: number;
}

/**
 * Build system prompt for GPT-5.1 analysis
 */
function buildSystemPrompt(): string {
  return `You are an expert cryptocurrency trading analyst specializing in post-trade analysis. 
Your role is to analyze completed trades and provide actionable insights.

Analyze the trade data provided and return a structured JSON response with the following fields:
{
  "summary": "A concise 2-3 sentence summary of the trade outcome",
  "successFactors": ["Array of factors that contributed to success (if profitable)"],
  "failureFactors": ["Array of factors that contributed to failure (if unprofitable)"],
  "recommendations": ["Array of 3-5 specific, actionable recommendations for future trades"],
  "confidenceScore": 85 // Integer 0-100 representing confidence in this analysis
}

Focus on:
1. Technical indicators and their signals
2. Market conditions at entry
3. Risk management execution
4. Timing and price action
5. Specific, actionable insights

Be direct and specific. Avoid generic advice.`;
}

/**
 * Build user prompt with trade context
 */
function buildUserPrompt(context: any): string {
  const { tradeSignal, outcome, technicalIndicators, marketSnapshot } = context;
  
  let prompt = `Analyze this ${tradeSignal.symbol} trade:\n\n`;
  
  // Trade Setup
  prompt += `TRADE SETUP:\n`;
  prompt += `- Symbol: ${tradeSignal.symbol}\n`;
  prompt += `- Entry Price: $${tradeSignal.entryPrice.toFixed(2)}\n`;
  prompt += `- Stop Loss: $${tradeSignal.stopLossPrice.toFixed(2)} (${tradeSignal.stopLossPercentage.toFixed(2)}%)\n`;
  prompt += `- TP1: $${tradeSignal.tp1Price.toFixed(2)} (${tradeSignal.tp1Allocation}% allocation)\n`;
  prompt += `- TP2: $${tradeSignal.tp2Price.toFixed(2)} (${tradeSignal.tp2Allocation}% allocation)\n`;
  prompt += `- TP3: $${tradeSignal.tp3Price.toFixed(2)} (${tradeSignal.tp3Allocation}% allocation)\n`;
  prompt += `- Timeframe: ${tradeSignal.timeframe} (${tradeSignal.timeframeHours}h)\n`;
  prompt += `- Confidence: ${tradeSignal.confidenceScore}%\n`;
  prompt += `- Risk/Reward: ${tradeSignal.riskRewardRatio.toFixed(2)}\n`;
  prompt += `- Market Condition: ${tradeSignal.marketCondition}\n\n`;
  
  // AI Reasoning from trade generation
  if (tradeSignal.aiReasoning) {
    prompt += `ORIGINAL AI REASONING:\n${tradeSignal.aiReasoning}\n\n`;
  }
  
  // Actual Outcome
  if (outcome) {
    prompt += `ACTUAL OUTCOME:\n`;
    prompt += `- Entry: $${outcome.actualEntryPrice.toFixed(2)}\n`;
    
    if (outcome.tp1Hit) {
      prompt += `- ✅ TP1 HIT at $${outcome.tp1HitPrice?.toFixed(2)} (${outcome.tp1HitAt ? new Date(outcome.tp1HitAt).toLocaleString() : 'N/A'})\n`;
    }
    if (outcome.tp2Hit) {
      prompt += `- ✅ TP2 HIT at $${outcome.tp2HitPrice?.toFixed(2)} (${outcome.tp2HitAt ? new Date(outcome.tp2HitAt).toLocaleString() : 'N/A'})\n`;
    }
    if (outcome.tp3Hit) {
      prompt += `- ✅ TP3 HIT at $${outcome.tp3HitPrice?.toFixed(2)} (${outcome.tp3HitAt ? new Date(outcome.tp3HitAt).toLocaleString() : 'N/A'})\n`;
    }
    if (outcome.stopLossHit) {
      prompt += `- ❌ STOP LOSS HIT at $${outcome.stopLossHitPrice?.toFixed(2)} (${outcome.stopLossHitAt ? new Date(outcome.stopLossHitAt).toLocaleString() : 'N/A'})\n`;
    }
    
    if (outcome.netProfitLossUsd !== undefined) {
      const profitSign = outcome.netProfitLossUsd >= 0 ? '+' : '';
      prompt += `- Net P/L: ${profitSign}$${outcome.netProfitLossUsd.toFixed(2)} (${profitSign}${outcome.profitLossPercentage?.toFixed(2)}%)\n`;
    }
    
    if (outcome.tradeDurationMinutes) {
      const hours = Math.floor(outcome.tradeDurationMinutes / 60);
      const minutes = outcome.tradeDurationMinutes % 60;
      prompt += `- Duration: ${hours}h ${minutes}m\n`;
    }
    
    prompt += `- Trade Size: $${outcome.tradeSizeUsd.toFixed(2)}\n`;
    prompt += `- Fees: $${outcome.feesUsd.toFixed(2)}\n`;
    prompt += `- Slippage: $${outcome.slippageUsd.toFixed(2)}\n`;
    prompt += `- Data Quality: ${outcome.dataQualityScore}%\n\n`;
  }
  
  // Technical Indicators
  if (technicalIndicators) {
    prompt += `TECHNICAL INDICATORS (at entry):\n`;
    prompt += `- RSI: ${technicalIndicators.rsiValue.toFixed(2)} (${technicalIndicators.rsiSignal})\n`;
    prompt += `- MACD: ${technicalIndicators.macdValue.toFixed(4)} (Signal: ${technicalIndicators.macdSignal.toFixed(4)}, Histogram: ${technicalIndicators.macdHistogram.toFixed(4)})\n`;
    prompt += `- EMA20: $${technicalIndicators.ema20.toFixed(2)}\n`;
    prompt += `- EMA50: $${technicalIndicators.ema50.toFixed(2)}\n`;
    prompt += `- EMA200: $${technicalIndicators.ema200.toFixed(2)}\n`;
    prompt += `- Bollinger Bands: Upper $${technicalIndicators.bollingerUpper.toFixed(2)}, Middle $${technicalIndicators.bollingerMiddle.toFixed(2)}, Lower $${technicalIndicators.bollingerLower.toFixed(2)}\n`;
    prompt += `- ATR: ${technicalIndicators.atrValue.toFixed(2)}\n`;
    prompt += `- 24h Volume: $${technicalIndicators.volume24h.toLocaleString()}\n\n`;
  }
  
  // Market Snapshot
  if (marketSnapshot) {
    prompt += `MARKET CONDITIONS (at entry):\n`;
    prompt += `- Price: $${marketSnapshot.currentPrice.toFixed(2)}\n`;
    prompt += `- 24h Change: ${marketSnapshot.priceChange24h >= 0 ? '+' : ''}${marketSnapshot.priceChange24h.toFixed(2)}%\n`;
    prompt += `- 24h High: $${marketSnapshot.high24h.toFixed(2)}\n`;
    prompt += `- 24h Low: $${marketSnapshot.low24h.toFixed(2)}\n`;
    prompt += `- Market Cap: $${(marketSnapshot.marketCap / 1e9).toFixed(2)}B\n`;
    
    if (marketSnapshot.socialSentimentScore !== undefined) {
      prompt += `- Social Sentiment: ${marketSnapshot.socialSentimentScore.toFixed(0)}/100\n`;
    }
    if (marketSnapshot.whaleActivityCount !== undefined) {
      prompt += `- Whale Activity: ${marketSnapshot.whaleActivityCount} transactions\n`;
    }
    if (marketSnapshot.fearGreedIndex !== undefined) {
      prompt += `- Fear & Greed Index: ${marketSnapshot.fearGreedIndex}\n`;
    }
    prompt += `\n`;
  }
  
  prompt += `Provide a comprehensive analysis of this trade, focusing on what worked, what didn't, and specific recommendations for improvement.`;
  
  return prompt;
}

/**
 * Call GPT-5.1 with retry logic
 */
async function generateAnalysisWithRetry(
  context: any,
  maxRetries: number = 3
): Promise<AnalysisResult> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🤖 GPT-5.1 Analysis Attempt ${attempt}/${maxRetries}`);
      
      // Call GPT-5.1 with high reasoning effort
      const completion = await openai.chat.completions.create({
        model: 'gpt-5.1',
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          { role: 'user', content: buildUserPrompt(context) }
        ],
        reasoning: {
          effort: 'high' // 5-10 seconds for comprehensive analysis
        },
        temperature: 0.7,
        max_tokens: 2000
      });
      
      // Extract response text using bulletproof utility
      const responseText = extractResponseText(completion as any, true);
      
      // Validate response text
      validateResponseText(responseText, 'gpt-5.1', completion);
      
      // Parse JSON response
      const analysis = JSON.parse(responseText);
      
      // Validate structure
      if (!analysis.summary || !Array.isArray(analysis.recommendations)) {
        throw new Error('Invalid analysis structure');
      }
      
      console.log('✅ GPT-5.1 Analysis Generated Successfully');
      
      return {
        summary: analysis.summary,
        successFactors: analysis.successFactors || [],
        failureFactors: analysis.failureFactors || [],
        recommendations: analysis.recommendations || [],
        confidenceScore: analysis.confidenceScore || 75
      };
      
    } catch (error) {
      lastError = error as Error;
      console.error(`❌ GPT-5.1 Analysis Attempt ${attempt} Failed:`, error);
      
      // Exponential backoff: 2^attempt seconds
      if (attempt < maxRetries) {
        const delayMs = Math.pow(2, attempt) * 1000;
        console.log(`⏳ Retrying in ${delayMs / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  // All retries failed
  throw new Error(`GPT-5.1 analysis failed after ${maxRetries} attempts: ${lastError?.message}`);
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }
  
  try {
    // Get authenticated user
    const userId = req.user!.id;
    
    // Get tradeId from request body
    const { tradeId } = req.body;
    
    if (!tradeId || typeof tradeId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Trade ID is required'
      });
    }
    
    // Fetch trade context (reuse logic from analyze-trade endpoint)
    const contextResult = await query(`
      SELECT 
        -- Trade Signal
        ts.id, ts.user_id, ts.symbol, ts.status,
        ts.entry_price, 
        ts.tp1_price, ts.tp1_allocation,
        ts.tp2_price, ts.tp2_allocation,
        ts.tp3_price, ts.tp3_allocation,
        ts.stop_loss_price, ts.stop_loss_percentage,
        ts.timeframe, ts.timeframe_hours,
        ts.confidence_score, ts.risk_reward_ratio, ts.market_condition,
        ts.ai_reasoning, ts.ai_model_version,
        ts.generated_at, ts.expires_at,
        
        -- Trade Result
        tr.id as result_id,
        tr.actual_entry_price, tr.actual_exit_price,
        tr.tp1_hit, tr.tp1_hit_at, tr.tp1_hit_price,
        tr.tp2_hit, tr.tp2_hit_at, tr.tp2_hit_price,
        tr.tp3_hit, tr.tp3_hit_at, tr.tp3_hit_price,
        tr.sl_hit, tr.sl_hit_at, tr.sl_hit_price,
        tr.net_profit_loss, tr.profit_loss_percentage, tr.time_to_completion_minutes,
        tr.trade_size_usd, tr.fees_paid, tr.slippage_cost,
        tr.ai_analysis, tr.ai_analysis_generated_at,
        
        -- Technical Indicators
        ti.rsi_14, ti.macd_line, ti.macd_signal, ti.macd_histogram,
        ti.ema_20, ti.ema_50, ti.ema_200,
        ti.bb_upper, ti.bb_middle, ti.bb_lower,
        ti.atr_14, ti.volume_24h as indicator_volume,
        
        -- Market Snapshot
        ms.current_price, ms.price_change_24h, 
        ms.volume_24h as snapshot_volume, ms.market_cap,
        ms.high_24h, ms.low_24h,
        ms.social_sentiment_score, ms.whale_activity_count, ms.fear_greed_index,
        ms.snapshot_at
        
      FROM trade_signals ts
      LEFT JOIN trade_results tr ON ts.id = tr.trade_signal_id
      LEFT JOIN trade_technical_indicators ti ON ts.id = ti.trade_signal_id
      LEFT JOIN trade_market_snapshot ms ON ts.id = ms.trade_signal_id
      WHERE ts.id = $1 AND ts.user_id = $2
    `, [tradeId, userId]);
    
    // Check if trade exists
    if (contextResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Trade not found or access denied'
      });
    }
    
    const row = contextResult.rows[0];
    
    // Check if analysis already exists
    if (row.ai_analysis) {
      return res.status(200).json({
        success: true,
        analysis: JSON.parse(row.ai_analysis),
        generatedAt: row.ai_analysis_generated_at,
        cached: true,
        message: 'Analysis already exists (cached)'
      });
    }
    
    // Check if trade is completed or expired
    const isCompleted = row.tp1_hit || row.tp2_hit || row.tp3_hit || row.sl_hit;
    const isExpired = new Date() > new Date(row.expires_at);
    
    if (!isCompleted && !isExpired) {
      return res.status(400).json({
        success: false,
        error: 'Trade is still active. Analysis can only be generated for completed or expired trades.'
      });
    }
    
    // Build context object
    const context = {
      tradeSignal: {
        id: row.id,
        symbol: row.symbol,
        status: row.status,
        entryPrice: parseFloat(row.entry_price),
        tp1Price: parseFloat(row.tp1_price),
        tp1Allocation: parseFloat(row.tp1_allocation),
        tp2Price: parseFloat(row.tp2_price),
        tp2Allocation: parseFloat(row.tp2_allocation),
        tp3Price: parseFloat(row.tp3_price),
        tp3Allocation: parseFloat(row.tp3_allocation),
        stopLossPrice: parseFloat(row.stop_loss_price),
        stopLossPercentage: parseFloat(row.stop_loss_percentage),
        timeframe: row.timeframe,
        timeframeHours: row.timeframe_hours,
        confidenceScore: row.confidence_score,
        riskRewardRatio: parseFloat(row.risk_reward_ratio),
        marketCondition: row.market_condition,
        aiReasoning: row.ai_reasoning,
        aiModelVersion: row.ai_model_version
      },
      outcome: row.result_id ? {
        actualEntryPrice: parseFloat(row.actual_entry_price),
        actualExitPrice: row.actual_exit_price ? parseFloat(row.actual_exit_price) : undefined,
        tp1Hit: row.tp1_hit,
        tp1HitAt: row.tp1_hit_at,
        tp1HitPrice: row.tp1_hit_price ? parseFloat(row.tp1_hit_price) : undefined,
        tp2Hit: row.tp2_hit,
        tp2HitAt: row.tp2_hit_at,
        tp2HitPrice: row.tp2_hit_price ? parseFloat(row.tp2_hit_price) : undefined,
        tp3Hit: row.tp3_hit,
        tp3HitAt: row.tp3_hit_at,
        tp3HitPrice: row.tp3_hit_price ? parseFloat(row.tp3_hit_price) : undefined,
        stopLossHit: row.sl_hit,
        stopLossHitAt: row.sl_hit_at,
        stopLossHitPrice: row.sl_hit_price ? parseFloat(row.sl_hit_price) : undefined,
        netProfitLossUsd: row.net_profit_loss ? parseFloat(row.net_profit_loss) : undefined,
        profitLossPercentage: row.profit_loss_percentage ? parseFloat(row.profit_loss_percentage) : undefined,
        tradeDurationMinutes: row.time_to_completion_minutes,
        tradeSizeUsd: parseFloat(row.trade_size_usd),
        feesUsd: parseFloat(row.fees_paid),
        slippageUsd: parseFloat(row.slippage_cost)
      } : undefined,
      technicalIndicators: row.rsi_14 ? {
        rsiValue: parseFloat(row.rsi_14),
        rsiSignal: parseFloat(row.rsi_14) > 70 ? 'overbought' : parseFloat(row.rsi_14) < 30 ? 'oversold' : 'neutral',
        macdValue: parseFloat(row.macd_line || 0),
        macdSignal: parseFloat(row.macd_signal || 0),
        macdHistogram: parseFloat(row.macd_histogram || 0),
        ema20: parseFloat(row.ema_20 || 0),
        ema50: parseFloat(row.ema_50 || 0),
        ema200: parseFloat(row.ema_200 || 0),
        bollingerUpper: parseFloat(row.bb_upper || 0),
        bollingerMiddle: parseFloat(row.bb_middle || 0),
        bollingerLower: parseFloat(row.bb_lower || 0),
        atrValue: parseFloat(row.atr_14 || 0),
        volume24h: parseFloat(row.indicator_volume || 0)
      } : undefined,
      marketSnapshot: row.current_price ? {
        currentPrice: parseFloat(row.current_price),
        priceChange24h: parseFloat(row.price_change_24h || 0),
        volume24h: parseFloat(row.snapshot_volume || 0),
        marketCap: parseFloat(row.market_cap || 0),
        high24h: parseFloat(row.high_24h || row.current_price),
        low24h: parseFloat(row.low_24h || row.current_price),
        socialSentimentScore: row.social_sentiment_score ? parseFloat(row.social_sentiment_score) : undefined,
        whaleActivityCount: row.whale_activity_count,
        fearGreedIndex: row.fear_greed_index
      } : undefined
    };
    
    // Generate analysis with GPT-5.1
    console.log(`🚀 Generating GPT-5.1 analysis for trade ${tradeId}...`);
    const analysis = await generateAnalysisWithRetry(context);
    
    // Store analysis in database
    await query(`
      UPDATE trade_results
      SET 
        ai_analysis = $1,
        ai_analysis_generated_at = NOW(),
        updated_at = NOW()
      WHERE trade_signal_id = $2
    `, [JSON.stringify(analysis), tradeId]);
    
    console.log(`✅ Analysis stored in database for trade ${tradeId}`);
    
    // Return analysis
    return res.status(200).json({
      success: true,
      analysis,
      generatedAt: new Date().toISOString(),
      cached: false,
      message: 'Analysis generated successfully'
    });
    
  } catch (error) {
    console.error('Generate analysis error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to generate trade analysis',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}

export default withAuth(handler);
