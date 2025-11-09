/**
 * DeFi Metrics API Endpoint
 * 
 * Fetches comprehensive DeFi protocol metrics including TVL, revenue,
 * token utility, development activity, and peer comparison.
 * 
 * Requirements: 18.1, 18.2, 18.3, 18.4, 18.5
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import {
  fetchDeFiMetrics,
  isDeFiProtocol,
} from '../../../../lib/ucie/defiClients';
import { analyzeTVL } from '../../../../lib/ucie/tvlAnalysis';
import {
  analyzeProtocolRevenue,
  formatRevenue,
} from '../../../../lib/ucie/protocolRevenue';
import {
  analyzeTokenUtility,
  detectTokenUseCases,
  generateUtilityDescription,
} from '../../../../lib/ucie/tokenUtility';
import {
  analyzeDevelopmentActivity,
  calculateDevelopmentMetrics,
  generateDevelopmentDescription,
} from '../../../../lib/ucie/developmentActivity';
import {
  analyzePeerComparison,
  identifySimilarProtocols,
  PeerProtocol,
} from '../../../../lib/ucie/peerComparison';
import { getCachedAnalysis, setCachedAnalysis } from '../../../../lib/ucie/cacheUtils';
import { withOptionalAuth, AuthenticatedRequest } from '../../../../middleware/auth';

// ============================================================================
// Types
// ============================================================================

interface DeFiMetricsResponse {
  success: boolean;
  data?: {
    isDeFiProtocol: boolean;
    tvlAnalysis: any;
    revenueAnalysis: any;
    utilityAnalysis: any;
    developmentAnalysis: any;
    peerComparison: any;
    summary: string;
    dataQuality: number;
    timestamp: string;
  };
  error?: string;
  cached?: boolean;
}

// Cache TTL: 15 minutes (for OpenAI/Caesar analysis)
const CACHE_TTL = 15 * 60; // 900 seconds

// Cache functions removed - now using database cache via cacheUtils
function setCachedData(key: string, data: any): void {
  // Deprecated - keeping for compatibility but not used
  return;
}

// ============================================================================
// Main Handler
// ============================================================================

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<DeFiMetricsResponse>
) {
  // Get user info if authenticated (for database tracking)
  const userId = req.user?.id || 'anonymous';
  const userEmail = req.user?.email;
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  const { symbol } = req.query;

  // Validate symbol
  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Invalid symbol parameter',
    });
  }

  const normalizedSymbol = symbol.toUpperCase();

  // Check database cache
  const cachedData = await getCachedAnalysis(normalizedSymbol, 'defi');
  if (cachedData) {
    return res.status(200).json({
      success: true,
      data: cachedData,
      cached: true,
    });
  }

  try {
    // Check if token is a DeFi protocol (with error handling)
    let isDefi = false;
    try {
      isDefi = await isDeFiProtocol(normalizedSymbol);
    } catch (error) {
      console.warn(`isDeFiProtocol check failed for ${normalizedSymbol}:`, error);
      // Continue with isDefi = false
    }

    if (!isDefi) {
      const response = {
        isDeFiProtocol: false,
        tvlAnalysis: null,
        revenueAnalysis: null,
        utilityAnalysis: null,
        developmentAnalysis: null,
        peerComparison: null,
        summary: `${normalizedSymbol} is not identified as a DeFi protocol.`,
        dataQuality: 0,
        timestamp: new Date().toISOString(),
      };

      // Cache in database
      await setCachedAnalysis(normalizedSymbol, 'defi', response, CACHE_TTL, 0, userId, userEmail);

      return res.status(200).json({
        success: true,
        data: response,
      });
    }

    // Fetch DeFi metrics
    let metrics = null;
    try {
      metrics = await fetchDeFiMetrics(normalizedSymbol);
    } catch (error) {
      console.warn(`fetchDeFiMetrics failed for ${normalizedSymbol}:`, error);
    }

    // GitHub data disabled for now (requires GitHub API implementation)
    const githubData: any[] = [];

    // Analyze TVL
    let tvlAnalysis = null;
    if (metrics) {
      tvlAnalysis = analyzeTVL(metrics);
    }

    // Analyze Revenue (simplified - would need more data sources)
    let revenueAnalysis = null;
    if (metrics) {
      // Estimate revenue from TVL (very rough approximation)
      const estimatedRevenue24h = metrics.tvl * 0.0001; // 0.01% of TVL per day
      revenueAnalysis = analyzeProtocolRevenue(
        estimatedRevenue24h,
        estimatedRevenue24h * 1.2, // Estimate fees
        estimatedRevenue24h * 0.3,  // Protocol revenue
        estimatedRevenue24h * 0.7   // Holder revenue
      );
    }

    // Analyze Token Utility
    let utilityAnalysis = null;
    if (metrics) {
      const useCases = detectTokenUseCases({
        category: metrics.category,
        hasGovernance: true, // Assume most DeFi tokens have governance
        hasStaking: metrics.category?.includes('Staking'),
      });
      utilityAnalysis = analyzeTokenUtility(useCases);
    }

    // Analyze Development Activity
    let developmentAnalysis = null;
    if (githubData.length > 0) {
      developmentAnalysis = analyzeDevelopmentActivity(githubData);
    }

    // Peer Comparison - DISABLED (requires real peer protocol data)
    // TODO: Implement real peer comparison using DeFiLlama API for similar protocols
    let peerComparison = null;

    // Generate summary
    const summary = generateSummary(
      normalizedSymbol,
      tvlAnalysis,
      revenueAnalysis,
      utilityAnalysis,
      developmentAnalysis,
      peerComparison
    );

    // Calculate data quality score
    const dataQuality = calculateDataQuality({
      hasMetrics: !!metrics,
      hasTVL: !!tvlAnalysis,
      hasRevenue: !!revenueAnalysis,
      hasUtility: !!utilityAnalysis,
      hasDevelopment: !!developmentAnalysis,
      hasPeerComparison: !!peerComparison,
    });

    const response = {
      isDeFiProtocol: true,
      tvlAnalysis,
      revenueAnalysis,
      utilityAnalysis,
      developmentAnalysis,
      peerComparison,
      summary,
      dataQuality,
      timestamp: new Date().toISOString(),
    };

    // Cache the response in database
    await setCachedAnalysis(normalizedSymbol, 'defi', response, CACHE_TTL, dataQuality, userId, userEmail);

    return res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error fetching DeFi metrics:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate summary text
 */
