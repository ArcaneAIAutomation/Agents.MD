/**
 * ATGE Trade Signal Generation API Route
 * 
 * Generates AI-powered trade signals with comprehensive market analysis
 * Stores complete signal data in database
 * 
 * Requirements: 1.1-1.10, 2.1-2.10, 12.1-12.7, 13.1-13.6
 */

import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth';
import { getMarketData } from '../../../lib/atge/marketData';
import { getTechnicalIndicators } from '../../../lib/atge/technicalIndicators';
import { getSentimentData } from '../../../lib/atge/sentimentData';
import { getOnChainData } from '../../../lib/atge/onChainData';
import { getLunarCrushAnalysis } from '../../../lib/atge/lunarcrush';
import { generateTradeSignal } from '../../../lib/atge/aiGenerator';
import {
  storeTradeSignal,
  storeTechnicalIndicators,
  storeMarketSnapshot
} from '../../../lib/atge/database';
import { trackPerformance, trackError } from '../../../lib/atge/monitoring';

// Rate limiting: Track last generation time per user
const userCooldowns = new Map<string, number>();
const COOLDOWN_MS = 60 * 1000; // 60 seconds
const MAX_TRADES_PER_DAY = 20;
const dailyTradeCounts = new Map<string, { count: number; resetAt: number }>();

/**
 * Check if user is within rate limits
 */
function checkRateLimits(userId: string): { allowed: boolean; message?: string; remainingTime?: number } {
  // Check cooldown (60 seconds between generations)
  const lastGeneration = userCooldowns.get(userId);
  if (lastGeneration) {
    const timeSinceLastGeneration = Date.now() - lastGeneration;
    if (timeSinceLastGeneration < COOLDOWN_MS) {
      const remainingTime = Math.ceil((COOLDOWN_MS - timeSinceLastGeneration) / 1000);
      return {
        allowed: false,
        message: `Please wait ${remainingTime} seconds before generating another trade signal`,
        remainingTime
      };
    }
  }

  // Check daily limit (20 trades per 24 hours)
  const dailyData = dailyTradeCounts.get(userId);
  const now = Date.now();
  
  if (dailyData) {
    // Reset counter if 24 hours have passed
    if (now > dailyData.resetAt) {
      dailyTradeCounts.set(userId, { count: 0, resetAt: now + 24 * 60 * 60 * 1000 });
    } else if (dailyData.count >= MAX_TRADES_PER_DAY) {
      const hoursUntilReset = Math.ceil((dailyData.resetAt - now) / (60 * 60 * 1000));
      return {
        allowed: false,
        message: `Daily limit of ${MAX_TRADES_PER_DAY} trades reached. Resets in ${hoursUntilReset} hours`
      };
    }
  } else {
    // Initialize daily counter
    dailyTradeCounts.set(userId, { count: 0, resetAt: now + 24 * 60 * 60 * 1000 });
  }

  return { allowed: true };
}

/**
 * Update rate limit counters
 */
function updateRateLimits(userId: string): void {
  // Update cooldown
  userCooldowns.set(userId, Date.now());

  // Update daily count
  const dailyData = dailyTradeCounts.get(userId);
  if (dailyData) {
    dailyData.count++;
  }
}

/**
 * Generate trade signal API handler
 */
