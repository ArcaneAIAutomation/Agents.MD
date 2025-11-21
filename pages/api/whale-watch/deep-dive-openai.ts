import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * OpenAI Deep Dive Analysis API
 * 
 * Uses OpenAI o1-mini (ChatGPT-5.1) for comprehensive whale transaction analysis with advanced reasoning
 * Implements fallback to gpt-4o if o1 models timeout
 * Supports o1-preview for complex transaction patterns
 * with real blockchain data
 */

// OpenAI o1 model configuration (ChatGPT-5.1)
// Primary: o1-mini for reasoning-based whale transaction analysis
// Complex: o1-preview for unusual transaction patterns
// Fallback: gpt-4o for speed when o1 models timeout
const MODEL = process.env.OPENAI_MODEL || 'o1-mini';
const COMPLEX_MODEL = process.env.OPENAI_COMPLEX_MODEL || 'o1-preview';
const FALLBACK_MODEL = process.env.OPENAI_FALLBACK_MODEL || 'gpt-4o';

// Timeout configuration
const O1_TIMEOUT = parseInt(process.env.O1_TIMEOUT || '120000'); // 120 seconds
const GPT4O_TIMEOUT = parseInt(process.env.GPT4O_TIMEOUT || '30000'); // 30 seconds

interface DeepDiveRequest {
  txHash: string;
  amount: number;
  fromAddress: string;
  toAddress: string;
  timestamp: string;
  initialAnalysis?: any;
}

interface DeepDiveResponse {
  success: boolean;
  analysis?: any;
  blockchainData?: any;
  metadata?: any;
  error?: string;
  details?: string;
  processingTime?: number;
  timestamp: string;
}

/**
 * Fetch REAL transaction history for an address using blockchain.info API
 */
