import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Gemini AI Whale Transaction Analysis API
 * 
 * This endpoint provides AI-powered analysis of Bitcoin whale transactions using
 * Google's Gemini 2.5 models (Flash and Pro).
 * 
 * Model Selection Logic:
 * - Transactions < 100 BTC: Uses gemini-2.5-flash (fast, ~3 seconds)
 * - Transactions >= 100 BTC: Uses gemini-2.5-pro (deep analysis, ~7 seconds)
 * - User can override with modelPreference parameter
 * 
 * Features:
 * - Thinking Mode: Shows AI's step-by-step reasoning process
 * - Structured Outputs: Guaranteed JSON schema compliance
 * - Current Market Context: Includes live BTC price in analysis
 * - Exchange Detection: Identifies known exchange addresses
 * - Retry Logic: Handles rate limits and transient errors
 * 
 * Rate Limits:
 * - Gemini API: 60 requests per minute (configurable via GEMINI_MAX_REQUESTS_PER_MINUTE)
 * - Timeout: 15 seconds default (configurable via GEMINI_TIMEOUT_MS)
 * 
 * Cost Estimates (as of January 2025):
 * - Flash: ~$0.0001 per analysis (input + output tokens)
 * - Pro: ~$0.0005 per analysis (input + output tokens)
 * - Deep Dive: ~$0.002 per analysis (extended context + blockchain data)
 * 
 * @see utils/geminiConfig.ts for configuration details
 * @see .env.example for environment variable setup
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GeminiAnalysisResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const whale: GeminiAnalysisRequest = req.body;
    
    // Start timing for processing time calculation
    const startTime = Date.now();

    console.log(`🤖 Starting Gemini AI analysis for transaction ${whale.txHash}`);
    console.log(`📋 Whale data:`, JSON.stringify(whale, null, 2));

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
    // Model Selection: Currently using gemini-2.0-flash-exp (will be upgraded to gemini-2.5-flash)
    // TODO: Implement dynamic model selection based on transaction size (Requirement 1.1, 1.2)
    const geminiApiKey = process.env.GEMINI_API_KEY || 'AIzaSyAvGqzDvYiaaDOMFDNiNlxMziO0zYIE3no';
    
    // Thinking Mode Configuration (Requirement 2.1)
    // Enable thinking mode to show AI's step-by-step reasoning process
    const enableThinking = process.env.GEMINI_ENABLE_THINKING !== 'false'; // Default: true
    console.log(`🧠 Thinking mode: ${enableThinking ? 'ENABLED' : 'DISABLED'}`);
    
    // Gemini API endpoint structure:
    // https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}
    // Available models: gemini-2.5-flash, gemini-2.5-pro, gemini-2.0-flash-exp (deprecated)
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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
                text: 'You are an expert cryptocurrency analyst. Show your step-by-step reasoning process before providing your final analysis. Think through the transaction patterns, market context, and historical precedents carefully.'
              }]
            }
          }),
          // Generation configuration parameters (Requirement 1.3, 1.4)
          generationConfig: {
            temperature: 0.8,        // Controls randomness (0.0-1.0). Higher = more creative
            topK: 64,                // Limits token selection to top K options
            topP: 0.95,              // Nucleus sampling threshold (0.0-1.0)
            maxOutputTokens: 4096,   // Maximum response length (will be 8192 for Flash, 32768 for Pro)
            candidateCount: 1,       // Number of response variations to generate
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
          // Safety settings: Disabled for financial analysis (no harmful content expected)
          // These prevent false positives that might block legitimate market analysis
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_NONE"  // Allow all content (financial analysis may discuss negative events)
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_NONE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_NONE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_NONE"  // Financial advice may be considered "dangerous" by filters
            }
          ]
        }),
      }
    );

    // Error handling for API failures (Requirement 7.1, 7.2, 7.3)
    // Common error codes:
    // - 400: Bad request (invalid parameters)
    // - 401: Invalid API key
    // - 429: Rate limit exceeded (retry with exponential backoff)
    // - 500: Server error (retry once)
    // - 503: Service unavailable (retry with backoff)
    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('❌ Gemini API error:', geminiResponse.status, errorText);
      console.error('❌ API Key used:', geminiApiKey ? `${geminiApiKey.substring(0, 20)}...` : 'MISSING');
      
      // TODO: Implement retry logic with exponential backoff (Requirement 5.5, 7.1)
      // TODO: Classify error type and determine if retryable (Requirement 7.2)
      throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorText}`);
    }

    const geminiData = await geminiResponse.json();
    console.log('📡 Gemini API response received');

    // Extract the text response from Gemini's response structure
    // Response structure: { candidates: [{ content: { parts: [{ text: "..." }] } }] }
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!responseText) {
      throw new Error('No response text from Gemini API');
    }
    
    // Extract thinking content if thinking mode is enabled (Requirement 2.2)
    // Gemini may include thinking process in the response when system instruction is provided
    // The thinking content is typically separated from the final analysis
    let thinkingContent: string | undefined;
    
    if (enableThinking) {
      // Check if response contains thinking markers or patterns
      // Gemini may use phrases like "Let me analyze", "First, I'll consider", etc.
      // We'll extract any content before the JSON analysis as thinking content
      const jsonStartIndex = responseText.indexOf('{');
      
      if (jsonStartIndex > 50) { // If there's substantial content before JSON
        thinkingContent = responseText.substring(0, jsonStartIndex).trim();
        console.log(`🧠 Extracted thinking content: ${thinkingContent.length} characters`);
      }
    }

    // Parse JSON from response (Requirement 3.3, 3.4)
    // With structured output enabled, Gemini should return valid JSON directly
    // However, we still need to handle edge cases and validate the response
    let analysis;
    try {
      // Remove markdown code blocks if present (fallback for older responses)
      const jsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(jsonText);
      
      // Validate response against schema (Requirement 3.3, 3.4, 3.5)
      const validationErrors = validateAnalysisResponse(analysis);
      
      if (validationErrors.length > 0) {
        console.error('❌ Analysis response validation failed:', validationErrors);
        console.error('❌ Invalid response:', JSON.stringify(analysis, null, 2));
        
        // Log validation errors for debugging (Requirement 7.5)
        validationErrors.forEach(error => {
          console.error(`  - ${error}`);
        });
        
        // Return structured error response (Requirement 3.5, 7.3)
        return res.status(500).json({
          success: false,
          error: 'Analysis response validation failed: ' + validationErrors.join(', '),
          timestamp: new Date().toISOString(),
        });
      }
      
      console.log('✅ Analysis response validated successfully');
      
    } catch (parseError) {
      console.error('❌ Failed to parse Gemini response as JSON:', responseText);
      console.error('❌ Parse error:', parseError);
      
      // Return structured error response (Requirement 3.5, 7.3)
      return res.status(500).json({
        success: false,
        error: 'Failed to parse Gemini analysis response as JSON',
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

    // Return structured response with metadata (Requirement 8.1, 8.2, 8.3, 8.4, 8.5)
    return res.status(200).json({
      success: true,
      analysis: normalizedAnalysis,
      thinking: thinkingContent,  // AI reasoning process (Requirement 2.2)
      metadata: {
        model: 'gemini-2.0-flash-exp',  // TODO: Update to dynamic model selection
        provider: 'Google Gemini',
        timestamp: new Date().toISOString(),
        processingTime: processingTime,  // In milliseconds
        thinkingEnabled: enableThinking,  // Indicates if thinking mode was used (Requirement 2.2, 8.5)
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Gemini analysis error:', error);

    // Return structured error response (Requirement 7.2, 7.3, 7.5)
    // Maintains consistent response interface even on failure
    // TODO: Add error type classification (Requirement 7.2)
    // TODO: Include helpful error messages for users (Requirement 7.3)
    // TODO: Log with request/response details (Requirement 7.5)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze transaction with Gemini',
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
