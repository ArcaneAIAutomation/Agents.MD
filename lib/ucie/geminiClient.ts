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
  const systemPrompt = `You are a cryptocurrency analyst. Summarize the collected data in a clear, concise format for a user who is about to proceed with deep AI analysis. Focus on:
1. Current market status (price, volume, sentiment)
2. Key technical indicators and trends
3. Notable news or developments
4. Data quality and completeness
5. What the user can expect from the deep analysis

Keep the summary to 3-4 paragraphs, professional but accessible. Use bullet points for key metrics.`;

  const response = await generateGeminiAnalysis(
    systemPrompt,
    contextData,
    1000,
    0.7
  );

  return response.content;
}
