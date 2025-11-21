import type { NextApiRequest, NextApiResponse } from 'next';
import { 
  fetchDeepDiveData, 
  type BlockchainAddressData, 
  type TransactionPatterns,
  type DeepDiveDataResult 
} from '../../../utils/blockchainData';
import { callOpenAI } from '../../../lib/openai';

/**
 * Deep Dive ChatGPT 5.1 (Latest) Whale Transaction Analysis API
 * Uses OpenAI's ChatGPT 5.1 (Latest) with blockchain data integration
 * for comprehensive whale transaction analysis
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

interface DeepDiveAnalysisResponse {
  success: boolean;
  analysis?: {
    transaction_type: string;
    market_impact: string;
    confidence: number;
    address_behavior: {
      source_classification: string;
      destination_classification: string;
      source_strategy: string;
      destination_strategy: string;
    };
    fund_flow_analysis: {
      origin_hypothesis: string;
      destination_hypothesis: string;
      mixing_detected: boolean;
      cluster_analysis: string;
    };
    historical_patterns: {
      similar_transactions: string;
      pattern_match: string;
      success_rate: number;
    };
    market_prediction: {
      short_term_24h: string;
      medium_term_7d: string;
      key_price_levels: {
        support: number[];
        resistance: number[];
      };
      probability_further_movement: number;
    };
    strategic_intelligence: {
      intent: string;
      sentiment_indicator: string;
      trader_positioning: string;
      risk_reward_ratio: string;
    };
    reasoning: string;
    key_findings: string[];
    trader_action: string;
  };
  blockchainData?: {
    sourceAddress: BlockchainAddressData;
    destinationAddress: BlockchainAddressData;
    patterns: TransactionPatterns;
  };
  metadata?: {
    model: string;
    analysisType: string;
    provider: string;
    timestamp: string;
    processingTime: number;
    dataSourcesUsed: string[];
    blockchainDataAvailable?: boolean;
    dataSourceLimitations?: string[];
    blockchainErrors?: Array<{
      address: string;
      errorType: string;
      message: string;
    }>;
  };
  error?: string;
  timestamp: string;
}

/**
 * Fetch current Bitcoin price from market data API
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
    return 95000; // Fallback price
  }
}

/**
 * Build enhanced Deep Dive prompt with blockchain context
 */