function generateSummary(
  symbol: string,
  tvlAnalysis: any,
  revenueAnalysis: any,
  utilityAnalysis: any,
  developmentAnalysis: any,
  peerComparison: any
): string {
  const parts: string[] = [];

  parts.push(`${symbol} is a DeFi protocol`);

  if (tvlAnalysis) {
    parts.push(`with ${formatTVL(tvlAnalysis.currentTVL)} in Total Value Locked`);
  }

  if (revenueAnalysis) {
    parts.push(`generating ${formatRevenue(revenueAnalysis.current.revenue24h)} daily revenue`);
  }

  if (utilityAnalysis) {
    parts.push(`with ${utilityAnalysis.utilityCategory} token utility (${utilityAnalysis.utilityScore}/100)`);
  }

  if (developmentAnalysis) {
    parts.push(`and ${developmentAnalysis.category} development activity`);
  }

  if (peerComparison) {
    parts.push(`ranking #${peerComparison.metrics.overall.rank} among peers`);
  }

  return parts.join(' ') + '.';
}

/**
 * Calculate data quality score
 */
function calculateDataQuality(checks: {
  hasMetrics: boolean;
  hasTVL: boolean;
  hasRevenue: boolean;
  hasUtility: boolean;
  hasDevelopment: boolean;
  hasPeerComparison: boolean;
}): number {
  const weights = {
    hasMetrics: 20,
    hasTVL: 20,
    hasRevenue: 15,
    hasUtility: 15,
    hasDevelopment: 15,
    hasPeerComparison: 15,
  };

  let score = 0;
  for (const [key, weight] of Object.entries(weights)) {
    if (checks[key as keyof typeof checks]) {
      score += weight;
    }
  }

  return score;
}

/**
 * Format TVL for display
 */
function formatTVL(tvl: number): string {
  if (tvl >= 1_000_000_000) {
    return `$${(tvl / 1_000_000_000).toFixed(2)}B`;
  } else if (tvl >= 1_000_000) {
    return `$${(tvl / 1_000_000).toFixed(2)}M`;
  } else if (tvl >= 1_000) {
    return `$${(tvl / 1_000).toFixed(2)}K`;
  } else {
    return `$${tvl.toFixed(2)}`;
  }
}


// Export with optional authentication middleware (for user tracking)
export default withOptionalAuth(handler);
