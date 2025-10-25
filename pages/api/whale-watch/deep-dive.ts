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
 * Fetch REAL transaction history for an address using blockchain.info API
 * Returns real data or throws error - NO FALLBACKS
 */
async function fetchAddressHistory(address: string, limit: number = 3): Promise<any> {
  console.log(`📡 Fetching REAL transaction history for ${address.substring(0, 20)}...`);
  
  // Use blockchain.info API with 5-second timeout
  const response = await fetch(
    `https://blockchain.info/rawaddr/${address}?limit=${limit}`,
    { signal: AbortSignal.timeout(5000) }
  );
  
  if (!response.ok) {
    console.error(`❌ Blockchain API returned ${response.status}`);
    // Return structure indicating no data available
    return {
      address: address.substring(0, 20) + '...',
      totalReceived: 0,
      totalSent: 0,
      finalBalance: 0,
      transactionCount: 0,
      recentTransactions: [],
      dataAvailable: false,
      error: `API returned ${response.status}`,
    };
  }
  
  const data = await response.json();
  
  // Verify we got real data
  if (!data || !data.txs || data.txs.length === 0) {
    console.warn(`⚠️ No transaction data returned for address`);
    return {
      address: address.substring(0, 20) + '...',
      totalReceived: ((data?.total_received || 0) / 100000000).toFixed(2),
      totalSent: ((data?.total_sent || 0) / 100000000).toFixed(2),
      finalBalance: ((data?.final_balance || 0) / 100000000).toFixed(2),
      transactionCount: data?.n_tx || 0,
      recentTransactions: [],
      dataAvailable: false,
      error: 'No transactions found',
    };
  }
  
  // Extract REAL transaction data
  const transactions = data.txs.slice(0, limit).map((tx: any) => ({
    hash: tx.hash?.substring(0, 16) + '...',
    time: new Date(tx.time * 1000).toISOString(),
    inputs: tx.inputs?.length || 0,
    outputs: tx.out?.length || 0,
    totalBTC: (tx.out?.reduce((sum: number, output: any) => sum + (output.value || 0), 0) / 100000000).toFixed(2),
  }));
  
  console.log(`✅ Got ${transactions.length} real transactions for address`);
  
  return {
    address: address.substring(0, 20) + '...',
    totalReceived: ((data.total_received || 0) / 100000000).toFixed(2),
    totalSent: ((data.total_sent || 0) / 100000000).toFixed(2),
    finalBalance: ((data.final_balance || 0) / 100000000).toFixed(2),
    transactionCount: data.n_tx || 0,
    recentTransactions: transactions,
    dataAvailable: true,
  };
}

/**
 * Build deep dive analysis prompt with REAL blockchain data
 */
