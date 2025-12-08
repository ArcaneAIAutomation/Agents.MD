/**
 * UCIE OpenAI Summary - Start Analysis (Async)
 * 
 * POST /api/ucie/openai-summary-start/[symbol]
 * 
 * Starts GPT-5.1 analysis in background, returns jobId immediately
 * Frontend polls /api/ucie/openai-summary-poll/[jobId] every 10 seconds
 * 
 * ✅ ASYNC: Avoids Vercel 60-second timeout
 * ✅ POLLING: Frontend checks status every 10 seconds
 * ✅ BULLETPROOF: Can run for up to 3 minutes
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../../lib/db';
import { withOptionalAuth, AuthenticatedRequest } from '../../../../middleware/auth';

interface StartResponse {
  success: boolean;
  jobId?: string;
  status?: string;
  error?: string;
  timestamp: string;
}

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<StartResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      timestamp: new Date().toISOString(),
    });
  }

  const { symbol } = req.query;
  const userId = req.user?.id || null;

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Invalid symbol',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const symbolUpper = symbol.toUpperCase();
    const { collectedData, context } = req.body;

    if (!collectedData || !context) {
      return res.status(400).json({
        success: false,
        error: 'Missing collectedData or context',
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`🚀 Starting GPT-5.1 analysis for ${symbolUpper}...`);

    // Create job in database
    const result = await query(
      `INSERT INTO ucie_openai_jobs (symbol, user_id, status, context_data, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING id, status`,
      [symbolUpper, userId, 'queued', JSON.stringify({ collectedData, context })]
    );

    const jobId = result.rows[0].id;
    console.log(`✅ Job created: ${jobId}`);

    // ✅ CRITICAL FIX: Process job directly (no HTTP fetch)
    // This eliminates circular dependency and ensures job processing happens
    console.log(`🔥 Starting async job processing for ${jobId}...`);
    
    // Process job asynchronously (don't await - fire and forget)
    processJobAsync(jobId, symbolUpper, collectedData, context).catch(err => {
      console.error(`❌ Job ${jobId} processing failed:`, err);
    });

    // Return immediately with jobId
    return res.status(200).json({
      success: true,
      jobId: jobId.toString(),
      status: 'queued',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Failed to start GPT-5.1 analysis:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start analysis',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Process GPT-5.1 job asynchronously
 * Extracted from openai-summary-process.ts to eliminate HTTP fetch dependency
 * 
 * ✅ CRITICAL FIX: Database connections are released immediately after each query
 * to prevent connection timeout during long OpenAI API calls (3 minutes)
 */
