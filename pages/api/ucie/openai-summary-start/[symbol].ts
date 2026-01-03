/**
 * UCIE OpenAI Summary - Start Analysis (Async)
 * 
 * POST /api/ucie/openai-summary-start/[symbol]
 * 
 * Starts GPT analysis in background, returns jobId immediately
 * Frontend polls /api/ucie/openai-summary-poll/[jobId] every 10 seconds
 * 
 * ✅ ASYNC: Avoids Vercel 60-second timeout
 * ✅ POLLING: Frontend checks status every 10 seconds
 * ✅ BULLETPROOF: Can run for up to 3 minutes
 * ✅ MODEL: Uses gpt-5-mini (GPT-5 reasoning model with Responses API)
 * ✅ CONTEXT AGGREGATION: Uses formatContextForAI() for comprehensive prompts (December 2025 fix)
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../../lib/db';
import { withOptionalAuth, AuthenticatedRequest } from '../../../../middleware/auth';
import { getComprehensiveContext, formatContextForAI, ComprehensiveContext } from '../../../../lib/ucie/contextAggregator';

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

    console.log(`🚀 Starting gpt-5-mini analysis for ${symbolUpper}...`);

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
    console.error('Failed to start gpt-5-mini analysis:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start analysis',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * 🚀 MODULAR ANALYSIS APPROACH
 * 
 * Instead of one giant prompt (15k+ chars causing socket timeouts),
 * we analyze each data source separately:
 * 
 * 1. Market Data Analysis (small, fast)
 * 2. Technical Analysis (small, fast)
 * 3. Sentiment Analysis (small, fast)
 * 4. News Analysis (small, fast)
 * 5. On-Chain Analysis (small, fast)
 * 6. Risk Analysis (small, fast)
 * 7. Predictions Analysis (small, fast)
 * 8. DeFi Analysis (small, fast)
 * 9. Executive Summary (combines all insights)
 * 
 * Benefits:
 * - No socket timeouts (each request <5s)
 * - Granular insights (users see per-source analysis)
 * - Caesar mega-prompt (combine all for deep dive)
 * - Better error handling (one source fails, others succeed)
 */

interface ModularAnalysis {
  marketAnalysis?: any;
  technicalAnalysis?: any;
  sentimentAnalysis?: any;
  newsAnalysis?: any;
  onChainAnalysis?: any;
  riskAnalysis?: any;
  predictionsAnalysis?: any;
  defiAnalysis?: any;
  executiveSummary?: any;
  timestamp: string;
  processingTime: number;
  // ✅ Model tracking fields (January 2026) - Shows user which GPT model was used
  modelUsed?: string;           // The actual model used (e.g., 'gpt-5-mini', 'gpt-4o-mini')
  reasoningEffort?: string;     // Reasoning effort level ('low', 'medium', 'high')
  isUsingFallback?: boolean;    // True if OPENAI_MODEL env var was not set
}

/**
 * Process GPT-5 job asynchronously with MODULAR ANALYSIS
 * Each data source analyzed separately for speed and reliability
 * 
 * ✅ HEARTBEAT: Updates database every 10 seconds to show job is alive
 * ✅ gpt-5-mini: Uses GPT-5 reasoning model with Responses API (January 2026)
 * ✅ ERROR HANDLING: Comprehensive try-catch with database updates
 */
