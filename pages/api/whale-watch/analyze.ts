import type { NextApiRequest, NextApiResponse } from 'next';
import { Caesar } from '../../../utils/caesarClient';

/**
 * Whale Watch Analysis API
 * Uses Caesar AI to analyze WHY a whale transaction happened
 */

interface AnalysisRequest {
  txHash: string;
  amount: number;
  amountUSD: number;
  type: string;
  fromAddress: string;
  toAddress: string;
  timestamp: string;
}

interface AnalysisResponse {
  success: boolean;
  jobId?: string;
  analysis?: any;
  error?: string;
  timestamp: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AnalysisResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const txData: AnalysisRequest = req.body;

    if (!txData.txHash || !txData.amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required transaction data',
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`🤖 Analyzing whale transaction: ${txData.txHash.substring(0, 20)}...`);

    // Build Caesar research query with full transaction details
    const blockchainUrl = `https://blockchain.com/btc/tx/${txData.txHash}`;
    const query = `
Analyze this Bitcoin whale transaction and provide actionable trading intelligence:

TRANSACTION DETAILS:
- Transaction Hash: ${txData.txHash}
- Blockchain Explorer: ${blockchainUrl}
- Amount: ${txData.amount.toFixed(2)} BTC (approximately $${(txData.amountUSD / 1000000).toFixed(2)} million USD)
- Transaction Type: ${txData.type}
- Timestamp: ${new Date(txData.timestamp).toLocaleString()} (${txData.timestamp})
- From Address: ${txData.fromAddress}
- To Address: ${txData.toAddress}

RESEARCH OBJECTIVES:
1. Transaction Classification: Why did this transaction happen? (exchange deposit, exchange withdrawal, OTC deal, whale accumulation, whale distribution, cold storage movement)
2. Market Impact Analysis: What is the probable impact on Bitcoin price? (bullish, bearish, or neutral) and why?
3. Current Market Context: Are there any related news events, market conditions, or regulatory developments that might explain this movement?
4. Historical Precedent: What typically happens to Bitcoin price after similar large transactions? Look for patterns in the past 6-12 months.
5. Pattern Recognition: Is this part of a larger trend? Are other whales moving Bitcoin similarly?
6. Exchange Identification: If this involves an exchange, which exchange is it? What does this tell us about market sentiment?

TRADER ACTION REQUIRED:
Based on your analysis, provide a clear recommendation for cryptocurrency traders on how to respond to this whale movement.

Focus on recent, verifiable sources and provide specific, actionable intelligence.
    `.trim();

    // System prompt for structured output - MUST return valid JSON only
    const systemPrompt = `You are a professional cryptocurrency market analyst specializing in whale transaction analysis. 

Analyze the provided Bitcoin whale transaction using the blockchain explorer link and recent market data.

Return ONLY valid JSON (no markdown, no code blocks, no explanatory text - just raw JSON):
{
  "transaction_type": "exchange_deposit|exchange_withdrawal|otc_deal|accumulation|distribution|cold_storage",
  "reasoning": "2-3 sentences explaining why this specific transaction happened based on addresses, timing, and market context",
  "impact_prediction": "bullish|bearish|neutral",
  "confidence": 85,
  "key_findings": ["specific finding 1 with data", "specific finding 2 with data", "specific finding 3 with data"],
  "market_context": "current Bitcoin market conditions and relevant news from the past 24-48 hours",
  "historical_precedent": "what happened to BTC price after similar whale transactions in the past 6 months",
  "exchange_identified": "name of exchange if applicable, or 'unknown'",
  "trader_action": "specific recommended action for traders with entry/exit considerations"
}

Be specific, cite recent data, and focus on actionable intelligence.`.trim();

    // Create Caesar research job (2 CU for balanced speed/depth)
    console.log('📤 Sending request to Caesar API...');
    console.log(`Query length: ${query.length} chars`);
    console.log(`System prompt length: ${systemPrompt.length} chars`);
    
    const job = await Caesar.createResearch({
      query,
      compute_units: 2,
      system_prompt: systemPrompt,
    });

    console.log(`✅ Caesar job created successfully`);
    console.log(`Job ID: ${job.id}`);
    console.log(`Initial status: ${job.status}`);
    console.log(`Full response:`, JSON.stringify(job, null, 2));

    // Return job ID immediately for polling
    return res.status(200).json({
      success: true,
      jobId: job.id,
      status: job.status,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Whale analysis error:', error);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze transaction',
      timestamp: new Date().toISOString(),
    });
  }
}
