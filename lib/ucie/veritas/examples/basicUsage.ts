/**
 * Veritas Protocol - Basic Usage Examples
 * 
 * Demonstrates how to use the Veritas Protocol validation middleware
 * in API endpoints and data fetching functions.
 */

import {
  validateWithVeritas,
  isVeritasEnabled,
  createValidatedResponse,
  type VeritasValidationResult
} from '../index';

/**
 * Example 1: Basic API Endpoint with Validation
 * 
 * Shows how to add validation to an existing API endpoint
 * without breaking backward compatibility.
 */
export async function exampleMarketDataEndpoint(symbol: string) {
  // Step 1: Fetch data using existing function (ALWAYS happens)
  const fetchMarketData = async () => {
    // Your existing data fetching logic
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd`);
    return response.json();
  };
  
  // Step 2: Define validation function (only runs if Veritas enabled)
  const validateMarketData = async (data: any): Promise<VeritasValidationResult> => {
    // Your validation logic here
    return {
      isValid: true,
      confidence: 95,
      alerts: [],
      discrepancies: [],
      dataQualitySummary: {
        overallScore: 95,
        marketDataQuality: 95,
        socialDataQuality: 0,
        onChainDataQuality: 0,
        newsDataQuality: 0,
        passedChecks: ['price_consistency'],
        failedChecks: []
      }
    };
  };
  
  // Step 3: Use validation middleware
  const result = await validateWithVeritas(
    fetchMarketData,
    validateMarketData
  );
  
  // Step 4: Return data with optional validation
  return createValidatedResponse(result.data, result.validation);
}

/**
 * Example 2: Conditional Validation
 * 
 * Shows how to check if Veritas is enabled before running validation.
 */
export async function exampleConditionalValidation(symbol: string) {
  // Fetch data
  const data = await fetchSomeData(symbol);
  
  // Check if Veritas is enabled
  if (isVeritasEnabled()) {
    console.log('Veritas Protocol is enabled - running validation');
    
    // Run validation
    const validation = await validateData(data);
    
    return {
      ...data,
      veritasValidation: validation
    };
  }
  
  // Return data without validation
  console.log('Veritas Protocol is disabled - skipping validation');
  return data;
}

/**
 * Example 3: Error Handling with Graceful Degradation
 * 
 * Shows how validation errors are handled gracefully.
 */
export async function exampleErrorHandling(symbol: string) {
  try {
    const result = await validateWithVeritas(
      () => fetchData(symbol),
      (data) => validateData(data),
      {
        fallbackOnError: true, // Always fallback on error
        timeout: 5000 // 5 second timeout
      }
    );
    
    // Check if validation was successful
    if (result.validation) {
      console.log('Validation successful:', result.validation.confidence);
    } else {
      console.log('Validation skipped or failed - using data without validation');
    }
    
    return result.data;
  } catch (error) {
    console.error('Data fetching failed:', error);
    throw error;
  }
}

/**
 * Example 4: Using Validation Cache
 * 
 * Shows how to cache validation results to reduce redundant checks.
 */
import { getCachedValidation, setCachedValidation } from '../index';

export async function exampleCachedValidation(symbol: string) {
  const cacheKey = `market-validation-${symbol}`;
  
  // Check cache first
  const cached = getCachedValidation(cacheKey, 300000); // 5 minutes TTL
  if (cached) {
    console.log('Using cached validation result');
    return cached;
  }
  
  // Run validation
  const data = await fetchData(symbol);
  const validation = await validateData(data);
  
  // Cache result
  setCachedValidation(cacheKey, validation);
  
  return validation;
}

/**
 * Example 5: Feature-Specific Validation
 * 
 * Shows how to check if specific validation features are enabled.
 */
import { isValidationFeatureEnabled } from '../index';

export async function exampleFeatureSpecificValidation(symbol: string) {
  const data = await fetchAllData(symbol);
  const validationResults: any = {};
  
  // Check each feature
  if (isValidationFeatureEnabled('market')) {
    validationResults.market = await validateMarketData(data.market);
  }
  
  if (isValidationFeatureEnabled('social')) {
    validationResults.social = await validateSocialData(data.social);
  }
  
  if (isValidationFeatureEnabled('onchain')) {
    validationResults.onchain = await validateOnChainData(data.onchain);
  }
  
  return {
    data,
    validation: validationResults
  };
}

// Helper functions (placeholders)
async function fetchSomeData(symbol: string): Promise<any> {
  return { price: 100, volume: 1000000 };
}

async function fetchData(symbol: string): Promise<any> {
  return { price: 100, volume: 1000000 };
}

async function fetchAllData(symbol: string): Promise<any> {
  return {
    market: { price: 100 },
    social: { sentiment: 75 },
    onchain: { transactions: 1000 }
  };
}

async function validateData(data: any): Promise<VeritasValidationResult> {
  return {
    isValid: true,
    confidence: 90,
    alerts: [],
    discrepancies: [],
    dataQualitySummary: {
      overallScore: 90,
      marketDataQuality: 90,
      socialDataQuality: 0,
      onChainDataQuality: 0,
      newsDataQuality: 0,
      passedChecks: ['basic_validation'],
      failedChecks: []
    }
  };
}

async function validateMarketData(data: any): Promise<VeritasValidationResult> {
  return validateData(data);
}

async function validateSocialData(data: any): Promise<VeritasValidationResult> {
  return validateData(data);
}

async function validateOnChainData(data: any): Promise<VeritasValidationResult> {
  return validateData(data);
}
