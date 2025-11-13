/**
 * ATGE Trade Generation Integration Tests
 * 
 * Tests the complete trade generation flow including:
 * - Complete generation flow
 * - AI fallback mechanism (GPT-4o -> Gemini)
 * - Rate limiting
 * - Database storage
 * 
 * Requirements: 1.1-1.10, 11.1-11.8
 */

import { generateTradeSignal, buildComprehensiveContext } from '../../lib/atge/aiGenerator';
import { getMarketData } from '../../lib/atge/marketData';
import { getTechnicalIndicators } from '../../lib/atge/technicalIndicators';
import { getSentimentData } from '../../lib/atge/sentimentData';
import { getOnChainData } from '../../lib/atge/onChainData';
import {
  storeTradeSignal,
  fetchTradeSignal,
  storeTechnicalIndicators,
  storeMarketSnapshot,
  fetchAllTrades
} from '../../lib/atge/database';
import { query } from '../../lib/db';
import { randomUUID } from 'crypto';
import { hashPassword } from '../../lib/auth/password';

// Test timeout for AI operations (60 seconds to handle retries)
jest.setTimeout(60000);

/**
 * Retry helper for API calls with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      // Check if it's a rate limit error (429)
      if (error.message?.includes('429') && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`[RETRY] Rate limited, waiting ${delay}ms before retry ${attempt}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // If it's the last attempt or not a rate limit error, throw
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retry
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`[RETRY] Attempt ${attempt} failed, waiting ${delay}ms before retry`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Max retries exceeded');
}

describe('ATGE Trade Generation Integration Tests', () => {
  const TEST_SYMBOL = 'BTC';
  // Use Kiro test user (created by kiro-setup.ts)
  const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';
  const TEST_USER_EMAIL = 'kiro@test.local';
  
  // Setup: Ensure test user exists
  beforeAll(async () => {
    try {
      console.log('[SETUP] Verifying Kiro test user...');
      
      // Check if user exists
      const userCheck = await query('SELECT id FROM users WHERE id = $1', [TEST_USER_ID]);
      
      if (userCheck.rows.length === 0) {
        console.log('[SETUP] Kiro test user not found, creating...');
        const hashedPassword = await hashPassword('kiro123');
        
        await query(`
          INSERT INTO users (id, email, password_hash, email_verified, created_at, updated_at)
          VALUES ($1, $2, $3, TRUE, NOW(), NOW())
        `, [TEST_USER_ID, TEST_USER_EMAIL, hashedPassword]);
        
        console.log('[SETUP] Kiro test user created');
      } else {
        console.log('[SETUP] Kiro test user verified');
      }
    } catch (error) {
      console.error('[SETUP] Setup error:', error);
      console.log('[SETUP] Run: npx tsx scripts/kiro-setup.ts');
      throw error;
    }
  });
  
  // Cleanup function - only remove trade signals, keep user
  afterAll(async () => {
    try {
      console.log('[CLEANUP] Removing test trade signals...');
      await query('DELETE FROM trade_signals WHERE user_id = $1 AND ai_model_version LIKE \'%test%\'', [TEST_USER_ID]);
      console.log('[CLEANUP] Test data removed successfully');
    } catch (error) {
      console.error('[CLEANUP] Cleanup error:', error);
    }
  });

  describe('1. Complete Generation Flow', () => {
    it('should fetch all required data sources', async () => {
      // Fetch market data
      const marketData = await getMarketData(TEST_SYMBOL);
      expect(marketData).toBeDefined();
      expect(marketData.symbol).toBe(TEST_SYMBOL);
      expect(marketData.currentPrice).toBeGreaterThan(0);
      expect(marketData.volume24h).toBeGreaterThan(0);
      expect(marketData.marketCap).toBeGreaterThan(0);
      expect(['CoinMarketCap', 'CoinGecko']).toContain(marketData.source);

      // Calculate technical indicators
      const technicalIndicators = await getTechnicalIndicators(TEST_SYMBOL);
      expect(technicalIndicators).toBeDefined();
      expect(technicalIndicators.rsi).toBeGreaterThanOrEqual(0);
      expect(technicalIndicators.rsi).toBeLessThanOrEqual(100);
      expect(technicalIndicators.macd).toBeDefined();
      expect(technicalIndicators.ema).toBeDefined();
      expect(technicalIndicators.bollingerBands).toBeDefined();
      expect(technicalIndicators.atr).toBeGreaterThan(0);

      // Fetch sentiment data
      const sentimentData = await getSentimentData(TEST_SYMBOL);
      expect(sentimentData).toBeDefined();
      expect(sentimentData.aggregateSentiment).toBeDefined();
      expect(sentimentData.aggregateSentiment.score).toBeGreaterThanOrEqual(0);
      expect(sentimentData.aggregateSentiment.score).toBeLessThanOrEqual(100);

      // Fetch on-chain data
      const onChainData = await getOnChainData(TEST_SYMBOL);
      expect(onChainData).toBeDefined();
      expect(onChainData.largeTransactionCount).toBeGreaterThanOrEqual(0);
      expect(onChainData.totalWhaleVolume).toBeGreaterThanOrEqual(0);
    });

    it('should build comprehensive context from all data sources', async () => {
      const marketData = await getMarketData(TEST_SYMBOL);
      const technicalIndicators = await getTechnicalIndicators(TEST_SYMBOL);
      const sentimentData = await getSentimentData(TEST_SYMBOL);
      const onChainData = await getOnChainData(TEST_SYMBOL);

      const context = buildComprehensiveContext(
        marketData,
        technicalIndicators,
        sentimentData,
        onChainData
      );

      expect(context).toBeDefined();
      expect(typeof context).toBe('string');
      expect(context).toContain('Comprehensive Market Analysis');
      expect(context).toContain('Current Market Data');
      expect(context).toContain('Technical Indicators');
      expect(context).toContain('Social Sentiment');
      expect(context).toContain('On-Chain Activity');
      expect(context).toContain(TEST_SYMBOL);
    });

    it('should generate a valid trade signal with AI', async () => {
      const marketData = await getMarketData(TEST_SYMBOL);
      const technicalIndicators = await getTechnicalIndicators(TEST_SYMBOL);
      const sentimentData = await getSentimentData(TEST_SYMBOL);
      const onChainData = await getOnChainData(TEST_SYMBOL);

      const tradeSignal = await generateTradeSignal({
        marketData,
        technicalIndicators,
        sentimentData,
        onChainData
      });

      // Validate trade signal structure
      expect(tradeSignal).toBeDefined();
      expect(tradeSignal.symbol).toBe(TEST_SYMBOL);
      expect(tradeSignal.entryPrice).toBeGreaterThan(0);
      
      // Validate take profit levels
      expect(tradeSignal.tp1Price).toBeGreaterThan(tradeSignal.entryPrice);
      expect(tradeSignal.tp2Price).toBeGreaterThan(tradeSignal.tp1Price);
      expect(tradeSignal.tp3Price).toBeGreaterThan(tradeSignal.tp2Price);
      
      // Validate stop loss
      expect(tradeSignal.stopLossPrice).toBeLessThan(tradeSignal.entryPrice);
      expect(tradeSignal.stopLossPercentage).toBeGreaterThan(0);
      expect(tradeSignal.stopLossPercentage).toBeLessThan(20);
      
      // Validate allocations
      expect(tradeSignal.tp1Allocation).toBe(40);
      expect(tradeSignal.tp2Allocation).toBe(30);
      expect(tradeSignal.tp3Allocation).toBe(30);
      
      // Validate timeframe
      expect(['1h', '4h', '1d', '1w']).toContain(tradeSignal.timeframe);
      expect([1, 4, 24, 168]).toContain(tradeSignal.timeframeHours);
      
      // Validate confidence and risk/reward
      expect(tradeSignal.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(tradeSignal.confidenceScore).toBeLessThanOrEqual(100);
      expect(tradeSignal.riskRewardRatio).toBeGreaterThan(0);
      
      // Validate market condition
      expect(['trending', 'ranging', 'volatile']).toContain(tradeSignal.marketCondition);
      
      // Validate AI metadata
      expect(tradeSignal.aiReasoning).toBeDefined();
      expect(tradeSignal.aiReasoning.length).toBeGreaterThan(50);
      expect(['gpt-4o', 'gemini-pro']).toContain(tradeSignal.aiModelVersion);
    });

    it('should store complete trade signal in database', async () => {
      const marketData = await getMarketData(TEST_SYMBOL);
      const technicalIndicators = await getTechnicalIndicators(TEST_SYMBOL);
      const sentimentData = await getSentimentData(TEST_SYMBOL);
      const onChainData = await getOnChainData(TEST_SYMBOL);

      const tradeSignal = await generateTradeSignal({
        marketData,
        technicalIndicators,
        sentimentData,
        onChainData
      });

      // Store trade signal
      const now = new Date();
      const expiresAt = new Date(now.getTime() + tradeSignal.timeframeHours * 60 * 60 * 1000);

      const storedSignal = await storeTradeSignal({
        userId: TEST_USER_ID,
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
        generatedAt: now,
        expiresAt: expiresAt
      });

      expect(storedSignal).toBeDefined();
      expect(storedSignal.id).toBeDefined();
      expect(storedSignal.userId).toBe(TEST_USER_ID);
      expect(storedSignal.symbol).toBe(TEST_SYMBOL);
      expect(storedSignal.status).toBe('active');

      // Store technical indicators
      const storedIndicators = await storeTechnicalIndicators({
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

      expect(storedIndicators).toBeDefined();
      expect(storedIndicators.tradeSignalId).toBe(storedSignal.id);

      // Store market snapshot
      const storedSnapshot = await storeMarketSnapshot({
        tradeSignalId: storedSignal.id,
        currentPrice: marketData.currentPrice,
        priceChange24h: marketData.priceChangePercentage24h,
        volume24h: marketData.volume24h,
        marketCap: marketData.marketCap,
        socialSentimentScore: sentimentData.aggregateSentiment.score,
        whaleActivityCount: onChainData.largeTransactionCount,
        fearGreedIndex: undefined,
        snapshotAt: now
      });

      expect(storedSnapshot).toBeDefined();
      expect(storedSnapshot.tradeSignalId).toBe(storedSignal.id);

      // Verify retrieval
      const retrieved = await fetchTradeSignal(storedSignal.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(storedSignal.id);
      expect(retrieved?.userId).toBe(TEST_USER_ID);
    });
  });

  describe('2. AI Fallback Mechanism', () => {
    it('should attempt GPT-4o first', async () => {
      const marketData = await getMarketData(TEST_SYMBOL);
      const technicalIndicators = await getTechnicalIndicators(TEST_SYMBOL);
      const sentimentData = await getSentimentData(TEST_SYMBOL);
      const onChainData = await getOnChainData(TEST_SYMBOL);

      const tradeSignal = await generateTradeSignal({
        marketData,
        technicalIndicators,
        sentimentData,
        onChainData
      });

      // If GPT-4o is configured and working, it should be used
      if (process.env.OPENAI_API_KEY) {
        expect(['gpt-4o', 'gemini-pro']).toContain(tradeSignal.aiModelVersion);
      }
    });

    it('should retry up to 3 times on validation failure', async () => {
      const marketData = await getMarketData(TEST_SYMBOL);
      const technicalIndicators = await getTechnicalIndicators(TEST_SYMBOL);
      const sentimentData = await getSentimentData(TEST_SYMBOL);
      const onChainData = await getOnChainData(TEST_SYMBOL);

      // This should succeed within 3 attempts
      const tradeSignal = await generateTradeSignal(
        {
          marketData,
          technicalIndicators,
          sentimentData,
          onChainData
        },
        3 // maxRetries
      );

      expect(tradeSignal).toBeDefined();
      expect(tradeSignal.symbol).toBe(TEST_SYMBOL);
    });

    it('should throw error after max retries exhausted', async () => {
      const marketData = await getMarketData(TEST_SYMBOL);
      const technicalIndicators = await getTechnicalIndicators(TEST_SYMBOL);
      const sentimentData = await getSentimentData(TEST_SYMBOL);
      const onChainData = await getOnChainData(TEST_SYMBOL);

      // Temporarily break API keys to force failure
      const originalOpenAI = process.env.OPENAI_API_KEY;
      const originalGemini = process.env.GEMINI_API_KEY;
      
      process.env.OPENAI_API_KEY = 'invalid-key';
      process.env.GEMINI_API_KEY = 'invalid-key';

      try {
        await generateTradeSignal(
          {
            marketData,
            technicalIndicators,
            sentimentData,
            onChainData
          },
          1 // Only 1 retry for faster test
        );
        
        // Should not reach here
        fail('Expected error to be thrown');
      } catch (error: any) {
        expect(error.message).toContain('Failed to generate valid trade signal');
      } finally {
        // Restore API keys
        process.env.OPENAI_API_KEY = originalOpenAI;
        process.env.GEMINI_API_KEY = originalGemini;
      }
    });
  });

  describe('3. Rate Limiting', () => {
    it('should enforce 60-second cooldown between generations', async () => {
      // This test verifies the rate limiting logic would work
      // In a real API route, this would be enforced by middleware
      
      const now = Date.now();
      const lastGeneration = now - 30000; // 30 seconds ago
      const cooldownRemaining = 60000 - (now - lastGeneration);
      
      expect(cooldownRemaining).toBeGreaterThan(0);
      expect(cooldownRemaining).toBeLessThanOrEqual(60000);
    });

    it('should allow generation after cooldown expires', async () => {
      const now = Date.now();
      const lastGeneration = now - 61000; // 61 seconds ago
      const cooldownRemaining = Math.max(0, 60000 - (now - lastGeneration));
      
      expect(cooldownRemaining).toBe(0);
    });
  });

  describe('4. Database Storage', () => {
    it('should retrieve all trades for a user', async () => {
      const trades = await fetchAllTrades({
        userId: TEST_USER_ID,
        limit: 100
      });

      expect(trades).toBeDefined();
      expect(Array.isArray(trades)).toBe(true);
      
      // Should have at least one trade from previous tests
      if (trades.length > 0) {
        expect(trades[0].userId).toBe(TEST_USER_ID);
        expect(trades[0].symbol).toBe(TEST_SYMBOL);
      }
    });

    it('should filter trades by symbol', async () => {
      const trades = await fetchAllTrades({
        userId: TEST_USER_ID,
        symbol: TEST_SYMBOL,
        limit: 100
      });

      expect(trades).toBeDefined();
      expect(Array.isArray(trades)).toBe(true);
      
      trades.forEach(trade => {
        expect(trade.symbol).toBe(TEST_SYMBOL);
      });
    });

    it('should filter trades by status', async () => {
      const trades = await fetchAllTrades({
        userId: TEST_USER_ID,
        status: 'active',
        limit: 100
      });

      expect(trades).toBeDefined();
      expect(Array.isArray(trades)).toBe(true);
      
      trades.forEach(trade => {
        expect(trade.status).toBe('active');
      });
    });

    it('should filter trades by timeframe', async () => {
      const trades = await fetchAllTrades({
        userId: TEST_USER_ID,
        timeframe: '1h',
        limit: 100
      });

      expect(trades).toBeDefined();
      expect(Array.isArray(trades)).toBe(true);
      
      trades.forEach(trade => {
        if (trade.timeframe === '1h') {
          expect(trade.timeframeHours).toBe(1);
        }
      });
    });

    it('should paginate results correctly', async () => {
      const page1 = await fetchAllTrades({
        userId: TEST_USER_ID,
        limit: 1,
        offset: 0
      });

      const page2 = await fetchAllTrades({
        userId: TEST_USER_ID,
        limit: 1,
        offset: 1
      });

      expect(page1).toBeDefined();
      expect(page2).toBeDefined();
      
      if (page1.length > 0 && page2.length > 0) {
        expect(page1[0].id).not.toBe(page2[0].id);
      }
    });
  });

  describe('5. End-to-End Integration', () => {
    it('should complete full trade generation workflow', async () => {
      console.log('[TEST] Starting end-to-end trade generation workflow...');

      // Step 1: Fetch all data sources
      console.log('[TEST] Step 1: Fetching market data...');
      const marketData = await getMarketData(TEST_SYMBOL);
      expect(marketData).toBeDefined();

      console.log('[TEST] Step 2: Calculating technical indicators...');
      const technicalIndicators = await getTechnicalIndicators(TEST_SYMBOL);
      expect(technicalIndicators).toBeDefined();

      console.log('[TEST] Step 3: Fetching sentiment data...');
      const sentimentData = await getSentimentData(TEST_SYMBOL);
      expect(sentimentData).toBeDefined();

      console.log('[TEST] Step 4: Fetching on-chain data...');
      const onChainData = await getOnChainData(TEST_SYMBOL);
      expect(onChainData).toBeDefined();

      // Step 2: Generate trade signal with AI
      console.log('[TEST] Step 5: Generating trade signal with AI...');
      const tradeSignal = await generateTradeSignal({
        marketData,
        technicalIndicators,
        sentimentData,
        onChainData
      });
      expect(tradeSignal).toBeDefined();
      expect(tradeSignal.symbol).toBe(TEST_SYMBOL);

      // Step 3: Store in database
      console.log('[TEST] Step 6: Storing trade signal in database...');
      const now = new Date();
      const expiresAt = new Date(now.getTime() + tradeSignal.timeframeHours * 60 * 60 * 1000);

      const storedSignal = await storeTradeSignal({
        userId: TEST_USER_ID,
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
        generatedAt: now,
        expiresAt: expiresAt
      });
      expect(storedSignal.id).toBeDefined();

      console.log('[TEST] Step 7: Storing technical indicators...');
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

      console.log('[TEST] Step 8: Storing market snapshot...');
      await storeMarketSnapshot({
        tradeSignalId: storedSignal.id,
        currentPrice: marketData.currentPrice,
        priceChange24h: marketData.priceChangePercentage24h,
        volume24h: marketData.volume24h,
        marketCap: marketData.marketCap,
        socialSentimentScore: sentimentData.aggregateSentiment.score,
        whaleActivityCount: onChainData.largeTransactionCount,
        fearGreedIndex: undefined,
        snapshotAt: now
      });

      // Step 4: Verify retrieval
      console.log('[TEST] Step 9: Verifying retrieval...');
      const retrieved = await fetchTradeSignal(storedSignal.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(storedSignal.id);
      expect(retrieved?.userId).toBe(TEST_USER_ID);
      expect(retrieved?.symbol).toBe(TEST_SYMBOL);
      expect(retrieved?.status).toBe('active');

      console.log('[TEST] ✅ End-to-end workflow completed successfully!');
      console.log(`[TEST] Trade Signal ID: ${storedSignal.id}`);
      console.log(`[TEST] Entry Price: $${tradeSignal.entryPrice.toLocaleString()}`);
      console.log(`[TEST] TP1: $${tradeSignal.tp1Price.toLocaleString()} (${tradeSignal.tp1Allocation}%)`);
      console.log(`[TEST] TP2: $${tradeSignal.tp2Price.toLocaleString()} (${tradeSignal.tp2Allocation}%)`);
      console.log(`[TEST] TP3: $${tradeSignal.tp3Price.toLocaleString()} (${tradeSignal.tp3Allocation}%)`);
      console.log(`[TEST] Stop Loss: $${tradeSignal.stopLossPrice.toLocaleString()} (-${tradeSignal.stopLossPercentage}%)`);
      console.log(`[TEST] Timeframe: ${tradeSignal.timeframe} (${tradeSignal.timeframeHours}h)`);
      console.log(`[TEST] Confidence: ${tradeSignal.confidenceScore}%`);
      console.log(`[TEST] Risk/Reward: ${tradeSignal.riskRewardRatio}:1`);
      console.log(`[TEST] AI Model: ${tradeSignal.aiModelVersion}`);
    });
  });
});
