/**
 * OpenAI Client for UCIE Analysis
 * 
 * Provides OpenAI o1-mini (ChatGPT-5.1) integration for cryptocurrency analysis with advanced reasoning
 * Model is configurable via OPENAI_MODEL environment variable
 * Implements fallback chain: o1-mini → gpt-4o
 * Supports o1-preview for complex market anomaly detection
 */

// OpenAI o1 model configuration (ChatGPT-5.1)
// Primary: o1-mini for efficient reasoning-based crypto analysis
// Complex: o1-preview for anomaly detection and complex market conditions
// Fallback: gpt-4o for speed when o1 models timeout
const MODEL = process.env.OPENAI_MODEL || 'o1-mini';
const COMPLEX_MODEL = process.env.OPENAI_COMPLEX_MODEL || 'o1-preview';
const FALLBACK_MODEL = process.env.OPENAI_FALLBACK_MODEL || 'gpt-4o';

// Timeout configuration for o1 models
const O1_TIMEOUT = parseInt(process.env.O1_TIMEOUT || '120000'); // 120 seconds
const GPT4O_TIMEOUT = parseInt(process.env.GPT4O_TIMEOUT || '30000'); // 30 seconds

export interface OpenAIResponse {
  content: string;
  tokensUsed: number;
  model: string;
  reasoning?: string; // o1 models may provide reasoning chain
}

/**
 * Generate cryptocurrency analysis using OpenAI o1 models (ChatGPT-5.1)
 * Model is configurable via OPENAI_MODEL environment variable
 * Implements fallback chain: o1-mini → gpt-4o
 * Supports o1-preview for complex analysis via useComplexModel parameter
 */
export async function generateOpenAIAnalysis(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 4000,
  temperature: number = 0.7,
  retries: number = 3,
  useComplexModel: boolean = false
): Promise<OpenAIResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  let lastError: Error | null = null;
  const selectedModel = useComplexModel ? COMPLEX_MODEL : MODEL;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Try o1 models first (o1-mini or o1-preview)
      console.log(`[UCIE] Attempting analysis with ${selectedModel} (attempt ${attempt}/${retries})...`);
      
      try {
        const response = await fetch(
          'https://api.openai.com/v1/responses',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: selectedModel,
              input: [
                {
                  role: 'user',
                  content: `${systemPrompt}\n\n${userPrompt}`
                }
              ],
              max_output_tokens: maxTokens
              // Note: o1 models don't support temperature or top_p
            }),
            signal: AbortSignal.timeout(O1_TIMEOUT)
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`o1 API error: ${response.status} - ${errorText}`);
        }

        // Success - parse and return
        const data = await response.json();

        if (!data.choices || !data.choices[0]) {
          throw new Error(`Invalid o1 API response: missing choices`);
        }

        if (!data.choices[0].message) {
          throw new Error(`Invalid o1 API response: missing message`);
        }

        const content = data.choices[0].message.content;
        const reasoning = data.choices[0].message.reasoning || undefined;
        const tokensUsed = data.usage?.total_tokens || 0;
        const modelUsed = data.model || selectedModel;

        console.log(`[UCIE] Analysis completed successfully with ${modelUsed}`);

        return {
          content,
          tokensUsed,
          model: modelUsed,
          reasoning
        };
        
      } catch (o1Error) {
        console.error(`[UCIE] ${selectedModel} failed, trying gpt-4o fallback:`, o1Error);
        
        // Fallback to gpt-4o
        const response = await fetch(
          'https://api.openai.com/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: FALLBACK_MODEL,
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
            signal: AbortSignal.timeout(GPT4O_TIMEOUT)
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          const error = new Error(`GPT-4o API error: ${response.status} - ${errorText}`);
          
          // Retry on 429 (rate limit) or 503 (service unavailable)
          if (response.status === 429 || response.status === 503) {
            console.log(`⚠️  GPT-4o API ${response.status} error (attempt ${attempt}/${retries}), retrying in ${attempt * 2}s...`);
            lastError = error;
            await new Promise(resolve => setTimeout(resolve, attempt * 2000));
            continue;
          }
          
          throw error;
        }

        // Success with fallback
        const data = await response.json();

        if (!data.choices || !data.choices[0]) {
          throw new Error(`Invalid GPT-4o API response: missing choices`);
        }

        if (!data.choices[0].message) {
          throw new Error(`Invalid GPT-4o API response: missing message`);
        }

        const content = data.choices[0].message.content;
        const tokensUsed = data.usage?.total_tokens || 0;
        const modelUsed = data.model || FALLBACK_MODEL;

        console.log(`[UCIE] Analysis completed with ${modelUsed} (fallback)`);

        return {
          content,
          tokensUsed,
          model: `${modelUsed} (fallback)`,
          reasoning: undefined
        };
      }
      
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on non-retryable errors
      if (!error.message.includes('429') && !error.message.includes('503') && !error.message.includes('timeout')) {
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
