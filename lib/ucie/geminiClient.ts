/**
 * Gemini AI Client for UCIE
 * 
 * Provides Gemini 2.5 Pro integration for cryptocurrency analysis
 */

export interface GeminiResponse {
  content: string;
  tokensUsed: number;
  model: string;
}

/**
 * Generate analysis using Gemini 2.5 Pro
 */
export async function generateGeminiAnalysis(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 1000,
  temperature: number = 0.7
): Promise<GeminiResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  const prompt = `${systemPrompt}\n\n${userPrompt}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: temperature,
          maxOutputTokens: maxTokens,
          topP: 0.95,
          topK: 40
        }
      }),
      signal: AbortSignal.timeout(120000) // 120 second timeout
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
    throw new Error('Invalid Gemini API response structure');
  }

  const content = data.candidates[0].content.parts[0].text;
  const tokensUsed = data.usageMetadata?.totalTokenCount || 0;

  return {
    content,
    tokensUsed,
    model: 'gemini-2.5-pro'
  };
}

/**
 * Generate cryptocurrency market summary using Gemini 2.5 Pro
 */
export async function generateCryptoSummary(
  symbol: string,
  contextData: string
): Promise<string> {
  const systemPrompt = `You are a professional cryptocurrency analyst. Provide a comprehensive, data-driven analysis (~1500-2000 words) of ${symbol} based on the provided data. 

Structure your analysis with these sections:

1. EXECUTIVE SUMMARY (200-250 words)
   - Current market position and key metrics
   - Overall sentiment and trend direction
   - Critical insights at a glance
   - Key takeaways for traders and investors

2. MARKET ANALYSIS (300-400 words)
   - Current price action and recent movements
   - 24-hour, 7-day, and 30-day performance
   - Market cap and volume analysis
   - Comparison to major cryptocurrencies
   - Trading patterns and liquidity
   - Price spread across exchanges

3. TECHNICAL ANALYSIS (300-400 words)
   - Key technical indicators (RSI, MACD, EMAs, Bollinger Bands)
   - Support and resistance levels
   - Trend analysis and momentum
   - Chart patterns and signals
   - Short-term and medium-term outlook
   - Volume analysis and confirmation

4. SOCIAL SENTIMENT & COMMUNITY (250-300 words)
   - Overall sentiment score and trend
   - Social media activity and mentions
   - Community engagement levels
   - Influencer sentiment
   - Notable discussions or concerns
   - Sentiment distribution (bullish/bearish/neutral)

5. NEWS & DEVELOPMENTS (200-250 words)
   - Recent news and announcements
   - Market-moving events
   - Regulatory developments
   - Partnership or technology updates
   - Industry context and implications

6. ON-CHAIN & FUNDAMENTALS (200-250 words)
   - On-chain metrics and activity
   - Network health indicators
   - Whale transaction analysis
   - Exchange flow patterns
   - Holder behavior and distribution

7. RISK ASSESSMENT & OUTLOOK (150-200 words)
   - Key risks and concerns
   - Volatility analysis
   - Market risks
   - Regulatory or technical risks
   - Overall market outlook and recommendations

Use ONLY the data provided. Be specific with numbers, percentages, and concrete data points. Provide actionable insights and clear explanations. Format as a professional, detailed analysis report covering ALL available data sources.`;

  const response = await generateGeminiAnalysis(
    systemPrompt,
    contextData,
    8192,  // ✅ INCREASED from 1000 to 8192 for comprehensive analysis
    0.7
  );

  return response.content;
}
