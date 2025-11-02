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

// In-memory cache (1 hour TTL)
const cache = new Map<string, { data: RiskAssessmentResponse; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Get cached data if available and not expired
 */
function getCachedData(symbol: string): RiskAssessmentResponse | null {
  const cached = cache.get(symbol.toUpperCase());
  
  if (!cached) return null;
  
  const now = Date.now();
  if (now - cached.timestamp > CACHE_TTL) {
    cache.delete(symbol.toUpperCase());
    return null;
  }
  
  return cached.data;
}

/**
 * Store data in cache
 */
function setCachedData(symbol: string, data: RiskAssessmentResponse): void {
  cache.set(symbol.toUpperCase(), {
    data,
    timestamp: Date.now()
  });
}

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
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RiskAssessmentResponse>
) {
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
  
  // Check cache first
  const cachedData = getCachedData(symbol);
  if (cachedData) {
    return res.status(200).json({
      ...cachedData,
      cacheStatus: 'hit'
    });
  }
  
  try {
    // Fetch all risk metrics in parallel
    const [
      volatilityMetrics,
      correlationMetrics,
      maxDrawdownMetrics
    ] = await Promise.allSettled([
      getVolatilityMetrics(symbol),
      calculateCorrelationMetrics(symbol),
      getMaxDrawdownMetrics(symbol, 10000) // 10,000 Monte Carlo iterations
    ]);
    
    // Extract successful results
    const volatility = volatilityMetrics.status === 'fulfilled' ? volatilityMetrics.value : null;
    const correlation = correlationMetrics.status === 'fulfilled' ? correlationMetrics.value : null;
    const maxDrawdown = maxDrawdownMetrics.status === 'fulfilled' ? maxDrawdownMetrics.value : null;
    
    // Calculate data quality score
    const dataQualityScore = calculateDataQuality(volatility, correlation, maxDrawdown);
    
    // If we don't have enough data, return error
    if (dataQualityScore < 50) {
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
    
    // Prepare risk scoring inputs
    const riskInputs: RiskInputs = {
      annualizedVolatility: volatility?.annualized30d || 0.5,
      volatilityPercentile: volatility?.percentile || 50,
      dailyVolume: 1_000_000, // TODO: Fetch from market data API
      marketCap: 100_000_000, // TODO: Fetch from market data API
      bidAskSpread: 0.005,
      top10HolderPercentage: 0.5, // TODO: Fetch from on-chain data
      giniCoefficient: 0.7, // TODO: Fetch from on-chain data
      regulatoryStatus: 'Uncertain',
      exchangeDelistings: 0,
      marketCapUSD: 100_000_000 // TODO: Fetch from market data API
    };
    
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
    
    // Cache the response
    setCachedData(symbol, response);
    
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
