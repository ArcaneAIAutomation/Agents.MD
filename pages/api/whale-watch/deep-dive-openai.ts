import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * OpenAI Deep Dive Analysis API
 * 
 * Uses GPT-4o for comprehensive whale transaction analysis
 * with real blockchain data
 */

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
    console.warn('⚠️ Failed to fetch BTC price, using fallback');
    return 95000;
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

    // Build prompt
    const sourceSummary = `Address: ${fromAddressData.address}, Balance: ${fromAddressData.finalBalance} BTC, Total Txs: ${fromAddressData.transactionCount}`;
    const destSummary = `Address: ${toAddressData.address}, Balance: ${toAddressData.finalBalance} BTC, Total Txs: ${toAddressData.transactionCount}`;
    
    const prompt = `Analyze this Bitcoin whale transaction using real blockchain data.

TRANSACTION:
- Amount: ${whale.amount.toFixed(2)} BTC ($${(whale.amount * currentBtcPrice).toLocaleString()})
- BTC Price: $${currentBtcPrice.toLocaleString()}

SOURCE: ${sourceSummary}
DESTINATION: ${destSummary}

Provide JSON analysis with:
{
  "address_behavior": {
    "source_classification": "exchange|whale|institutional|retail",
    "source_pattern": "description",
    "destination_classification": "exchange|whale|institutional|retail",
    "destination_pattern": "description"
  },
  "fund_flow_analysis": {
    "origin_hypothesis": "where funds came from",
    "destination_hypothesis": "where funds going",
    "mixing_detected": boolean
  },
  "market_prediction": {
    "short_term_24h": "24h outlook",
    "medium_term_7d": "7d outlook",
    "key_price_levels": {
      "support": [number, number, number],
      "resistance": [number, number, number]
    }
  },
  "strategic_intelligence": {
    "intent": "transaction intent",
    "sentiment_indicator": "bullish|bearish|neutral",
    "trader_positioning": "recommendation",
    "risk_reward_ratio": "ratio"
  },
  "confidence": number,
  "key_insights": ["insight1", "insight2", "insight3"]
}`;

    // Call OpenAI API
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    console.log(`📡 Calling OpenAI API (GPT-4o)...`);
    const openaiStart = Date.now();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
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
      signal: AbortSignal.timeout(15000),
    });

    const openaiTime = Date.now() - openaiStart;
    console.log(`✅ OpenAI responded in ${openaiTime}ms with status ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ OpenAI API error: ${response.status}`);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const analysisText = data.choices?.[0]?.message?.content;

    if (!analysisText) {
      throw new Error('No response from OpenAI');
    }

    const analysis = JSON.parse(analysisText);

    const processingTime = Date.now() - startTime;
    console.log(`✅ OpenAI Deep Dive completed in ${processingTime}ms`);

    return res.status(200).json({
      success: true,
      analysis,
      blockchainData: {
        sourceAddress: fromAddressData,
        destinationAddress: toAddressData,
      },
      metadata: {
        model: 'gpt-4o',
        provider: 'OpenAI',
        processingTime,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });

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
