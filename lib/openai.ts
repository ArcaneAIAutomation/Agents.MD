/**
 * Shared OpenAI Client for GPT-5-mini Responses API
 * 
 * This is the single source of truth for OpenAI API access across the entire application.
 * All other files must import and use this shared client instance.
 * 
 * Model: gpt-5-mini (default, configurable via OPENAI_MODEL env var)
 * API: OpenAI Responses API with reasoning support
 * Fallback: gpt-4o-mini (Chat Completions API)
 * 
 * Features:
 * - gpt-5-mini with enhanced reasoning capabilities
 * - Bulletproof response parsing via utility functions
 * - Automatic fallback to gpt-4o-mini on errors
 * - JSON format support with proper message formatting
 * - Production-proven in UCIE Analysis
 * 
 * UPDATED (Jan 2, 2026):
 * - ✅ Using gpt-5-mini (GPT-5 reasoning model)
 * - ✅ Using Responses API with reasoning: { effort: 'low' | 'medium' | 'high' }
 * - ✅ Valid models: gpt-5-mini, o1-mini, o1-preview (Responses API)
 * - ✅ Fallback: gpt-4o-mini (Chat Completions API)
 */

import OpenAI from 'openai';

// Initialize OpenAI client with Responses API header
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  defaultHeaders: {
    'OpenAI-Beta': 'responses=v1' // Required for GPT-5 Responses API
  }
});

// Model configuration
// ✅ UPDATED: Using gpt-5-mini with Responses API (GPT-5 reasoning model)
// Valid models: gpt-5-mini, o1-mini, o1-preview (Responses API)
// Fallback: gpt-4o-mini (Chat Completions API)
export const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-5-mini';
// ✅ Fallback to gpt-4o-mini (Chat Completions API)
export const OPENAI_FALLBACK_MODEL = process.env.OPENAI_FALLBACK_MODEL || 'gpt-4o-mini';

// Reasoning effort configuration for o1 models
// Valid options: "low" (1-2s), "medium" (3-5s), "high" (5-10s)
// ⚠️ IMPORTANT: 'minimal' and 'none' are NOT valid - use 'low' instead
const rawReasoningEffort = process.env.REASONING_EFFORT || 'low';
// ✅ AUTO-NORMALIZE: Convert invalid values to 'low'
export const REASONING_EFFORT = (
  rawReasoningEffort === 'minimal' || rawReasoningEffort === 'none'
    ? 'low'
    : rawReasoningEffort
) as 'low' | 'medium' | 'high';

/**
 * Normalize reasoning effort for the given model
 * Valid values: 'low', 'medium', 'high'
 * Invalid values ('minimal', 'none') are converted to 'low'
 * 
 * @param model - The OpenAI model name
 * @param effort - The requested reasoning effort
 * @returns The normalized effort that's valid for the model
 */
export type ReasoningEffort = 'low' | 'medium' | 'high';

export function normalizeReasoningEffort(model: string, effort: string): ReasoningEffort {
  // Convert invalid values to 'low'
  if (effort === 'none' || effort === 'minimal') {
    console.log(`[OpenAI] Converting '${effort}' to 'low' (invalid reasoning effort)`);
    return 'low';
  }
  // Validate the effort is one of the valid values
  if (effort === 'low' || effort === 'medium' || effort === 'high') {
    return effort;
  }
  // Default to 'low' for any other invalid value
  console.log(`[OpenAI] Unknown reasoning effort '${effort}', defaulting to 'low'`);
  return 'low';
}

// Timeout configuration
// ✅ EXTENDED: 30 minutes for deep analysis
export const OPENAI_TIMEOUT = parseInt(process.env.OPENAI_TIMEOUT || '1800000'); // 30 minutes (1800 seconds)

// Import bulletproof utility functions
import { extractResponseText, validateResponseText } from '../utils/openai';

