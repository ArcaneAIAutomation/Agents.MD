/**
 * ATGE Trade Analysis API
 * 
 * Analyzes completed trades using AI to provide insights on why they succeeded or failed.
 * Requirements: 7.7-7.15
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { query, queryOne } from '../../../lib/db';
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth';
import { analyzeTradeWithAI } from '../../../lib/atge/aiAnalyzer';

interface AnalyzeRequest {
  tradeSignalId: string;
}

interface AnalyzeResponse {
  success: boolean;
  analysis?: {
    outcome: 'success' | 'failure';
    profitLoss: number;
    profitLossPercentage: number;
    explanation: string;
    keyFactors: string[];
    whatWorked: string[];
    whatDidntWork: string[];
    marketConditionImpact: string;
    technicalIndicatorAccuracy: string;
    confidenceScoreReview: string;
    recommendations: string[];
    lessonsLearned: string[];
  };
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AnalyzeResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    // 1. Verify user authentication (Requirement 7.7)
    const authResult = await verifyAuth(req);
    if (!authResult.success || !authResult.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized. Please log in.'
      });
    }

    // 2. Get request data
    const { tradeSignalId } = req.body as AnalyzeRequest;

    if (!tradeSignalId) {
      return res.status(400).json({
        success: false,
        error: 'Trade signal ID is required'
      });
    }

    // 3. Fetch complete trade data from database (Requirement 7.8)
    const tradeData = await fetchCompleteTradeData(tradeSignalId, authResult.user.id);

    if (!tradeData) {
      return res.status(404).json({
        success: false,
        error: 'Trade not found or not authorized'
      });
    }

    // 4. Check if trade is completed
    if (tradeData.signal.status !== 'completed_success' && tradeData.signal.status !== 'completed_failure') {
      return res.status(400).json({
        success: false,
        error: 'Trade must be completed before analysis'
      });
    }

    // 5. Check if analysis already exists
    if (tradeData.result?.aiAnalysis) {
      // Return existing analysis
      return res.status(200).json({
        success: true,
        analysis: JSON.parse(tradeData.result.aiAnalysis)
      });
    }

    // 6. Generate AI analysis (Requirement 7.9)
    const analysis = await analyzeTradeWithAI({
      tradeSignal: {
        symbol: tradeData.signal.symbol,
        entryPrice: tradeData.signal.entry_price,
        tp1Price: tradeData.signal.tp1_price,
        tp2Price: tradeData.signal.tp2_price,
        tp3Price: tradeData.signal.tp3_price,
        stopLossPrice: tradeData.signal.stop_loss_price,
        timeframe: tradeData.signal.timeframe,
        confidenceScore: tradeData.signal.confidence_score,
        marketCondition: tradeData.signal.market_condition,
        aiReasoning: tradeData.signal.ai_reasoning,
        generatedAt: tradeData.signal.generated_at
      },
      tradeResult: {
        actualEntryPrice: tradeData.result.actual_entry_price,
        actualExitPrice: tradeData.result.actual_exit_price,
        tp1Hit: tradeData.result.tp1_hit,
        tp1HitAt: tradeData.result.tp1_hit_at,
        tp1HitPrice: tradeData.result.tp1_hit_price,
        tp2Hit: tradeData.result.tp2_hit,
        tp2HitAt: tradeData.result.tp2_hit_at,
        tp2HitPrice: tradeData.result.tp2_hit_price,
        tp3Hit: tradeData.result.tp3_hit,
        tp3HitAt: tradeData.result.tp3_hit_at,
        tp3HitPrice: tradeData.result.tp3_hit_price,
        stopLossHit: tradeData.result.stop_loss_hit,
        stopLossHitAt: tradeData.result.stop_loss_hit_at,
        stopLossHitPrice: tradeData.result.stop_loss_hit_price,
        profitLossUsd: tradeData.result.profit_loss_usd,
        profitLossPercentage: tradeData.result.profit_loss_percentage,
        tradeDurationMinutes: tradeData.result.trade_duration_minutes
      },
      technicalIndicators: {
        rsiValue: tradeData.indicators?.rsi_value,
        macdValue: tradeData.indicators?.macd_value,
        macdSignal: tradeData.indicators?.macd_signal,
        ema20: tradeData.indicators?.ema_20,
        ema50: tradeData.indicators?.ema_50,
        ema200: tradeData.indicators?.ema_200,
        bollingerUpper: tradeData.indicators?.bollinger_upper,
        bollingerMiddle: tradeData.indicators?.bollinger_middle,
        bollingerLower: tradeData.indicators?.bollinger_lower,
        atrValue: tradeData.indicators?.atr_value
      },
      marketSnapshot: {
        currentPrice: tradeData.snapshot.current_price,
        priceChange24h: tradeData.snapshot.price_change_24h,
        volume24h: tradeData.snapshot.volume_24h,
        socialSentimentScore: tradeData.snapshot.social_sentiment_score,
        whaleActivityCount: tradeData.snapshot.whale_activity_count,
        fearGreedIndex: tradeData.snapshot.fear_greed_index
      }
    });

    // 7. Store analysis in trade_results table (Requirement 7.10)
    await query(
      `UPDATE trade_results 
       SET ai_analysis = $1 
       WHERE trade_signal_id = $2`,
      [JSON.stringify(analysis), tradeSignalId]
    );

    // 8. Return analysis to frontend (Requirement 7.11)
    return res.status(200).json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('Trade analysis error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to analyze trade. Please try again.'
    });
  }
}

/**
 * Fetch complete trade data with all related tables
 */
async function fetchCompleteTradeData(tradeSignalId: string, userId: string) {
  try {
    // Fetch trade signal
    const signal = await queryOne(
      `SELECT * FROM trade_signals 
       WHERE id = $1 AND user_id = $2`,
      [tradeSignalId, userId]
    );

    if (!signal) {
      return null;
    }

    // Fetch trade result
    const result = await queryOne(
      `SELECT * FROM trade_results 
       WHERE trade_signal_id = $1`,
      [tradeSignalId]
    );

    if (!result) {
      return null;
    }

    // Fetch technical indicators
    const indicators = await queryOne(
      `SELECT * FROM trade_technical_indicators 
       WHERE trade_signal_id = $1`,
      [tradeSignalId]
    );

    // Fetch market snapshot
    const snapshot = await queryOne(
      `SELECT * FROM trade_market_snapshot 
       WHERE trade_signal_id = $1`,
      [tradeSignalId]
    );

    return {
      signal,
      result,
      indicators,
      snapshot
    };
  } catch (error) {
    console.error('Error fetching trade data:', error);
    return null;
  }
}
