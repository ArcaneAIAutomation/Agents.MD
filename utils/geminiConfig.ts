/**
 * Gemini API Configuration and Validation Utility
 * 
 * Handles environment variable validation, model selection, and configuration
 * for the Gemini 2.5 API integration used in Whale Watch analysis.
 * 
 * @module geminiConfig
 */

/**
 * Gemini model types
 */
export type GeminiModel = 'gemini-2.5-flash' | 'gemini-2.5-pro';

/**
 * Gemini configuration interface
 */
export interface GeminiConfig {
  apiKey: string;
  defaultModel: GeminiModel;
  enableThinking: boolean;
  proThresholdBTC: number;
  maxRetries: number;
  timeoutMs: number;
  maxRequestsPerMinute: number;
  flashConfig: {
    temperature: number;
    topK: number;
    topP: number;
    maxOutputTokens: number;
  };
  proConfig: {
    temperature: number;
    topK: number;
    topP: number;
    maxOutputTokens: number;
  };
}

/**
 * Validation error types
 */
export enum GeminiValidationError {
  MISSING_API_KEY = 'MISSING_API_KEY',
  INVALID_API_KEY_FORMAT = 'INVALID_API_KEY_FORMAT',
  INVALID_MODEL = 'INVALID_MODEL',
  INVALID_THRESHOLD = 'INVALID_THRESHOLD',
  INVALID_RETRIES = 'INVALID_RETRIES',
  INVALID_TIMEOUT = 'INVALID_TIMEOUT',
}

/**
 * Validates Gemini API key format
 * 
 * @param apiKey - The API key to validate
 * @returns true if valid, false otherwise
 */
export function validateGeminiAPIKey(apiKey: string | undefined): boolean {
  if (!apiKey) {
    return false;
  }
  
  // Gemini API keys start with "AIzaSy" and are 39 characters total
  const geminiKeyPattern = /^AIzaSy[a-zA-Z0-9_-]{33}$/;
  return geminiKeyPattern.test(apiKey);
}

/**
 * Validates model name
 * 
 * @param model - The model name to validate
 * @returns true if valid, false otherwise
 */
export function validateGeminiModel(model: string | undefined): model is GeminiModel {
  if (!model) {
    return false;
  }
  return model === 'gemini-2.5-flash' || model === 'gemini-2.5-pro';
}

/**
 * Gets environment variable with fallback
 * 
 * @param key - Environment variable key
 * @param defaultValue - Default value if not set
 * @returns The environment variable value or default
 */
function getEnvVar(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

/**
 * Gets numeric environment variable with validation
 * 
 * @param key - Environment variable key
 * @param defaultValue - Default value if not set or invalid
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns The parsed number or default
 */
function getNumericEnvVar(
  key: string,
  defaultValue: number,
  min: number = 0,
  max: number = Infinity
): number {
  const value = process.env[key];
  if (!value) {
    return defaultValue;
  }
  
  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed < min || parsed > max) {
    console.warn(
      `[Gemini Config] Invalid ${key}=${value}, using default: ${defaultValue}`
    );
    return defaultValue;
  }
  
  return parsed;
}

/**
 * Gets boolean environment variable
 * 
 * @param key - Environment variable key
 * @param defaultValue - Default value if not set
 * @returns The boolean value
 */
function getBooleanEnvVar(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  if (!value) {
    return defaultValue;
  }
  
  return value.toLowerCase() === 'true';
}

/**
 * Loads and validates Gemini configuration from environment variables
 * 
 * @throws Error if API key is missing or invalid
 * @returns Validated Gemini configuration
 */
