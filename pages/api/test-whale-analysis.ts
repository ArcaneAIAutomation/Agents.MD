import type { NextApiRequest, NextApiResponse } from 'next';
import { Caesar } from '../../utils/caesarClient';

/**
 * Test endpoint to verify Caesar API works with whale transaction data
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log('🧪 Testing Caesar API with whale transaction data...');
    
    // Sample whale transaction data (real transaction)
    const testTransaction = {
      txHash: 'bc1qgdjqv0av3q56jvd82tkdjpy7gdp9ut8tlqmgrpmv24sq90ecnvqqjwvw97',
      amount: 143.11,
      amountUSD: 17730000,
      type: 'unknown',
      fromAddress: 'bc1qx5krplewc8w6860xj',
      toAddress: 'bc1quj34a1vv2tgkh3wr',
      timestamp: new Date().toISOString()
    };

    const blockchainUrl = `https://blockchain.com/btc/tx/${testTransaction.txHash}`;
    
    // Build the same query we use in production
    const query = `
Analyze this Bitcoin whale transaction and provide actionable trading intelligence:

TRANSACTION DETAILS:
- Transaction Hash: ${testTransaction.txHash}
- Blockchain Explorer: ${blockchainUrl}
- Amount: ${testTransaction.amount.toFixed(2)} BTC (approximately $${(testTransaction.amountUSD / 1000000).toFixed(2)} million USD)
- Transaction Type: ${testTransaction.type}
- Timestamp: ${new Date(testTransaction.timestamp).toLocaleString()} (${testTransaction.timestamp})
- From Address: ${testTransaction.fromAddress}
- To Address: ${testTransaction.toAddress}

RESEARCH OBJECTIVES:
1. Transaction Classification: Why did this transaction happen?
2. Market Impact Analysis: What is the probable impact on Bitcoin price?
3. Current Market Context: Any related news events or market conditions?
4. Historical Precedent: What typically happens after similar large transactions?
5. Pattern Recognition: Is this part of a larger trend?
6. Exchange Identification: If this involves an exchange, which one?

TRADER ACTION REQUIRED:
Provide a clear recommendation for cryptocurrency traders.

Focus on recent, verifiable sources and provide specific, actionable intelligence.
    `.trim();

    const systemPrompt = `You are a professional cryptocurrency market analyst specializing in whale transaction analysis. 

Analyze the provided Bitcoin whale transaction using the blockchain explorer link and recent market data.

Return ONLY valid JSON (no markdown, no code blocks, no explanatory text - just raw JSON):
{
  "transaction_type": "exchange_deposit|exchange_withdrawal|otc_deal|accumulation|distribution|cold_storage",
  "reasoning": "2-3 sentences explaining why this specific transaction happened",
  "impact_prediction": "bullish|bearish|neutral",
  "confidence": 85,
  "key_findings": ["finding 1", "finding 2", "finding 3"],
  "market_context": "current Bitcoin market conditions",
  "historical_precedent": "what happened after similar transactions",
  "exchange_identified": "name of exchange or 'unknown'",
  "trader_action": "specific recommended action for traders"
}

Be specific and focus on actionable intelligence.`.trim();

    console.log('📝 Creating Caesar research job...');
    console.log(`Query length: ${query.length} chars`);
    console.log(`System prompt length: ${systemPrompt.length} chars`);
    
    const job = await Caesar.createResearch({
      query,
      compute_units: 2,
      system_prompt: systemPrompt,
    });
    
    console.log('✅ Job created:', JSON.stringify(job, null, 2));
    
    // Poll for completion (max 3 minutes for test)
    console.log('⏳ Polling for completion (max 3 minutes)...');
    let attempts = 0;
    const maxAttempts = 90; // 3 minutes
    let finalJob = null;
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
      
      const currentJob = await Caesar.getResearch(job.id);
      console.log(`Attempt ${attempts}/${maxAttempts}: status = ${currentJob.status}`);
      
      if (currentJob.status === 'completed') {
        finalJob = currentJob;
        console.log('✅ Job completed!');
        break;
      }
      
      if (currentJob.status === 'failed' || currentJob.status === 'cancelled' || currentJob.status === 'expired') {
        throw new Error(`Job ${currentJob.status}`);
      }
    }
    
    if (!finalJob) {
      return res.status(200).json({
        success: false,
        message: 'Job still processing after 3 minutes',
        jobId: job.id,
        status: 'timeout',
        attempts: attempts
      });
    }
    
    // Parse the analysis
    let analysis = null;
    if (finalJob.transformed_content) {
      try {
        analysis = JSON.parse(finalJob.transformed_content);
        console.log('✅ Successfully parsed analysis JSON');
      } catch (parseError) {
        console.error('❌ Failed to parse JSON:', parseError);
        analysis = {
          error: 'Failed to parse JSON',
          raw: finalJob.transformed_content?.substring(0, 500)
        };
      }
    }
    
    return res.status(200).json({
      success: true,
      message: 'Caesar API test completed successfully',
      jobId: job.id,
      status: finalJob.status,
      attempts: attempts,
      timeElapsed: `${attempts * 2} seconds`,
      hasContent: !!finalJob.content,
      hasTransformedContent: !!finalJob.transformed_content,
      analysis: analysis,
      sources: finalJob.results?.length || 0,
      sourcesList: finalJob.results?.slice(0, 3).map(r => ({
        title: r.title,
        url: r.url,
        score: r.score
      }))
    });
    
  } catch (error) {
    console.error('❌ Caesar API test failed:', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}
