import React from 'react';
import { ConfidenceScoreBreakdown } from '../../lib/ucie/veritas/types/validationTypes';

interface VeritasConfidenceScoreBadgeProps {
  confidenceScore: ConfidenceScoreBreakdown;
  showBreakdown?: boolean;
  className?: string;
}

export default function VeritasConfidenceScoreBadge({
  confidenceScore,
  showBreakdown = false,
  className = ''
}: VeritasConfidenceScoreBadgeProps) {
  // Don't render if no confidence score
  if (!confidenceScore) return null;

  const { overallScore } = confidenceScore;

  // Determine color and label based on score
  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 80) return 'bg-green-400';
    if (score >= 70) return 'bg-yellow-500';
    if (score >= 60) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Poor';
  };

  const scoreColor = getScoreColor(overallScore);
  const scoreLabel = getScoreLabel(overallScore);

  return (
    <div className={`inline-block ${className}`}>
      {/* Main Badge */}
      <div className="flex items-center gap-2">
        <div
          className={`${scoreColor} text-bitcoin-black px-4 py-2 rounded-lg font-bold text-lg`}
          title={`Veritas Confidence Score: ${overallScore}/100`}
        >
          {overallScore}/100
        </div>
        <span className="text-bitcoin-white-80 font-semibold">
          {scoreLabel}
        </span>
      </div>

      {/* Breakdown (Optional) */}
      {showBreakdown && (
        <div className="mt-4 bitcoin-block-subtle p-4">
          <h4 className="text-bitcoin-white font-bold mb-3">Score Breakdown</h4>
          
          <div className="space-y-2">
            {/* Data Source Agreement (40%) */}
            <div className="flex justify-between items-center">
              <span className="text-bitcoin-white-60 text-sm">
                Data Source Agreement (40%)
              </span>
              <span className="text-bitcoin-white font-mono">
                {confidenceScore.dataSourceAgreement}/100
              </span>
            </div>

            {/* Logical Consistency (30%) */}
            <div className="flex justify-between items-center">
              <span className="text-bitcoin-white-60 text-sm">
                Logical Consistency (30%)
              </span>
              <span className="text-bitcoin-white font-mono">
                {confidenceScore.logicalConsistency}/100
              </span>
            </div>

            {/* Cross-Validation Success (20%) */}
            <div className="flex justify-between items-center">
              <span className="text-bitcoin-white-60 text-sm">
                Cross-Validation Success (20%)
              </span>
              <span className="text-bitcoin-white font-mono">
                {confidenceScore.crossValidationSuccess}/100
              </span>
            </div>

            {/* Completeness (10%) */}
            <div className="flex justify-between items-center">
              <span className="text-bitcoin-white-60 text-sm">
                Data Completeness (10%)
              </span>
              <span className="text-bitcoin-white font-mono">
                {confidenceScore.completeness}/100
              </span>
            </div>
          </div>

          {/* Individual Data Type Scores */}
          <div className="mt-4 pt-4 border-t border-bitcoin-orange-20">
            <h5 className="text-bitcoin-white-80 font-semibold text-sm mb-2">
              Data Type Scores
            </h5>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex justify-between">
                <span className="text-bitcoin-white-60 text-xs">Market:</span>
                <span className="text-bitcoin-white text-xs font-mono">
                  {confidenceScore.breakdown.marketData}/100
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-bitcoin-white-60 text-xs">Social:</span>
                <span className="text-bitcoin-white text-xs font-mono">
                  {confidenceScore.breakdown.socialSentiment}/100
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-bitcoin-white-60 text-xs">On-Chain:</span>
                <span className="text-bitcoin-white text-xs font-mono">
                  {confidenceScore.breakdown.onChainData}/100
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-bitcoin-white-60 text-xs">News:</span>
                <span className="text-bitcoin-white text-xs font-mono">
                  {confidenceScore.breakdown.newsData}/100
                </span>
              </div>
            </div>
          </div>

          {/* Source Weights (if available) */}
          {confidenceScore.sourceWeights && Object.keys(confidenceScore.sourceWeights).length > 0 && (
            <div className="mt-4 pt-4 border-t border-bitcoin-orange-20">
              <h5 className="text-bitcoin-white-80 font-semibold text-sm mb-2">
                Source Trust Weights
              </h5>
              <div className="space-y-1">
                {Object.entries(confidenceScore.sourceWeights).map(([source, weight]) => (
                  <div key={source} className="flex justify-between items-center">
                    <span className="text-bitcoin-white-60 text-xs">{source}:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-bitcoin-black rounded-full overflow-hidden">
                        <div
                          className="h-full bg-bitcoin-orange"
                          style={{ width: `${weight * 100}%` }}
                        />
                      </div>
                      <span className="text-bitcoin-white text-xs font-mono w-8">
                        {(weight * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