async function processJobAsync(
  jobId: number,
  symbol: string,
  collectedData: any,
  context: any
) {
  const startTime = Date.now();
  let heartbeatInterval: NodeJS.Timeout | null = null;
  
  try {
    console.log(`🔄 ========================================`);
    console.log(`🔄 Job ${jobId}: Processing ${symbol} analysis...`);
    console.log(`🔄 Start time: ${new Date().toISOString()}`);
    console.log(`🔄 ========================================`);
    
    // ✅ START HEARTBEAT: Update database every 15 seconds (increased from 10s)
    heartbeatInterval = setInterval(async () => {
      try {
        await query(
          'UPDATE ucie_openai_jobs SET updated_at = NOW() WHERE id = $1',
          [jobId],
          { timeout: 10000, retries: 1 } // ✅ FIXED: Increased timeout to 10s, added 1 retry
        );
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        console.log(`💓 HEARTBEAT: Job ${jobId} alive (${elapsed}s elapsed)`);
      } catch (error) {
        console.warn(`⚠️ Heartbeat failed (non-critical):`, error);
        // Heartbeat failures are non-critical - job continues processing
      }
    }, 15000); // Every 15 seconds (increased from 10s to reduce DB load)
    
    // ✅ FIX: Update status to processing with retry logic
    let statusUpdated = false;
    for (let dbAttempt = 1; dbAttempt <= 3; dbAttempt++) {
      try {
        await query(
          'UPDATE ucie_openai_jobs SET status = $1, progress = $2, updated_at = NOW() WHERE id = $3',
          ['processing', 'Analyzing with gpt-5-mini...', jobId],
          { timeout: 10000, retries: 2 } // ✅ FIXED: 10 second timeout, 2 retries
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

    // 🚀 MODULAR ANALYSIS: Analyze each data source separately
    const allData = {
      marketData: collectedData?.marketData || null,
      technical: collectedData?.technical || null,
      sentiment: collectedData?.sentiment || null,
      news: collectedData?.news || null,
      onChain: collectedData?.onChain || null,
      risk: collectedData?.risk || null,
      predictions: collectedData?.predictions || null,
      defi: collectedData?.defi || null,
    };

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // ✅ Use o1-mini: OpenAI's reasoning model with Responses API
    // Valid models: o1-mini, o1-preview (for Responses API with reasoning)
    // Fallback: gpt-4o-mini (for Chat Completions API)
    const configuredModel = process.env.OPENAI_MODEL;
    const fallbackModel = process.env.OPENAI_FALLBACK_MODEL || 'gpt-4o-mini';
    const model = configuredModel || 'o1-mini';
    const reasoningEffort = process.env.REASONING_EFFORT || 'low';
    const isUsingFallback = !configuredModel;
    
    // 🎯 CLEAR MODEL LOGGING - Show user exactly which model is being used
    console.log(`🤖 ========================================`);
    console.log(`🤖 OPENAI MODEL CONFIGURATION`);
    console.log(`🤖 ========================================`);
    console.log(`🤖 Primary Model: ${model}`);
    console.log(`🤖 Fallback Model: ${fallbackModel}`);
    console.log(`🤖 Reasoning Effort: ${reasoningEffort}`);
    console.log(`🤖 Using Fallback: ${isUsingFallback ? '⚠️ YES (OPENAI_MODEL env var not set)' : '✅ NO (using configured model)'}`);
    if (isUsingFallback) {
      console.log(`⚠️ WARNING: OPENAI_MODEL environment variable not set!`);
      console.log(`⚠️ Defaulting to: ${model}`);
      console.log(`⚠️ To fix: Set OPENAI_MODEL=o1-mini in Vercel environment variables`);
    }
    console.log(`🤖 ========================================`);
    
    const modularAnalysis: ModularAnalysis = {
      timestamp: new Date().toISOString(),
      processingTime: 0,
      modelUsed: model, // ✅ Track which model was used
      reasoningEffort: reasoningEffort,
      isUsingFallback: isUsingFallback
    };

    console.log(`🔥 Starting MODULAR analysis for ${symbol} using ${model}...`);
    
    // ✅ CONTEXT AGGREGATION FIX (December 2025)
    // Build comprehensive context using formatContextForAI() for better AI prompts
    const comprehensiveContext: ComprehensiveContext = {
      marketData: allData.marketData,
      technical: allData.technical,
      sentiment: allData.sentiment,
      news: allData.news,
      onChain: allData.onChain,
      risk: allData.risk,
      predictions: allData.predictions,
      derivatives: null, // Not collected in preview
      research: null, // Will be generated
      gptAnalysis: null, // Will be generated
      dataQuality: calculateDataQuality(allData),
      availableData: Object.entries(allData).filter(([_, v]) => v !== null).map(([k]) => k),
      timestamp: new Date().toISOString()
    };
    
    // Generate formatted context for AI consumption
    const formattedContext = formatContextForAI(comprehensiveContext);
    console.log(`📊 Context aggregated: ${comprehensiveContext.dataQuality.toFixed(0)}% complete`);
    console.log(`📊 Available data sources: ${comprehensiveContext.availableData.join(', ')}`);
    
    // ✅ STEP 1: Analyze Market Data (if available)
    if (allData.marketData) {
      try {
        await updateProgress(jobId, 'Analyzing market data...');
        modularAnalysis.marketAnalysis = await analyzeDataSource(
          openaiApiKey,
          model,
          symbol,
          'Market Data',
          allData.marketData,
          'Analyze current price, volume, market cap, and price trends. Provide: current_price_analysis, volume_analysis, market_cap_insights, price_trend (bullish/bearish/neutral), key_metrics.',
          formattedContext // ✅ Pass formatted context for enhanced analysis
        );
        console.log(`✅ Market analysis complete`);
      } catch (error) {
        console.error(`❌ Market analysis failed:`, error);
        modularAnalysis.marketAnalysis = { error: 'Analysis failed' };
      }
    }

    // ✅ STEP 2: Analyze Technical Indicators (if available)
    if (allData.technical) {
      try {
        await updateProgress(jobId, 'Analyzing technical indicators...');
        modularAnalysis.technicalAnalysis = await analyzeDataSource(
          openaiApiKey,
          model,
          symbol,
          'Technical Indicators',
          allData.technical,
          'Analyze RSI, MACD, moving averages, and other indicators. Provide: rsi_signal, macd_signal, moving_average_trend, support_resistance_levels, technical_outlook (bullish/bearish/neutral).',
          formattedContext // ✅ Pass formatted context for enhanced analysis
        );
        console.log(`✅ Technical analysis complete`);
      } catch (error) {
        console.error(`❌ Technical analysis failed:`, error);
        modularAnalysis.technicalAnalysis = { error: 'Analysis failed' };
      }
    }

    // ✅ STEP 3: Analyze Sentiment (if available)
    if (allData.sentiment) {
      try {
        await updateProgress(jobId, 'Analyzing social sentiment...');
        modularAnalysis.sentimentAnalysis = await analyzeDataSource(
          openaiApiKey,
          model,
          symbol,
          'Social Sentiment',
          allData.sentiment,
          'Analyze social media sentiment, Fear & Greed Index, and community mood. Provide: overall_sentiment (bullish/bearish/neutral), fear_greed_interpretation, social_volume_trend, key_sentiment_drivers.',
          formattedContext // ✅ Pass formatted context for enhanced analysis
        );
        console.log(`✅ Sentiment analysis complete`);
      } catch (error) {
        console.error(`❌ Sentiment analysis failed:`, error);
        modularAnalysis.sentimentAnalysis = { error: 'Analysis failed' };
      }
    }

    // ✅ STEP 4: Analyze News with Market Context (if available)
    if (allData.news) {
      try {
        await updateProgress(jobId, 'Analyzing news with market context...');
        
        // ✅ Build comprehensive context for news analysis
        const newsContext = {
          news: allData.news,
          marketContext: {
            currentPrice: allData.marketData?.price || 'N/A',
            priceChange24h: allData.marketData?.change24h || 'N/A',
            volume24h: allData.marketData?.volume24h || 'N/A',
            marketCap: allData.marketData?.marketCap || 'N/A'
          },
          technicalContext: {
            rsi: allData.technical?.rsi || 'N/A',
            macd: allData.technical?.macd || 'N/A',
            trend: allData.technical?.trend || 'N/A'
          },
          sentimentContext: {
            fearGreedIndex: allData.sentiment?.fearGreedIndex || 'N/A',
            socialSentiment: allData.sentiment?.socialSentiment || 'N/A'
          }
        };
        
        modularAnalysis.newsAnalysis = await analyzeNewsWithContext(
          openaiApiKey,
          model,
          symbol,
          newsContext,
          formattedContext // ✅ Pass formatted context for enhanced analysis
        );
        console.log(`✅ News analysis complete with market context`);
      } catch (error) {
        console.error(`❌ News analysis failed:`, error);
        modularAnalysis.newsAnalysis = { error: 'Analysis failed' };
      }
    }

    // ✅ STEP 5: Analyze On-Chain Data (if available)
    if (allData.onChain) {
      try {
        await updateProgress(jobId, 'Analyzing on-chain data...');
        modularAnalysis.onChainAnalysis = await analyzeDataSource(
          openaiApiKey,
          model,
          symbol,
          'On-Chain Data',
          allData.onChain,
          'Analyze blockchain metrics, whale activity, and network health. Provide: whale_activity_summary, network_health, transaction_trends, on_chain_signals (bullish/bearish/neutral).',
          formattedContext // ✅ Pass formatted context for enhanced analysis
        );
        console.log(`✅ On-chain analysis complete`);
      } catch (error) {
        console.error(`❌ On-chain analysis failed:`, error);
        modularAnalysis.onChainAnalysis = { error: 'Analysis failed' };
      }
    }

    // ✅ STEP 6: Analyze Risk (if available)
    if (allData.risk) {
      try {
        await updateProgress(jobId, 'Analyzing risk factors...');
        modularAnalysis.riskAnalysis = await analyzeDataSource(
          openaiApiKey,
          model,
          symbol,
          'Risk Assessment',
          allData.risk,
          'Analyze risk factors and volatility. Provide: risk_level (low/medium/high), volatility_assessment, key_risks, risk_mitigation_strategies.',
          formattedContext // ✅ Pass formatted context for enhanced analysis
        );
        console.log(`✅ Risk analysis complete`);
      } catch (error) {
        console.error(`❌ Risk analysis failed:`, error);
        modularAnalysis.riskAnalysis = { error: 'Analysis failed' };
      }
    }

    // ✅ STEP 7: Analyze Predictions (if available)
    if (allData.predictions) {
      try {
        await updateProgress(jobId, 'Analyzing predictions...');
        modularAnalysis.predictionsAnalysis = await analyzeDataSource(
          openaiApiKey,
          model,
          symbol,
          'Price Predictions',
          allData.predictions,
          'Analyze price predictions and forecasts. Provide: short_term_outlook, medium_term_outlook, prediction_confidence, key_price_levels.',
          formattedContext // ✅ Pass formatted context for enhanced analysis
        );
        console.log(`✅ Predictions analysis complete`);
      } catch (error) {
        console.error(`❌ Predictions analysis failed:`, error);
        modularAnalysis.predictionsAnalysis = { error: 'Analysis failed' };
      }
    }

    // ✅ STEP 8: Analyze DeFi (if available)
    if (allData.defi) {
      try {
        await updateProgress(jobId, 'Analyzing DeFi metrics...');
        modularAnalysis.defiAnalysis = await analyzeDataSource(
          openaiApiKey,
          model,
          symbol,
          'DeFi Metrics',
          allData.defi,
          'Analyze DeFi protocol metrics and TVL. Provide: tvl_analysis, defi_adoption_trend, protocol_health, defi_opportunities.',
          formattedContext // ✅ Pass formatted context for enhanced analysis
        );
        console.log(`✅ DeFi analysis complete`);
      } catch (error) {
        console.error(`❌ DeFi analysis failed:`, error);
        modularAnalysis.defiAnalysis = { error: 'Analysis failed' };
      }
    }

    // ✅ STEP 9: Generate Executive Summary (combines all insights)
    try {
      await updateProgress(jobId, 'Generating executive summary...');
      
      // Build summary of all analyses
      const analysisSummary = {
        market: modularAnalysis.marketAnalysis || 'Not analyzed',
        technical: modularAnalysis.technicalAnalysis || 'Not analyzed',
        sentiment: modularAnalysis.sentimentAnalysis || 'Not analyzed',
        news: modularAnalysis.newsAnalysis || 'Not analyzed',
        onChain: modularAnalysis.onChainAnalysis || 'Not analyzed',
        risk: modularAnalysis.riskAnalysis || 'Not analyzed',
        predictions: modularAnalysis.predictionsAnalysis || 'Not analyzed',
        defi: modularAnalysis.defiAnalysis || 'Not analyzed'
      };
      
      modularAnalysis.executiveSummary = await generateExecutiveSummary(
        openaiApiKey,
        model,
        symbol,
        analysisSummary,
        formattedContext // ✅ Pass formatted context for enhanced executive summary
      );
      console.log(`✅ Executive summary complete`);
    } catch (error) {
      console.error(`❌ Executive summary failed:`, error);
      modularAnalysis.executiveSummary = { error: 'Summary generation failed' };
    }

    modularAnalysis.processingTime = Date.now() - startTime;
    console.log(`✅ MODULAR analysis completed in ${modularAnalysis.processingTime}ms`);

    // ✅ STORE MODULAR ANALYSIS: Store results with retry logic
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
            JSON.stringify(modularAnalysis),
            'Analysis complete!',
            jobId
          ],
          { timeout: 20000, retries: 1 }
        );
        console.log(`✅ Job ${jobId}: Modular analysis stored, DB connection released`);
        resultsStored = true;
        break;
      } catch (dbError) {
        console.error(`❌ DB store attempt ${dbAttempt}/3 failed:`, dbError);
        if (dbAttempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    if (!resultsStored) {
      throw new Error('Failed to store analysis results in database after 3 attempts');
    }

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`❌ ========================================`);
    console.error(`❌ Job ${jobId} FAILED after ${processingTime}ms`);
    console.error(`❌ Error:`, error);
    console.error(`❌ ========================================`);
    
    let errorMessage = 'Analysis failed';
    
    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message.includes('abort')) {
        errorMessage = 'Analysis timed out';
      } else if (error.message.includes('API key')) {
        errorMessage = 'OpenAI API key issue';
      } else if (error.message.includes('reasoning')) {
        errorMessage = 'OpenAI API parameter error';
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
          { timeout: 10000, retries: 2 } // ✅ FIXED: 10 second timeout, 2 retries
        );
        console.log(`❌ Job ${jobId}: Marked as error, DB connection released`);
        break;
      } catch (dbError) {
        console.error(`❌ DB error update attempt ${dbAttempt}/3 failed:`, dbError);
        if (dbAttempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
  } finally {
    // ✅ CLEANUP: Stop heartbeat interval
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      console.log(`🛑 Heartbeat stopped for job ${jobId}`);
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`🏁 ========================================`);
    console.log(`🏁 Job ${jobId}: Processing ended`);
    console.log(`🏁 Total time: ${totalTime}ms (${(totalTime / 1000).toFixed(1)}s)`);
    console.log(`🏁 End time: ${new Date().toISOString()}`);
    console.log(`🏁 ========================================`);
  }
}

