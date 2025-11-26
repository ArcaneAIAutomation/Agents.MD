import React, { useEffect, useState } from 'react';

/**
 * DataChangeIndicator Component
 * 
 * Highlights changed data with orange glow and displays "Updated" badge.
 * Automatically fades animation after 3 seconds.
 * 
 * Features:
 * - Orange glow effect on changed values
 * - Animated "Updated" badge
 * - Auto-fade after 3 seconds
 * - Smooth transitions
 * 
 * Requirements: 13.3
 * Validates: Requirements 13.3 (Data change detection and visual feedback)
 */

export interface DataChangeIndicatorProps {
  value: any; // Current value to display
  previousValue?: any; // Previous value for comparison
  children: React.ReactNode; // Content to wrap
  className?: string;
  showBadge?: boolean; // Show "Updated" badge
  glowDuration?: number; // Duration in milliseconds (default: 3000)
}

export const DataChangeIndicator: React.FC<DataChangeIndicatorProps> = ({
  value,
  previousValue,
  children,
  className = '',
  showBadge = true,
  glowDuration = 3000
}) => {
  const [isChanged, setIsChanged] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);

  // Detect value changes
  useEffect(() => {
    if (previousValue !== undefined && value !== previousValue) {
      // Value has changed
      setIsChanged(true);
      setShowAnimation(true);

      // Fade animation after specified duration
      const timer = setTimeout(() => {
        setShowAnimation(false);
      }, glowDuration);

      // Reset changed state after animation completes
      const resetTimer = setTimeout(() => {
        setIsChanged(false);
      }, glowDuration + 500); // Extra 500ms for fade-out

      return () => {
        clearTimeout(timer);
        clearTimeout(resetTimer);
      };
    }
  }, [value, previousValue, glowDuration]);

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Content with conditional glow effect */}
      <div
        className={`
          transition-all duration-500
          ${showAnimation ? 'animate-data-change' : ''}
          ${showAnimation ? 'shadow-[0_0_20px_rgba(247,147,26,0.5)]' : ''}
        `}
      >
        {children}
      </div>

      {/* "Updated" Badge */}
      {showBadge && showAnimation && (
        <div
          className={`
            absolute -top-2 -right-2 z-10
            px-2 py-1 rounded-md
            bg-bitcoin-orange text-bitcoin-black
            text-xs font-bold uppercase tracking-wider
            border border-bitcoin-orange
            shadow-[0_0_15px_rgba(247,147,26,0.6)]
            animate-fade-in
          `}
        >
          Updated
        </div>
      )}
    </div>
  );
};

/**
 * DataChangeWrapper Component
 * 
 * Wrapper component for multiple data points that need change detection.
 * Automatically tracks previous values and applies change indicators.
 */

export interface DataChangeWrapperProps {
  data: Record<string, any>; // Current data object
  previousData?: Record<string, any>; // Previous data object
  children: (
    value: any,
    key: string,
    isChanged: boolean
  ) => React.ReactNode;
  className?: string;
}

export const DataChangeWrapper: React.FC<DataChangeWrapperProps> = ({
  data,
  previousData,
  children,
  className = ''
}) => {
  return (
    <div className={className}>
      {Object.entries(data).map(([key, value]) => {
        const previousValue = previousData?.[key];
        const isChanged = previousValue !== undefined && value !== previousValue;

        return (
          <DataChangeIndicator
            key={key}
            value={value}
            previousValue={previousValue}
          >
            {children(value, key, isChanged)}
          </DataChangeIndicator>
        );
      })}
    </div>
  );
};

/**
 * useDataChangeTracking Hook
 * 
 * Custom hook to track data changes and provide change detection state.
 */

export interface DataChangeState<T> {
  currentData: T;
  previousData?: T;
  changedKeys: Set<string>;
  isAnyChanged: boolean;
}

export function useDataChangeTracking<T extends Record<string, any>>(
  data: T
): DataChangeState<T> {
  const [previousData, setPreviousData] = useState<T | undefined>(undefined);
  const [changedKeys, setChangedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (previousData) {
      // Detect changed keys
      const changed = new Set<string>();
      Object.keys(data).forEach(key => {
        if (data[key] !== previousData[key]) {
          changed.add(key);
        }
      });
      setChangedKeys(changed);

      // Clear changed keys after 3 seconds
      const timer = setTimeout(() => {
        setChangedKeys(new Set());
      }, 3000);

      return () => clearTimeout(timer);
    }

    // Update previous data
    setPreviousData(data);
  }, [data]);

  return {
    currentData: data,
    previousData,
    changedKeys,
    isAnyChanged: changedKeys.size > 0
  };
}

// Export default for convenience
export default DataChangeIndicator;
