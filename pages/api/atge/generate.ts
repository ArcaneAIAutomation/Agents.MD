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
import { getTechnicalIndicatorsV2 } from '../../../lib/atge/technicalIndicatorsV2';
import { getSentimentData } from '../../../lib/atge/sentimentData';
import { getOnChainData } from '../../../lib/atge/onChainData';
import { getLunarCrushAnalysis } from '../../../lib/atge/lunarcrush';
import { generateTradeSignal } from '../../../lib/atge/aiGenerator';
import { fetchHistoricalData } from '../../../lib/atge/historicalData';
import {
  storeTradeSignal,
  storeTechnicalIndicators,
  storeMarketSnapshot,
  storeHistoricalPrices
} from '../../../lib/atge/database';
import { measureExecutionTime, logError } from '../../../lib/atge/monitoring';

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

    // Determine timeframe from query parameter (default to 1h)
    const timeframe = (req.query.timeframe as '15m' | '1h' | '4h' | '1d') || '1h';
    console.log(`[ATGE] Using timeframe: ${timeframe}`);

    // Fetch all market data in parallel with performance tracking
    // CRITICAL: Force fresh data for trade generation (no cache)
    // Use V2 indicators for accurate, timeframe-specific calculations
    const [marketData, technicalIndicators, sentimentData, onChainData] = await measureExecutionTime(
      async () => {
        return await Promise.all([
          getMarketData(symbol, true), // Force fresh data (no cache)
          getTechnicalIndicatorsV2(symbol, timeframe), // V2 with timeframe support (always fresh from Binance)
          getSentimentData(symbol), // Already includes LunarCrush data
          getOnChainData(symbol)
        ]);
      },
      'fetch_market_data',
      'api_response',
      userId
    );

    console.log(`[ATGE] Data fetching completed (including LunarCrush from sentiment data)`);
    console.log(`[ATGE] Technical indicators from ${technicalIndicators.dataSource} (quality: ${technicalIndicators.dataQuality}%)`);

    // Generate trade signal with AI with performance tracking
    const tradeSignal = await measureExecutionTime(
      async () => {
        return await generateTradeSignal({
          marketData,
          technicalIndicators,
          sentimentData, // Already includes LunarCrush data
          onChainData
        });
      },
      'generate_trade_signal',
      'generation_time',
      userId
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

    // Store technical indicators with V2 metadata
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
      marketCap: marketData.marketCap,
      // V2 Metadata
      dataSource: technicalIndicators.dataSource,
      timeframe: technicalIndicators.timeframe,
      calculatedAt: technicalIndicators.calculatedAt,
      dataQuality: technicalIndicators.dataQuality,
      candleCount: technicalIndicators.candleCount
    });

    // Store market snapshot with LunarCrush data from sentimentData
    await storeMarketSnapshot({
      tradeSignalId: storedSignal.id,
      currentPrice: marketData.currentPrice,
      priceChange24h: marketData.priceChange24h,
      volume24h: marketData.volume24h,
      marketCap: marketData.marketCap,
      socialSentimentScore: sentimentData.aggregateSentiment.score,
      whaleActivityCount: onChainData.largeTransactionCount,
      fearGreedIndex: undefined, // TODO: Integrate Fear & Greed Index API
      // LunarCrush Social Intelligence (from sentimentData.lunarCrush)
      galaxyScore: sentimentData.lunarCrush?.galaxyScore,
      altRank: sentimentData.lunarCrush?.altRank,
      socialDominance: undefined, // Not available in basic API
      sentimentPositive: sentimentData.lunarCrush?.sentiment === 'bullish' ? 70 : sentimentData.lunarCrush?.sentiment === 'bearish' ? 30 : 50,
      sentimentNegative: sentimentData.lunarCrush?.sentiment === 'bearish' ? 70 : sentimentData.lunarCrush?.sentiment === 'bullish' ? 30 : 50,
      sentimentNeutral: sentimentData.lunarCrush?.sentiment === 'neutral' ? 100 : 0,
      socialVolume24h: undefined, // Not available in basic API
      socialPosts24h: undefined, // Not available in basic API
      socialInteractions24h: undefined, // Not available in basic API
      socialContributors24h: undefined, // Not available in basic API
      correlationScore: undefined, // Not available in basic API
      snapshotAt: new Date()
    });

    // Fetch and store historical prices for backtesting
    // This runs in the background and doesn't block the response
    console.log('[ATGE] Fetching historical prices for backtesting...');
    fetchHistoricalData({
      symbol,
      startTime: generatedAt,
      endTime: expiresAt,
      resolution: '1h' // 1-hour candles for backtesting
    }, 1) // Priority 1 (high priority)
      .then(async (historicalData) => {
        // Convert to database format
        const prices = historicalData.data.map(candle => ({
          tradeSignalId: storedSignal.id,
          timestamp: candle.timestamp,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume,
          dataSource: historicalData.source
        }));

        // Store in database
        await storeHistoricalPrices(prices);
        console.log(`[ATGE] Stored ${prices.length} historical price candles for trade ${storedSignal.id}`);
      })
      .catch(error => {
        console.error('[ATGE] Failed to fetch/store historical prices:', error);
        // Log error but don't fail the trade generation
        logError({
          errorType: 'backtesting',
          errorMessage: `Failed to fetch historical prices: ${error.message}`,
          errorStack: error.stack,
          userId,
          tradeSignalId: storedSignal.id,
          context: { symbol, startTime: generatedAt, endTime: expiresAt },
          severity: 'medium'
        });
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
    await logError({
      errorType: 'generation',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
      userId: req.user!.id,
      context: { symbol: req.body.symbol },
      severity: 'high'
    });

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return res.status(500).json({
      success: false,
      error: 'Failed to generate trade signal',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
}

export default withAuth(handler);
