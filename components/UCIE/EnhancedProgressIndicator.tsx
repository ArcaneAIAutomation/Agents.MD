/**
 * Enhanced Progress Indicator Component
 * 
 * Displays detailed real-time progress during UCIE Phase 1 data collection
 * with visual feedback for each data source.
 * 
 * Features:
 * - Circular progress ring (0-100%)
 * - Current step description
 * - Estimated time remaining
 * - Data source checklist with status icons
 * - Quality scores for each source
 */

import React from 'react';
import { 
  CheckCircle, 
  Loader2, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Activity,
  BarChart3,
  Newspaper,
  Link as LinkIcon
} from 'lucide-react';

export interface DataSourceStatus {
  name: string;
  type: 'market-data' | 'sentiment' | 'technical' | 'news' | 'on-chain';
  status: 'pending' | 'loading' | 'complete' | 'error';
  quality: number | null;
  timestamp: string | null;
}

interface EnhancedProgressIndicatorProps {
  progress: number; // 0-100
  currentStep: string;
  estimatedTimeRemaining: number; // seconds
  dataSources: DataSourceStatus[];
}

// Icon mapping for data sources
const getDataSourceIcon = (type: string) => {
  switch (type) {
    case 'market-data':
      return <TrendingUp className="w-5 h-5" />;
    case 'sentiment':
      return <Activity className="w-5 h-5" />;
    case 'technical':
      return <BarChart3 className="w-5 h-5" />;
    case 'news':
      return <Newspaper className="w-5 h-5" />;
    case 'on-chain':
      return <LinkIcon className="w-5 h-5" />;
    default:
      return <Clock className="w-5 h-5" />;
  }
};

export default function EnhancedProgressIndicator({
  progress,
  currentStep,
  estimatedTimeRemaining,
  dataSources
}: EnhancedProgressIndicatorProps) {
  // Calculate circumference for progress circle
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress / 100);

  return (
    <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-6 md:p-8">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-bitcoin-white mb-2">
          Phase 1: Data Collection
        </h2>
        <p className="text-bitcoin-white-60 text-sm">
          Gathering intelligence from 9 data sources
        </p>
      </div>

      {/* Circular Progress Ring */}
      <div className="flex justify-center mb-6">
        <div className="relative w-32 h-32 md:w-40 md:h-40">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="50%"
              cy="50%"
              r={radius}
              stroke="rgba(247, 147, 26, 0.2)"
              strokeWidth="8"
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx="50%"
              cy="50%"
              r={radius}
              stroke="#F7931A"
              strokeWidth="8"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-500 ease-out"
              strokeLinecap="round"
            />
          </svg>
          {/* Progress percentage */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl md:text-4xl font-bold text-bitcoin-orange font-mono">
              {Math.round(progress)}%
            </span>
            <span className="text-xs text-bitcoin-white-60 mt-1">
              Complete
            </span>
          </div>
        </div>
      </div>

      {/* Current Step */}
      <div className="text-center mb-6">
        <p className="text-lg md:text-xl font-semibold text-bitcoin-white mb-2">
          {currentStep}
        </p>
        <div className="flex items-center justify-center gap-2 text-bitcoin-white-60">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-mono">
            {estimatedTimeRemaining > 0 
              ? `${estimatedTimeRemaining}s remaining`
              : 'Finalizing...'}
          </span>
        </div>
      </div>

      {/* Data Sources Checklist */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-bitcoin-white-60 uppercase tracking-wider mb-3">
          Data Sources
        </h3>
        {dataSources.map((source, index) => (
          <div 
            key={index}
            className={`
              flex items-center justify-between 
              bg-bitcoin-black border rounded-lg p-3
              transition-all duration-300
              ${source.status === 'complete' 
                ? 'border-bitcoin-orange' 
                : 'border-bitcoin-orange-20'}
            `}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Status Icon */}
              <div className={`
                flex-shrink-0
                ${source.status === 'complete' ? 'text-bitcoin-orange' : ''}
                ${source.status === 'loading' ? 'text-bitcoin-orange' : ''}
                ${source.status === 'pending' ? 'text-bitcoin-white-60' : ''}
                ${source.status === 'error' ? 'text-bitcoin-white-60' : ''}
              `}>
                {source.status === 'complete' && (
                  <CheckCircle className="w-5 h-5" />
                )}
                {source.status === 'loading' && (
                  <Loader2 className="w-5 h-5 animate-spin" />
                )}
                {source.status === 'pending' && (
                  <Clock className="w-5 h-5" />
                )}
                {source.status === 'error' && (
                  <AlertCircle className="w-5 h-5" />
                )}
              </div>

              {/* Data Source Icon */}
              <div className={`
                flex-shrink-0
                ${source.status === 'complete' ? 'text-bitcoin-orange' : 'text-bitcoin-white-60'}
              `}>
                {getDataSourceIcon(source.type)}
              </div>

              {/* Source Name */}
              <span className={`
                font-medium truncate
                ${source.status === 'complete' ? 'text-bitcoin-white' : 'text-bitcoin-white-80'}
              `}>
                {source.name}
              </span>
            </div>

            {/* Quality Score */}
            {source.quality !== null && (
              <div className="flex-shrink-0 ml-2">
                <span className={`
                  text-sm font-mono font-semibold px-2 py-1 rounded
                  ${source.quality >= 90 
                    ? 'text-bitcoin-orange bg-bitcoin-orange-10' 
                    : source.quality >= 70
                    ? 'text-bitcoin-white bg-bitcoin-orange-10'
                    : 'text-bitcoin-white-60 bg-bitcoin-orange-5'}
                `}>
                  {source.quality}%
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Overall Status Message */}
      <div className="mt-6 text-center">
        <p className="text-sm text-bitcoin-white-60">
          {progress < 100 
            ? 'Collecting data from multiple sources...'
            : 'Data collection complete! Preparing preview...'}
        </p>
      </div>
    </div>
  );
}
