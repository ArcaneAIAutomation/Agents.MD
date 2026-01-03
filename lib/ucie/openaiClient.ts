/**
 * OpenAI Client for UCIE Analysis
 * 
 * Provides OpenAI gpt-5-mini (Responses API) integration for cryptocurrency analysis with advanced reasoning
 * Model is configurable via OPENAI_MODEL environment variable
 * Implements fallback chain: gpt-5-mini → gpt-4o-mini
 * 
 * Valid models: gpt-5-mini, o1-mini, o1-preview (Responses API)
 * Fallback: gpt-4o-mini (Chat Completions API)
 * Valid reasoning effort: 'low', 'medium', 'high'
 */

import { openai, callOpenAI, OPENAI_MODEL, OPENAI_FALLBACK_MODEL, OPENAI_TIMEOUT } from '../openai';

// Model configuration (imported from centralized client)
const MODEL = OPENAI_MODEL;
const FALLBACK_MODEL = OPENAI_FALLBACK_MODEL;

// Timeout configuration
const PRIMARY_TIMEOUT = OPENAI_TIMEOUT;
const FALLBACK_TIMEOUT = parseInt(process.env.FALLBACK_TIMEOUT || '30000'); // 30 seconds

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
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[UCIE] Attempting analysis with ${MODEL} (attempt ${attempt}/${retries})...`);
      
      try {
        // Try primary model with Responses API
        // ✅ EINSTEIN FIX: Use 'medium' reasoning for better quality analysis
        // 'low' = 1-2s (too fast, lower quality)
        // 'medium' = 3-5s (balanced, good quality) ← RECOMMENDED
        // 'high' = 5-10s (best quality, slower)
        const result = await Promise.race([
          callOpenAI(
            [
              {
                role: 'user',
                content: `${systemPrompt}\n\n${userPrompt}`
              }
            ],
            maxTokens,
            'medium', // ✅ reasoning effort: 'medium' for balanced speed/quality (3-5s)
            true // request JSON format
          ),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error(`${MODEL} timeout`)), PRIMARY_TIMEOUT)
          )
        ]);

        console.log(`[UCIE] Analysis completed successfully with ${result.model}`);

        return {
          content: result.content,
          tokensUsed: result.tokensUsed,
          model: result.model,
          reasoning: result.reasoning
        };
        
      } catch (primaryError) {
        console.error(`[UCIE] ${MODEL} failed, trying ${FALLBACK_MODEL} fallback:`, primaryError);
        
        // Fallback to secondary model
        const fallbackResult = await Promise.race([
          callOpenAI(
            [
              {
                role: 'system',
                content: systemPrompt
              },
              {
                role: 'user',
                content: userPrompt
              }
            ],
            maxTokens,
            'low', // reasoning effort: use 'low' for faster fallback
            true // request JSON format
          ),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error(`${FALLBACK_MODEL} timeout`)), FALLBACK_TIMEOUT)
          )
        ]);

        console.log(`[UCIE] Analysis completed with ${fallbackResult.model} (fallback)`);

        return {
          content: fallbackResult.content,
          tokensUsed: fallbackResult.tokensUsed,
          model: `${fallbackResult.model} (fallback)`,
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
