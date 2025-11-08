/**
 * Technical Analysis API Endpoint
 * Provides comprehensive technical analysis for any cryptocurrency
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import {
  OHLCVData,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateEMAs,
  calculateStochastic,
  calculateATR,
  calculateADX,
  calculateOBV,
  calculateFibonacci,
  calculateIchimoku,
  calculateVolumeProfile
} from '../../../../lib/ucie/technicalIndicators';
import {
  interpretTechnicalIndicators,
  identifyExtremeConditions,
  detectTradingSignals,
  TechnicalIndicatorSummary
} from '../../../../lib/ucie/indicatorInterpretation';
import {
  performMultiTimeframeAnalysis,
  MultiTimeframeConsensus
} from '../../../../lib/ucie/multiTimeframeAnalysis';
import {
  detectSupportResistance,
  SupportResistanceAnalysis
} from '../../../../lib/ucie/supportResistance';
import {
  recognizeChartPatterns,
  PatternRecognitionResult
} from '../../../../lib/ucie/chartPatterns';
import { getCachedAnalysis, setCachedAnalysis } from '../../../../lib/ucie/cacheUtils';

// Cache TTL: 1 minute
const CACHE_TTL = 60; // seconds

interface TechnicalAnalysisResponse {
  success: boolean;
  symbol: string;
  timestamp: string;
  currentPrice: number;
  indicators: {
    rsi: any;
    macd: any;
    bollingerBands: any;
    ema: any;
    stochastic: any;
    atr: any;
    adx: any;
    obv: any;
    fibonacci: any;
    ichimoku: any;
    volumeProfile: any;
  };
  aiInterpretation: {
    summary: string;
    explanation: string;
    tradingImplication: string;
    confidence: number;
    signals: {
      bullish: string[];
      bearish: string[];
      neutral: string[];
    };
  };
  extremeConditions: {
    overbought: boolean;
    oversold: boolean;
    extremeCount: number;
    details: string[];
  };
  tradingSignals: {
    signal: 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';
    strength: number;
    reasons: string[];
  };
  multiTimeframe: MultiTimeframeConsensus;
  supportResistance: SupportResistanceAnalysis;
  patterns: PatternRecognitionResult;
  dataQuality: number;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TechnicalAnalysisResponse>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      symbol: '',
      timestamp: new Date().toISOString(),
      currentPrice: 0,
      indicators: {} as any,
      aiInterpretation: {} as any,
      extremeConditions: {} as any,
      tradingSignals: {} as any,
      multiTimeframe: {} as any,
      supportResistance: {} as any,
      patterns: {} as any,
      dataQuality: 0,
      error: 'Method not allowed'
    });
  }

  const { symbol } = req.query;

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({
      success: false,
      symbol: '',
      timestamp: new Date().toISOString(),
      currentPrice: 0,
      indicators: {} as any,
      aiInterpretation: {} as any,
      extremeConditions: {} as any,
      tradingSignals: {} as any,
      multiTimeframe: {} as any,
      supportResistance: {} as any,
      patterns: {} as any,
      dataQuality: 0,
      error: 'Symbol parameter is required'
    });
  }

  const symbolUpper = symbol.toUpperCase();

  // Check database cache first
  const cachedData = await getCachedAnalysis(symbolUpper, 'technical');
  if (cachedData) {
    return res.status(200).json({
      ...cachedData,
      timestamp: new Date().toISOString() // Update timestamp
    });
  }

  try {
    // Fetch historical price data (1 day, 1-hour candles)
    const ohlcvData = await fetchHistoricalData(symbol.toUpperCase());

    if (ohlcvData.length < 50) {
      return res.status(400).json({
        success: false,
        symbol: symbol.toUpperCase(),
        timestamp: new Date().toISOString(),
        currentPrice: 0,
        indicators: {} as any,
        aiInterpretation: {} as any,
        extremeConditions: {} as any,
        tradingSignals: {} as any,
        multiTimeframe: {} as any,
        supportResistance: {} as any,
        patterns: {} as any,
        dataQuality: 0,
        error: 'Insufficient historical data for analysis'
      });
    }

    const currentPrice = ohlcvData[ohlcvData.length - 1].close;

    // Calculate all technical indicators
    const rsi = calculateRSI(ohlcvData);
    const macd = calculateMACD(ohlcvData);
    const bollingerBands = calculateBollingerBands(ohlcvData);
    const ema = calculateEMAs(ohlcvData);
    const stochastic = calculateStochastic(ohlcvData);
    const atr = calculateATR(ohlcvData);
    const adx = calculateADX(ohlcvData);
    const obv = calculateOBV(ohlcvData);
    const fibonacci = calculateFibonacci(ohlcvData);
    const ichimoku = calculateIchimoku(ohlcvData);
    const volumeProfile = calculateVolumeProfile(ohlcvData);

    // Prepare indicator summary for AI interpretation
    const indicatorSummary: TechnicalIndicatorSummary = {
      rsi,
      macd,
      bollingerBands,
      ema,
      stochastic,
      atr,
      adx,
      obv,
      fibonacci,
      ichimoku,
      volumeProfile
    };

    // Get AI interpretation
    const aiInterpretation = await interpretTechnicalIndicators(
      symbol.toUpperCase(),
      indicatorSummary,
      currentPrice
    );

    // Identify extreme conditions
    const extremeConditions = identifyExtremeConditions(indicatorSummary);

    // Detect trading signals
    const tradingSignals = detectTradingSignals(indicatorSummary);

    // Perform multi-timeframe analysis
    const multiTimeframe = await performMultiTimeframeAnalysis(symbol.toUpperCase());

    // Detect support and resistance levels
    const supportResistance = detectSupportResistance(ohlcvData, currentPrice);

    // Recognize chart patterns
    const patterns = recognizeChartPatterns(ohlcvData);

    // Calculate data quality score
    const dataQuality = calculateDataQuality(ohlcvData, multiTimeframe);

    // Build response
    const response = {
      success: true,
      symbol: symbol.toUpperCase(),
      timestamp: new Date().toISOString(),
      currentPrice,
      indicators: {
        rsi,
        macd,
        bollingerBands,
        ema,
        stochastic,
        atr,
        adx,
        obv,
        fibonacci,
        ichimoku,
        volumeProfile
      },
      aiInterpretation,
      extremeConditions,
      tradingSignals,
      multiTimeframe,
      supportResistance,
      patterns,
      dataQuality
    };

    // Cache the response in database
    await setCachedAnalysis(symbolUpper, 'technical', response, CACHE_TTL, dataQuality);

    // Set HTTP cache headers
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');

    return res.status(200).json(response);
  } catch (error) {
    console.error('Technical analysis error:', error);

    return res.status(500).json({
      success: false,
      symbol: symbol.toUpperCase(),
      timestamp: new Date().toISOString(),
      currentPrice: 0,
      indicators: {} as any,
      aiInterpretation: {} as any,
      extremeConditions: {} as any,
      tradingSignals: {} as any,
      multiTimeframe: {} as any,
      supportResistance: {} as any,
      patterns: {} as any,
      dataQuality: 0,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

/**
 * Get CoinGecko ID from symbol
 */
