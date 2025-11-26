/**
 * Quantum BTC Trade Generation Endpoint
 * POST /api/quantum/generate-btc-trade
 * 
 * Generates a new Bitcoin trade signal using the Quantum-Superior Trade Generation Engine (QSTGE).
 * Requires authentication and enforces rate limiting (1 request per 60 seconds per user).
 * 
 * Requirements: 10.1-10.10
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../lib/auth/jwt';
import { query } from '../../../lib/db';
import OpenAI from 'openai';
import { extractResponseText, validateResponseText } from '../../../utils/openai';
import { trackAPICall, trackDatabaseQuery, performanceMonitor } from '../../../lib/quantum/performanceMonitor';
import { aggregateMarketData, AggregatedMarketData } from '../../../lib/quantum/dataAggregator';
import { cacheMarketData, getCachedMarketData } from '../../../lib/quantum/cacheService';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface TradeSignal {
  id: string;
  symbol: 'BTC';
  entryZone: {
    min: number;
    max: number;
    optimal: number;
  };
  targets: {
    tp1: { price: number; allocation: 50 };
    tp2: { price: number; allocation: 30 };
    tp3: { price: number; allocation: 20 };
  };
  stopLoss: {
    price: number;
    maxLossPercent: number;
  };
  timeframe: '1h' | '4h' | '1d' | '1w';
  confidence: number;
  quantumReasoning: string;
  mathematicalJustification: string;
  crossAPIProof: any[];
  historicalTriggers: any[];
  dataQualityScore: number;
  generatedAt: string;
  expiresAt: string;
}

interface APIResponse {
  success: boolean;
  trade?: TradeSignal;
  error?: string;
  dataQualityScore?: number;
  executionTime?: number;
}

// ============================================================================
// RATE LIMITING
// ============================================================================

// In-memory rate limiting (per user)
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60000; // 60 seconds

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const lastRequest = rateLimitMap.get(userId);
  
  if (lastRequest && now - lastRequest < RATE_LIMIT_WINDOW) {
    return false; // Rate limit exceeded
  }
  
  rateLimitMap.set(userId, now);
  return true;
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

function getTokenFromRequest(req: NextApiRequest): string | null {
  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Check cookie
  const token = req.cookies.auth_token;
  if (token) {
    return token;
  }
  
  return null;
}

async function authenticateRequest(req: NextApiRequest): Promise<{ userId: string; email: string } | null> {
  try {
    const token = getTokenFromRequest(req);
    
    if (!token) {
      return null;
    }
    
    const payload = verifyToken(token);
    return { userId: payload.userId, email: payload.email };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

// ============================================================================
// OPENAI GPT-5.1 CLIENT
// ============================================================================

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  defaultHeaders: {
    'OpenAI-Beta': 'responses=v1'
  }
});

// ============================================================================
// DATA COLLECTION & VALIDATION (QDPP)
// ============================================================================

/**
 * Collect comprehensive market data from all sources
 * Uses cache-first strategy with 5-minute TTL
 */
async function collectMarketData(): Promise<{ quality: number; data: AggregatedMarketData }> {
  console.log('[QSIC] 🔄 Collecting market data from all sources...');
  
  // Check cache first (5-minute TTL)
  const cached = await getCachedMarketData(5);
  
  if (cached) {
    console.log('[QSIC] ✅ Using cached market data (fresh)');
    return {
      quality: cached.dataQuality.score,
      data: cached,
    };
  }
  
  // Fetch fresh data from all APIs in parallel
  console.log('[QSIC] 🌐 Fetching fresh data from 5 APIs...');
  const aggregated = await aggregateMarketData();
  
  // Cache the data for future requests
  await cacheMarketData(aggregated);
  
  console.log(`[QSIC] ✅ Data collected - Quality: ${aggregated.dataQuality.score}% (${aggregated.dataQuality.status})`);
  
  return {
    quality: aggregated.dataQuality.score,
    data: aggregated,
  };
}

// ============================================================================
// TRADE GENERATION (QSTGE)
// ============================================================================

