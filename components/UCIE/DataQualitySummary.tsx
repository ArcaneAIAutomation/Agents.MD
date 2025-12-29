import React, { useState } from 'react';
import { DataQualitySummary as DataQualitySummaryType } from '../../lib/ucie/veritas/types/validationTypes';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface DataQualitySummaryProps {
  dataQuality: DataQualitySummaryType;
  className?: string;
}

export default function DataQualitySummary({
  dataQuality,
  className = ''
}: DataQualitySummaryProps) {
  const [expanded, setExpanded] = useState(false);

  // Don't render if no data quality info
  if (!dataQuality) return null;

  const {
    overallScore,
    marketDataQuality,
    socialDataQuality,
    onChainDataQuality,
    newsDataQuality,
    passedChecks,
    failedChecks
  } = dataQuality;

  // Determine overall quality level
  const getQualityLevel = (score: number): { label: string; color: string } => {
    if (score >= 90) return { label: 'Excellent', color: 'text-green-400' };
    if (score >= 80) return { label: 'Very Good', color: 'text-green-300' };
    if (score >= 70) return { label: 'Good', color: 'text-yellow-400' };
    if (score >= 60) return { label: 'Fair', color: 'text-orange-400' };
    return { label: 'Poor', color: 'text-red-400' };
  };

  const qualityLevel = getQualityLevel(overallScore);

  return (
    <div className={`bitcoin-block ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-bitcoin-white">
          Data Quality Summary
        </h3>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-bitcoin-orange hover:text-bitcoin-white transition-colors text-sm font-semibold"
        >
          {expanded ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      {/* Overall Score */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-bitcoin-white-60 text-sm">Overall Quality</span>
          <span className={`font-bold text-lg ${qualityLevel.color}`}>
            {overallScore}/100 - {qualityLevel.label}
          </span>
        </div>
        <div className="w-full h-3 bg-bitcoin-black rounded-full overflow-hidden border border-bitcoin-orange-20">
          <div
            className="h-full bg-bitcoin-orange transition-all duration-500"
            style={{ width: `${overallScore}%` }}
          />
        </div>
      </div>

      {/* Warning for Low Quality */}
      {overallScore < 70 && (
        <div className="mb-4 p-3 bg-orange-500 bg-opacity-10 border border-orange-500 rounded-lg flex items-start gap-2">
          <AlertTriangle className="text-orange-500 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-orange-400 font-semibold text-sm">
              Data Quality Warning
            </p>
            <p className="text-bitcoin-white-80 text-xs mt-1">
              Analysis reliability is compromised due to data quality issues. Review validation alerts carefully.
            </p>
          </div>
        </div>
      )}

      {/* Data Type Breakdown */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bitcoin-block-subtle p-3">
          <p className="text-bitcoin-white-60 text-xs mb-1">Market Data</p>
          <p className="text-bitcoin-white font-mono text-lg">
            {marketDataQuality}/100
          </p>
        </div>
        <div className="bitcoin-block-subtle p-3">
          <p className="text-bitcoin-white-60 text-xs mb-1">Social Sentiment</p>
          <p className="text-bitcoin-white font-mono text-lg">
            {socialDataQuality}/100
          </p>
        </div>
        <div className="bitcoin-block-subtle p-3">
          <p className="text-bitcoin-white-60 text-xs mb-1">On-Chain Data</p>
          <p className="text-bitcoin-white font-mono text-lg">
            {onChainDataQuality}/100
          </p>
        </div>
        <div className="bitcoin-block-subtle p-3">
          <p className="text-bitcoin-white-60 text-xs mb-1">News Data</p>
          <p className="text-bitcoin-white font-mono text-lg">
            {newsDataQuality}/100
          </p>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="space-y-4 pt-4 border-t border-bitcoin-orange-20">
          {/* Passed Checks */}
          {(passedChecks || []).length > 0 && (
            <div>
              <h4 className="text-bitcoin-white font-semibold mb-2 flex items-center gap-2">
                <CheckCircle className="text-green-400" size={18} />
                Passed Checks ({(passedChecks || []).length})
              </h4>
              <ul className="space-y-1">
                {(passedChecks || []).map((check, index) => (
                  <li
                    key={index}
                    className="text-bitcoin-white-80 text-sm flex items-start gap-2"
                  >
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span>{formatCheckName(check)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Failed Checks */}
          {(failedChecks || []).length > 0 && (
            <div>
              <h4 className="text-bitcoin-white font-semibold mb-2 flex items-center gap-2">
                <XCircle className="text-red-400" size={18} />
                Failed Checks ({(failedChecks || []).length})
              </h4>
              <ul className="space-y-1">
                {(failedChecks || []).map((check, index) => (
                  <li
                    key={index}
                    className="text-bitcoin-white-80 text-sm flex items-start gap-2"
                  >
                    <span className="text-red-400 mt-0.5">✗</span>
                    <span>{formatCheckName(check)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Summary Stats */}
          <div className="pt-4 border-t border-bitcoin-orange-20">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-bitcoin-white-60 text-xs mb-1">Total Checks</p>
                <p className="text-bitcoin-white font-mono text-xl">
                  {(passedChecks || []).length + (failedChecks || []).length}
                </p>
              </div>
              <div>
                <p className="text-bitcoin-white-60 text-xs mb-1">Passed</p>
                <p className="text-green-400 font-mono text-xl">
                  {(passedChecks || []).length}
                </p>
              </div>
              <div>
                <p className="text-bitcoin-white-60 text-xs mb-1">Failed</p>
                <p className="text-red-400 font-mono text-xl">
                  {(failedChecks || []).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to format check names
function formatCheckName(checkName: string): string {
  return checkName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
