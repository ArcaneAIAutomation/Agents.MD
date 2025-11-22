/**
 * OpenAI Responses API Utilities
 * 
 * Bulletproof helpers for extracting text from GPT-5.1 Responses API
 * Handles multiple response formats and provides detailed debugging
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
};

/**
 * Extract text from OpenAI Responses API response
 * 
 * Handles multiple response formats:
 * 1. Simple output_text (most common)
 * 2. Complex output array (GPT-5.1 with tools/reasoning)
 * 3. Legacy text field
 * 4. Legacy content field
 * 
 * @param res - Response from OpenAI Responses API
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
  
  // Try 1: Simple output_text (most common for GPT-5.1)
  if (typeof res?.output_text === 'string') {
    if (debug) console.log('✅ Using output_text field');
    return res.output_text;
  }
  
  // Try 2: Complex output array (GPT-5.1 with tools/reasoning/CoT)
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
  
  // Try 3: Legacy text field (older API versions)
  if (typeof res?.text === 'string') {
    if (debug) console.log('✅ Using text field (legacy)');
    return res.text;
  }
  
  // Try 4: Legacy content field (older API versions)
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
