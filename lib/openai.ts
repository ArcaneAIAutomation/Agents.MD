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
// GPT-5.1 is the latest reasoning model (replaces GPT-5, o3, o4-mini)
export const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-5.1';
export const OPENAI_FALLBACK_MODEL = process.env.OPENAI_FALLBACK_MODEL || 'gpt-5-mini';

// Reasoning effort configuration
// Options: "none" (default, fastest), "low", "medium", "high" (most thorough)
export const REASONING_EFFORT = process.env.REASONING_EFFORT || 'none';

// Verbosity configuration
// Options: "low" (concise), "medium" (default), "high" (detailed)
export const VERBOSITY = process.env.VERBOSITY || 'medium';

// Timeout configuration
export const OPENAI_TIMEOUT = parseInt(process.env.OPENAI_TIMEOUT || '120000'); // 120 seconds

/**
 * Helper function to call OpenAI GPT-5.1 via Responses API
 * 
 * @param input - String or array of message objects
 * @param maxOutputTokens - Maximum tokens for completion
 * @param reasoningEffort - Reasoning effort: "none" (default), "low", "medium", "high"
 * @param verbosity - Output verbosity: "low", "medium" (default), "high"
 * @returns Response object with content, tokens used, and model info
 */
export async function callOpenAI(
  input: string | Array<{ role: string; content: string }>,
  maxOutputTokens: number = 4000,
  reasoningEffort?: 'none' | 'low' | 'medium' | 'high',
  verbosity?: 'low' | 'medium' | 'high'
) {
  console.log(`[OpenAI] Calling ${OPENAI_MODEL} via Responses API...`);
  
  try {
    const requestBody: any = {
      model: OPENAI_MODEL,
      input: input,
      max_output_tokens: maxOutputTokens,
    };
    
    // Add reasoning effort (default: none for fastest response)
    const effort = reasoningEffort || REASONING_EFFORT;
    if (effort && effort !== 'none') {
      requestBody.reasoning = { effort };
    }
    
    // Add verbosity control (default: medium)
    const verb = verbosity || VERBOSITY;
    if (verb && verb !== 'medium') {
      requestBody.text = { verbosity: verb };
    }
    
    const response = await openai.responses.create(requestBody);
    
    // Extract content from Responses API format
    let content = '';
    let reasoning_text = '';
    
    // Parse output array
    if (response.output && response.output.length > 0) {
      for (const item of response.output) {
        if (item.type === 'reasoning') {
          // Chain of thought reasoning
          reasoning_text = item.reasoning?.content || '';
        } else if (item.type === 'message') {
          // Actual response message
          const messageContent = item.message?.content;
          if (Array.isArray(messageContent)) {
            for (const part of messageContent) {
              if (part.type === 'output_text') {
                content += part.output_text?.content || '';
              }
            }
          }
        }
      }
    }
    
    console.log(`[OpenAI] Response received from ${response.model || OPENAI_MODEL}`);
    
    return {
      content,
      tokensUsed: response.usage?.total_tokens || 0,
      model: response.model || OPENAI_MODEL,
      reasoning: reasoning_text || undefined,
      responseId: response.id, // For passing CoT between turns
    };
  } catch (error: any) {
    console.error(`[OpenAI] Error calling ${OPENAI_MODEL}:`, error.message);
    
    // If model not found or quota error, try fallback
    if (error.message?.includes('model') || error.message?.includes('quota') || error.status === 404) {
      console.log(`[OpenAI] Trying fallback model: ${OPENAI_FALLBACK_MODEL}`);
      
      const fallbackResponse = await openai.responses.create({
        model: OPENAI_FALLBACK_MODEL,
        input: input,
        max_output_tokens: maxOutputTokens,
      });
      
      // Extract content from fallback response
      let content = '';
      if (fallbackResponse.output && fallbackResponse.output.length > 0) {
        for (const item of fallbackResponse.output) {
          if (item.type === 'message') {
            const messageContent = item.message?.content;
            if (Array.isArray(messageContent)) {
              for (const part of messageContent) {
                if (part.type === 'output_text') {
                  content += part.output_text?.content || '';
                }
              }
            }
          }
        }
      }
      
      console.log(`[OpenAI] Fallback response received from ${fallbackResponse.model || OPENAI_FALLBACK_MODEL}`);
      
      return {
        content,
        tokensUsed: fallbackResponse.usage?.total_tokens || 0,
        model: `${fallbackResponse.model || OPENAI_FALLBACK_MODEL} (fallback)`,
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
