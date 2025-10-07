/**
 * useOverflowDetection Hook
 * 
 * React hook for detecting text overflow in development mode.
 * Automatically scans for overflow issues and provides utilities for fixing them.
 */

import { useEffect, useRef, useState } from 'react';
import {
  scanForOverflow,
  clearOverflowHighlights,
  detectOverflow,
  autoFixOverflow,
  overflowMonitor,
  OverflowDetectionResult,
  CONTAINMENT_STRATEGIES,
} from '../utils/textOverflowPrevention';

/**
 * Hook options
 */
interface UseOverflowDetectionOptions {
  enabled?: boolean;
  autoScan?: boolean;
  scanDelay?: number;
  highlightElements?: boolean;
  logToConsole?: boolean;
  autoFix?: boolean;
  autoFixStrategy?: keyof typeof CONTAINMENT_STRATEGIES;
  continuousMonitoring?: boolean;
  monitoringInterval?: number;
}

/**
 * Hook return value
 */
interface UseOverflowDetectionReturn {
  overflowElements: OverflowDetectionResult[];
  scan: () => void;
  clearHighlights: () => void;
  fixOverflow: (element: HTMLElement) => void;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  isMonitoring: boolean;
}

/**
 * useOverflowDetection Hook
 * 
 * Detects and helps fix text overflow issues in development mode.
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { overflowElements, scan, clearHighlights } = useOverflowDetection({
 *     enabled: true,
 *     autoScan: true,
 *     highlightElements: true,
 *   });
 * 
 *   return (
 *     <div>
 *       <button onClick={scan}>Scan for Overflow</button>
 *       <button onClick={clearHighlights}>Clear Highlights</button>
 *       {overflowElements.length > 0 && (
 *         <p>Found {overflowElements.length} overflow issues</p>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useOverflowDetection(
  options: UseOverflowDetectionOptions = {}
): UseOverflowDetectionReturn {
  const {
    enabled = process.env.NODE_ENV === 'development',
    autoScan = true,
    scanDelay = 1000,
    highlightElements = true,
    logToConsole = true,
    autoFix = false,
    autoFixStrategy = 'safeDefault',
    continuousMonitoring = false,
    monitoringInterval = 5000,
  } = options;

  const [overflowElements, setOverflowElements] = useState<OverflowDetectionResult[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Scan for overflow issues
   */
  const scan = () => {
    if (!enabled || typeof window === 'undefined') {
      return;
    }

    const results = scanForOverflow(document.body, {
      logToConsole,
      highlightElements,
    });

    setOverflowElements(results);

    // Auto-fix if enabled
    if (autoFix && results.length > 0) {
      results.forEach((result) => {
        autoFixOverflow(result.element, autoFixStrategy);
      });

      // Re-scan after auto-fix to verify
      setTimeout(() => {
        const verifyResults = scanForOverflow(document.body, {
          logToConsole: false,
          highlightElements: false,
        });
        
        if (verifyResults.length === 0 && logToConsole) {
          console.log('✅ All overflow issues fixed automatically');
        } else if (logToConsole) {
          console.warn(
            `⚠️ ${verifyResults.length} overflow issues remain after auto-fix`
          );
        }
      }, 100);
    }
  };

  /**
   * Clear overflow highlights
   */
  const clearHighlights = () => {
    if (typeof window === 'undefined') {
      return;
    }
    clearOverflowHighlights(document.body);
  };

  /**
   * Fix overflow for a specific element
   */
  const fixOverflow = (element: HTMLElement) => {
    if (!enabled) {
      return;
    }
    autoFixOverflow(element, autoFixStrategy);
  };

  /**
   * Start continuous monitoring
   */
  const startMonitoring = () => {
    if (!enabled || isMonitoring) {
      return;
    }
    overflowMonitor.start(monitoringInterval);
    setIsMonitoring(true);
  };

  /**
   * Stop continuous monitoring
   */
  const stopMonitoring = () => {
    overflowMonitor.stop();
    setIsMonitoring(false);
  };

  /**
   * Auto-scan on mount and after DOM changes
   */
  useEffect(() => {
    if (!enabled || !autoScan || typeof window === 'undefined') {
      return;
    }

    // Clear any existing timeout
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }

    // Schedule scan after delay
    scanTimeoutRef.current = setTimeout(() => {
      scan();
    }, scanDelay);

    // Cleanup
    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, [enabled, autoScan, scanDelay]);

  /**
   * Start continuous monitoring if enabled
   */
  useEffect(() => {
    if (!enabled || !continuousMonitoring) {
      return;
    }

    startMonitoring();

    return () => {
      stopMonitoring();
    };
  }, [enabled, continuousMonitoring]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      clearHighlights();
      stopMonitoring();
    };
  }, []);

  return {
    overflowElements,
    scan,
    clearHighlights,
    fixOverflow,
    startMonitoring,
    stopMonitoring,
    isMonitoring,
  };
}

/**
 * useElementOverflow Hook
 * 
 * Detects overflow for a specific element ref.
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const ref = useRef<HTMLDivElement>(null);
 *   const { hasOverflow, overflowX, overflowY } = useElementOverflow(ref);
 * 
 *   return (
 *     <div ref={ref}>
 *       {hasOverflow && <p>This element has overflow!</p>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useElementOverflow(
  elementRef: React.RefObject<HTMLElement>,
  options: {
    enabled?: boolean;
    checkInterval?: number;
  } = {}
) {
  const { enabled = true, checkInterval = 1000 } = options;

  const [hasOverflow, setHasOverflow] = useState(false);
  const [overflowX, setOverflowX] = useState(false);
  const [overflowY, setOverflowY] = useState(false);

  useEffect(() => {
    if (!enabled || !elementRef.current) {
      return;
    }

    const checkOverflow = () => {
      if (!elementRef.current) {
        return;
      }

      const result = detectOverflow(elementRef.current);
      setHasOverflow(result.hasOverflow);
      setOverflowX(result.overflowX);
      setOverflowY(result.overflowY);
    };

    // Initial check
    checkOverflow();

    // Set up interval for continuous checking
    const intervalId = setInterval(checkOverflow, checkInterval);

    // Cleanup
    return () => {
      clearInterval(intervalId);
    };
  }, [enabled, checkInterval, elementRef]);

  return {
    hasOverflow,
    overflowX,
    overflowY,
  };
}

/**
 * useOverflowWarning Hook
 * 
 * Shows console warnings when overflow is detected.
 * Useful for development debugging.
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const ref = useRef<HTMLDivElement>(null);
 *   useOverflowWarning(ref, 'MyComponent container');
 * 
 *   return <div ref={ref}>Content</div>;
 * }
 * ```
 */
export function useOverflowWarning(
  elementRef: React.RefObject<HTMLElement>,
  componentName: string = 'Component',
  enabled: boolean = process.env.NODE_ENV === 'development'
) {
  const { hasOverflow, overflowX, overflowY } = useElementOverflow(elementRef, {
    enabled,
  });

  useEffect(() => {
    if (!enabled || !hasOverflow) {
      return;
    }

    console.warn(`⚠️ Overflow detected in ${componentName}:`, {
      overflowX,
      overflowY,
      element: elementRef.current,
    });
  }, [hasOverflow, overflowX, overflowY, componentName, enabled]);
}

export default useOverflowDetection;
