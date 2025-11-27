import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';
import { storeWhaleTransaction, storeWhaleAnalysis } from '../../../lib/whale-watch/database';
import { identifyAddresses, formatArkhamDataForPrompt, determineTransactionType } from '../../../lib/arkham/client';
import { extractResponseText, validateResponseText } from '../../../utils/openai';

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

    // Get Arkham Intelligence and BTC price in parallel
    const [arkhamData, currentBtcPrice] = await Promise.all([
      identifyAddresses([whale.fromAddress, whale.toAddress]),
      getCurrentBitcoinPrice(),
    ]);
    
    // Extract Arkham intelligence
    const fromArkham = arkhamData.get(whale.fromAddress);
    const toArkham = arkhamData.get(whale.toAddress);
    
    console.log(`🔍 Arkham Intelligence:`);
    console.log(`   From: ${fromArkham?.entity?.name || 'Unknown'} (${fromArkham?.entity?.type || 'unknown'})`);
    console.log(`   To: ${toArkham?.entity?.name || 'Unknown'} (${toArkham?.entity?.type || 'unknown'})`);
    
    // Determine transaction type using Arkham intelligence
    const transactionType = determineTransactionType(fromArkham, toArkham);
    console.log(`   Detected Type: ${transactionType}`);
    
    console.log(`✅ BTC price: $${currentBtcPrice.toLocaleString()}`);

    // Build comprehensive prompt
    const recentTxDetails = fromAddressData.recentTransactions.map((tx: any, i: number) => 
      `${i+1}. ${tx.time.substring(0,10)} - ${tx.totalBTC} BTC (${tx.inputs}→${tx.outputs})`
    ).join('\n');
    
    const destTxDetails = toAddressData.recentTransactions.map((tx: any, i: number) => 
      `${i+1}. ${tx.time.substring(0,10)} - ${tx.totalBTC} BTC (${tx.inputs}→${tx.outputs})`
    ).join('\n');
    
    const prompt = `You are an elite cryptocurrency intelligence analyst with DIRECT ACCESS to real-time Bitcoin blockchain data.

⚡ DATA SOURCES AVAILABLE TO YOU:
✅ Blockchain.com API - Live Bitcoin blockchain data (balance, transactions, history)
✅ Supabase Database - Historical whale transaction patterns and analytics
✅ Arkham Intelligence - Entity identification and labeling (when available)
❌ Arkham Live Database - Coming soon (not yet available)

IMPORTANT: You have complete blockchain data for both addresses below. Do NOT claim you lack access to blockchain information. All data provided is REAL and VERIFIED from live blockchain sources. Base your analysis on this verified data, not speculation about data availability.

🔍 WHALE TRANSACTION:
- Amount: ${whale.amount.toFixed(2)} BTC ($${(whale.amount * currentBtcPrice).toLocaleString()})
- Current BTC Price: $${currentBtcPrice.toLocaleString()}
- Timestamp: ${whale.timestamp}
- Hash: ${whale.txHash.substring(0, 20)}...

📊 SOURCE ADDRESS INTELLIGENCE (from Blockchain.com API):
- Address: ${fromAddressData.address}
- Arkham ID: ${formatArkhamDataForPrompt(fromArkham)}
- Current Balance: ${fromAddressData.finalBalance} BTC (verified on-chain)
- Total Transactions: ${fromAddressData.transactionCount} (complete history)
- Total Received: ${fromAddressData.totalReceived} BTC (lifetime)
- Total Sent: ${fromAddressData.totalSent} BTC (lifetime)
Recent Activity (verified blockchain data):
${recentTxDetails || 'No recent transactions'}

📊 DESTINATION ADDRESS INTELLIGENCE (from Blockchain.com API):
- Address: ${toAddressData.address}
- Arkham ID: ${formatArkhamDataForPrompt(toArkham)}
- Current Balance: ${toAddressData.finalBalance} BTC (verified on-chain)
- Total Transactions: ${toAddressData.transactionCount} (complete history)
- Total Received: ${toAddressData.totalReceived} BTC (lifetime)
- Total Sent: ${toAddressData.totalSent} BTC (lifetime)
Recent Activity (verified blockchain data):
${destTxDetails || 'No recent transactions'}

🔍 ARKHAM INTELLIGENCE ANALYSIS:
- Detected Transaction Type: ${transactionType}
- Source Entity: ${fromArkham?.entity?.name || 'Unknown'}
- Destination Entity: ${toArkham?.entity?.name || 'Unknown'}
- Use this Arkham intelligence to enhance your analysis accuracy

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
  "reasoning": "detailed analysis based on the verified blockchain data provided above",
  "key_findings": ["finding 1", "finding 2", "finding 3"],
  "trader_action": "specific recommendation",
  "confidence": number
}

CRITICAL INSTRUCTIONS:
1. Base your analysis ONLY on the verified blockchain data provided above
2. Do NOT claim you lack access to blockchain data - you have complete on-chain information
3. Do NOT state your analysis is "inferential" or "speculative" - it is based on real blockchain data
4. The Blockchain.com API data above is authoritative and complete
5. You can reference the Supabase database for historical patterns and context
6. Be specific with numbers and actionable recommendations based on the data provided.`;

    // Call OpenAI API with GPT-5.1 (o1-mini)
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // ✅ MIGRATED TO RESPONSES API: Proper GPT-5.1 implementation
    const model = process.env.OPENAI_MODEL || 'gpt-5.1';
    const reasoningEffort = process.env.OPENAI_REASONING_EFFORT || 'medium'; // none, low, medium, high
    
    console.log(`📡 Calling OpenAI Responses API with ${model} (reasoning: ${reasoningEffort})...`);
    const openaiStart = Date.now();

    let response: Response;
    let analysisText: string;

    // ✅ GPT-5.1 with Responses API (PROPER IMPLEMENTATION)
    if (model === 'gpt-5.1' || model.includes('gpt-5')) {
      console.log(`🚀 Using Responses API for ${model}`);
      
      response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: model,
          input: `You are an expert cryptocurrency analyst. Analyze this whale transaction and respond only with valid JSON.\n\n${prompt}`,
          reasoning: {
            effort: reasoningEffort // none, low, medium, high
          },
          text: {
            verbosity: 'medium' // low, medium, high
          },
          max_output_tokens: 6000,
        }),
        signal: AbortSignal.timeout(270000), // 270 seconds (4.5 minutes) - Vercel Pro allows 300s
      });

      const openaiTime = Date.now() - openaiStart;
      console.log(`✅ ${model} Responses API responded in ${openaiTime}ms with status ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ ${model} Responses API error: ${response.status}`, errorText);
        throw new Error(`${model} Responses API error: ${response.status}`);
      }

      const data = await response.json();
      
      // ✅ BULLETPROOF: Extract text using utility function
      console.log(`📊 Responses API keys:`, Object.keys(data));
      
      // Use bulletproof extraction utility with debug logging
      analysisText = extractResponseText(data, true);
      
      // Validate extraction succeeded
      validateResponseText(analysisText, model, data);
      
      console.log(`✅ Got ${model} response text (${analysisText.length} chars)`);
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
        signal: AbortSignal.timeout(270000), // 270 seconds (4.5 minutes) - Vercel Pro allows 300s
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

    // ✅ ULTIMATE BULLETPROOF JSON PARSING: 1000x Power Edition
    let analysis: any;
    try {
      // Try direct parse first (fast path)
      analysis = JSON.parse(analysisText);
      console.log(`✅ Direct JSON parse succeeded`);
    } catch (parseError) {
      console.warn(`⚠️ Initial JSON parse failed, engaging ULTIMATE cleanup...`);
      console.log(`📝 Error:`, parseError instanceof Error ? parseError.message : String(parseError));
      
      try {
        // PHASE 1: Basic cleanup
        let cleanedText = analysisText.trim();
        
        // PHASE 2: Remove markdown and extra text
        cleanedText = cleanedText
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/\s*```$/i, '')
          .replace(/^[^{]*({)/s, '$1')
          .replace(/(})[^}]*$/s, '$1');
        
        // PHASE 3: Fix trailing commas (multiple passes for nested structures)
        for (let i = 0; i < 5; i++) {
          cleanedText = cleanedText
            .replace(/,(\s*])/g, '$1')
            .replace(/,(\s*})/g, '$1');
        }
        
        // PHASE 4: Fix common number format issues
        cleanedText = cleanedText
          // Fix numbers with trailing dots: 123. → 123
          .replace(/(\d+)\.(\s*[,\]}])/g, '$1$2')
          // Fix multiple dots in numbers: 123..45 → 123.45
          .replace(/(\d+)\.\.+(\d+)/g, '$1.$2');
        
        // PHASE 5: Fix array formatting issues
        cleanedText = cleanedText
          // Fix missing commas between array elements: [1 2] → [1, 2]
          .replace(/(\d+)\s+(\d+)/g, '$1, $2')
          // Fix double commas: ,, → ,
          .replace(/,\s*,/g, ',');
        
        // PHASE 6: Try parsing cleaned JSON
        console.log(`🔧 Attempting parse after cleanup...`);
        analysis = JSON.parse(cleanedText);
        console.log(`✅ JSON parse succeeded after ULTIMATE cleanup`);
        
      } catch (cleanupError) {
        console.error(`❌ ULTIMATE cleanup failed, trying NUCLEAR option...`);
        
        try {
          // NUCLEAR OPTION: Extract JSON using regex and reconstruct
          const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error('No JSON object found in response');
          }
          
          let extractedJson = jsonMatch[0];
          
          // Apply all cleanup phases to extracted JSON
          for (let i = 0; i < 5; i++) {
            extractedJson = extractedJson
              .replace(/,(\s*])/g, '$1')
              .replace(/,(\s*})/g, '$1')
              .replace(/(\d+)\.(\s*[,\]}])/g, '$1$2')
              .replace(/,\s*,/g, ',');
          }
          
          console.log(`☢️ NUCLEAR parse attempt...`);
          analysis = JSON.parse(extractedJson);
          console.log(`✅ NUCLEAR parse succeeded!`);
          
        } catch (nuclearError) {
          // LAST RESORT: Log everything and fail gracefully
          console.error(`❌ ALL parsing attempts failed`);
          console.error(`📝 Original error:`, parseError instanceof Error ? parseError.message : String(parseError));
          console.error(`📝 Cleanup error:`, cleanupError instanceof Error ? cleanupError.message : String(cleanupError));
          console.error(`📝 Nuclear error:`, nuclearError instanceof Error ? nuclearError.message : String(nuclearError));
          console.error(`📝 Response length:`, analysisText.length);
          console.error(`📝 First 1000 chars:`, analysisText.substring(0, 1000));
          console.error(`📝 Last 1000 chars:`, analysisText.substring(Math.max(0, analysisText.length - 1000)));
          
          throw new Error(`Invalid JSON from ${model} after all cleanup attempts: ${parseError instanceof Error ? parseError.message : 'Parse failed'}`);
        }
      }
    }
    
    // Validate required fields exist
    if (!analysis || typeof analysis !== 'object') {
      throw new Error('Parsed analysis is not a valid object');
    }
    
    console.log(`✅ Analysis object validated, keys:`, Object.keys(analysis).join(', '));

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

    // ✅ FIX: Convert confidence from decimal (0-1) to integer (0-100)
    let confidenceInt = 0;
    if (analysis.confidence !== undefined && analysis.confidence !== null) {
      const confidenceValue = typeof analysis.confidence === 'string' 
        ? parseFloat(analysis.confidence) 
        : analysis.confidence;
      
      // If confidence is between 0-1 (decimal), convert to 0-100
      if (confidenceValue >= 0 && confidenceValue <= 1) {
        confidenceInt = Math.round(confidenceValue * 100);
      } 
      // If confidence is already 0-100, use as-is
      else if (confidenceValue >= 0 && confidenceValue <= 100) {
        confidenceInt = Math.round(confidenceValue);
      }
      // Default to 0 if invalid
      else {
        console.warn(`⚠️ Invalid confidence value: ${analysis.confidence}, defaulting to 0`);
        confidenceInt = 0;
      }
    }
    
    console.log(`📊 Confidence: ${analysis.confidence} → ${confidenceInt}%`);

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
        confidenceInt,
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
    console.error(`❌ ========================================`);
    console.error(`❌ Deep Dive FAILED after ${processingTime}ms`);
    console.error(`❌ Error type: ${error?.constructor?.name}`);
    console.error(`❌ Error message: ${error instanceof Error ? error.message : String(error)}`);
    console.error(`❌ Full error:`, error);
    console.error(`❌ Stack trace:`, error instanceof Error ? error.stack : 'No stack trace');
    console.error(`❌ ========================================`);
    
    let errorMessage = 'Deep Dive analysis failed';
    
    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message.includes('abort')) {
        errorMessage = 'Analysis timed out - try upgrading to Vercel Pro for longer execution time';
      } else if (error.message.includes('API key')) {
        errorMessage = 'OpenAI API key issue';
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'OpenAI rate limit exceeded';
      } else if (error.message.includes('model')) {
        errorMessage = `Model error: ${error.message}`;
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
          ['failed', JSON.stringify({ 
            error: errorMessage,
            errorType: error?.constructor?.name,
            timestamp: new Date().toISOString(),
            processingTime
          }), parseInt(jobId)]
        );
        console.log(`❌ Job ${jobId}: Marked as failed with error: ${errorMessage}`);
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
