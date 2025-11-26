/**
 * Einstein Loading Spinner Component
 * 
 * Reusable loading spinner with Bitcoin Sovereign styling.
 * Implements Requirements 15.5, 16.2
 * 
 * Features:
 * - Pulsing orange spinner
 * - Customizable size
 * - Optional text label
 * - Progress indicator support
 * - Bitcoin Sovereign styling (black, orange, white)
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  
  /** Optional text to display below spinner */
  text?: string;
  
  /** Show progress percentage (0-100) */
  progress?: number;
  
  /** Additional CSS classes */
  className?: string;
  
  /** Use pulsing animation */
  pulse?: boolean;
}

// ============================================================================
// Size Mappings
// ============================================================================

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
};

const textSizeMap = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg'
};

// ============================================================================
// Loading Spinner Component
// ============================================================================

/**
 * LoadingSpinner Component
 * 
 * Requirement 15.5: Display pulsing orange spinner with "Verifying Data..." text
 * Requirement 16.2: Show loading spinner during refresh operations
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
  progress,
  className = '',
  pulse = false
}) => {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      {/* Spinner */}
      <div className="relative">
        {/* Main Spinner */}
        <Loader2
          className={`
            ${sizeMap[size]}
            text-bitcoin-orange
            animate-spin
            ${pulse ? 'animate-pulse' : ''}
          `}
          aria-hidden="true"
        />
        
        {/* Progress Ring (if progress is provided) */}
        {progress !== undefined && (
          <svg
            className={`absolute inset-0 ${sizeMap[size]}`}
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="rgba(247, 147, 26, 0.2)"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#F7931A"
              strokeWidth="8"
              strokeDasharray={`${progress * 2.827} 282.7`}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              className="transition-all duration-300"
            />
          </svg>
        )}
      </div>

      {/* Text Label */}
      {text && (
        <p className={`
          ${textSizeMap[size]}
          text-bitcoin-white-80
          font-medium
          text-center
        `}>
          {text}
        </p>
      )}

      {/* Progress Percentage */}
      {progress !== undefined && (
        <p className={`
          ${textSizeMap[size]}
          text-bitcoin-orange
          font-mono
          font-bold
        `}>
          {Math.round(progress)}%
        </p>
      )}
    </div>
  );
};

// ============================================================================
// Preset Loading States
// ============================================================================

/**
 * Verifying Data Loading State
 * Requirement 15.5: Display "Verifying Data..." text
 */
export const VerifyingDataSpinner: React.FC<{ className?: string }> = ({ className }) => (
  <LoadingSpinner
    size="lg"
    text="Verifying Data..."
    pulse
    className={className}
  />
);

/**
 * Generating Signal Loading State
 */
export const GeneratingSignalSpinner: React.FC<{ className?: string }> = ({ className }) => (
  <LoadingSpinner
    size="xl"
    text="Generating Trade Signal..."
    pulse
    className={className}
  />
);

/**
 * Analyzing Market Loading State
 */
export const AnalyzingMarketSpinner: React.FC<{ className?: string }> = ({ className }) => (
  <LoadingSpinner
    size="lg"
    text="Analyzing Market Data..."
    className={className}
  />
);

/**
 * Loading History Loading State
 */
export const LoadingHistorySpinner: React.FC<{ className?: string }> = ({ className }) => (
  <LoadingSpinner
    size="md"
    text="Loading trade history..."
    className={className}
  />
);

// ============================================================================
// Full Page Loading Overlay
// ============================================================================

interface LoadingOverlayProps {
  /** Show/hide overlay */
  show: boolean;
  
  /** Loading text */
  text?: string;
  
  /** Progress percentage (0-100) */
  progress?: number;
  
  /** Disable interactions */
  disableInteractions?: boolean;
}

/**
 * Full Page Loading Overlay
 * 
 * Requirement 15.5: Disable interactions during refresh
 * Requirement 16.2: Show progress indicator
 */
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  show,
  text = 'Loading...',
  progress,
  disableInteractions = true
}) => {
  if (!show) return null;

  return (
    <div
      className={`
        fixed inset-0 z-50
        bg-bitcoin-black bg-opacity-90
        flex items-center justify-center
        ${disableInteractions ? 'pointer-events-auto' : 'pointer-events-none'}
      `}
      aria-live="polite"
      aria-busy="true"
    >
      <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-8 max-w-md">
        <LoadingSpinner
          size="xl"
          text={text}
          progress={progress}
          pulse
        />
      </div>
    </div>
  );
};

// ============================================================================
// Inline Loading State
// ============================================================================

interface InlineLoadingProps {
  /** Loading text */
  text?: string;
  
  /** Size */
  size?: 'sm' | 'md' | 'lg';
  
  /** Additional CSS classes */
  className?: string;
}

/**
 * Inline Loading State
 * For use within cards, buttons, or other components
 */
export const InlineLoading: React.FC<InlineLoadingProps> = ({
  text,
  size = 'sm',
  className = ''
}) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <Loader2
      className={`${sizeMap[size]} text-bitcoin-orange animate-spin`}
      aria-hidden="true"
    />
    {text && (
      <span className={`${textSizeMap[size]} text-bitcoin-white-80`}>
        {text}
      </span>
    )}
  </div>
);

// ============================================================================
// Export
// ============================================================================

export default LoadingSpinner;
