/**
 * UCIE Derivatives Data API Endpoint
 * 
 * Fetches and analyzes derivatives market data including funding rates,
 * open interest, liquidations, and long/short ratios from multiple exchanges.
 * 
 * Endpoint: GET /api/ucie/derivatives/[symbol]
 * 
 * Features:
 * - Multi-exchange data aggregation
 * - Funding rate analysis with mean reversion signals
 * - Open interest tracking with spike detection
 * - Liquidation level detection with cascade analysis
 * - Long/short ratio analysis with contrarian signals
 * - 5-minute cache TTL
 * - Graceful error handling
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { DerivativesAggregator } from '../../../../lib/ucie/derivativesClients';
import { analyzeFundingRates } from '../../../../lib/ucie/fundingRateAnalysis';
import { analyzeOpenInterest } from '../../../../lib/ucie/openInterestTracking';
import { analyzeLiquidations } from '../../../../lib/ucie/liquidationDetection';
import { analyzeLongShortRatios } from '../../../../lib/ucie/longShortAnalysis';
import { getCachedAnalysis, setCachedAnalysis } from '../../../../lib/ucie/cacheUtils';
import { withAuth, AuthenticatedRequest } from '../../../../middleware/auth';

import type { FundingRateAnalysis } from '../../../../lib/ucie/fundingRateAnalysis';
import type { OpenInterestAnalysis } from '../../../../lib/ucie/openInterestTracking';
import type { LiquidationAnalysis } from '../../../../lib/ucie/liquidationDetection';
import type { LongShortAnalysis } from '../../../../lib/ucie/longShortAnalysis';

// Cache TTL: 15 minutes (for OpenAI/Caesar analysis)
const CACHE_TTL = 15 * 60; // 900 seconds

export interface DerivativesDataResponse {
  success: boolean;
  symbol: string;
  fundingAnalysis: FundingRateAnalysis | null;
  openInterestAnalysis: OpenInterestAnalysis | null;
  liquidationAnalysis: LiquidationAnalysis | null;
  longShortAnalysis: LongShortAnalysis | null;
  overallRisk: 'extreme' | 'high' | 'moderate' | 'low';
  dataQuality: number;
  sources: string[];
  cached: boolean;
  timestamp: string;
  error?: string;
}

// Cache functions removed - now using database cache via cacheUtils

/**
 * Calculate overall risk level
 */
function calculateOverallRisk(
  fundingAnalysis: FundingRateAnalysis | null,
  openInterestAnalysis: OpenInterestAnalysis | null,
  liquidationAnalysis: LiquidationAnalysis | null,
  longShortAnalysis: LongShortAnalysis | null
): 'extreme' | 'high' | 'moderate' | 'low' {
  const risks: string[] = [];

  if (fundingAnalysis) risks.push(fundingAnalysis.riskLevel);
  if (liquidationAnalysis) risks.push(liquidationAnalysis.riskLevel);
  
  // Check for extreme conditions
  if (risks.includes('extreme')) {
    return 'extreme';
  }

  // Check for high risk conditions
  if (risks.includes('high') || 
      (openInterestAnalysis && openInterestAnalysis.confidence > 80) ||
      (longShortAnalysis && longShortAnalysis.contrarianSignal.confidence > 80)) {
    return 'high';
  }

  // Check for moderate risk
  if (risks.includes('moderate') || 
      (openInterestAnalysis && openInterestAnalysis.spikes.length > 0) ||
      (longShortAnalysis && longShortAnalysis.extremePositioning.length > 0)) {
    return 'moderate';
  }

  return 'low';
}

/**
 * Calculate data quality score
 */
function calculateDataQuality(
  fundingRates: number,
  openInterest: number,
  liquidations: number,
  longShortRatios: number
): number {
  const weights = {
    funding: 0.3,
    oi: 0.3,
    liquidations: 0.2,
    longShort: 0.2
  };

  const fundingScore = fundingRates > 0 ? 100 : 0;
  const oiScore = openInterest > 0 ? 100 : 0;
  const liquidationScore = liquidations > 0 ? 100 : 0;
  const longShortScore = longShortRatios > 0 ? 100 : 0;

  return (
    fundingScore * weights.funding +
    oiScore * weights.oi +
    liquidationScore * weights.liquidations +
    longShortScore * weights.longShort
  );
}

/**
 * Main API handler
 */
