/**
 * Veritas Protocol Feature Flags
 * 
 * Centralized feature flag management for the Veritas Protocol.
 * Allows enabling/disabling validation without code changes.
 */

/**
 * Check if Veritas Protocol is enabled
 * 
 * @returns {boolean} True if Veritas Protocol validation is enabled
 */
export function isVeritasEnabled(): boolean {
  // Check environment variable
  const enabled = process.env.ENABLE_VERITAS_PROTOCOL;
  
  // Default to false (disabled) if not set
  if (!enabled) {
    return false;
  }
  
  // Parse string to boolean
  return enabled.toLowerCase() === 'true';
}

/**
 * Get Veritas Protocol configuration
 * 
 * @returns {VeritasConfig} Configuration object
 */
export interface VeritasConfig {
  enabled: boolean;
  timeout: number;
  fallbackOnError: boolean;
  cacheValidation: boolean;
  cacheTTL: number;
}

export function getVeritasConfig(): VeritasConfig {
  return {
    enabled: isVeritasEnabled(),
    timeout: parseInt(process.env.VERITAS_TIMEOUT_MS || '5000', 10),
    fallbackOnError: true, // Always fallback on error
    cacheValidation: true, // Cache validation results
    cacheTTL: parseInt(process.env.VERITAS_CACHE_TTL_MS || '300000', 10) // 5 minutes
  };
}

/**
 * Check if a specific validation feature is enabled
 * 
 * @param {string} feature - Feature name (e.g., 'market', 'social', 'onchain')
 * @returns {boolean} True if feature is enabled
 */
export function isValidationFeatureEnabled(feature: string): boolean {
  // First check if Veritas is enabled globally
  if (!isVeritasEnabled()) {
    return false;
  }
  
  // Check feature-specific flag (optional)
  const featureFlag = process.env[`ENABLE_VERITAS_${feature.toUpperCase()}`];
  
  // If feature-specific flag is not set, default to enabled
  if (!featureFlag) {
    return true;
  }
  
  return featureFlag.toLowerCase() === 'true';
}

/**
 * Log feature flag status (for debugging)
 */
export function logFeatureFlagStatus(): void {
  const config = getVeritasConfig();
  
  console.log('🔍 Veritas Protocol Feature Flags:');
  console.log(`   Enabled: ${config.enabled}`);
  console.log(`   Timeout: ${config.timeout}ms`);
  console.log(`   Fallback on Error: ${config.fallbackOnError}`);
  console.log(`   Cache Validation: ${config.cacheValidation}`);
  console.log(`   Cache TTL: ${config.cacheTTL}ms`);
  
  // Log feature-specific flags
  const features = ['market', 'social', 'onchain', 'news'];
  features.forEach(feature => {
    const enabled = isValidationFeatureEnabled(feature);
    console.log(`   ${feature.charAt(0).toUpperCase() + feature.slice(1)} Validation: ${enabled}`);
  });
}