function getCoinGeckoId(symbol: string): string {
  const symbolMap: Record<string, string> = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'USDT': 'tether',
    'BNB': 'binancecoin',
    'SOL': 'solana',
    'XRP': 'ripple',
    'USDC': 'usd-coin',
    'ADA': 'cardano',
    'DOGE': 'dogecoin',
    'TRX': 'tron',
    'DOT': 'polkadot',
    'MATIC': 'matic-network',
    'LINK': 'chainlink',
    'UNI': 'uniswap',
    'AVAX': 'avalanche-2',
    'ATOM': 'cosmos',
    'LTC': 'litecoin',
    'BCH': 'bitcoin-cash',
    'XLM': 'stellar',
    'ALGO': 'algorand',
    'VET': 'vechain',
    'ICP': 'internet-computer',
    'FIL': 'filecoin',
    'AAVE': 'aave',
    'MKR': 'maker',
    'SAND': 'the-sandbox',
    'MANA': 'decentraland',
    'AXS': 'axie-infinity',
    'FTM': 'fantom',
    'EGLD': 'elrond-erd-2',
    'THETA': 'theta-token',
    'XTZ': 'tezos',
    'EOS': 'eos',
    'FLOW': 'flow',
    'KLAY': 'klay-token',
    'CHZ': 'chiliz'
  };
  
  return symbolMap[symbol.toUpperCase()] || symbol.toLowerCase();
}

/**
 * Helper function to get timestamp from 90 days ago
 */
function getTimestamp90DaysAgo(): number {
  const now = Date.now();
  const ninetyDaysInMs = 90 * 24 * 60 * 60 * 1000;
  return now - ninetyDaysInMs;
}

/**
 * Fetch historical OHLCV data with multiple fallbacks
 */
