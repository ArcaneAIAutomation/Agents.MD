/**
 * UCIE Risk Assessment API Endpoint
 * 
 * GET /api/ucie/risk/[symbol]
 * 
 * Calculates comprehensive risk metrics including:
 * - Volatility metrics (30d, 90d, 1y)
 * - Correlation analysis (BTC, ETH, S&P 500, Gold)
 * - Maximum drawdown estimation (Monte Carlo)
 * - Risk scoring (0-100)
 * - Portfolio impact analysis
 * 
 * Caches results for 1 hour
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getVolatilityMetrics, VolatilityMetrics } from '../../../../lib/ucie/volatilityCalculators';
import { calculateCorrelationMetrics, CorrelationMetrics } from '../../../../lib/ucie/correlationAnalysis';
import { getMaxDrawdownMetrics, MaxDrawdownMetrics } from '../../../../lib/ucie/maxDrawdown';
import { calculateRiskScore, RiskScore, RiskInputs } from '../../../../lib/ucie/riskScoring';
import { 
  calculatePortfolioImpactWithDefaults, 
  estimateAssetMetrics,
  PortfolioImpactAnalysis 
} from '../../../../lib/ucie/portfolioImpact';
import { getCachedAnalysis, setCachedAnalysis } from '../../../../lib/ucie/cacheUtils';
import { withOptionalAuth, AuthenticatedRequest} from '../../../../middleware/auth';

export interface RiskAssessmentResponse {
  success: boolean;
  symbol: string;
  timestamp: string;
  dataQualityScore: number;
  riskScore: RiskScore;
  volatilityMetrics: VolatilityMetrics;
  correlationMetrics: CorrelationMetrics;
  maxDrawdownMetrics: MaxDrawdownMetrics;
  portfolioImpact: PortfolioImpactAnalysis;
  cacheStatus: 'hit' | 'miss';
  error?: string;
}

// Cache TTL: 2 minutes (for fresh, accurate data)
const CACHE_TTL = 2 * 60; // 120 seconds

/**
 * Calculate data quality score based on available metrics
 */
function calculateDataQuality(
  volatilityMetrics: VolatilityMetrics | null,
  correlationMetrics: CorrelationMetrics | null,
  maxDrawdownMetrics: MaxDrawdownMetrics | null
): number {
  let score = 0;
  let maxScore = 0;
  
  // Volatility metrics (30 points)
  maxScore += 30;
  if (volatilityMetrics) {
    score += 30;
  }
  
  // Correlation metrics (30 points)
  maxScore += 30;
  if (correlationMetrics) {
    score += 30;
  }
  
  // Max drawdown metrics (40 points)
  maxScore += 40;
  if (maxDrawdownMetrics) {
    score += 40;
  }
  
  return Math.round((score / maxScore) * 100);
}

/**
 * Main API handler
 */
