import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Gemini AI Whale Transaction Analysis API
 * Uses Google's Gemini 2.5 Pro for whale transaction analysis
 */

interface GeminiAnalysisRequest {
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

interface GeminiAnalysisResponse {
  success: boolean;
  analysis?: {
    transaction_type: string;
    market_impact: string;
    confidence: number;
    reasoning: string;
    key_findings: string[];
    trader_action: string;
  };
  error?: string;
  timestamp: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GeminiAnalysisResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const whale: GeminiAnalysisRequest = req.body;

    console.log(`🤖 Starting Gemini AI analysis for transaction ${whale.txHash}`);
    console.log(`📋 Whale data:`, JSON.stringify(whale, null, 2));

    // Prepare the deep analysis prompt
    const prompt = `You are an expert cryptocurrency market analyst with deep knowledge of Bitcoin whale behavior, market psychology, and on-chain analytics. Conduct a comprehensive analysis of this Bitcoin whale transaction.

Transaction Details:
- Transaction Hash: ${whale.txHash}
- Amount: ${whale.amount.toFixed(2)} BTC ($${whale.amountUSD.toLocaleString()})
- From Address: ${whale.fromAddress}
- To Address: ${whale.toAddress}
- Timestamp: ${whale.timestamp}
- Initial Classification: ${whale.type}
- Description: ${whale.description}

Conduct a DEEP ANALYSIS considering:

1. **Transaction Pattern Analysis:**
   - Is this address known for specific behavior patterns?
   - What does the transaction size relative to current market conditions suggest?
   - Are there any timing patterns (market hours, price levels)?

2. **Market Context:**
   - Current Bitcoin market sentiment and price action
   - Recent whale activity trends
   - Exchange flow patterns (deposits vs withdrawals)
   - Historical precedents for similar-sized transactions

3. **Behavioral Psychology:**
   - What might motivate this transaction at this specific time?
   - Is this likely accumulation, distribution, or repositioning?
   - What does the address history suggest about the holder's strategy?

4. **Risk Assessment:**
   - Potential market impact in the short term (24-48 hours)
   - Medium-term implications (1-2 weeks)
   - Key price levels to watch

5. **Trading Intelligence:**
   - Specific actionable insights for traders
   - Risk management recommendations
   - Entry/exit considerations

Provide your analysis in the following JSON format with DETAILED, SPECIFIC insights:
{
  "transaction_type": "exchange_deposit | exchange_withdrawal | whale_to_whale | unknown",
  "market_impact": "Bearish | Bullish | Neutral",
  "confidence": number (0-100, be realistic based on available data),
  "reasoning": "string (2-3 detailed paragraphs explaining your analysis with specific details)",
  "key_findings": [
    "string (specific, actionable finding)",
    "string (specific, actionable finding)",
    "string (specific, actionable finding)",
    "string (specific, actionable finding)",
    "string (specific, actionable finding)"
  ],
  "trader_action": "string (specific, actionable recommendation with price levels or conditions)"
}

Be thorough, specific, and provide actionable intelligence. Avoid generic statements.`;

    // Call Gemini API
    const geminiApiKey = process.env.GEMINI_API_KEY || 'AIzaSyAvGqzDvYiaaDOMFDNiNlxMziO0zYIE3no';
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
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
            temperature: 0.8,        // Higher for more creative, detailed analysis
            topK: 64,                // Increased for more diverse token selection
            topP: 0.95,
            maxOutputTokens: 4096,   // Doubled for more detailed responses
            candidateCount: 1,
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
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('❌ Gemini API error:', geminiResponse.status, errorText);
      console.error('❌ API Key used:', geminiApiKey ? `${geminiApiKey.substring(0, 20)}...` : 'MISSING');
      throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorText}`);
    }

    const geminiData = await geminiResponse.json();
    console.log('📡 Gemini API response received');

    // Extract the text response
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!responseText) {
      throw new Error('No response text from Gemini API');
    }

    // Parse JSON from response (handle markdown code blocks)
    let analysis;
    try {
      // Remove markdown code blocks if present
      const jsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('❌ Failed to parse Gemini response as JSON:', responseText);
      throw new Error('Failed to parse Gemini analysis response');
    }

    // Validate and normalize the analysis
    const normalizedAnalysis = {
      transaction_type: analysis.transaction_type || 'unknown',
      market_impact: analysis.market_impact || 'Neutral',
      confidence: Math.min(100, Math.max(0, analysis.confidence || 75)),
      reasoning: analysis.reasoning || 'Analysis completed',
      key_findings: Array.isArray(analysis.key_findings) ? analysis.key_findings : [],
      trader_action: analysis.trader_action || 'Monitor the situation',
      // Add Gemini metadata
      provider: 'Gemini 2.5 Pro',
      model: 'gemini-2.0-flash-exp',
      analysis_type: 'Deep Market Intelligence',
      processing_time: '< 3 seconds',
    };

    console.log('✅ Gemini 2.5 Pro analysis completed successfully');

    return res.status(200).json({
      success: true,
      analysis: normalizedAnalysis,
      timestamp: new Date().toISOString(),
      provider: 'Gemini 2.5 Pro',
      model: 'gemini-2.0-flash-exp',
    });

  } catch (error) {
    console.error('❌ Gemini analysis error:', error);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze transaction with Gemini',
      timestamp: new Date().toISOString(),
    });
  }
}
