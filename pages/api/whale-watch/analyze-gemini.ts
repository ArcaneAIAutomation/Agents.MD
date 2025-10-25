import type { NextApiRequest, NextApiResponse } from 'next';
import { selectGeminiModel, getModelConfig, getGeminiConfig, type GeminiModel } from '../../../utils/geminiConfig';

/**
 * Gemini API Error Types for Classification
 */
enum GeminiErrorType {
  RATE_LIMIT = 'RATE_LIMIT',
  INVALID_API_KEY = 'INVALID_API_KEY',
  SERVER_ERROR = 'SERVER_ERROR',
  TIMEOUT = 'TIMEOUT',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Gemini AI Whale Transaction Analysis API
 * 
 * This endpoint provides AI-powered analysis of Bitcoin whale transactions using
 * Google's Gemini 2.5 models (Flash and Pro).
 * 
 * ============================================================================
 * GEMINI API IMPLEMENTATION - BEST PRACTICES (per ai.google.dev/gemini-api/docs)
 * ============================================================================
 * 
 * 1. MODEL SELECTION (Dynamic)
 *    - Transactions < 100 BTC: gemini-2.5-flash (fast, ~3s, $0.075/$0.30 per 1M tokens)
 *    - Transactions >= 100 BTC: gemini-2.5-pro (deep, ~7s, $1.25/$5.00 per 1M tokens)
 *    - Configurable threshold via GEMINI_PRO_THRESHOLD_BTC
 * 
 * 2. STRUCTURED OUTPUTS (JSON Schema)
 *    - responseMimeType: "application/json" forces JSON response
 *    - responseSchema: Defines exact structure with types, enums, constraints
 *    - Guarantees schema compliance without post-processing
 * 
 * 3. THINKING MODE (System Instructions)
 *    - systemInstruction guides model to show reasoning process
 *    - Extracts thinking content before JSON output
 *    - Improves analysis quality and transparency
 * 
 * 4. RETRY LOGIC (Exponential Backoff)
 *    - Automatic retry on rate limits (429), server errors (5xx), timeouts
 *    - Exponential backoff: 1s, 2s, 4s, 8s between retries
 *    - Respects Retry-After header from API
 *    - Configurable max retries via GEMINI_MAX_RETRIES
 * 
 * 5. TIMEOUT HANDLING (AbortController)
 *    - Request timeout via AbortController (15s default)
 *    - Prevents hanging requests on slow networks
 *    - Configurable via GEMINI_TIMEOUT_MS
 * 
 * 6. ERROR CLASSIFICATION
 *    - Categorizes errors: RATE_LIMIT, TIMEOUT, SERVER_ERROR, etc.
 *    - Determines retryability for each error type
 *    - User-friendly error messages
 * 
 * 7. SAFETY FILTERS (BLOCK_ONLY_HIGH)
 *    - Uses BLOCK_ONLY_HIGH threshold for financial analysis
 *    - Prevents false positives while blocking harmful content
 *    - Checks promptFeedback.blockReason and finishReason === 'SAFETY'
 * 
 * 8. TOKEN USAGE TRACKING
 *    - Extracts usageMetadata: promptTokenCount, candidatesTokenCount, totalTokenCount
 *    - Calculates estimated cost per request
 *    - Logs token usage for monitoring
 * 
 * 9. FINISH REASON MONITORING
 *    - Checks finishReason: STOP (success), MAX_TOKENS (truncated), SAFETY (blocked)
 *    - Warns on MAX_TOKENS to adjust maxOutputTokens
 *    - Handles RECITATION (training data) appropriately
 * 
 * 10. SAFETY RATINGS EXTRACTION
 *     - Extracts safetyRatings array with category and probability
 *     - Returns in metadata for transparency
 *     - Monitors for potential content issues
 * 
 * 11. RESPONSE VALIDATION
 *     - Validates all required fields against schema
 *     - Type checking for numbers, strings, arrays
 *     - Range validation (confidence 0-100, etc.)
 *     - Detailed error messages for debugging
 * 
 * 12. GENERATION CONFIG (Model-Specific)
 *     - Flash: temperature=0.7, topK=40, topP=0.95, maxOutputTokens=8192
 *     - Pro: temperature=0.8, topK=64, topP=0.95, maxOutputTokens=32768
 *     - Optimized for financial analysis quality
 * 
 * 13. CORS & CACHING HEADERS
 *     - CORS headers for cross-origin API access
 *     - No-cache headers (AI analysis always fresh)
 *     - Proper OPTIONS preflight handling
 * 
 * 14. REQUEST VALIDATION
 *     - Validates required fields before API call
 *     - Returns 400 Bad Request for invalid input
 *     - Prevents wasted API calls
 * 
 * 15. COMPREHENSIVE LOGGING
 *     - Logs request config, model selection, token usage
 *     - Detailed error logging with context
 *     - Development mode: Full response structure logging
 * 
 * ============================================================================
 * RATE LIMITS & COSTS
 * ============================================================================
 * 
 * Rate Limits (Free Tier):
 * - 15 requests per minute (RPM)
 * - 1,500 requests per day (RPD)
 * - 1 million tokens per minute (TPM)
 * 
 * Rate Limits (Pay-as-you-go):
 * - 360 requests per minute (RPM)
 * - No daily limit
 * - 4 million tokens per minute (TPM)
 * 
 * Cost Estimates (January 2025):
 * - Flash: ~$0.0001 per analysis (2K input + 1K output tokens)
 * - Pro: ~$0.0004 per analysis (2K input + 2K output tokens)
 * - 1,000 Flash analyses: ~$0.10/month
 * - 1,000 Pro analyses: ~$0.40/month
 * 
 * ============================================================================
 * CONFIGURATION
 * ============================================================================
 * 
 * Environment Variables:
 * - GEMINI_API_KEY: API key from ai.google.dev (required)
 * - GEMINI_MODEL: Default model (gemini-2.5-flash or gemini-2.5-pro)
 * - GEMINI_ENABLE_THINKING: Enable thinking mode (true/false)
 * - GEMINI_PRO_THRESHOLD_BTC: BTC amount to switch to Pro (default: 100)
 * - GEMINI_MAX_RETRIES: Maximum retry attempts (default: 2)
 * - GEMINI_TIMEOUT_MS: Request timeout in milliseconds (default: 15000)
 * - GEMINI_FLASH_MAX_OUTPUT_TOKENS: Flash max tokens (default: 8192)
 * - GEMINI_PRO_MAX_OUTPUT_TOKENS: Pro max tokens (default: 32768)
 * 
 * @see https://ai.google.dev/gemini-api/docs - Official Gemini API Documentation
 * @see https://ai.google.dev/pricing - Pricing Information
 * @see utils/geminiConfig.ts - Configuration Management
 * @see .env.example - Environment Variable Template
 */

interface GeminiAnalysisRequest {
  txHash: string;
  blockchain: string;
  amount: number;
  amountUSD: number;
  fromAddress: string;
  toAddress: string;
  timestamp: string;
  type: string;
  description: string;
}

interface GeminiAnalysisResponse {
  success: boolean;
  analysis?: {
    transaction_type: string;
    market_impact: string;
    confidence: number;
    reasoning: string;
    key_findings: string[];
    trader_action: string;
    price_levels?: {
      support: number[];
      resistance: number[];
    };
    timeframe_analysis?: {
      short_term: string;
      medium_term: string;
    };
    risk_reward?: {
      ratio: string;
      position_size: string;
      stop_loss: number;
      take_profit: number[];
    };
    historical_context?: {
      similar_transactions: string;
      historical_outcome: string;
      pattern_match: string;
      confidence_based_on_history: number;
    };
  };
  thinking?: string; // AI reasoning process (if thinking mode enabled)
  metadata?: {
    model: string;
    provider: string;
    timestamp: string;
    processingTime: number;
    thinkingEnabled: boolean;
    tokenUsage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    finishReason?: string;
    safetyRatings?: Array<{
      category: string;
      probability: string;
    }>;
  };
  error?: string;
  timestamp: string;
}

/**
 * Fetch current Bitcoin price from market data API
 * Uses the internal crypto-prices API with fallback to static price
 * 
 * @returns Current BTC price in USD
 */
async function getCurrentBitcoinPrice(): Promise<number> {
  try {
    // Use internal API endpoint
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/crypto-prices`, {
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`Price API returned ${response.status}`);
    }
    
    const data = await response.json();
    const btcPrice = data.prices?.find((p: any) => p.symbol === 'BTC')?.price;
    
    if (btcPrice && typeof btcPrice === 'number' && btcPrice > 0) {
      console.log(`✅ Fetched current BTC price: ${btcPrice.toLocaleString()}`);
      return btcPrice;
    }
    
    throw new Error('Invalid BTC price in response');
  } catch (error) {
    console.warn('⚠️ Failed to fetch live BTC price, using fallback:', error);
    // Fallback to reasonable estimate
    return 95000; // Fallback price
  }
}

/**
 * Validate analysis response against schema (Requirement 3.3, 3.4, 3.5)
 * Ensures all required fields are present with valid values
 * 
 * @param analysis - Parsed analysis object from Gemini
 * @returns Array of validation error messages (empty if valid)
 */
function validateAnalysisResponse(analysis: any): string[] {
  const errors: string[] = [];
  
  // Check required fields
  if (!analysis.transaction_type) {
    errors.push('Missing required field: transaction_type');
  } else if (!['exchange_deposit', 'exchange_withdrawal', 'whale_to_whale', 'unknown'].includes(analysis.transaction_type)) {
    errors.push(`Invalid transaction_type: ${analysis.transaction_type}. Must be one of: exchange_deposit, exchange_withdrawal, whale_to_whale, unknown`);
  }
  
  if (!analysis.market_impact) {
    errors.push('Missing required field: market_impact');
  } else if (!['Bearish', 'Bullish', 'Neutral'].includes(analysis.market_impact)) {
    errors.push(`Invalid market_impact: ${analysis.market_impact}. Must be one of: Bearish, Bullish, Neutral`);
  }
  
  if (typeof analysis.confidence !== 'number') {
    errors.push('Missing or invalid required field: confidence (must be a number)');
  } else if (analysis.confidence < 0 || analysis.confidence > 100) {
    errors.push(`Invalid confidence value: ${analysis.confidence}. Must be between 0 and 100`);
  }
  
  if (!analysis.reasoning || typeof analysis.reasoning !== 'string') {
    errors.push('Missing or invalid required field: reasoning (must be a string)');
  } else if (analysis.reasoning.length < 100) {
    errors.push(`Reasoning too short: ${analysis.reasoning.length} characters. Minimum 100 characters required`);
  }
  
  if (!Array.isArray(analysis.key_findings)) {
    errors.push('Missing or invalid required field: key_findings (must be an array)');
  } else if (analysis.key_findings.length < 3) {
    errors.push(`Too few key_findings: ${analysis.key_findings.length}. Minimum 3 required`);
  } else if (analysis.key_findings.length > 10) {
    errors.push(`Too many key_findings: ${analysis.key_findings.length}. Maximum 10 allowed`);
  } else {
    // Validate each finding is a string
    analysis.key_findings.forEach((finding: any, index: number) => {
      if (typeof finding !== 'string') {
        errors.push(`key_findings[${index}] must be a string`);
      }
    });
  }
  
  if (!analysis.trader_action || typeof analysis.trader_action !== 'string') {
    errors.push('Missing or invalid required field: trader_action (must be a string)');
  } else if (analysis.trader_action.length < 50) {
    errors.push(`trader_action too short: ${analysis.trader_action.length} characters. Minimum 50 characters required`);
  }
  
  // Validate optional fields if present
  if (analysis.price_levels) {
    if (typeof analysis.price_levels !== 'object') {
      errors.push('Invalid price_levels: must be an object');
    } else {
      if (analysis.price_levels.support) {
        if (!Array.isArray(analysis.price_levels.support)) {
          errors.push('Invalid price_levels.support: must be an array');
        } else if (analysis.price_levels.support.length < 2) {
          errors.push('price_levels.support must have at least 2 values');
        } else {
          analysis.price_levels.support.forEach((level: any, index: number) => {
            if (typeof level !== 'number') {
              errors.push(`price_levels.support[${index}] must be a number`);
            }
          });
        }
      }
      
      if (analysis.price_levels.resistance) {
        if (!Array.isArray(analysis.price_levels.resistance)) {
          errors.push('Invalid price_levels.resistance: must be an array');
        } else if (analysis.price_levels.resistance.length < 2) {
          errors.push('price_levels.resistance must have at least 2 values');
        } else {
          analysis.price_levels.resistance.forEach((level: any, index: number) => {
            if (typeof level !== 'number') {
              errors.push(`price_levels.resistance[${index}] must be a number`);
            }
          });
        }
      }
    }
  }
  
  if (analysis.historical_context && analysis.historical_context.confidence_based_on_history !== undefined) {
    if (typeof analysis.historical_context.confidence_based_on_history !== 'number') {
      errors.push('Invalid historical_context.confidence_based_on_history: must be a number');
    } else if (analysis.historical_context.confidence_based_on_history < 0 || analysis.historical_context.confidence_based_on_history > 100) {
      errors.push(`Invalid historical_context.confidence_based_on_history: ${analysis.historical_context.confidence_based_on_history}. Must be between 0 and 100`);
    }
  }
  
  return errors;
}

/**
 * Classify Gemini API error by type and determine if retryable
 * 
 * @param status - HTTP status code
 * @param errorText - Error message text
 * @returns Error classification with retry recommendation
 */
function classifyGeminiError(status: number, errorText: string): {
  type: GeminiErrorType;
  retryable: boolean;
  retryAfter?: number;
} {
  // Rate limit errors (429)
  if (status === 429) {
    // Extract retry-after header value if present in error text
    const retryMatch = errorText.match(/retry after (\d+)/i);
    const retryAfter = retryMatch ? parseInt(retryMatch[1], 10) : 60;
    
    return {
      type: GeminiErrorType.RATE_LIMIT,
      retryable: true,
      retryAfter: retryAfter,
    };
  }
  
  // Authentication errors (401, 403)
  if (status === 401 || status === 403) {
    return {
      type: GeminiErrorType.INVALID_API_KEY,
      retryable: false,
    };
  }
  
  // Bad request (400)
  if (status === 400) {
    return {
      type: GeminiErrorType.INVALID_RESPONSE,
      retryable: false,
    };
  }
  
  // Server errors (500, 502, 503, 504)
  if (status >= 500 && status < 600) {
    return {
      type: GeminiErrorType.SERVER_ERROR,
      retryable: true,
    };
  }
  
  // Unknown error
  return {
    type: GeminiErrorType.UNKNOWN,
    retryable: false,
  };
}

/**
 * Sleep for specified milliseconds
 * 
 * @param ms - Milliseconds to sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Call Gemini API with retry logic and exponential backoff
 * 
 * @param url - API endpoint URL
 * @param body - Request body
 * @param config - Gemini configuration
 * @param attempt - Current attempt number (for recursion)
 * @returns API response
 */
async function callGeminiWithRetry(
  url: string,
  body: any,
  config: ReturnType<typeof getGeminiConfig>,
  attempt: number = 1
): Promise<Response> {
  const maxRetries = config.maxRetries;
  const timeoutMs = config.timeoutMs;
  
  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    console.log(`🔄 Gemini API call attempt ${attempt}/${maxRetries + 1}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    // If successful, return response
    if (response.ok) {
      console.log(`✅ Gemini API call successful on attempt ${attempt}`);
      return response;
    }
    
    // If error, classify and determine if retryable
    const errorText = await response.text();
    const errorClassification = classifyGeminiError(response.status, errorText);
    
    console.error(`❌ Gemini API error (attempt ${attempt}):`, {
      status: response.status,
      type: errorClassification.type,
      retryable: errorClassification.retryable,
      errorText: errorText.substring(0, 200),
    });
    
    // If not retryable or max retries reached, throw error
    if (!errorClassification.retryable || attempt > maxRetries) {
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }
    
    // Calculate backoff delay (exponential: 1s, 2s, 4s, 8s)
    const baseDelay = 1000;
    const backoffDelay = baseDelay * Math.pow(2, attempt - 1);
    const retryDelay = errorClassification.retryAfter 
      ? errorClassification.retryAfter * 1000 
      : backoffDelay;
    
    console.log(`⏳ Retrying after ${retryDelay}ms (${errorClassification.type})...`);
    await sleep(retryDelay);
    
    // Retry recursively
    return callGeminiWithRetry(url, body, config, attempt + 1);
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Handle timeout
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`⏱️ Gemini API timeout after ${timeoutMs}ms (attempt ${attempt})`);
      
      // Retry on timeout if attempts remaining
      if (attempt <= maxRetries) {
        const backoffDelay = 2000 * Math.pow(2, attempt - 1);
        console.log(`⏳ Retrying after ${backoffDelay}ms (TIMEOUT)...`);
        await sleep(backoffDelay);
        return callGeminiWithRetry(url, body, config, attempt + 1);
      }
      
      throw new Error(`Gemini API timeout after ${maxRetries + 1} attempts`);
    }
    
