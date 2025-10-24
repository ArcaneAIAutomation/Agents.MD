/**
 * Gemini API Startup Validation
 * 
 * Validates Gemini configuration at application startup and provides
 * clear error messages for configuration issues.
 * 
 * @module validateGeminiStartup
 */

import { validateGeminiConfigAtStartup } from './geminiConfig';

/**
 * Validates Gemini configuration and logs results
 * 
 * This function should be called during application startup to ensure
 * the Gemini API is properly configured before any requests are made.
 * 
 * @param throwOnError - Whether to throw an error if validation fails (default: false)
 * @returns true if validation passed, false otherwise
 */
export function validateGeminiOnStartup(throwOnError: boolean = false): boolean {
  console.log('\n=== Gemini API Configuration Validation ===\n');
  
  const validation = validateGeminiConfigAtStartup();
  
  // Display errors
  if (validation.errors.length > 0) {
    console.error('❌ Gemini Configuration Errors:\n');
    validation.errors.forEach((error, index) => {
      console.error(`  ${index + 1}. ${error}`);
    });
    console.error('\n');
  }
  
  // Display warnings
  if (validation.warnings.length > 0) {
    console.warn('⚠️  Gemini Configuration Warnings:\n');
    validation.warnings.forEach((warning, index) => {
      console.warn(`  ${index + 1}. ${warning}`);
    });
    console.warn('\n');
  }
  
  // Display success
  if (validation.valid && validation.warnings.length === 0) {
    console.log('✅ Gemini API configuration is valid\n');
  } else if (validation.valid) {
    console.log('✅ Gemini API configuration is valid (with warnings)\n');
  }
  
  console.log('==========================================\n');
  
  // Throw error if requested and validation failed
  if (!validation.valid && throwOnError) {
    throw new Error(
      'Gemini API configuration validation failed. Please fix the errors above.'
    );
  }
  
  return validation.valid;
}

/**
 * Prints Gemini configuration help
 */
export function printGeminiConfigHelp(): void {
  console.log('\n=== Gemini API Configuration Help ===\n');
  console.log('Required Environment Variables:');
  console.log('  GEMINI_API_KEY - Your Gemini API key (starts with "AIzaSy")');
  console.log('    Get your key: https://aistudio.google.com/app/apikey\n');
  
  console.log('Optional Environment Variables:');
  console.log('  GEMINI_MODEL - Model to use (default: gemini-2.5-flash)');
  console.log('    Options: gemini-2.5-flash | gemini-2.5-pro');
  console.log('  GEMINI_ENABLE_THINKING - Enable thinking mode (default: true)');
  console.log('  GEMINI_PRO_THRESHOLD_BTC - BTC threshold for Pro model (default: 100)');
  console.log('  GEMINI_MAX_RETRIES - Max retry attempts (default: 2)');
  console.log('  GEMINI_TIMEOUT_MS - Request timeout in ms (default: 15000)');
  console.log('  GEMINI_MAX_REQUESTS_PER_MINUTE - Rate limit (default: 60)');
  console.log('  GEMINI_FLASH_MAX_OUTPUT_TOKENS - Flash model tokens (default: 8192)');
  console.log('  GEMINI_PRO_MAX_OUTPUT_TOKENS - Pro model tokens (default: 32768)\n');
  
  console.log('Example .env.local configuration:');
  console.log('  GEMINI_API_KEY=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567');
  console.log('  GEMINI_MODEL=gemini-2.5-flash');
  console.log('  GEMINI_ENABLE_THINKING=true');
  console.log('  GEMINI_PRO_THRESHOLD_BTC=100\n');
  
  console.log('For more information, see:');
  console.log('  - .env.example file');
  console.log('  - .kiro/specs/gemini-model-upgrade/design.md');
  console.log('  - https://ai.google.dev/gemini-api/docs\n');
  console.log('======================================\n');
}

// Auto-validate on import in development mode
if (process.env.NODE_ENV === 'development') {
  try {
    validateGeminiOnStartup(false);
  } catch (error) {
    console.error('Failed to validate Gemini configuration:', error);
  }
}