async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const userId = req.user!.id;
    const { symbol } = req.body;

    // Validate symbol
    if (!symbol || !['BTC', 'ETH'].includes(symbol.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid symbol. Must be BTC or ETH'
      });
    }

    // Check rate limits
    const rateLimitCheck = checkRateLimits(userId);
    if (!rateLimitCheck.allowed) {
      return res.status(429).json({
        success: false,
        error: rateLimitCheck.message,
        remainingTime: rateLimitCheck.remainingTime
      });
    }

    console.log(`[ATGE] Generating trade signal for ${symbol} (user: ${userId})`);

    const startTime = Date.now();

    // Fetch all market data in parallel with performance tracking
    const [marketData, technicalIndicators, sentimentData, onChainData, lunarCrushData] = await trackPerformance(
      'fetch_market_data',
      'api_response',
      async () => {
        // Fetch LunarCrush data ONLY for Bitcoin
        const lunarCrushPromise = symbol.toUpperCase() === 'BTC'
          ? getLunarCrushAnalysis(symbol).catch(error => {
              console.warn('[ATGE] LunarCrush data unavailable:', error);
              return undefined; // Graceful fallback
            })
          : Promise.resolve(undefined); // Skip for non-Bitcoin symbols

        return await Promise.all([
          getMarketData(symbol),
          getTechnicalIndicators(symbol),
          getSentimentData(symbol),
          getOnChainData(symbol),
          lunarCrushPromise
        ]);
      },
      { symbol, userId }
    );

    console.log(`[ATGE] Data fetching completed${lunarCrushData ? ' (including Bitcoin LunarCrush)' : ''}`);

    // Generate trade signal with AI with performance tracking
    const tradeSignal = await trackPerformance(
      'generate_trade_signal',
      'generation_time',
      async () => {
        return await generateTradeSignal({
          marketData,
          technicalIndicators,
          sentimentData,
          onChainData,
          lunarCrushData
        });
      },
      { symbol, userId }
    );

    console.log(`[ATGE] AI generation completed`);

    // Calculate expiration time based on timeframe
    const generatedAt = new Date();
    const expiresAt = new Date(generatedAt.getTime() + tradeSignal.timeframeHours * 60 * 60 * 1000);

    // Store trade signal in database
    const storedSignal = await storeTradeSignal({
      userId,
      symbol: tradeSignal.symbol,
      status: 'active',
      entryPrice: tradeSignal.entryPrice,
      tp1Price: tradeSignal.tp1Price,
      tp1Allocation: tradeSignal.tp1Allocation,
      tp2Price: tradeSignal.tp2Price,
      tp2Allocation: tradeSignal.tp2Allocation,
      tp3Price: tradeSignal.tp3Price,
      tp3Allocation: tradeSignal.tp3Allocation,
      stopLossPrice: tradeSignal.stopLossPrice,
      stopLossPercentage: tradeSignal.stopLossPercentage,
      timeframe: tradeSignal.timeframe,
      timeframeHours: tradeSignal.timeframeHours,
      confidenceScore: tradeSignal.confidenceScore,
      riskRewardRatio: tradeSignal.riskRewardRatio,
      marketCondition: tradeSignal.marketCondition,
      aiReasoning: tradeSignal.aiReasoning,
      aiModelVersion: tradeSignal.aiModelVersion,
      generatedAt,
      expiresAt
    });

    // Store technical indicators
    await storeTechnicalIndicators({
      tradeSignalId: storedSignal.id,
      rsiValue: technicalIndicators.rsi,
      macdValue: technicalIndicators.macd.value,
      macdSignal: technicalIndicators.macd.signal,
      macdHistogram: technicalIndicators.macd.histogram,
      ema20: technicalIndicators.ema.ema20,
      ema50: technicalIndicators.ema.ema50,
      ema200: technicalIndicators.ema.ema200,
      bollingerUpper: technicalIndicators.bollingerBands.upper,
      bollingerMiddle: technicalIndicators.bollingerBands.middle,
      bollingerLower: technicalIndicators.bollingerBands.lower,
      atrValue: technicalIndicators.atr,
      volume24h: marketData.volume24h,
      marketCap: marketData.marketCap
    });

    // Store market snapshot with LunarCrush data
    await storeMarketSnapshot({
      tradeSignalId: storedSignal.id,
      currentPrice: marketData.currentPrice,
      priceChange24h: marketData.priceChange24h,
      volume24h: marketData.volume24h,
      marketCap: marketData.marketCap,
      socialSentimentScore: sentimentData.aggregateSentiment.score,
      whaleActivityCount: onChainData.largeTransactionCount,
      fearGreedIndex: undefined, // TODO: Integrate Fear & Greed Index API
      // LunarCrush Social Intelligence
      galaxyScore: lunarCrushData?.currentMetrics.galaxyScore,
      altRank: lunarCrushData?.currentMetrics.altRank,
      socialDominance: lunarCrushData?.currentMetrics.socialDominance,
      sentimentPositive: lunarCrushData?.currentMetrics.sentiment.positive,
      sentimentNegative: lunarCrushData?.currentMetrics.sentiment.negative,
      sentimentNeutral: lunarCrushData?.currentMetrics.sentiment.neutral,
      socialVolume24h: lunarCrushData?.currentMetrics.socialVolume.total,
      socialPosts24h: lunarCrushData?.currentMetrics.socialVolume.posts,
      socialInteractions24h: lunarCrushData?.currentMetrics.socialVolume.interactions,
      socialContributors24h: lunarCrushData?.currentMetrics.socialVolume.contributors,
      correlationScore: lunarCrushData?.currentMetrics.correlationScore,
      snapshotAt: new Date()
    });

    // Update rate limits
    updateRateLimits(userId);

    const totalTime = Date.now() - startTime;
    console.log(`[ATGE] Trade signal generated successfully in ${totalTime}ms`);

    // Return complete trade signal
    return res.status(200).json({
      success: true,
      message: 'Trade signal generated successfully',
      trade: {
        id: storedSignal.id,
        symbol: storedSignal.symbol,
        entryPrice: storedSignal.entryPrice,
        takeProfit: {
          tp1: { price: storedSignal.tp1Price, allocation: storedSignal.tp1Allocation },
          tp2: { price: storedSignal.tp2Price, allocation: storedSignal.tp2Allocation },
          tp3: { price: storedSignal.tp3Price, allocation: storedSignal.tp3Allocation }
        },
        stopLoss: {
          price: storedSignal.stopLossPrice,
          percentage: storedSignal.stopLossPercentage
        },
        timeframe: storedSignal.timeframe,
        confidenceScore: storedSignal.confidenceScore,
        riskRewardRatio: storedSignal.riskRewardRatio,
        marketCondition: storedSignal.marketCondition,
        reasoning: storedSignal.aiReasoning,
        generatedAt: storedSignal.generatedAt,
        expiresAt: storedSignal.expiresAt
      },
      metadata: {
        aiModel: storedSignal.aiModelVersion,
        dataSource: marketData.source,
        generationTime: totalTime
      }
    });
  } catch (error) {
    console.error('[ATGE] Trade generation error:', error);

    // Track error in monitoring system
    await trackError(
      'generation',
      error as Error,
      { symbol: req.body.symbol, userId: req.user!.id },
      'high'
    );

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return res.status(500).json({
      success: false,
      error: 'Failed to generate trade signal',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
}

export default withAuth(handler);
