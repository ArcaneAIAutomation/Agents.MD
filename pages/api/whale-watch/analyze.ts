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

    // Build Caesar research query
    const query = `
Analyze this Bitcoin whale transaction:

Transaction Details:
- Amount: ${txData.amount.toFixed(2)} BTC ($${(txData.amountUSD / 1000000).toFixed(2)}M)
- Type: ${txData.type}
- Time: ${new Date(txData.timestamp).toLocaleString()}
- From: ${txData.fromAddress.substring(0, 30)}...
- To: ${txData.toAddress.substring(0, 30)}...

Research and answer:
1. Why did this transaction likely happen? (exchange deposit, withdrawal, OTC deal, etc.)
2. What is the probable market impact on Bitcoin price? (bullish, bearish, neutral)
3. Are there any related news events or market conditions?
4. Historical context: What typically happens after similar transactions?
5. Is this part of a larger pattern or trend?

Provide sources for all claims and focus on actionable intelligence for traders.
    `.trim();

    // System prompt for structured output
    const systemPrompt = `
You are formatting research output for crypto traders. Return strict JSON:
{
  "transaction_type": "string (exchange_deposit, exchange_withdrawal, otc_deal, accumulation, distribution)",
  "reasoning": "string (2-3 sentences explaining why)",
  "impact_prediction": "bullish|bearish|neutral",
  "confidence": "number (0-100)",
  "key_findings": ["string", "string", "string"],
  "market_context": "string (current market conditions)",
  "historical_precedent": "string (what happened in similar cases)",
  "trader_action": "string (recommended action for traders)",
  "sources": [{"title": "string", "url": "string"}]
}
    `.trim();

    // Create Caesar research job (2 CU for balanced speed/depth)
    const job = await Caesar.createResearch({
      query,
      compute_units: 2,
      system_prompt: systemPrompt,
    });

    console.log(`✅ Caesar job created: ${job.id}`);

    // Return job ID immediately for polling
    return res.status(200).json({
      success: true,
      jobId: job.id,
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
