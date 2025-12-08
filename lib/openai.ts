/**
 * Shared OpenAI Client for Chat Completions API
 * 
 * This is the single source of truth for OpenAI API access across the entire application.
 * All other files must import and use this shared client instance.
 * 
 * Model: gpt-4o (default, configurable via OPENAI_MODEL env var)
 * API: Standard Chat Completions API with bulletproof parsing
 * 
 * Features:
 * - Bulletproof response parsing via utility functions
 * - Automatic fallback to gpt-4o-mini on errors
 * - JSON format support with proper message formatting
 * - Production-proven across all UCIE features
 * 
 * MIGRATION NOTE (Dec 8, 2025):
 * - Reverted from gpt-5.1 to gpt-4o (reasoning parameter not supported)
 * - Removed unsupported 'reasoning' parameter
 * - Fixed JSON format requirement (messages must contain "json")
 * - See: UCIE-GPT51-API-400-FIX-COMPLETE.md
 */

import OpenAI from 'openai';

// Initialize OpenAI client (standard Chat Completions API)
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

// Model configuration
// ✅ FIXED: Using gpt-4o (gpt-5.1 reasoning parameter not yet supported)
export const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';
export const OPENAI_FALLBACK_MODEL = process.env.OPENAI_FALLBACK_MODEL || 'gpt-4o-mini';

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
 * ✅ FIXED: Using standard Chat Completions API (not Responses API)
 * 
 * @param input - String or array of message objects
 * @param maxOutputTokens - Maximum tokens for completion
 * @param reasoningEffort - Reasoning effort: 'low', 'medium', 'high'
 * @param requestJsonFormat - Whether to request JSON format response
 * @returns Response object with content, tokens used, and model info
 */
export async function callOpenAI(
  input: string | Array<{ role: string; content: string }>,
  maxOutputTokens: number = 8000,
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
    
    // ✅ FIXED: Ensure messages contain "json" when requesting JSON format
    if (requestJsonFormat) {
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage.content.toLowerCase().includes('json')) {
        lastMessage.content += '\n\nPlease respond with valid JSON format.';
      }
    }
    
    // ✅ FIXED: Remove unsupported 'reasoning' parameter
    // Standard Chat Completions API doesn't support reasoning parameter
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: messages as any,
      temperature: 0.7,
      max_tokens: maxOutputTokens,
      response_format: requestJsonFormat ? { type: 'json_object' } : undefined
    });
    
    // ✅ BULLETPROOF: Extract from standard Chat Completions format
    const content = extractResponseText(completion, false);
    
    if (!content) {
      throw new Error('No content in response');
    }
    
    console.log(`[OpenAI] Response received from ${completion.model} (${content.length} chars)`);
    
    return {
      content,
      tokensUsed: completion.usage?.total_tokens || 0,
      model: completion.model,
      reasoning: effort,
      responseId: completion.id,
    };
  } catch (error: any) {
    console.error(`[OpenAI] Error calling ${OPENAI_MODEL}:`, error.message);
    
    // Fallback to gpt-4o if primary model fails
    if (error.message?.includes('model') || error.message?.includes('quota') || error.message?.includes('reasoning') || error.status === 404 || error.status === 400) {
      console.log(`[OpenAI] Trying fallback model: gpt-4o`);
      
      try {
        // Convert input to messages format
        let messages: Array<{ role: string; content: string }>;
        if (typeof input === 'string') {
          messages = [{ role: 'user', content: input }];
        } else {
          messages = input;
        }
        
        // ✅ FIXED: Ensure messages contain "json" when requesting JSON format
        if (requestJsonFormat) {
          const lastMessage = messages[messages.length - 1];
          if (!lastMessage.content.toLowerCase().includes('json')) {
            lastMessage.content += '\n\nPlease respond with valid JSON format.';
          }
        }
        
        // Use standard Chat Completions API for gpt-4o (no reasoning parameter)
        const fallbackCompletion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: messages as any,
          temperature: 0.7,
          max_tokens: maxOutputTokens,
          response_format: requestJsonFormat ? { type: 'json_object' } : undefined
        });
        
        const content = extractResponseText(fallbackCompletion, false);
        
        if (!content) {
          throw new Error('No content in fallback response');
        }
        
        console.log(`[OpenAI] Fallback response received from ${fallbackCompletion.model}`);
        
        return {
          content,
          tokensUsed: fallbackCompletion.usage?.total_tokens || 0,
          model: `${fallbackCompletion.model} (fallback)`,
          reasoning: 'none',
          responseId: fallbackCompletion.id,
        };
      } catch (fallbackError: any) {
        console.error(`[OpenAI] Fallback also failed:`, fallbackError.message);
        throw new Error(`Both ${OPENAI_MODEL} and gpt-4o failed: ${error.message}`);
      }
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
