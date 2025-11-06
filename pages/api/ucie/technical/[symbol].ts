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

    // Cache the response for 1 minute
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');

    return res.status(200).json({
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
    });
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
 * Fetch historical OHLCV data
 */
async function fetchHistoricalData(symbol: string): Promise<OHLCVData[]> {
  // Try CoinGecko first (best OHLCV data with correct ID mapping)
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
    
    const response = await fetch(
      `${baseUrl}/coins/${coinGeckoId}/ohlc?vs_currency=usd&days=365`,
      {
        headers,
        signal: AbortSignal.timeout(15000) // Increased from 10s to 15s
      }
    );

    if (response.ok) {
      const data = await response.json();
      return data.map((candle: any) => ({
        timestamp: candle[0],
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
        volume: 0 // CoinGecko OHLC doesn't include volume
      }));
    }
  } catch (error) {
    console.warn('CoinGecko fetch failed, trying CoinMarketCap:', error);
  }

  // Fallback to CoinMarketCap (if available)
  try {
    const cmcApiKey = process.env.COINMARKETCAP_API_KEY;
    if (cmcApiKey) {
      // CoinMarketCap historical data would go here
      // For now, we'll skip to avoid complexity
      console.warn('CoinMarketCap historical data not implemented yet');
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
