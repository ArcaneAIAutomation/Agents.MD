/**
 * Multi-Source Fallback System for UCIE
 * 
 * Implements intelligent fallback strategies for data fetching
 * with automatic source prioritization and quality scoring.
 * 
 * Features:
 * - Priority-based source selection
 * - Automatic fallback on failure
 * - Data quality scoring
 * - Source health tracking
 * - Timeout management
 */

import { logApiError, logDataQualityIssue } from './errorLogger';

// Data source configuration
export interface DataSource<T> {
  name: string;
  priority: number; // Lower number = higher priority
  fetch: () => Promise<T>;
  timeout: number; // Milliseconds
  healthScore: number; // 0-100, updated based on success/failure
}

// Fallback result with metadata
export interface FallbackResult<T> {
  data: T;
  source: string;
  quality: number; // 0-100
  isFallback: boolean;
  attemptedSources: string[];
  failedSources: string[];
  responseTime: number;
}

// Source health tracking
const sourceHealthScores = new Map<string, number>();

/**
 * Initialize source health score
 */
function initializeHealthScore(sourceName: string): number {
  if (!sourceHealthScores.has(sourceName)) {
    sourceHealthScores.set(sourceName, 100);
  }
  return sourceHealthScores.get(sourceName)!;
}

/**
 * Update source health score based on success/failure
 */
function updateHealthScore(sourceName: string, success: boolean): void {
  const currentScore = initializeHealthScore(sourceName);
  
  if (success) {
    // Gradually increase score on success (max 100)
    const newScore = Math.min(100, currentScore + 5);
    sourceHealthScores.set(sourceName, newScore);
  } else {
    // Decrease score on failure (min 0)
    const newScore = Math.max(0, currentScore - 20);
    sourceHealthScores.set(sourceName, newScore);
  }
}

/**
 * Get source health score
 */