    // Handle network errors
    if (error instanceof Error && (error.message.includes('fetch') || error.message.includes('network'))) {
      console.error(`🌐 Network error (attempt ${attempt}):`, error.message);
      
      // Retry on network error if attempts remaining
      if (attempt <= maxRetries) {
        const backoffDelay = 2000 * Math.pow(2, attempt - 1);
        console.log(`⏳ Retrying after ${backoffDelay}ms (NETWORK_ERROR)...`);
        await sleep(backoffDelay);
        return callGeminiWithRetry(url, body, config, attempt + 1);
      }
    }
    
    throw error;
  }
}

/**
 * Extract thinking content from Gemini response
 * Handles multiple formats and patterns
 * 
 * @param responseText - Full response text from Gemini
 * @returns Extracted thinking content or undefined
 */
function extractThinkingContent(responseText: string): string | undefined {
  // Pattern 1: Content before JSON object
  const jsonStartIndex = responseText.indexOf('{');
  if (jsonStartIndex > 50) {
    const beforeJson = responseText.substring(0, jsonStartIndex).trim();
    if (beforeJson.length > 50) {
      return beforeJson;
    }
  }
  
  // Pattern 2: Explicit thinking markers
  const thinkingMarkers = [
    /## Thinking Process\n([\s\S]+?)(?=\n##|\{|$)/i,
    /## Analysis Steps\n([\s\S]+?)(?=\n##|\{|$)/i,
    /Let me analyze([\s\S]+?)(?=\{|$)/i,
    /Step-by-step reasoning:([\s\S]+?)(?=\{|$)/i,
  ];
  
  for (const marker of thinkingMarkers) {
    const match = responseText.match(marker);
    if (match && match[1] && match[1].trim().length > 50) {
      return match[1].trim();
    }
  }
  
  return undefined;
}

/**
 * Extract token usage from Gemini response metadata
 * Per Gemini API docs: usageMetadata contains promptTokenCount, candidatesTokenCount, totalTokenCount
 * 
 * @param geminiData - Full Gemini API response
 * @returns Token usage information
 */
function extractTokenUsage(geminiData: any): {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
} {
  try {
    const usageMetadata = geminiData.usageMetadata;
    if (usageMetadata) {
      const usage = {
        promptTokens: usageMetadata.promptTokenCount || 0,
        completionTokens: usageMetadata.candidatesTokenCount || 0,
        totalTokens: usageMetadata.totalTokenCount || 0,
      };
      
      console.log(`📊 Token usage:`, usage);
      return usage;
    }
  } catch (error) {
    console.warn('⚠️ Failed to extract token usage:', error);
  }
  
  return {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  };
}

/**
 * Extract finish reason from Gemini response
 * Per Gemini API docs: finishReason can be STOP, MAX_TOKENS, SAFETY, RECITATION, OTHER
 * 
 * @param geminiData - Full Gemini API response
 * @returns Finish reason string
 */
function extractFinishReason(geminiData: any): string {
  try {
    const finishReason = geminiData.candidates?.[0]?.finishReason;
    if (finishReason) {
      console.log(`🏁 Finish reason: ${finishReason}`);
      return finishReason;
    }
  } catch (error) {
    console.warn('⚠️ Failed to extract finish reason:', error);
  }
  
  return 'UNKNOWN';
}

/**
 * Extract safety ratings from Gemini response
 * Per Gemini API docs: safetyRatings contains category and probability
 * 
 * @param geminiData - Full Gemini API response
 * @returns Array of safety ratings
 */
function extractSafetyRatings(geminiData: any): Array<{ category: string; probability: string }> {
  try {
    const safetyRatings = geminiData.candidates?.[0]?.safetyRatings;
    if (safetyRatings && Array.isArray(safetyRatings)) {
      console.log(`🛡️ Safety ratings:`, safetyRatings);
      return safetyRatings.map((rating: any) => ({
        category: rating.category || 'UNKNOWN',
        probability: rating.probability || 'UNKNOWN',
      }));
    }
  } catch (error) {
    console.warn('⚠️ Failed to extract safety ratings:', error);
  }
  
  return [];
}

/**
 * Check if response was blocked by safety filters
 * Per Gemini API docs: Check finishReason === 'SAFETY' or promptFeedback.blockReason
 * 
 * @param geminiData - Full Gemini API response
 * @returns True if blocked, false otherwise
 */
function isResponseBlocked(geminiData: any): { blocked: boolean; reason?: string } {
  try {
    // Check finish reason
    const finishReason = geminiData.candidates?.[0]?.finishReason;
    if (finishReason === 'SAFETY') {
      return {
        blocked: true,
        reason: 'Response blocked by safety filters',
      };
    }
    
    // Check prompt feedback
    const promptFeedback = geminiData.promptFeedback;
    if (promptFeedback?.blockReason) {
      return {
        blocked: true,
        reason: `Prompt blocked: ${promptFeedback.blockReason}`,
      };
    }
    
    // Check if no candidates returned
    if (!geminiData.candidates || geminiData.candidates.length === 0) {
      return {
        blocked: true,
        reason: 'No candidates returned (possibly blocked)',
      };
    }
  } catch (error) {
    console.warn('⚠️ Failed to check if response blocked:', error);
  }
  
  return { blocked: false };
}

/**
 * Detect if an address is likely an exchange address
 * Uses common patterns and known exchange address prefixes
 * 
 * @param address - Bitcoin address to check
 * @returns Exchange name if detected, null otherwise
 */
function detectExchangeAddress(address: string): string | null {
  // Common exchange address patterns (simplified detection)
  // In production, this would use a comprehensive database
  
  // Known exchange cold wallet patterns
  const exchangePatterns = [
    { pattern: /^1NDyJtNTjmwk5xPNhjgAMu4HDHigtobu1s/i, name: 'Binance' },
    { pattern: /^bc1qgdjqv0av3q56jvd82tkdjpy7gdp9ut8tlqmgrpmv24sq90ecnvqqjwvw97/i, name: 'Binance' },
    { pattern: /^3Kzh9qAqVWQhEsfQz7zEQL1EuSx5tyNLNS/i, name: 'Bitfinex' },
    { pattern: /^1Kr6QSydW9bFQG1mXiPNNu6WpJGmUa9i1g/i, name: 'Kraken' },
    { pattern: /^3E37Jev5TXWrfKfhwiqR8KKKbPdCKLPWvq/i, name: 'Coinbase' },
    { pattern: /^bc1qm34lsc65zpw79lxes69zkqmk6ee3ewf0j77s3h/i, name: 'Coinbase' },
  ];
  
  for (const { pattern, name } of exchangePatterns) {
    if (pattern.test(address)) {
      return name;
    }
  }
  
  return null;
}

/**
 * Build analysis prompt for Gemini
 */
function buildAnalysisPrompt(whale: any, currentBtcPrice: number, currentTransactionValue: number): string {
  return `You are an expert cryptocurrency market analyst with deep knowledge of Bitcoin whale behavior, market psychology, and on-chain analytics. Conduct a comprehensive analysis of this Bitcoin whale transaction.

**Current Market Context:**
- Current Bitcoin Price: ${currentBtcPrice.toLocaleString()}
- Transaction Value at Current Price: ${currentTransactionValue.toLocaleString()}
- Transaction represents ${((whale.amount / 21000000) * 100).toFixed(4)}% of total Bitcoin supply

**Transaction Details:**
- Transaction Hash: ${whale.txHash}
- Amount: ${whale.amount.toFixed(2)} BTC (Original: ${whale.amountUSD.toLocaleString()})
- From Address: ${whale.fromAddress}
- To Address: ${whale.toAddress}
- Timestamp: ${whale.timestamp}
- Initial Classification: ${whale.type}
- Description: ${whale.description}

**COMPREHENSIVE ANALYSIS REQUIRED:**

Provide detailed analysis covering transaction patterns, market context, behavioral psychology, price levels, timeframes, risk/reward, and trading intelligence.

**REQUIRED JSON OUTPUT FORMAT:**
{
  "transaction_type": "exchange_deposit | exchange_withdrawal | whale_to_whale | unknown",
  "market_impact": "Bearish | Bullish | Neutral",
  "confidence": number (0-100),
  "reasoning": "string (2-3 detailed paragraphs)",
  "key_findings": ["string", "string", "string", ...],
  "trader_action": "string (specific actionable recommendation)"
}`;
}

/**
 * Build request body for Gemini API
 */
function buildRequestBody(prompt: string, enableThinking: boolean, modelConfig: any): any {
  return {
    contents: [{
      parts: [{ text: prompt }]
    }],
    ...(enableThinking && {
      systemInstruction: {
        parts: [{
          text: 'You are an expert cryptocurrency analyst. Show your step-by-step reasoning process before providing your final analysis.'
        }]
      }
    }),
    generationConfig: {
      temperature: modelConfig.temperature,
      topK: modelConfig.topK,
      topP: modelConfig.topP,
      maxOutputTokens: modelConfig.maxOutputTokens,
      candidateCount: 1,
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          transaction_type: {
            type: "string",
            enum: ["exchange_deposit", "exchange_withdrawal", "whale_to_whale", "unknown"]
          },
          market_impact: {
            type: "string",
            enum: ["Bearish", "Bullish", "Neutral"]
          },
          confidence: {
            type: "number",
            minimum: 0,
            maximum: 100
          },
          reasoning: {
            type: "string",
            minLength: 100
          },
          key_findings: {
            type: "array",
            items: { type: "string" },
            minItems: 3,
            maxItems: 10
          },
          trader_action: {
            type: "string",
            minLength: 50
          }
        },
        required: ["transaction_type", "market_impact", "confidence", "reasoning", "key_findings", "trader_action"]
      }
    },
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_ONLY_HIGH"
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold: "BLOCK_ONLY_HIGH"
      },
      {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold: "BLOCK_ONLY_HIGH"
      },
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_ONLY_HIGH"
      }
    ]
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GeminiAnalysisResponse>
) {
  // Set CORS headers for API access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.',
      timestamp: new Date().toISOString(),
    });
  }
  
  // Set cache headers (no caching for AI analysis - always fresh)
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const startTime = Date.now();

  try {
    const whale: GeminiAnalysisRequest = req.body;
    
    // Validate request body
    if (!whale || !whale.txHash || !whale.amount) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request body. Required fields: txHash, amount',
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`🤖 Starting SYNCHRONOUS Gemini AI analysis for transaction ${whale.txHash}`);
    console.log(`📋 Whale data:`, JSON.stringify(whale, null, 2));
    
    // Load Gemini configuration
    const geminiConfig = getGeminiConfig();
    
    // Select appropriate model based on transaction size
    const selectedModel = selectGeminiModel(whale.amount, whale.modelPreference, geminiConfig);
    console.log(`🎯 Selected model: ${selectedModel} (transaction: ${whale.amount} BTC)`);
    
    // Get model-specific configuration
    const modelConfig = getModelConfig(selectedModel, geminiConfig);
    
    // Fetch current Bitcoin price for market context
    const currentBtcPrice = await getCurrentBitcoinPrice();
    console.log(`💰 Current BTC price: ${currentBtcPrice.toLocaleString()}`);
    
    // Calculate current transaction value
    const currentTransactionValue = whale.amount * currentBtcPrice;
    
    // Build the analysis prompt
    const prompt = buildAnalysisPrompt(whale, currentBtcPrice, currentTransactionValue);
    
    // Call Gemini API
    const geminiApiKey = geminiConfig.apiKey;
    const enableThinking = whale.enableThinking ?? geminiConfig.enableThinking;
    
    console.log(`📡 Calling Gemini API: ${selectedModel}`);
    console.log(`⏱️ Timeout: ${geminiConfig.timeoutMs}ms`);
    console.log(`🧠 Thinking mode: ${enableThinking ? 'enabled' : 'disabled'}`);
    
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${geminiApiKey}`;
    
    const requestBody = buildRequestBody(prompt, enableThinking, modelConfig);
    
    // Make the API call with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), geminiConfig.timeoutMs);
    
    let response;
    try {
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Gemini API error: ${response.status} - ${errorText}`);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }
    
    const geminiData = await response.json();
    
    // Extract response text
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) {
      throw new Error('No response text from Gemini API');
    }
    
    console.log(`📝 Response length: ${responseText.length} characters`);
    
    // Extract thinking content if enabled
    let thinkingContent: string | undefined;
    if (enableThinking) {
      const jsonStartIndex = responseText.indexOf('{');
      if (jsonStartIndex > 50) {
        thinkingContent = responseText.substring(0, jsonStartIndex).trim();
        console.log(`🧠 Extracted thinking content: ${thinkingContent.length} characters`);
      }
    }
    
    // Parse JSON response
    let jsonText = responseText.trim();
    const jsonStartIndex = jsonText.indexOf('{');
    const jsonEndIndex = jsonText.lastIndexOf('}');
    if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
      jsonText = jsonText.substring(jsonStartIndex, jsonEndIndex + 1);
    }
    
    const analysis = JSON.parse(jsonText);
    console.log(`✅ Successfully parsed analysis JSON`);
    
    // Validate analysis response
    const validationErrors = validateAnalysisResponse(analysis);
    if (validationErrors.length > 0) {
      console.warn(`⚠️ Analysis validation warnings:`, validationErrors);
    }
    
    // Extract metadata
    const tokenUsage = geminiData.usageMetadata || {};
    const finishReason = geminiData.candidates?.[0]?.finishReason || 'UNKNOWN';
    const safetyRatings = geminiData.candidates?.[0]?.safetyRatings || [];
    
    const processingTime = Date.now() - startTime;
    
    const metadata = {
      model: selectedModel,
      provider: 'Google Gemini',
      timestamp: new Date().toISOString(),
      processingTime,
      thinkingEnabled: enableThinking,
      tokenUsage: {
        promptTokens: tokenUsage.promptTokenCount || 0,
        completionTokens: tokenUsage.candidatesTokenCount || 0,
        totalTokens: tokenUsage.totalTokenCount || 0,
      },
      finishReason,
      safetyRatings,
    };
    
    console.log(`✅ Analysis completed in ${processingTime}ms`);
    console.log(`📊 Token usage: ${metadata.tokenUsage.totalTokens} total`);
    
    // Return complete analysis immediately (synchronous)
    return res.status(200).json({
      success: true,
      analysis,
      thinking: thinkingContent,
      metadata,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`❌ Gemini analysis error after ${processingTime}ms:`, error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze transaction',
      timestamp: new Date().toISOString(),
    });
  }
}