/**
 * Calculate data quality percentage based on available data sources
 * @param allData - Object containing all data sources
 * @returns Percentage of available data (0-100)
 */
function calculateDataQuality(allData: Record<string, any>): number {
  const totalSources = 8; // marketData, technical, sentiment, news, onChain, risk, predictions, defi
  const availableSources = Object.values(allData).filter(v => v !== null && v !== undefined).length;
  return (availableSources / totalSources) * 100;
}

/**
 * Update job progress in database
 */
async function updateProgress(jobId: number, progress: string): Promise<void> {
  try {
    await query(
      'UPDATE ucie_openai_jobs SET progress = $1, updated_at = NOW() WHERE id = $2',
      [progress, jobId],
      { timeout: 10000, retries: 2 } // ✅ FIXED: Increased timeout to 10s, 2 retries
    );
  } catch (error) {
    console.warn(`⚠️ Failed to update progress (non-critical):`, error);
    // Progress update failures are non-critical - job continues processing
  }
}

/**
 * Analyze a single data source with o1-mini
 * Small, fast, focused analysis
 * 
 * ✅ USES o1-mini: OpenAI's reasoning model with Responses API (January 2026)
 * ✅ BULLETPROOF: Uses extractResponseText utility
 * ✅ FAST: Quick analysis for modular approach
 * ✅ FALLBACK: Returns error object instead of throwing on failure
 * ✅ CONTEXT-AWARE: Uses formatted context for comprehensive analysis (December 2025 fix)
 */
