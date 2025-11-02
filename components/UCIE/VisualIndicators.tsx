import React from 'react';

/**
 * Signal strength indicator (Bullish/Bearish/Neutral)
 */
interface SignalIndicatorProps {
  signal: 'bullish' | 'bearish' | 'neutral';
  strength?: number; // 0-100
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function SignalIndicator({ signal, strength = 50, label, size = 'md' }: SignalIndicatorProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };

  const getColor = () => {
    if (signal === 'bullish') return 'bg-bitcoin-orange text-bitcoin-black';
    if (signal === 'bearish') return 'bg-bitcoin-white-60 text-bitcoin-black';
    return 'bg-bitcoin-white text-bitcoin-black';
  };

  const getIcon = () => {
    if (signal === 'bullish') {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      );
    }
    if (signal === 'bearish') {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
      </svg>
    );
  };

  return (
    <div className="inline-flex flex-col gap-1">
      <div className={`inline-flex items-center gap-2 rounded-full font-semibold ${sizeClasses[size]} ${getColor()}`}>
        {getIcon()}
        <span>{label || signal.charAt(0).toUpperCase() + signal.slice(1)}</span>
        {strength !== undefined && (
          <span className="opacity-80">({strength}%)</span>
        )}
      </div>
    </div>
  );
}

/**
 * Confidence score indicator
 */
interface ConfidenceIndicatorProps {
  score: number; // 0-100
  label?: string;
  showBar?: boolean;
}

export function ConfidenceIndicator({ score, label = 'Confidence', showBar = true }: ConfidenceIndicatorProps) {
  const getColor = () => {
    if (score >= 80) return 'text-bitcoin-orange';
    if (score >= 60) return 'text-bitcoin-white';
    if (score >= 40) return 'text-bitcoin-white-80';
    return 'text-bitcoin-white-60';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-bitcoin-white-60">{label}</span>
        <span className={`text-lg font-bold ${getColor()}`}>
          {score}%
        </span>
      </div>
      {showBar && (
        <div className="w-full bg-bitcoin-white-60 bg-opacity-20 rounded-full h-2">
          <div
            className="bg-bitcoin-orange h-2 rounded-full transition-all duration-500"
            style={{ width: `${score}%` }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Loading skeleton for better perceived performance
 */
interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export function Skeleton({ width = '100%', height = '1rem', className = '', variant = 'rectangular' }: SkeletonProps) {
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg'
  };

  return (
    <div
      className={`bg-bitcoin-white-60 bg-opacity-10 animate-pulse ${variantClasses[variant]} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

/**
 * Progress indicator for long operations
 */
interface ProgressIndicatorProps {
  progress: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  phases?: string[];
  currentPhase?: number;
}

export function ProgressIndicator({
  progress,
  label = 'Loading',
  showPercentage = true,
  phases,
  currentPhase
}: ProgressIndicatorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-bitcoin-white">
          {label}
        </span>
        {showPercentage && (
          <span className="text-sm text-bitcoin-orange font-mono">
            {progress}%
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full bg-bitcoin-white-60 bg-opacity-20 rounded-full h-3 overflow-hidden">
        <div
          className="bg-bitcoin-orange h-3 rounded-full transition-all duration-300 relative overflow-hidden"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-bitcoin-white via-opacity-30 to-transparent animate-shimmer" />
        </div>
      </div>

      {/* Phase indicators */}
      {phases && currentPhase !== undefined && (
        <div className="flex items-center gap-2">
          {phases.map((phase, index) => (
            <div
              key={index}
              className={`flex-1 text-xs text-center py-1 rounded transition-all ${
                index === currentPhase
                  ? 'bg-bitcoin-orange text-bitcoin-black font-semibold'
                  : index < currentPhase
                  ? 'bg-bitcoin-orange bg-opacity-30 text-bitcoin-white-80'
                  : 'bg-bitcoin-white-60 bg-opacity-10 text-bitcoin-white-60'
              }`}
            >
              {phase}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Status badge
 */
interface StatusBadgeProps {
  status: 'success' | 'warning' | 'error' | 'info';
  label: string;
  icon?: boolean;
}

export function StatusBadge({ status, label, icon = true }: StatusBadgeProps) {
  const getStyles = () => {
    switch (status) {
      case 'success':
        return 'bg-bitcoin-orange text-bitcoin-black';
      case 'warning':
        return 'bg-bitcoin-white text-bitcoin-black';
      case 'error':
        return 'bg-bitcoin-white-60 text-bitcoin-black';
      case 'info':
        return 'bg-bitcoin-orange-20 text-bitcoin-orange border border-bitcoin-orange';
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'success':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${getStyles()}`}>
      {icon && getIcon()}
      {label}
    </span>
  );
}

/**
 * Trend indicator (up/down/stable)
 */
interface TrendIndicatorProps {
  value: number;
  previousValue?: number;
  format?: (value: number) => string;
  showPercentage?: boolean;
}

export function TrendIndicator({ value, previousValue, format, showPercentage = true }: TrendIndicatorProps) {
  const change = previousValue ? ((value - previousValue) / previousValue) * 100 : 0;
  const isPositive = change > 0;
  const isNeutral = Math.abs(change) < 0.01;

  const formattedValue = format ? format(value) : value.toLocaleString();

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-lg font-bold text-bitcoin-white">
        {formattedValue}
      </span>
      {!isNeutral && (
        <div className={`flex items-center gap-1 ${isPositive ? 'text-bitcoin-orange' : 'text-bitcoin-white-60'}`}>
          {isPositive ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          )}
          {showPercentage && (
            <span className="text-sm font-semibold">
              {isPositive ? '+' : ''}{change.toFixed(2)}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Data quality indicator
 */
interface DataQualityProps {
  score: number; // 0-100
  sources: number;
  lastUpdate?: string;
}

export function DataQualityIndicator({ score, sources, lastUpdate }: DataQualityProps) {
  const getQualityLabel = () => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Limited';
  };

  const getQualityColor = () => {
    if (score >= 90) return 'text-bitcoin-orange';
    if (score >= 75) return 'text-bitcoin-white';
    if (score >= 60) return 'text-bitcoin-white-80';
    return 'text-bitcoin-white-60';
  };

  return (
    <div className="inline-flex items-center gap-3 bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg px-4 py-2">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-bitcoin-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <div className="text-xs text-bitcoin-white-60">Data Quality</div>
          <div className={`text-sm font-bold ${getQualityColor()}`}>
            {getQualityLabel()} ({score}%)
          </div>
        </div>
      </div>
      <div className="h-8 w-px bg-bitcoin-orange-20" />
      <div>
        <div className="text-xs text-bitcoin-white-60">Sources</div>
        <div className="text-sm font-bold text-bitcoin-white">{sources}</div>
      </div>
      {lastUpdate && (
        <>
          <div className="h-8 w-px bg-bitcoin-orange-20" />
          <div>
            <div className="text-xs text-bitcoin-white-60">Updated</div>
            <div className="text-sm font-bold text-bitcoin-white">{lastUpdate}</div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Pulse animation for live updates
 */
export function LiveIndicator({ label = 'Live' }: { label?: string }) {
  return (
    <div className="inline-flex items-center gap-2">
      <div className="relative">
        <div className="w-2 h-2 bg-bitcoin-orange rounded-full" />
        <div className="absolute inset-0 w-2 h-2 bg-bitcoin-orange rounded-full animate-ping" />
      </div>
      <span className="text-xs font-semibold text-bitcoin-orange uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

/**
 * Shimmer effect for loading states
 */
export function ShimmerEffect({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-bitcoin-white via-opacity-10 to-transparent" />
    </div>
  );
}
