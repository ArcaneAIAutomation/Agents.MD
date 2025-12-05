/**
 * UCIE OpenAI Summary - Background Processor
 * 
 * Processes GPT-5.1 analysis in the background (up to 180 seconds / 3 minutes)
 * Updates database with results
 * Frontend polls /openai-summary-poll/[jobId] every 5 seconds for status
 * 
 * ✅ ASYNC: Avoids Vercel 60-second timeout
 * ✅ USES GPT-5.1: Enhanced reasoning with low effort (fast)
 * ✅ STORES DATA: Updates database with results
 * ✅ PATTERN: Whale Watch Deep Dive (proven in production)
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';
import { extractResponseText, validateResponseText } from '../../../utils/openai';

interface ProcessRequest {
  jobId: string;
  symbol: string;
}

interface ProcessResponse {
  success: boolean;
  result?: any;
  error?: string;
  timestamp: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ProcessResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      timestamp: new Date().toISOString(),
    });
  }

  const startTime = Date.now();

  try {
    console.log(`🔄 ========================================`);
    console.log(`🔄 UCIE OpenAI Summary processor STARTED`);
    console.log(`🔄 Time: ${new Date().toISOString()}`);
    console.log(`🔄 ========================================`);
    
    const { jobId, symbol } = req.body as ProcessRequest;
    
    if (!jobId || !symbol) {
      console.error(`❌ Missing required fields: jobId=${jobId}, symbol=${symbol}`);
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: jobId, symbol',
        timestamp: new Date().toISOString(),
      });
    }
    
    console.log(`📊 Job ${jobId}: Processing ${symbol} analysis...`);
    
    // Update status to processing
    await query(
      'UPDATE ucie_openai_jobs SET status = $1, progress = $2, updated_at = NOW() WHERE id = $3',
      ['processing', 'Fetching market data...', parseInt(jobId)]
    );
    
    console.log(`✅ Job ${jobId}: Status updated to 'processing'`);

    // ✅ CRITICAL FIX: Use fresh collected data from preview modal, NOT stale database cache
    console.log(`📡 Retrieving job context data for ${symbol}...`);
    
    const dataStart = Date.now();
    
    // Get the context data that was stored when job was created
    const jobResult = await query(
      'SELECT context_data FROM ucie_openai_jobs WHERE id = $1',
      [parseInt(jobId)]
    );
    
    if (!jobResult.rows[0]?.context_data) {
      throw new Error('Job context data not found');
    }
    
    const { collectedData, context } = jobResult.rows[0].context_data;
    const dataTime = Date.now() - dataStart;
    
    console.log(`✅ Fresh collected data retrieved in ${dataTime}ms`);
    console.log(`📊 Data quality: ${collectedData?.dataQuality || 0}%`);
    console.log(`📊 Data timestamp: ${collectedData?.timestamp || 'unknown'}`);
    
    // Use the fresh collected data (not stale database cache)
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
    
    console.log(`✅ Using FRESH data from preview modal (NOT stale database cache)`);

    // Update progress
    await query(
      'UPDATE ucie_openai_jobs SET progress = $1, updated_at = NOW() WHERE id = $2',
      ['Analyzing with GPT-5.1...', parseInt(jobId)]
    );

    // Build comprehensive prompt
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
    console.log(`✅ UCIE OpenAI Summary completed in ${processingTime}ms`);

    // ✅ UPDATE DATABASE: Store results
    await query(
      `UPDATE ucie_openai_jobs 
       SET status = $1,
           result_data = $2,
           progress = $3,
           updated_at = NOW()
       WHERE id = $4`,
      [
        'completed',
        JSON.stringify(analysis),
        'Analysis complete!',
        parseInt(jobId)
      ]
    );

    console.log(`✅ Job ${jobId}: Analysis completed and stored`);

    return res.status(200).json({
      success: true,
      result: analysis,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`❌ ========================================`);
    console.error(`❌ UCIE OpenAI Summary FAILED after ${processingTime}ms`);
    console.error(`❌ Error:`, error);
    console.error(`❌ ========================================`);
    
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
    const { jobId } = req.body as ProcessRequest;
    if (jobId) {
      try {
        await query(
          `UPDATE ucie_openai_jobs 
           SET status = $1, 
               error_message = $2,
               updated_at = NOW()
           WHERE id = $3`,
          ['error', errorMessage, parseInt(jobId)]
        );
        console.log(`❌ Job ${jobId}: Marked as error`);
      } catch (dbError) {
        console.error('❌ Failed to update job status:', dbError);
      }
    }

    return res.status(500).json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
}
