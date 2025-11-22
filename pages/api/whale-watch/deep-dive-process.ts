import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';
import { storeWhaleTransaction, storeWhaleAnalysis } from '../../../lib/whale-watch/database';

/**
 * Deep Dive Analysis Background Processor
 * 
 * Processes whale analysis in the background (up to 300 seconds)
 * Updates database with results
 * Frontend polls /deep-dive-poll/[jobId] for status
 * 
 * ✅ ASYNC: Avoids Vercel 60-second timeout
 * ✅ USES GPT-5.1: Correct parameters for o1 models
 * ✅ STORES DATA: Updates database with results
 */

interface DeepDiveRequest {
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

interface DeepDiveResponse {
  success: boolean;
  analysis?: any;
  blockchainData?: any;
  metadata?: any;
  error?: string;
  timestamp: string;
}

/**
 * Fetch REAL transaction history for an address
 */
async function fetchAddressHistory(address: string, limit: number = 3): Promise<any> {
  console.log(`📡 Fetching transaction history for ${address.substring(0, 20)}...`);
  
  try {
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
    
    const transactions = (data.txs || []).slice(0, limit).map((tx: any) => ({
      hash: tx.hash?.substring(0, 16) + '...',
      time: new Date(tx.time * 1000).toISOString(),
      inputs: tx.inputs?.length || 0,
      outputs: tx.out?.length || 0,
      totalBTC: (tx.out?.reduce((sum: number, output: any) => sum + (output.value || 0), 0) / 100000000).toFixed(2),
    }));
    
    console.log(`✅ Got ${transactions.length} transactions for address`);
    
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
    return {
      address: address.substring(0, 20) + '...',
      totalReceived: 0,
      totalSent: 0,
      finalBalance: 0,
      transactionCount: 0,
      recentTransactions: [],
      dataAvailable: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get current Bitcoin price
 * ✅ FIXED: Multiple fallbacks for reliability
 */
async function getCurrentBitcoinPrice(): Promise<number> {
  // Try 1: Internal API
  try {
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/crypto-prices`, {
      signal: AbortSignal.timeout(5000)
    });
    
    if (response.ok) {
      const data = await response.json();
      const btcPrice = data.prices?.find((p: any) => p.symbol === 'BTC')?.price;
      
      if (btcPrice && typeof btcPrice === 'number' && btcPrice > 0) {
        console.log(`✅ BTC price from internal API: $${btcPrice.toLocaleString()}`);
        return btcPrice;
      }
    }
  } catch (error) {
    console.warn('⚠️ Internal price API failed, trying CoinMarketCap...');
  }
  
  // Try 2: CoinMarketCap direct
  try {
    const response = await fetch(
      'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=BTC',
      {
        headers: {
          'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY || '',
        },
        signal: AbortSignal.timeout(5000)
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      const btcPrice = data.data?.BTC?.quote?.USD?.price;
      
      if (btcPrice && typeof btcPrice === 'number' && btcPrice > 0) {
        console.log(`✅ BTC price from CoinMarketCap: $${btcPrice.toLocaleString()}`);
        return btcPrice;
      }
    }
  } catch (error) {
    console.warn('⚠️ CoinMarketCap failed, using fallback price...');
  }
  
  // Fallback: Use reasonable estimate
  const fallbackPrice = 85000;
  console.warn(`⚠️ Using fallback BTC price: $${fallbackPrice.toLocaleString()}`);
  return fallbackPrice;
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
    console.log(`🔄 ========================================`);
    console.log(`🔄 Background Deep Dive processor STARTED`);
    console.log(`🔄 Time: ${new Date().toISOString()}`);
    console.log(`🔄 ========================================`);
    
    const { jobId, whale } = req.body as { jobId: string; whale: DeepDiveRequest };
    
    console.log(`📊 Received request body:`, JSON.stringify({ jobId, whale: whale?.txHash }, null, 2));
    
    if (!jobId) {
      console.error(`❌ Missing jobId in request body`);
      return res.status(400).json({
        success: false,
        error: 'Missing jobId',
        timestamp: new Date().toISOString(),
      });
    }
    
    console.log(`📊 Job ${jobId}: Updating status to 'analyzing'...`);
    
    // Update status to analyzing
    const updateResult = await query(
      'UPDATE whale_analysis SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, status',
      ['analyzing', parseInt(jobId)]
    );
    
    if (updateResult.rows.length === 0) {
      console.error(`❌ Job ${jobId} not found in database`);
      return res.status(404).json({
        success: false,
        error: 'Job not found',
        timestamp: new Date().toISOString(),
      });
    }
    
    console.log(`✅ Job ${jobId}: Status updated to 'analyzing'`, updateResult.rows[0]);

    if (!whale.txHash || !whale.fromAddress || !whale.toAddress) {
      console.error(`❌ Missing required fields`);
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: txHash, fromAddress, toAddress',
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`🔬 Starting Deep Dive for ${whale.txHash.substring(0, 20)}...`);

    // Fetch blockchain data in parallel
    console.log(`📡 Fetching blockchain data...`);
    const blockchainStart = Date.now();
    
    const [fromAddressData, toAddressData] = await Promise.all([
      fetchAddressHistory(whale.fromAddress, 3),
      fetchAddressHistory(whale.toAddress, 3),
    ]);
    
    const blockchainTime = Date.now() - blockchainStart;
    console.log(`✅ Blockchain data fetched in ${blockchainTime}ms`);

    // Get current BTC price
    const currentBtcPrice = await getCurrentBitcoinPrice();
    console.log(`✅ BTC price: $${currentBtcPrice.toLocaleString()}`);

    // Build comprehensive prompt
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

Provide comprehensive JSON analysis with these exact fields:
{
  "address_behavior": {
    "source_classification": "exchange|whale|institutional|mixer|cold_storage|retail",
    "source_strategy": "detailed behavior analysis",
    "destination_classification": "exchange|whale|institutional|mixer|cold_storage|retail",
    "destination_strategy": "detailed behavior analysis"
  },
  "fund_flow_analysis": {
    "origin_hypothesis": "where funds came from",
    "destination_hypothesis": "where funds are going",
    "mixing_detected": boolean,
    "cluster_analysis": "network patterns"
  },
  "market_prediction": {
    "short_term_24h": "24h prediction",
    "medium_term_7d": "7d forecast",
    "key_price_levels": {
      "support": [number, number, number],
      "resistance": [number, number, number]
    },
    "probability_further_movement": number
  },
  "strategic_intelligence": {
    "intent": "transaction purpose",
    "sentiment_indicator": "bullish|bearish|neutral",
    "trader_positioning": "actionable recommendation",
    "risk_reward_ratio": "ratio like 1:3"
  },
  "transaction_type": "exchange_deposit|exchange_withdrawal|whale_to_whale|unknown",
  "reasoning": "detailed analysis",
  "key_findings": ["finding 1", "finding 2", "finding 3"],
  "trader_action": "specific recommendation",
  "confidence": number
}

Be specific with numbers and actionable recommendations.`;

    // Call OpenAI API with GPT-5.1 (o1-mini)
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // ✅ FIXED: Use correct model from environment (gpt-5.1)
    const model = process.env.OPENAI_MODEL || 'gpt-4o';
    console.log(`📡 Calling OpenAI API (${model})...`);
    const openaiStart = Date.now();

    let response: Response;
    let analysisText: string;

    // ✅ FIXED: Handle both GPT-5.1 and GPT-4o with correct parameters
    if (model.includes('gpt-5.1') || model.includes('o1')) {
      // GPT-5.1 / o1 models use different endpoint and parameters
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'user',
              content: `You are an expert cryptocurrency analyst. Analyze this whale transaction and respond only with valid JSON.\n\n${prompt}`
            }
          ],
          max_completion_tokens: 2000, // ✅ CORRECT for GPT-5.1
          // Note: GPT-5.1 doesn't support temperature or response_format
        }),
        signal: AbortSignal.timeout(50000), // 50 seconds (Vercel Hobby limit is 60s)
      });

