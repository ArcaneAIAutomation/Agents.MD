/**
 * Quantum BTC Hourly Validation Endpoint
 * POST /api/quantum/validate-btc-trades
 * 
 * Validates all active Bitcoin trades against live market data.
 * Runs hourly via Vercel cron job.
 * Requires cron secret for security.
 * 
 * Requirements: 11.1-11.10
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { query, queryMany } from '../../../lib/db';
import { trackAPICall, trackDatabaseQuery, performanceMonitor } from '../../../lib/quantum/performanceMonitor';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ActiveTrade {
  id: string;
  user_id: string;
  symbol: string;
  entry_min: number;
  entry_max: number;
  entry_optimal: number;
  tp1_price: number;
  tp2_price: number;
  tp3_price: number;
  stop_loss_price: number;
  timeframe: string;
  confidence_score: number;
  data_quality_score: number;
  generated_at: string;
  expires_at: string;
}

interface ValidationSummary {
  success: boolean;
  summary: {
    tradesValidated: number;
    tradesHit: number;
    tradesNotHit: number;
    tradesInvalidated: number;
    tradesExpired: number;
    anomaliesDetected: number;
    executionTime: number;
  };
  errors?: string[];
}

interface HourlySnapshot {
  trade_id: string;
  price: number;
  volume_24h: number;
  market_cap: number;
  mempool_size: number;
  whale_transactions: number;
  sentiment_score: number;
  deviation_from_prediction: number;
  phase_shift_detected: boolean;
  data_quality_score: number;
  snapshot_at: string;
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

function verifyCronSecret(req: NextApiRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    console.error('[Security] CRON_SECRET not configured');
    return false;
  }
  
  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }
  
  // Check body
  const bodySecret = req.body?.cronSecret;
  if (bodySecret && bodySecret === cronSecret) {
    return true;
  }
  
  return false;
}

// ============================================================================
// DATA COLLECTION
// ============================================================================

/**
 * Fetch current market data from multiple sources (CMC, CoinGecko, Kraken)
 * Implements multi-API triangulation as per Requirements 4.1
 */
