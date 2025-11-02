/**
 * Risk Assessment Panel Component for UCIE
 * 
 * Displays comprehensive risk analysis including:
 * - Overall risk score with gauge visualization
 * - Volatility metrics and percentile rankings
 * - Correlation matrix heatmap
 * - Maximum drawdown estimates
 * - Portfolio impact scenarios
 */

import React from 'react';
import { VolatilityMetrics } from '../../lib/ucie/volatilityCalculators';
import { CorrelationMetrics } from '../../lib/ucie/correlationAnalysis';
import { MaxDrawdownMetrics } from '../../lib/ucie/maxDrawdown';
import { RiskScore } from '../../lib/ucie/riskScoring';
import { PortfolioImpactAnalysis } from '../../lib/ucie/portfolioImpact';

export interface RiskAssessmentPanelProps {
  symbol: string;
  riskScore: RiskScore;
  volatilityMetrics: VolatilityMetrics;
  correlationMetrics: CorrelationMetrics;
  maxDrawdownMetrics: MaxDrawdownMetrics;
  portfolioImpact: PortfolioImpactAnalysis;
  loading?: boolean;
  error?: string | null;
}

/**
 * Risk Gauge Component
 * Visual gauge showing risk score 0-100
 */
const RiskGauge: React.FC<{ score: number; category: string }> = ({ score, category }) => {
  // Calculate gauge rotation (-90deg to 90deg)
  const rotation = (score / 100) * 180 - 90;
  
  // Determine color based on category
  const getColor = () => {
    if (score < 30) return '#F7931A'; // Orange for low risk
    if (score < 50) return '#FFFFFF'; // White for medium
    if (score < 75) return '#F7931A'; // Orange for high
    return '#FF4444'; // Red for critical (exception to color rules)
  };
  
  return (
    <div className="relative w-48 h-48 mx-auto">
      {/* Gauge background */}
      <svg className="w-full h-full" viewBox="0 0 200 200">
        {/* Background arc */}
        <path
          d="M 30 170 A 85 85 0 0 1 170 170"
          fill="none"
          stroke="rgba(247, 147, 26, 0.2)"
          strokeWidth="20"
        />
        {/* Colored arc based on score */}
        <path
          d="M 30 170 A 85 85 0 0 1 170 170"
          fill="none"
          stroke={getColor()}
          strokeWidth="20"
          strokeDasharray={`${(score / 100) * 267} 267`}
        />
        {/* Needle */}
        <line
          x1="100"
          y1="100"
          x2="100"
          y2="40"
          stroke={getColor()}
          strokeWidth="3"
          transform={`rotate(${rotation} 100 100)`}
        />
        {/* Center dot */}
        <circle cx="100" cy="100" r="8" fill={getColor()} />
      </svg>
      
      {/* Score display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center mt-12">
        <div className="font-mono text-4xl font-bold text-bitcoin-orange">
          {score}
        </div>
        <div className="text-sm text-bitcoin-white-60 uppercase tracking-wider mt-1">
          {category} Risk
        </div>
      </div>
    </div>
  );
};

/**
 * Correlation Heatmap Component
 */
const CorrelationHeatmap: React.FC<{ correlations: CorrelationMetrics }> = ({ correlations }) => {
  const assets = [
    { name: 'BTC', value: correlations.btc },
    { name: 'ETH', value: correlations.eth },
    { name: 'S&P 500', value: correlations.sp500 },
    { name: 'Gold', value: correlations.gold }
  ];
  
  const getCorrelationColor = (value: number) => {
    const intensity = Math.abs(value);
    if (value > 0) {
      // Positive correlation - orange gradient
      return `rgba(247, 147, 26, ${intensity})`;
    } else {
      // Negative correlation - white gradient
      return `rgba(255, 255, 255, ${intensity * 0.5})`;
    }
  };
  
  return (
    <div className="grid grid-cols-2 gap-3">
      {assets.map((asset) => (
        <div
          key={asset.name}
          className="bitcoin-block-subtle p-4 text-center"
          style={{ backgroundColor: getCorrelationColor(asset.value) }}
        >
          <div className="text-xs text-bitcoin-white-60 uppercase tracking-wider mb-2">
            {asset.name}
          </div>
          <div className="font-mono text-2xl font-bold text-bitcoin-white">
            {asset.value.toFixed(2)}
          </div>
          <div className="text-xs text-bitcoin-white-60 mt-1">
            {asset.value > 0.7 ? 'Strong +' : asset.value > 0.3 ? 'Moderate +' : asset.value > -0.3 ? 'Weak' : asset.value > -0.7 ? 'Moderate -' : 'Strong -'}
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Main Risk Assessment Panel Component
 */
export const RiskAssessmentPanel: React.FC<RiskAssessmentPanelProps> = ({
  symbol,
  riskScore,
  volatilityMetrics,
  correlationMetrics,
  maxDrawdownMetrics,
  portfolioImpact,
  loading = false,
  error = null
}) => {
  if (loading) {
    return (
      <div className="bitcoin-block p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bitcoin-orange mx-auto mb-4"></div>
          <p className="text-bitcoin-white-60">Calculating risk metrics...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bitcoin-block p-8">
        <div className="text-center">
          <p className="text-bitcoin-white mb-2">⚠️ Error Loading Risk Assessment</p>
          <p className="text-bitcoin-white-60 text-sm">{error}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bitcoin-block">
        <h2 className="text-2xl font-bold text-bitcoin-white mb-2">
          Risk Assessment
        </h2>
        <p className="text-bitcoin-white-60 text-sm italic">
          Comprehensive risk analysis for {symbol}
        </p>
      </div>
      
      {/* Overall Risk Score */}
      <div className="bitcoin-block p-8">
        <h3 className="text-xl font-bold text-bitcoin-white mb-6 text-center">
          Overall Risk Score
        </h3>
        <RiskGauge score={riskScore.overall} category={riskScore.category} />
        <p className="text-bitcoin-white-80 text-center mt-6 max-w-md mx-auto">
          {riskScore.explanation}
        </p>
        
        {/* Risk Components */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-8">
          {Object.entries(riskScore.components).map(([key, value]) => (
            <div key={key} className="bitcoin-block-subtle p-3 text-center">
              <div className="text-xs text-bitcoin-white-60 uppercase tracking-wider mb-1">
                {key}
              </div>
              <div className="font-mono text-lg font-bold text-bitcoin-orange">
                {Math.round(value)}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Volatility Metrics */}
      <div className="bitcoin-block p-6">
        <h3 className="text-xl font-bold text-bitcoin-white mb-4">
          Volatility Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bitcoin-block-subtle p-4">
            <div className="text-xs text-bitcoin-white-60 uppercase tracking-wider mb-2">
              30-Day Volatility
            </div>
            <div className="font-mono text-2xl font-bold text-bitcoin-orange">
              {(volatilityMetrics.annualized30d * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-bitcoin-white-60 mt-1">
              Annualized
            </div>
          </div>
          
          <div className="bitcoin-block-subtle p-4">
            <div className="text-xs text-bitcoin-white-60 uppercase tracking-wider mb-2">
              90-Day Volatility
            </div>
            <div className="font-mono text-2xl font-bold text-bitcoin-orange">
              {(volatilityMetrics.annualized90d * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-bitcoin-white-60 mt-1">
              Annualized
            </div>
          </div>
          
          <div className="bitcoin-block-subtle p-4">
            <div className="text-xs text-bitcoin-white-60 uppercase tracking-wider mb-2">
              1-Year Volatility
            </div>
            <div className="font-mono text-2xl font-bold text-bitcoin-orange">
              {(volatilityMetrics.annualized1y * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-bitcoin-white-60 mt-1">
              Annualized
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-bitcoin-white-60 text-sm">Volatility Percentile</span>
            <span className="font-mono text-lg font-bold text-bitcoin-orange">
              {volatilityMetrics.percentile.toFixed(0)}th
            </span>
          </div>
          <div className="text-xs text-bitcoin-white-60 mt-2">
            Category: {volatilityMetrics.volatilityCategory}
          </div>
        </div>
      </div>
      
      {/* Correlation Matrix */}
      <div className="bitcoin-block p-6">
        <h3 className="text-xl font-bold text-bitcoin-white mb-4">
          Correlation Matrix
        </h3>
        <CorrelationHeatmap correlations={correlationMetrics} />
        
        <div className="mt-4 p-4 bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-bitcoin-white-60 text-sm">Diversification Score</span>
            <span className="font-mono text-lg font-bold text-bitcoin-orange">
              {correlationMetrics.diversificationScore}/100
            </span>
          </div>
          <div className="text-xs text-bitcoin-white-60 mt-2">
            {correlationMetrics.diversificationScore > 70 
              ? 'Excellent diversification potential'
              : correlationMetrics.diversificationScore > 50
              ? 'Good diversification potential'
              : 'Limited diversification potential'}
          </div>
        </div>
        
        {/* Regime Changes */}
        {correlationMetrics.regimeChanges.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-bitcoin-white mb-2">
              Recent Correlation Regime Changes
            </h4>
            <div className="space-y-2">
              {correlationMetrics.regimeChanges.slice(0, 3).map((change, idx) => (
                <div key={idx} className="text-xs text-bitcoin-white-60 p-2 bg-bitcoin-black border border-bitcoin-orange-20 rounded">
                  <span className="text-bitcoin-orange">{change.asset}</span>: {change.previousCorrelation.toFixed(2)} → {change.newCorrelation.toFixed(2)} ({change.significance} significance)
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Maximum Drawdown */}
      <div className="bitcoin-block p-6">
        <h3 className="text-xl font-bold text-bitcoin-white mb-4">
          Maximum Drawdown Estimates
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bitcoin-block-subtle p-4">
            <div className="text-xs text-bitcoin-white-60 uppercase tracking-wider mb-2">
              Historical Max DD
            </div>
            <div className="font-mono text-2xl font-bold text-bitcoin-orange">
              {(maxDrawdownMetrics.historical * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-bitcoin-white-60 mt-1">
              {maxDrawdownMetrics.historicalPeriod.duration} days
            </div>
          </div>
          
          <div className="bitcoin-block-subtle p-4">
            <div className="text-xs text-bitcoin-white-60 uppercase tracking-wider mb-2">
              95% Confidence
            </div>
            <div className="font-mono text-2xl font-bold text-bitcoin-orange">
              {(maxDrawdownMetrics.estimated95 * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-bitcoin-white-60 mt-1">
              Monte Carlo
            </div>
          </div>
          
          <div className="bitcoin-block-subtle p-4">
            <div className="text-xs text-bitcoin-white-60 uppercase tracking-wider mb-2">
              99% Confidence
            </div>
            <div className="font-mono text-2xl font-bold text-bitcoin-orange">
              {(maxDrawdownMetrics.estimated99 * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-bitcoin-white-60 mt-1">
              Monte Carlo
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-xs text-bitcoin-white-60">
          Based on {maxDrawdownMetrics.monteCarloResults.iterations.toLocaleString()} Monte Carlo simulations
        </div>
      </div>
      
      {/* Portfolio Impact */}
      <div className="bitcoin-block p-6">
        <h3 className="text-xl font-bold text-bitcoin-white mb-4">
          Portfolio Impact Scenarios
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bitcoin-orange-20">
                <th className="text-left text-bitcoin-white-60 py-2 px-3">Allocation</th>
                <th className="text-right text-bitcoin-white-60 py-2 px-3">Return</th>
                <th className="text-right text-bitcoin-white-60 py-2 px-3">Volatility</th>
                <th className="text-right text-bitcoin-white-60 py-2 px-3">Sharpe</th>
                <th className="text-right text-bitcoin-white-60 py-2 px-3">Max DD</th>
              </tr>
            </thead>
            <tbody>
              {portfolioImpact.allocations.map((scenario, idx) => (
                <tr 
                  key={idx}
                  className={`border-b border-bitcoin-orange-20 ${
                    scenario.percentage === portfolioImpact.optimalAllocation 
                      ? 'bg-bitcoin-orange-10' 
                      : ''
                  }`}
                >
                  <td className="py-2 px-3 font-mono text-bitcoin-white">
                    {scenario.percentage}%
                    {scenario.percentage === portfolioImpact.optimalAllocation && (
                      <span className="ml-2 text-xs text-bitcoin-orange">★ Optimal</span>
                    )}
                  </td>
                  <td className="text-right py-2 px-3 font-mono text-bitcoin-white">
                    {(scenario.expectedReturn * 100).toFixed(1)}%
                  </td>
                  <td className="text-right py-2 px-3 font-mono text-bitcoin-white">
                    {(scenario.volatility * 100).toFixed(1)}%
                  </td>
                  <td className="text-right py-2 px-3 font-mono text-bitcoin-orange">
                    {scenario.sharpeRatio.toFixed(2)}
                  </td>
                  <td className="text-right py-2 px-3 font-mono text-bitcoin-white">
                    {(scenario.maxDrawdown * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Recommendations */}
        <div className="mt-6 space-y-2">
          <h4 className="text-sm font-semibold text-bitcoin-white mb-2">
            Recommendations
          </h4>
          {portfolioImpact.recommendations.map((rec, idx) => (
            <div key={idx} className="text-sm text-bitcoin-white-80 p-3 bg-bitcoin-black border border-bitcoin-orange-20 rounded">
              • {rec}
            </div>
          ))}
        </div>
        
        {portfolioImpact.diversificationBenefit > 0 && (
          <div className="mt-4 p-4 bg-bitcoin-orange-10 border border-bitcoin-orange rounded-lg">
            <div className="text-sm text-bitcoin-white">
              <span className="font-semibold">Diversification Benefit:</span> Adding this asset could reduce portfolio volatility by {portfolioImpact.diversificationBenefit.toFixed(1)}%
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiskAssessmentPanel;