function buildDeepDivePrompt(
  whale: DeepDiveRequest,
  fromAddressData: any,
  toAddressData: any,
  currentBtcPrice: number
): string {
  return `You are an expert cryptocurrency market analyst and blockchain forensics specialist. Analyze this Bitcoin whale transaction using the REAL blockchain data provided.

**TRANSACTION DETAILS:**
- Hash: ${whale.txHash.substring(0, 20)}...
- Amount: ${whale.amount.toFixed(2)} BTC ($${(whale.amount * currentBtcPrice).toLocaleString()})
- Time: ${whale.timestamp}
- Current BTC Price: $${currentBtcPrice.toLocaleString()}

**REAL SOURCE ADDRESS BLOCKCHAIN DATA:**
${JSON.stringify(fromAddressData, null, 2)}

**REAL DESTINATION ADDRESS BLOCKCHAIN DATA:**
${JSON.stringify(toAddressData, null, 2)}

**DEEP DIVE ANALYSIS REQUIRED:**

Using the REAL blockchain transaction history above, provide:

1. **Address Behavior Analysis:**
   - Classify both addresses based on their transaction patterns
   - Identify accumulation vs distribution behavior
   - Detect any mixing or sophisticated trading patterns
   - Assess sophistication level of the actors

2. **Fund Flow Intelligence:**
   - Trace likely origin of funds based on source address history
   - Predict destination strategy based on destination address patterns
   - Identify if this is exchange-related activity
   - Detect any unusual or anomalous behavior

3. **Market Impact Prediction:**
   - 24-hour price outlook with specific reasoning
   - 7-day trend forecast based on similar historical patterns
   - Provide 3 specific support levels and 3 resistance levels
   - Calculate probability of further large movements

4. **Strategic Trading Intelligence:**
   - Determine likely intent behind this transaction
   - Assess market sentiment implications (bullish/bearish/neutral)
   - Provide specific trader positioning recommendations
   - Calculate risk/reward ratios for potential trades

Base your analysis ONLY on the real blockchain data provided. Be specific and actionable.

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

    // Fetch REAL blockchain data (REQUIRED - no fallbacks)
    console.log(`📡 Fetching real blockchain data from blockchain.info...`);
    const blockchainStart = Date.now();
    
    let fromAddressData: any;
    let toAddressData: any;
    
    try {
      // Fetch with timeout - fail if takes too long
      [fromAddressData, toAddressData] = await Promise.race([
        Promise.all([
          fetchAddressHistory(whale.fromAddress, 3),
          fetchAddressHistory(whale.toAddress, 3),
        ]),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Blockchain API timeout after 8 seconds')), 8000)
        )
      ]) as any;
      
      const blockchainTime = Date.now() - blockchainStart;
      console.log(`✅ Blockchain data fetched in ${blockchainTime}ms`);
      
      // VERIFY we got real data (not fallback)
      if (!fromAddressData.dataAvailable && !toAddressData.dataAvailable) {
        throw new Error('Blockchain API returned no data for both addresses. Cannot proceed without real data.');
      }
      
      console.log(`📊 Source: ${fromAddressData.transactionCount} total txs, ${fromAddressData.recentTransactions.length} recent`);
      console.log(`📊 Destination: ${toAddressData.transactionCount} total txs, ${toAddressData.recentTransactions.length} recent`);
      
      // Warn if partial data
      if (!fromAddressData.dataAvailable) {
        console.warn(`⚠️ Source address data unavailable, analysis will be limited`);
      }
      if (!toAddressData.dataAvailable) {
        console.warn(`⚠️ Destination address data unavailable, analysis will be limited`);
      }
      
    } catch (error) {
      const blockchainTime = Date.now() - blockchainStart;
      console.error(`❌ Failed to fetch blockchain data after ${blockchainTime}ms:`, error);
      
      // FAIL FAST - Don't proceed without real data
      throw new Error(
        `Cannot perform Deep Dive analysis: Blockchain data unavailable. ` +
        `This could be due to: (1) Blockchain.info API timeout, (2) Rate limiting, or (3) Network issues. ` +
        `Please try again in a moment.`
      );
    }

    // Get current BTC price
    const currentBtcPrice = await getCurrentBitcoinPrice();

    // Load Gemini configuration (use Flash for speed - still very capable)
    const geminiConfig = getGeminiConfig();
    const selectedModel = 'gemini-2.5-flash'; // Use Flash for speed (2-5s vs 10-15s for Pro)
    const modelConfig = getModelConfig(selectedModel, geminiConfig);

    console.log(`🎯 Using ${selectedModel} for deep analysis (optimized for speed)`);

    // Build deep dive prompt with REAL blockchain data
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
    
    // Provide a helpful error message based on the error type
    let errorMessage = 'Deep Dive analysis failed';
    let errorDetails = '';
    
    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message.includes('abort')) {
        errorMessage = 'Analysis timed out. The blockchain data fetch or AI analysis took too long.';
        errorDetails = 'Try again in a moment. The service may be experiencing high load.';
      } else if (error.message.includes('API key')) {
        errorMessage = 'Gemini API key issue';
        errorDetails = 'Please check your GEMINI_API_KEY environment variable.';
      } else if (error.message.includes('429')) {
        errorMessage = 'Rate limit exceeded';
        errorDetails = 'Too many requests. Please wait a moment before trying again.';
      } else {
        errorMessage = error.message;
      }
    }

    return res.status(500).json({
      success: false,
      error: errorMessage,
      details: errorDetails,
      processingTime,
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