export function loadGeminiConfig(): GeminiConfig {
  const apiKey = process.env.GEMINI_API_KEY;
  
  // Validate API key presence
  if (!apiKey) {
    throw new Error(
      '[Gemini Config] GEMINI_API_KEY environment variable is required. ' +
      'Get your API key from: https://aistudio.google.com/app/apikey'
    );
  }
  
  // Validate API key format
  if (!validateGeminiAPIKey(apiKey)) {
    throw new Error(
      '[Gemini Config] Invalid GEMINI_API_KEY format. ' +
      'API key must start with "AIzaSy" and be 39 characters long. ' +
      'Example: AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567'
    );
  }
  
  // Load model preference
  const modelEnv = getEnvVar('GEMINI_MODEL', 'gemini-2.5-flash');
  const defaultModel: GeminiModel = validateGeminiModel(modelEnv)
    ? modelEnv
    : 'gemini-2.5-flash';
  
  if (!validateGeminiModel(modelEnv)) {
    console.warn(
      `[Gemini Config] Invalid GEMINI_MODEL="${modelEnv}", using default: gemini-2.5-flash`
    );
  }
  
  // Load other configuration
  const enableThinking = getBooleanEnvVar('GEMINI_ENABLE_THINKING', true);
  const proThresholdBTC = getNumericEnvVar('GEMINI_PRO_THRESHOLD_BTC', 100, 1, 10000);
  const maxRetries = getNumericEnvVar('GEMINI_MAX_RETRIES', 2, 0, 5);
  const timeoutMs = getNumericEnvVar('GEMINI_TIMEOUT_MS', 15000, 1000, 60000);
  const maxRequestsPerMinute = getNumericEnvVar('GEMINI_MAX_REQUESTS_PER_MINUTE', 60, 1, 1000);
  
  // Load token limits
  const flashMaxTokens = getNumericEnvVar('GEMINI_FLASH_MAX_OUTPUT_TOKENS', 8192, 1024, 65536);
  const proMaxTokens = getNumericEnvVar('GEMINI_PRO_MAX_OUTPUT_TOKENS', 32768, 1024, 65536);
  
  const config: GeminiConfig = {
    apiKey,
    defaultModel,
    enableThinking,
    proThresholdBTC,
    maxRetries,
    timeoutMs,
    maxRequestsPerMinute,
    flashConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: flashMaxTokens,
    },
    proConfig: {
      temperature: 0.8,
      topK: 64,
      topP: 0.95,
      maxOutputTokens: proMaxTokens,
    },
  };
  
  // Log configuration (without exposing API key)
  console.log('[Gemini Config] Configuration loaded:', {
    defaultModel: config.defaultModel,
    enableThinking: config.enableThinking,
    proThresholdBTC: config.proThresholdBTC,
    maxRetries: config.maxRetries,
    timeoutMs: config.timeoutMs,
    flashMaxTokens: config.flashConfig.maxOutputTokens,
    proMaxTokens: config.proConfig.maxOutputTokens,
    apiKeyValid: true,
  });
  
  return config;
}

/**
 * Validates Gemini configuration at startup
 * 
 * @returns Validation result with errors if any
 */
