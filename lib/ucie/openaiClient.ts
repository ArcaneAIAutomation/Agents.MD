/**
 * OpenAI Client for UCIE Analysis
 * 
 * Provides OpenAI GPT-4o integration for cryptocurrency analysis
 * Replaces Gemini due to 503 overload errors
 */

export interface OpenAIResponse {
  content: string;
  tokensUsed: number;
  model: string;
}

/**
 * Generate cryptocurrency analysis using OpenAI GPT-4o
 */
export async function generateOpenAIAnalysis(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 4000,
  temperature: number = 0.7,
  retries: number = 3
): Promise<OpenAIResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o', // Latest OpenAI model
            messages: [
              {
                role: 'system',
                content: systemPrompt
              },
              {
                role: 'user',
                content: userPrompt
              }
            ],
            max_tokens: maxTokens,
            temperature: temperature,
            top_p: 0.95
          }),
          signal: AbortSignal.timeout(120000) // 120 second timeout
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(`OpenAI API error: ${response.status} - ${errorText}`);
        
        // Retry on 429 (rate limit) or 503 (service unavailable)
        if (response.status === 429 || response.status === 503) {
          console.log(`⚠️  OpenAI API ${response.status} error (attempt ${attempt}/${retries}), retrying in ${attempt * 2}s...`);
          lastError = error;
          await new Promise(resolve => setTimeout(resolve, attempt * 2000)); // Exponential backoff
          continue;
        }
        
        throw error;
      }

      // Success - parse and return
      const data = await response.json();

      // Debug logging
      console.log('OpenAI API response structure:', JSON.stringify(data, null, 2).substring(0, 500));

      if (!data.choices || !data.choices[0]) {
        throw new Error(`Invalid OpenAI API response: missing choices. Response: ${JSON.stringify(data)}`);
      }

      if (!data.choices[0].message) {
        throw new Error(`Invalid OpenAI API response: missing message. Response: ${JSON.stringify(data)}`);
      }

      const content = data.choices[0].message.content;
      const tokensUsed = data.usage?.total_tokens || 0;

      return {
        content,
        tokensUsed,
        model: 'gpt-4o'
      };
      
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on non-retryable errors
      if (!error.message.includes('429') && !error.message.includes('503')) {
        throw error;
      }
      
      if (attempt < retries) {
        console.log(`⚠️  OpenAI API error (attempt ${attempt}/${retries}), retrying in ${attempt * 2}s...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 2000));
      }
    }
  }

  throw lastError || new Error('OpenAI API failed after retries');
}

/**
 * Generate crypto summary using OpenAI (legacy function for compatibility)
 */
export async function generateCryptoSummary(
  symbol: string,
  context: string
): Promise<string> {
  const systemPrompt = `You are a professional cryptocurrency analyst. Provide a comprehensive analysis of ${symbol}.`;
  
  const response = await generateOpenAIAnalysis(
    systemPrompt,
    context,
    4000, // 4000 tokens (faster than Gemini's 8192)
    0.7
  );
  
  return response.content;
}
