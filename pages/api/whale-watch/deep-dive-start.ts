import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Deep Dive Analysis - Start Job
 * Initiates async Deep Dive analysis and returns job ID immediately
 */

interface DeepDiveStartRequest {
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

interface DeepDiveStartResponse {
  success: boolean;
  jobId?: string;
  status?: string;
  error?: string;
  timestamp: string;
}

// In-memory job store (in production, use Redis or database)
const jobStore = new Map<string, {
  status: 'queued' | 'processing' | 'completed' | 'failed';
  request: DeepDiveStartRequest;
  result?: any;
  error?: string;
  startTime: number;
}>();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DeepDiveStartResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const whale: DeepDiveStartRequest = req.body;
    
    if (!whale.txHash || !whale.fromAddress || !whale.toAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required transaction data',
        timestamp: new Date().toISOString(),
      });
    }

    // Generate unique job ID
    const jobId = `deep-dive-${whale.txHash}-${Date.now()}`;
    
    console.log(`🔬 Starting Deep Dive job: ${jobId}`);
    console.log(`📊 Transaction: ${whale.amount.toFixed(2)} BTC`);

    // Store job in queue
    jobStore.set(jobId, {
      status: 'queued',
      request: whale,
      startTime: Date.now(),
    });

    // Start async processing (don't await)
    processDeepDive(jobId).catch(error => {
      console.error(`❌ Deep Dive job ${jobId} failed:`, error);
      const job = jobStore.get(jobId);
      if (job) {
        job.status = 'failed';
        job.error = error instanceof Error ? error.message : 'Processing failed';
      }
    });

    // Return immediately with job ID
    return res.status(200).json({
      success: true,
      jobId,
      status: 'queued',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Deep Dive start error:', error);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start Deep Dive',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Process Deep Dive analysis asynchronously
 */
async function processDeepDive(jobId: string): Promise<void> {
  const job = jobStore.get(jobId);
  if (!job) {
    throw new Error('Job not found');
  }

  try {
    job.status = 'processing';
    console.log(`🔬 Processing Deep Dive job: ${jobId}`);

    const whale = job.request;

    // Import dependencies dynamically to avoid blocking
    const { fetchDeepDiveData } = await import('../../../utils/blockchainData');
    
    // Step 1: Fetch blockchain data
    console.log('📡 Fetching blockchain data...');
    const deepDiveResult = await fetchDeepDiveData(
      whale.fromAddress,
      whale.toAddress
    );
    
    const deepDiveData = deepDiveResult.data;
    const blockchainDataAvailable = deepDiveResult.success;
    const dataSourceLimitations = deepDiveResult.dataSourceLimitations;

    // Step 2: Get current Bitcoin price
    const currentBtcPrice = await getCurrentBitcoinPrice();
    console.log(`💰 Current BTC price: ${currentBtcPrice.toLocaleString()}`);

    // Step 3: Build prompt
    const prompt = buildDeepDivePrompt(
      whale,
      deepDiveData.sourceAddress,
      deepDiveData.destinationAddress,
      deepDiveData.patterns,
      currentBtcPrice,
      dataSourceLimitations
    );

    // Step 4: Call Gemini 2.5 Pro
    console.log('🤖 Calling Gemini 2.5 Pro...');
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    
    const model = 'gemini-2.0-flash-exp';
    
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.8,
            topK: 64,
            topP: 0.95,
            maxOutputTokens: 32768,
            candidateCount: 1,
            responseMimeType: 'application/json',
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_NONE"
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
              threshold: "BLOCK_NONE"
            }
          ]
        }),
        signal: AbortSignal.timeout(25000), // 25 second timeout for async processing
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorText}`);
    }

    const geminiData = await geminiResponse.json();
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!responseText) {
      throw new Error('No response text from Gemini API');
    }

    // Parse response
    const jsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const analysis = JSON.parse(jsonText);

    // Store result
    job.status = 'completed';
    job.result = {
      analysis,
      blockchainData: blockchainDataAvailable ? {
        sourceAddress: deepDiveData.sourceAddress,
        destinationAddress: deepDiveData.destinationAddress,
        patterns: deepDiveData.patterns,
      } : undefined,
      metadata: {
        model: 'gemini-2.0-flash-exp',
        analysisType: 'deep-dive',
        provider: 'Google Gemini',
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - job.startTime,
        dataSourcesUsed: blockchainDataAvailable 
          ? ['blockchain.com', 'gemini-2.0-flash-exp']
          : ['gemini-2.0-flash-exp'],
        blockchainDataAvailable,
        dataSourceLimitations: dataSourceLimitations.length > 0 ? dataSourceLimitations : undefined,
        blockchainErrors: deepDiveResult.errors.length > 0 ? deepDiveResult.errors : undefined,
      },
    };

    console.log(`✅ Deep Dive job ${jobId} completed in ${Date.now() - job.startTime}ms`);

  } catch (error) {
    console.error(`❌ Deep Dive job ${jobId} failed:`, error);
    job.status = 'failed';
    job.error = error instanceof Error ? error.message : 'Processing failed';
    throw error;
  }
}

/**
 * Fetch current Bitcoin price
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
 * Build Deep Dive prompt
 */
function buildDeepDivePrompt(
  whale: DeepDiveStartRequest,
  sourceData: any,
  destData: any,
  patterns: any,
  currentBtcPrice: number,
  dataSourceLimitations: string[]
): string {
  let prompt = `You are an expert Bitcoin blockchain analyst conducting a DEEP DIVE investigation.

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

DESTINATION ADDRESS ANALYSIS:
- Total Received: ${destData.totalReceived.toFixed(2)} BTC
- Total Sent: ${destData.totalSent.toFixed(2)} BTC
- Current Balance: ${destData.balance.toFixed(2)} BTC
- Transaction Count: ${destData.transactionCount}
- 30-Day Volume: ${destData.volume30Days.toFixed(2)} BTC
- Known Entity: ${destData.knownEntity?.name || 'Unknown'}${destData.knownEntity ? ` (${destData.knownEntity.type})` : ''}

PATTERN DETECTION:
- Accumulation: ${patterns.isAccumulation ? 'YES' : 'NO'}
- Distribution: ${patterns.isDistribution ? 'YES' : 'NO'}
- Mixing: ${patterns.isMixing ? 'YES' : 'NO'}
- Exchange Flow: ${patterns.exchangeFlow}`;

  if (dataSourceLimitations.length > 0) {
    prompt += `\n\n**DATA LIMITATIONS:**
${dataSourceLimitations.map((l, i) => `${i + 1}. ${l}`).join('\n')}

Acknowledge these limitations and adjust confidence accordingly.`;
  }

  prompt += `\n\nProvide comprehensive analysis in JSON format with transaction_type, market_impact, confidence, address_behavior, fund_flow_analysis, historical_patterns, market_prediction, strategic_intelligence, reasoning, key_findings, and trader_action.`;

  return prompt;
}

// Export job store for polling endpoint
export { jobStore };
