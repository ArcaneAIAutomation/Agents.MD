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
    
    // Update status to processing
    await query(
      'UPDATE ucie_openai_jobs SET status = $1, progress = $2, updated_at = NOW() WHERE id = $3',
      ['processing', 'Analyzing with GPT-5.1...', jobId]
    );
    
    console.log(`✅ Job ${jobId}: Status updated to 'processing'`);

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

    // Call OpenAI API with GPT-5.1
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const model = 'gpt-5.1';
    const reasoningEffort = 'low'; // Fast response (1-2 seconds)
    
    console.log(`📡 Calling OpenAI Responses API with ${model} (reasoning: ${reasoningEffort})...`);
    console.log(`📡 Prompt length: ${prompt.length} chars`);
    
    const openaiStart = Date.now();

    // ✅ GPT-5.1 with Responses API (3-minute timeout)
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: model,
        input: `You are an expert cryptocurrency analyst. Analyze this data and respond only with valid JSON.\n\n${prompt}`,
        reasoning: {
          effort: reasoningEffort // low = 1-2 seconds (fast)
        },
        text: {
          verbosity: 'medium'
        },
        max_output_tokens: 4000,
      }),
      signal: AbortSignal.timeout(180000), // ✅ 3 MINUTES (180 seconds)
    });

    const openaiTime = Date.now() - openaiStart;
    console.log(`✅ ${model} Responses API responded in ${openaiTime}ms with status ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ ${model} Responses API error: ${response.status}`, errorText);
      throw new Error(`${model} Responses API error: ${response.status}`);
    }

    const data = await response.json();
    
    // ✅ BULLETPROOF: Extract text using utility function
    const { extractResponseText, validateResponseText } = await import('../../../utils/openai');
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

    // ✅ UPDATE DATABASE: Store results
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
      ]
    );

    console.log(`✅ Job ${jobId}: Analysis completed and stored`);

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

    // Update job status to error
    try {
      await query(
        `UPDATE ucie_openai_jobs 
         SET status = $1, 
             error = $2,
             updated_at = NOW(),
             completed_at = NOW()
         WHERE id = $3`,
        ['error', errorMessage, jobId]
      );
      console.log(`❌ Job ${jobId}: Marked as error`);
    } catch (dbError) {
      console.error('❌ Failed to update job status:', dbError);
    }
  }
}

export default withOptionalAuth(handler);