async function processJobAsync(
  jobId: number,
  symbol: string,
  collectedData: any,
  context: any
) {
  const startTime = Date.now();
  
  try {
    console.log(`🔄 Job ${jobId}: Processing ${symbol} analysis...`);
    
    // ✅ FIX: Update status to processing with retry logic
    let statusUpdated = false;
    for (let dbAttempt = 1; dbAttempt <= 3; dbAttempt++) {
      try {
        await query(
          'UPDATE ucie_openai_jobs SET status = $1, progress = $2, updated_at = NOW() WHERE id = $3',
          ['processing', 'Analyzing with GPT-5.1...', jobId],
          { timeout: 5000, retries: 1 } // 5 second timeout, 1 retry
        );
        console.log(`✅ Job ${jobId}: Status updated to 'processing', DB connection released`);
        statusUpdated = true;
        break;
      } catch (dbError) {
        console.error(`❌ DB update attempt ${dbAttempt}/3 failed:`, dbError);
        if (dbAttempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
        }
      }
    }
    
    if (!statusUpdated) {
      console.warn(`⚠️ Job ${jobId}: Failed to update status, continuing anyway...`);
    }

    // Build comprehensive prompt
    const allData = {
      marketData: collectedData?.marketData || null,
      technical: collectedData?.technical || null,
      sentiment: collectedData?.sentiment || null,
      news: collectedData?.news || null,
      onChain: collectedData?.onChain || null,
      risk: collectedData?.risk || null,
      predictions: collectedData?.predictions || null,
      defi: collectedData?.defi || null,
      openaiSummary: {
        dataQuality: collectedData?.dataQuality || 0
      }
    };

    const prompt = `You are an expert cryptocurrency market analyst. Analyze ${symbol} using the following comprehensive data:

📊 MARKET DATA:
${allData.marketData ? JSON.stringify(allData.marketData, null, 2) : 'Not available'}

📈 TECHNICAL ANALYSIS:
${allData.technical ? JSON.stringify(allData.technical, null, 2) : 'Not available'}

💬 SENTIMENT ANALYSIS:
${allData.sentiment ? JSON.stringify(allData.sentiment, null, 2) : 'Not available'}

📰 NEWS:
${allData.news ? JSON.stringify(allData.news, null, 2) : 'Not available'}

⛓️ ON-CHAIN DATA:
${allData.onChain ? JSON.stringify(allData.onChain, null, 2) : 'Not available'}

🎯 RISK ASSESSMENT:
${allData.risk ? JSON.stringify(allData.risk, null, 2) : 'Not available'}

🔮 PREDICTIONS:
${allData.predictions ? JSON.stringify(allData.predictions, null, 2) : 'Not available'}

💰 DEFI METRICS:
${allData.defi ? JSON.stringify(allData.defi, null, 2) : 'Not available'}

Provide comprehensive JSON analysis with these exact fields:
{
  "summary": "Executive summary (2-3 paragraphs)",
  "confidence": 85,
  "key_insights": ["insight 1", "insight 2", "insight 3"],
  "market_outlook": "24-48 hour outlook",
  "risk_factors": ["risk 1", "risk 2", "risk 3"],
  "opportunities": ["opportunity 1", "opportunity 2", "opportunity 3"],
  "technical_summary": "Technical indicator summary",
  "sentiment_summary": "Social sentiment summary",
  "recommendation": "Buy|Hold|Sell with reasoning"
}

Be specific, actionable, and data-driven.`;

    // Call OpenAI API with GPT-5.1 (Chat Completions API)
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const model = 'gpt-5.1'; // Use Chat Completions API with GPT-5.1
    
    console.log(`📡 Calling OpenAI Chat Completions API with ${model}...`);
    console.log(`📡 Prompt length: ${prompt.length} chars`);
    
    const openaiStart = Date.now();

    // ✅ ULTIMATE BULLETPROOF: Aggressive retry with connection management
    let response: Response | null = null;
    let lastError: Error | null = null;
    const maxRetries = 5; // Increased from 3 to 5 for better reliability
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📡 Attempt ${attempt}/${maxRetries} calling OpenAI...`);
        
        // ✅ CRITICAL FIX: Aggressive timeout reduction to prevent socket issues
        const controller = new AbortController();
        const timeoutMs = 90000; // 90 seconds (well under Vercel's limit)
        const timeoutId = setTimeout(() => {
          console.warn(`⏰ Request timeout after ${timeoutMs}ms, aborting...`);
          controller.abort();
        }, timeoutMs);
        
        // ✅ CRITICAL FIX: Aggressive prompt truncation to reduce payload
        const maxPromptLength = 12000; // Reduced from 15000
        const truncatedPrompt = prompt.length > maxPromptLength 
          ? prompt.substring(0, maxPromptLength) + '\n\n[Data truncated for performance - analysis based on available data]'
          : prompt;
        
        console.log(`📡 Sending ${truncatedPrompt.length} chars to OpenAI (original: ${prompt.length})`);
        
        // ✅ CRITICAL: Use HTTP/1.1 with connection pooling
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiApiKey}`,
            'Connection': 'keep-alive',
            'Keep-Alive': 'timeout=90, max=100',
            'Accept-Encoding': 'gzip, deflate', // Enable compression
            'User-Agent': 'UCIE-Analysis/1.0',
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: 'system',
                content: 'You are an expert cryptocurrency market analyst. Provide concise, actionable analysis in valid JSON format only. Focus on key insights.'
              },
              {
                role: 'user',
                content: truncatedPrompt
              }
            ],
            temperature: 0.7,
            max_tokens: 2500, // Further reduced from 3000 for faster response
            response_format: { type: 'json_object' }
          }),
          signal: controller.signal,
          // @ts-ignore - keepalive is valid but not in types
          keepalive: true,
        });
        
        clearTimeout(timeoutId);
        
        const openaiTime = Date.now() - openaiStart;
        console.log(`✅ ${model} responded in ${openaiTime}ms with status ${response.status}`);
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unable to read error');
          console.error(`❌ ${model} error: ${response.status}`, errorText.substring(0, 200));
          
          // Retry on 5xx errors, rate limits, or timeouts
          if (response.status >= 500 || response.status === 429 || response.status === 408) {
            throw new Error(`${model} API error ${response.status}: ${errorText.substring(0, 100)}`);
          }
          
          // Don't retry on 4xx errors (except 429 and 408)
          throw new Error(`${model} API error ${response.status}: ${errorText.substring(0, 100)}`);
        }
        
        // Success - break retry loop
        console.log(`✅ Attempt ${attempt} succeeded!`);
        break;
        
      } catch (error) {
        lastError = error as Error;
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`❌ Attempt ${attempt}/${maxRetries} failed:`, errorMsg);
        
        // Check if it's a network/socket error
        if (error instanceof Error) {
          const isNetworkError = 
            error.message.includes('fetch failed') ||
            error.message.includes('socket') ||
            error.message.includes('ECONNRESET') ||
            error.message.includes('ETIMEDOUT') ||
            error.message.includes('other side closed') ||
            error.message.includes('aborted') ||
            error.message.includes('UND_ERR_SOCKET') ||
            error.message.includes('ECONNREFUSED') ||
            error.message.includes('network') ||
            error.name === 'AbortError';
          
          if (isNetworkError && attempt < maxRetries) {
            // Exponential backoff with jitter: 1s, 2s, 4s, 8s, 16s
            const baseDelay = Math.pow(2, attempt - 1) * 1000;
            const jitter = Math.random() * 1000; // Add randomness to prevent thundering herd
            const delay = baseDelay + jitter;
            console.log(`⏳ Network error detected, waiting ${Math.round(delay)}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        
        // If not retryable or last attempt, throw
        if (attempt === maxRetries) {
          console.error(`❌ All ${maxRetries} attempts failed, giving up`);
          throw lastError;
        }
        
        // For non-network errors, wait a bit before retry
        if (attempt < maxRetries) {
          const delay = 2000; // 2 seconds for non-network errors
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    if (!response) {
      throw lastError || new Error('OpenAI API call failed after all retries');
    }

    const data = await response.json();
    
    // ✅ BULLETPROOF: Extract text using utility function
    const { extractResponseText, validateResponseText } = await import('../../../../utils/openai');
    const analysisText = extractResponseText(data, true);
    validateResponseText(analysisText, model, data);
    
    console.log(`✅ Got ${model} response text (${analysisText.length} chars)`);

    // ✅ ULTIMATE BULLETPROOF JSON PARSING
    let analysis: any;
    try {
      analysis = JSON.parse(analysisText);
      console.log(`✅ Direct JSON parse succeeded`);
    } catch (parseError) {
      console.warn(`⚠️ Initial JSON parse failed, engaging cleanup...`);
      
      try {
        let cleanedText = analysisText.trim()
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/\s*```$/i, '')
          .replace(/^[^{]*({)/s, '$1')
          .replace(/(})[^}]*$/s, '$1');
        
        for (let i = 0; i < 5; i++) {
          cleanedText = cleanedText
            .replace(/,(\s*])/g, '$1')
            .replace(/,(\s*})/g, '$1')
            .replace(/(\d+)\.(\s*[,\]}])/g, '$1$2')
            .replace(/,\s*,/g, ',');
        }
        
        analysis = JSON.parse(cleanedText);
        console.log(`✅ JSON parse succeeded after cleanup`);
        
      } catch (cleanupError) {
        console.error(`❌ All parsing attempts failed`);
        throw new Error(`Invalid JSON from ${model}: ${parseError instanceof Error ? parseError.message : 'Parse failed'}`);
      }
    }
    
    if (!analysis || typeof analysis !== 'object') {
      throw new Error('Parsed analysis is not a valid object');
    }
    
    console.log(`✅ Analysis object validated, keys:`, Object.keys(analysis).join(', '));

    const processingTime = Date.now() - startTime;
    console.log(`✅ Job ${jobId} completed in ${processingTime}ms`);

    // ✅ UPDATE DATABASE: Store results with retry logic
    let resultsStored = false;
    for (let dbAttempt = 1; dbAttempt <= 3; dbAttempt++) {
      try {
        await query(
          `UPDATE ucie_openai_jobs 
           SET status = $1,
               result = $2,
               progress = $3,
               updated_at = NOW(),
               completed_at = NOW()
           WHERE id = $4`,
          [
            'completed',
            JSON.stringify(analysis),
            'Analysis complete!',
            jobId
          ],
          { timeout: 20000, retries: 1 } // 20 second timeout for large JSON, 1 retry
        );
        console.log(`✅ Job ${jobId}: Analysis completed and stored, DB connection released`);
        resultsStored = true;
        break;
      } catch (dbError) {
        console.error(`❌ DB store attempt ${dbAttempt}/3 failed:`, dbError);
        if (dbAttempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
        }
      }
    }
    
    if (!resultsStored) {
      throw new Error('Failed to store analysis results in database after 3 attempts');
    }

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`❌ Job ${jobId} FAILED after ${processingTime}ms:`, error);
    
    let errorMessage = 'Analysis failed';
    
    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message.includes('abort')) {
        errorMessage = 'Analysis timed out after 3 minutes';
      } else if (error.message.includes('API key')) {
        errorMessage = 'OpenAI API key issue';
      } else {
        errorMessage = error.message;
      }
    }

    // Update job status to error with retry logic
    for (let dbAttempt = 1; dbAttempt <= 3; dbAttempt++) {
      try {
        await query(
          `UPDATE ucie_openai_jobs 
           SET status = $1, 
               error = $2,
               updated_at = NOW(),
               completed_at = NOW()
           WHERE id = $3`,
          ['error', errorMessage, jobId],
          { timeout: 5000, retries: 1 } // 5 second timeout, 1 retry
        );
        console.log(`❌ Job ${jobId}: Marked as error, DB connection released`);
        break;
      } catch (dbError) {
        console.error(`❌ DB error update attempt ${dbAttempt}/3 failed:`, dbError);
        if (dbAttempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
        } else {
          console.error(`❌ Failed to update error status after 3 attempts`);
        }
      }
    }
  }
}

export default withOptionalAuth(handler);