async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<DerivativesDataResponse>
) {
  // Get user info (guaranteed by withAuth middleware)
  const userId = req.user!.id;
  const userEmail = req.user!.email;
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      symbol: '',
      fundingAnalysis: null,
      openInterestAnalysis: null,
      liquidationAnalysis: null,
      longShortAnalysis: null,
      overallRisk: 'low',
      dataQuality: 0,
      sources: [],
      cached: false,
      timestamp: new Date().toISOString(),
      error: 'Method not allowed'
    });
  }

  const { symbol } = req.query;

  // Validate symbol
  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({
      success: false,
      symbol: '',
      fundingAnalysis: null,
      openInterestAnalysis: null,
      liquidationAnalysis: null,
      longShortAnalysis: null,
      overallRisk: 'low',
      dataQuality: 0,
      sources: [],
      cached: false,
      timestamp: new Date().toISOString(),
      error: 'Invalid symbol parameter'
    });
  }

  const symbolUpper = symbol.toUpperCase();

  // Check database cache first
  const cachedData = await getCachedAnalysis(symbolUpper, 'derivatives');
  if (cachedData) {
    return res.status(200).json({
      ...cachedData,
      cached: true
    });
  }

  try {
    // Initialize aggregator
    const aggregator = new DerivativesAggregator();
    const sources: string[] = [];

    // Fetch all derivatives data in parallel
    const [
      fundingRates,
      openInterest,
      liquidations,
      longShortRatios
    ] = await Promise.allSettled([
      aggregator.getAllFundingRates(symbolUpper),
      aggregator.getAllOpenInterest(symbolUpper),
      aggregator.getLiquidations(symbolUpper),
      aggregator.getAllLongShortRatios(symbolUpper)
    ]);

    // Extract successful results
    const fundingRatesData = fundingRates.status === 'fulfilled' ? fundingRates.value : [];
    const openInterestData = openInterest.status === 'fulfilled' ? openInterest.value : [];
    const liquidationsData = liquidations.status === 'fulfilled' ? liquidations.value : [];
    const longShortRatiosData = longShortRatios.status === 'fulfilled' ? longShortRatios.value : [];

    // Track sources
    if (fundingRatesData.length > 0) {
      sources.push('Funding Rates');
      fundingRatesData.forEach(fr => {
        if (!sources.includes(fr.exchange)) sources.push(fr.exchange);
      });
    }
    if (openInterestData.length > 0) {
      sources.push('Open Interest');
    }
    if (liquidationsData.length > 0) {
      sources.push('Liquidations');
    }
    if (longShortRatiosData.length > 0) {
      sources.push('Long/Short Ratios');
    }

    // Analyze funding rates
    let fundingAnalysis: FundingRateAnalysis | null = null;
    if (fundingRatesData.length > 0) {
      try {
        fundingAnalysis = analyzeFundingRates(fundingRatesData);
      } catch (error) {
        console.error('Funding rate analysis error:', error);
      }
    }

    // Analyze open interest
    let openInterestAnalysis: OpenInterestAnalysis | null = null;
    if (openInterestData.length > 0) {
      try {
        openInterestAnalysis = analyzeOpenInterest(openInterestData);
      } catch (error) {
        console.error('Open interest analysis error:', error);
      }
    }

    // Analyze liquidations
    let liquidationAnalysis: LiquidationAnalysis | null = null;
    if (liquidationsData.length > 0) {
      try {
        // Get current price from funding rates or use a default
        const currentPrice = fundingRatesData[0]?.markPrice || 0;
        liquidationAnalysis = analyzeLiquidations(
          liquidationsData,
          currentPrice,
          openInterestData
        );
      } catch (error) {
        console.error('Liquidation analysis error:', error);
      }
    }

    // Analyze long/short ratios
    let longShortAnalysis: LongShortAnalysis | null = null;
    if (longShortRatiosData.length > 0) {
      try {
        // Get current price from funding rates or use a default
        const currentPrice = fundingRatesData[0]?.markPrice || 0;
        longShortAnalysis = analyzeLongShortRatios(
          longShortRatiosData,
          currentPrice
        );
      } catch (error) {
        console.error('Long/short analysis error:', error);
      }
    }

    // Calculate overall risk
    const overallRisk = calculateOverallRisk(
      fundingAnalysis,
      openInterestAnalysis,
      liquidationAnalysis,
      longShortAnalysis
    );

    // Calculate data quality
    const dataQuality = calculateDataQuality(
      fundingRatesData.length,
      openInterestData.length,
      liquidationsData.length,
      longShortRatiosData.length
    );

    // Check if we have any data
    if (dataQuality === 0) {
      return res.status(404).json({
        success: false,
        symbol: symbolUpper,
        fundingAnalysis: null,
        openInterestAnalysis: null,
        liquidationAnalysis: null,
        longShortAnalysis: null,
        overallRisk: 'low',
        dataQuality: 0,
        sources: [],
        cached: false,
        timestamp: new Date().toISOString(),
        error: 'No derivatives data available for this symbol'
      });
    }

    // Build response
    const response: DerivativesDataResponse = {
      success: true,
      symbol: symbolUpper,
      fundingAnalysis,
      openInterestAnalysis,
      liquidationAnalysis,
      longShortAnalysis,
      overallRisk,
      dataQuality,
      sources,
      cached: false,
      timestamp: new Date().toISOString()
    };

    // Cache the response in database
    await setCachedAnalysis(symbolUpper, 'derivatives', response, CACHE_TTL, dataQuality, userId, userEmail);

    // Return success
    return res.status(200).json(response);

  } catch (error) {
    console.error('Derivatives API error:', error);
    
    return res.status(500).json({
      success: false,
      symbol: symbolUpper,
      fundingAnalysis: null,
      openInterestAnalysis: null,
      liquidationAnalysis: null,
      longShortAnalysis: null,
      overallRisk: 'low',
      dataQuality: 0,
      sources: [],
      cached: false,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}


// Export with required authentication middleware
export default withAuth(handler);