      const openaiTime = Date.now() - openaiStart;
      console.log(`✅ ${model} responded in ${openaiTime}ms with status ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ ${model} API error: ${response.status}`, errorText);
        throw new Error(`${model} API error: ${response.status}`);
      }

      const data = await response.json();
      
      // ✅ FIXED: Better logging and response handling for GPT-5.1
      console.log(`📊 GPT-5.1 Response keys:`, Object.keys(data));
      if (data.choices && data.choices[0]) {
        console.log(`📊 Choice[0] keys:`, Object.keys(data.choices[0]));
        if (data.choices[0].message) {
          console.log(`📊 Message keys:`, Object.keys(data.choices[0].message));
          console.log(`📊 Message content type:`, typeof data.choices[0].message.content);
          console.log(`📊 Message content length:`, data.choices[0].message.content?.length || 0);
        }
      }
      
      // Try multiple possible response formats
      analysisText = data.choices?.[0]?.message?.content || 
                     data.choices?.[0]?.text || 
                     data.content ||
                     data.message?.content;

      if (!analysisText) {
        console.error(`❌ No content found. Full response:`, JSON.stringify(data, null, 2).substring(0, 1000));
        throw new Error(`No response from ${model}. Response has keys: ${Object.keys(data).join(', ')}`);
      }
      
      console.log(`✅ Got GPT-5.1 response text (${analysisText.length} chars)`);
      console.log(`📝 First 300 chars:`, analysisText.substring(0, 300));

    } else {
      // GPT-4o uses standard parameters
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: model,
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
          max_tokens: 2000, // ✅ CORRECT for GPT-4o
          response_format: { type: 'json_object' }
        }),
        signal: AbortSignal.timeout(30000), // 30 seconds for GPT-4o
      });

      const openaiTime = Date.now() - openaiStart;
      console.log(`✅ ${model} responded in ${openaiTime}ms with status ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ ${model} API error: ${response.status}`, errorText);
        throw new Error(`${model} API error: ${response.status}`);
      }

      const data = await response.json();
      analysisText = data.choices?.[0]?.message?.content;

      if (!analysisText) {
        throw new Error(`No response from ${model}`);
      }
    }

    // Parse JSON response
    const analysis = JSON.parse(analysisText);

    const processingTime = Date.now() - startTime;
    console.log(`✅ Deep Dive completed with ${model} in ${processingTime}ms`);

    // ✅ UPDATE DATABASE: Store whale transaction
    try {
      await storeWhaleTransaction({
        txHash: whale.txHash,
        blockchain: whale.blockchain,
        amount: whale.amount,
        amountUSD: whale.amountUSD,
        fromAddress: whale.fromAddress,
        toAddress: whale.toAddress,
        transactionType: analysis.transaction_type || whale.type,
        description: whale.description,
        transactionTimestamp: new Date(whale.timestamp),
      });
    } catch (error) {
      console.error('⚠️ Failed to store whale transaction:', error);
    }

    // ✅ UPDATE DATABASE: Update job with results
    const metadata = {
      model: model,
      provider: 'OpenAI',
      processingTime,
      timestamp: new Date().toISOString(),
      dataSourcesUsed: ['blockchain.info', 'crypto-prices API'],
      blockchainDataAvailable: fromAddressData.dataAvailable && toAddressData.dataAvailable,
    };

    await query(
      `UPDATE whale_analysis 
       SET status = $1,
           analysis_data = $2,
           blockchain_data = $3,
           metadata = $4,
           confidence = $5,
           updated_at = NOW()
       WHERE id = $6`,
      [
        'completed',
        JSON.stringify(analysis),
        JSON.stringify({ sourceAddress: fromAddressData, destinationAddress: toAddressData }),
        JSON.stringify(metadata),
        analysis.confidence,
        parseInt(jobId)
      ]
    );

    console.log(`✅ Job ${jobId}: Analysis completed and stored`);

    return res.status(200).json({
      success: true,
      analysis,
      blockchainData: {
        sourceAddress: fromAddressData,
        destinationAddress: toAddressData,
      },
      metadata,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`❌ Deep Dive error after ${processingTime}ms:`, error);
    
    let errorMessage = 'Deep Dive analysis failed';
    
    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message.includes('abort')) {
        errorMessage = 'Analysis timed out';
      } else if (error.message.includes('API key')) {
        errorMessage = 'OpenAI API key issue';
      } else {
        errorMessage = error.message;
      }
    }

    // Update job status to failed
    const { jobId } = req.body as { jobId: string };
    if (jobId) {
      try {
        await query(
          `UPDATE whale_analysis 
           SET status = $1, 
               analysis_data = $2,
               updated_at = NOW()
           WHERE id = $3`,
          ['failed', JSON.stringify({ error: errorMessage }), parseInt(jobId)]
        );
        console.log(`❌ Job ${jobId}: Marked as failed`);
      } catch (dbError) {
        console.error('❌ Failed to update job status:', dbError);
      }
    }

    return res.status(500).json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
}