/**
 * Helper function to call OpenAI with bulletproof response parsing
 * ✅ UPGRADED: Using Responses API for o1 models with reasoning support
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
  // ✅ IMPORTANT: Valid reasoning efforts are 'low', 'medium', 'high' only
  const effort = normalizeReasoningEffort(OPENAI_MODEL, reasoningEffort || REASONING_EFFORT);
  const model = OPENAI_MODEL;
  
  console.log(`[OpenAI] Calling ${model} with reasoning effort: ${effort}...`);
  
  try {
    // Convert input to prompt string
    let promptText: string;
    if (typeof input === 'string') {
      promptText = input;
    } else {
      // Combine messages into single prompt
      promptText = input.map(msg => {
        if (msg.role === 'system') {
          return `System: ${msg.content}`;
        } else if (msg.role === 'user') {
          return `User: ${msg.content}`;
        } else {
          return msg.content;
        }
      }).join('\n\n');
    }
    
    // Add JSON instruction if needed
    if (requestJsonFormat && !promptText.toLowerCase().includes('json')) {
      promptText += '\n\nPlease respond with valid JSON format.';
    }
    
    // ✅ GPT-5 and o1 models: Use Responses API with proper parameters
    if (model === 'gpt-5-mini' || model === 'o1-mini' || model === 'o1-preview' || model.startsWith('o1') || model.startsWith('gpt-5')) {
      console.log(`🚀 Using Responses API for ${model} with reasoning effort: ${effort}`);
      
      // ✅ CORRECT: Use the responses.create method via the SDK
      const response = await (openai as any).responses.create({
        model: model,
        input: promptText,
        reasoning: {
          effort: effort // ✅ MUST be: 'low', 'medium', or 'high'
        },
        max_output_tokens: maxOutputTokens,
      });

      // ✅ BULLETPROOF: Extract text using utility function
      const content = extractResponseText(response, true);
      
      // Validate extraction succeeded
      validateResponseText(content, model, response);
      
      console.log(`✅ ${model} response received (${content.length} chars) with reasoning: ${effort}`);
      
      return {
        content,
        tokensUsed: response.usage?.total_tokens || 0,
        model: model,
        reasoning: effort,
        responseId: response.id || 'unknown',
      };
      
    } else {
      // ✅ GPT-4o or other models: Use standard Chat Completions API
      console.log(`📡 Using Chat Completions API for ${model}`);
      
      // Convert back to messages format for Chat Completions
      let messages: Array<{ role: string; content: string }>;
      if (typeof input === 'string') {
        messages = [{ role: 'user', content: input }];
      } else {
        messages = input;
      }
      
      // Ensure JSON keyword present
      if (requestJsonFormat) {
        const lastMessage = messages[messages.length - 1];
        if (!lastMessage.content.toLowerCase().includes('json')) {
          lastMessage.content += '\n\nPlease respond with valid JSON format.';
        }
      }
      
      const completion = await openai.chat.completions.create({
        model: model,
        messages: messages as any,
        temperature: 0.7,
        max_completion_tokens: maxOutputTokens,
        response_format: requestJsonFormat ? { type: 'json_object' } : undefined
      });
      
      const content = extractResponseText(completion, false);
      
      if (!content) {
        throw new Error('No content in response');
      }
      
      console.log(`✅ ${model} response received (${content.length} chars)`);
      
      return {
        content,
        tokensUsed: completion.usage?.total_tokens || 0,
        model: completion.model,
        reasoning: 'n/a', // Chat Completions doesn't have reasoning
        responseId: completion.id,
      };
    }
    
  } catch (error: any) {
    console.error(`[OpenAI] Error calling ${model}:`, error.message);
    
    // Fallback to gpt-4o-mini if primary model fails
    const fallbackModel = OPENAI_FALLBACK_MODEL;
    
    if (model !== fallbackModel) {
      console.log(`[OpenAI] Trying fallback model: ${fallbackModel}`);
      
      try {
        // Convert input to messages format for fallback
        let messages: Array<{ role: string; content: string }>;
        if (typeof input === 'string') {
          messages = [{ role: 'user', content: input }];
        } else {
          messages = input;
        }
        
        // Ensure JSON keyword present
        if (requestJsonFormat) {
          const lastMessage = messages[messages.length - 1];
          if (!lastMessage.content.toLowerCase().includes('json')) {
            lastMessage.content += '\n\nPlease respond with valid JSON format.';
          }
        }
        
        // ✅ Use standard Chat Completions API for fallback
        const fallbackCompletion = await openai.chat.completions.create({
          model: fallbackModel,
          messages: messages as any,
          temperature: 0.7,
          max_completion_tokens: maxOutputTokens,
          response_format: requestJsonFormat ? { type: 'json_object' } : undefined
        });
        
        const content = extractResponseText(fallbackCompletion, false);
        
        if (!content) {
          throw new Error('No content in fallback response');
        }
        
        console.log(`✅ Fallback ${fallbackModel} response received`);
        
        return {
          content,
          tokensUsed: fallbackCompletion.usage?.total_tokens || 0,
          model: `${fallbackCompletion.model} (fallback)`,
          reasoning: 'n/a', // Chat Completions doesn't have reasoning
          responseId: fallbackCompletion.id,
        };
      } catch (fallbackError: any) {
        console.error(`[OpenAI] Fallback also failed:`, fallbackError.message);
        throw new Error(`Both ${model} and ${fallbackModel} failed: ${error.message}`);
      }
    }
    
    throw error;
  }
}

/**
 * Legacy compatibility function for chat completions
 * Wraps o1-mini to maintain backward compatibility
 * 
 * @deprecated Use callOpenAI() instead for new code
 */
export async function createChatCompletion(
  messages: Array<{ role: string; content: string }>,
  maxTokens: number = 8000,
  temperature?: number
) {
  console.warn('[OpenAI] Using legacy createChatCompletion wrapper - consider migrating to callOpenAI()');
  // Note: temperature parameter is ignored for o1 models, reasoning effort defaults to 'low'
  return callOpenAI(messages, maxTokens, 'low', true);
}

/**
 * Export utility functions for direct use
 * These provide bulletproof response parsing for OpenAI models
 */
export { extractResponseText, validateResponseText } from '../utils/openai';
