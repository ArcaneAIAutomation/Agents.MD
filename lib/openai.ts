/**
 * Shared OpenAI Client for GPT-5.1 (Responses API)
 * 
 * This is the single source of truth for OpenAI API access across the entire application.
 * All other files must import and use this shared client instance.
 * 
 * Model: gpt-5.1 (default, configurable via OPENAI_MODEL env var)
 * API: Responses API with bulletproof parsing
 * 
 * GPT-5.1 Features:
 * - Enhanced reasoning with effort levels: low, medium, high
 * - Bulletproof response parsing via utility functions
 * - Better analysis quality than GPT-4o
 * - Production-proven in Whale Watch
 * 
 * MIGRATION NOTE (Jan 27, 2025):
 * - Upgraded from gpt-4o to gpt-5.1
 * - Added bulletproof response parsing
 * - See: GPT-5.1-MIGRATION-GUIDE.md
 */

import OpenAI from 'openai';

// Initialize OpenAI client with Responses API header
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  defaultHeaders: {
    'OpenAI-Beta': 'responses=v1'
  }
});

// Model configuration
// ✅ UPGRADED: Using gpt-5.1 (enhanced reasoning, better analysis)
export const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-5.1';
export const OPENAI_FALLBACK_MODEL = process.env.OPENAI_FALLBACK_MODEL || 'gpt-4o';

// Reasoning effort configuration
// Options: "low" (1-2s), "medium" (3-5s), "high" (5-10s)
export const REASONING_EFFORT = (process.env.REASONING_EFFORT || 'medium') as 'low' | 'medium' | 'high';

// Timeout configuration
// ✅ EXTENDED: 30 minutes for deep analysis
export const OPENAI_TIMEOUT = parseInt(process.env.OPENAI_TIMEOUT || '1800000'); // 30 minutes (1800 seconds)

// Import bulletproof utility functions
import { extractResponseText, validateResponseText } from '../utils/openai';

/**
 * Helper function to call OpenAI GPT-5.1 with bulletproof response parsing
 * ✅ UPGRADED: Using GPT-5.1 with Responses API and bulletproof parsing
 * 
 * @param input - String or array of message objects
 * @param maxOutputTokens - Maximum tokens for completion
 * @param reasoningEffort - Reasoning effort: 'low', 'medium', 'high'
 * @param requestJsonFormat - Whether to request JSON format response
 * @returns Response object with content, tokens used, and model info
 */
export async function callOpenAI(
  input: string | Array<{ role: string; content: string }>,
  maxOutputTokens: number = 8000, // GPT-5.1 supports larger outputs
  reasoningEffort?: 'low' | 'medium' | 'high',
  requestJsonFormat: boolean = true
) {
  const effort = reasoningEffort || REASONING_EFFORT;
  console.log(`[OpenAI] Calling ${OPENAI_MODEL} with reasoning effort: ${effort}...`);
  
  try {
    // Convert input to messages format
    let messages: Array<{ role: string; content: string }>;
    if (typeof input === 'string') {
      messages = [{ role: 'user', content: input }];
    } else {
      messages = input;
    }
    
    // ✅ UPGRADED: Use GPT-5.1 with Responses API
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: messages,
      reasoning: {
        effort: effort
      },
      max_tokens: maxOutputTokens,
      temperature: 0.7,
      ...(requestJsonFormat && { response_format: { type: 'json_object' } })
    });
    
    // ✅ BULLETPROOF: Use utility functions for parsing
    const content = extractResponseText(response, process.env.NODE_ENV === 'development');
    validateResponseText(content, OPENAI_MODEL, response);
    
    console.log(`[OpenAI] Response received from ${response.model} (${content.length} chars)`);
    
    return {
      content,
      tokensUsed: response.usage?.total_tokens || 0,
      model: response.model,
      reasoning: effort,
      responseId: response.id,
    };
  } catch (error: any) {
    console.error(`[OpenAI] Error calling ${OPENAI_MODEL}:`, error.message);
    
    // Fallback to gpt-4o if GPT-5.1 fails
    if (error.message?.includes('model') || error.message?.includes('quota') || error.status === 404) {
      console.log(`[OpenAI] Trying fallback model: ${OPENAI_FALLBACK_MODEL}`);
      
      // Convert input to messages format
      let messages: Array<{ role: string; content: string }>;
      if (typeof input === 'string') {
        messages = [{ role: 'user', content: input }];
      } else {
        messages = input;
      }
      
      const fallbackResponse = await openai.chat.completions.create({
        model: OPENAI_FALLBACK_MODEL,
        messages: messages,
        max_tokens: maxOutputTokens,
        temperature: 0.7,
        ...(requestJsonFormat && { response_format: { type: 'json_object' } })
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
 * Wraps GPT-5.1 to maintain backward compatibility
 * 
 * @deprecated Use callOpenAI() instead for new code
 */
export async function createChatCompletion(
  messages: Array<{ role: string; content: string }>,
  maxTokens: number = 8000,
  temperature?: number
) {
  console.warn('[OpenAI] Using legacy createChatCompletion wrapper - consider migrating to callOpenAI()');
  // Note: temperature parameter is used, reasoning effort defaults to 'medium'
  return callOpenAI(messages, maxTokens, 'medium', true);
}

/**
 * Export utility functions for direct use
 * These provide bulletproof response parsing for GPT-5.1
 */
export { extractResponseText, validateResponseText } from '../utils/openai';
