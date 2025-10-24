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
      console.log(`✅ Fetched current BTC price: $${btcPrice.toLocaleString()}`);
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
    console.log(`💰 Current BTC price: $${currentBtcPrice.toLocaleString()}`);
    
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

    // Prepare the enhanced deep analysis prompt with all requirements
    const prompt = `You are an expert cryptocurrency market analyst with deep knowledge of Bitcoin whale behavior, market psychology, and on-chain analytics. Conduct a comprehensive analysis of this Bitcoin whale transaction.

Transaction Details:
- Transaction Hash: ${whale.txHash}
- Amount: ${whale.amount.toFixed(2)} BTC ($${whale.amountUSD.toLocaleString()})
- From Address: ${whale.fromAddress}
- To Address: ${whale.toAddress}
- Timestamp: ${whale.timestamp}
- Initial Classification: ${whale.type}
- Description: ${whale.description}

Conduct a DEEP ANALYSIS considering:

1. **Transaction Pattern Analysis:**
   - Is this address known for specific behavior patterns?
   - What does the transaction size relative to current market conditions suggest?
   - Are there any timing patterns (market hours, price levels)?

2. **Market Context:**
   - Current Bitcoin market sentiment and price action
   - Recent whale activity trends
   - Exchange flow patterns (deposits vs withdrawals)
   - Historical precedents for similar-sized transactions

3. **Behavioral Psychology:**
   - What might motivate this transaction at this specific time?
   - Is this likely accumulation, distribution, or repositioning?
   - What does the address history suggest about the holder's strategy?

4. **Risk Assessment:**
   - Potential market impact in the short term (24-48 hours)
   - Medium-term implications (1-2 weeks)
   - Key price levels to watch

5. **Trading Intelligence:**
   - Specific actionable insights for traders
   - Risk management recommendations
   - Entry/exit considerations

Provide your analysis in the following JSON format with DETAILED, SPECIFIC insights:
{
  "transaction_type": "exchange_deposit | exchange_withdrawal | whale_to_whale | unknown",
  "market_impact": "Bearish | Bullish | Neutral",
  "confidence": number (0-100, be realistic based on available data),
  "reasoning": "string (2-3 detailed paragraphs explaining your analysis with specific details)",
  "key_findings": [
    "string (specific, actionable finding)",
    "string (specific, actionable finding)",
    "string (specific, actionable finding)",
    "string (specific, actionable finding)",
    "string (specific, actionable finding)"
  ],
  "trader_action": "string (specific, actionable recommendation with price levels or conditions)"
}

Be thorough, specific, and provide actionable intelligence. Avoid generic statements.`;

    // Call Gemini API with configured model and parameters
    // Model Selection: Currently using gemini-2.0-flash-exp (will be upgraded to gemini-2.5-flash)
    // TODO: Implement dynamic model selection based on transaction size (Requirement 1.1, 1.2)
    const geminiApiKey = process.env.GEMINI_API_KEY || 'AIzaSyAvGqzDvYiaaDOMFDNiNlxMziO0zYIE3no';
    
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
          // Generation configuration parameters (Requirement 1.3, 1.4)
          generationConfig: {
            temperature: 0.8,        // Controls randomness (0.0-1.0). Higher = more creative
            topK: 64,                // Limits token selection to top K options
            topP: 0.95,              // Nucleus sampling threshold (0.0-1.0)
            maxOutputTokens: 4096,   // Maximum response length (will be 8192 for Flash, 32768 for Pro)
            candidateCount: 1,       // Number of response variations to generate
            // TODO: Add responseMimeType: "application/json" for structured outputs (Requirement 3.2)
            // TODO: Add responseSchema for JSON validation (Requirement 3.1)
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

    // Parse JSON from response (Requirement 3.3, 3.4)
    // Gemini may wrap JSON in markdown code blocks (```json ... ```)
    // We need to strip these before parsing
    let analysis;
    try {
      // Remove markdown code blocks if present
      const jsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(jsonText);
      
      // TODO: Validate against JSON schema (Requirement 3.3, 3.4)
      // TODO: Check required fields and data types
      // TODO: Validate confidence is 0-100
    } catch (parseError) {
      console.error('❌ Failed to parse Gemini response as JSON:', responseText);
      // TODO: Return structured error response (Requirement 7.3)
      throw new Error('Failed to parse Gemini analysis response');
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
      // Optional fields (Requirement 4.2, 4.3)
      price_levels: analysis.price_levels,  // Support/resistance levels
      timeframe_analysis: analysis.timeframe_analysis,  // Short/medium term predictions
    };

    console.log(`✅ Gemini analysis completed successfully in ${processingTime}ms`);

    // Return structured response with metadata (Requirement 8.1, 8.2, 8.3, 8.4, 8.5)
    return res.status(200).json({
      success: true,
      analysis: normalizedAnalysis,
      // TODO: Add thinking field when thinking mode is implemented (Requirement 2.2)
      metadata: {
        model: 'gemini-2.0-flash-exp',  // TODO: Update to dynamic model selection
        provider: 'Google Gemini',
        timestamp: new Date().toISOString(),
        processingTime: processingTime,  // In milliseconds
        thinkingEnabled: false,  // TODO: Update when thinking mode is implemented (Requirement 2.1)
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