async function analyzeDataSource(
  apiKey: string,
  model: string,
  symbol: string,
  dataType: string,
  data: any,
  instructions: string,
  formattedContext?: string // ✅ NEW: Optional formatted context for enhanced analysis
): Promise<any> {
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 [analyzeDataSource] ========================================`);
      console.log(`🔄 [analyzeDataSource] Starting analysis for: ${dataType}`);
      console.log(`🔄 [analyzeDataSource] Symbol: ${symbol}`);
      console.log(`🔄 [analyzeDataSource] Attempt: ${attempt}/${maxRetries}`);
      console.log(`🔄 [analyzeDataSource] Model: ${model}`);
      console.log(`🔄 [analyzeDataSource] API Key present: ${!!apiKey}`);
      console.log(`🔄 [analyzeDataSource] API Key length: ${apiKey?.length || 0}`);
      console.log(`🔄 [analyzeDataSource] ========================================`);
      
      const analysisStart = Date.now();
      
      // ✅ Import OpenAI SDK
      console.log(`🔧 [analyzeDataSource] Importing OpenAI SDK...`);
      const OpenAI = (await import('openai')).default;
      const { extractResponseText, validateResponseText } = await import('../../../../utils/openai');
      console.log(`✅ [analyzeDataSource] OpenAI SDK imported successfully`);
      
      // ✅ Initialize OpenAI client
      console.log(`🔧 [analyzeDataSource] Initializing OpenAI client...`);
      const openai = new OpenAI({
        apiKey: apiKey,
        timeout: 30000, // 30 second timeout per request
        maxRetries: 0 // We handle retries ourselves
      });
      console.log(`✅ [analyzeDataSource] OpenAI client initialized`);
      
      // ✅ FIX: Extract articles array for news analysis
      let dataToAnalyze = data;
      if (dataType === 'News' && data?.articles && Array.isArray(data.articles)) {
        // Pass only the articles array (5-10 articles)
        dataToAnalyze = {
          articles: data.articles,
          totalArticles: data.articles.length,
          sources: data.sources,
          dataQuality: data.dataQuality
        };
        console.log(`📰 Analyzing ${data.articles.length} news articles for ${symbol}`);
      }
      
      // ✅ Build enhanced prompt with formatted context (December 2025 fix)
      // When formatted context is available, include it for comprehensive analysis
      let prompt: string;
      
      if (formattedContext) {
        // Enhanced prompt with full market context
        prompt = `Analyze ${symbol} ${dataType} in the context of current market conditions:

**COMPREHENSIVE MARKET CONTEXT:**
${formattedContext}

**SPECIFIC ${dataType.toUpperCase()} DATA TO ANALYZE:**
${JSON.stringify(dataToAnalyze, null, 2)}

**ANALYSIS INSTRUCTIONS:**
${instructions}

Consider the full market context when analyzing this specific data source.
Respond with valid JSON only.`;
      } else {
        // Fallback to simple prompt (backward compatibility)
        prompt = `Analyze ${symbol} ${dataType}:

${JSON.stringify(dataToAnalyze, null, 2)}

${instructions}

Respond with valid JSON only.`;
      }
      
      // ✅ Call o1-mini with Responses API + low reasoning effort
      // Valid reasoning effort values: "low", "medium", "high"
      console.log(`🚀 [analyzeDataSource] Calling OpenAI Responses API...`);
      console.log(`🚀 [analyzeDataSource] Prompt length: ${prompt.length} characters`);
      
      const reasoningEffort = process.env.REASONING_EFFORT || 'low';
      const completion = await (openai as any).responses.create({
        model: model,
        reasoning: { effort: reasoningEffort },
        input: `You are a cryptocurrency analyst. Analyze ${dataType} and respond with concise JSON.\n\n${prompt}`
      });
      
      const analysisTime = Date.now() - analysisStart;
      console.log(`✅ [analyzeDataSource] OpenAI API call completed in ${analysisTime}ms`);
      console.log(`📊 [analyzeDataSource] Response received:`, JSON.stringify(completion, null, 2).substring(0, 500) + '...');
      
      // ✅ Bulletproof extraction
      console.log(`🔧 [analyzeDataSource] Extracting response text...`);
      const analysisText = extractResponseText(completion, true); // Debug mode
      console.log(`✅ [analyzeDataSource] Response text extracted: ${analysisText.length} characters`);
      
      console.log(`🔧 [analyzeDataSource] Validating response text...`);
      validateResponseText(analysisText, model, completion);
      console.log(`✅ [analyzeDataSource] Response text validated`);
      
      console.log(`🔧 [analyzeDataSource] Parsing JSON...`);
      const parsed = JSON.parse(analysisText);
      console.log(`✅ [analyzeDataSource] JSON parsed successfully`);
      console.log(`✅ [analyzeDataSource] Completed analysis for: ${dataType}`);
      console.log(`✅ [analyzeDataSource] ========================================`);
      
      return parsed;
      
    } catch (error) {
      console.error(`❌ [analyzeDataSource] ========================================`);
      console.error(`❌ [analyzeDataSource] FAILED for ${dataType}`);
      console.error(`❌ [analyzeDataSource] Attempt: ${attempt}/${maxRetries}`);
      console.error(`❌ [analyzeDataSource] Error:`, error);
      console.error(`❌ [analyzeDataSource] Error message:`, error instanceof Error ? error.message : 'Unknown error');
      console.error(`❌ [analyzeDataSource] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
      
      if (error instanceof Error && error.message) {
        console.error(`❌ [analyzeDataSource] Error details:`, JSON.stringify({
          name: error.name,
          message: error.message,
          cause: (error as any).cause
        }, null, 2));
      }
      console.error(`❌ [analyzeDataSource] ========================================`);
      
      if (attempt === maxRetries) {
        console.error(`❌ [analyzeDataSource] MAX RETRIES REACHED - RETURNING ERROR OBJECT`);
        // ✅ FIX: Return error object instead of throwing
        // This allows other analyses to continue even if one fails
        return {
          error: 'Analysis failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          dataType: dataType,
          timestamp: new Date().toISOString()
        };
      }
      
      // Exponential backoff
      const backoffMs = 1000 * attempt;
      console.log(`⏳ [analyzeDataSource] Retrying in ${backoffMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
    }
  }
  
  // This should never be reached, but just in case
  return {
    error: 'Analysis failed after all retries',
    dataType: dataType,
    timestamp: new Date().toISOString()
  };
}

/**
 * Analyze news with comprehensive market context using o1-mini
 * Provides full picture for accurate impact assessment
 * 
 * ✅ USES o1-mini: OpenAI's reasoning model with Responses API (January 2026)
 * ✅ CONTEXT-AWARE: Combines news with market, technical, and sentiment data
 * ✅ FALLBACK: Returns error object instead of throwing on failure
 * ✅ ENHANCED: Uses formatContextForAI() for comprehensive prompts (December 2025 fix)
 */
async function analyzeNewsWithContext(
  apiKey: string,
  model: string,
  symbol: string,
  context: any,
  formattedContext?: string // ✅ NEW: Optional formatted context for enhanced analysis
): Promise<any> {
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📰 Analyzing news with market context (attempt ${attempt}/${maxRetries})...`);
      const analysisStart = Date.now();
      
      // ✅ Import OpenAI SDK
      const OpenAI = (await import('openai')).default;
      const { extractResponseText, validateResponseText } = await import('../../../../utils/openai');
      
      // ✅ Initialize OpenAI client
      const openai = new OpenAI({
        apiKey: apiKey,
        timeout: 30000, // 30 second timeout
        maxRetries: 0 // We handle retries ourselves
      });
      
      // Extract articles array
      const articles = context.news?.articles || [];
      const articleCount = articles.length;
      
      console.log(`📰 Analyzing ${articleCount} news articles with market context...`);
      
      // ✅ Build comprehensive prompt with market context AND formatted context (December 2025 fix)
      let prompt: string;
      
      if (formattedContext) {
        // Enhanced prompt with full comprehensive context from formatContextForAI()
        prompt = `Analyze ${symbol} news articles in the context of current market conditions:

**COMPREHENSIVE MARKET CONTEXT:**
${formattedContext}

**SPECIFIC NEWS CONTEXT:**
- Current Price: ${context.marketContext.currentPrice}
- 24h Change: ${context.marketContext.priceChange24h}
- 24h Volume: ${context.marketContext.volume24h}
- Market Cap: ${context.marketContext.marketCap}

**TECHNICAL CONTEXT:**
- RSI: ${context.technicalContext.rsi}
- MACD: ${context.technicalContext.macd}
- Trend: ${context.technicalContext.trend}

**SENTIMENT CONTEXT:**
- Fear & Greed Index: ${context.sentimentContext.fearGreedIndex}
- Social Sentiment: ${context.sentimentContext.socialSentiment}

**NEWS ARTICLES (${articleCount} total):**
${JSON.stringify(articles, null, 2)}

**INSTRUCTIONS:**
Analyze ALL ${articleCount} news articles and assess their collective market impact.
Use the comprehensive market context to provide deeper insights.

Provide JSON with:
{
  "articlesAnalyzed": ${articleCount},
  "keyHeadlines": ["headline 1", "headline 2", "headline 3"],
  "overallSentiment": "bullish" | "bearish" | "neutral",
  "sentimentScore": <0-100>,
  "marketImpact": "high" | "medium" | "low",
  "impactReasoning": "Why these articles matter given current market conditions",
  "priceImplications": "How news may affect price given technical and sentiment context",
  "keyDevelopments": ["development 1", "development 2"],
  "correlationWithMarket": "How news aligns or conflicts with current market state",
  "tradingImplications": "What traders should watch for"
}

Consider:
- How news aligns with current price action
- Whether news confirms or contradicts technical signals
- If sentiment matches or diverges from social metrics
- Potential catalysts or risks identified in articles

Respond with valid JSON only.`;
      } else {
        // Fallback to original prompt (backward compatibility)
        prompt = `Analyze ${symbol} news articles in the context of current market conditions:

**MARKET CONTEXT:**
- Current Price: ${context.marketContext.currentPrice}
- 24h Change: ${context.marketContext.priceChange24h}
- 24h Volume: ${context.marketContext.volume24h}
- Market Cap: ${context.marketContext.marketCap}

**TECHNICAL CONTEXT:**
- RSI: ${context.technicalContext.rsi}
- MACD: ${context.technicalContext.macd}
- Trend: ${context.technicalContext.trend}

**SENTIMENT CONTEXT:**
- Fear & Greed Index: ${context.sentimentContext.fearGreedIndex}
- Social Sentiment: ${context.sentimentContext.socialSentiment}

**NEWS ARTICLES (${articleCount} total):**
${JSON.stringify(articles, null, 2)}

**INSTRUCTIONS:**
Analyze ALL ${articleCount} news articles and assess their collective market impact.

Provide JSON with:
{
  "articlesAnalyzed": ${articleCount},
  "keyHeadlines": ["headline 1", "headline 2", "headline 3"],
  "overallSentiment": "bullish" | "bearish" | "neutral",
  "sentimentScore": <0-100>,
  "marketImpact": "high" | "medium" | "low",
  "impactReasoning": "Why these articles matter given current market conditions",
  "priceImplications": "How news may affect price given technical and sentiment context",
  "keyDevelopments": ["development 1", "development 2"],
  "correlationWithMarket": "How news aligns or conflicts with current market state",
  "tradingImplications": "What traders should watch for"
}

Consider:
- How news aligns with current price action
- Whether news confirms or contradicts technical signals
- If sentiment matches or diverges from social metrics
- Potential catalysts or risks identified in articles

Respond with valid JSON only.`;
      }
      
      // ✅ Call o1-mini with Responses API + low reasoning effort
      // Valid reasoning effort values: "low", "medium", "high"
      const reasoningEffort = process.env.REASONING_EFFORT || 'low';
      const completion = await (openai as any).responses.create({
        model: model,
        reasoning: { effort: reasoningEffort },
        input: `You are a cryptocurrency news analyst. Analyze news articles in the context of current market conditions and provide comprehensive impact assessment. Respond with JSON only.\n\n${prompt}`
      });
      
      const analysisTime = Date.now() - analysisStart;
      console.log(`✅ News analysis completed in ${analysisTime}ms`);
      
      // ✅ Bulletproof extraction
      const analysisText = extractResponseText(completion, true); // Debug mode
      validateResponseText(analysisText, model, completion);
      
      return JSON.parse(analysisText);
      
    } catch (error) {
      console.error(`❌ News analysis attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        console.error(`❌ News analysis MAX RETRIES REACHED - RETURNING ERROR OBJECT`);
        // ✅ FIX: Return error object instead of throwing
        return {
          error: 'News analysis failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        };
      }
      
      // Exponential backoff
      const backoffMs = 1000 * attempt;
      console.log(`⏳ Retrying in ${backoffMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
    }
  }
  
  // This should never be reached, but just in case
  return {
    error: 'News analysis failed after all retries',
    timestamp: new Date().toISOString()
  };
}

