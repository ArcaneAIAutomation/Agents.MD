/**
 * Graceful Degradation Handlers for UCIE
 * 
 * Provides fallback strategies and partial data handling
 * to ensure the application remains functional even when
 * some data sources fail.
 * 
 * Features:
 * - Partial data handling
 * - Cached data fallback
 * - Static fallback data
 * - Feature degradation
 * - User notifications
 */

import { logError } from './errorLogger';

// Degradation level
export type DegradationLevel = 'full' | 'partial' | 'minimal' | 'offline';

// Degradation status
export interface DegradationStatus {
  level: DegradationLevel;
  availableFeatures: string[];
  unavailableFeatures: string[];
  dataQuality: number; // 0-100
  message: string;
  timestamp: string;
}

// Feature availability map
const FEATURE_REQUIREMENTS: Record<string, string[]> = {
  'price_display': ['market_data'],
  'technical_analysis': ['market_data', 'historical_data'],
  'sentiment_analysis': ['social_data', 'news_data'],
  'on_chain_analysis': ['blockchain_data'],
  'predictions': ['market_data', 'historical_data', 'ai_service'],
  'risk_assessment': ['market_data', 'volatility_data'],
  'derivatives': ['derivatives_data'],
  'defi_metrics': ['defi_data'],
  'news_feed': ['news_data'],
  'caesar_research': ['caesar_api']
};

/**
 * Determine degradation level based on available data sources
 */
export function determineDegradationLevel(
  availableSources: string[],
  totalSources: string[]
): DegradationLevel {
  const availabilityRatio = availableSources.length / totalSources.length;
  
  if (availabilityRatio >= 0.9) return 'full';
  if (availabilityRatio >= 0.6) return 'partial';
  if (availabilityRatio >= 0.3) return 'minimal';
  return 'offline';
}

/**
 * Get available features based on data sources
 */
export function getAvailableFeatures(availableSources: string[]): string[] {
  const available: string[] = [];
  
  for (const [feature, requirements] of Object.entries(FEATURE_REQUIREMENTS)) {
    const hasAllRequirements = requirements.every(req => 
      availableSources.includes(req)
    );
    
    if (hasAllRequirements) {
      available.push(feature);
    }
  }
  
  return available;
}

/**
 * Get unavailable features
 */
export function getUnavailableFeatures(availableSources: string[]): string[] {
  const available = getAvailableFeatures(availableSources);
  return Object.keys(FEATURE_REQUIREMENTS).filter(f => !available.includes(f));
}

/**
 * Calculate data quality score
 */
export function calculateDataQuality(
  availableSources: string[],
  totalSources: string[],
  sourceQualities: Record<string, number>
): number {
  if (availableSources.length === 0) return 0;
  
  // Average quality of available sources
  const qualitySum = availableSources.reduce((sum, source) => {
    return sum + (sourceQualities[source] || 50);
  }, 0);
  
  const avgQuality = qualitySum / availableSources.length;
  
  // Adjust for availability ratio
  const availabilityRatio = availableSources.length / totalSources.length;
  
  return Math.round(avgQuality * availabilityRatio);
}

/**
 * Get degradation status
 */
export function getDegradationStatus(
  availableSources: string[],
  totalSources: string[],
  sourceQualities: Record<string, number> = {}
): DegradationStatus {
  const level = determineDegradationLevel(availableSources, totalSources);
  const availableFeatures = getAvailableFeatures(availableSources);
  const unavailableFeatures = getUnavailableFeatures(availableSources);
  const dataQuality = calculateDataQuality(availableSources, totalSources, sourceQualities);
  
  const messages: Record<DegradationLevel, string> = {
    full: 'All systems operational. Full analysis available.',
    partial: 'Some data sources unavailable. Analysis may be limited.',
    minimal: 'Limited data available. Showing basic information only.',
    offline: 'Unable to fetch data. Showing cached information.'
  };
  
  return {
    level,
    availableFeatures,
    unavailableFeatures,
    dataQuality,
    message: messages[level],
    timestamp: new Date().toISOString()
  };
}

/**
 * Handle partial data failure
 */