async function fetchAddressHistory(address: string, limit: number = 3): Promise<any> {
  console.log(`📡 Fetching REAL transaction history for ${address.substring(0, 20)}...`);
  
  const response = await fetch(
    `https://blockchain.info/rawaddr/${address}?limit=${limit}`,
    { signal: AbortSignal.timeout(5000) }
  );
  
  if (!response.ok) {
    console.error(`❌ Blockchain API returned ${response.status}`);
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
    console.error('❌ Failed to fetch BTC price:', error);
    throw new Error(`Unable to fetch accurate BTC price: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
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
    console.log(`🤖 OpenAI Deep Dive API called`);
    
    const whale: DeepDiveRequest = req.body;

    if (!whale.txHash || !whale.fromAddress || !whale.toAddress) {
      console.error(`❌ Missing required fields`);
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: txHash, fromAddress, toAddress',
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`🤖 Starting OpenAI Deep Dive for ${whale.txHash.substring(0, 20)}...`);

    // Fetch blockchain data
    console.log(`📡 Fetching blockchain data...`);
    const blockchainStart = Date.now();
    
    let fromAddressData: any;
    let toAddressData: any;
    
    try {
      [fromAddressData, toAddressData] = await Promise.race([
        Promise.all([
          fetchAddressHistory(whale.fromAddress, 3),
          fetchAddressHistory(whale.toAddress, 3),
        ]),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Blockchain API timeout')), 8000)
        )
      ]) as any;
      
      const blockchainTime = Date.now() - blockchainStart;
      console.log(`✅ Blockchain data fetched in ${blockchainTime}ms`);
      
      if (!fromAddressData.dataAvailable && !toAddressData.dataAvailable) {
        throw new Error('Blockchain API returned no data for both addresses');
      }
      
    } catch (error) {
      const blockchainTime = Date.now() - blockchainStart;
      console.error(`❌ Failed to fetch blockchain data after ${blockchainTime}ms:`, error);
      throw new Error('Cannot perform Deep Dive: Blockchain data unavailable. Please try again.');
    }

    // Get current BTC price
    const currentBtcPrice = await getCurrentBitcoinPrice();
    console.log(`✅ BTC price: $${currentBtcPrice.toLocaleString()}`);

    // Build enhanced prompt with detailed transaction analysis
    const recentTxDetails = fromAddressData.recentTransactions.map((tx: any, i: number) => 
      `${i+1}. ${tx.time.substring(0,10)} - ${tx.totalBTC} BTC (${tx.inputs}→${tx.outputs})`
    ).join('\n');
    
    const destTxDetails = toAddressData.recentTransactions.map((tx: any, i: number) => 
      `${i+1}. ${tx.time.substring(0,10)} - ${tx.totalBTC} BTC (${tx.inputs}→${tx.outputs})`
    ).join('\n');
    
    const prompt = `You are an elite cryptocurrency intelligence analyst. Analyze this Bitcoin whale transaction using REAL blockchain data.

🔍 WHALE TRANSACTION:
- Amount: ${whale.amount.toFixed(2)} BTC ($${(whale.amount * currentBtcPrice).toLocaleString()})
- Current BTC Price: $${currentBtcPrice.toLocaleString()}
- Timestamp: ${whale.timestamp}
- Hash: ${whale.txHash.substring(0, 20)}...

📊 SOURCE ADDRESS INTELLIGENCE:
- Address: ${fromAddressData.address}
- Balance: ${fromAddressData.finalBalance} BTC
- Total Transactions: ${fromAddressData.transactionCount}
- Total Received: ${fromAddressData.totalReceived} BTC
- Total Sent: ${fromAddressData.totalSent} BTC
Recent Activity:
${recentTxDetails || 'No recent transactions'}

📊 DESTINATION ADDRESS INTELLIGENCE:
- Address: ${toAddressData.address}
- Balance: ${toAddressData.finalBalance} BTC
- Total Transactions: ${toAddressData.transactionCount}
- Total Received: ${toAddressData.totalReceived} BTC
- Total Sent: ${toAddressData.totalSent} BTC
Recent Activity:
${destTxDetails || 'No recent transactions'}

🎯 DEEP DIVE ANALYSIS REQUIRED:

Provide comprehensive JSON analysis:
{
  "address_behavior": {
    "source_classification": "exchange|whale|institutional|mixer|cold_storage|retail",
    "source_pattern": "detailed behavior analysis with transaction frequency, timing patterns, and sophistication level",
    "source_activity_level": "high|medium|low",
    "destination_classification": "exchange|whale|institutional|mixer|cold_storage|retail",
    "destination_pattern": "detailed behavior analysis",
    "destination_activity_level": "high|medium|low",
    "velocity_analysis": "how quickly funds typically move through these addresses"
  },
  "transaction_patterns": {
    "timing_significance": "analysis of when this transaction occurred (market hours, price level, etc)",
    "size_significance": "how this amount compares to typical transactions for these addresses",
    "frequency_analysis": "transaction frequency patterns for both addresses",
    "anomaly_detected": boolean,
    "anomaly_description": "if anomaly detected, explain what's unusual"
  },
  "fund_flow_analysis": {
    "origin_hypothesis": "detailed hypothesis about where these funds originated",
    "destination_hypothesis": "detailed hypothesis about final destination",
    "intermediate_hops": "estimated number of hops before/after",
    "mixing_detected": boolean,
    "exchange_flow_direction": "deposit|withdrawal|internal|unknown",
    "cluster_analysis": "broader transaction network patterns"
  },
  "market_prediction": {
    "short_term_24h": "specific 24h price prediction with reasoning",
    "medium_term_7d": "specific 7d trend forecast with reasoning",
    "key_price_levels": {
      "support": [number, number, number],
      "resistance": [number, number, number]
    },
    "probability_further_movement": number,
    "volume_impact": "expected impact on trading volume"
  },
  "strategic_intelligence": {
    "intent": "likely reason for this specific transaction",
    "sophistication_level": "high|medium|low with explanation",
    "sentiment_indicator": "bullish|bearish|neutral",
    "manipulation_risk": "high|medium|low",
    "trader_positioning": "specific actionable recommendation",
    "risk_reward_ratio": "specific ratio like 1:3",
    "position_sizing": "recommended position size as % of portfolio",
    "entry_strategy": "specific entry points and timing",
    "exit_strategy": "specific exit points and profit targets"
  },
  "historical_context": {
    "similar_transactions": "description of similar past whale movements",
    "historical_outcome": "what happened after similar transactions",
    "pattern_match": "identified pattern type",
    "market_cycle_position": "where we are in the market cycle"
  },
  "confidence": number,
  "key_insights": [
    "specific actionable insight with numbers",
    "specific actionable insight with numbers",
    "specific actionable insight with numbers",
    "specific actionable insight with numbers",
    "specific actionable insight with numbers"
  ],
  "red_flags": ["any concerning patterns or risks"],
  "opportunities": ["specific trading opportunities identified"]
}

Be extremely specific with numbers, prices, and actionable recommendations. Focus on what traders need to know RIGHT NOW.`;

    // Call OpenAI API with o1 models
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Detect if this is a complex transaction pattern
    const isComplexPattern = whale.amount > 1000 || // Very large transaction
                            fromAddressData.transactionCount > 10000 || // High-activity address
                            toAddressData.transactionCount > 10000;
    
    const selectedModel = isComplexPattern ? COMPLEX_MODEL : MODEL;
    
    if (isComplexPattern) {
      console.log(`🔍 Complex transaction pattern detected, using ${COMPLEX_MODEL}`);
    }

    console.log(`📡 Calling OpenAI API (${selectedModel})...`);
    const openaiStart = Date.now();

    let response: Response;
    let modelUsed = selectedModel;
    let reasoning: string | undefined;

    try {
      // Try o1 models first
      response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: selectedModel,
          input: [
            {
              role: 'user',
              content: `You are an expert cryptocurrency analyst with advanced reasoning capabilities. Analyze this whale transaction and respond only with valid JSON.\n\n${prompt}`
            }
          ],
          max_output_tokens: 2000
          // Note: o1 models don't support temperature or response_format
        }),
        signal: AbortSignal.timeout(O1_TIMEOUT),
      });

      const openaiTime = Date.now() - openaiStart;
      console.log(`✅ ${selectedModel} responded in ${openaiTime}ms with status ${response.status}`);

      if (!response.ok) {
        throw new Error(`${selectedModel} API error: ${response.status}`);
      }

      const data = await response.json();
      const analysisText = data.choices?.[0]?.message?.content;
      reasoning = data.choices?.[0]?.message?.reasoning;

      if (!analysisText) {
        throw new Error(`No response from ${selectedModel}`);
      }

      const analysis = JSON.parse(analysisText);

      const processingTime = Date.now() - startTime;
      console.log(`✅ OpenAI Deep Dive completed with ${selectedModel} in ${processingTime}ms`);

      return res.status(200).json({
        success: true,
        analysis,
        blockchainData: {
          sourceAddress: fromAddressData,
          destinationAddress: toAddressData,
        },
        metadata: {
          model: modelUsed,
          provider: 'OpenAI',
          processingTime,
          timestamp: new Date().toISOString(),
          reasoning: reasoning ? 'Available' : undefined,
        },
        timestamp: new Date().toISOString(),
      });

    } catch (o1Error) {
      console.error(`❌ ${selectedModel} failed, trying gpt-4o fallback:`, o1Error);
      
      // Fallback to gpt-4o
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: FALLBACK_MODEL,
          messages: [
            {
              role: 'system',
              content: 'You are an expert cryptocurrency analyst. Respond only with valid JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000,
          response_format: { type: 'json_object' }
        }),
        signal: AbortSignal.timeout(GPT4O_TIMEOUT),
      });

      const openaiTime = Date.now() - openaiStart;
      console.log(`✅ ${FALLBACK_MODEL} responded in ${openaiTime}ms with status ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ ${FALLBACK_MODEL} API error: ${response.status}`);
        throw new Error(`${FALLBACK_MODEL} API error: ${response.status}`);
      }

      const data = await response.json();
      const analysisText = data.choices?.[0]?.message?.content;

      if (!analysisText) {
        throw new Error(`No response from ${FALLBACK_MODEL}`);
      }

      const analysis = JSON.parse(analysisText);
      modelUsed = `${FALLBACK_MODEL} (fallback)`;

      const processingTime = Date.now() - startTime;
      console.log(`✅ OpenAI Deep Dive completed with ${FALLBACK_MODEL} (fallback) in ${processingTime}ms`);

      return res.status(200).json({
        success: true,
        analysis,
        blockchainData: {
          sourceAddress: fromAddressData,
          destinationAddress: toAddressData,
        },
        metadata: {
          model: modelUsed,
          provider: 'OpenAI',
          processingTime,
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      });
    }

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`❌ OpenAI Deep Dive error after ${processingTime}ms:`, error);
    
    let errorMessage = 'OpenAI Deep Dive analysis failed';
    let errorDetails = '';
    
    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message.includes('abort')) {
        errorMessage = 'Analysis timed out';
        errorDetails = 'Try again in a moment';
      } else if (error.message.includes('API key')) {
        errorMessage = 'OpenAI API key issue';
        errorDetails = 'Check OPENAI_API_KEY environment variable';
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
