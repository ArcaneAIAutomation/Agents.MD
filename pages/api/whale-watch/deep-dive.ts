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
async function fetchAddressHistory(address: string, limit: number = 5): Promise<any> {
  try {
    console.log(`📡 Fetching transaction history for ${address.substring(0, 20)}...`);
    
    // Use blockchain.info API with shorter timeout
    const response = await fetch(
      `https://blockchain.info/rawaddr/${address}?limit=${limit}`,
      { signal: AbortSignal.timeout(5000) } // Reduced to 5 seconds
    );
    
    if (!response.ok) {
      console.warn(`⚠️ Blockchain API returned ${response.status}, using fallback data`);
      // Return minimal data instead of failing
      return {
        address: address.substring(0, 20) + '...',
        totalReceived: 0,
        totalSent: 0,
        finalBalance: 0,
        transactionCount: 0,
        recentTransactions: [],
        dataAvailable: false,
      };
    }
    
    const data = await response.json();
    
    // Extract relevant transaction data (simplified)
    const transactions = (data.txs || []).slice(0, limit).map((tx: any) => ({
      hash: tx.hash?.substring(0, 16) + '...',
      time: new Date(tx.time * 1000).toISOString(),
      inputs: tx.inputs?.length || 0,
      outputs: tx.out?.length || 0,
      totalBTC: (tx.out?.reduce((sum: number, output: any) => sum + (output.value || 0), 0) / 100000000).toFixed(2),
    }));
    
    return {
      address: address.substring(0, 20) + '...',
      totalReceived: ((data.total_received || 0) / 100000000).toFixed(2),
      totalSent: ((data.total_sent || 0) / 100000000).toFixed(2),
      finalBalance: ((data.final_balance || 0) / 100000000).toFixed(2),
      transactionCount: data.n_tx || 0,
      recentTransactions: transactions,
      dataAvailable: true,
    };
  } catch (error) {
    console.error(`❌ Failed to fetch address history:`, error);
    // Return fallback data instead of failing
    return {
      address: address.substring(0, 20) + '...',
      totalReceived: 'N/A',
      totalSent: 'N/A',
      finalBalance: 'N/A',
      transactionCount: 0,
      recentTransactions: [],
      dataAvailable: false,
      error: error instanceof Error ? error.message : 'Timeout',
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

Analyze the blockchain data and provide:

1. **Address Behavior:** Classify both addresses (exchange/whale/institutional) and identify patterns
2. **Fund Flow:** Trace origin and destination, detect mixing behavior
3. **Market Impact:** Predict 24h and 7-day price movements with specific levels
4. **Strategic Intelligence:** Intent, sentiment, and trading recommendations

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
    console.log(`⏱️ Start time: ${new Date().toISOString()}`);

    // Fetch blockchain data for both addresses (parallel, reduced to 5 txs each)
    console.log(`📡 Fetching blockchain data...`);
    const blockchainStart = Date.now();
    
    const [fromAddressData, toAddressData] = await Promise.all([
      fetchAddressHistory(whale.fromAddress, 5),
      fetchAddressHistory(whale.toAddress, 5),
    ]);

    const blockchainTime = Date.now() - blockchainStart;
    console.log(`✅ Blockchain data fetched in ${blockchainTime}ms`);
    console.log(`📊 Source: ${fromAddressData.transactionCount} total txs, ${fromAddressData.recentTransactions.length} recent, available: ${fromAddressData.dataAvailable}`);
    console.log(`📊 Destination: ${toAddressData.transactionCount} total txs, ${toAddressData.recentTransactions.length} recent, available: ${toAddressData.dataAvailable}`);

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
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096, // Reduced from 32768 for faster response
        responseMimeType: "application/json",
      },
    };

    console.log(`📡 Calling Gemini API...`);
    const geminiStart = Date.now();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout (tighter)

    let response;
    try {
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const geminiTime = Date.now() - geminiStart;
      console.log(`✅ Gemini API responded in ${geminiTime}ms`);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      const geminiTime = Date.now() - geminiStart;
      console.error(`❌ Gemini API fetch failed after ${geminiTime}ms:`, fetchError);
      throw new Error(`Gemini API timeout after ${geminiTime}ms`);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Gemini API error: ${response.status} - ${errorText}`);
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