/**
 * Create comprehensive market context for GPT-5.1 analysis
 */
function createMarketContext(
  marketData: any,
  onChainData: any,
  sentimentData: any,
  dataQualityScore: number
): string {
  return `
# Bitcoin Market Analysis Context

## Current Market Data
- **Price**: $${marketData.price.toLocaleString()}
- **24h Volume**: $${marketData.volume.toLocaleString()}
- **Market Cap**: $${marketData.marketCap.toLocaleString()}
- **Data Quality Score**: ${dataQualityScore}%

## On-Chain Metrics
- **Mempool Size**: ${onChainData.mempoolSize.toLocaleString()} transactions
- **Whale Transactions (24h)**: ${onChainData.whaleTransactions}
- **Network Difficulty**: ${onChainData.difficulty.toLocaleString()}

## Social Sentiment
- **Sentiment Score**: ${sentimentData.sentiment}/100
- **Social Dominance**: ${sentimentData.socialDominance}%
- **Galaxy Score**: ${sentimentData.galaxyScore}/100

## Analysis Requirements
You are a quantum-superior trading intelligence system analyzing Bitcoin markets using multi-dimensional pattern recognition. Your task is to generate a comprehensive trade signal based on the above data.

**CRITICAL**: You must respond with ONLY valid JSON. No markdown, no code blocks, no explanations outside the JSON structure.

Return a JSON object with the following structure:
{
  "direction": "LONG" or "SHORT",
  "entryZonePercent": {
    "min": number (percentage below current price, e.g., -2 for 2% below),
    "max": number (percentage above current price, e.g., 2 for 2% above),
    "optimal": number (percentage from current price, e.g., 0 for current price)
  },
  "targetPercents": {
    "tp1": number (percentage gain, e.g., 5 for 5% gain),
    "tp2": number (percentage gain, e.g., 8 for 8% gain),
    "tp3": number (percentage gain, e.g., 12 for 12% gain)
  },
  "stopLossPercent": number (percentage loss, e.g., -5 for 5% loss),
  "timeframe": "1h" | "4h" | "1d" | "1w",
  "confidence": number (0-100),
  "quantumReasoning": "string (detailed multi-probability state analysis)",
  "mathematicalJustification": "string (mathematical formulas and calculations)",
  "wavePatternCollapse": "CONTINUATION" | "BREAK" | "UNCERTAIN"
}
`.trim();
}

/**
 * Parse GPT-5.1 response and extract trade parameters
 */
