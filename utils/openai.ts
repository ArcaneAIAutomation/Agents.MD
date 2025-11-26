/**
 * OpenAI API Response Utilities
 * 
 * Bulletproof helpers for extracting text from OpenAI API responses
 * Handles multiple response formats:
 * - Standard Chat Completions API (gpt-4, gpt-4o, gpt-3.5-turbo)
 * - Responses API (o1-preview, o1-mini with reasoning)
 * - Legacy formats
 * 
 * Provides detailed debugging for troubleshooting
 */

type ResponsesOutput = {
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  output_text?: string;
  text?: string;
  content?: string;
  // Standard Chat Completions API format
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

/**
 * Extract text from OpenAI API response
 * 
 * Handles multiple response formats:
 * 1. Standard Chat Completions API (choices[0].message.content)
 * 2. Responses API output_text (o1 models)
 * 3. Responses API output array (o1 with reasoning/CoT)
 * 4. Legacy text field
 * 5. Legacy content field
 * 
 * @param res - Response from OpenAI API (any format)
 * @param debug - Enable detailed logging (default: false)
 * @returns Extracted text string (empty string if nothing found)
 */
export function extractResponseText(
  res: ResponsesOutput,
  debug = false
): string {
  if (debug) {
    console.log('📊 Response structure:', JSON.stringify(res, null, 2).substring(0, 500));
    console.log('📊 Available keys:', Object.keys(res || {}).join(', '));
  }
  
  // Try 1: Standard Chat Completions API format (gpt-4, gpt-4o, gpt-3.5-turbo)
  if (res?.choices && Array.isArray(res.choices) && res.choices.length > 0) {
    const content = res.choices[0]?.message?.content;
    if (typeof content === 'string') {
      if (debug) console.log('✅ Using choices[0].message.content (Chat Completions API)');
      return content;
    }
  }
  
  // Try 2: Simple output_text (Responses API - o1 models)
  if (typeof res?.output_text === 'string') {
    if (debug) console.log('✅ Using output_text field (Responses API)');
    return res.output_text;
  }
  
  // Try 3: Complex output array (Responses API with tools/reasoning/CoT)
  if (res?.output && Array.isArray(res.output)) {
    const chunks: string[] = [];
    
    for (const block of res.output) {
      if (!block?.content) continue;
      
      for (const part of block.content) {
        if (typeof part?.text === "string") {
          chunks.push(part.text);
        }
      }
    }
    
    const result = chunks.join("\n\n").trim();
    if (result) {
      if (debug) console.log(`✅ Using output array, found ${chunks.length} chunks`);
      return result;
    }
  }
  
  // Try 4: Legacy text field (older API versions)
  if (typeof res?.text === 'string') {
    if (debug) console.log('✅ Using text field (legacy)');
    return res.text;
  }
  
  // Try 5: Legacy content field (older API versions)
  if (typeof res?.content === 'string') {
    if (debug) console.log('✅ Using content field (legacy)');
    return res.content;
  }
  
  // Nothing found
  if (debug) {
    console.error('❌ No text found in response');
    console.error('❌ Available keys:', Object.keys(res || {}));
    console.error('❌ Response sample:', JSON.stringify(res, null, 2).substring(0, 1000));
  }
  
  return "";
}

/**
 * Validate that extracted text is not empty
 * Throws error with detailed information if validation fails
 * 
 * @param text - Extracted text to validate
 * @param model - Model name for error message
 * @param response - Original response for debugging
 */
export function validateResponseText(
  text: string,
  model: string,
  response?: any
): void {
  if (!text || text.trim() === '') {
    console.error('❌ Text validation failed');
    console.error('❌ Model:', model);
    console.error('❌ Text length:', text?.length || 0);
    
    if (response) {
      console.error('❌ Response keys:', Object.keys(response || {}).join(', '));
      console.error('❌ Response sample:', JSON.stringify(response, null, 2).substring(0, 1000));
    }
    
    throw new Error(`No text extracted from ${model} response. Check logs for details.`);
  }
}