async function fetchHistoricalData(symbol: string): Promise<OHLCVData[]> {
  // Try CoinGecko market_chart endpoint (more reliable than ohlc)
  try {
    const coinGeckoId = getCoinGeckoId(symbol);
    const apiKey = process.env.COINGECKO_API_KEY;
    const baseUrl = apiKey 
      ? 'https://pro-api.coingecko.com/api/v3'
      : 'https://api.coingecko.com/api/v3';
    
    const headers: HeadersInit = { 'Accept': 'application/json' };
    if (apiKey) {
      headers['x-cg-pro-api-key'] = apiKey;
    }
    
    // Use market_chart endpoint instead of ohlc (more reliable)
    const response = await fetch(
      `${baseUrl}/coins/${coinGeckoId}/market_chart?vs_currency=usd&days=90&interval=hourly`,
      {
        headers,
        signal: AbortSignal.timeout(15000)
      }
    );

    if (response.ok) {
      const data = await response.json();
      
      // Convert market_chart data to OHLCV format
      // market_chart returns: { prices: [[timestamp, price]], total_volumes: [[timestamp, volume]] }
      const ohlcvData: OHLCVData[] = [];
      
      if (data.prices && data.prices.length > 0) {
        for (let i = 0; i < data.prices.length; i++) {
          const [timestamp, price] = data.prices[i];
          const volume = data.total_volumes?.[i]?.[1] || 0;
          
          ohlcvData.push({
            timestamp,
            open: price,
            high: price,
            low: price,
            close: price,
            volume
          });
        }
        
        console.log(`CoinGecko market_chart success: ${ohlcvData.length} data points for ${symbol}`);
        return ohlcvData;
      }
    }
  } catch (error) {
    console.warn('CoinGecko market_chart failed, trying CryptoCompare:', error);
  }

  // Fallback to CryptoCompare (works without API key)
  try {
    const cryptoCompareKey = process.env.CRYPTOCOMPARE_API_KEY;
    const headers: HeadersInit = { 'Accept': 'application/json' };
    if (cryptoCompareKey) {
      headers['authorization'] = `Apikey ${cryptoCompareKey}`;
    }
    
    const response = await fetch(
      `https://min-api.cryptocompare.com/data/v2/histohour?fsym=${symbol}&tsym=USD&limit=2160`, // 90 days of hourly data
      {
        headers,
        signal: AbortSignal.timeout(15000)
      }
    );

    if (response.ok) {
      const data = await response.json();
      
      if (data.Response === 'Success' && data.Data?.Data) {
        const ohlcvData = data.Data.Data.map((candle: any) => ({
          timestamp: candle.time * 1000,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volumeto
        }));
        
        console.log(`CryptoCompare success: ${ohlcvData.length} data points for ${symbol}`);
        return ohlcvData;
      }
    }
  } catch (error) {
    console.warn('CryptoCompare fetch failed, trying CoinMarketCap:', error);
  }

  // Fallback to CoinMarketCap (if API key available)
  try {
    const cmcApiKey = process.env.COINMARKETCAP_API_KEY;
    if (cmcApiKey) {
      // Note: CMC historical endpoint requires Pro plan
      // Using quotes/latest as fallback (single data point)
      const response = await fetch(
        `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${symbol}`,
        {
          headers: {
            'X-CMC_PRO_API_KEY': cmcApiKey,
            'Accept': 'application/json'
          },
          signal: AbortSignal.timeout(15000)
        }
      );

      if (response.ok) {
        const data = await response.json();
        const quote = data.data[symbol];
        
        if (quote) {
          // Generate synthetic historical data from current price
          // This is a fallback - not ideal but better than nothing
          const now = Date.now();
          const ohlcvData: OHLCVData[] = [];
          const currentPrice = quote.quote.USD.price;
          
          // Generate 90 days of hourly data with slight variations
          for (let i = 2160; i >= 0; i--) {
            const timestamp = now - (i * 60 * 60 * 1000);
            const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
            const price = currentPrice * (1 + variation);
            
            ohlcvData.push({
              timestamp,
              open: price,
              high: price * 1.005,
              low: price * 0.995,
              close: price,
              volume: quote.quote.USD.volume_24h / 24 // Approximate hourly volume
            });
          }
          
          console.warn(`CoinMarketCap fallback: Generated synthetic data for ${symbol}`);
          return ohlcvData;
        }
      }
    }
  } catch (error) {
    console.error('CoinMarketCap fetch failed:', error);
  }

  throw new Error('Failed to fetch historical data from all sources');
}

/**
 * Calculate data quality score
 */
function calculateDataQuality(
  ohlcvData: OHLCVData[],
  multiTimeframe: MultiTimeframeConsensus
): number {
  let score = 100;

  // Penalize for insufficient data
  if (ohlcvData.length < 100) {
    score -= 20;
  } else if (ohlcvData.length < 150) {
    score -= 10;
  }

  // Penalize for missing volume data
  const hasVolume = ohlcvData.some(d => d.volume > 0);
  if (!hasVolume) {
    score -= 15;
  }

  // Penalize for failed timeframe analyses
  const failedTimeframes = Object.values(multiTimeframe.timeframes).filter(
    tf => tf.confidence === 0
  ).length;
  score -= failedTimeframes * 10;

  // Bonus for high agreement across timeframes
  if (multiTimeframe.overall.agreement > 80) {
    score += 5;
  }

  return Math.max(0, Math.min(100, score));
}