function buildDeepDivePrompt(
  whale: DeepDiveRequest,
  sourceData: BlockchainAddressData,
  destData: BlockchainAddressData,
  patterns: TransactionPatterns,
  currentBtcPrice: number
): string {
  return `You are an expert Bitcoin blockchain analyst conducting a DEEP DIVE investigation.

PRIMARY TRANSACTION:
- Hash: ${whale.txHash}
- Amount: ${whale.amount.toFixed(2)} BTC ($${whale.amountUSD.toLocaleString()})
- From: ${whale.fromAddress}
- To: ${whale.toAddress}
- Timestamp: ${whale.timestamp}
- Current BTC Price: $${currentBtcPrice.toLocaleString()}

SOURCE ADDRESS ANALYSIS:
- Total Received: ${sourceData.totalReceived.toFixed(2)} BTC
- Total Sent: ${sourceData.totalSent.toFixed(2)} BTC
- Current Balance: ${sourceData.balance.toFixed(2)} BTC
- Transaction Count: ${sourceData.transactionCount}
- 30-Day Volume: ${sourceData.volume30Days.toFixed(2)} BTC
- Known Entity: ${sourceData.knownEntity?.name || 'Unknown'}${sourceData.knownEntity ? ` (${sourceData.knownEntity.type})` : ''}
- Recent Activity:
${sourceData.recentTransactions.slice(0, 5).map((tx, i) => 
  `  ${i+1}. ${tx.type === 'incoming' ? '←' : '→'} ${tx.amount.toFixed(4)} BTC (${new Date(tx.time).toLocaleDateString()})`
).join('\n')}

DESTINATION ADDRESS ANALYSIS:
- Total Received: ${destData.totalReceived.toFixed(2)} BTC
- Total Sent: ${destData.totalSent.toFixed(2)} BTC
- Current Balance: ${destData.balance.toFixed(2)} BTC
- Transaction Count: ${destData.transactionCount}
- 30-Day Volume: ${destData.volume30Days.toFixed(2)} BTC
- Known Entity: ${destData.knownEntity?.name || 'Unknown'}${destData.knownEntity ? ` (${destData.knownEntity.type})` : ''}
- Recent Activity:
${destData.recentTransactions.slice(0, 5).map((tx, i) => 
  `  ${i+1}. ${tx.type === 'incoming' ? '←' : '→'} ${tx.amount.toFixed(4)} BTC (${new Date(tx.time).toLocaleDateString()})`
).join('\n')}

PATTERN DETECTION:
- Accumulation Pattern: ${patterns.isAccumulation ? 'YES' : 'NO'}
- Distribution Pattern: ${patterns.isDistribution ? 'YES' : 'NO'}
- Mixing Behavior: ${patterns.isMixing ? 'YES' : 'NO'}
- Exchange Flow: ${patterns.exchangeFlow}

DEEP DIVE ANALYSIS REQUIRED:

1. **Address Behavior Analysis:**
   - What is the historical behavior of the source address?
   - What is the historical behavior of the destination address?
   - Are these addresses part of a larger wallet cluster?
   - What patterns emerge from the transaction history?

2. **Fund Flow Tracing:**
   - Where did the funds originate before reaching the source address?
   - Where are the funds likely to go after the destination address?
   - Are there any mixing or tumbling patterns?
   - Is this part of a larger fund movement strategy?

3. **Entity Identification:**
   - Are these addresses associated with known exchanges?
   - Are there signs of institutional vs retail behavior?
   - Are there connections to other whale addresses?
   - What does the transaction timing suggest about the entity?

4. **Market Impact Prediction:**
   - Based on historical patterns, what is the likely next move?
   - How have similar patterns affected the market in the past?
   - What are the key price levels to watch?
   - What is the probability of further large movements?

5. **Strategic Intelligence:**
   - What is the strategic intent behind this transaction?
   - Is this accumulation, distribution, or repositioning?
   - What does this tell us about market sentiment?
   - What actionable insights can traders use?

Provide a COMPREHENSIVE analysis in JSON format with:
{
  "transaction_type": "exchange_deposit | exchange_withdrawal | whale_to_whale | institutional_accumulation | distribution | unknown",
  "market_impact": "Bearish | Bullish | Neutral",
  "confidence": number (0-100),
  "address_behavior": {
    "source_classification": "exchange | whale | mixer | retail | institutional",
    "destination_classification": "exchange | whale | mixer | retail | institutional",
    "source_strategy": "string (detailed analysis of source address behavior)",
    "destination_strategy": "string (detailed analysis of destination address behavior)"
  },
  "fund_flow_analysis": {
    "origin_hypothesis": "string (where funds came from)",
    "destination_hypothesis": "string (where funds will go)",
    "mixing_detected": boolean,
    "cluster_analysis": "string (wallet cluster insights)"
  },
  "historical_patterns": {
    "similar_transactions": "string (historical precedents)",
    "pattern_match": "string (pattern type)",
    "success_rate": number (0-100, based on historical outcomes)
  },
  "market_prediction": {
    "short_term_24h": "string (specific prediction)",
    "medium_term_7d": "string (specific prediction)",
    "key_price_levels": {
      "support": [number, number, number],
      "resistance": [number, number, number]
    },
    "probability_further_movement": number (0-100)
  },
  "strategic_intelligence": {
    "intent": "string (strategic intent analysis)",
    "sentiment_indicator": "string (market sentiment)",
    "trader_positioning": "string (how traders should position)",
    "risk_reward_ratio": "string (R:R analysis)"
  },
  "reasoning": "string (comprehensive 3-5 paragraph analysis)",
  "key_findings": ["string", "string", "string", "string", "string", "string", "string"],
  "trader_action": "string (specific, detailed recommendation)"
}

Be extremely thorough and specific. This is a DEEP DIVE - provide insights that go far beyond surface-level analysis.`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DeepDiveAnalysisResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const whale: DeepDiveRequest = req.body;
    
    // Start timing
    const startTime = Date.now();

    console.log(`🔍 Starting Deep Dive analysis for transaction ${whale.txHash}`);
    console.log(`📊 Amount: ${whale.amount.toFixed(2)} BTC`);

    // Step 1: Fetch blockchain data with enhanced error handling
    console.log('📡 Fetching blockchain data...');
    const deepDiveResult = await fetchDeepDiveData(
      whale.fromAddress,
      whale.toAddress
    );
    
    const deepDiveData = deepDiveResult.data;
    const blockchainDataAvailable = deepDiveResult.success;
    const dataSourceLimitations = deepDiveResult.dataSourceLimitations;
    
    // Log any errors or limitations
    if (deepDiveResult.errors.length > 0) {
      console.warn(
        `⚠️ Blockchain data fetch encountered ${deepDiveResult.errors.length} error(s):`,
        deepDiveResult.errors
      );
    }
    
    if (dataSourceLimitations.length > 0) {
      console.warn(
        `⚠️ Data source limitations (${dataSourceLimitations.length}):`,
        dataSourceLimitations
      );
    }

    // Step 2: Get current Bitcoin price
    const currentBtcPrice = await getCurrentBitcoinPrice();
    console.log(`💰 Current BTC price: $${currentBtcPrice.toLocaleString()}`);

    // Step 3: Build enhanced prompt with blockchain context
    let prompt = buildDeepDivePrompt(
      whale,
      deepDiveData.sourceAddress,
      deepDiveData.destinationAddress,
      deepDiveData.patterns,
      currentBtcPrice
    );
    
    // Add data source limitation notice if there are any limitations
    if (dataSourceLimitations.length > 0) {
      prompt += `\n\n**IMPORTANT DATA LIMITATIONS:**
The following data source limitations apply to this analysis:
${dataSourceLimitations.map((limitation, i) => `${i + 1}. ${limitation}`).join('\n')}

Please base your analysis on:
- The transaction details provided
- Available blockchain data (if any)
- General market knowledge and patterns
- Historical precedents for similar-sized transactions
- Current market conditions

Acknowledge these limitations in your analysis and adjust confidence scores accordingly. 
Be transparent about which aspects of the analysis are based on complete data vs. inference.`;
    }

    // Step 4: Call ChatGPT 5.1 (Latest) with extended context and timeout protection
    console.log('🤖 Calling ChatGPT 5.1 (Latest) for Deep Dive analysis...');
    
    // Add JSON format instruction to prompt
    const jsonPrompt = prompt + '\n\nIMPORTANT: Return ONLY valid JSON. Do not include any markdown formatting, code blocks, or explanatory text. Just the raw JSON object.';
    
    // Use ChatGPT 5.1 (Latest) for Deep Dive analysis with REDUCED tokens to avoid timeout
    console.log(`📊 Using model: gpt-5.1 (ChatGPT 5.1 Latest)`);
    
    // Wrap in Promise.race to enforce 50-second timeout (10s buffer before Vercel's 60s limit)
    const openaiResponse = await Promise.race([
      callOpenAI(
        jsonPrompt,
        6000, // REDUCED to 6000 tokens for faster response (avoid 60s timeout)
        'low', // Low reasoning effort for speed
        'medium' // Medium verbosity for balance
      ),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('OpenAI API timeout after 50 seconds')), 50000)
      )
    ]);

    console.log('📡 ChatGPT 5.1 API response received');

    // Extract and parse response
    const responseText = openaiResponse.content;
    
    if (!responseText) {
      throw new Error('No response text from ChatGPT 5.1 API');
    }

    let analysis;
    try {
      // Clean up response text (remove markdown if present)
      const jsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('❌ Failed to parse ChatGPT 5.1 response as JSON:', responseText.substring(0, 500));
      throw new Error('Failed to parse ChatGPT 5.1 Deep Dive response');
    }

    // Calculate processing time
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    console.log(`✅ Deep Dive analysis completed in ${processingTime}ms`);

    return res.status(200).json({
      success: true,
      analysis: analysis,
      blockchainData: blockchainDataAvailable ? {
        sourceAddress: deepDiveData.sourceAddress,
        destinationAddress: deepDiveData.destinationAddress,
        patterns: deepDiveData.patterns,
      } : undefined,
      metadata: {
        model: openaiResponse.model || 'gpt-5.1',
        analysisType: 'deep-dive',
        provider: 'OpenAI ChatGPT 5.1 (Latest)',
        timestamp: new Date().toISOString(),
        processingTime: processingTime,
        dataSourcesUsed: blockchainDataAvailable 
          ? ['blockchain.com', 'chatgpt-5.1']
          : ['chatgpt-5.1'],
        blockchainDataAvailable: blockchainDataAvailable,
        dataSourceLimitations: dataSourceLimitations.length > 0 
          ? dataSourceLimitations 
          : undefined,
        blockchainErrors: deepDiveResult.errors.length > 0 
          ? deepDiveResult.errors 
          : undefined,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Deep Dive analysis error:', error);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to perform Deep Dive analysis',
      timestamp: new Date().toISOString(),
    });
  }
}