export function validateGeminiConfigAtStartup(): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check API key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    errors.push(
      'GEMINI_API_KEY is missing. Get your API key from: https://aistudio.google.com/app/apikey'
    );
  } else if (!validateGeminiAPIKey(apiKey)) {
    errors.push(
      'GEMINI_API_KEY has invalid format. Must start with "AIzaSy" and be 39 characters long.'
    );
  }
  
  // Check model
  const model = process.env.GEMINI_MODEL;
  if (model && !validateGeminiModel(model)) {
    warnings.push(
      `GEMINI_MODEL="${model}" is invalid. Valid options: gemini-2.5-flash, gemini-2.5-pro. Using default: gemini-2.5-flash`
    );
  }
  
  // Check numeric values
  const threshold = process.env.GEMINI_PRO_THRESHOLD_BTC;
  if (threshold) {
    const parsed = parseInt(threshold, 10);
    if (isNaN(parsed) || parsed < 1) {
      warnings.push(
        `GEMINI_PRO_THRESHOLD_BTC="${threshold}" is invalid. Must be >= 1. Using default: 100`
      );
    }
  }
  
  const retries = process.env.GEMINI_MAX_RETRIES;
  if (retries) {
    const parsed = parseInt(retries, 10);
    if (isNaN(parsed) || parsed < 0 || parsed > 5) {
      warnings.push(
        `GEMINI_MAX_RETRIES="${retries}" is invalid. Must be 0-5. Using default: 2`
      );
    }
  }
  
  const timeout = process.env.GEMINI_TIMEOUT_MS;
  if (timeout) {
    const parsed = parseInt(timeout, 10);
    if (isNaN(parsed) || parsed < 1000 || parsed > 60000) {
      warnings.push(
        `GEMINI_TIMEOUT_MS="${timeout}" is invalid. Must be 1000-60000. Using default: 15000`
      );
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Selects appropriate Gemini model based on transaction size
 * 
 * @param amountBTC - Transaction amount in BTC
 * @param userPreference - Optional user preference override
 * @param config - Gemini configuration
 * @returns Selected model name
 */
export function selectGeminiModel(
  amountBTC: number,
  userPreference?: 'flash' | 'pro',
  config?: GeminiConfig
): GeminiModel {
  // User preference override
  if (userPreference === 'pro') {
    return 'gemini-2.5-pro';
  }
  if (userPreference === 'flash') {
    return 'gemini-2.5-flash';
  }
  
  // Load config if not provided
  const threshold = config?.proThresholdBTC ?? 100;
  
  // Automatic selection based on transaction size
  if (amountBTC >= threshold) {
    return 'gemini-2.5-pro';
  }
  
  return 'gemini-2.5-flash';
}

/**
 * Gets model configuration based on model name
 * 
 * @param model - Model name
 * @param config - Gemini configuration
 * @returns Model-specific configuration
 */
export function getModelConfig(
  model: GeminiModel,
  config: GeminiConfig
): GeminiConfig['flashConfig'] | GeminiConfig['proConfig'] {
  return model === 'gemini-2.5-pro' ? config.proConfig : config.flashConfig;
}

// Export singleton config instance (lazy loaded)
let cachedConfig: GeminiConfig | null = null;

/**
 * Gets cached Gemini configuration (loads on first call)
 * 
 * @returns Gemini configuration
 */
export function getGeminiConfig(): GeminiConfig {
  if (!cachedConfig) {
    cachedConfig = loadGeminiConfig();
  }
  return cachedConfig;
}

/**
 * Resets cached configuration (useful for testing)
 */
export function resetGeminiConfig(): void {
  cachedConfig = null;
}

/**
 * Rate Limits and Cost Information
 * 
 * GEMINI API RATE LIMITS (as of January 2025):
 * ============================================
 * 
 * Free Tier:
 * - 15 requests per minute (RPM)
 * - 1,500 requests per day (RPD)
 * - 1 million tokens per minute (TPM)
 * 
 * Pay-as-you-go:
 * - 360 requests per minute (RPM)
 * - No daily limit
 * - 4 million tokens per minute (TPM)
 * 
 * Rate Limit Headers:
 * - X-RateLimit-Limit: Maximum requests allowed
 * - X-RateLimit-Remaining: Requests remaining in current window
 * - X-RateLimit-Reset: Time when limit resets (Unix timestamp)
 * 
 * Rate Limit Error (429):
 * - Wait time indicated in Retry-After header (seconds)
 * - Implement exponential backoff: 1s, 2s, 4s, 8s
 * - Maximum 2-3 retry attempts recommended
 * 
 * COST ESTIMATES (as of January 2025):
 * ====================================
 * 
 * Gemini 2.5 Flash:
 * - Input: $0.01 per 1M tokens (~$0.00001 per 1K tokens)
 * - Output: $0.03 per 1M tokens (~$0.00003 per 1K tokens)
 * - Typical whale analysis: ~2K input + 1K output = $0.00005 per analysis
 * - 1,000 analyses: ~$0.05
 * - 10,000 analyses: ~$0.50
 * 
 * Gemini 2.5 Pro:
 * - Input: $0.05 per 1M tokens (~$0.00005 per 1K tokens)
 * - Output: $0.15 per 1M tokens (~$0.00015 per 1K tokens)
 * - Typical whale analysis: ~2K input + 2K output = $0.0004 per analysis
 * - 1,000 analyses: ~$0.40
 * - 10,000 analyses: ~$4.00
 * 
 * Deep Dive Analysis (Pro with blockchain data):
 * - Input: ~10K tokens (blockchain history + transaction data)
 * - Output: ~8K tokens (comprehensive analysis)
 * - Cost per Deep Dive: ~$0.0017
 * - 1,000 Deep Dives: ~$1.70
 * 
 * Token Estimation:
 * - 1 token ≈ 4 characters (English text)
 * - 1 token ≈ 0.75 words (average)
 * - Whale transaction prompt: ~500 tokens
 * - Blockchain data (10 transactions): ~2,000 tokens
 * - Typical analysis response: 500-2,000 tokens
 * - Deep Dive response: 4,000-8,000 tokens
 * 
 * Cost Optimization Tips:
 * 1. Use Flash for transactions < 100 BTC (10x cheaper)
 * 2. Reduce maxOutputTokens to limit response length
 * 3. Cache analysis results for identical transactions
 * 4. Implement request batching where possible
 * 5. Monitor token usage with response metadata
 * 6. Set GEMINI_FLASH_MAX_OUTPUT_TOKENS=4096 for cost savings
 * 7. Only use Deep Dive for high-value transactions (>= 100 BTC)
 * 
 * Monthly Cost Examples:
 * - 1,000 Flash analyses/month: ~$0.05/month
 * - 10,000 Flash analyses/month: ~$0.50/month
 * - 1,000 Pro analyses/month: ~$0.40/month
 * - 100 Deep Dive analyses/month: ~$0.17/month
 * - Mixed usage (9,000 Flash + 1,000 Pro + 100 Deep Dive): ~$1.12/month
 * 
 * Monitoring Recommendations:
 * - Track processingTime in response metadata
 * - Log token usage from API responses
 * - Set up alerts for rate limit errors (429)
 * - Monitor daily/monthly costs in Google Cloud Console
 * - Implement usage quotas per user/feature
 * 
 * @see https://ai.google.dev/pricing for latest pricing
 * @see https://ai.google.dev/gemini-api/docs/quota for rate limits
 */
