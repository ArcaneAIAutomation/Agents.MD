/**
 * Shared OpenAI Client for GPT-5.1 (Responses API)
 * 
 * This is the single source of truth for OpenAI API access across the entire application.
 * All other files must import and use this shared client instance.
 * 
 * Model: gpt-5.1 (default, configurable via OPENAI_MODEL env var)
 * API: Responses API (openai.responses.create)
 * 
 * GPT-5.1 Features:
 * - Reasoning effort: none (default), low, medium, high
 * - Verbosity control: low, medium (default), high
 * - Custom tools, apply_patch, shell tools
 * - Chain of thought (CoT) passing between turns
 */

import OpenAI from 'openai';

// Initialize OpenAI client with API key from environment
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Model configuration
// ✅ FIXED: Using gpt-4o (most capable model available)
export const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';
export const OPENAI_FALLBACK_MODEL = process.env.OPENAI_FALLBACK_MODEL || 'gpt-4o-mini';

// Reasoning effort configuration (kept for compatibility)
// Options: "none" (default, fastest), "low", "medium", "high" (most thorough)
export const REASONING_EFFORT = process.env.REASONING_EFFORT || 'none';

// Verbosity configuration (kept for compatibility)
// Options: "low" (concise), "medium" (default), "high" (detailed)
export const VERBOSITY = process.env.VERBOSITY || 'medium';

// Timeout configuration
// ✅ EXTENDED: 30 minutes for deep analysis (was 120 seconds)
export const OPENAI_TIMEOUT = parseInt(process.env.OPENAI_TIMEOUT || '1800000'); // 30 minutes (1800 seconds)

/**
 * Helper function to call OpenAI GPT-4o via Chat Completions API
 * ✅ FIXED: Using standard Chat Completions API instead of Responses API
 * 
 * @param input - String or array of message objects
 * @param maxOutputTokens - Maximum tokens for completion
 * @param reasoningEffort - Reasoning effort (ignored, for compatibility)
 * @param verbosity - Output verbosity (ignored, for compatibility)
 * @returns Response object with content, tokens used, and model info
 */
export async function callOpenAI(
  input: string | Array<{ role: string; content: string }>,
  maxOutputTokens: number = 4000,
  reasoningEffort?: 'none' | 'low' | 'medium' | 'high',
  verbosity?: 'low' | 'medium' | 'high'
) {
  console.log(`[OpenAI] Calling gpt-4o via Chat Completions API...`);
  
  try {
    // Convert input to messages format
    let messages: Array<{ role: string; content: string }>;
    if (typeof input === 'string') {
      messages = [{ role: 'user', content: input }];
    } else {
      messages = input;
    }
    
    // ✅ FIXED: Use standard Chat Completions API with gpt-4o
    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // Use gpt-4o (most capable model available)
      messages: messages,
      max_tokens: maxOutputTokens,
      temperature: 0.7,
      response_format: { type: 'json_object' }, // Request JSON response
    });
    
    const content = response.choices[0]?.message?.content || '';
    
    console.log(`[OpenAI] Response received from ${response.model}`);
    
    return {
      content,
      tokensUsed: response.usage?.total_tokens || 0,
      model: response.model,
      reasoning: undefined,
      responseId: response.id,
    };
  } catch (error: any) {
    console.error(`[OpenAI] Error calling gpt-4o:`, error.message);
    
    // If model not found or quota error, try gpt-4o-mini fallback
    if (error.message?.includes('model') || error.message?.includes('quota') || error.status === 404) {
      console.log(`[OpenAI] Trying fallback model: gpt-4o-mini`);
      
      // Convert input to messages format
      let messages: Array<{ role: string; content: string }>;
      if (typeof input === 'string') {
        messages = [{ role: 'user', content: input }];
      } else {
        messages = input;
      }
      
      const fallbackResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: maxOutputTokens,
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });
      
      const content = fallbackResponse.choices[0]?.message?.content || '';
      
      console.log(`[OpenAI] Fallback response received from ${fallbackResponse.model}`);
      
      return {
        content,
        tokensUsed: fallbackResponse.usage?.total_tokens || 0,
        model: `${fallbackResponse.model} (fallback)`,
        reasoning: undefined,
        responseId: fallbackResponse.id,
      };
    }
    
    throw error;
  }
}

/**
 * Legacy compatibility function for chat completions
 * Wraps the new Responses API to maintain backward compatibility
 * 
 * @deprecated Use callOpenAI() instead for new code
 */
export async function createChatCompletion(
  messages: Array<{ role: string; content: string }>,
  maxTokens: number = 4000,
  temperature?: number
) {
  console.warn('[OpenAI] Using legacy createChatCompletion wrapper - consider migrating to callOpenAI()');
  // Note: temperature parameter is ignored in GPT-5.1 Responses API
  // Use reasoning_effort and verbosity instead
  return callOpenAI(messages, maxTokens, undefined, undefined);
}
