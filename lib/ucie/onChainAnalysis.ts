/**
 * On-Chain Data AI Analysis
 * 
 * Provides AI-powered interpretation of blockchain data
 * ✅ UPGRADED: Uses GPT-5.1 with medium reasoning for accurate analysis
 */

import { callOpenAI } from '../openai';

export interface OnChainInsights {
  whaleActivityAnalysis: string;
  exchangeFlowAnalysis: string;
  networkHealthSummary: string;
  keyInsights: string[];
  riskIndicators: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
  };
  tradingImplications: string;
}

/**
 * Analyze Bitcoin on-chain data using AI
 * ✅ UPGRADED: Analysis using GPT-5.1 with medium reasoning (~3-5 seconds)
 */
export async function analyzeOnChainData(
  onChainData: any
): Promise<OnChainInsights> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    // Return basic analysis if no API key
    return generateBasicOnChainInsights(onChainData);
  }

  try {
    // Build context from on-chain data
    const context = buildOnChainContext(onChainData);
    
    const systemPrompt = `You are a blockchain analyst. Analyze Bitcoin on-chain data and provide actionable insights. Return ONLY valid JSON with this structure:
{
  "whaleActivityAnalysis": "2-3 sentence analysis of whale movements",
  "exchangeFlowAnalysis": "2-3 sentence analysis of exchange deposits/withdrawals",
  "networkHealthSummary": "2-3 sentence summary of network health",
  "keyInsights": ["insight 1", "insight 2", "insight 3"],
  "riskIndicators": {
    "level": "low|medium|high",
    "factors": ["factor 1", "factor 2"]
  },
  "tradingImplications": "2-3 sentence trading implications"
}`;

    // ✅ UPGRADED: Use shared OpenAI client with GPT-5.1
    const result = await callOpenAI(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: context }
      ],
      600, // max tokens
      'medium', // reasoning effort (balanced analysis)
      true // request JSON format
    );

    // ✅ BULLETPROOF JSON PARSING: Handle malformed JSON from GPT-5.1
    let insights: OnChainInsights;
    try {
      // Try direct parse first (fast path)
      insights = JSON.parse(result.content);
      console.log(`✅ Direct JSON parse succeeded`);
    } catch (parseError) {
      console.warn(`⚠️ Initial JSON parse failed, engaging cleanup...`);
      
      try {
        // PHASE 1: Basic cleanup
        let cleanedText = result.content.trim();
        
        // PHASE 2: Remove markdown and extra text
        cleanedText = cleanedText
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/\s*```$/i, '')
          .replace(/^[^{]*({)/s, '$1')
          .replace(/(})[^}]*$/s, '$1');
        
        // PHASE 3: Fix trailing commas
        for (let i = 0; i < 5; i++) {
          cleanedText = cleanedText
            .replace(/,(\s*])/g, '$1')
            .replace(/,(\s*})/g, '$1');
        }
        
        // PHASE 4: Fix unterminated strings (common GPT-5.1 issue)
        // Find and close any unterminated strings
        cleanedText = cleanedText.replace(/"([^"]*?)$/gm, '"$1"');
        
        console.log(`🔧 Attempting parse after cleanup...`);
        insights = JSON.parse(cleanedText);
        console.log(`✅ JSON parse succeeded after cleanup`);
        
      } catch (cleanupError) {
        console.error(`❌ Cleanup failed, using fallback insights`);
        console.error(`   Parse error:`, parseError instanceof Error ? parseError.message : String(parseError));
        console.error(`   Response length:`, result.content.length);
        console.error(`   First 500 chars:`, result.content.substring(0, 500));
        return generateBasicOnChainInsights(onChainData);
      }
    }
    
    return insights;

  } catch (error) {
    console.error('AI on-chain analysis failed:', error);
    return generateBasicOnChainInsights(onChainData);
  }
}

/**
 * Build context string from on-chain data
 */
function buildOnChainContext(onChainData: any): string {
  const whale = onChainData.whaleActivity?.summary || {};
  const network = onChainData.networkMetrics || {};
  const mempool = onChainData.mempoolAnalysis || {};

  return `Bitcoin On-Chain Data Analysis:

WHALE ACTIVITY:
- Total Transactions: ${whale.totalTransactions || 0}
- Total Value: $${(whale.totalValueUSD || 0).toLocaleString()} (${whale.totalValueBTC || 0} BTC)
- Exchange Deposits: ${whale.exchangeDeposits || 0} (potential selling pressure)
- Exchange Withdrawals: ${whale.exchangeWithdrawals || 0} (potential accumulation)
- Cold Wallet Movements: ${whale.coldWalletMovements || 0}
- Largest Transaction: $${(whale.largestTransaction || 0).toLocaleString()}

NETWORK HEALTH:
- Hash Rate: ${(network.hashRate || 0).toFixed(2)} TH/s
- Difficulty: ${(network.difficulty || 0).toLocaleString()}
- Block Time: ${network.blockTime || 0} minutes
- Mempool Size: ${(network.mempoolSize || 0).toLocaleString()} transactions
- Mempool Congestion: ${mempool.congestion || 'unknown'}

Analyze this data and provide insights on:
1. What whale movements indicate (accumulation vs distribution)
2. Exchange flow implications (buying vs selling pressure)
3. Network health and security
4. Key risks or opportunities
5. Trading implications`;
}

/**
 * Generate basic insights without AI (fallback)
 */
function generateBasicOnChainInsights(onChainData: any): OnChainInsights {
  const whale = onChainData.whaleActivity?.summary || {};
  const network = onChainData.networkMetrics || {};
  
  const netFlow = (whale.exchangeWithdrawals || 0) - (whale.exchangeDeposits || 0);
  const flowSentiment = netFlow > 0 ? 'bullish (net accumulation)' : netFlow < 0 ? 'bearish (net distribution)' : 'neutral';
  
  return {
    whaleActivityAnalysis: `Detected ${whale.totalTransactions || 0} large transactions totaling $${(whale.totalValueUSD || 0).toLocaleString()}. Net exchange flow is ${flowSentiment}.`,
    exchangeFlowAnalysis: `${whale.exchangeDeposits || 0} deposits to exchanges (selling pressure) vs ${whale.exchangeWithdrawals || 0} withdrawals (accumulation). Net flow: ${netFlow > 0 ? '+' : ''}${netFlow} transactions.`,
    networkHealthSummary: `Network hash rate at ${(network.hashRate || 0).toFixed(2)} TH/s with ${(network.mempoolSize || 0).toLocaleString()} pending transactions. Network is ${network.hashRate > 100 ? 'secure and healthy' : 'operating normally'}.`,
    keyInsights: [
      `${whale.totalTransactions || 0} whale transactions detected`,
      `Net exchange flow: ${flowSentiment}`,
      `Network security: ${network.hashRate > 100 ? 'Strong' : 'Normal'}`
    ],
    riskIndicators: {
      level: whale.exchangeDeposits > whale.exchangeWithdrawals ? 'medium' : 'low',
      factors: whale.exchangeDeposits > whale.exchangeWithdrawals 
        ? ['Increased exchange deposits may indicate selling pressure']
        : ['Exchange withdrawals suggest accumulation']
    },
    tradingImplications: `On-chain data suggests ${flowSentiment} sentiment. ${whale.exchangeWithdrawals > whale.exchangeDeposits ? 'Accumulation pattern may support price.' : 'Monitor for potential selling pressure.'}`
  };
}
