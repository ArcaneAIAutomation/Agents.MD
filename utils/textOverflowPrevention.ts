/**
 * Text Overflow Prevention Utilities
 * 
 * Provides utilities for detecting and preventing text overflow in containers.
 * Implements CSS containment strategies and development mode overflow detection.
 */

/**
 * CSS containment strategy configuration
 */
export interface ContainmentStrategy {
  minWidth: string;
  overflow: 'hidden' | 'visible' | 'scroll' | 'auto';
  wordBreak: 'normal' | 'break-all' | 'keep-all' | 'break-word';
  overflowWrap: 'normal' | 'break-word' | 'anywhere';
  textOverflow?: 'clip' | 'ellipsis';
  whiteSpace?: 'normal' | 'nowrap' | 'pre' | 'pre-wrap' | 'pre-line';
}

/**
 * Predefined containment strategies for common use cases
 */
export const CONTAINMENT_STRATEGIES = {
  // Single-line text with ellipsis
  singleLineEllipsis: {
    minWidth: '0',
    overflow: 'hidden',
    wordBreak: 'normal',
    overflowWrap: 'normal',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  } as ContainmentStrategy,

  // Multi-line text with word breaking
  multiLineBreak: {
    minWidth: '0',
    overflow: 'hidden',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
  } as ContainmentStrategy,

  // Anywhere breaking for long strings (URLs, hashes, etc.)
  anywhereBreak: {
    minWidth: '0',
    overflow: 'hidden',
    wordBreak: 'break-all',
    overflowWrap: 'anywhere',
  } as ContainmentStrategy,

  // Scrollable container for preserving content
  scrollable: {
    minWidth: '0',
    overflow: 'auto',
    wordBreak: 'normal',
    overflowWrap: 'normal',
  } as ContainmentStrategy,

  // Safe default for most containers
  safeDefault: {
    minWidth: '0',
    overflow: 'hidden',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
  } as ContainmentStrategy,
};

/**
 * Apply containment strategy to an element
 */
export function applyContainmentStrategy(
  element: HTMLElement,
  strategy: ContainmentStrategy
): void {
  element.style.minWidth = strategy.minWidth;
  element.style.overflow = strategy.overflow;
  element.style.wordBreak = strategy.wordBreak;
  element.style.overflowWrap = strategy.overflowWrap;
  
  if (strategy.textOverflow) {
    element.style.textOverflow = strategy.textOverflow;
  }
  
  if (strategy.whiteSpace) {
    element.style.whiteSpace = strategy.whiteSpace;
  }
}

/**
 * Overflow detection result
 */
export interface OverflowDetectionResult {
  hasOverflow: boolean;
  overflowX: boolean;
  overflowY: boolean;
  element: HTMLElement;
  scrollWidth: number;
  clientWidth: number;
  scrollHeight: number;
  clientHeight: number;
}

/**
 * Detect if an element has text overflow
 */
export function detectOverflow(element: HTMLElement): OverflowDetectionResult {
  const scrollWidth = element.scrollWidth;
  const clientWidth = element.clientWidth;
  const scrollHeight = element.scrollHeight;
  const clientHeight = element.clientHeight;

  const overflowX = scrollWidth > clientWidth;
  const overflowY = scrollHeight > clientHeight;
  const hasOverflow = overflowX || overflowY;

  return {
    hasOverflow,
    overflowX,
    overflowY,
    element,
    scrollWidth,
    clientWidth,
    scrollHeight,
    clientHeight,
  };
}

/**
 * Scan DOM for overflow issues (development mode only)
 */
export function scanForOverflow(
  rootElement: HTMLElement = document.body,
  options: {
    includeHidden?: boolean;
    logToConsole?: boolean;
    highlightElements?: boolean;
  } = {}
): OverflowDetectionResult[] {
  const {
    includeHidden = false,
    logToConsole = true,
    highlightElements = true,
  } = options;

  const overflowElements: OverflowDetectionResult[] = [];
  const allElements = rootElement.querySelectorAll('*');

  allElements.forEach((el) => {
    const element = el as HTMLElement;
    
    // Skip hidden elements unless explicitly included
    if (!includeHidden) {
      const style = window.getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden') {
        return;
      }
    }

    const result = detectOverflow(element);
    
    if (result.hasOverflow) {
      overflowElements.push(result);
      
      if (logToConsole) {
        console.warn('Text overflow detected:', {
          element: element,
          tagName: element.tagName,
          className: element.className,
          overflowX: result.overflowX,
          overflowY: result.overflowY,
          scrollWidth: result.scrollWidth,
          clientWidth: result.clientWidth,
          scrollHeight: result.scrollHeight,
          clientHeight: result.clientHeight,
        });
      }
      
      if (highlightElements) {
        element.style.outline = '2px solid red';
        element.style.outlineOffset = '2px';
        element.setAttribute('data-overflow-detected', 'true');
      }
    }
  });

  if (logToConsole && overflowElements.length > 0) {
    console.warn(
      `Found ${overflowElements.length} elements with text overflow`
    );
  }

  return overflowElements;
}

