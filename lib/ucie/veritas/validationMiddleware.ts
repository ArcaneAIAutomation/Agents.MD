/**
 * Veritas Protocol Validation Middleware
 * 
 * Wraps existing data fetching functions with optional validation logic.
 * Ensures backward compatibility and graceful degradation.
 */

import { isVeritasEnabled, getVeritasConfig } from './utils/featureFlags';

/**
 * Validation result interface
 */
export interface VeritasValidationResult {
  isValid: boolean;
  confidence: number; // 0-100
  alerts: ValidationAlert[];
  discrepancies: Discrepancy[];
  dataQualitySummary: DataQualitySummary;
}

export interface ValidationAlert {
  severity: 'info' | 'warning' | 'error' | 'fatal';
  type: 'market' | 'social' | 'onchain' | 'news';
  message: string;
  affectedSources: string[];
  recommendation: string;
}

export interface Discrepancy {
  metric: string;
  sources: { name: string; value: any }[];
  variance: number;
  threshold: number;
  exceeded: boolean;
}

export interface DataQualitySummary {
  overallScore: number; // 0-100
  marketDataQuality: number;
  socialDataQuality: number;
  onChainDataQuality: number;
  newsDataQuality: number;
  passedChecks: string[];
  failedChecks: string[];
}

/**
 * Validation options
 */
export interface ValidationOptions {
  enableVeritas?: boolean;
  fallbackOnError?: boolean;
  timeout?: number;
  cacheValidation?: boolean;
}

/**
 * Main validation middleware function
 * 
 * Wraps existing data fetching with optional validation logic.
 * Ensures backward compatibility - existing data is always returned.
 * 
 * @template T - Type of data being validated
 * @param {() => Promise<T>} dataFetcher - Function that fetches the data
 * @param {(data: T) => Promise<VeritasValidationResult>} validator - Validation function
 * @param {ValidationOptions} options - Validation options
 * @returns {Promise<{ data: T; validation?: VeritasValidationResult }>}
 */
export async function validateWithVeritas<T>(
  dataFetcher: () => Promise<T>,
  validator: (data: T) => Promise<VeritasValidationResult>,
  options?: ValidationOptions
): Promise<{ data: T; validation?: VeritasValidationResult }> {
  // Get configuration
  const config = getVeritasConfig();
  const enableVeritas = options?.enableVeritas ?? config.enabled;
  const fallbackOnError = options?.fallbackOnError ?? config.fallbackOnError;
  const timeout = options?.timeout ?? config.timeout;
  
  // Step 1: Fetch data using existing function (ALWAYS happens)
  let data: T;
  try {
    data = await dataFetcher();
  } catch (error) {
    console.error('Data fetching failed:', error);
    throw error; // Re-throw data fetching errors
  }
  
  // Step 2: If Veritas disabled, return data as-is
  if (!enableVeritas) {
    return { data };
  }
  
  // Step 3: Run validation with timeout protection
  try {
    const validation = await withTimeout(
      () => validator(data),
      timeout,
      'Validation timeout'
    );
    
    // Return data with validation results
    return { data, validation };
  } catch (error) {
    console.error('Veritas validation failed:', error);
    
    // Graceful degradation: return data without validation
    if (fallbackOnError) {
      console.warn('Falling back to data without validation');
      return { data };
    }
    
    // If fallback disabled, throw error
    throw error;
  }
}

/**
 * Timeout protection wrapper
 * 
 * Ensures validation doesn't block data fetching.
 * 
 * @template T
 * @param {() => Promise<T>} fn - Function to execute
 * @param {number} timeoutMs - Timeout in milliseconds
 * @param {string} errorMessage - Error message if timeout occurs
 * @returns {Promise<T>}
 */
async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    // Set timeout
    const timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
    
    // Execute function
    fn()
      .then(result => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch(error => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

/**
 * Safe validation wrapper with comprehensive error handling
 * 
 * Catches all errors and returns a safe fallback.
 * 
 * @template T
 * @param {() => Promise<T>} validator - Validation function
 * @param {T} fallback - Fallback value if validation fails
 * @returns {Promise<T>}
 */
export async function safeValidation<T>(
  validator: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await validator();
  } catch (error) {
    console.error('Validation error (using fallback):', error);
    
    // Log error for monitoring
    logValidationError(error);
    
    // Return fallback
    return fallback;
  }
}

/**
 * Log validation errors for monitoring
 * 
 * @param {any} error - Error object
 */
function logValidationError(error: any): void {
  // In production, send to monitoring service (e.g., Sentry, Vercel Analytics)
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrate with monitoring service
    console.error('Veritas validation error:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Create a validation-enabled API response
 * 
 * Helper function to add validation results to API responses.
 * 
 * @template T
 * @param {T} data - Original data
 * @param {VeritasValidationResult | undefined} validation - Validation results
 * @returns {T & { veritasValidation?: VeritasValidationResult }}
 */
export function createValidatedResponse<T extends object>(
  data: T,
  validation?: VeritasValidationResult
): T & { veritasValidation?: VeritasValidationResult } {
  if (!validation) {
    return data;
  }
  
  return {
    ...data,
    veritasValidation: validation
  };
}

/**
 * Validation cache for reducing redundant checks
 */
const validationCache = new Map<string, {
  result: VeritasValidationResult;
  timestamp: number;
}>();

/**
 * Get cached validation result
 * 
 * @param {string} key - Cache key
 * @param {number} ttl - Time to live in milliseconds
 * @returns {VeritasValidationResult | null}
 */
export function getCachedValidation(
  key: string,
  ttl: number = 300000 // 5 minutes default
): VeritasValidationResult | null {
  const cached = validationCache.get(key);
  
  if (!cached) {
    return null;
  }
  
  // Check if cache is still valid
  if (Date.now() - cached.timestamp > ttl) {
    validationCache.delete(key);
    return null;
  }
  
  return cached.result;
}

/**
 * Set cached validation result
 * 
 * @param {string} key - Cache key
 * @param {VeritasValidationResult} result - Validation result
 */
export function setCachedValidation(
  key: string,
  result: VeritasValidationResult
): void {
  validationCache.set(key, {
    result,
    timestamp: Date.now()
  });
}

/**
 * Clear validation cache
 * 
 * @param {string} key - Optional cache key to clear (clears all if not provided)
 */
export function clearValidationCache(key?: string): void {
  if (key) {
    validationCache.delete(key);
  } else {
    validationCache.clear();
  }
}

/**
 * Get validation cache statistics
 * 
 * @returns {{ size: number; keys: string[] }}
 */
export function getValidationCacheStats(): { size: number; keys: string[] } {
  return {
    size: validationCache.size,
    keys: Array.from(validationCache.keys())
  };
}