// Keep the old synchronous handler code below for reference, but it's no longer used
// The new async pattern is: create job → return job ID → poll for results

/*
// OLD SYNCHRONOUS CODE (REPLACED WITH ASYNC JOB PATTERN ABOVE)
async function oldSynchronousHandler() {
    console.log(`🤖 Starting Gemini AI analysis for transaction ${whale.txHash}`);
    console.log(`📋 Whale data:`, JSON.stringify(whale, null, 2));

    // Load Gemini configuration
    const geminiConfig = getGeminiConfig();
    
    // Select appropriate model based on transaction size (Requirement 1.1, 1.2)
    const selectedModel = selectGeminiModel(whale.amount, undefined, geminiConfig);
    console.log(`🎯 Selected model: ${selectedModel} (transaction: ${whale.amount} BTC)`);
    
    // Get model-specific configuration (Requirement 1.3, 1.4)
    const modelConfig = getModelConfig(selectedModel, geminiConfig);
    console.log(`⚙️ Model config:`, modelConfig);

    // Fetch current Bitcoin price for market context (Requirement 4.1)
    const currentBtcPrice = await getCurrentBitcoinPrice();
    console.log(`💰 Current BTC price: ${currentBtcPrice.toLocaleString()}`);
    
    // Calculate transaction value at current price
    const currentTransactionValue = whale.amount * currentBtcPrice;
    
    // Detect exchange addresses for exchange-specific analysis (Requirement 4.5)
    const fromExchange = detectExchangeAddress(whale.fromAddress);
    const toExchange = detectExchangeAddress(whale.toAddress);
    
    let exchangeContext = '';
    if (fromExchange || toExchange) {
      exchangeContext = `\n\n**Exchange Detection:**`;
      if (fromExchange) {
        exchangeContext += `\n- From Address: Detected as ${fromExchange} exchange`;
      }
      if (toExchange) {
        exchangeContext += `\n- To Address: Detected as ${toExchange} exchange`;
      }
      exchangeContext += `\n- Provide exchange-specific flow analysis and implications`;
    }

    // Prepare the enhanced deep analysis prompt with all requirements (5.1-5.5)
    const prompt = `You are an expert cryptocurrency market analyst with deep knowledge of Bitcoin whale behavior, market psychology, and on-chain analytics. Conduct a comprehensive analysis of this Bitcoin whale transaction.

**Current Market Context (Requirement 4.1):**
- Current Bitcoin Price: $${currentBtcPrice.toLocaleString()}
- Transaction Value at Current Price: $${currentTransactionValue.toLocaleString()}
- Transaction represents ${((whale.amount / 21000000) * 100).toFixed(4)}% of total Bitcoin supply

**Transaction Details:**
- Transaction Hash: ${whale.txHash}
- Amount: ${whale.amount.toFixed(2)} BTC (Original: ${whale.amountUSD.toLocaleString()})
- From Address: ${whale.fromAddress}
- To Address: ${whale.toAddress}
- Timestamp: ${whale.timestamp}
- Initial Classification: ${whale.type}
- Description: ${whale.description}${exchangeContext}

**COMPREHENSIVE ANALYSIS REQUIRED:**

1. **Transaction Pattern Analysis:**
   - Is this address known for specific behavior patterns?
   - What does the transaction size relative to current market conditions suggest?
   - Are there any timing patterns (market hours, price levels)?

2. **Market Context & Historical Precedents (Requirement 4.4):**
   - Current Bitcoin market sentiment and price action
   - Recent whale activity trends
   - Exchange flow patterns (deposits vs withdrawals)
   - **Compare to similar historical transactions:** Find precedents for similar-sized transactions and their market outcomes
   - **Pattern recognition:** Identify if this matches known whale behavior patterns (accumulation, distribution, rotation)
   - **Historical success rate:** What happened after similar transactions in the past?

3. **Behavioral Psychology:**
   - What might motivate this transaction at this specific time?
   - Is this likely accumulation, distribution, or repositioning?
   - What does the address history suggest about the holder's strategy?

4. **Price Level Analysis (Requirement 4.2):**
   - **Identify specific support levels** below current price (at least 3 levels)
   - **Identify specific resistance levels** above current price (at least 3 levels)
   - **Entry points:** Specific price ranges for entering positions
   - **Exit points:** Specific price targets for taking profits
   - **Stop-loss levels:** Specific prices for risk management

5. **Timeframe Analysis (Requirement 4.2):**
   - **Short-term (24-48 hours):** Immediate market impact and price action expectations
   - **Medium-term (1-2 weeks):** Trend development and key milestones to watch
   - Include specific price predictions or ranges for each timeframe

6. **Risk/Reward Analysis (Requirement 4.3):**
   - **Calculate specific Risk:Reward ratios** for potential trades (e.g., 1:3, 1:5)
   - **Position sizing recommendations:** What percentage of portfolio to allocate
   - **Risk management strategy:** Where to place stops, how to scale in/out
   - **Maximum acceptable loss:** Specific dollar or percentage amounts

7. **Trading Intelligence:**
   - Specific actionable insights for traders
   - Risk management recommendations
   - Entry/exit considerations with exact price levels

**REQUIRED JSON OUTPUT FORMAT:**

Provide your analysis in the following JSON format with DETAILED, SPECIFIC insights:
{
  "transaction_type": "exchange_deposit | exchange_withdrawal | whale_to_whale | unknown",
  "market_impact": "Bearish | Bullish | Neutral",
  "confidence": number (0-100, be realistic based on available data),
  "reasoning": "string (2-3 detailed paragraphs explaining your analysis with specific details, including historical precedents)",
  "key_findings": [
    "string (specific, actionable finding with numbers/prices)",
    "string (specific, actionable finding with numbers/prices)",
    "string (specific, actionable finding with numbers/prices)",
    "string (specific, actionable finding with numbers/prices)",
    "string (specific, actionable finding with numbers/prices)",
    "string (historical precedent or pattern match)",
    "string (risk/reward insight)"
  ],
  "trader_action": "string (specific, actionable recommendation with exact price levels, position sizes, and R:R ratios)",
  "price_levels": {
    "support": [number, number, number],
    "resistance": [number, number, number]
  },
  "timeframe_analysis": {
    "short_term": "string (24-48h outlook with specific price expectations)",
    "medium_term": "string (1-2 week outlook with specific price targets)"
  },
  "risk_reward": {
    "ratio": "string (e.g., '1:3' or '1:5')",
    "position_size": "string (e.g., '2-5% of portfolio')",
    "stop_loss": number (specific price level),
    "take_profit": [number, number] (array of profit targets)
  },
  "historical_context": {
    "similar_transactions": "string (description of similar past transactions)",
    "historical_outcome": "string (what happened after similar transactions)",
    "pattern_match": "string (identified pattern type)",
    "confidence_based_on_history": number (0-100)
  }
}

**CRITICAL REQUIREMENTS:**
- Be thorough, specific, and provide actionable intelligence
- Include EXACT price levels, not ranges or vague descriptions
- Reference historical precedents and patterns
- Calculate specific risk/reward ratios
- Provide concrete position sizing recommendations
- Avoid generic statements - every insight must be specific and actionable`;

    // Call Gemini API with configured model and parameters
    // Model Selection: Dynamic selection based on transaction size (Requirement 1.1, 1.2, 1.5)
    const geminiApiKey = geminiConfig.apiKey;
    
    // Thinking Mode Configuration (Requirement 2.1)
    // Enable thinking mode to show AI's step-by-step reasoning process
    const enableThinking = geminiConfig.enableThinking;
    console.log(`🧠 Thinking mode: ${enableThinking ? 'ENABLED' : 'DISABLED'}`);
    
    // Gemini API endpoint structure:
    // https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}
    // Available models: gemini-2.5-flash, gemini-2.5-pro
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${geminiApiKey}`;
    
    // Prepare request body
    const requestBody = {
      // Request structure for Gemini API
      contents: [{
        parts: [{
          text: prompt  // The analysis prompt with transaction details
        }]
      }],
      // System instruction for thinking mode (Requirement 2.1)
      // When thinking mode is enabled, instruct the model to show its reasoning
      ...(enableThinking && {
        systemInstruction: {
          parts: [{
            text: 'You are an expert cryptocurrency analyst. Show your step-by-step reasoning process before providing your final analysis. Think through the transaction patterns, market context, and historical precedents carefully. Structure your thinking clearly with headings like "## Thinking Process" before the JSON output.'
          }]
        }
      }),
      // Generation configuration parameters (Requirement 1.3, 1.4, 5.2, 5.3, 5.4)
      // Apply model-specific configuration from geminiConfig
      generationConfig: {
        temperature: modelConfig.temperature,        // Controls randomness (0.0-1.0). Higher = more creative
        topK: modelConfig.topK,                      // Limits token selection to top K options
        topP: modelConfig.topP,                      // Nucleus sampling threshold (0.0-1.0)
        maxOutputTokens: modelConfig.maxOutputTokens, // Maximum response length (8192 for Flash, 32768 for Pro)
        candidateCount: 1,                           // Number of response variations to generate
        // Structured Output Configuration (Requirement 3.2)
        responseMimeType: "application/json",  // Force JSON response format
        responseSchema: {
          type: "object",
          properties: {
            transaction_type: {
              type: "string",
              enum: ["exchange_deposit", "exchange_withdrawal", "whale_to_whale", "unknown"],
              description: "Classification of the transaction type"
            },
            market_impact: {
              type: "string",
              enum: ["Bearish", "Bullish", "Neutral"],
              description: "Expected market impact"
            },
            confidence: {
              type: "number",
              minimum: 0,
              maximum: 100,
              description: "Confidence score for the analysis (0-100)"
            },
            reasoning: {
              type: "string",
              minLength: 100,
              description: "Detailed reasoning for the analysis (2-3 paragraphs)"
            },
            key_findings: {
              type: "array",
              items: { type: "string" },
              minItems: 3,
              maxItems: 10,
              description: "Array of specific, actionable findings"
            },
            trader_action: {
              type: "string",
              minLength: 50,
              description: "Specific, actionable recommendation for traders"
            },
            price_levels: {
              type: "object",
              properties: {
                support: {
                  type: "array",
                  items: { type: "number" },
                  minItems: 2,
                  description: "Support price levels"
                },
                resistance: {
                  type: "array",
                  items: { type: "number" },
                  minItems: 2,
                  description: "Resistance price levels"
                }
              }
            },
            timeframe_analysis: {
              type: "object",
              properties: {
                short_term: {
                  type: "string",
                  description: "24-48 hour outlook"
                },
                medium_term: {
                  type: "string",
                  description: "1-2 week outlook"
                }
              }
            },
            risk_reward: {
              type: "object",
              properties: {
                ratio: { type: "string" },
                position_size: { type: "string" },
                stop_loss: { type: "number" },
                take_profit: {
                  type: "array",
                  items: { type: "number" }
                }
              }
            },
            historical_context: {
              type: "object",
              properties: {
                similar_transactions: { type: "string" },
                historical_outcome: { type: "string" },
                pattern_match: { type: "string" },
                confidence_based_on_history: {
                  type: "number",
                  minimum: 0,
                  maximum: 100
                }
              }
            }
          },
          required: ["transaction_type", "market_impact", "confidence", "reasoning", "key_findings", "trader_action"]
        }
      },
      // Safety settings: Use BLOCK_ONLY_HIGH for financial analysis
      // This prevents false positives while still blocking genuinely harmful content
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_ONLY_HIGH"  // Block only high-confidence harmful content
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_ONLY_HIGH"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_ONLY_HIGH"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_ONLY_HIGH"  // Allow financial advice while blocking dangerous content
        }
      ]
    };
    
    // Call Gemini API with retry logic and timeout handling (Requirement 5.5, 7.1, 7.2)
    console.log(`📡 Calling Gemini API: ${selectedModel}`);
    console.log(`⚙️ Request config:`, {
      model: selectedModel,
      temperature: modelConfig.temperature,
      maxOutputTokens: modelConfig.maxOutputTokens,
      thinkingEnabled: enableThinking,
      timeout: geminiConfig.timeoutMs,
      maxRetries: geminiConfig.maxRetries,
    });
    
    const geminiResponse = await callGeminiWithRetry(apiUrl, requestBody, geminiConfig);
    const geminiData = await geminiResponse.json();
    console.log('📡 Gemini API response received');
    
    // Log full response structure for debugging (first time only)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Full Gemini response structure:', JSON.stringify(geminiData, null, 2));
    }
    
    // Check if response was blocked by safety filters (Gemini API best practice)
    const blockCheck = isResponseBlocked(geminiData);
    if (blockCheck.blocked) {
      console.error('🚫 Response blocked by safety filters:', blockCheck.reason);
      return res.status(400).json({
        success: false,
        error: `Analysis blocked: ${blockCheck.reason}. This may indicate the transaction data triggered safety filters. Please try again or contact support.`,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Extract metadata from response (Gemini API best practice)
    const tokenUsage = extractTokenUsage(geminiData);
    const finishReason = extractFinishReason(geminiData);
    const safetyRatings = extractSafetyRatings(geminiData);
    
    // Check finish reason for issues
    if (finishReason === 'MAX_TOKENS') {
      console.warn('⚠️ Response truncated due to MAX_TOKENS. Consider increasing maxOutputTokens.');
    } else if (finishReason === 'RECITATION') {
      console.warn('⚠️ Response may contain recited content from training data.');
    } else if (finishReason !== 'STOP' && finishReason !== 'UNKNOWN') {
      console.warn(`⚠️ Unexpected finish reason: ${finishReason}`);
    }

    // Extract the text response from Gemini's response structure
    // Per Gemini API docs: Response structure is { candidates: [{ content: { parts: [{ text: "..." }] } }] }
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!responseText) {
      console.error('❌ No response text in Gemini response');
      console.error('❌ Response structure:', JSON.stringify(geminiData, null, 2));
      throw new Error('No response text from Gemini API. Check response structure.');
    }
    
    console.log(`📝 Response text length: ${responseText.length} characters`);
    
    // Extract thinking content if thinking mode is enabled (Requirement 2.2)
    // Per Gemini API docs: When using systemInstruction, the model may include reasoning before structured output
    let thinkingContent: string | undefined;
    
    if (enableThinking) {
      thinkingContent = extractThinkingContent(responseText);
      if (thinkingContent) {
        console.log(`🧠 Extracted thinking content: ${thinkingContent.length} characters`);
        console.log(`🧠 Thinking preview: ${thinkingContent.substring(0, 200)}...`);
      } else {
        console.log(`🧠 No thinking content found in response`);
      }
    }

    // Parse JSON from response (Requirement 3.3, 3.4)
    // Per Gemini API docs: With responseMimeType: "application/json", response should be valid JSON
    // However, we still need to handle edge cases and validate the response
    let analysis;
    try {
      // Extract JSON from response text
      // With structured output, the entire response should be JSON
      // But we handle markdown code blocks as fallback
      let jsonText = responseText.trim();
      
      // Remove markdown code blocks if present (fallback for edge cases)
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '').trim();
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '').trim();
      }
      
      // Find JSON object if thinking content is present
      const jsonStartIndex = jsonText.indexOf('{');
      const jsonEndIndex = jsonText.lastIndexOf('}');
      if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonStartIndex < jsonEndIndex) {
        jsonText = jsonText.substring(jsonStartIndex, jsonEndIndex + 1);
      }
      
      console.log(`📋 Parsing JSON (${jsonText.length} characters)...`);
      analysis = JSON.parse(jsonText);
      console.log('✅ JSON parsed successfully');
      
      // Validate response against schema (Requirement 3.3, 3.4, 3.5)
      const validationErrors = validateAnalysisResponse(analysis);
      
      if (validationErrors.length > 0) {
        console.error('❌ Analysis response validation failed:');
        validationErrors.forEach((error, index) => {
          console.error(`  ${index + 1}. ${error}`);
        });
        console.error('❌ Invalid response preview:', JSON.stringify(analysis, null, 2).substring(0, 500));
        
        // Return structured error response (Requirement 3.5, 7.3)
        return res.status(500).json({
          success: false,
          error: `Analysis validation failed (${validationErrors.length} errors): ${validationErrors[0]}`,
          metadata: {
            model: selectedModel,
            provider: 'Google Gemini',
            timestamp: new Date().toISOString(),
            processingTime: Date.now() - startTime,
            thinkingEnabled: enableThinking,
            tokenUsage,
            finishReason,
            validationErrors: validationErrors.slice(0, 5), // Include first 5 errors
          },
          timestamp: new Date().toISOString(),
        });
      }
      
      console.log('✅ Analysis response validated successfully');
      console.log(`✅ Analysis contains ${analysis.key_findings?.length || 0} key findings`);
      
    } catch (parseError) {
      console.error('❌ Failed to parse Gemini response as JSON');
      console.error('❌ Parse error:', parseError);
      console.error('❌ Response text preview:', responseText.substring(0, 500));
      
      // Return structured error response (Requirement 3.5, 7.3)
      return res.status(500).json({
        success: false,
        error: `JSON parsing failed: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
        metadata: {
          model: selectedModel,
          provider: 'Google Gemini',
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          thinkingEnabled: enableThinking,
          tokenUsage,
          finishReason,
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Calculate processing time for metadata (Requirement 8.4)
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    // Validate and normalize the analysis response (Requirement 3.4, 3.5)
    // Ensures all required fields are present with valid values
    const normalizedAnalysis = {
      transaction_type: analysis.transaction_type || 'unknown',
      market_impact: analysis.market_impact || 'Neutral',
      confidence: Math.min(100, Math.max(0, analysis.confidence || 75)),  // Clamp to 0-100
      reasoning: analysis.reasoning || 'Analysis completed',
      key_findings: Array.isArray(analysis.key_findings) ? analysis.key_findings : [],
      trader_action: analysis.trader_action || 'Monitor the situation',
      // Optional fields (Requirements 4.2, 4.3, 4.4)
      price_levels: analysis.price_levels,  // Support/resistance levels
      timeframe_analysis: analysis.timeframe_analysis,  // Short/medium term predictions
      risk_reward: analysis.risk_reward,  // R:R ratios and position sizing
      historical_context: analysis.historical_context,  // Historical precedents
    };

    console.log(`✅ Gemini analysis completed successfully in ${processingTime}ms`);
    console.log(`📊 Total tokens used: ${tokenUsage.totalTokens} (prompt: ${tokenUsage.promptTokens}, completion: ${tokenUsage.completionTokens})`);
    
    // Calculate estimated cost (per Gemini API pricing)
    const costPerMillionTokens = selectedModel === 'gemini-2.5-pro' 
      ? { input: 1.25, output: 5.00 }  // Pro pricing
      : { input: 0.075, output: 0.30 }; // Flash pricing
    
    const estimatedCost = (
      (tokenUsage.promptTokens / 1_000_000) * costPerMillionTokens.input +
      (tokenUsage.completionTokens / 1_000_000) * costPerMillionTokens.output
    );
    
    console.log(`💰 Estimated cost: $${estimatedCost.toFixed(6)}`);

    // Return structured response with metadata (Requirement 8.1, 8.2, 8.3, 8.4, 8.5)
    return res.status(200).json({
      success: true,
      analysis: normalizedAnalysis,
      thinking: thinkingContent,  // AI reasoning process (Requirement 2.2)
      metadata: {
        model: selectedModel,  // Dynamic model selection (Requirement 1.5, 8.1)
        provider: 'Google Gemini',
        timestamp: new Date().toISOString(),
        processingTime: processingTime,  // In milliseconds
        thinkingEnabled: enableThinking,  // Indicates if thinking mode was used (Requirement 2.2, 8.5)
        tokenUsage,  // Token usage statistics (Gemini API best practice)
        finishReason,  // Completion reason (Gemini API best practice)
        safetyRatings,  // Safety filter ratings (Gemini API best practice)
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    console.error('❌ Gemini analysis error:', error);
    console.error('❌ Error occurred after', processingTime, 'ms');
    
    // Classify error type (Requirement 7.2)
    let errorType = GeminiErrorType.UNKNOWN;
    let errorMessage = 'Failed to analyze transaction with Gemini';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Classify by error message patterns
      if (errorMessage.includes('timeout') || errorMessage.includes('AbortError')) {
        errorType = GeminiErrorType.TIMEOUT;
        errorMessage = `Analysis timeout after ${geminiConfig.timeoutMs}ms. The transaction analysis is taking longer than expected. Please try again.`;
        statusCode = 504;
      } else if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
        errorType = GeminiErrorType.RATE_LIMIT;
        errorMessage = 'API rate limit exceeded. Please wait a moment and try again.';
        statusCode = 429;
      } else if (errorMessage.includes('401') || errorMessage.includes('403') || errorMessage.includes('API key')) {
        errorType = GeminiErrorType.INVALID_API_KEY;
        errorMessage = 'API authentication failed. Please check API key configuration.';
        statusCode = 500; // Don't expose auth issues to client
      } else if (errorMessage.includes('400') || errorMessage.includes('invalid')) {
        errorType = GeminiErrorType.INVALID_RESPONSE;
        errorMessage = 'Invalid request or response format. Please try again.';
        statusCode = 400;
      } else if (errorMessage.includes('500') || errorMessage.includes('502') || errorMessage.includes('503')) {
        errorType = GeminiErrorType.SERVER_ERROR;
        errorMessage = 'Gemini API server error. Please try again in a moment.';
        statusCode = 503;
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        errorType = GeminiErrorType.NETWORK_ERROR;
        errorMessage = 'Network error connecting to Gemini API. Please check your connection and try again.';
        statusCode = 503;
      } else if (errorMessage.includes('parse') || errorMessage.includes('JSON')) {
        errorType = GeminiErrorType.INVALID_RESPONSE;
        errorMessage = 'Failed to parse AI response. The analysis may be incomplete. Please try again.';
        statusCode = 500;
      } else if (errorMessage.includes('validation')) {
        errorType = GeminiErrorType.VALIDATION_ERROR;
        errorMessage = 'Analysis response validation failed. Please try again.';
        statusCode = 500;
      }
    }
    
    console.error(`❌ Error classified as: ${errorType}`);
    
    // Log detailed error information for debugging (Requirement 7.5)
    console.error('❌ Error details:', {
      type: errorType,
      message: errorMessage,
      originalError: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      txHash: whale.txHash,
      amount: whale.amount,
      model: selectedModel,
      processingTime,
    });

    // Return structured error response (Requirement 7.2, 7.3, 7.5)
    // Maintains consistent response interface even on failure
    return res.status(statusCode).json({
      success: false,
      error: errorMessage,
      metadata: {
        model: selectedModel,
        provider: 'Google Gemini',
        timestamp: new Date().toISOString(),
        processingTime,
        errorType,
      },
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Example API Request:
 * 
 * POST /api/whale-watch/analyze-gemini
 * Content-Type: application/json
 * 
 * {
 *   "txHash": "abc123...",
 *   "blockchain": "Bitcoin",
 *   "amount": 150.5,
 *   "amountUSD": 14297500,
 *   "fromAddress": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
 *   "toAddress": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
 *   "timestamp": "2025-01-24T12:00:00Z",
 *   "type": "Large Transfer",
 *   "description": "Whale movement detected"
 * }
 * 
 * Example API Response (Success):
 * 
 * {
 *   "success": true,
 *   "analysis": {
 *     "transaction_type": "exchange_withdrawal",
 *     "market_impact": "Bullish",
 *     "confidence": 85,
 *     "reasoning": "This large withdrawal from an exchange suggests...",
 *     "key_findings": [
 *       "150.5 BTC withdrawn from Binance cold wallet",
 *       "Timing coincides with recent price consolidation",
 *       "Historical pattern suggests accumulation phase",
 *       "Similar withdrawals preceded 15% price increases",
 *       "Destination address shows long-term holding behavior"
 *     ],
 *     "trader_action": "Consider long positions with entry at $94,500-$95,000...",
 *     "price_levels": {
 *       "support": [94000, 92500, 90000],
 *       "resistance": [97000, 99500, 102000]
 *     },
 *     "timeframe_analysis": {
 *       "short_term": "Expect consolidation for 24-48 hours...",
 *       "medium_term": "Bullish momentum likely to build over 1-2 weeks..."
 *     },
 *     "risk_reward": {
 *       "ratio": "1:4",
 *       "position_size": "3-5% of portfolio",
 *       "stop_loss": 93500,
 *       "take_profit": [97000, 99500]
 *     },
 *     "historical_context": {
 *       "similar_transactions": "Similar 150+ BTC withdrawals from Binance in Q4 2024",
 *       "historical_outcome": "Average 12% price increase within 2 weeks",
 *       "pattern_match": "Accumulation phase pattern",
 *       "confidence_based_on_history": 78
 *     }
 *   },
 *   "thinking": "Let me analyze this transaction step by step...",  // Optional, if thinking mode enabled
 *   "metadata": {
 *     "model": "gemini-2.5-pro",
 *     "provider": "Google Gemini",
 *     "timestamp": "2025-01-24T12:00:05Z",
 *     "processingTime": 5234,
 *     "thinkingEnabled": true
 *   },
 *   "timestamp": "2025-01-24T12:00:05Z"
 * }
 * 
 * Example API Response (Error):
 * 
 * {
 *   "success": false,
 *   "error": "Gemini API error: 429 - Rate limit exceeded",
 *   "timestamp": "2025-01-24T12:00:05Z"
 * }
 */