/**
 * Remove overflow highlights
 */
export function clearOverflowHighlights(
  rootElement: HTMLElement = document.body
): void {
  const highlightedElements = rootElement.querySelectorAll(
    '[data-overflow-detected="true"]'
  );
  
  highlightedElements.forEach((el) => {
    const element = el as HTMLElement;
    element.style.outline = '';
    element.style.outlineOffset = '';
    element.removeAttribute('data-overflow-detected');
  });
}

/**
 * Auto-fix overflow issues by applying appropriate containment strategies
 */
export function autoFixOverflow(
  element: HTMLElement,
  preferredStrategy: keyof typeof CONTAINMENT_STRATEGIES = 'safeDefault'
): void {
  const result = detectOverflow(element);
  
  if (result.hasOverflow) {
    const strategy = CONTAINMENT_STRATEGIES[preferredStrategy];
    applyContainmentStrategy(element, strategy);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Applied overflow fix:', {
        element: element,
        strategy: preferredStrategy,
      });
    }
  }
}

/**
 * React hook for overflow detection (development mode)
 */
export function useOverflowDetection(
  enabled: boolean = process.env.NODE_ENV === 'development'
) {
  if (typeof window === 'undefined' || !enabled) {
    return;
  }

  // Run overflow detection after page load
  if (document.readyState === 'complete') {
    setTimeout(() => {
      scanForOverflow(document.body, {
        logToConsole: true,
        highlightElements: true,
      });
    }, 1000);
  } else {
    window.addEventListener('load', () => {
      setTimeout(() => {
        scanForOverflow(document.body, {
          logToConsole: true,
          highlightElements: true,
        });
      }, 1000);
    });
  }
}

/**
 * CSS class name generator for containment strategies
 */
export function getContainmentClasses(
  strategy: keyof typeof CONTAINMENT_STRATEGIES
): string {
  const classMap = {
    singleLineEllipsis: 'text-overflow-ellipsis',
    multiLineBreak: 'text-overflow-break',
    anywhereBreak: 'text-overflow-anywhere',
    scrollable: 'text-overflow-scroll',
    safeDefault: 'text-overflow-safe',
  };
  
  return classMap[strategy] || classMap.safeDefault;
}

/**
 * Development mode overflow monitor
 * Continuously monitors for overflow issues and logs them
 */
export class OverflowMonitor {
  private intervalId: number | null = null;
  private isRunning: boolean = false;

  start(intervalMs: number = 5000): void {
    if (this.isRunning || typeof window === 'undefined') {
      return;
    }

    if (process.env.NODE_ENV !== 'development') {
      console.warn('OverflowMonitor should only run in development mode');
      return;
    }

    this.isRunning = true;
    
    this.intervalId = window.setInterval(() => {
      const results = scanForOverflow(document.body, {
        logToConsole: true,
        highlightElements: false, // Don't highlight on continuous monitoring
      });
      
      if (results.length > 0) {
        console.group('Overflow Monitor Report');
        console.log(`Detected ${results.length} overflow issues`);
        results.forEach((result, index) => {
          console.log(`${index + 1}.`, {
            element: result.element.tagName,
            class: result.element.className,
            overflowX: result.overflowX,
            overflowY: result.overflowY,
          });
        });
        console.groupEnd();
      }
    }, intervalMs);

    console.log('OverflowMonitor started');
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      console.log('OverflowMonitor stopped');
    }
  }

  isActive(): boolean {
    return this.isRunning;
  }
}

// Export singleton instance for easy use
export const overflowMonitor = new OverflowMonitor();
