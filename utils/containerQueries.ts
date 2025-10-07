/**
 * Container Query Utilities
 * 
 * Provides helper functions and TypeScript types for working with CSS container queries
 * in React components. Container queries allow components to adapt based on their
 * container size rather than viewport size, enabling true component-level responsiveness.
 */

/**
 * Container query breakpoints for different component types
 */
export const containerBreakpoints = {
  // Zone card breakpoints
  zoneCard: {
    small: 200,
    medium: 250,
    large: 300,
  },
  
  // Chart component breakpoints
  chart: {
    small: 300,
    medium: 500,
    large: 700,
  },
  
  // Badge component breakpoints
  badge: {
    small: 60,
    medium: 80,
    large: 100,
  },
  
  // Whale watch card breakpoints
  whaleCard: {
    small: 280,
    medium: 350,
    large: 420,
  },
  
  // Trade signal breakpoints
  tradeSignal: {
    small: 300,
    medium: 400,
    large: 500,
  },
  
  // Market data breakpoints
  marketData: {
    small: 250,
    medium: 350,
    large: 450,
  },
  
  // Generic responsive container
  responsive: {
    xs: 200,
    sm: 300,
    md: 400,
    lg: 500,
    xl: 600,
  },
} as const;

/**
 * Container query type definitions
 */
export type ContainerType = 'inline-size' | 'size' | 'normal';
export type ContainerName = 
  | 'zone-card'
  | 'chart'
  | 'badge'
  | 'whale-card'
  | 'trade-signal'
  | 'market-data'
  | 'responsive'
  | 'component';

/**
 * Container query configuration interface
 */
export interface ContainerQueryConfig {
  type: ContainerType;
  name: ContainerName;
}

/**
 * Generate container query CSS class names
 */
export const getContainerQueryClasses = (config: ContainerQueryConfig): string => {
  const baseClass = 'container-query';
  const typeClass = config.type !== 'inline-size' ? `container-query-${config.type}` : '';
  
  return [baseClass, typeClass].filter(Boolean).join(' ');
};

/**
 * Check if browser supports container queries
 */
export const supportsContainerQueries = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return CSS.supports('container-type', 'inline-size');
};

/**
 * Container query hook for React components
 * Returns whether container queries are supported
 */
export const useContainerQuerySupport = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return supportsContainerQueries();
};

/**
 * Get responsive font size based on container width
 */
export const getResponsiveFontSize = (
  containerWidth: number,
  minSize: number,
  maxSize: number,
  minWidth: number = 200,
  maxWidth: number = 600
): number => {
  if (containerWidth <= minWidth) return minSize;
  if (containerWidth >= maxWidth) return maxSize;
  
  const ratio = (containerWidth - minWidth) / (maxWidth - minWidth);
  return minSize + (maxSize - minSize) * ratio;
};

/**
 * Container query class name generators for specific components
 */
export const containerQueryClasses = {
  zoneCard: 'zone-card-container',
  chart: 'chart-container-query',
  badge: 'badge-container-query',
  whaleCard: 'whale-card-container',
  tradeSignal: 'trade-signal-container',
  marketData: 'market-data-container',
  responsive: 'responsive-container',
} as const;

/**
 * Content class name generators for container query children
 */
export const containerContentClasses = {
  zoneCard: {
    content: 'zone-card-content',
    price: 'zone-card-price',
    distance: 'zone-distance',
  },
  chart: {
    content: 'chart-content',
    label: 'chart-label',
    value: 'chart-value',
  },
  badge: {
    text: 'badge-text',
  },
  whaleCard: {
    amount: 'whale-amount',
    value: 'whale-value',
    status: 'whale-status',
  },
  tradeSignal: {
    price: 'signal-price',
    label: 'signal-label',
  },
  marketData: {
    value: 'market-data-value',
    label: 'market-data-label',
  },
  responsive: {
    textSm: 'responsive-text-sm',
    textBase: 'responsive-text-base',
    textLg: 'responsive-text-lg',
    textXl: 'responsive-text-xl',
  },
} as const;

/**
 * Helper to combine container query classes with additional classes
 */
export const combineContainerClasses = (
  containerClass: string,
  additionalClasses: string = ''
): string => {
  return [containerClass, additionalClasses].filter(Boolean).join(' ');
};

/**
 * Generate inline styles for container queries (fallback for older browsers)
 */
export const getContainerQueryFallbackStyles = (
  minWidth: number,
  fontSize: string
): React.CSSProperties => {
  return {
    minWidth: `${minWidth}px`,
    fontSize,
  };
};

/**
 * Container query media query generator for CSS-in-JS
 */
export const containerQuery = (
  containerName: ContainerName,
  minWidth: number,
  styles: Record<string, any>
): string => {
  return `@container ${containerName} (min-width: ${minWidth}px) { ${Object.entries(styles)
    .map(([key, value]) => `${key}: ${value};`)
    .join(' ')} }`;
};

/**
 * Utility to check if a container width meets a breakpoint
 */
export const meetsContainerBreakpoint = (
  width: number,
  breakpoint: number
): boolean => {
  return width >= breakpoint;
};

/**
 * Get the current breakpoint tier for a container width
 */
export const getContainerBreakpointTier = (
  width: number,
  breakpoints: { small: number; medium: number; large: number }
): 'small' | 'medium' | 'large' | 'xlarge' => {
  if (width >= breakpoints.large) return 'xlarge';
  if (width >= breakpoints.medium) return 'large';
  if (width >= breakpoints.small) return 'medium';
  return 'small';
};

/**
 * Example usage in a React component:
 * 
 * ```tsx
 * import { containerQueryClasses, containerContentClasses } from '@/utils/containerQueries';
 * 
 * function ZoneCard({ price, distance }) {
 *   return (
 *     <div className={containerQueryClasses.zoneCard}>
 *       <div className={containerContentClasses.zoneCard.content}>
 *         <div className={containerContentClasses.zoneCard.price}>
 *           ${price}
 *         </div>
 *         <div className={containerContentClasses.zoneCard.distance}>
 *           {distance}
 *         </div>
 *       </div>
 *     </div>
 *   );
 * }
 * ```
 */