export function handlePartialFailure<T>(
  results: PromiseSettledResult<T>[],
  context: { source: string; symbol?: string }
): {
  successful: T[];
  failed: Error[];
  dataQuality: number;
} {
  const successful: T[] = [];
  const failed: Error[] = [];
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      successful.push(result.value);
    } else {
      const error = result.reason instanceof Error 
        ? result.reason 
        : new Error(String(result.reason));
      failed.push(error);
      
      // Log the error
      logError(error, {
        source: context.source,
        symbol: context.symbol,
        index,
        critical: false
      });
    }
  });
  
  // Calculate data quality based on success rate
  const dataQuality = Math.round((successful.length / results.length) * 100);
  
  return { successful, failed, dataQuality };
}

/**
 * Get cached data as fallback
 */
export async function getCachedFallback<T>(
  cacheKey: string,
  maxAge: number = 3600000 // 1 hour default
): Promise<T | null> {
  if (typeof window === 'undefined') return null;
  
  try {
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;
    
    if (age > maxAge) {
      // Cache expired
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    return data as T;
  } catch (error) {
    return null;
  }
}

/**
 * Set cached data
 */
export function setCachedFallback<T>(cacheKey: string, data: T): void {
  if (typeof window === 'undefined') return;
  
  try {
    const cached = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(cacheKey, JSON.stringify(cached));
  } catch (error) {
    // Ignore cache errors
  }
}

/**
 * Get static fallback data
 */
export function getStaticFallback<T>(dataType: string): T | null {
  // Static fallback data for common types
  const staticData: Record<string, any> = {
    market_data: {
      price: 0,
      volume24h: 0,
      marketCap: 0,
      change24h: 0,
      timestamp: new Date().toISOString(),
      source: 'static_fallback'
    },
    sentiment: {
      overallScore: 0,
      trend: 'neutral',
      confidence: 0,
      timestamp: new Date().toISOString()
    },
    risk_score: {
      score: 50,
      level: 'medium',
      factors: [],
      timestamp: new Date().toISOString()
    }
  };
  
  return staticData[dataType] || null;
}

/**
 * Merge partial data with fallback
 */
export function mergeWithFallback<T extends Record<string, any>>(
  partialData: Partial<T>,
  fallbackData: T
): T {
  const merged = { ...fallbackData };
  
  // Override with available partial data
  for (const key in partialData) {
    if (partialData[key] !== undefined && partialData[key] !== null) {
      merged[key] = partialData[key]!;
    }
  }
  
  return merged;
}

/**
 * Create degraded response
 */
export function createDegradedResponse<T>(
  partialData: Partial<T> | null,
  cachedData: T | null,
  staticData: T | null,
  degradationStatus: DegradationStatus
): {
  data: T | null;
  degraded: boolean;
  status: DegradationStatus;
} {
  // Priority: partial data > cached data > static data
  let data: T | null = null;
  
  if (partialData && Object.keys(partialData).length > 0) {
    // Use partial data, merge with cached or static if available
    const fallback = cachedData || staticData;
    data = fallback ? mergeWithFallback(partialData, fallback) : partialData as T;
  } else if (cachedData) {
    data = cachedData;
  } else if (staticData) {
    data = staticData;
  }
  
  return {
    data,
    degraded: degradationStatus.level !== 'full',
    status: degradationStatus
  };
}

/**
 * Format user-friendly degradation message
 */
export function formatDegradationMessage(status: DegradationStatus): string {
  const { level, unavailableFeatures, dataQuality } = status;
  
  if (level === 'full') {
    return 'All systems operational';
  }
  
  const featureNames: Record<string, string> = {
    'price_display': 'Price Data',
    'technical_analysis': 'Technical Analysis',
    'sentiment_analysis': 'Sentiment Analysis',
    'on_chain_analysis': 'On-Chain Data',
    'predictions': 'Price Predictions',
    'risk_assessment': 'Risk Assessment',
    'derivatives': 'Derivatives Data',
    'defi_metrics': 'DeFi Metrics',
    'news_feed': 'News Feed',
    'caesar_research': 'AI Research'
  };
  
  const unavailableNames = unavailableFeatures
    .map(f => featureNames[f] || f)
    .join(', ');
  
  if (level === 'offline') {
    return 'Unable to connect to data sources. Showing cached data.';
  }
  
  return `Limited data available (${dataQuality}% quality). ${unavailableNames} temporarily unavailable.`;
}
