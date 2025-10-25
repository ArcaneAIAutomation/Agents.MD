import type { NextApiRequest, NextApiResponse } from 'next';
import { selectGeminiModel, getModelConfig, getGeminiConfig } from '../../../utils/geminiConfig';

/**
 * Deep Dive Analysis API
 * 
 * Fetches blockchain transaction history for source and destination addresses
 * and provides comprehensive analysis using Gemini 2.5 Pro
 */

interface DeepDiveRequest {
  txHash: string;
  amount: number;
  fromAddress: string;
  toAddress: string;
  timestamp: string;
  initialAnalysis?: any; // Optional: Include initial analysis for context
}

interface DeepDiveResponse {
  success: boolean;
  analysis?: any;
  blockchainData?: any;
  metadata?: any;
  error?: string;
  timestamp: string;
}

/**
 * Fetch transaction history for an address using blockchain.info API
 */
async function fetchAddressHistory(address: string, limit: number = 10): Promise<any> {
  try {
    console.log(`📡 Fetching transaction history for ${address.substring(0, 20)}...`);
    
    // Use blockchain.info API (no auth required)
    const response = await fetch(
      `https://blockchain.info/rawaddr/${address}?limit=${limit}`,
      { signal: AbortSignal.timeout(10000) }
    );
    
    if (!response.ok) {
      throw new Error(`Blockchain API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract relevant transaction data
    const transactions = (data.txs || []).slice(0, limit).map((tx: any) => ({
      hash: tx.hash,
      time: new Date(tx.time * 1000).toISOString(),
      size: tx.size,
      inputs: tx.inputs?.length || 0,
      outputs: tx.out?.length || 0,
      totalInput: tx.inputs?.reduce((sum: number, input: any) => sum + (input.prev_out?.value || 0), 0) / 100000000,
      totalOutput: tx.out?.reduce((sum: number, output: any) => sum + (output.value || 0), 0) / 100000000,
    }));
    
    return {
      address: address.substring(0, 20) + '...',
      totalReceived: (data.total_received || 0) / 100000000,
      totalSent: (data.total_sent || 0) / 100000000,
      finalBalance: (data.final_balance || 0) / 100000000,
      transactionCount: data.n_tx || 0,
      recentTransactions: transactions,
    };
  } catch (error) {
    console.error(`❌ Failed to fetch address history:`, error);
    return {
      address: address.substring(0, 20) + '...',
      error: error instanceof Error ? error.message : 'Failed to fetch data',
      recentTransactions: [],
    };
  }
}

/**
 * Build deep dive analysis prompt
 */
function buildDeepDivePrompt(
  whale: DeepDiveRequest,
  fromAddressData: any,
  toAddressData: any,
  currentBtcPrice: number
): string {
  return `You are an expert blockchain analyst and cryptocurrency market intelligence specialist. Conduct a DEEP DIVE analysis of this Bitcoin whale transaction by examining the complete blockchain history of both addresses involved.

**WHALE TRANSACTION DETAILS:**
- Transaction Hash: ${whale.txHash}
- Amount: ${whale.amount.toFixed(2)} BTC ($${(whale.amount * currentBtcPrice).toLocaleString()})
- Timestamp: ${whale.timestamp}
- Current BTC Price: $${currentBtcPrice.toLocaleString()}

**SOURCE ADDRESS ANALYSIS:**
${JSON.stringify(fromAddressData, null, 2)}

**DESTINATION ADDRESS ANALYSIS:**
${JSON.stringify(toAddressData, null, 2)}

**DEEP DIVE ANALYSIS REQUIREMENTS:**

1. **Address Behavior Patterns:**
   - Analyze transaction frequency and patterns for both addresses
   - Identify accumulation vs distribution behavior
   - Detect mixing or tumbling patterns
   - Classify address types (exchange, whale, institutional, retail)
   - Calculate velocity of funds (how quickly BTC moves)

2. **Fund Flow Tracing:**
   - Trace the origin of funds (where did the BTC come from?)
   - Predict destination strategy (where is the BTC going?)
   - Identify intermediate hops or layering
   - Detect potential exchange deposits/withdrawals
   - Map the broader transaction cluster

3. **Historical Context:**
   - Compare current transaction to address's historical patterns
   - Identify anomalies or unusual behavior
   - Calculate 30-day volume trends
   - Analyze timing patterns (time of day, day of week)
   - Detect correlation with market events

4. **Market Intelligence:**
   - Predict short-term price impact (24-48 hours)
   - Predict medium-term trend (1-2 weeks)
   - Identify key support/resistance levels
   - Calculate probability of further large movements
   - Assess market sentiment implications

5. **Strategic Intelligence:**
   - Determine likely intent behind the transaction
   - Assess sophistication level of the actors
   - Identify potential market manipulation signals
   - Evaluate risk/reward for traders
   - Provide actionable trading recommendations

**REQUIRED JSON OUTPUT:**
{
  "address_behavior": {
    "source_classification": "exchange | whale | institutional | mixer | retail | unknown",
    "source_pattern": "string (detailed behavior analysis)",
    "destination_classification": "exchange | whale | institutional | mixer | retail | unknown",
    "destination_pattern": "string (detailed behavior analysis)",
    "velocity_analysis": "string (how quickly funds move)",
    "sophistication_level": "high | medium | low"
  },
  "fund_flow_analysis": {
    "origin_hypothesis": "string (where did the BTC come from?)",
    "destination_hypothesis": "string (where is the BTC going?)",
    "intermediate_hops": number,
    "mixing_detected": boolean,
    "cluster_analysis": "string (broader transaction network)"
  },
  "historical_context": {
    "pattern_match": "accumulation | distribution | repositioning | arbitrage | unknown",
    "anomaly_detected": boolean,
    "anomaly_description": "string (if anomaly detected)",
    "volume_trend_30d": "increasing | decreasing | stable",
    "timing_significance": "string (analysis of timing)"
  },
  "market_prediction": {
    "short_term_24h": "string (specific price prediction with reasoning)",
    "medium_term_7d": "string (specific trend prediction with reasoning)",
    "key_price_levels": {
      "support": [number, number, number],
      "resistance": [number, number, number]
    },
    "probability_further_movement": number (0-100)
  },
  "strategic_intelligence": {
    "intent": "string (likely reason for transaction)",
    "sentiment_indicator": "bullish | bearish | neutral",
    "manipulation_risk": "high | medium | low",
    "trader_positioning": "string (how traders should position)",
    "risk_reward_ratio": "string (e.g., '1:3')"
  },
  "confidence": number (0-100),
  "key_insights": [
    "string (specific, actionable insight)",
    "string (specific, actionable insight)",
    "string (specific, actionable insight)",
    "string (specific, actionable insight)",
    "string (specific, actionable insight)"
  ]
}

Provide SPECIFIC, ACTIONABLE intelligence based on the blockchain data. Be thorough and detailed.`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DeepDiveResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      timestamp: new Date().toISOString(),
    });
  }

  const startTime = Date.now();

  try {
    const whale: DeepDiveRequest = req.body;

    if (!whale.txHash || !whale.fromAddress || !whale.toAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: txHash, fromAddress, toAddress',
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`🔬 Starting Deep Dive analysis for ${whale.txHash.substring(0, 20)}...`);

    // Fetch blockchain data for both addresses (parallel)
    const [fromAddressData, toAddressData] = await Promise.all([
      fetchAddressHistory(whale.fromAddress, 10),
      fetchAddressHistory(whale.toAddress, 10),
    ]);

    console.log(`✅ Blockchain data fetched`);
    console.log(`📊 Source: ${fromAddressData.transactionCount} total txs, ${fromAddressData.recentTransactions.length} recent`);
    console.log(`📊 Destination: ${toAddressData.transactionCount} total txs, ${toAddressData.recentTransactions.length} recent`);

    // Get current BTC price
    const currentBtcPrice = await getCurrentBitcoinPrice();

    // Load Gemini configuration (use Pro for deep analysis)
    const geminiConfig = getGeminiConfig();
    const selectedModel = 'gemini-2.5-pro'; // Always use Pro for deep dive
    const modelConfig = getModelConfig(selectedModel, geminiConfig);

    console.log(`🎯 Using ${selectedModel} for deep analysis`);

    // Build deep dive prompt
    const prompt = buildDeepDivePrompt(whale, fromAddressData, toAddressData, currentBtcPrice);

    // Call Gemini API
    const geminiApiKey = geminiConfig.apiKey;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${geminiApiKey}`;

    const requestBody = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: modelConfig.temperature,
        topK: modelConfig.topK,
        topP: modelConfig.topP,
        maxOutputTokens: modelConfig.maxOutputTokens,
        responseMimeType: "application/json",
      },
    };

    console.log(`📡 Calling Gemini API...`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

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
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      throw new Error('No response from Gemini API');
    }

    // Parse JSON response
    const analysis = JSON.parse(responseText);

    const processingTime = Date.now() - startTime;

    console.log(`✅ Deep Dive analysis completed in ${processingTime}ms`);

    return res.status(200).json({
      success: true,
      analysis,
      blockchainData: {
        sourceAddress: fromAddressData,
        destinationAddress: toAddressData,
      },
      metadata: {
        model: selectedModel,
        provider: 'Google Gemini',
        processingTime,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`❌ Deep Dive error after ${processingTime}ms:`, error);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Deep Dive analysis failed',
      timestamp: new Date().toISOString(),
    });
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
    
    throw new Error('Invalid BTC price');
  } catch (error) {
    console.warn('⚠️ Failed to fetch BTC price, using fallback');
    return 95000;
  }
}