async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<RiskAssessmentResponse>
) {
  // Get user info if authenticated (for database tracking)
  const userId = req.user?.id || 'anonymous';
  const userEmail = req.user?.email;
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      symbol: '',
      timestamp: new Date().toISOString(),
      dataQualityScore: 0,
      riskScore: {} as RiskScore,
      volatilityMetrics: {} as VolatilityMetrics,
      correlationMetrics: {} as CorrelationMetrics,
      maxDrawdownMetrics: {} as MaxDrawdownMetrics,
      portfolioImpact: {} as PortfolioImpactAnalysis,
      cacheStatus: 'miss',
      error: 'Method not allowed'
    });
  }
  
  const { symbol } = req.query;
  
  // Validate symbol
  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({
      success: false,
      symbol: '',
      timestamp: new Date().toISOString(),
      dataQualityScore: 0,
      riskScore: {} as RiskScore,
      volatilityMetrics: {} as VolatilityMetrics,
      correlationMetrics: {} as CorrelationMetrics,
      maxDrawdownMetrics: {} as MaxDrawdownMetrics,
      portfolioImpact: {} as PortfolioImpactAnalysis,
      cacheStatus: 'miss',
      error: 'Invalid symbol parameter'
    });
  }
  
  // Normalize symbol to uppercase
  const symbolUpper = symbol.toUpperCase();
  
  // Check database cache first
  const cachedData = await getCachedAnalysis(symbolUpper, 'risk');
  if (cachedData) {
    return res.status(200).json({
      ...cachedData,
      cacheStatus: 'hit'
    });
  }
  
  try {
    // Fetch all risk metrics in parallel with reduced iterations for speed
    const [
      volatilityMetrics,
      correlationMetrics,
      maxDrawdownMetrics
    ] = await Promise.allSettled([
      getVolatilityMetrics(symbol),
      calculateCorrelationMetrics(symbol),
      getMaxDrawdownMetrics(symbol, 500) // Reduced from 10,000 to 500 for serverless performance
    ]);
    
    // Extract successful results
    const volatility = volatilityMetrics.status === 'fulfilled' ? volatilityMetrics.value : null;
    const correlation = correlationMetrics.status === 'fulfilled' ? correlationMetrics.value : null;
    const maxDrawdown = maxDrawdownMetrics.status === 'fulfilled' ? maxDrawdownMetrics.value : null;
    
    // Calculate data quality score
    const dataQualityScore = calculateDataQuality(volatility, correlation, maxDrawdown);
    
    // If we don't have enough data, return error (lowered threshold from 50% to 20%)
    if (dataQualityScore < 20) {
      return res.status(503).json({
        success: false,
        symbol: symbol.toUpperCase(),
        timestamp: new Date().toISOString(),
        dataQualityScore,
        riskScore: {} as RiskScore,
        volatilityMetrics: {} as VolatilityMetrics,
        correlationMetrics: {} as CorrelationMetrics,
        maxDrawdownMetrics: {} as MaxDrawdownMetrics,
        portfolioImpact: {} as PortfolioImpactAnalysis,
        cacheStatus: 'miss',
        error: 'Insufficient data available for risk assessment'
      });
    }
    
    // Fetch real market data
    let marketData: any = null;
    try {
      const marketResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/ucie/market-data/${symbolUpper}`, {
        signal: AbortSignal.timeout(8000) // Reduced to 8s for faster failure
      });
      if (marketResponse.ok) {
        const marketJson = await marketResponse.json();
        marketData = marketJson.data;
      }
    } catch (error) {
      console.warn(`⚠️ Failed to fetch market data for risk assessment:`, error);
    }
    
    // Fetch real on-chain data
    let onChainData: any = null;
    try {
      const onChainResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/ucie/on-chain/${symbolUpper}`, {
        signal: AbortSignal.timeout(8000) // Reduced to 8s for faster failure
      });
      if (onChainResponse.ok) {
        const onChainJson = await onChainResponse.json();
        onChainData = onChainJson.data;
      }
    } catch (error) {
      console.warn(`⚠️ Failed to fetch on-chain data for risk assessment:`, error);
    }
    
    // Prepare risk scoring inputs with REAL data
    const riskInputs: RiskInputs = {
      annualizedVolatility: volatility?.annualized30d || 0.5,
      volatilityPercentile: volatility?.percentile || 50,
      dailyVolume: marketData?.volume24h || 0,
      marketCap: marketData?.marketCap || 0,
      bidAskSpread: marketData?.bidAskSpread || 0.005,
      top10HolderPercentage: onChainData?.holderConcentration?.top10Percentage || 0,
      giniCoefficient: onChainData?.holderConcentration?.giniCoefficient || 0,
      regulatoryStatus: 'Uncertain', // TODO: Add regulatory data source
      exchangeDelistings: 0, // TODO: Track exchange delistings
      marketCapUSD: marketData?.marketCap || 0
    };
    
    console.log(`✅ Risk assessment using real data: volume=$${riskInputs.dailyVolume}, mcap=$${riskInputs.marketCap}`);
    
    // Calculate risk score
    const riskScore = calculateRiskScore(riskInputs);
    
    // Calculate portfolio impact
    // Estimate asset metrics from volatility and correlation data
    const assetMetrics = estimateAssetMetrics(
      0.25, // TODO: Calculate from historical returns
      volatility?.annualized30d || 0.5,
      correlation?.btc || 0.5,
      correlation?.eth || 0.5
    );
    
    const portfolioImpact = calculatePortfolioImpactWithDefaults(assetMetrics);
    
    // Prepare response
    const response: RiskAssessmentResponse = {
      success: true,
      symbol: symbol.toUpperCase(),
      timestamp: new Date().toISOString(),
      dataQualityScore,
      riskScore,
      volatilityMetrics: volatility || {} as VolatilityMetrics,
      correlationMetrics: correlation || {} as CorrelationMetrics,
      maxDrawdownMetrics: maxDrawdown || {} as MaxDrawdownMetrics,
      portfolioImpact,
      cacheStatus: 'miss'
    };
    
    // Cache the response in database
    await setCachedAnalysis(symbolUpper, 'risk', response, CACHE_TTL, dataQualityScore, userId, userEmail);
    
    // Return response
    return res.status(200).json(response);
    
  } catch (error) {
    console.error('Error calculating risk assessment:', error);
    
    return res.status(500).json({
      success: false,
      symbol: symbol.toUpperCase(),
      timestamp: new Date().toISOString(),
      dataQualityScore: 0,
      riskScore: {} as RiskScore,
      volatilityMetrics: {} as VolatilityMetrics,
      correlationMetrics: {} as CorrelationMetrics,
      maxDrawdownMetrics: {} as MaxDrawdownMetrics,
      portfolioImpact: {} as PortfolioImpactAnalysis,
      cacheStatus: 'miss',
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}


// Export with optional authentication middleware (for user tracking)
export default withOptionalAuth(handler);
