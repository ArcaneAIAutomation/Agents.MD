/**
 * Gemini Analysis Background Worker
 * 
 * Processes Gemini analysis jobs asynchronously to avoid Vercel timeout limits.
 * Jobs are processed in the background and results are stored in the job store.
 */

import { getJob, markJobAnalyzing, markJobCompleted, markJobFailed } from './geminiJobStore';
import { selectGeminiModel, getModelConfig, getGeminiConfig } from './geminiConfig';

/**
 * Process a Gemini analysis job in the background
 * This function runs asynchronously and doesn't block the API response
 */
export async function processGeminiJob(jobId: string): Promise<void> {
  console.log(`🔄 Starting background processing for job: ${jobId}`);
  
  try {
    const job = getJob(jobId);
    if (!job) {
      console.error(`❌ Job not found: ${jobId}`);
      return;
    }
    
    // Mark as analyzing
    markJobAnalyzing(jobId);
    console.log(`📊 Job ${jobId} marked as analyzing`);
    
    const whale = job.whale;
    const startTime = Date.now();
    
    // Load Gemini configuration
    const geminiConfig = getGeminiConfig();
    
    // Select appropriate model
    const selectedModel = selectGeminiModel(whale.amount, undefined, geminiConfig);
    console.log(`🎯 Selected model: ${selectedModel} for ${whale.amount} BTC`);
    
    // Get model-specific configuration
    const modelConfig = getModelConfig(selectedModel, geminiConfig);
    
    // Build the analysis prompt (same as before)
    const currentBtcPrice = await getCurrentBitcoinPrice();
    const currentTransactionValue = whale.amount * currentBtcPrice;
    
    const prompt = buildAnalysisPrompt(whale, currentBtcPrice, currentTransactionValue);
    
    // Call Gemini API with long timeout
    const geminiApiKey = geminiConfig.apiKey;
    const enableThinking = geminiConfig.enableThinking;
    
    console.log(`📡 Calling Gemini API: ${selectedModel}`);
    console.log(`⏱️ Timeout: ${geminiConfig.timeoutMs}ms`);
    
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${geminiApiKey}`;
    
    const requestBody = buildRequestBody(prompt, enableThinking, modelConfig);
    
    // Make the API call with extended timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), geminiConfig.timeoutMs);
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }
      
      const geminiData = await response.json();
      
      // Extract response
      const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!responseText) {
        throw new Error('No response text from Gemini API');
      }
      
      // Extract thinking content
      let thinkingContent: string | undefined;
      if (enableThinking) {
        const jsonStartIndex = responseText.indexOf('{');
        if (jsonStartIndex > 50) {
          thinkingContent = responseText.substring(0, jsonStartIndex).trim();
        }
      }
      
      // Parse JSON
      let jsonText = responseText.trim();
      const jsonStartIndex = jsonText.indexOf('{');
      const jsonEndIndex = jsonText.lastIndexOf('}');
      if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
        jsonText = jsonText.substring(jsonStartIndex, jsonEndIndex + 1);
      }
      
      const analysis = JSON.parse(jsonText);
      
      // Extract metadata
      const tokenUsage = geminiData.usageMetadata || {};
      const finishReason = geminiData.candidates?.[0]?.finishReason || 'UNKNOWN';
      
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
      };
      
      // Mark job as completed
      markJobCompleted(jobId, analysis, thinkingContent, metadata);
      console.log(`✅ Job ${jobId} completed successfully in ${processingTime}ms`);
      
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
    
  } catch (error) {
    console.error(`❌ Job ${jobId} failed:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    markJobFailed(jobId, errorMessage);
  }
}

/**
 * Get current Bitcoin price
 */
async function getCurrentBitcoinPrice(): Promise<number> {
  try {
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/crypto-prices`, {
      signal: AbortSignal.timeout(5000)
    });
    
    if (!response.ok) {
      throw new Error(`Price API returned ${response.status}`);
    }
    
    const data = await response.json();
    const btcPrice = data.prices?.find((p: any) => p.symbol === 'BTC')?.price;
    
    if (btcPrice && typeof btcPrice === 'number' && btcPrice > 0) {
      return btcPrice;
    }
    
    throw new Error('Invalid BTC price in response');
  } catch (error) {
    console.warn('⚠️ Failed to fetch live BTC price, using fallback:', error);
    return 95000;
  }
}

/**
 * Build analysis prompt
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

1. **Transaction Pattern Analysis:**
   - Is this address known for specific behavior patterns?
   - What does the transaction size relative to current market conditions suggest?
   - Are there any timing patterns (market hours, price levels)?

2. **Market Context & Historical Precedents:**
   - Current Bitcoin market sentiment and price action
   - Recent whale activity trends
   - Exchange flow patterns (deposits vs withdrawals)
   - Compare to similar historical transactions and their market outcomes
   - Pattern recognition: Identify if this matches known whale behavior patterns
   - Historical success rate: What happened after similar transactions in the past?

3. **Behavioral Psychology:**
   - What might motivate this transaction at this specific time?
   - Is this likely accumulation, distribution, or repositioning?
   - What does the address history suggest about the holder's strategy?

4. **Price Level Analysis:**
   - Identify specific support levels below current price (at least 3 levels)
   - Identify specific resistance levels above current price (at least 3 levels)
   - Entry points: Specific price ranges for entering positions
   - Exit points: Specific price targets for taking profits
   - Stop-loss levels: Specific prices for risk management

5. **Timeframe Analysis:**
   - Short-term (24-48 hours): Immediate market impact and price action expectations
   - Medium-term (1-2 weeks): Trend development and key milestones to watch
   - Include specific price predictions or ranges for each timeframe

6. **Risk/Reward Analysis:**
   - Calculate specific Risk:Reward ratios for potential trades (e.g., 1:3, 1:5)
   - Position sizing recommendations: What percentage of portfolio to allocate
   - Risk management strategy: Where to place stops, how to scale in/out
   - Maximum acceptable loss: Specific dollar or percentage amounts

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
}

/**
 * Build request body for Gemini API
 */
function buildRequestBody(prompt: string, enableThinking: boolean, modelConfig: any): any {
  return {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    ...(enableThinking && {
      systemInstruction: {
        parts: [{
          text: 'You are an expert cryptocurrency analyst. Show your step-by-step reasoning process before providing your final analysis. Think through the transaction patterns, market context, and historical precedents carefully. Structure your thinking clearly with headings like "## Thinking Process" before the JSON output.'
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
          },
          price_levels: {
            type: "object",
            properties: {
              support: {
                type: "array",
                items: { type: "number" },
                minItems: 2
              },
              resistance: {
                type: "array",
                items: { type: "number" },
                minItems: 2
              }
            }
          },
          timeframe_analysis: {
            type: "object",
            properties: {
              short_term: { type: "string" },
              medium_term: { type: "string" }
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
