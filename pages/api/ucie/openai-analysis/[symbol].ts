/**
 * UCIE GPT-5.1 Analysis Endpoint
 * 
 * Generates comprehensive analysis using GPT-5.1
 * Returns consensus, executive summary, and insights
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { extractResponseText, validateResponseText } from '../../../../utils/openai';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  defaultHeaders: {
    'OpenAI-Beta': 'responses=v1'
  }
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { symbol, collectedData, forceRefresh } = req.body;

    // ✅ ENHANCED VALIDATION
    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid symbol parameter'
      });
    }

    if (!collectedData || typeof collectedData !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid collectedData parameter'
      });
    }

    // ✅ LOG RAW INPUT for debugging
    console.log(`🚀 Starting GPT-5.1 analysis for ${symbol}${forceRefresh ? ' (FORCE REFRESH)' : ''}...`);
    console.log(`📦 Raw collectedData received:`, {
      type: typeof collectedData,
      isArray: Array.isArray(collectedData),
      keys: Object.keys(collectedData),
      hasData: !!collectedData.data,
      hasSuccess: !!collectedData.success,
      marketDataType: typeof collectedData.marketData,
      technicalType: typeof collectedData.technical
    });

    // ============================================================================
    // DATA VALIDATION AND EXTRACTION
    // ============================================================================
    
    console.log(`📊 Received collectedData structure:`, {
      hasMarketData: !!collectedData.marketData,
      hasTechnical: !!collectedData.technical,
      hasSentiment: !!collectedData.sentiment,
      hasNews: !!collectedData.news,
      hasRisk: !!collectedData.risk,
      hasOnChain: !!collectedData.onChain,
      hasDefi: !!collectedData.defi
    });
    
    // ✅ CRITICAL FIX: Deep extraction function to handle all nested structures
    const extractData = (source: any, depth: number = 0): any => {
      if (!source || depth > 5) return null; // Prevent infinite recursion
      
      // If it's a primitive, return it
      if (typeof source !== 'object') return source;
      
      // If it's an array, return it as-is
      if (Array.isArray(source)) return source;
      
      // If it has success=true and data property, extract data recursively
      if (source.success === true && source.data !== undefined) {
        return extractData(source.data, depth + 1);
      }
      
      // If it has success=true but no data property, remove success and return rest
      if (source.success === true) {
        const { success, ...rest } = source;
        return rest;
      }
      
      // Otherwise return source as-is
      return source;
    };
    
    // Extract all data sources with deep unwrapping
    const marketDataRaw = extractData(collectedData.marketData);
    const technicalRaw = extractData(collectedData.technical);
    const sentimentRaw = extractData(collectedData.sentiment);
    const newsRaw = extractData(collectedData.news);
    const riskRaw = extractData(collectedData.risk);
    const onChainRaw = extractData(collectedData.onChain);
    const defiRaw = extractData(collectedData.defi);
    
    // ✅ DETAILED LOGGING: Log actual data structure to debug [Object object] issue
    console.log(`📊 Extracted data structures (detailed):`, {
      marketData: marketDataRaw ? {
        keys: Object.keys(marketDataRaw).slice(0, 10),
        price: marketDataRaw.price,
        change24h: marketDataRaw.change24h,
        hasNestedSuccess: marketDataRaw.success !== undefined
      } : null,
      technical: technicalRaw ? {
        keys: Object.keys(technicalRaw).slice(0, 10),
        rsi: technicalRaw.rsi,
        hasNestedSuccess: technicalRaw.success !== undefined
      } : null,
      sentiment: sentimentRaw ? {
        keys: Object.keys(sentimentRaw).slice(0, 10),
        overallScore: sentimentRaw.overallScore,
        hasNestedSuccess: sentimentRaw.success !== undefined
      } : null,
      news: newsRaw ? {
        keys: Object.keys(newsRaw).slice(0, 10),
        articlesCount: newsRaw.articles?.length,
        hasNestedSuccess: newsRaw.success !== undefined
      } : null,
      risk: riskRaw ? {
        keys: Object.keys(riskRaw).slice(0, 10),
        overallScore: riskRaw.overallScore,
        hasNestedSuccess: riskRaw.success !== undefined
      } : null
    });
    
    // ✅ FIXED: Calculate which APIs are actually working by checking for real data with CORRECT field paths
    const availableAPIs = [];
    
    // Check each data source for actual content (not just existence)
    if (marketDataRaw && typeof marketDataRaw === 'object' && Object.keys(marketDataRaw).length > 0 && marketDataRaw.priceAggregation?.averagePrice) {
      availableAPIs.push('Market Data');
      console.log(`   ✅ Market Data available: price=${marketDataRaw.priceAggregation.averagePrice}`);
    }
    if (technicalRaw && typeof technicalRaw === 'object' && Object.keys(technicalRaw).length > 0 && technicalRaw.rsi) {
      availableAPIs.push('Technical Analysis');
      console.log(`   ✅ Technical available: rsi=${technicalRaw.rsi?.value}`);
    }
    if (sentimentRaw && typeof sentimentRaw === 'object' && Object.keys(sentimentRaw).length > 0 && sentimentRaw.overallScore !== undefined) {
      availableAPIs.push('Sentiment Analysis');
      console.log(`   ✅ Sentiment available: score=${sentimentRaw.overallScore}`);
    }
    if (newsRaw && typeof newsRaw === 'object' && Object.keys(newsRaw).length > 0 && newsRaw.articles) {
      availableAPIs.push('News');
      console.log(`   ✅ News available: ${newsRaw.articles.length} articles`);
    }
    if (riskRaw && typeof riskRaw === 'object' && Object.keys(riskRaw).length > 0 && riskRaw.riskScore?.overall !== undefined) {
      availableAPIs.push('Risk Assessment');
      console.log(`   ✅ Risk available: score=${riskRaw.riskScore.overall}`);
    }
    
    // On-Chain is optional (only for BTC/ETH)
    if (onChainRaw && typeof onChainRaw === 'object' && Object.keys(onChainRaw).length > 0) {
      availableAPIs.push('On-Chain Data');
      console.log(`   ✅ On-Chain available`);
    }
    
    const totalAPIs = 5; // Core APIs: Market, Technical, Sentiment, News, Risk
    const workingAPIs = availableAPIs.filter(api => api !== 'On-Chain Data').length;
    const dataQuality = Math.round((workingAPIs / totalAPIs) * 100);
    
    console.log(`📊 Data Quality Check: ${workingAPIs}/${totalAPIs} core APIs working (${dataQuality}%)`);
    console.log(`   Available APIs: ${availableAPIs.join(', ')}`);
    
    // ✅ SAFETY FUNCTION: Convert values to strings safely (prevent [Object object])
    const safeValue = (value: any): string => {
      if (value === null || value === undefined) return 'N/A';
      if (typeof value === 'number') return value.toLocaleString();
      if (typeof value === 'string') return value;
      if (typeof value === 'boolean') return value ? 'Yes' : 'No';
      if (typeof value === 'object') {
        // If it's an object, try to extract meaningful data
        if (value.value !== undefined) return safeValue(value.value);
        if (value.signal !== undefined) return safeValue(value.signal);
        // Last resort: JSON stringify (but this should be avoided)
        return JSON.stringify(value);
      }
      return String(value);
    };
    
    // ✅ CRITICAL FIX: Extract from ACTUAL stored structure
    const marketSummary = marketDataRaw ? {
      price: marketDataRaw.priceAggregation?.averagePrice, // ✅ FIXED: Use priceAggregation.averagePrice
      change24h: marketDataRaw.priceAggregation?.averageChange24h, // ✅ FIXED: Use priceAggregation.averageChange24h
      volume24h: marketDataRaw.priceAggregation?.totalVolume24h, // ✅ FIXED: Use priceAggregation.totalVolume24h
      marketCap: marketDataRaw.marketData?.marketCap, // ✅ FIXED: Use marketData.marketCap (nested)
      dominance: marketDataRaw.marketData?.dominance, // ✅ FIXED: Use marketData.dominance (nested)
      source: marketDataRaw.sources?.join(', ') || 'Multiple' // ✅ FIXED: sources is an array
    } : null;
    
    // ✅ LOG MARKET SUMMARY to verify no [Object object]
    console.log(`📊 Market summary prepared:`, marketSummary);
    
    const technicalSummary = technicalRaw ? {
      rsi: technicalRaw.rsi,
      macd: technicalRaw.macd,
      trend: technicalRaw.trend,
      support: technicalRaw.support,
      resistance: technicalRaw.resistance,
      multiTimeframe: technicalRaw.multiTimeframeConsensus
    } : null;
    
    const sentimentSummary = sentimentRaw ? {
      overallScore: sentimentRaw.overallScore,
      sentiment: sentimentRaw.sentiment,
      fearGreedIndex: sentimentRaw.fearGreedIndex,
      lunarCrush: sentimentRaw.lunarCrush ? {
        socialScore: sentimentRaw.lunarCrush.socialScore,
        galaxyScore: sentimentRaw.lunarCrush.galaxyScore,
        sentimentScore: sentimentRaw.lunarCrush.sentimentScore,
        socialVolume: sentimentRaw.lunarCrush.socialVolume,
        altRank: sentimentRaw.lunarCrush.altRank
      } : null,
      reddit: sentimentRaw.reddit,
      twitter: sentimentRaw.twitter
    } : null;
    
    const newsSummary = newsRaw?.articles ? 
      newsRaw.articles.slice(0, 5).map((article: any) => ({
        title: article.title,
        sentiment: article.sentiment,
        source: article.source,
        publishedAt: article.publishedAt
      })) : null;
    
    // ✅ CRITICAL FIX: Extract from ACTUAL stored structure
    const riskSummary = riskRaw ? {
      overallScore: riskRaw.riskScore?.overall, // ✅ FIXED: Use riskScore.overall (not overallScore)
      riskLevel: riskRaw.riskScore?.category, // ✅ FIXED: Use riskScore.category (not riskLevel)
      volatility: riskRaw.volatilityMetrics, // ✅ FIXED: Use volatilityMetrics object
      maxDrawdown: riskRaw.maxDrawdownMetrics, // ✅ FIXED: Use maxDrawdownMetrics object
      correlations: riskRaw.correlationMetrics // ✅ FIXED: Use correlationMetrics object
    } : null;
    
    const onChainSummary = onChainRaw ? {
      whaleActivity: onChainRaw.whaleActivity,
      exchangeFlows: onChainRaw.exchangeFlows,
      holderConcentration: onChainRaw.holderConcentration,
      networkActivity: onChainRaw.networkActivity
    } : null;
    
    // Build structured prompt
    const prompt = `You are an expert cryptocurrency market analyst with access to comprehensive real-time data from multiple sources. Analyze ${symbol} and provide actionable insights.

# DATA QUALITY REPORT
- **Overall Quality**: ${dataQuality}% (${workingAPIs}/${totalAPIs} core APIs working)
- **Available Sources**: ${availableAPIs.join(', ')}
- **Analysis Timestamp**: ${new Date().toISOString()}

# MARKET DATA ${marketSummary ? '✅' : '❌'}
${marketSummary ? `
- **Current Price**: $${marketSummary.price?.toLocaleString() || 'N/A'}
- **24h Change**: ${marketSummary.change24h || 'N/A'}%
- **24h Volume**: $${marketSummary.volume24h?.toLocaleString() || 'N/A'}
- **Market Cap**: $${marketSummary.marketCap?.toLocaleString() || 'N/A'}
- **Market Dominance**: ${marketSummary.dominance || 'N/A'}%
- **Data Source**: ${marketSummary.source || 'Multiple'}
` : 'Not available - API failed or data not cached'}

# TECHNICAL ANALYSIS ${technicalSummary ? '✅' : '❌'}
${technicalSummary ? `
- **RSI (14)**: ${technicalSummary.rsi?.value || 'N/A'} - ${technicalSummary.rsi?.signal || 'N/A'}
- **MACD**: ${technicalSummary.macd?.signal || 'N/A'} (Histogram: ${technicalSummary.macd?.histogram || 'N/A'})
- **Trend**: ${technicalSummary.trend || 'N/A'}
- **Support Levels**: ${technicalSummary.support?.join(', ') || 'N/A'}
- **Resistance Levels**: ${technicalSummary.resistance?.join(', ') || 'N/A'}
- **Multi-Timeframe Consensus**: ${technicalSummary.multiTimeframe?.overall || 'N/A'} (${technicalSummary.multiTimeframe?.bullish || 0} bullish, ${technicalSummary.multiTimeframe?.bearish || 0} bearish)
` : 'Not available - API failed or data not cached'}

# SENTIMENT ANALYSIS ${sentimentSummary ? '✅' : '❌'}
${sentimentSummary ? `
- **Overall Sentiment**: ${sentimentSummary.overallScore || 'N/A'}/100 (${sentimentSummary.sentiment || 'neutral'})
- **Fear & Greed Index**: ${sentimentSummary.fearGreedIndex?.value || 'N/A'}/100 (${sentimentSummary.fearGreedIndex?.classification || 'N/A'})
${sentimentSummary.lunarCrush ? `
- **LunarCrush Metrics**:
  - Social Score: ${sentimentSummary.lunarCrush.socialScore || 'N/A'}/100
  - Galaxy Score: ${sentimentSummary.lunarCrush.galaxyScore || 'N/A'}/100
  - Sentiment Score: ${sentimentSummary.lunarCrush.sentimentScore || 'N/A'}/100
  - Social Volume: ${sentimentSummary.lunarCrush.socialVolume?.toLocaleString() || 'N/A'}
  - Alt Rank: #${sentimentSummary.lunarCrush.altRank || 'N/A'}
` : ''}
${sentimentSummary.reddit ? `- **Reddit**: ${sentimentSummary.reddit.mentions24h || 'N/A'} mentions, ${sentimentSummary.reddit.sentiment || 'N/A'}/100 sentiment` : ''}
${sentimentSummary.twitter ? `- **Twitter**: ${sentimentSummary.twitter.volume?.toLocaleString() || 'N/A'} tweets, ${sentimentSummary.twitter.sentiment || 'N/A'}/100 sentiment` : ''}
` : 'Not available - API failed or data not cached'}

# NEWS HEADLINES ${newsSummary ? '✅' : '❌'}
${newsSummary ? newsSummary.map((article: any, i: number) => 
  `${i + 1}. **${article.title}** (${article.sentiment || 'neutral'}) - ${article.source}`
).join('\n') : 'Not available - API failed or data not cached'}

# RISK ASSESSMENT ${riskSummary ? '✅' : '❌'}
${riskSummary ? `
- **Overall Risk Score**: ${riskSummary.overallScore || 'N/A'}/100 (${riskSummary.riskLevel || 'N/A'})
- **30-Day Volatility**: ${riskSummary.volatility?.annualized30d || 'N/A'}%
- **Max Drawdown**: ${riskSummary.maxDrawdown?.maxDrawdown || 'N/A'}%
- **BTC Correlation**: ${riskSummary.correlations?.btc || 'N/A'}
- **ETH Correlation**: ${riskSummary.correlations?.eth || 'N/A'}
` : 'Not available - API failed or data not cached'}

# ON-CHAIN METRICS ${onChainSummary ? '✅' : '❌'}
${onChainSummary ? `
- **Whale Activity**: ${onChainSummary.whaleActivity || 'N/A'}
- **Exchange Flows**: ${onChainSummary.exchangeFlows?.trend || 'N/A'} (Net: ${onChainSummary.exchangeFlows?.netFlow?.toLocaleString() || 'N/A'})
- **Holder Distribution**: ${onChainSummary.holderConcentration?.distributionScore || 'N/A'}/100 (Top 10: ${onChainSummary.holderConcentration?.top10Percentage || 'N/A'}%)
- **Network Activity**: ${onChainSummary.networkActivity?.trend || 'N/A'}
` : 'Not available - Only available for BTC/ETH or API failed'}

---

# ANALYSIS INSTRUCTIONS

You must provide a comprehensive analysis in **STRICT JSON FORMAT** with the following structure:

\`\`\`json
{
  "consensus": {
    "overallScore": <number 0-100>,
    "recommendation": "<Buy|Hold|Sell>",
    "confidence": <number 0-100>,
    "reasoning": "<2-3 sentence explanation>"
  },
  "executiveSummary": {
    "oneLineSummary": "<Single sentence capturing the current market state>",
    "topFindings": [
      "<Key finding 1 with specific data>",
      "<Key finding 2 with specific data>",
      "<Key finding 3 with specific data>"
    ],
    "opportunities": [
      "<Specific opportunity 1>",
      "<Specific opportunity 2>"
    ],
    "risks": [
      "<Specific risk 1>",
      "<Specific risk 2>"
    ]
  },
  "marketOutlook": "<2-3 paragraph analysis of 24-48 hour outlook based on available data>",
  "technicalSummary": "<2-3 paragraph summary of technical indicators and what they suggest>",
  "sentimentSummary": "<2-3 paragraph summary of social sentiment and market psychology>"
}
\`\`\`

# CRITICAL REQUIREMENTS

1. **Use ONLY the data provided above** - Do not invent or assume missing data
2. **Be specific** - Cite actual numbers and metrics from the data
3. **Data Quality Accuracy** - Report exactly "${dataQuality}% data quality with ${workingAPIs}/${totalAPIs} APIs working"
4. **Missing Data** - If a section shows "Not available", acknowledge it but don't let it stop your analysis
5. **Focus on Available Data** - Provide deep insights from the ${workingAPIs} working sources
6. **Actionable Insights** - Every finding should be backed by specific data points
7. **JSON Only** - Return ONLY valid JSON, no markdown formatting, no explanations outside JSON

# EXAMPLE OUTPUT STRUCTURE

\`\`\`json
{
  "consensus": {
    "overallScore": 72,
    "recommendation": "Hold",
    "confidence": 85,
    "reasoning": "Technical indicators show neutral momentum with RSI at 52, while sentiment remains positive at 68/100. Market structure suggests consolidation before next move."
  },
  "executiveSummary": {
    "oneLineSummary": "BTC consolidating at $95,000 with neutral technical signals and positive sentiment, awaiting catalyst for next directional move.",
    "topFindings": [
      "RSI at 52 indicates neutral momentum, neither overbought nor oversold",
      "Social sentiment strong at 68/100 with Fear & Greed at 65 (Greed)",
      "24h volume of $45B suggests healthy market participation"
    ],
    "opportunities": [
      "Support at $93,500 provides good entry for long positions",
      "Positive sentiment and social volume trending up"
    ],
    "risks": [
      "Resistance at $97,000 may cap upside in short term",
      "30-day volatility at 3.2% suggests potential for sharp moves"
    ]
  },
  "marketOutlook": "Bitcoin is currently trading at $95,000...",
  "technicalSummary": "Technical indicators present a neutral picture...",
  "sentimentSummary": "Market sentiment remains constructive..."
}
\`\`\`

Now analyze ${symbol} and return ONLY the JSON response.`;

    console.log(`📡 Calling GPT-5.1 with medium reasoning...`);
    const startTime = Date.now();

    const completion = await openai.chat.completions.create({
      model: 'gpt-5.1', // ✅ Using GPT-5.1 for enhanced reasoning
      messages: [
        { 
          role: 'system', 
          content: `You are an expert cryptocurrency market analyst with 10+ years of experience in technical analysis, on-chain metrics, and market sentiment analysis.

Your analysis style:
- Data-driven and specific (always cite actual numbers)
- Balanced and objective (acknowledge both bullish and bearish signals)
- Actionable (provide clear recommendations with reasoning)
- Professional (use industry-standard terminology)

Output format:
- Return ONLY valid JSON (no markdown, no code blocks, no explanations)
- Follow the exact schema provided in the prompt
- Use proper JSON syntax (double quotes, no trailing commas)
- Ensure all required fields are present

Quality standards:
- Every finding must be backed by specific data from the provided sources
- Acknowledge data quality and missing sources
- Don't invent data or make assumptions beyond what's provided
- Be honest about confidence levels based on available data`
        },
        { role: 'user', content: prompt }
      ],
      reasoning: {
        effort: 'medium' // Balanced speed and quality for UCIE analysis
      },
      temperature: 0.7, // Balanced creativity and consistency
      max_tokens: 8000, // Increased for comprehensive analysis with reasoning
    });

    const duration = Date.now() - startTime;
    console.log(`✅ GPT-5.1 responded in ${duration}ms`);

    const responseText = extractResponseText(completion, true);
    validateResponseText(responseText, 'gpt-5.1', completion);

    console.log(`✅ Got GPT-5.1 response text (${responseText.length} chars)`);
    console.log(`🧠 Reasoning tokens used: ${completion.usage?.reasoning_tokens || 0}`);

    let analysis: any;
    try {
      analysis = JSON.parse(responseText);
      console.log(`✅ Direct JSON parse succeeded`);
    } catch (parseError) {
      console.warn(`⚠️ Initial JSON parse failed, engaging cleanup...`);
      
      let cleanedText = responseText.trim()
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
    }
    
    if (!analysis || typeof analysis !== 'object') {
      throw new Error('Parsed analysis is not a valid object');
    }
    
    console.log(`✅ Analysis validated, keys:`, Object.keys(analysis).join(', '));

    // ============================================================================
    // STORE ANALYSIS IN SUPABASE DATABASE
    // ============================================================================
    console.log(`💾 Storing analysis in Supabase database...`);
    
    try {
      const { setCachedAnalysis } = await import('../../../../lib/ucie/cacheUtils');
      
      const analysisData = {
        analysis,
        dataQuality: {
          percentage: dataQuality,
          workingAPIs: workingAPIs,
          totalAPIs: totalAPIs,
          available: availableAPIs
        },
        timestamp: new Date().toISOString(),
        version: '2.1-fixed-extraction-and-storage'
      };
      
      console.log(`💾 Preparing to cache analysis:`, {
        symbol,
        type: 'gpt-analysis',
        dataSize: JSON.stringify(analysisData).length,
        ttl: 3600,
        quality: dataQuality
      });
      
      // Cache for 1 hour (3600 seconds)
      await setCachedAnalysis(
        symbol,
        'gpt-analysis',
        analysisData,
        3600,
        dataQuality
      );
      
      console.log(`✅ Analysis successfully stored in Supabase database`);
      
      // ✅ VERIFY storage by reading it back
      const { getCachedAnalysis } = await import('../../../../lib/ucie/cacheUtils');
      const verification = await getCachedAnalysis(symbol, 'gpt-analysis');
      
      if (verification) {
        console.log(`✅ Storage verified: Analysis can be read back from database`);
      } else {
        console.error(`❌ Storage verification FAILED: Analysis not found in database after write`);
        throw new Error('Database storage verification failed');
      }
      
    } catch (cacheError) {
      console.error(`❌ CRITICAL: Failed to cache analysis:`, cacheError);
      console.error(`   Error details:`, {
        name: cacheError instanceof Error ? cacheError.name : 'Unknown',
        message: cacheError instanceof Error ? cacheError.message : String(cacheError),
        stack: cacheError instanceof Error ? cacheError.stack : undefined
      });
      
      // ✅ CRITICAL FIX: Make storage failures FATAL
      // If we can't store the analysis, the user won't be able to see it later
      throw new Error(`Failed to store analysis in database: ${cacheError instanceof Error ? cacheError.message : 'Unknown error'}`);
    }

    return res.status(200).json({
      success: true,
      analysis,
      dataQuality: {
        percentage: dataQuality,
        workingAPIs: workingAPIs,
        totalAPIs: totalAPIs,
        available: availableAPIs
      },
      timestamp: new Date().toISOString(),
      version: '2.0-fixed' // ✅ Version marker to identify new analysis logic
    });

  } catch (error) {
    console.error('❌ GPT-5.1 analysis error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Analysis failed'
    });
  }
}

export const config = {
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '2mb',
    },
  },
  maxDuration: 300,
};
