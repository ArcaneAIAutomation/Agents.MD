/**
 * Shared OpenAI Client for GPT-5-mini Responses API
 * 
 * This is the single source of truth for OpenAI API access across the entire application.
 * All other files must import and use this shared client instance.
 * 
 * Model: gpt-5-mini (default, configurable via OPENAI_MODEL env var)
 * API: OpenAI Responses API with reasoning support
 * 
 * Features:
 * - GPT-5-mini with enhanced reasoning capabilities
 * - Bulletproof response parsing via utility functions
 * - Automatic fallback to gpt-4o on errors
 * - JSON format support with proper message formatting
 * - Production-proven in UCIE Analysis
 * 
 * UPDATED (Dec 14, 2025):
 * - ✅ Using gpt-5-mini (lightweight GPT-5 model)
 * - ✅ Using Responses API (not Chat Completions)
 * - ✅ Proper max_output_tokens parameter
 * - ✅ Reasoning effort: 'minimal', 'low', 'medium', 'high' (NOT 'none')
 * - ✅ gpt-5-mini does NOT support custom temperature (only default 1)
 * - ✅ Fallback to gpt-4o (hardcoded, not env var)
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
// ✅ UPDATED: Using gpt-5-mini with Responses API
export const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-5-mini';
// ✅ HARDCODED: Fallback MUST be gpt-4o (not gpt-5-mini which has different constraints)
export const OPENAI_FALLBACK_MODEL = 'gpt-4o';

// Reasoning effort configuration for gpt-5-mini
// Options: "minimal" (fastest), "low" (1-2s), "medium" (3-5s), "high" (5-10s)
// ⚠️ IMPORTANT: 'none' is NOT supported by gpt-5-mini
export const REASONING_EFFORT = (process.env.REASONING_EFFORT || 'minimal') as 'minimal' | 'low' | 'medium' | 'high';

// Timeout configuration
// ✅ EXTENDED: 30 minutes for deep analysis
export const OPENAI_TIMEOUT = parseInt(process.env.OPENAI_TIMEOUT || '1800000'); // 30 minutes (1800 seconds)

// Import bulletproof utility functions
import { extractResponseText, validateResponseText } from '../utils/openai';

/**
 * Helper function to call OpenAI GPT-5.1 with bulletproof response parsing
 * ✅ UPGRADED: Using Responses API for GPT-5.1 with reasoning support
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
  reasoningEffort?: 'minimal' | 'low' | 'medium' | 'high',
  requestJsonFormat: boolean = true
) {
  // ✅ IMPORTANT: gpt-5-mini requires 'minimal', 'low', 'medium', or 'high' (NOT 'none')
  const effort = reasoningEffort || REASONING_EFFORT;
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
    
    // ✅ GPT-5-mini: Use Responses API with proper parameters
    if (model === 'gpt-5-mini' || model.includes('gpt-5')) {
      console.log(`🚀 Using Responses API for ${model} with reasoning effort: ${effort}`);
      
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: model,
          input: promptText,
          reasoning: {
            effort: effort // ✅ MUST be: 'minimal', 'low', 'medium', or 'high' (NOT 'none')
          },
          max_output_tokens: maxOutputTokens, // ✅ CORRECT parameter for GPT-5-mini
          // ⚠️ NOTE: temperature is NOT supported by gpt-5-mini (only default 1)
        }),
        signal: AbortSignal.timeout(OPENAI_TIMEOUT),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ ${model} Responses API error: ${response.status}`, errorText);
        throw new Error(`${model} API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      // ✅ BULLETPROOF: Extract text using utility function
      const content = extractResponseText(data, true);
      
      // Validate extraction succeeded
      validateResponseText(content, model, data);
      
      console.log(`✅ ${model} response received (${content.length} chars) with reasoning: ${effort}`);
      
      return {
        content,
        tokensUsed: data.usage?.total_tokens || 0,
        model: model,
        reasoning: effort, // Returns actual effort used: 'minimal', 'low', 'medium', or 'high'
        responseId: data.id || 'unknown',
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
        temperature: 0.7, // ✅ OK for gpt-4o (this path is only for non-gpt-5 models)
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
    
    // Fallback to gpt-4o if GPT-5-mini fails
    // ✅ HARDCODED: Always use gpt-4o for fallback (NOT gpt-5-mini which has different constraints)
    const fallbackModel = 'gpt-4o';
    
    if (model === 'gpt-5-mini' || model.includes('gpt-5')) {
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
        
        // ✅ Use standard Chat Completions API for gpt-4o fallback
        // gpt-4o supports temperature: 0.7 (unlike gpt-5-mini)
        const fallbackCompletion = await openai.chat.completions.create({
          model: fallbackModel,
          messages: messages as any,
          temperature: 0.7, // ✅ OK for gpt-4o
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
          reasoning: 'n/a', // gpt-4o doesn't have reasoning
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
 * Wraps GPT-5-mini to maintain backward compatibility
 * 
 * @deprecated Use callOpenAI() instead for new code
 */
export async function createChatCompletion(
  messages: Array<{ role: string; content: string }>,
  maxTokens: number = 8000,
  temperature?: number
) {
  console.warn('[OpenAI] Using legacy createChatCompletion wrapper - consider migrating to callOpenAI()');
  // Note: temperature parameter is ignored for gpt-5-mini, reasoning effort defaults to 'minimal'
  return callOpenAI(messages, maxTokens, 'minimal', true);
}

/**
 * Export utility functions for direct use
 * These provide bulletproof response parsing for GPT-5.1
 */
export { extractResponseText, validateResponseText } from '../utils/openai';