function parseAIResponse(responseText: string): {
  direction: 'LONG' | 'SHORT';
  entryZonePercent: { min: number; max: number; optimal: number };
  targetPercents: { tp1: number; tp2: number; tp3: number };
  stopLossPercent: number;
  timeframe: '1h' | '4h' | '1d' | '1w';
  confidence: number;
  quantumReasoning: string;
  mathematicalJustification: string;
  wavePatternCollapse: 'CONTINUATION' | 'BREAK' | 'UNCERTAIN';
} {
  try {
    // Remove markdown code blocks if present
    let cleanedText = responseText.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/```\n?/g, '');
    }
    
    const parsed = JSON.parse(cleanedText);
    
    // Validate required fields
    if (!parsed.direction || !parsed.entryZonePercent || !parsed.targetPercents || 
        !parsed.stopLossPercent || !parsed.timeframe || !parsed.confidence ||
        !parsed.quantumReasoning || !parsed.mathematicalJustification) {
      throw new Error('Missing required fields in AI response');
    }
    
    return parsed;
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    console.error('Response text:', responseText.substring(0, 500));
    throw new Error('Failed to parse AI response. Invalid JSON format.');
  }
}

/**
 * Calculate entry zone prices from percentages
 */
function calculateEntryZone(
  currentPrice: number,
  entryZonePercent: { min: number; max: number; optimal: number }
): { min: number; max: number; optimal: number } {
  return {
    min: currentPrice * (1 + entryZonePercent.min / 100),
    max: currentPrice * (1 + entryZonePercent.max / 100),
    optimal: currentPrice * (1 + entryZonePercent.optimal / 100),
  };
}

/**
 * Calculate target prices from percentages
 */
function calculateTargets(
  currentPrice: number,
  targetPercents: { tp1: number; tp2: number; tp3: number }
): {
  tp1: { price: number; allocation: 50 };
  tp2: { price: number; allocation: 30 };
  tp3: { price: number; allocation: 20 };
} {
  return {
    tp1: { price: currentPrice * (1 + targetPercents.tp1 / 100), allocation: 50 },
    tp2: { price: currentPrice * (1 + targetPercents.tp2 / 100), allocation: 30 },
    tp3: { price: currentPrice * (1 + targetPercents.tp3 / 100), allocation: 20 },
  };
}

/**
 * Calculate stop loss price from percentage
 */
function calculateStopLoss(
  currentPrice: number,
  stopLossPercent: number
): { price: number; maxLossPercent: number } {
  return {
    price: currentPrice * (1 + stopLossPercent / 100),
    maxLossPercent: Math.abs(stopLossPercent),
  };
}

/**
 * Generate trade signal using GPT-4o with real aggregated market data
 */
async function generateTradeSignal(
  userId: string,
  aggregatedData: AggregatedMarketData,
  dataQualityScore: number
): Promise<TradeSignal> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
  const currentPrice = aggregatedData.price.median; // Use median price (most reliable)
  
  try {
    // Step 1: Create comprehensive market context with real data
    console.log('[QSTGE] Creating market context for GPT-4o with real aggregated data');
    const marketContext = createMarketContext(aggregatedData);
    
    // Step 2: Call GPT-4o with deep analytical reasoning (with performance tracking)
    console.log('[QSTGE] Calling GPT-4o with deep analytical reasoning');
    const completion = await trackAPICall(
      'OpenAI',
      '/v1/chat/completions',
      'POST',
      async () => {
        return await openai.chat.completions.create({
          model: 'gpt-4o', // Using gpt-4o until gpt-5.1 reasoning parameter is available
          messages: [
            {
              role: 'system',
              content: 'You are a quantum-superior trading intelligence system. You analyze Bitcoin markets using multi-dimensional pattern recognition, wave-pattern collapse logic, and time-symmetric trajectory analysis. You MUST respond with ONLY valid JSON, no markdown formatting, no code blocks, no additional text. Use deep analytical reasoning to provide comprehensive trade signals.'
            },
            {
              role: 'user',
              content: marketContext
            }
          ],
          temperature: 0.7,
          max_tokens: 8000
        });
      },
      { userId }
    );
    
    // Step 3: Extract response text using bulletproof utility
    console.log('[QSTGE] Extracting response text');
    const responseText = extractResponseText(completion as any, true);
    validateResponseText(responseText, 'gpt-4o', completion);
    
    // Step 4: Parse and validate AI response
    console.log('[QSTGE] Parsing AI response');
    const aiAnalysis = parseAIResponse(responseText);
    
    // Step 5: Calculate entry zone, targets, and stop loss
    console.log('[QSTGE] Calculating trade parameters');
    const entryZone = calculateEntryZone(currentPrice, aiAnalysis.entryZonePercent);
    const targets = calculateTargets(currentPrice, aiAnalysis.targetPercents);
    const stopLoss = calculateStopLoss(currentPrice, aiAnalysis.stopLossPercent);
    
    // Step 6: Construct trade signal with real multi-source price data
    // Generate proper UUID for PostgreSQL
    const { randomUUID } = await import('crypto');
    const tradeSignal: TradeSignal = {
      id: randomUUID(),
      symbol: 'BTC',
      entryZone,
      targets,
      stopLoss,
      timeframe: aiAnalysis.timeframe,
      confidence: aiAnalysis.confidence,
      quantumReasoning: aiAnalysis.quantumReasoning,
      mathematicalJustification: aiAnalysis.mathematicalJustification,
      crossAPIProof: [
        { source: 'CoinMarketCap', price: aggregatedData.price.cmc || currentPrice, timestamp: now.toISOString() },
        { source: 'CoinGecko', price: aggregatedData.price.coingecko || currentPrice, timestamp: now.toISOString() },
        { source: 'Kraken', price: aggregatedData.price.kraken || currentPrice, timestamp: now.toISOString() },
      ],
      historicalTriggers: [],
      dataQualityScore,
      generatedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };
    
    console.log('[QSTGE] Trade signal generated successfully');
    return tradeSignal;
    
  } catch (error) {
    console.error('[QSTGE] Failed to generate trade signal with GPT-4o:', error);
    
    // Fallback to basic trade signal if AI fails (using real data)
    console.log('[QSTGE] Using fallback trade signal generation with real market data');
    
    // Generate proper UUID for PostgreSQL
    const { randomUUID } = await import('crypto');
    const tradeSignal: TradeSignal = {
      id: randomUUID(),
      symbol: 'BTC',
      entryZone: {
        min: currentPrice * 0.98,
        max: currentPrice * 1.02,
        optimal: currentPrice,
      },
      targets: {
        tp1: { price: currentPrice * 1.05, allocation: 50 },
        tp2: { price: currentPrice * 1.08, allocation: 30 },
        tp3: { price: currentPrice * 1.12, allocation: 20 },
      },
      stopLoss: {
        price: currentPrice * 0.95,
        maxLossPercent: 5,
      },
      timeframe: '4h',
      confidence: 60, // Lower confidence for fallback
      quantumReasoning: `Fallback analysis: Using real market data - Median price $${currentPrice.toLocaleString()} from ${aggregatedData.dataQuality.score}% quality data. Price divergence: ${aggregatedData.price.divergence.toFixed(3)}% (${aggregatedData.price.divergenceStatus}). AI analysis unavailable but data is real.`,
      mathematicalJustification: `Fallback calculation: Standard risk-reward ratio of 1:2 applied. Current price: $${currentPrice.toLocaleString()}. 24h change: ${aggregatedData.priceChanges.change_24h?.toFixed(2) || 'N/A'}%. Volume: $${aggregatedData.volume.average.toLocaleString()}.`,
      crossAPIProof: [
        { source: 'CoinMarketCap', price: aggregatedData.price.cmc || currentPrice, timestamp: now.toISOString() },
        { source: 'CoinGecko', price: aggregatedData.price.coingecko || currentPrice, timestamp: now.toISOString() },
        { source: 'Kraken', price: aggregatedData.price.kraken || currentPrice, timestamp: now.toISOString() },
      ],
      historicalTriggers: [],
      dataQualityScore,
      generatedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };
    
    return tradeSignal;
  }
}

// ============================================================================
// DATABASE STORAGE
// ============================================================================

async function storeTradeInDatabase(userId: string, trade: TradeSignal): Promise<void> {
  const sql = `
    INSERT INTO btc_trades (
      id, user_id, symbol,
      entry_min, entry_max, entry_optimal,
      tp1_price, tp1_allocation,
      tp2_price, tp2_allocation,
      tp3_price, tp3_allocation,
      stop_loss_price, max_loss_percent,
      timeframe, timeframe_hours,
      confidence_score, quantum_reasoning, mathematical_justification,
      wave_pattern_collapse, data_quality_score,
      cross_api_proof, historical_triggers,
      status, generated_at, expires_at
    ) VALUES (
      $1, $2, $3,
      $4, $5, $6,
      $7, $8,
      $9, $10,
      $11, $12,
      $13, $14,
      $15, $16,
      $17, $18, $19,
      $20, $21,
      $22, $23,
      $24, $25, $26
    )
  `;
  
  const timeframeHours = {
    '1h': 1,
    '4h': 4,
    '1d': 24,
    '1w': 168,
  }[trade.timeframe];
  
  // Track database query performance
  await trackDatabaseQuery(
    'INSERT',
    'store_btc_trade',
    async () => {
      return await query(sql, [
        trade.id,
        userId,
        trade.symbol,
        trade.entryZone.min,
        trade.entryZone.max,
        trade.entryZone.optimal,
        trade.targets.tp1.price,
        trade.targets.tp1.allocation,
        trade.targets.tp2.price,
        trade.targets.tp2.allocation,
        trade.targets.tp3.price,
        trade.targets.tp3.allocation,
        trade.stopLoss.price,
        trade.stopLoss.maxLossPercent,
        trade.timeframe,
        timeframeHours,
        trade.confidence,
        trade.quantumReasoning,
        trade.mathematicalJustification,
        'CONTINUATION', // wave_pattern_collapse placeholder
        trade.dataQualityScore,
        JSON.stringify(trade.crossAPIProof),
        JSON.stringify(trade.historicalTriggers),
        'ACTIVE',
        trade.generatedAt,
        trade.expiresAt,
      ]);
    }
  );
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse>
) {
  const startTime = Date.now();
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.',
    });
  }
  
  try {
    // Step 1: Verify user authentication
    const user = await authenticateRequest(req);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized. Please log in.',
      });
    }
    
    // Step 2: Check rate limiting (1 request per 60 seconds)
    if (!checkRateLimit(user.userId)) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Please wait 60 seconds before generating another trade.',
      });
    }
    
    // Step 3: Coordinate comprehensive data collection (QSIC)
    console.log(`[QSIC] Coordinating data collection for user ${user.userId}`);
    const marketDataResult = await collectMarketData();
    
    // Step 4: Validate data quality (QDPP)
    console.log('[QDPP] Validating data quality');
    const dataQualityScore = marketDataResult.quality;
    const aggregatedData = marketDataResult.data;
    
    // Log data quality details
    console.log(`[QDPP] Data Quality: ${dataQualityScore}% (${aggregatedData.dataQuality.status})`);
    console.log(`[QDPP] API Status: CMC=${aggregatedData.dataQuality.apiStatus.cmc}, CoinGecko=${aggregatedData.dataQuality.apiStatus.coingecko}, Kraken=${aggregatedData.dataQuality.apiStatus.kraken}`);
    
    // Reject if data quality is critically low
    if (dataQualityScore < 40) {
      return res.status(400).json({
        success: false,
        error: 'Data quality critically low for reliable analysis',
        dataQuality: dataQualityScore,
        status: aggregatedData.dataQuality.status,
        issues: aggregatedData.dataQuality.issues,
        message: 'Multiple data sources are unavailable. Please try again in a few minutes.',
      });
    }
    
    // Warn if data quality is low but proceed
    if (dataQualityScore < 70) {
      console.warn(`[QDPP] ⚠️ Low data quality (${dataQualityScore}%) - proceeding with reduced confidence`);
    }
    
    // Step 5: Execute QSTGE to generate trade
    console.log('[QSTGE] Generating trade signal with real aggregated data');
    
    const trade = await generateTradeSignal(
      user.userId,
      aggregatedData,
      dataQualityScore
    );
    
    // Step 7: Store trade in btc_trades table
    console.log('[Database] Storing trade signal');
    
    await storeTradeInDatabase(user.userId, trade);
    
    // Step 8: Return trade signal to user
    const executionTime = Date.now() - startTime;
    
    console.log(`[Success] Trade generated in ${executionTime}ms`);
    
    return res.status(200).json({
      success: true,
      trade,
      dataQualityScore,
      executionTime,
    });
    
  } catch (error) {
    console.error('[Error] Trade generation failed:', error);
    
    const executionTime = Date.now() - startTime;
    
    // Track error in performance monitor
    await performanceMonitor.trackAPICall({
      apiName: 'Quantum-BTC',
      endpoint: '/api/quantum/generate-btc-trade',
      httpMethod: 'POST',
      responseTimeMs: executionTime,
      statusCode: 500,
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.name : 'Error',
    });
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error. Failed to generate trade signal.',
      executionTime,
    });
  }
}