async function fetchCurrentMarketData(): Promise<{
  price: number;
  volume24h: number;
  marketCap: number;
  sources: string[];
  dataQuality: number;
}> {
  const prices: Array<{ source: string; price: number; volume: number }> = [];
  const errors: string[] = [];
  
  // 1. Try CoinMarketCap (Primary)
  try {
    const cmcKey = process.env.COINMARKETCAP_API_KEY;
    if (cmcKey) {
      const response = await fetch(
        'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=BTC',
        {
          headers: {
            'X-CMC_PRO_API_KEY': cmcKey,
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(5000),
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const btcData = data.data.BTC;
        prices.push({
          source: 'CoinMarketCap',
          price: btcData.quote.USD.price,
          volume: btcData.quote.USD.volume_24h,
        });
      }
    }
  } catch (error: any) {
    errors.push(`CMC: ${error.message}`);
    console.warn('[HQVE] CoinMarketCap fetch failed:', error.message);
  }
  
  // 2. Try CoinGecko (Secondary)
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_vol=true&include_market_cap=true',
      {
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      prices.push({
        source: 'CoinGecko',
        price: data.bitcoin.usd,
        volume: data.bitcoin.usd_24h_vol,
      });
    }
  } catch (error: any) {
    errors.push(`CoinGecko: ${error.message}`);
    console.warn('[HQVE] CoinGecko fetch failed:', error.message);
  }
  
  // 3. Try Kraken (Tertiary)
  try {
    const response = await fetch(
      'https://api.kraken.com/0/public/Ticker?pair=XXBTZUSD',
      {
        signal: AbortSignal.timeout(5000),
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.result && data.result.XXBTZUSD) {
        const ticker = data.result.XXBTZUSD;
        prices.push({
          source: 'Kraken',
          price: parseFloat(ticker.c[0]),
          volume: parseFloat(ticker.v[1]) * parseFloat(ticker.c[0]),
        });
      }
    }
  } catch (error: any) {
    errors.push(`Kraken: ${error.message}`);
    console.warn('[HQVE] Kraken fetch failed:', error.message);
  }
  
  // Calculate median price (triangulation)
  if (prices.length === 0) {
    throw new Error(`All market data sources failed: ${errors.join(', ')}`);
  }
  
  const sortedPrices = prices.map(p => p.price).sort((a, b) => a - b);
  const medianPrice = prices.length === 1 
    ? sortedPrices[0]
    : prices.length === 2
    ? (sortedPrices[0] + sortedPrices[1]) / 2
    : sortedPrices[1]; // Middle value for 3 sources
  
  const avgVolume = prices.reduce((sum, p) => sum + p.volume, 0) / prices.length;
  
  // Calculate data quality based on source agreement
  let dataQuality = 100;
  if (prices.length < 3) {
    dataQuality = 70 + (prices.length - 1) * 15; // 70% for 1 source, 85% for 2 sources
  } else {
    // Check price divergence
    const maxPrice = Math.max(...sortedPrices);
    const minPrice = Math.min(...sortedPrices);
    const divergence = ((maxPrice - minPrice) / minPrice) * 100;
    
    if (divergence > 1) {
      dataQuality = Math.max(70, 100 - divergence * 10);
    }
  }
  
  console.log(`[HQVE] Market data: ${prices.length} sources, median price: $${medianPrice.toFixed(2)}, quality: ${dataQuality}%`);
  
  return {
    price: medianPrice,
    volume24h: avgVolume,
    marketCap: 0, // Not critical for validation
    sources: prices.map(p => p.source),
    dataQuality,
  };
}

/**
 * Fetch current on-chain data from Blockchain.com
 * Implements Requirements 4.2
 */
async function fetchCurrentOnChainData(): Promise<{
  mempoolSize: number;
  whaleTransactions: number;
  difficulty: number;
  hashRate: number;
}> {
  try {
    // Fetch blockchain stats
    const response = await fetch('https://blockchain.info/stats', {
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    });
    
    if (!response.ok) {
      throw new Error(`Blockchain.com API error: ${response.status}`);
    }
    
    const stats = await response.json();
    
    // Fetch mempool info
    let mempoolSize = 0;
    try {
      const mempoolResponse = await fetch('https://blockchain.info/q/mempool', {
        signal: AbortSignal.timeout(3000),
      });
      
      if (mempoolResponse.ok) {
        const mempoolData = await mempoolResponse.json();
        mempoolSize = mempoolData.size || 0;
      }
    } catch (error) {
      console.warn('[HQVE] Mempool fetch failed, using 0');
    }
    
    // Fetch unconfirmed transactions to detect whales
    let whaleCount = 0;
    try {
      const txResponse = await fetch(
        'https://blockchain.info/unconfirmed-transactions?format=json',
        {
          signal: AbortSignal.timeout(3000),
        }
      );
      
      if (txResponse.ok) {
        const txData = await txResponse.json();
        const whaleThreshold = 50 * 100000000; // 50 BTC in satoshis
        
        whaleCount = (txData.txs || []).filter((tx: any) => {
          const amount = Math.abs(tx.result || 0);
          return amount >= whaleThreshold;
        }).length;
      }
    } catch (error) {
      console.warn('[HQVE] Whale transaction fetch failed, using 0');
    }
    
    console.log(`[HQVE] On-chain data: mempool=${mempoolSize}, whales=${whaleCount}, difficulty=${stats.difficulty}`);
    
    return {
      mempoolSize: mempoolSize,
      whaleTransactions: whaleCount,
      difficulty: stats.difficulty || 0,
      hashRate: stats.hash_rate || 0,
    };
  } catch (error: any) {
    console.error('[HQVE] Blockchain.com fetch failed:', error.message);
    
    // Return minimal data to allow validation to continue
    return {
      mempoolSize: 0,
      whaleTransactions: 0,
      difficulty: 0,
      hashRate: 0,
    };
  }
}

/**
 * Fetch current sentiment data from LunarCrush
 * Implements Requirements 4.3
 */
async function fetchCurrentSentimentData(): Promise<{
  sentimentScore: number;
  socialScore: number;
  galaxyScore: number;
}> {
  const apiKey = process.env.LUNARCRUSH_API_KEY;
  
  if (!apiKey) {
    console.warn('[HQVE] LunarCrush API key not configured');
    return {
      sentimentScore: 50,
      socialScore: 50,
      galaxyScore: 50,
    };
  }
  
  try {
    const response = await fetch(
      'https://lunarcrush.com/api4/public/coins/BTC/v1',
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      }
    );
    
    if (!response.ok) {
      throw new Error(`LunarCrush API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    const socialScore = data.social_score || 50;
    const galaxyScore = data.galaxy_score || 50;
    const sentimentScore = (socialScore + galaxyScore) / 2;
    
    console.log(`[HQVE] Sentiment data: social=${socialScore}, galaxy=${galaxyScore}, sentiment=${sentimentScore}`);
    
    return {
      sentimentScore,
      socialScore,
      galaxyScore,
    };
  } catch (error: any) {
    console.error('[HQVE] LunarCrush fetch failed:', error.message);
    
    // Return neutral sentiment to allow validation to continue
    return {
      sentimentScore: 50,
      socialScore: 50,
      galaxyScore: 50,
    };
  }
}

// ============================================================================
// VALIDATION LOGIC (HQVE)
// ============================================================================

function calculateDeviation(predicted: number, actual: number): number {
  return Math.abs((actual - predicted) / predicted) * 100;
}

function detectPhaseShift(
  currentPrice: number,
  trade: ActiveTrade,
  previousSnapshots: any[]
): boolean {
  // TODO: Implement phase-shift detection algorithm
  // - Analyze price movement patterns
  // - Detect market structure changes
  
  return false;
}

/**
 * Validate quantum trajectory vs actual price path
 * Implements Requirements 4.5
 */
async function validateQuantumTrajectory(
  trade: ActiveTrade,
  currentPrice: number
): Promise<{
  trajectoryValid: boolean;
  deviation: number;
  anomalies: string[];
}> {
  const anomalies: string[] = [];
  
  // Calculate expected trajectory based on entry and targets
  const entryToTP1 = trade.tp1_price - trade.entry_optimal;
  const entryToCurrent = currentPrice - trade.entry_optimal;
  
  // Check if price is moving in expected direction
  const expectedDirection = entryToTP1 > 0 ? 'UP' : 'DOWN';
  const actualDirection = entryToCurrent > 0 ? 'UP' : 'DOWN';
  
  if (expectedDirection !== actualDirection && Math.abs(entryToCurrent) > trade.entry_optimal * 0.02) {
    anomalies.push('Price moving opposite to predicted direction');
  }
  
  // Calculate deviation from optimal trajectory
  const deviation = calculateDeviation(trade.entry_optimal, currentPrice);
  
  // Check if deviation is excessive (>10%)
  if (deviation > 10) {
    anomalies.push(`Excessive deviation from prediction: ${deviation.toFixed(2)}%`);
  }
  
  // Trajectory is valid if price is within reasonable bounds
  const trajectoryValid = 
    currentPrice >= trade.stop_loss_price && 
    currentPrice <= trade.tp3_price * 1.1 && // Allow 10% overshoot
    anomalies.length === 0;
  
  return {
    trajectoryValid,
    deviation,
    anomalies,
  };
}

/**
 * Enhanced trade validation with real data
 * Implements Requirements 4.4, 4.5
 */
async function validateTrade(
  trade: ActiveTrade,
  marketData: any,
  onChainData: any,
  sentimentData: any
): Promise<{
  status: 'HIT' | 'NOT_HIT' | 'INVALIDATED' | 'EXPIRED';
  snapshot: HourlySnapshot;
  anomalies: string[];
}> {
  const currentPrice = marketData.price;
  const now = new Date();
  const expiresAt = new Date(trade.expires_at);
  const anomalies: string[] = [];
  
  // Check if trade expired
  if (now > expiresAt) {
    return {
      status: 'EXPIRED',
      snapshot: createSnapshot(trade, marketData, onChainData, sentimentData, 0, false, marketData.dataQuality || 85),
      anomalies: [],
    };
  }
  
  // Check if stop loss hit
  if (currentPrice <= trade.stop_loss_price) {
    return {
      status: 'INVALIDATED',
      snapshot: createSnapshot(trade, marketData, onChainData, sentimentData, 0, false, marketData.dataQuality || 85),
      anomalies: ['Stop loss triggered'],
    };
  }
  
  // Validate quantum trajectory
  const trajectoryValidation = await validateQuantumTrajectory(trade, currentPrice);
  anomalies.push(...trajectoryValidation.anomalies);
  
  // Check if any target hit
  const tp1Hit = currentPrice >= trade.tp1_price;
  const tp2Hit = currentPrice >= trade.tp2_price;
  const tp3Hit = currentPrice >= trade.tp3_price;
  
  // Fetch previous snapshots for phase-shift detection
  const previousSnapshots = await fetchPreviousSnapshots(trade.id, 24); // Last 24 hours
  const phaseShift = detectPhaseShift(currentPrice, trade, previousSnapshots);
  
  if (phaseShift) {
    anomalies.push('Phase shift detected - market structure changed');
  }
  
  // Check for data quality anomalies
  if (marketData.dataQuality < 70) {
    anomalies.push(`Low data quality: ${marketData.dataQuality}%`);
  }
  
  if (onChainData.mempoolSize === 0) {
    anomalies.push('Mempool size is 0 - data may be unreliable');
  }
  
  if (onChainData.whaleTransactions < 2) {
    anomalies.push(`Low whale activity: ${onChainData.whaleTransactions} transactions`);
  }
  
  const deviation = trajectoryValidation.deviation;
  
  if (tp1Hit || tp2Hit || tp3Hit) {
    return {
      status: 'HIT',
      snapshot: createSnapshot(trade, marketData, onChainData, sentimentData, deviation, phaseShift, marketData.dataQuality || 85),
      anomalies,
    };
  }
  
  // Trade still active
  return {
    status: 'NOT_HIT',
    snapshot: createSnapshot(trade, marketData, onChainData, sentimentData, deviation, phaseShift, marketData.dataQuality || 85),
    anomalies,
  };
}

/**
 * Fetch previous hourly snapshots for phase-shift detection
 */
async function fetchPreviousSnapshots(tradeId: string, hours: number): Promise<any[]> {
  try {
    const sql = `
      SELECT 
        price, volume_24h, mempool_size, whale_transactions,
        sentiment_score, deviation_from_prediction, snapshot_at
      FROM btc_hourly_snapshots
      WHERE trade_id = $1
        AND snapshot_at >= NOW() - INTERVAL '${hours} hours'
      ORDER BY snapshot_at DESC
      LIMIT ${hours}
    `;
    
    return await queryMany(sql, [tradeId]);
  } catch (error) {
    console.error('[HQVE] Failed to fetch previous snapshots:', error);
    return [];
  }
}

function createSnapshot(
  trade: ActiveTrade,
  marketData: any,
  onChainData: any,
  sentimentData: any,
  deviation: number,
  phaseShift: boolean,
  dataQuality: number
): HourlySnapshot {
  return {
    trade_id: trade.id,
    price: marketData.price,
    volume_24h: marketData.volume24h || 0,
    market_cap: marketData.marketCap || 0,
    mempool_size: onChainData.mempoolSize || 0,
    whale_transactions: onChainData.whaleTransactions || 0,
    sentiment_score: sentimentData.sentimentScore || 50,
    deviation_from_prediction: deviation,
    phase_shift_detected: phaseShift,
    data_quality_score: dataQuality,
    snapshot_at: new Date().toISOString(),
  };
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

async function fetchActiveTrades(): Promise<ActiveTrade[]> {
  const sql = `
    SELECT 
      id, user_id, symbol,
      entry_min, entry_max, entry_optimal,
      tp1_price, tp2_price, tp3_price,
      stop_loss_price, timeframe,
      confidence_score, data_quality_score,
      generated_at, expires_at
    FROM btc_trades
    WHERE status = 'ACTIVE'
      AND expires_at > NOW()
    ORDER BY generated_at DESC
  `;
  
  return await queryMany<ActiveTrade>(sql);
}

async function updateTradeStatus(
  tradeId: string,
  status: string
): Promise<void> {
  const sql = `
    UPDATE btc_trades
    SET status = $1, last_validated_at = NOW(), updated_at = NOW()
    WHERE id = $2
  `;
  
  await query(sql, [status, tradeId]);
}

async function storeHourlySnapshot(snapshot: HourlySnapshot): Promise<void> {
  const sql = `
    INSERT INTO btc_hourly_snapshots (
      trade_id, price, volume_24h, market_cap,
      mempool_size, whale_transactions, sentiment_score,
      deviation_from_prediction, phase_shift_detected,
      data_quality_score, snapshot_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
    )
  `;
  
  await query(sql, [
    snapshot.trade_id,
    snapshot.price,
    snapshot.volume_24h,
    snapshot.market_cap,
    snapshot.mempool_size,
    snapshot.whale_transactions,
    snapshot.sentiment_score,
    snapshot.deviation_from_prediction,
    snapshot.phase_shift_detected,
    snapshot.data_quality_score,
    snapshot.snapshot_at,
  ]);
}

async function logAnomaly(
  tradeId: string,
  anomalyType: string,
  description: string
): Promise<void> {
  const sql = `
    INSERT INTO quantum_anomaly_logs (
      anomaly_type, severity, description,
      trade_id, detected_at
    ) VALUES (
      $1, $2, $3, $4, NOW()
    )
  `;
  
  await query(sql, [anomalyType, 'WARNING', description, tradeId]);
}

async function updatePerformanceMetrics(summary: any): Promise<void> {
  // TODO: Implement performance metrics update
  // - Update prediction_accuracy_database table
  // - Calculate overall accuracy rate
  // - Track timeframe performance
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ValidationSummary>
) {
  const startTime = Date.now();
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      summary: {
        tradesValidated: 0,
        tradesHit: 0,
        tradesNotHit: 0,
        tradesInvalidated: 0,
        tradesExpired: 0,
        anomaliesDetected: 0,
        executionTime: 0,
      },
      errors: ['Method not allowed. Use POST.'],
    });
  }
  
  try {
    // Step 1: Verify cron secret
    if (!verifyCronSecret(req)) {
      console.error('[Security] Invalid cron secret');
      return res.status(401).json({
        success: false,
        summary: {
          tradesValidated: 0,
          tradesHit: 0,
          tradesNotHit: 0,
          tradesInvalidated: 0,
          tradesExpired: 0,
          anomaliesDetected: 0,
          executionTime: Date.now() - startTime,
        },
        errors: ['Unauthorized. Invalid cron secret.'],
      });
    }
    
    console.log('[HQVE] Starting hourly validation');
    
    // Step 2: Fetch all active trades
    const activeTrades = await fetchActiveTrades();
    console.log(`[HQVE] Found ${activeTrades.length} active trades`);
    
    if (activeTrades.length === 0) {
      return res.status(200).json({
        success: true,
        summary: {
          tradesValidated: 0,
          tradesHit: 0,
          tradesNotHit: 0,
          tradesInvalidated: 0,
          tradesExpired: 0,
          anomaliesDetected: 0,
          executionTime: Date.now() - startTime,
        },
      });
    }
    
    // Step 3: Fetch current market data with multi-API triangulation
    console.log('[HQVE] Fetching market data from multiple sources...');
    const [marketData, onChainData, sentimentData] = await Promise.all([
      fetchCurrentMarketData(),
      fetchCurrentOnChainData(),
      fetchCurrentSentimentData(),
    ]);
    
    console.log(`[HQVE] Data collection complete:`);
    console.log(`  - Market: $${marketData.price.toFixed(2)} from ${marketData.sources.join(', ')}`);
    console.log(`  - On-chain: ${onChainData.mempoolSize} mempool, ${onChainData.whaleTransactions} whales`);
    console.log(`  - Sentiment: ${sentimentData.sentimentScore.toFixed(0)}/100`);
    console.log(`  - Data Quality: ${marketData.dataQuality}%`);
    
    // Step 4: Validate each trade
    let tradesHit = 0;
    let tradesNotHit = 0;
    let tradesInvalidated = 0;
    let tradesExpired = 0;
    let anomaliesDetected = 0;
    const errors: string[] = [];
    
    for (const trade of activeTrades) {
      try {
        const validation = await validateTrade(trade, marketData, onChainData, sentimentData);
        
        // Update trade status
        await updateTradeStatus(trade.id, validation.status);
        
        // Store hourly snapshot
        await storeHourlySnapshot(validation.snapshot);
        
        // Log anomalies
        for (const anomaly of validation.anomalies) {
          await logAnomaly(trade.id, 'PHASE_SHIFT', anomaly);
          anomaliesDetected++;
        }
        
        // Update counters
        switch (validation.status) {
          case 'HIT':
            tradesHit++;
            break;
          case 'NOT_HIT':
            tradesNotHit++;
            break;
          case 'INVALIDATED':
            tradesInvalidated++;
            break;
          case 'EXPIRED':
            tradesExpired++;
            break;
        }
        
      } catch (error) {
        console.error(`[Error] Failed to validate trade ${trade.id}:`, error);
        errors.push(`Trade ${trade.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    // Step 5: Update performance metrics
    await updatePerformanceMetrics({
      tradesHit,
      tradesNotHit,
      tradesInvalidated,
      tradesExpired,
    });
    
    const executionTime = Date.now() - startTime;
    
    console.log(`[HQVE] Validation complete in ${executionTime}ms`);
    console.log(`[HQVE] Results: ${tradesHit} hit, ${tradesNotHit} not hit, ${tradesInvalidated} invalidated, ${tradesExpired} expired`);
    
    return res.status(200).json({
      success: true,
      summary: {
        tradesValidated: activeTrades.length,
        tradesHit,
        tradesNotHit,
        tradesInvalidated,
        tradesExpired,
        anomaliesDetected,
        executionTime,
      },
      errors: errors.length > 0 ? errors : undefined,
    });
    
  } catch (error) {
    console.error('[Error] Hourly validation failed:', error);
    
    return res.status(500).json({
      success: false,
      summary: {
        tradesValidated: 0,
        tradesHit: 0,
        tradesNotHit: 0,
        tradesInvalidated: 0,
        tradesExpired: 0,
        anomaliesDetected: 0,
        executionTime: Date.now() - startTime,
      },
      errors: ['Internal server error. Validation failed.'],
    });
  }
}
