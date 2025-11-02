/**
 * DeFi Metrics Panel Component
 * 
 * Displays comprehensive DeFi protocol metrics including TVL, revenue,
 * token utility, development activity, and peer comparison.
 * 
 * Requirements: 18.1, 18.2, 18.3, 18.4, 18.5
 */

import React from 'react';
import { TVLAnalysis } from '../../lib/ucie/tvlAnalysis';
import { RevenueAnalysis } from '../../lib/ucie/protocolRevenue';
import { TokenUtilityAnalysis } from '../../lib/ucie/tokenUtility';
import { DevelopmentAnalysis } from '../../lib/ucie/developmentActivity';
import { PeerComparisonAnalysis } from '../../lib/ucie/peerComparison';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface DeFiMetricsPanelProps {
  symbol: string;
  tvlAnalysis: TVLAnalysis | null;
  revenueAnalysis: RevenueAnalysis | null;
  utilityAnalysis: TokenUtilityAnalysis | null;
  developmentAnalysis: DevelopmentAnalysis | null;
  peerComparison: PeerComparisonAnalysis | null;
  loading?: boolean;
  error?: string | null;
}

// ============================================================================
// Main Component
// ============================================================================

export default function DeFiMetricsPanel({
  symbol,
  tvlAnalysis,
  revenueAnalysis,
  utilityAnalysis,
  developmentAnalysis,
  peerComparison,
  loading = false,
  error = null,
}: DeFiMetricsPanelProps) {
  // Loading state
  if (loading) {
    return (
      <div className="bitcoin-block">
        <h2 className="text-2xl font-bold text-bitcoin-white mb-4">
          DeFi Protocol Metrics
        </h2>
        <div className="flex items-center justify-center py-12">
          <div className="text-bitcoin-white-60">Loading DeFi metrics...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bitcoin-block">
        <h2 className="text-2xl font-bold text-bitcoin-white mb-4">
          DeFi Protocol Metrics
        </h2>
        <div className="text-bitcoin-white-60 py-8 text-center">
          {error}
        </div>
      </div>
    );
  }

  // No DeFi data available
  if (!tvlAnalysis && !revenueAnalysis && !utilityAnalysis) {
    return (
      <div className="bitcoin-block">
        <h2 className="text-2xl font-bold text-bitcoin-white mb-4">
          DeFi Protocol Metrics
        </h2>
        <div className="text-bitcoin-white-60 py-8 text-center">
          This token is not identified as a DeFi protocol or DeFi data is unavailable.
        </div>
      </div>
    );
  }

  return (
    <div className="bitcoin-block">
      <h2 className="text-2xl font-bold text-bitcoin-white mb-6">
        DeFi Protocol Metrics
      </h2>

      <div className="space-y-6">
        {/* TVL Section */}
        {tvlAnalysis && <TVLSection analysis={tvlAnalysis} />}

        {/* Revenue Section */}
        {revenueAnalysis && <RevenueSection analysis={revenueAnalysis} />}

        {/* Token Utility Section */}
        {utilityAnalysis && <UtilitySection analysis={utilityAnalysis} />}

        {/* Development Activity Section */}
        {developmentAnalysis && <DevelopmentSection analysis={developmentAnalysis} />}

        {/* Peer Comparison Section */}
        {peerComparison && <PeerComparisonSection analysis={peerComparison} />}
      </div>
    </div>
  );
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * TVL Section Component
 */
function TVLSection({ analysis }: { analysis: TVLAnalysis }) {
  const { currentTVL, tvlChange7d, tvlTrend, tvlByChain, tvlCategory, dominantChain } = analysis;

  return (
    <div className="border-t border-bitcoin-orange-20 pt-6">
      <h3 className="text-xl font-bold text-bitcoin-orange mb-4">
        Total Value Locked (TVL)
      </h3>

      {/* TVL Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="stat-card">
          <p className="stat-label">Current TVL</p>
          <p className="stat-value-orange">
            {formatTVL(currentTVL)}
          </p>
        </div>

        <div className="stat-card">
          <p className="stat-label">7-Day Change</p>
          <p className={`stat-value ${tvlChange7d >= 0 ? 'text-bitcoin-orange' : 'text-bitcoin-white'}`}>
            {tvlChange7d >= 0 ? '+' : ''}{tvlChange7d.toFixed(2)}%
          </p>
        </div>

        <div className="stat-card">
          <p className="stat-label">Trend</p>
          <p className="stat-value text-bitcoin-white">
            {tvlTrend.charAt(0).toUpperCase() + tvlTrend.slice(1)}
          </p>
        </div>
      </div>

      {/* TVL by Chain */}
      {tvlByChain.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-bitcoin-white-80 mb-2">
            TVL Distribution by Chain
          </h4>
          <div className="space-y-2">
            {tvlByChain.slice(0, 5).map((chain) => (
              <div key={chain.chain} className="flex items-center justify-between">
                <span className="text-bitcoin-white-80">{chain.chain}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-bitcoin-black border border-bitcoin-orange-20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-bitcoin-orange"
                      style={{ width: `${Math.min(100, chain.percentage)}%` }}
                    />
                  </div>
                  <span className="text-bitcoin-white-60 text-sm w-16 text-right">
                    {chain.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TVL Category */}
      <div className="mt-4 text-bitcoin-white-60 text-sm">
        Category: <span className="text-bitcoin-white">{tvlCategory.toUpperCase()}</span>
        {' • '}
        Dominant Chain: <span className="text-bitcoin-white">{dominantChain}</span>
      </div>
    </div>
  );
}

/**
 * Revenue Section Component
 */
function RevenueSection({ analysis }: { analysis: RevenueAnalysis }) {
  const { current, projection, revenueCategory, sustainability } = analysis;

  return (
    <div className="border-t border-bitcoin-orange-20 pt-6">
      <h3 className="text-xl font-bold text-bitcoin-orange mb-4">
        Protocol Revenue & Fees
      </h3>

      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="stat-card">
          <p className="stat-label">Daily Revenue</p>
          <p className="stat-value-orange">
            {formatRevenue(current.revenue24h)}
          </p>
        </div>

        <div className="stat-card">
          <p className="stat-label">Annualized Revenue</p>
          <p className="stat-value text-bitcoin-white">
            {formatRevenue(projection.annualizedRevenue)}
          </p>
        </div>

        <div className="stat-card">
          <p className="stat-label">Holder Value Capture</p>
          <p className="stat-value text-bitcoin-white">
            {current.holderValueCapture.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Revenue Projections */}
      <div className="mt-4">
        <h4 className="text-sm font-semibold text-bitcoin-white-80 mb-2">
          Revenue Projections
        </h4>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <p className="text-bitcoin-white-60">1 Year</p>
            <p className="text-bitcoin-white">{formatRevenue(projection.projectedRevenue1y)}</p>
          </div>
          <div>
            <p className="text-bitcoin-white-60">2 Years</p>
            <p className="text-bitcoin-white">{formatRevenue(projection.projectedRevenue2y)}</p>
          </div>
          <div>
            <p className="text-bitcoin-white-60">5 Years</p>
            <p className="text-bitcoin-white">{formatRevenue(projection.projectedRevenue5y)}</p>
          </div>
        </div>
      </div>

      {/* Sustainability */}
      <div className="mt-4 text-bitcoin-white-60 text-sm">
        Category: <span className="text-bitcoin-white">{revenueCategory.toUpperCase().replace('_', ' ')}</span>
        {' • '}
        Sustainability: <span className="text-bitcoin-white">{sustainability.toUpperCase()}</span>
      </div>
    </div>
  );
}

/**
 * Utility Section Component
 */
function UtilitySection({ analysis }: { analysis: TokenUtilityAnalysis }) {
  const { utilityScore, utilityCategory, useCases, primaryUtility } = analysis;

  return (
    <div className="border-t border-bitcoin-orange-20 pt-6">
      <h3 className="text-xl font-bold text-bitcoin-orange mb-4">
        Token Utility Analysis
      </h3>

      {/* Utility Score */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="stat-card">
          <p className="stat-label">Utility Score</p>
          <p className="stat-value-orange">
            {utilityScore}/100
          </p>
        </div>

        <div className="stat-card">
          <p className="stat-label">Category</p>
          <p className="stat-value text-bitcoin-white">
            {utilityCategory.charAt(0).toUpperCase() + utilityCategory.slice(1)}
          </p>
        </div>
      </div>

      {/* Primary Utility */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-bitcoin-white-80 mb-2">
          Primary Use Case
        </h4>
        <p className="text-bitcoin-white">{primaryUtility}</p>
      </div>

      {/* Use Cases */}
      {useCases.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-bitcoin-white-80 mb-2">
            All Use Cases
          </h4>
          <div className="space-y-2">
            {useCases.filter(uc => uc.active).map((useCase, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-bitcoin-orange mt-1">•</span>
                <div className="flex-1">
                  <p className="text-bitcoin-white text-sm">{useCase.description}</p>
                  <p className="text-bitcoin-white-60 text-xs">
                    {useCase.type.toUpperCase()} • {useCase.importance.toUpperCase()} importance
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Development Section Component
 */
function DevelopmentSection({ analysis }: { analysis: DevelopmentAnalysis }) {
  const { metrics, category, strengths, concerns } = analysis;

  return (
    <div className="border-t border-bitcoin-orange-20 pt-6">
      <h3 className="text-xl font-bold text-bitcoin-orange mb-4">
        Development Activity
      </h3>

      {/* Development Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="stat-card">
          <p className="stat-label">Commits (30d)</p>
          <p className="stat-value-orange">
            {metrics.commits30d}
          </p>
        </div>

        <div className="stat-card">
          <p className="stat-label">Active Developers</p>
          <p className="stat-value text-bitcoin-white">
            {metrics.activeDevelopers}
          </p>
        </div>

        <div className="stat-card">
          <p className="stat-label">Health Score</p>
          <p className="stat-value text-bitcoin-white">
            {metrics.healthScore}/100
          </p>
        </div>
      </div>

      {/* Strengths */}
      {strengths.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-bitcoin-white-80 mb-2">
            Strengths
          </h4>
          <ul className="space-y-1">
            {strengths.map((strength, index) => (
              <li key={index} className="text-bitcoin-white-80 text-sm flex items-start gap-2">
                <span className="text-bitcoin-orange">✓</span>
                {strength}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Concerns */}
      {concerns.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-bitcoin-white-80 mb-2">
            Concerns
          </h4>
          <ul className="space-y-1">
            {concerns.map((concern, index) => (
              <li key={index} className="text-bitcoin-white-60 text-sm flex items-start gap-2">
                <span className="text-bitcoin-white">⚠</span>
                {concern}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Category */}
      <div className="mt-4 text-bitcoin-white-60 text-sm">
        Activity Level: <span className="text-bitcoin-white">{category.toUpperCase().replace('_', ' ')}</span>
        {' • '}
        Trend: <span className="text-bitcoin-white">{metrics.developmentTrend.toUpperCase()}</span>
      </div>
    </div>
  );
}

/**
 * Peer Comparison Section Component
 */
function PeerComparisonSection({ analysis }: { analysis: PeerComparisonAnalysis }) {
  const { metrics, peers, summary } = analysis;

  return (
    <div className="border-t border-bitcoin-orange-20 pt-6">
      <h3 className="text-xl font-bold text-bitcoin-orange mb-4">
        Peer Comparison
      </h3>

      {/* Overall Ranking */}
      <div className="mb-4 p-4 bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg">
        <p className="text-bitcoin-white-80 text-sm mb-2">Overall Performance</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-bitcoin-orange">
              #{metrics.overall.rank}
            </p>
            <p className="text-bitcoin-white-60 text-xs">
              out of {peers.length + 1} protocols
            </p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-bitcoin-white">
              {metrics.overall.percentile}th
            </p>
            <p className="text-bitcoin-white-60 text-xs">percentile</p>
          </div>
        </div>
      </div>

      {/* Metric Rankings */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="stat-card">
          <p className="stat-label">TVL Rank</p>
          <p className="stat-value text-bitcoin-white">
            #{metrics.tvl.rank}
          </p>
          <p className="text-bitcoin-white-60 text-xs">
            {metrics.tvl.percentile}th percentile
          </p>
        </div>

        <div className="stat-card">
          <p className="stat-label">Revenue Rank</p>
          <p className="stat-value text-bitcoin-white">
            #{metrics.revenue.rank}
          </p>
          <p className="text-bitcoin-white-60 text-xs">
            {metrics.revenue.percentile}th percentile
          </p>
        </div>

        <div className="stat-card">
          <p className="stat-label">Utility Rank</p>
          <p className="stat-value text-bitcoin-white">
            #{metrics.utility.rank}
          </p>
          <p className="text-bitcoin-white-60 text-xs">
            {metrics.utility.percentile}th percentile
          </p>
        </div>

        <div className="stat-card">
          <p className="stat-label">Dev Rank</p>
          <p className="stat-value text-bitcoin-white">
            #{metrics.development.rank}
          </p>
          <p className="text-bitcoin-white-60 text-xs">
            {metrics.development.percentile}th percentile
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-4 p-4 bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg">
        <p className="text-bitcoin-white-80 text-sm">{summary}</p>
      </div>

      {/* Top Peers */}
      {peers.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-bitcoin-white-80 mb-2">
            Top Competitors
          </h4>
          <div className="space-y-2">
            {peers.slice(0, 5).map((peer, index) => (
              <div key={peer.symbol} className="flex items-center justify-between text-sm">
                <span className="text-bitcoin-white-80">
                  {index + 1}. {peer.name} ({peer.symbol})
                </span>
                <span className="text-bitcoin-white-60">
                  {formatTVL(peer.tvl)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

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

function formatRevenue(revenue: number): string {
  if (revenue >= 1_000_000_000) {
    return `$${(revenue / 1_000_000_000).toFixed(2)}B`;
  } else if (revenue >= 1_000_000) {
    return `$${(revenue / 1_000_000).toFixed(2)}M`;
  } else if (revenue >= 1_000) {
    return `$${(revenue / 1_000).toFixed(2)}K`;
  } else {
    return `$${revenue.toFixed(2)}`;
  }
}