/**
 * Generate executive summary combining all analyses using o1-mini
 * Synthesizes all modular analyses into comprehensive overview
 * 
 * ✅ USES o1-mini: OpenAI's reasoning model with Responses API (January 2026)
 * ✅ BULLETPROOF: Uses extractResponseText utility
 * ✅ COMPREHENSIVE: Combines all 8 data source analyses
 * ✅ FALLBACK: Returns error object instead of throwing on failure
 * ✅ CONTEXT-AWARE: Uses formatContextForAI() for comprehensive prompts (December 2025 fix)
 */
async function generateExecutiveSummary(
  apiKey: string,
  model: string,
  symbol: string,
  analysisSummary: any,
  formattedContext?: string // ✅ NEW: Optional formatted context for enhanced analysis
): Promise<any> {
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📊 Generating executive summary (attempt ${attempt}/${maxRetries})...`);
      const summaryStart = Date.now();
      
      // ✅ Import OpenAI SDK
      const OpenAI = (await import('openai')).default;
      const { extractResponseText, validateResponseText } = await import('../../../../utils/openai');
      
      // ✅ Initialize OpenAI client
      const openai = new OpenAI({
        apiKey: apiKey,
        timeout: 30000, // 30 second timeout
        maxRetries: 0 // We handle retries ourselves
      });
      
      // ✅ Build comprehensive prompt combining all analyses AND formatted context (December 2025 fix)
      let prompt: string;
      
      if (formattedContext) {
        // Enhanced prompt with full comprehensive context from formatContextForAI()
        prompt = `Generate executive summary for ${symbol} based on comprehensive market context and modular analyses:

**COMPREHENSIVE MARKET CONTEXT:**
${formattedContext}

**MODULAR ANALYSES RESULTS:**
${JSON.stringify(analysisSummary, null, 2)}

Provide JSON with:
{
  "summary": "2-3 paragraph executive summary synthesizing all analyses with comprehensive market context",
  "confidence": 85,
  "recommendation": "Buy|Hold|Sell with detailed reasoning based on all available data",
  "key_insights": ["insight 1", "insight 2", "insight 3"],
  "market_outlook": "24-48 hour outlook based on all data sources",
  "risk_factors": ["risk 1", "risk 2"],
  "opportunities": ["opportunity 1", "opportunity 2"],
  "data_quality_assessment": "Assessment of data completeness and reliability"
}

Consider:
- Market data trends and price action
- Technical indicator signals
- Social sentiment and Fear & Greed
- News impact and developments
- On-chain whale activity
- Risk factors and volatility
- Price predictions and forecasts
- DeFi adoption and TVL trends
- Overall data quality and confidence level

Synthesize all analyses into cohesive, actionable summary.

Respond with valid JSON only.`;
      } else {
        // Fallback to original prompt (backward compatibility)
        prompt = `Generate executive summary for ${symbol} based on these analyses:

${JSON.stringify(analysisSummary, null, 2)}

Provide JSON with:
{
  "summary": "2-3 paragraph executive summary synthesizing all analyses",
  "confidence": 85,
  "recommendation": "Buy|Hold|Sell with detailed reasoning",
  "key_insights": ["insight 1", "insight 2", "insight 3"],
  "market_outlook": "24-48 hour outlook based on all data",
  "risk_factors": ["risk 1", "risk 2"],
  "opportunities": ["opportunity 1", "opportunity 2"]
}

Consider:
- Market data trends and price action
- Technical indicator signals
- Social sentiment and Fear & Greed
- News impact and developments
- On-chain whale activity
- Risk factors and volatility
- Price predictions and forecasts
- DeFi adoption and TVL trends

Synthesize all analyses into cohesive, actionable summary.

Respond with valid JSON only.`;
      }
      
      // ✅ Call o1-mini with Responses API + low reasoning effort
      // Valid reasoning effort values: "low", "medium", "high"
      const reasoningEffort = process.env.REASONING_EFFORT || 'low';
      const completion = await (openai as any).responses.create({
        model: model,
        reasoning: { effort: reasoningEffort },
        input: `You are a cryptocurrency analyst. Synthesize all analyses into comprehensive executive summary. Respond with JSON only.\n\n${prompt}`
      });
      
      const summaryTime = Date.now() - summaryStart;
      console.log(`✅ Executive summary completed in ${summaryTime}ms`);
      
      // ✅ Bulletproof extraction
      const summaryText = extractResponseText(completion, true); // Debug mode
      validateResponseText(summaryText, model, completion);
      
      return JSON.parse(summaryText);
      
    } catch (error) {
      console.error(`❌ Executive summary attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        console.error(`❌ Executive summary MAX RETRIES REACHED - RETURNING ERROR OBJECT`);
        // ✅ FIX: Return error object instead of throwing
        return {
          error: 'Executive summary generation failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          summary: 'Unable to generate executive summary due to API error',
          timestamp: new Date().toISOString()
        };
      }
      
      // Exponential backoff
      const backoffMs = 1000 * attempt;
      console.log(`⏳ Retrying in ${backoffMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
    }
  }
  
  // This should never be reached, but just in case
  return {
    error: 'Executive summary failed after all retries',
    summary: 'Unable to generate executive summary',
    timestamp: new Date().toISOString()
  };
}

export default withOptionalAuth(handler);