export function getSourceHealth(sourceName: string): number {
  return sourceHealthScores.get(sourceName) || 100;
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout<T>(
  fetchFn: () => Promise<T>,
  timeout: number,
  sourceName: string
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const result = await fetchFn();
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Timeout: ${sourceName} did not respond within ${timeout}ms`);
    }
    throw error;
  }
}

/**
 * Validate data quality
 */
function validateData<T>(data: T): boolean {
  if (data === null || data === undefined) return false;
  
  // Check if data is an object with at least one property
  if (typeof data === 'object' && Object.keys(data).length === 0) return false;
  
  // Additional validation can be added here
  return true;
}

/**
 * Calculate data quality score
 */
function calculateQualityScore<T>(
  data: T,
  source: DataSource<T>,
  responseTime: number
): number {
  let score = 100;
  
  // Deduct points for slow response
  if (responseTime > source.timeout * 0.8) {
    score -= 10;
  }
  
  // Deduct points for low source health
  const healthScore = getSourceHealth(source.name);
  if (healthScore < 80) {
    score -= (100 - healthScore) * 0.2;
  }
  
  // Deduct points for fallback sources (lower priority)
  if (source.priority > 1) {
    score -= (source.priority - 1) * 5;
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Fetch data with automatic fallback
 */
export async function fetchWithFallback<T>(
  sources: DataSource<T>[],
  symbol?: string
): Promise<FallbackResult<T>> {
  // Sort sources by priority and health score
  const sortedSources = [...sources].sort((a, b) => {
    const aHealth = getSourceHealth(a.name);
    const bHealth = getSourceHealth(b.name);
    
    // Primary sort by priority
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    
    // Secondary sort by health score
    return bHealth - aHealth;
  });
  
  const attemptedSources: string[] = [];
  const failedSources: string[] = [];
  let lastError: Error | null = null;
  
  for (const source of sortedSources) {
    attemptedSources.push(source.name);
    const startTime = Date.now();
    
    try {
      // Initialize health score
      initializeHealthScore(source.name);
      
      // Fetch with timeout
      const data = await fetchWithTimeout(
        source.fetch,
        source.timeout,
        source.name
      );
      
      const responseTime = Date.now() - startTime;
      
      // Validate data
      if (!validateData(data)) {
        throw new Error(`Invalid data received from ${source.name}`);
      }
      
      // Update health score on success
      updateHealthScore(source.name, true);
      
      // Calculate quality score
      const quality = calculateQualityScore(data, source, responseTime);
      
      // Log if using fallback
      if (failedSources.length > 0) {
        console.warn(`[Fallback] Using ${source.name} after ${failedSources.length} failed attempts`);
      }
      
      return {
        data,
        source: source.name,
        quality,
        isFallback: failedSources.length > 0,
        attemptedSources,
        failedSources,
        responseTime
      };
      
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      lastError = err;
      failedSources.push(source.name);
      
      // Update health score on failure
      updateHealthScore(source.name, false);
      
      // Log error
      logApiError(err, source.name, 'fetchWithFallback', symbol);
      
      // Continue to next source
      console.warn(`[Fallback] ${source.name} failed: ${err.message}`);
    }
  }
  
  // All sources failed
  throw new Error(
    `All data sources failed. Attempted: ${attemptedSources.join(', ')}. ` +
    `Last error: ${lastError?.message || 'Unknown error'}`
  );
}

/**
 * Fetch from multiple sources and compare results
 */
export async function fetchAndCompare<T>(
  sources: DataSource<T>[],
  compareFn: (a: T, b: T) => number, // Returns discrepancy percentage
  maxDiscrepancy: number = 2, // Maximum allowed discrepancy (%)
  symbol?: string
): Promise<FallbackResult<T>> {
  // Fetch from all sources in parallel
  const results = await Promise.allSettled(
    sources.map(async (source) => {
      const startTime = Date.now();
      try {
        const data = await fetchWithTimeout(
          source.fetch,
          source.timeout,
          source.name
        );
        const responseTime = Date.now() - startTime;
        updateHealthScore(source.name, true);
        return { source, data, responseTime, success: true };
      } catch (error) {
        updateHealthScore(source.name, false);
        const err = error instanceof Error ? error : new Error(String(error));
        logApiError(err, source.name, 'fetchAndCompare', symbol);
        return { source, error: err, success: false };
      }
    })
  );
  
  // Extract successful results
  const successfulResults = results
    .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && r.value.success)
    .map(r => r.value);
  
  if (successfulResults.length === 0) {
    throw new Error('All sources failed in comparison fetch');
  }
  
  // Compare results and detect discrepancies
  if (successfulResults.length > 1) {
    const discrepancies: number[] = [];
    
    for (let i = 0; i < successfulResults.length - 1; i++) {
      for (let j = i + 1; j < successfulResults.length; j++) {
        const discrepancy = compareFn(
          successfulResults[i].data,
          successfulResults[j].data
        );
        discrepancies.push(discrepancy);
        
        if (discrepancy > maxDiscrepancy) {
          logDataQualityIssue(
            `Data discrepancy detected: ${discrepancy.toFixed(2)}%`,
            [successfulResults[i].source.name, successfulResults[j].source.name],
            discrepancy,
            symbol || 'unknown'
          );
        }
      }
    }
  }
  
  // Return result from highest priority source
  const bestResult = successfulResults.sort((a, b) => 
    a.source.priority - b.source.priority
  )[0];
  
  const quality = calculateQualityScore(
    bestResult.data,
    bestResult.source,
    bestResult.responseTime
  );
  
  return {
    data: bestResult.data,
    source: bestResult.source.name,
    quality,
    isFallback: false,
    attemptedSources: successfulResults.map(r => r.source.name),
    failedSources: results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && !r.value.success)
      .map(r => r.value.source.name),
    responseTime: bestResult.responseTime
  };
}

/**
 * Reset all source health scores
 */
export function resetHealthScores(): void {
  sourceHealthScores.clear();
}

/**
 * Get all source health scores
 */
export function getAllHealthScores(): Record<string, number> {
  const scores: Record<string, number> = {};
  sourceHealthScores.forEach((score, name) => {
    scores[name] = score;
  });
  return scores;
}
