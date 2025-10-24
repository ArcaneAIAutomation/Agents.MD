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

    // Prepare the analysis prompt
    const prompt = `You are a cryptocurrency market analyst. Analyze this Bitcoin whale transaction and provide insights.

Transaction Details:
- Transaction Hash: ${whale.txHash}
- Amount: ${whale.amount.toFixed(2)} BTC ($${whale.amountUSD.toLocaleString()})
- From Address: ${whale.fromAddress}
- To Address: ${whale.toAddress}
- Timestamp: ${whale.timestamp}
- Initial Classification: ${whale.type}
- Description: ${whale.description}

Please analyze this transaction and provide:
1. Transaction Type (exchange_deposit, exchange_withdrawal, whale_to_whale, or unknown)
2. Market Impact (Bearish, Bullish, or Neutral)
3. Confidence Level (0-100)
4. Detailed Reasoning
5. Key Findings (3-5 bullet points)
6. Recommended Trader Action

Return your analysis in the following JSON format:
{
  "transaction_type": "string",
  "market_impact": "string",
  "confidence": number,
  "reasoning": "string",
  "key_findings": ["string"],
  "trader_action": "string"
}`;

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
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('❌ Gemini API error:', geminiResponse.status, errorText);
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
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
    };

    console.log('✅ Gemini analysis completed successfully');

    return res.status(200).json({
      success: true,
      analysis: normalizedAnalysis,
      timestamp: new Date().toISOString(),
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
